import express from "express";
import path from "path";
import db, { initializeDatabase, isSimulatedMode } from "./server/db";
import { comparePassword, generateToken, verifyToken } from "./server/auth";

async function startServer() {
  // Ensure DB is ready
  await initializeDatabase();
  
  const app = express();
  const PORT = process.env.PORT || 3001;

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

  app.delete("/api/admin/requests/:id", authenticate, adminOnly, async (req, res) => {
    const { id } = req.params;
    try {
      await db.prepare("DELETE FROM access_requests WHERE id = $1").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Falha ao remover solicitação" });
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
        INSERT INTO leads (id, name, email, phone, source, status, custom_fields)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `);
      
      const customFields = { ...req.body };
      delete customFields.name; delete customFields.email; delete customFields.phone; delete customFields.source; delete customFields.status;

      await stmt.run(id, name, email, phone, source || 'Manual', status || 'Novo Lead', JSON.stringify(customFields));
      
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
