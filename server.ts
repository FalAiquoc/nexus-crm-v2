import express from "express";
import compression from "compression";
import path from "path";
import db, { initializeDatabase, isSimulatedMode } from "./server/db";
import { comparePassword, generateToken, verifyToken } from "./server/auth";
import bcrypt from "bcryptjs";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { evolutionService } from "./server/services/evolution.service";
import { automationEngine } from "./server/services/automation.engine";

const apiKey = process.env.VITE_GEMINI_API_KEY || "";
const client = new GoogleGenAI({ apiKey });

// Configura serviço Evolution
evolutionService.configure(
  process.env.EVOLUTION_API_URL,
  process.env.EVOLUTION_GLOBAL_API_KEY
);

async function startServer() {
  // Ensure DB is ready
  await initializeDatabase();

  // Executa Migrações Internas (Blacklist e Tags)
  await runAutoMigrations();

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Compressão Gzip/Brotli para todos os responses (~70% redução no transfer)
  app.use(compression());

  app.use(express.json());

  // ==========================================
  // AUTH ROUTES
  // ==========================================
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`🔐 Tentativa de login: ${email}`);
    try {
      // Busca usuário (usa o helper .get que já lida com mock ou real)
      const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(email);

      if (!user) {
        console.warn(`❌ Usuário não encontrado: ${email}`);
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      // No modo simulado, permitimos o login para qualquer senha
      if (!isSimulatedMode) {
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
          console.warn(`❌ Senha inválida para: ${email}`);
          return res.status(401).json({ error: "Credenciais inválidas" });
        }
      } else {
        console.log(`🧪 [SIMULADO] Login liberado para: ${email}`);
      }

      const token = generateToken(user.id);
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspace_niche: user.workspace_niche || 'general',
          subscription_tier: user.subscription_tier || 'starter'
        }
      });
    } catch (error) {
      console.error("🔥 Erro Crítico no Login:", error);
      res.status(500).json({ error: "Erro interno no servidor de autenticação" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    console.log(`📧 [SIMULADO] Recuperação de senha solicitada para: ${email}`);
    // Simula envio de e-mail (integração real fica para depois)
    res.json({ success: true, message: "Link de recuperação enviado com sucesso!" });
  });

  app.post("/api/auth/request-access", async (req, res) => {
    const { name, email, business } = req.body;
    console.log(`🆕 Solicitação de acesso recebida: ${name} (${email}) - ${business}`);
    try {
      const id = Math.random().toString(36).substr(2, 9);
      await db.prepare("INSERT INTO access_requests (id, name, email, business) VALUES ($1, $2, $3, $4)").run(id, name, email, business);
      res.json({ success: true, message: "Solicitação enviada! Entraremos em contato em breve." });
    } catch (error) {
      console.error("Erro ao salvar solicitação:", error);
      res.status(500).json({ error: "Erro ao processar solicitação" });
    }
  });

  // Middleware de Autenticação
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Token inválido" });
    }

    req.userId = decoded.userId;
    next();
  };

  // Middleware Administrativo
  const adminOnly = async (req: any, res: any, next: any) => {
    try {
      const user = await db.prepare("SELECT role FROM users WHERE id = $1").get(req.userId);
      console.log(`🛡️ [ADMIN_CHECK] Perfil: ${user?.role} | ID: ${req.userId}`);
      if (user && user.role === 'admin') {
        return next();
      }
      console.warn(`⛔ [ADMIN_DENY] Acesso negado para ID: ${req.userId}`);
      res.status(403).json({ error: "Acesso restrito a administradores" });
    } catch (error) {
      console.error("🔥 [ADMIN_ERROR] Erro na verificação:", error);
      res.status(500).json({ error: "Erro na verificação de permissão" });
    }
  };

  app.get("/api/auth/me", authenticate, async (req: any, res) => {
    try {
      const user = await db.prepare("SELECT id, name, email, role, workspace_niche, subscription_tier FROM users WHERE id = $1").get(req.userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      // Garantir defaults para usuários legados sem as colunas preenchidas
      user.workspace_niche = user.workspace_niche || 'general';
      user.subscription_tier = user.subscription_tier || 'starter';
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Erro no servidor" });
    }
  });

  // ==========================================
  // API ROUTES
  // ==========================================

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Nexus CRM API is running" });
  });

  // Admin: Gestão de Onboarding
  app.get("/api/admin/requests", authenticate, adminOnly, async (req, res) => {
    try {
      const requests = await db.prepare("SELECT * FROM access_requests ORDER BY created_at DESC").all();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Falha ao buscar solicitações" });
    }
  });

  // Usuários API
  app.get("/api/users", authenticate, adminOnly, async (req, res) => {
    try {
      const users = await db.prepare("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC").all();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Falha ao buscar usuários" });
    }
  });

  app.post("/api/users", authenticate, adminOnly, async (req, res) => {
    const { name, email, password, role, status } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const hashedPassword = await bcrypt.hash(password || 'nexus123', 10);
      await db.prepare("INSERT INTO users (id, name, email, password, role, status) VALUES ($1, $2, $3, $4, $5, $6)")
        .run(id, name, email, hashedPassword, role || 'cliente', status || 'active');
      res.status(201).json({ id, name, email, role, status });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/users/:id", authenticate, adminOnly, async (req, res) => {
    const { id } = req.params;
    const { name, email, role, status } = req.body;
    try {
      await db.prepare("UPDATE users SET name = $1, email = $2, role = $3, status = $4 WHERE id = $5")
        .run(name, email, role, status, id);
      res.json({ id, name, email, role, status });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", authenticate, adminOnly, async (req, res) => {
    const { id } = req.params;
    if (id === (req as any).userId) return res.status(400).json({ error: "Não é possível excluir o próprio usuário" });
    try {
      await db.prepare("DELETE FROM users WHERE id = $1").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Falha ao excluir usuário" });
    }
  });

  // Leads / Contatos API

  app.get("/api/leads", authenticate, async (req, res) => {
    try {
      const leads = await db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
      const parsedLeads = leads.map((lead: any) => {
        const customFields = lead.custom_fields ? (typeof lead.custom_fields === 'string' ? JSON.parse(lead.custom_fields) : lead.custom_fields) : {};
        return {
          ...lead,
          ...customFields,
          value: customFields.value || lead.value || 0,
          notes: customFields.notes || lead.notes || '',
        };
      });
      res.json(parsedLeads);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/pipelines", authenticate, async (req, res) => {
    try {
      const pipelines = await db.prepare("SELECT * FROM pipelines ORDER BY is_default DESC").all();
      res.json(pipelines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipelines" });
    }
  });

  app.get("/api/pipelines/:id/stages", authenticate, async (req, res) => {
    const { id } = req.params;
    try {
      const stages = await db.prepare("SELECT * FROM stages WHERE pipeline_id = $1 ORDER BY sort_order ASC").all(id);
      res.json(stages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stages" });
    }
  });

  app.post("/api/leads", authenticate, async (req, res) => {
    const { name, email, phone, source, status, value, notes } = req.body;
    const id = Math.random().toString(36).substr(2, 9);

    try {
      const stmt = db.prepare(`
        INSERT INTO leads (id, name, email, phone, source, status, custom_fields, is_mock)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `);

      const customFields = { ...req.body };
      delete customFields.name; delete customFields.email; delete customFields.phone; delete customFields.source; delete customFields.status;

      await stmt.run(id, name, email, phone, source || 'Manual', status || 'Novo Lead', JSON.stringify(customFields), false);

      // Dispara automações de "Lead Criado"
      if (!isSimulatedMode) {
        automationEngine.triggerLeadCreated(id).catch(err => {
          console.error('⚠️ [AUTOMATION] Erro ao disparar automações:', err);
        });
      }

      res.status(201).json({ id, name, email, phone, source, status, ...customFields });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/leads/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, source, status, value, notes } = req.body;

    try {
      const stmt = db.prepare(`
        UPDATE leads 
        SET name = $1, email = $2, phone = $3, source = $4, status = $5, custom_fields = $6
        WHERE id = $7
      `);

      const customFields = { ...req.body };
      delete customFields.name; delete customFields.email; delete customFields.phone; delete customFields.source; delete customFields.status; delete customFields.id;

      await stmt.run(name, email, phone, source, status, JSON.stringify(customFields), id);

      res.json({ id, name, email, phone, source, status, ...customFields });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Excluir Lead (BUG-001 fix)
  app.delete("/api/leads/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    try {
      // Remove agendamentos vinculados antes de deletar o lead
      await db.prepare("DELETE FROM appointments WHERE client_id = $1").run(id);
      // Remove assinaturas vinculadas
      await db.prepare("DELETE FROM subscriptions WHERE client_id = $1").run(id);
      // Remove o lead
      await db.prepare("DELETE FROM leads WHERE id = $1").run(id);
      res.json({ success: true, message: "Lead excluído com sucesso" });
    } catch (error: any) {
      console.error("Erro ao excluir lead:", error);
      res.status(500).json({ error: "Falha ao excluir lead" });
    }
  });

  // Settings API
  app.get("/api/settings", authenticate, async (req, res) => {
    try {
      const settings = await db.prepare("SELECT * FROM settings").all();
      const settingsMap = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(settingsMap);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings/:key", authenticate, async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    try {
      await db.prepare("UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2").run(value, key);
      res.json({ key, value });
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Appointments API
  app.get("/api/appointments", authenticate, async (req, res) => {
    try {
      const appointments = await db.prepare(`
        SELECT a.*, l.name as client_name 
        FROM appointments a 
        JOIN leads l ON a.client_id = l.id 
        ORDER BY a.start_time ASC
      `).all();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", authenticate, async (req, res) => {
    const { client_id, user_id, title, start_time, end_time, notes } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      await db.prepare(`
        INSERT INTO appointments (id, client_id, user_id, title, start_time, end_time, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `).run(id, client_id, user_id, title, start_time, end_time, notes);
      res.status(201).json({ id, client_id, user_id, title, start_time, end_time, notes });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Subscriptions API
  app.get("/api/plans", authenticate, async (req, res) => {
    try {
      const plans = await db.prepare("SELECT * FROM plans").all();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  app.get("/api/subscriptions", authenticate, async (req, res) => {
    try {
      const subscriptions = await db.prepare(`
        SELECT s.*, l.name as client_name, p.name as plan_name, p.price as plan_price
        FROM subscriptions s
        JOIN leads l ON s.client_id = l.id
        JOIN plans p ON s.plan_id = p.id
      `).all();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/subscriptions", authenticate, async (req, res) => {
    const { client_id, plan_id, next_billing_date } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      await db.prepare(`
        INSERT INTO subscriptions (id, client_id, plan_id, next_billing_date)
        VALUES ($1, $2, $3, $4)
      `).run(id, client_id, plan_id, next_billing_date);
      res.status(201).json({ id, client_id, plan_id, next_billing_date });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin Access Requests API
  app.get("/api/admin/requests", authenticate, adminOnly, async (req, res) => {
    try {
      const requests = await db.prepare("SELECT * FROM access_requests ORDER BY created_at DESC").all();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch access requests" });
    }
  });

  app.delete("/api/admin/requests/:id", authenticate, adminOnly, async (req, res) => {
    const { id } = req.params;
    try {
      await db.prepare("DELETE FROM access_requests WHERE id = $1").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete access request" });
    }
  });

  // Admin Simulation Controls (Sandbox Isolation)
  app.get("/api/system/status", async (req, res) => {
    const { isSimulatedMode } = await import("./server/db");
    res.json({ isSimulatedMode });
  });

  app.post("/api/admin/clear-mock-data", authenticate, adminOnly, async (req, res) => {
    try {
      // Limpeza Seletiva: Somente dados marcados como is_mock = true são removidos
      await db.prepare("DELETE FROM leads WHERE is_mock = true").run();
      await db.prepare("DELETE FROM automation_rules WHERE is_mock = true").run();
      await db.prepare("DELETE FROM appointments WHERE is_mock = true").run();

      res.json({ success: true, message: "Dados de simulação removidos com segurança." });
    } catch (error) {
      console.error("🔥 [DB_PURGE_ERROR]", error);
      res.status(500).json({ error: "Falha ao realizar limpeza de dados." });
    }
  });

  app.post("/api/admin/seed-mock-data", authenticate, adminOnly, async (req, res) => {
    try {
      const { setSimulatedMode } = await import("./server/db");
      setSimulatedMode(true);
      res.json({ success: true, message: "Sandbox Ativo. Dados de simulação isolados carregados." });
    } catch (error) {
      res.status(500).json({ error: "Falha ao ativar sandbox" });
    }
  });

  // ==========================================
  // AUTOMATION CRUD ROUTES
  // ==========================================

  app.get("/api/automation", authenticate, async (req: any, res) => {
    try {
      const rules = await db.prepare("SELECT * FROM automation_rules WHERE user_id = ?").all(req.userId);
      res.json(rules.map((r: any) => ({
        ...r,
        steps: typeof r.steps === 'string' ? JSON.parse(r.steps) : r.steps
      })));
    } catch (error) {
      res.status(500).json({ error: "Falha ao carregar automações" });
    }
  });

  app.post("/api/automation", authenticate, async (req: any, res) => {
    const { name, trigger_name, status, steps } = req.body;
    try {
      const id = Math.random().toString(36).substr(2, 9);
      const stepsJson = JSON.stringify(steps);
      await db.prepare("INSERT INTO automation_rules (id, name, trigger_name, status, steps, user_id) VALUES ($1, $2, $3, $4, $5, $6)")
        .run(id, name, trigger_name, status || 'active', stepsJson, req.userId);

      res.json({ id, name, trigger_name, status, steps, user_id: req.userId });
    } catch (error) {
      res.status(500).json({ error: "Falha ao criar automação" });
    }
  });

  app.put("/api/automation/:id", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const { name, trigger_name, status, steps } = req.body;
    try {
      const stepsJson = JSON.stringify(steps);
      await db.prepare("UPDATE automation_rules SET name = $1, trigger_name = $2, status = $3, steps = $4 WHERE id = $5 AND user_id = $6")
        .run(name, trigger_name, status, stepsJson, id, req.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Falha ao atualizar automação" });
    }
  });

  app.delete("/api/automation/:id", authenticate, async (req: any, res) => {
    const { id } = req.params;
    try {
      await db.prepare("DELETE FROM automation_rules WHERE id = $1 AND user_id = $2").run(id, req.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Falha ao excluir automação" });
    }
  });

  // ==========================================
  // AI GENERATION ROUTES
  // ==========================================

  app.post("/api/automation/generate", authenticate, async (req: any, res) => {
    const { prompt, currentSteps, globalMode } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt é obrigatório" });
    }

    try {

      let systemInstruction = "";
      if (globalMode) {
        systemInstruction = `Analise este pedido de automação complexa. 
        Crie um ou mais fluxos de trabalho (workflows) que resolvam este problema. 
        Se o processo for complexo, divida-o em múltiplos fluxos que se conectam (cadeias de fluxo).
        Para conectar fluxos, use o tipo 'chain' e no campo 'targetWorkflowId' use o NOME do fluxo que deve ser chamado.
        
        Retorne um array de objetos, onde cada objeto é um workflow com:
        - name: Nome do fluxo
        - steps: Array de passos (o primeiro deve ser 'trigger').
        
        Tipos de passos permitidos: 'trigger', 'action', 'condition', 'delay', 'chain'.
        Ícones: 'zap', 'mail', 'message-circle', 'clock', 'tag', 'user', 'bell', 'check-circle', 'file-text', 'calendar', 'database', 'globe', 'share-2', 'link'.`;
      } else {
        systemInstruction = `Refine este fluxo de automação baseado neste pedido: "${prompt}". 
        Fluxo atual: ${JSON.stringify(currentSteps || [])}.
        Retorne o array COMPLETO de passos atualizado.
        Tipos permitidos: 'trigger', 'action', 'condition', 'delay', 'chain'.
        Se o tipo for 'chain', inclua 'targetWorkflowId' com o ID ou nome de outro fluxo.`;
      }

      const promptText = `${systemInstruction}\n\nPedido do usuário: ${prompt}`;

      // Chamada padrão 2026 usando a nova SDK e thinking_level para Gemini 3
      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: promptText,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH, // Garante raciocínio profundo para automações
          }
        }
      });

      let text = response.text || "";

      // Limpeza de blocos de código se a IA retornar markdown
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      try {
        const jsonResponse = JSON.parse(text);
        res.json(jsonResponse);
      } catch (parseError) {
        console.error("Erro ao parsear JSON da IA:", text);
        res.status(500).json({ error: "A IA retornou um formato inválido", raw: text });
      }
    } catch (error: any) {
      console.error("Erro na integração com Gemini:", error);
      res.status(500).json({ error: "Falha na comunicação com a API de Inteligência Artificial" });
    }
  });

  // ==========================================
  // WHATSAPP / EVOLUTION API ROUTES
  // ==========================================

  // Health check Evolution API
  app.get("/api/whatsapp/health", authenticate, async (req, res) => {
    try {
      const status = await evolutionService.healthCheck();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  // Listar instâncias WhatsApp
  app.get("/api/whatsapp/instances", authenticate, async (req, res) => {
    try {
      // Busca instâncias da Evolution API
      const evolutionInstances = await evolutionService.listInstances();

      // Busca instâncias salvas no banco
      const dbInstances = await db.prepare(
        "SELECT * FROM whatsapp_instances WHERE user_id = $1 ORDER BY created_at DESC"
      ).all(req.userId);

      res.json({
        evolution: evolutionInstances,
        database: dbInstances
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Criar instância WhatsApp
  app.post("/api/whatsapp/instances", authenticate, async (req: any, res) => {
    const { name, instance_name, qrcode } = req.body;

    try {
      // Cria na Evolution API
      const evolutionResult = await evolutionService.createInstance({
        instanceName: instance_name || name.toLowerCase().replace(/\s+/g, '-'),
        qrcode: qrcode !== false
      });

      // Salva no banco
      const id = Math.random().toString(36).substr(2, 9);
      const apiKey = instance_name || name.toLowerCase().replace(/\s+/g, '-');

      await db.prepare(
        `INSERT INTO whatsapp_instances (id, name, instance_name, api_key, status, user_id, is_mock)
         VALUES ($1, $2, $3, $4, 'disconnected', $5, false)`
      ).run(id, name, instance_name, apiKey, req.userId);

      res.json({
        success: true,
        instance: evolutionResult,
        db_id: id
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Conectar instância (gera QR Code)
  app.post("/api/whatsapp/instances/:id/connect", authenticate, async (req, res) => {
    const { id } = req.params;

    try {
      const instance = await db.prepare(
        "SELECT * FROM whatsapp_instances WHERE id = $1 AND user_id = $2"
      ).get(id, req.userId);

      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      const result = await evolutionService.connectInstance(instance.instance_name);

      // Atualiza status no banco
      await db.prepare(
        "UPDATE whatsapp_instances SET status = 'connecting', updated_at = CURRENT_TIMESTAMP WHERE id = $1"
      ).run(id);

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Desconectar instância
  app.post("/api/whatsapp/instances/:id/disconnect", authenticate, async (req, res) => {
    const { id } = req.params;

    try {
      const instance = await db.prepare(
        "SELECT * FROM whatsapp_instances WHERE id = $1 AND user_id = $2"
      ).get(id, req.userId);

      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      await evolutionService.disconnectInstance(instance.instance_name);

      await db.prepare(
        "UPDATE whatsapp_instances SET status = 'disconnected', updated_at = CURRENT_TIMESTAMP WHERE id = $1"
      ).run(id);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Deletar instância
  app.delete("/api/whatsapp/instances/:id", authenticate, async (req, res) => {
    const { id } = req.params;

    try {
      const instance = await db.prepare(
        "SELECT * FROM whatsapp_instances WHERE id = $1 AND user_id = $2"
      ).get(id, req.userId);

      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      await evolutionService.deleteInstance(instance.instance_name);
      await db.prepare("DELETE FROM whatsapp_instances WHERE id = $1").run(id);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Configurar webhook de instância
  app.post("/api/whatsapp/instances/:id/webhook", authenticate, async (req, res) => {
    const { id } = req.params;
    const { webhook_url, events } = req.body;

    try {
      const instance = await db.prepare(
        "SELECT * FROM whatsapp_instances WHERE id = $1 AND user_id = $2"
      ).get(id, req.userId);

      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
      const webhookEndpoint = `${backendUrl}/api/webhook/whatsapp`;

      await evolutionService.setWebhook(instance.instance_name, {
        url: webhookEndpoint,
        events: events || ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE']
      });

      await db.prepare(
        "UPDATE whatsapp_instances SET webhook_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
      ).run(webhookEndpoint, id);

      res.json({ success: true, webhook_url: webhookEndpoint });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Enviar mensagem de teste
  app.post("/api/whatsapp/send-test", authenticate, async (req: any, res) => {
    const { instance_id, phone_number, message } = req.body;

    try {
      const instance = await db.prepare(
        "SELECT * FROM whatsapp_instances WHERE id = $1 AND user_id = $2"
      ).get(instance_id, req.userId);

      if (!instance) {
        return res.status(404).json({ error: "Instância não encontrada" });
      }

      await evolutionService.sendTextMessage(
        { instanceName: instance.instance_name, apiKey: instance.api_key },
        { number: phone_number, text: message }
      );

      // Registra no banco
      const msgId = Math.random().toString(36).substr(2, 9);
      await db.prepare(
        `INSERT INTO whatsapp_messages (id, instance_id, direction, phone_number, message_type, content, status, created_at)
         VALUES ($1, $2, 'outbound', $3, 'text', $4, 'sent', $5)`
      ).run(msgId, instance_id, phone_number, message, new Date().toISOString());

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Listar mensagens
  app.get("/api/whatsapp/messages", authenticate, async (req, res) => {
    const { instance_id, phone_number, limit = 50 } = req.query;

    try {
      let query = "SELECT * FROM whatsapp_messages WHERE 1=1";
      const params: any[] = [];

      if (instance_id) {
        query += ` AND instance_id = $${params.length + 1}`;
        params.push(instance_id);
      }

      if (phone_number) {
        query += ` AND phone_number = $${params.length + 1}`;
        params.push(phone_number);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(Number(limit));

      const messages = await db.prepare(query).all(...params);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // WHATSAPP BLACKLIST ROUTES
  // ==========================================

  // Listar números na blacklist
  app.get("/api/settings/blacklist", authenticate, async (req, res) => {
    try {
      const list = await db.prepare("SELECT * FROM whatsapp_blacklist ORDER BY created_at DESC").all();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Adicionar número à blacklist
  app.post("/api/settings/blacklist", authenticate, async (req, res) => {
    const { phone_number, description } = req.body;
    if (!phone_number) return res.status(400).json({ error: "Número obrigatório" });

    try {
      // Limpa o número (remove +, espaços, etc)
      const cleanPhone = phone_number.replace(/\D/g, '');
      await db.prepare(
        "INSERT INTO whatsapp_blacklist (phone_number, description) VALUES ($1, $2) ON CONFLICT (phone_number) DO UPDATE SET description = $2"
      ).run(cleanPhone, description || 'Cadastrado via API');

      res.json({ success: true, message: `Número ${cleanPhone} bloqueado.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remover número da blacklist
  app.delete("/api/settings/blacklist/:phone", authenticate, async (req, res) => {
    const { phone } = req.params;
    try {
      await db.prepare("DELETE FROM whatsapp_blacklist WHERE phone_number = ?").run(phone);
      res.json({ success: true, message: "Número removido da blacklist." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Logs de automação
  app.get("/api/automation/logs", authenticate, async (req, res) => {
    const { automation_id, limit = 50 } = req.query;

    try {
      let query = `
        SELECT al.*, ar.name as automation_name
        FROM automation_logs al
        LEFT JOIN automation_rules ar ON al.automation_id = ar.id
        WHERE ar.user_id = $1
      `;
      const params: any[] = [req.userId];

      if (automation_id) {
        query += ` AND al.automation_id = $${params.length + 1}`;
        params.push(automation_id);
      }

      query += ` ORDER BY al.started_at DESC LIMIT $${params.length + 1}`;
      params.push(Number(limit));

      const logs = await db.prepare(query).all(...params);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // WEBHOOK ENDPOINTS (Sem autenticação JWT)
  // ==========================================

  // Webhook Evolution API - Recebe mensagens do WhatsApp
  // MIDDLEWARE DE SEGURANÇA: Valida IPs, instâncias, rate limiting, payload
  app.post("/api/webhook/whatsapp", async (req, res) => {
    const startTime = Date.now();
    const body = req.body;

    try {
      console.log('📥 [WEBHOOK] Mensagem recebida da Evolution API:', JSON.stringify(body, null, 2));

      // Validação de segurança (middleware manual para melhor controle)
      const { secureWebhook, validateIP, checkRateLimit, validatePayloadSize, validatePayloadSchema, validateInstance, logWebhookAudit, generatePayloadHash } =
        await import('./middleware/webhook.security');

      const sourceIP = req.ip || req.connection?.remoteAddress || null;
      let instanceName = body.data?.key?.instanceName || body.data?.instanceName;
      let phoneNumber = body.data?.key?.remoteJid?.replace('@s.whatsapp.net', '');
      const eventType = body.event || 'UNKNOWN';
      const payloadSize = JSON.stringify(body).length;

      // 1. Validação de IP
      const ipValidation = await validateIP(sourceIP);
      if (!ipValidation.valid) {
        await logWebhookAudit(null, eventType, sourceIP, null, payloadSize, 'rejected', ipValidation.reason, Date.now() - startTime, generatePayloadHash(body), { step: 'ip_validation' });
        return res.status(403).json({ error: 'Forbidden', reason: ipValidation.reason, security: true });
      }

      // 2. Rate Limiting por IP
      const rateLimitIP = await checkRateLimit(sourceIP, 'ip');
      if (!rateLimitIP.valid) {
        await logWebhookAudit(null, eventType, sourceIP, null, payloadSize, 'blocked', rateLimitIP.reason, Date.now() - startTime, generatePayloadHash(body), { step: 'rate_limit_ip' });
        return res.status(429).json({ error: 'Too Many Requests', reason: rateLimitIP.reason, security: true });
      }

      // 3. Validação de Payload Size
      const payloadValidation = validatePayloadSize(body);
      if (!payloadValidation.valid) {
        await logWebhookAudit(null, eventType, sourceIP, null, payloadSize, 'rejected', payloadValidation.reason, Date.now() - startTime, generatePayloadHash(body), { step: 'payload_size' });
        return res.status(413).json({ error: 'Payload Too Large', reason: payloadValidation.reason, security: true });
      }

      // 4. Validação de Schema (evitar injeção XSS/SQL)
      const schemaValidation = validatePayloadSchema(eventType, body);
      if (!schemaValidation.valid) {
        await logWebhookAudit(null, eventType, sourceIP, null, payloadSize, 'rejected', schemaValidation.reason, Date.now() - startTime, generatePayloadHash(body), { step: 'schema_validation' });
        return res.status(400).json({ error: 'Invalid Payload Schema', reason: schemaValidation.reason, security: true });
      }

      // 5. Validação de Instância
      if (instanceName) {
        const instanceValidation = await validateInstance(instanceName, body.apiKey);
        if (!instanceValidation.valid) {
          await logWebhookAudit(null, eventType, sourceIP, phoneNumber, payloadSize, 'rejected', instanceValidation.reason, Date.now() - startTime, generatePayloadHash(body), { step: 'instance_validation', instance_name: instanceName });
          return res.status(403).json({ error: 'Forbidden', reason: instanceValidation.reason, security: true });
        }

        // Rate Limiting por instância
        const rateLimitInstance = await checkRateLimit(instanceName, 'instance');
        if (!rateLimitInstance.valid) {
          await logWebhookAudit(null, eventType, sourceIP, phoneNumber, payloadSize, 'blocked', rateLimitInstance.reason, Date.now() - startTime, generatePayloadHash(body), { step: 'rate_limit_instance', instance_name: instanceName });
          return res.status(429).json({ error: 'Too Many Requests', reason: rateLimitInstance.reason, security: true });
        }
      }

      // 6. Blacklist (Ignora contatos pessoais antes de qualquer processamento)
      if (eventType === 'MESSAGES_UPSERT' && body.data && phoneNumber) {
        const isBlacklisted = await db.prepare("SELECT 1 FROM whatsapp_blacklist WHERE phone_number = ?").get(phoneNumber);
        if (isBlacklisted) {
          console.log(`🚫 [BLACKLIST] Mensagem de ${phoneNumber} ignorada automaticamente.`);
          await logWebhookAudit(null, eventType, sourceIP, phoneNumber, payloadSize, 'blocked', 'Número na blacklist', Date.now() - startTime, generatePayloadHash(body), { step: 'blacklist_check' });
          return res.json({ success: true, status: 'ignored_by_blacklist' });
        }
      }

      // 2. MESSAGES_UPSERT - Nova mensagem recebida
      if (body.event === 'MESSAGES_UPSERT' && body.data) {
        const message = body.data;
        const instanceName = message.key?.instanceName;
        const phoneNumber = message.key?.remoteJid?.replace('@s.whatsapp.net', '');
        const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

        console.log(`💬 [WHATSAPP] Mensagem de ${phoneNumber}: ${messageText}`);

        // Salva mensagem no banco
        const instanceRecord = await db.prepare("SELECT id FROM whatsapp_instances WHERE instance_name = ?").get(instanceName);
        const resolvedInstanceId = instanceRecord ? instanceRecord.id : null;

        const msgId = Math.random().toString(36).substr(2, 9);
        await db.prepare(
          `INSERT INTO whatsapp_messages (id, instance_id, direction, phone_number, message_type, content, metadata, created_at)
           VALUES ($1, $2, 'inbound', $3, 'text', $4, $5, $6)`
        ).run(msgId, resolvedInstanceId, phoneNumber, messageText, JSON.stringify(message), new Date().toISOString());

        // 3. Tagueamento Automático como #cliente
        // Verifica se o lead existe, senão cria com a tag
        const existingLead = await db.prepare("SELECT id, custom_fields FROM leads WHERE phone = ?").get(phoneNumber);

        if (!existingLead) {
          const leadId = Math.random().toString(36).substr(2, 9);
          const initialCustomFields = JSON.stringify({ tags: ["#cliente"] });
          await db.prepare(
            "INSERT INTO leads (id, name, phone, status, custom_fields, created_at) VALUES ($1, $2, $3, $4, $5, $6)"
          ).run(leadId, phoneNumber, phoneNumber, 'Novo Lead', initialCustomFields, new Date().toISOString());
          console.log(`🏷️ [AUTO-TAG] Novo lead criado e tagueado como #cliente: ${phoneNumber}`);
        } else {
          // Atualiza tags se ainda não tiver
          let customFields = typeof existingLead.custom_fields === 'string'
            ? JSON.parse(existingLead.custom_fields)
            : (existingLead.custom_fields || {});

          if (!customFields.tags) customFields.tags = [];
          if (!customFields.tags.includes("#cliente")) {
            customFields.tags.push("#cliente");
            await db.prepare(
              "UPDATE leads SET custom_fields = $1 WHERE id = $2"
            ).run(JSON.stringify(customFields), existingLead.id);
            console.log(`🏷️ [AUTO-TAG] Lead existente tagueado como #cliente: ${phoneNumber}`);
          }
        }

        // Dispara automações
        await automationEngine.triggerWhatsAppMessageReceived(instanceName, phoneNumber, messageText);
      }

      // CONNECTION_UPDATE - Status da conexão
      if (body.event === 'CONNECTION_UPDATE' && body.data) {
        const { instanceName, status } = body.data;
        console.log(`🔌 [WHATSAPP] Instância ${instanceName} status: ${status}`);

        // Atualiza status no banco
        await db.prepare(
          "UPDATE whatsapp_instances SET status = $1, connection_status = $2, updated_at = CURRENT_TIMESTAMP WHERE instance_name = $3"
        ).run(status, JSON.stringify(body.data), instanceName);
      }

      // Log de sucesso
      const { logWebhookAudit, generatePayloadHash } = await import('./middleware/webhook.security');
      await logWebhookAudit(
        null,
        eventType,
        req.ip || req.connection?.remoteAddress || null,
        phoneNumber,
        JSON.stringify(body).length,
        'approved',
        null,
        Date.now() - startTime,
        generatePayloadHash(body),
        { processing_complete: true }
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error('❌ [WEBHOOK] Erro ao processar webhook:', error);

      // Log de erro
      try {
        const { logWebhookAudit, generatePayloadHash } = await import('./middleware/webhook.security');
        await logWebhookAudit(
          null,
          eventType || 'UNKNOWN',
          req.ip || req.connection?.remoteAddress || null,
          phoneNumber || null,
          JSON.stringify(body || {}).length,
          'rejected',
          error.message,
          Date.now() - startTime,
          body ? generatePayloadHash(body) : 'no-payload',
          { error_step: 'processing', error: error.message }
        );
      } catch (auditError) {
        console.error('❌ [WEBHOOK] Erro ao registrar auditoria:', auditError);
      }

      res.status(500).json({ error: error.message });
    }
  });

  // Bloqueio de Fallback para rotas de API não encontradas
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "Endpoint de API não encontrado" });
  });

  // VITE MIDDLEWARE (Frontend)
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server ready");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

/**
 * Inicializa migrações de banco de dados necessárias para novas features
 */
async function runAutoMigrations() {
  console.log('🔄 Executando Migrações Automáticas...');
  try {
    // 1. Criar tabela de Blacklist se não existir
    await db.exec(`
      CREATE TABLE IF NOT EXISTS whatsapp_blacklist (
          phone_number TEXT PRIMARY KEY,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela whatsapp_blacklist verificada/criada.');

    // 2. Adicionar tag #cliente em massa para leads existentes
    // Compatível com JSONB do Postgres no db.ts
    if (!isSimulatedMode) {
      await db.exec(`
        UPDATE leads
        SET custom_fields = jsonb_set(
            COALESCE(custom_fields, '{}'::jsonb),
            '{tags}',
            COALESCE(custom_fields->'tags', '[]'::jsonb) || '["#cliente"]'::jsonb
        )
        WHERE NOT (custom_fields ? 'tags' AND custom_fields->'tags' @> '[\"#cliente\"]'::jsonb);
      `);
      console.log('✅ Tagueamento retroativo #cliente concluído.');
    }

    // 3. Criar tabelas de segurança de webhooks
    console.log('🔒 Verificando tabelas de segurança de webhooks...');

    // webhook_security_rules
    await db.exec(`
      CREATE TABLE IF NOT EXISTS webhook_security_rules (
        id TEXT PRIMARY KEY,
        rule_name TEXT NOT NULL,
        rule_type TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        priority INTEGER DEFAULT 0,
        config TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela webhook_security_rules verificada/criada.');

    // webhook_audit_log
    await db.exec(`
      CREATE TABLE IF NOT EXISTS webhook_audit_log (
        id TEXT PRIMARY KEY,
        instance_id TEXT,
        event_type TEXT NOT NULL,
        source_ip TEXT,
        phone_number TEXT,
        payload_size INTEGER,
        validation_status TEXT DEFAULT 'pending',
        rejection_reason TEXT,
        processing_time_ms INTEGER,
        payload_hash TEXT,
        metadata TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela webhook_audit_log verificada/criada.');

    // webhook_rate_limits
    await db.exec(`
      CREATE TABLE IF NOT EXISTS webhook_rate_limits (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        identifier_type TEXT,
        window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        request_count INTEGER DEFAULT 1,
        max_requests INTEGER DEFAULT 100,
        window_duration_seconds INTEGER DEFAULT 60,
        is_blocked BOOLEAN DEFAULT FALSE,
        blocked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela webhook_rate_limits verificada/criada.');

    // webhook_allowed_instances
    await db.exec(`
      CREATE TABLE IF NOT EXISTS webhook_allowed_instances (
        id TEXT PRIMARY KEY,
        instance_name TEXT NOT NULL,
        instance_id TEXT,
        api_key_hash TEXT NOT NULL,
        allowed_events TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        ip_whitelist TEXT,
        max_requests_per_minute INTEGER DEFAULT 60,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela webhook_allowed_instances verificada/criada.');

    // webhook_blocked_ips
    await db.exec(`
      CREATE TABLE IF NOT EXISTS webhook_blocked_ips (
        id TEXT PRIMARY KEY,
        ip_address TEXT NOT NULL,
        reason TEXT,
        blocked_until TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela webhook_blocked_ips verificada/criada.');

    // 4. Inserir regras de segurança padrão (se não existirem)
    const existingRules = await db.prepare("SELECT COUNT(*) as count FROM webhook_security_rules").get() as any;
    if (existingRules.count === 0) {
      console.log('📝 Inserindo regras de segurança padrão...');

      await db.prepare(
        "INSERT INTO webhook_security_rules (id, rule_name, rule_type, priority, config) VALUES ($1, $2, $3, $4, $5)"
      ).run(
        'rule_ip_whitelist',
        'IP Whitelist Validation',
        'ip_whitelist',
        100,
        JSON.stringify({
          enabled: true,
          whitelist: [],
          reject_if_empty: false
        })
      );

      await db.prepare(
        "INSERT INTO webhook_security_rules (id, rule_name, rule_type, priority, config) VALUES ($1, $2, $3, $4, $5)"
      ).run(
        'rule_instance_validation',
        'Instance ID Validation',
        'instance_validation',
        200,
        JSON.stringify({
          enabled: true,
          require_valid_instance: true,
          reject_unknown_instance: true
        })
      );

      await db.prepare(
        "INSERT INTO webhook_security_rules (id, rule_name, rule_type, priority, config) VALUES ($1, $2, $3, $4, $5)"
      ).run(
        'rule_rate_limit',
        'Rate Limiting',
        'rate_limit',
        300,
        JSON.stringify({
          enabled: true,
          max_requests_per_minute: 100,
          max_requests_per_hour: 1000,
          block_duration_minutes: 30
        })
      );

      await db.prepare(
        "INSERT INTO webhook_security_rules (id, rule_name, rule_type, priority, config) VALUES ($1, $2, $3, $4, $5)"
      ).run(
        'rule_payload_size',
        'Payload Size Validation',
        'signature_validation',
        400,
        JSON.stringify({
          enabled: true,
          max_payload_size_bytes: 1048576,
          reject_oversized: true
        })
      );

      console.log('✅ Regras de segurança padrão inseridas.');
    }

    // 5. Migrar instâncias existentes para whitelist
    const existingInstances = await db.prepare("SELECT COUNT(*) as count FROM webhook_allowed_instances").get() as any;
    if (existingInstances.count === 0) {
      console.log('📝 Migrando instâncias existentes para whitelist...');

      const instances = await db.prepare("SELECT id, instance_name, api_key FROM whatsapp_instances").all() as any;
      if (instances && instances.length > 0) {
        const crypto = await import('crypto');
        for (const instance of instances) {
          const apiKeyHash = crypto.createHash('sha256').update(instance.api_key).digest('hex');
          await db.prepare(
            "INSERT INTO webhook_allowed_instances (id, instance_name, instance_id, api_key_hash, allowed_events, is_active) VALUES ($1, $2, $3, $4, $5, $6)"
          ).run(
            `allowed_${instance.id}`,
            instance.instance_name,
            instance.id,
            apiKeyHash,
            JSON.stringify(['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']),
            true
          );
        }
        console.log(`✅ ${instances.length} instâncias migradas para whitelist.`);
      }
    }

    console.log('🔒 Segurança de webhooks configurada com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante migrações automáticas:', error);
  }
}

startServer();
