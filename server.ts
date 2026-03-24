import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import db, { initializeDatabase } from "./server/db";
import { comparePassword, generateToken, verifyToken } from "./server/auth";

async function startServer() {
  // Ensure DB is ready
  await initializeDatabase();
  
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // ==========================================
  // AUTH ROUTES
  // ==========================================
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Credenciais inválidas" });
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
      console.error(error);
      res.status(500).json({ error: "Erro no servidor" });
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

  app.get("/api/auth/me", authenticate, async (req: any, res) => {
    try {
      const user = await db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(req.userId);
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

  // Leads / Contatos API
  app.get("/api/leads", authenticate, async (req, res) => {
    try {
      const leads = await db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
      const parsedLeads = leads.map((lead: any) => {
        const customFields = lead.custom_fields ? (typeof lead.custom_fields === 'string' ? JSON.parse(lead.custom_fields) : lead.custom_fields) : {};
        return {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status,
          value: customFields.value || 0,
          notes: customFields.notes || '',
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
      const stages = await db.prepare("SELECT * FROM stages WHERE pipeline_id = ? ORDER BY sort_order ASC").all(id);
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
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const customFields = { value: Number(value) || 0, notes: notes || '' };
      
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
        SET name = ?, email = ?, phone = ?, source = ?, status = ?, custom_fields = ?
        WHERE id = ?
      `);
      
      const customFields = { value: Number(value) || 0, notes: notes || '' };
      
      const info = await stmt.run(name, email, phone, source, status, JSON.stringify(customFields), id);
      
      // Use standard check for info.changes (SQLite) or rowsAffected (PG wrapper if added)
      // Our PG wrapper doesn't have it yet, so we'll just check if it fails or not.
      res.json({ id, name, email, phone, source, status, ...customFields });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
      await db.prepare("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?").run(value, key);
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
        VALUES (?, ?, ?, ?, ?, ?, ?)
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
        VALUES (?, ?, ?, ?)
      `).run(id, client_id, plan_id, next_billing_date);
      res.status(201).json({ id, client_id, plan_id, next_billing_date });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // VITE MIDDLEWARE (Frontend)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
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
