import express from "express";
import path from "path";
import db, { initializeDatabase, isSimulatedMode } from "./server/db";
import { comparePassword, generateToken, verifyToken } from "./server/auth";
import bcrypt from "bcryptjs";

async function startServer() {
  // Ensure DB is ready
  await initializeDatabase();
  
  const app = express();
  
  // Função para encontrar porta disponível
  const findPort = async (startPort: number): Promise<number> => {
    const net = await import('net');
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(startPort, () => {
        server.once('close', () => resolve(startPort));
        server.close();
      });
      server.on('error', () => resolve(findPort(startPort + 1)));
    });
  };

  const DESIRED_PORT = Number(process.env.PORT) || 3001;
  const PORT = await findPort(DESIRED_PORT);

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
          role: user.role
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
      const user = await db.prepare("SELECT id, name, email, role FROM users WHERE id = $1").get(req.userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Erro no servidor" });
    }
  });

  // ==========================================
  // WHATSAPP / EVOLUTION API PROXY (TOP PRIORITY)
  // ==========================================
  
  const getEvoSettings = async () => {
    const settings = await db.prepare("SELECT * FROM settings WHERE key IN ('whatsapp_evo_url', 'whatsapp_evo_key')").all();
    return settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  };

  console.log("📡 [ROUTING] Registering WhatsApp Proxy routes...");
  
  app.get("/api/whatsapp/instances", authenticate, async (req, res) => {
    try {
      const evo = await getEvoSettings();
      if (!evo.whatsapp_evo_url || !evo.whatsapp_evo_key) {
        return res.status(400).json({ error: "Configurações não encontradas" });
      }
      const response = await fetch(`${evo.whatsapp_evo_url}/instance/fetchInstances`, {
        headers: { 'apikey': evo.whatsapp_evo_key }
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/whatsapp/status", authenticate, async (req, res) => {
    const { instanceName } = req.query;
    try {
      const evo = await getEvoSettings();
      if (!evo.whatsapp_evo_url || !evo.whatsapp_evo_key) {
        return res.status(400).json({ error: "Configurações não encontradas" });
      }
      const response = await fetch(`${evo.whatsapp_evo_url}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': evo.whatsapp_evo_key }
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/whatsapp/connect", authenticate, async (req, res) => {
    const { instanceName = 'nexus_v2' } = req.body;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s total

    try {
      const evo = await getEvoSettings();
      if (!evo.whatsapp_evo_url || !evo.whatsapp_evo_key) {
        throw new Error("Configurações Evolution não encontradas");
      }

      const baseUrl = evo.whatsapp_evo_url.replace(/\/$/, "");
      console.log(`🔌 [WHATSAPP_PROXY] Iniciando sequência para: ${instanceName}`);
      
      // 1. Limpeza forçada (Deletar instância se já existir)
      console.log(`🧹 [WHATSAPP_PROXY] Limpando instância anterior ${instanceName}...`);
      try {
        await fetch(`${baseUrl}/instance/delete/${instanceName}`, {
          method: 'DELETE', 
          headers: { 'apikey': evo.whatsapp_evo_key }, 
          signal: AbortSignal.timeout(5000)
        });
      } catch (e) {
        // Ignora erro se a instância não existir
      }

      // 2. Criar a instância (WHATSAPP-BAILEYS é vital para v2.1.1+)
      console.log(`🆕 [WHATSAPP_PROXY] Criando instância ${instanceName}...`);
      const createRes = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: { 'apikey': evo.whatsapp_evo_key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instanceName, 
          integration: "WHATSAPP-BAILEYS",
          qrcode: true
        }),
        signal: controller.signal
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(`Erro na criação: ${errData.message || JSON.stringify(errData)}`);
      }

      // 3. Warmup prolongado (VPS Latency)
      console.log(`⏳ [WHATSAPP_PROXY] Aguardando 15s para estabilização do browser...`);
      await new Promise(resolve => setTimeout(resolve, 15000));

      // 4. Conectar e obter QR
      console.log(`📡 [WHATSAPP_PROXY] Solicitando QR Code...`);
      const connectRes = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        headers: { 'apikey': evo.whatsapp_evo_key },
        signal: controller.signal
      });
      
      const data = await connectRes.json();
      clearTimeout(timeout);

      // Mapeamento de campos para garantir que o frontend receba o que espera
      const responseData = {
        ...data,
        qrcode: data.qrcode || { base64: data.base64 }
      };

      console.log(`✅ [WHATSAPP_PROXY] QR Code pronto para exibição.`);
      res.json(responseData);
    } catch (error: any) {
      clearTimeout(timeout);
      console.error("🔥 [WHATSAPP_PROXY_ERROR]:", error.message);
      res.status(500).json({ 
        error: "Falha na conexão WhatsApp", 
        message: error.message 
      });
    }
  });

  app.get("/api/whatsapp/status", authenticate, async (req, res) => {
    try {
      const evo = await getEvoSettings();
      const baseUrl = evo.whatsapp_evo_url.replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: { 'apikey': evo.whatsapp_evo_key }, signal: AbortSignal.timeout(5000)
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/whatsapp/instance/:instance", authenticate, async (req, res) => {
    const { instance } = req.params;
    try {
      const evo = await getEvoSettings();
      console.log(`🗑️ [WHATSAPP_PROXY] Removendo: ${instance}`);
      await fetch(`${evo.whatsapp_evo_url}/instance/logout/${instance}`, {
        method: 'DELETE', headers: { 'apikey': evo.whatsapp_evo_key }
      }).catch(() => {});
      const response = await fetch(`${evo.whatsapp_evo_url}/instance/delete/${instance}`, {
        method: 'DELETE', headers: { 'apikey': evo.whatsapp_evo_key }
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  console.log("✅ [ROUTING] WhatsApp Proxy routes registered successfully.");

  // ==========================================
  // OTHER API ROUTES
  // ==========================================
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Nexus CRM API is running" });
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
    const isSimMode = req.headers['x-simulation-mode'] === 'true';
    try {
      console.log(`🔍 [GET_LEADS] Modo Simulação: ${isSimMode}`);
      const sql = isSimMode 
        ? "SELECT * FROM leads WHERE is_fake = true ORDER BY created_at DESC"
        : "SELECT * FROM leads WHERE (is_fake = false OR is_fake IS NULL) ORDER BY created_at DESC";
      
      const leads = await db.prepare(sql).all();
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
    const { name, email, phone, source, status } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const isSimMode = req.headers['x-simulation-mode'] === 'true';
    
    try {
      const customFields = { ...req.body };
      delete customFields.name; delete customFields.email; delete customFields.phone; delete customFields.source; delete customFields.status;

      await db.prepare(`
        INSERT INTO leads (id, name, email, phone, source, status, custom_fields, is_fake, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      `).run(
        id, 
        name, 
        email, 
        phone, 
        source || 'Manual', 
        status || 'Novo Lead', 
        JSON.stringify(customFields),
        isSimMode // Se o usuário criar manualmente enquanto simula, vira fake
      );
      
      res.status(201).json({ id, name, email, phone, source, status, ...customFields, is_fake: isSimMode });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/leads/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, source, status } = req.body;
    
    try {
      const customFields = { ...req.body };
      delete customFields.name; delete customFields.email; delete customFields.phone; delete customFields.source; delete customFields.status; delete customFields.id;
      
      await db.prepare(`
        UPDATE leads 
        SET name = $1, email = $2, phone = $3, source = $4, status = $5, custom_fields = $6
        WHERE id = $7
      `).run(name, email, phone, source, status, JSON.stringify(customFields), id);
      
      res.json({ id, name, email, phone, source, status, ...customFields });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/leads/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    try {
      await db.prepare("DELETE FROM appointments WHERE client_id = $1").run(id);
      await db.prepare("DELETE FROM subscriptions WHERE client_id = $1").run(id);
      await db.prepare("DELETE FROM leads WHERE id = $1").run(id);
      res.json({ success: true, message: "Lead excluído com sucesso" });
    } catch (error: any) {
      res.status(500).json({ error: "Falha ao excluir lead" });
    }
  });

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


  app.get("/api/appointments", authenticate, async (req, res) => {
    const isSimMode = req.headers['x-simulation-mode'] === 'true';
    try {
      const sql = isSimMode
        ? `SELECT a.*, l.name as client_name FROM appointments a JOIN leads l ON a.client_id = l.id WHERE a.is_fake = true ORDER BY a.start_time ASC`
        : `SELECT a.*, l.name as client_name FROM appointments a JOIN leads l ON a.client_id = l.id WHERE (a.is_fake = false OR a.is_fake IS NULL) ORDER BY a.start_time ASC`;
      
      const appointments = await db.prepare(sql).all();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", authenticate, async (req, res) => {
    const { client_id, user_id, title, start_time, end_time, notes } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const isSimMode = req.headers['x-simulation-mode'] === 'true';
    try {
      await db.prepare(`
        INSERT INTO appointments (id, client_id, user_id, title, start_time, end_time, notes, is_fake)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `).run(id, client_id, user_id, title, start_time, end_time, notes, isSimMode);
      res.status(201).json({ id, client_id, user_id, title, start_time, end_time, notes, is_fake: isSimMode });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/subscriptions", authenticate, async (req, res) => {
    const isSimMode = req.headers['x-simulation-mode'] === 'true';
    try {
      const sql = isSimMode
        ? `SELECT s.*, l.name as client_name, p.name as plan_name, p.price as plan_price FROM subscriptions s JOIN leads l ON s.client_id = l.id JOIN plans p ON s.plan_id = p.id WHERE s.is_fake = true`
        : `SELECT s.*, l.name as client_name, p.name as plan_name, p.price as plan_price FROM subscriptions s JOIN leads l ON s.client_id = l.id JOIN plans p ON s.plan_id = p.id WHERE (s.is_fake = false OR s.is_fake IS NULL)`;
      
      const subscriptions = await db.prepare(sql).all();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/plans", authenticate, async (req, res) => {
    try {
      const plans = await db.prepare("SELECT * FROM plans").all();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  app.post("/api/subscriptions", authenticate, async (req, res) => {
    const { client_id, plan_id, next_billing_date } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const isSimMode = req.headers['x-simulation-mode'] === 'true';
    try {
      await db.prepare(`
        INSERT INTO subscriptions (id, client_id, plan_id, status, next_billing_date, is_fake)
        VALUES ($1, $2, $3, $4, $5, $6)
      `).run(id, client_id, plan_id, 'active', next_billing_date, isSimMode);
      res.status(201).json({ id, client_id, plan_id, next_billing_date, is_fake: isSimMode });
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

  // Admin Simulation Controls
  app.post("/api/admin/clear-mock-data", authenticate, adminOnly, async (req, res) => {
    try {
      console.log('🧹 [CLEAN_FAKE] Iniciando limpeza seletiva de dados de simulação...');
      
      const resSubs = await db.prepare("DELETE FROM subscriptions WHERE is_fake = true").run();
      const resAppts = await db.prepare("DELETE FROM appointments WHERE is_fake = true").run();
      const resLeads = await db.prepare("DELETE FROM leads WHERE is_fake = true").run();
      
      console.log(`✅ [CLEAN_SUCCESS] Removidos: ${resLeads.rowCount} leads, ${resAppts.rowCount} agendamentos, ${resSubs.rowCount} assinaturas.`);
      
      res.json({ 
        success: true, 
        message: "Dados de simulação removidos com sucesso.",
        summary: { leads: resLeads.rowCount, appointments: resAppts.rowCount, subscriptions: resSubs.rowCount }
      });
    } catch (error: any) {
      console.error('🔥 [CLEAN_ERROR] Falha na limpeza:', error);
      res.status(500).json({ error: "Falha ao limpar dados de simulação" });
    }
  });

  app.post("/api/admin/seed-mock-data", authenticate, adminOnly, async (req, res) => {
    try {
      console.log('🌱 [SEED_FAKE] Iniciando injeção de dados profissionais (Demonstration Tier)...');
      
      const firstNames = ["Ricardo", "Patrícia", "Cláudia", "Marcelo", "Juliana", "Fábio", "Beatriz", "Eduardo", "Helena", "Gustavo"];
      const lastNames = ["Oliveira", "Motta", "Cardoso", "Ferreira", "Almeida", "Nunes", "Viana", "Ribeiro", "Santos", "Lopes"];
      const companies = ["Advocacia", "Consultoria", "Logistics", "Tech", "Group", "Investimentos", "Studio", "Partners"];
      const sources = ["Instagram", "Google Ads", "Indicação", "Facebook", "LinkedIn", "Site Oficial"];
      const statuses = ["Novo Lead", "Contato Inicial", "Proposta Enviada", "Negociação", "Fechado", "Perdido"];
      
      const leadsCount = 40;
      let insertedCount = 0;

      // Gerar dados retroativos para os últimos 6 meses (180 dias)
      for (let i = 0; i < leadsCount; i++) {
        const id = Math.random().toString(36).substr(2, 9);
        const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        const company = `${lastNames[Math.floor(Math.random() * lastNames.length)]} ${companies[Math.floor(Math.random() * companies.length)]}`;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const value = Math.floor(Math.random() * 8000) + 500;
        
        // Data retroativa aleatória entre hoje e 180 dias atrás
        const daysAgo = Math.floor(Math.random() * 180);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        await db.prepare(`
          INSERT INTO leads (id, name, email, phone, source, status, created_at, is_fake, custom_fields)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `).run(
          id, 
          name, 
          `${name.toLowerCase().replace(' ', '.')}@${company.toLowerCase().replace(' ', '')}.com.br`, 
          `(11) 9${Math.floor(10000000 + Math.random() * 90000000)}`, 
          source, 
          status, 
          createdAt.toISOString(),
          true, // IS_FAKE = TRUE
          JSON.stringify({ value, notes: `Demonstração: Interesse em ${company}`, business: company })
        );
        
        // Criar agendamentos para alguns leads (50% de chance)
        if (Math.random() > 0.5) {
          const apptId = Math.random().toString(36).substr(2, 9);
          const apptDate = new Date(createdAt);
          apptDate.setDate(apptDate.getDate() + 2); // Agendamento 2 dias após criação
          
          await db.prepare(`
            INSERT INTO appointments (id, client_id, title, start_time, end_time, is_fake)
            VALUES ($1, $2, $3, $4, $5, $6)
          `).run(apptId, id, `Reunião: ${name}`, apptDate.toISOString(), apptDate.toISOString(), true);
        }

        // Criar assinaturas para leads convertidos (Fechado)
        if (status === 'Fechado') {
          const subId = Math.random().toString(36).substr(2, 9);
          const planId = 'plan-premium'; // Assumindo que este ID existe ou injetando plan mock
          await db.prepare(`
            INSERT INTO subscriptions (id, client_id, plan_id, status, is_fake)
            VALUES ($1, $2, $3, $4, $5)
          `).run(subId, id, planId, 'active', true);
        }

        insertedCount++;
      }

      res.json({ success: true, message: `Excelente! ${insertedCount} leads profissionais injetados com histórico temporal.` });
    } catch (error: any) {
      console.error('🔥 [SEED_ERROR] Falha na injeção:', error);
      res.status(500).json({ error: "Falha ao injetar dados profissionais" });
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

startServer();
