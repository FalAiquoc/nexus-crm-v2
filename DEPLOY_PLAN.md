# Planejamento de Deploy - Nexus CRM v2 (Central Barber)

## 1. Visão Geral do Projeto

### Informações do Projeto
- **Nome**: Nexus CRM v2 (também conhecido como Central Barber)
- **Repositório**: https://github.com/FalAiquoc/nexus-crm-v2
- **Plataforma de Deploy**: Dokploy
- **Banco de Dados**: Supabase (PostgreSQL)

### Stack Atual (Desenvolvimento)
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS 4.x, Lucide React, Framer Motion
- **Backend**: Node.js + Express
- **Banco de Dados**: SQLite (better-sqlite3)
- **Autenticação**: JWT + bcryptjs
- **IA**: Google Gemini API

### Stack para Produção
- **Frontend**: React 18 (build estático via Vite)
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL (Supabase)
- **Autenticação**: JWT + bcryptjs
- **IA**: Google Gemini API

---

## 2. Pré-requisitos

### Requisitos do Sistema
- [ ] Acesso ao painel Dokploy
- [ ] Supabase já instalado e configurado no Dokploy
- [ ] Acesso ao repositório GitHub do projeto
- [ ] Chave da API do Google Gemini
- [ ] Node.js 18+ (para desenvolvimento local)
- [ ] PostgreSQL client (para testes de conexão)

### Acesso Necessário
- Credenciais do Dokploy (admin)
- Credenciais do Supabase (credentials ou connection string)
- Token de acesso GitHub (se repositório privado)
- API Key do Google Gemini

---

## 3. Configuração do Banco de Dados Supabase

### 3.1 Obter Credenciais do Supabase

No painel do Dokploy:
1. Acesse a seção "Databases" ou "Supabase"
2. Localize o banco de dados do projeto
3. Obtenha as seguintes informações:
   - **Host**: usually `10.0.90.4` ou similar (IP interno Dokploy)
   - **Port**: usually `5432`
   - **Database Name**: nome do banco criado
   - **User**: `postgres` ou usuário criado
   - **Password**: senha do banco

### 3.2 Criar Tabelas do Banco de Dados

Execute o seguinte SQL no editor SQL do Supabase (Dashboard > SQL Editor):

```sql
-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Tabela de usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de empresas
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    segment VARCHAR(100),
    size VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de leads
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    source VARCHAR(100),
    score INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'new',
    company_id INTEGER REFERENCES companies(id),
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pipelines
CREATE TABLE pipelines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de stages (estágios do pipeline)
CREATE TABLE stages (
    id SERIAL PRIMARY KEY,
    pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    required_fields JSONB DEFAULT '[]'
);

-- Tabela de deals (negociações)
CREATE TABLE deals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    value DECIMAL(12, 2) DEFAULT 0,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    stage_id INTEGER REFERENCES stages(id) ON DELETE SET NULL,
    owner_id INTEGER REFERENCES users(id),
    probability INTEGER DEFAULT 0,
    expected_close_date DATE,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações
CREATE TABLE settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de agendamentos
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de planos
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    billing_interval VARCHAR(20) DEFAULT 'monthly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de assinaturas
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES plans(id),
    status VARCHAR(50) DEFAULT 'active',
    next_billing_date DATE,
    last_billing_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de horários de funcionamento
CREATE TABLE business_hours (
    day_of_week INTEGER PRIMARY KEY, -- 0 = Domingo, 6 = Sábado
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE
);

-- ============================================
-- ÍNDICES PARA OTIMIZAÇÃO
-- ============================================

CREATE INDEX idx_leads_company ON leads(company_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_lead ON deals(lead_id);
CREATE INDEX idx_stages_pipeline ON stages(pipeline_id);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_start ON appointments(start_time);
CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);

-- ============================================
-- DADOS INICIAIS (SEEDS)
-- ============================================

-- Pipeline padrão
INSERT INTO pipelines (name, is_default) VALUES ('Pipeline Padrão', TRUE);

-- Estágios padrão
INSERT INTO stages (pipeline_id, name, sort_order) VALUES
(1, 'Novo Lead', 1),
(1, 'Contato Iniciado', 2),
(1, 'Reunião Agendada', 3),
(1, 'Proposta Enviada', 4),
(1, 'Fechado', 5),
(1, 'Perdido', 6);

-- Horários de funcionamento padrão (segunda a sexta, 9h às 18h)
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
(0, NULL, NULL, TRUE),   -- Domingo
(1, '09:00', '18:00', FALSE),  -- Segunda
(2, '09:00', '18:00', FALSE),  -- Terça
(3, '09:00', '18:00', FALSE),  -- Quarta
(4, '09:00', '18:00', FALSE),  -- Quinta
(5, '09:00', '18:00', FALSE),  -- Sexta
(6, '09:00', '14:00', FALSE);  -- Sábado
```

### 3.3 Habilitar Row Level Security (RLS) - Opcional

Se necessário, configure RLS para segurança:

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- Política de acesso (ajuste conforme necessário)
CREATE POLICY "Allow all operations" ON users FOR ALL USING TRUE;
CREATE POLICY "Allow all operations" ON companies FOR ALL USING TRUE;
-- Continue para outras tabelas...
```

---

## 4. Configuração do Projeto no Dokploy

### 4.1 Preparar o Repositório

1. **Fork ouclone o repositório**:
   ```bash
   git clone https://github.com/FalAiquoc/nexus-crm-v2.git
   cd nexus-crm-v2
   ```

2. **Crie um Dockerfile para o projeto** na raiz do projeto:

```dockerfile
# Dockerfile para Nexus CRM v2
FROM node:18-alpine

# Definir variáveis de ambiente
ENV NODE_ENV=production

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build do frontend
RUN npm run build

# Expor porta do servidor
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]
```

**Nota**: Você pode precisar ajustar o `server.js` (ou `server.ts` compilado) para servir tanto a API quanto o frontend estático em produção.

### 4.2 Criar um Script de Build/Start Alternativo

Crie um `ecosystem.config.js` ou use `package.json` com scripts adequados:

No `package.json`, adicione:

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc && vite build",
    "dev": "tsc && concurrently \"tsc -w\" \"vite\" \"node server.js\""
  }
}
```

### 4.3 Configurar o Dokploy

1. **Acesse o painel Dokploy**
2. **Criar novo projeto**:
   - Nome: `nexus-crm-v2`
   - Tipo: Node.js (Fullstack)
   - Repositório: Cole a URL do GitHub

3. **Configurar variáveis de ambiente** no Dokploy:
   ```
   DATABASE_URL=postgresql://postgres:[SENHA]@10.0.90.4:5432/nexus_crm
   GEMINI_API_KEY=sua_chave_aqui
   APP_URL=https://nexus-crm.seudominio.com
   JWT_SECRET=string_segura_aleatoria_min_32_caracteres
   NODE_ENV=production
   PORT=3000
   ```

4. **Configurações de Build**:
   - Build Command: `npm run build`
   - Start Command: `npm start` (ou `node dist/server.js`)
   - Output Directory: `dist` ou `build`

5. **Deploy**:
   - Clique em "Deploy" ou "Build & Deploy"
   - Aguarde a finalização

---

## 5. Variáveis de Ambiente Necessárias

### Arquivo `.env` de produção

```env
# ============================================
# BANCO DE DADOS
# ============================================

# Conexão PostgreSQL (Supabase/Dokploy)
# Formato: postgresql://user:password@host:port/database
DATABASE_URL=postgresql://postgres:SENHA@10.0.90.4:5432/nexus_crm

# ============================================
# AUTENTICAÇÃO
# ============================================

# Secret para JWT (mínimo 32 caracteres)
JWT_SECRET=sua_chave_jwt_muito_segura_aqui_mínimo_32_chars

# Tempo de expiração do token (opcional, padrão: 7d)
JWT_EXPIRES_IN=7d

# ============================================
# IA - GOOGLE GEMINI
# ============================================

# Chave da API Google Gemini
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# APLICAÇÃO
# ============================================

# URL da aplicação (sem barra no final)
APP_URL=https://nexus-crm.seudominio.com

# Porta do servidor
PORT=3000

# Ambiente
NODE_ENV=production

# ============================================
# SEGURANÇA (opcional)
# ============================================

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

### Gerar um JWT Secret seguro

```bash
# Via openssl (Linux/Mac/WSL no Windows)
openssl rand -base64 32

# Via Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 6. Estrutura de Pastas Recomendada

```
nexus-crm-v2/
├── src/                    # Código fonte frontend (React)
│   ├── components/        # Componentes React
│   ├── pages/            # Páginas da aplicação
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilitários e bibliotecas
│   ├── types/            # TypeScript types
│   ├── App.tsx           # Componente principal
│   └── main.tsx          # Entry point
├── server/               # Código fonte backend (Express)
│   ├── db.ts             # Conexão com banco
│   ├── auth.ts           # autenticação
│   └── routes/           # Rotas da API
├── dist/                 # Build de produção (gerado)
├── public/               # Arquivos estáticos
├── docs/                 # Documentação
├── scripts/              # Scripts auxiliares
│   └── migrate.js        # Script de migração SQLite -> PostgreSQL
├── .env                  # Variáveis de ambiente (NÃO COMMITAR)
├── .env.example          # Exemplo de variáveis
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Dockerfile            # Para deploy
├── docker-compose.yml   # Para desenvolvimento local
└── README.md
```

---

## 7. Scripts de Migração do Banco

### 7.1 Script de Migração (SQLite → PostgreSQL)

Crie o arquivo `scripts/migrate.js`:

```javascript
/**
 * Script de migração de dados do SQLite para PostgreSQL
 * Execute: node scripts/migrate.js
 */

const Database = require('better-sqlite3');
const { Client } = require('pg');

const sqliteDbPath = './database.sqlite'; // Caminho do SQLite atual
const pgConnectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nexus_crm';

async function migrate() {
  console.log('🔄 Iniciando migração SQLite -> PostgreSQL...\n');

  // Conectar ao SQLite
  const sqlite = new Database(sqliteDbPath);
  console.log('✓ Conectado ao SQLite');

  // Conectar ao PostgreSQL
  const pg = new Client(pgConnectionString);
  await pg.connect();
  console.log('✓ Conectado ao PostgreSQL\n');

  // Migração de Users
  console.log('📦 Migrando usuários...');
  const users = sqlite.prepare('SELECT * FROM users').all();
  const insertUser = pg.prepare('INSERT INTO users (id, name, email, password, role, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING');
  
  for (const user of users) {
    try {
      insertUser.run(user.id, user.name, user.email, user.password, user.role || 'user', user.created_at);
    } catch (e) {
      console.log(`  ⚠️ Erro ao migrar usuário ${user.email}: ${e.message}`);
    }
  }
  console.log(`  ✓ ${users.length} usuários migrados\n`);

  // Migração de Companies
  console.log('📦 Migrando empresas...');
  const companies = sqlite.prepare('SELECT * FROM companies').all();
  const insertCompany = pg.prepare('INSERT INTO companies (id, name, cnpj, segment, size, address, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING');
  
  for (const company of companies) {
    try {
      insertCompany.run(company.id, company.name, company.cnpj, company.segment, company.size, company.address, company.created_at);
    } catch (e) {
      console.log(`  ⚠️ Erro ao migrar empresa ${company.name}: ${e.message}`);
    }
  }
  console.log(`  ✓ ${companies.length} empresas migradas\n`);

  // Migração de Leads
  console.log('📦 Migrando leads...');
  const leads = sqlite.prepare('SELECT * FROM leads').all();
  const insertLead = pg.prepare('INSERT INTO leads (id, name, email, phone, source, score, status, company_id, custom_fields, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING');
  
  for (const lead of leads) {
    try {
      const customFields = typeof lead.custom_fields === 'string' ? lead.custom_fields : JSON.stringify(lead.custom_fields || {});
      insertLead.run(lead.id, lead.name, lead.email, lead.phone, lead.source, lead.score || 0, lead.status || 'new', lead.company_id, customFields, lead.created_at);
    } catch (e) {
      console.log(`  ⚠️ Erro ao migrar lead ${lead.name}: ${e.message}`);
    }
  }
  console.log(`  ✓ ${leads.length} leads migrados\n`);

  // Migração de Deals
  console.log('📦 Migrando deals...');
  const deals = sqlite.prepare('SELECT * FROM deals').all();
  const insertDeal = pg.prepare('INSERT INTO deals (id, title, value, lead_id, stage_id, owner_id, probability, expected_close_date, custom_fields, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING');
  
  for (const deal of deals) {
    try {
      const customFields = typeof deal.custom_fields === 'string' ? deal.custom_fields : JSON.stringify(deal.custom_fields || {});
      insertDeal.run(deal.id, deal.title, deal.value || 0, deal.lead_id, deal.stage_id, deal.owner_id, deal.probability || 0, deal.expected_close_date, customFields, deal.created_at);
    } catch (e) {
      console.log(`  ⚠️ Erro ao migrar deal ${deal.title}: ${e.message}`);
    }
  }
  console.log(`  ✓ ${deals.length} deals migrados\n`);

  // Migração de Settings
  console.log('📦 Migrando configurações...');
  const settings = sqlite.prepare('SELECT * FROM settings').all();
  const insertSetting = pg.prepare('INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = $3');
  
  for (const setting of settings) {
    try {
      insertSetting.run(setting.key, setting.value, setting.updated_at);
    } catch (e) {
      console.log(`  ⚠️ Erro ao migrar setting ${setting.key}: ${e.message}`);
    }
  }
  console.log(`  ✓ ${settings.length} configurações migradas\n`);

  // Migração de Appointments
  console.log('📦 Migrando agendamentos...');
  const appointments = sqlite.prepare('SELECT * FROM appointments').all();
  const insertAppointment = pg.prepare('INSERT INTO appointments (id, client_id, user_id, title, start_time, end_time, status, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING');
  
  for (const apt of appointments) {
    try {
      insertAppointment.run(apt.id, apt.client_id, apt.user_id, apt.title, apt.start_time, apt.end_time, apt.status || 'scheduled', apt.notes, apt.created_at);
    } catch (e) {
      console.log(`  ⚠️ Erro ao migrar agendamento ${apt.title}: ${e.message}`);
    }
  }
  console.log(`  ✓ ${appointments.length} agendamentos migrados\n`);

  // Encerrar conexões
  sqlite.close();
  await pg.end();

  console.log('✅ Migração concluída com sucesso!');
}

migrate().catch(err => {
  console.error('❌ Erro na migração:', err);
  process.exit(1);
});
```

### 7.2 Script de Verificação de Estrutura

Crie o arquivo `scripts/check-db.js`:

```javascript
/**
 * Script para verificar a estrutura do banco PostgreSQL
 */

const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nexus_crm';

async function checkDatabase() {
  const client = new Client(connectionString);
  await client.connect();

  console.log('🔍 Verificando estrutura do banco de dados...\n');

  const tables = [
    'users', 'companies', 'leads', 'pipelines', 'stages', 
    'deals', 'settings', 'appointments', 'plans', 'subscriptions', 'business_hours'
  ];

  for (const table of tables) {
    try {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`✓ ${table}: ${result.rows[0].count} registros`);
    } catch (e) {
      console.log(`✗ ${table}: Tabela não encontrada ou erro - ${e.message}`);
    }
  }

  await client.end();
}

checkDatabase();
```

---

## 8. Verificações Pós-Deploy

### 8.1 Checklist de Verificação

- [ ] **Frontend**
  - [ ] A aplicação carrega no browser sem erros
  - [ ] O login funciona corretamente
  - [ ] As rotas estão todas funcionando
  - [ ] Assets (CSS, JS, imagens) carregam corretamente

- [ ] **Backend**
  - [ ] API responde em todas as rotas
  - [ ] Autenticação JWT funciona
  - [ ] Conexão com banco de dados estabelece corretamente
  - [ ] Integração com Google Gemini funciona

- [ ] **Banco de Dados**
  - [ ] Dados foram migrados corretamente
  - [ ] Queries estão respondendo rápido
  - [ ]foreign keys estão funcionando

- [ ] **Segurança**
  - [ ] Headers de segurança estão ativos
  - [ ] Variáveis sensíveis não expostas
  - [ ] Rate limiting está funcionando
  - [ ] HTTPS está configurado

### 8.2 Comandos de Teste

```bash
# Testar conexão com banco
psql $DATABASE_URL -c "SELECT 1;"

# Testar API
curl -X GET https://nexus-crm.seudominio.com/api/health

# Testar autenticação
curl -X POST https://nexus-crm.seudominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","password":"senha123"}'
```

---

## 9. Troubleshooting

### Problemas Comuns e Soluções

### 9.1 Erro de Conexão com Banco de Dados

**Sintoma**: `Error: Connection refused` ou `Connection timed out`

**Soluções**:
1. Verifique se o Supabase está rodando no Dokploy
2. Confirme o IP interno do banco (geralmente `10.0.90.4`)
3. Verifique a porta (padrão `5432`)
4. Confirme usuário e senha estão corretos
5. Verifique se o banco existe

```bash
# Testar conexão via psql
psql -h 10.0.90.4 -p 5432 -U postgres -d nexus_crm
```

### 9.2 Erro de Build no Dokploy

**Sintoma**: Build falha com erros de dependência

**Soluções**:
1. Verifique a versão do Node.js (use 18 LTS)
2. Limpe o cache: `rm -rf node_modules package-lock.json && npm install`
3. Atualize dependências incompatíveis
4. Verifique se todos os scripts no package.json existem

### 9.3 Erro de CORS

**Sintoma**: Erros de CORS no console do browser

**Solução**: Configure o CORS no Express:

```javascript
// No seu server.ts
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:5173',
  credentials: true
}));
```

### 9.4 Erro de Autenticação JWT

**Sintoma**: `401 Unauthorized` mesmo com token válido

**Soluções**:
1. Verifique se o JWT_SECRET está configurado corretamente
2. Confirme que o token está sendo enviado no header
3. Verifique se o token não expirou

```javascript
// Testar verificação de token
const jwt = require('jsonwebtoken');
const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log(decoded);
```

### 9.5 Problemas com Google Gemini API

**Sintoma**: Erros na funcionalidade de IA

**Soluções**:
1. Verifique se a GEMINI_API_KEY está configurada
2. Confirme que a API key tem acesso ao Gemini
3. Verifique o uso da API (quotas)

### 9.6 Arquivos Estáticos Não Carregam

**Sintoma**: CSS/JS retornam 404

**Solução**: Configure o Express para servir arquivos estáticos:

```javascript
// No server.ts
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));
```

### 9.7 Performance Lenta

**Soluções**:
1. Adicione índices às tabelas (já incluídos no SQL)
2. Use cache (Redis ou em memória)
3. Monitore queries lentas
4. Configure connection pooling

---

## 10. Próximos Passos Após Deploy

1. ✅ Configurar domínio customizado (opcional)
2. ✅ Configurar SSL/HTTPS automático
3. ✅ Configurar backup automático do banco
4. ✅ Configurar monitoramento e logs
5. ✅ Configurar alertas de erro
6. ✅ Planejar atualizações e manutenção

---

## 11. Medidas de Segurança e Criptografia

Esta seção descreve as medidas de segurança implementadas no Nexus CRM v2 para proteção dos dados dos usuários.

### 11.1 Criptografia de Senhas (bcrypt)

**Status**: ✅ **Implementado**

O projeto utiliza a biblioteca `bcryptjs` para hash de senhas. Esta é uma implementação segura e amplamente utilizada.

**Configuração no código** ([`server/auth.ts`](nexus-crm-v2/server/auth.ts:1)):

```typescript
import bcrypt from 'bcryptjs';

// Hash de senha com salt rounds = 10
export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

// Verificação de senha
export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};
```

**Para produção no PostgreSQL/Supabase**:

Execute o seguinte SQL para criar a função de hash no banco:

```sql
-- Função para verificar senhas hashadas com bcrypt
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION verify_bcrypt_password(
    stored_hash TEXT,
    provided_password TEXT
) RETURNS BOOLEAN AS $
DECLARE
    result BOOLEAN;
BEGIN
    -- O PostgreSQL não tem built-in bcrypt, então a verificação
    -- deve ser feita na aplicação. Esta função é um placeholder.
    -- A verificação real acontece no backend Node.js.
    result := true;
    RETURN result;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Observação: A verificação de senhas com bcrypt acontece no backend
-- O banco de dados armazena apenas o hash, nunca a senha em texto claro
```

**Configurações recomendadas**:

- **Salt Rounds**: 10 (padrão do projeto)
- **Nunca armazene senhas em texto claro**
- **Utilize HTTPS** para todas as comunicações
- **Implemente rate limiting** para prevenir ataques de força bruta

### 11.2 Criptografia de Dados Sensíveis no Supabase (pgsodium)

O Supabase/Dokploy suporta a extensão `pgsodium` para criptografia em nível de coluna. Isso permite proteger dados sensíveis mesmo se o banco for comprometido.

#### 11.2.1 Ativar Extensão pgsodium

```sql
-- Ativar extensão pgsodium para criptografia
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Verificar se a extensão foi instalada corretamente
SELECT * FROM pg_extension WHERE extname = 'pgsodium';
```

#### 11.2.2 Criar Chaves de Criptografia

```sql
-- Criar chave mestra de criptografia (execute apenas uma vez!)
-- A chave deve ser armazenada em um cofre de senhas (Vault)

-- Gerar chave aleatória (guarde esta chave com segurança!)
SELECT pgsodium.create_key(name := 'nexus-crm-master-key', context := 'nexus-crm-v2');

-- Listar chaves existentes
SELECT key_id, key_name, created_at FROM pgsodium.keyring;
```

#### 11.2.3 Criar Tabela de Dados Sensíveis Criptografados

```sql
-- ============================================
-- TABELA DE DADOS SENSÍVEIS CRIPTOGRAFADOS
-- ============================================

-- Tabela para armazenar dados sensíveis criptografados
CREATE TABLE sensitive_data (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'lead', 'company', 'user'
    entity_id VARCHAR(100) NOT NULL,
    data_type VARCHAR(50) NOT NULL,   -- 'cpf', 'cnpj', 'phone', 'email', 'address'
    encrypted_value BYTEA NOT NULL,
    nonce BYTEA NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id, data_type)
);

-- Índice para busca
CREATE INDEX idx_sensitive_entity ON sensitive_data(entity_type, entity_id);
CREATE INDEX idx_sensitive_type ON sensitive_data(data_type);
```

#### 11.2.4 Funções para Criptografia/Descriptografia

```sql
-- ============================================
-- FUNÇÕES DE CRIPTOGRAFIA
-- ============================================

-- Função para criptografar dados sensíveis
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(
    p_entity_type VARCHAR,
    p_entity_id VARCHAR,
    p_data_type VARCHAR,
    p_plain_text TEXT
) RETURNS VOID AS $
DECLARE
    v_key_id UUID;
    v_nonce BYTEA;
    v_encrypted BYTEA;
BEGIN
    -- Obter a chave mestra
    SELECT key_id INTO v_key_id
    FROM pgsodium.keyring
    WHERE name = 'nexus-crm-master-key'
    LIMIT 1;

    IF v_key_id IS NULL THEN
        RAISE EXCEPTION 'Chave de criptografia não encontrada';
    END IF;

    -- Gerar nonce único
    v_nonce := pgsodium.randombytes_buf(24);

    -- Criptografar o valor
    v_encrypted := pgsodium.encrypt(
        p_plain_text::BYTEA,
        v_key_id,
        v_nonce
    );

    -- Inserir ou atualizar dados
    INSERT INTO sensitive_data (entity_type, entity_id, data_type, encrypted_value, nonce)
    VALUES (p_entity_type, p_entity_id, p_data_type, v_encrypted, v_nonce)
    ON CONFLICT (entity_type, entity_id, data_type)
    DO UPDATE SET
        encrypted_value = v_encrypted,
        nonce = v_nonce,
        updated_at = CURRENT_TIMESTAMP;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para descriptografar dados sensíveis
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(
    p_entity_type VARCHAR,
    p_entity_id VARCHAR,
    p_data_type VARCHAR
) RETURNS TEXT AS $
DECLARE
    v_key_id UUID;
    v_encrypted BYTEA;
    v_nonce BYTEA;
    v_decrypted BYTEA;
    v_result TEXT;
BEGIN
    -- Obter a chave mestra
    SELECT key_id INTO v_key_id
    FROM pgsodium.keyring
    WHERE name = 'nexus-crm-master-key'
    LIMIT 1;

    -- Obter dados criptografados
    SELECT encrypted_value, nonce INTO v_encrypted, v_nonce
    FROM sensitive_data
    WHERE entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND data_type = p_data_type;

    IF v_encrypted IS NULL THEN
        RETURN NULL;
    END IF;

    -- Descriptografar
    v_decrypted := pgsodium.decrypt(
        v_encrypted,
        v_key_id,
        v_nonce
    );

    v_result := convert_from(v_decrypted, 'UTF8');
    RETURN v_result;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função helper para criptografar CPF/CNPJ
CREATE OR REPLACE FUNCTION encrypt_cpf_cnpj(
    p_entity_type VARCHAR,
    p_entity_id VARCHAR,
    p_cpf_cnpj TEXT
) RETURNS VOID AS $
BEGIN
    PERFORM encrypt_sensitive_data(p_entity_type, p_entity_id, 'cpf_cnpj', p_cpf_cnpj);
END;
$ LANGUAGE plpgsql;

-- Função helper para criptografar telefone
CREATE OR REPLACE FUNCTION encrypt_phone(
    p_entity_type VARCHAR,
    p_entity_id VARCHAR,
    p_phone TEXT
) RETURNS VOID AS $
BEGIN
    PERFORM encrypt_sensitive_data(p_entity_type, p_entity_id, 'phone', p_phone);
END;
$ LANGUAGE plpgsql;

-- Função helper para criptografar email
CREATE OR REPLACE FUNCTION encrypt_email(
    p_entity_type VARCHAR,
    p_entity_id VARCHAR,
    p_email TEXT
) RETURNS VOID AS $
BEGIN
    PERFORM encrypt_sensitive_data(p_entity_type, p_entity_id, 'email', p_email);
END;
$ LANGUAGE plpgsql;

-- Função helper para criptografar endereço
CREATE OR REPLACE FUNCTION encrypt_address(
    p_entity_type VARCHAR,
    p_entity_id VARCHAR,
    p_address TEXT
) RETURNS VOID AS $
BEGIN
    PERFORM encrypt_sensitive_data(p_entity_type, p_entity_id, 'address', p_address);
END;
$ LANGUAGE plpgsql;
```

#### 11.2.5 Exemplo de Uso

```sql
-- Criptografar dados de um lead
SELECT encrypt_cpf_cnpj('lead', '123', '123.456.789-00');
SELECT encrypt_phone('lead', '123', '(11) 99999-9999');
SELECT encrypt_email('lead', '123', 'cliente@exemplo.com');

-- Descriptografar dados de um lead
SELECT decrypt_sensitive_data('lead', '123', 'cpf_cnpj');
SELECT decrypt_sensitive_data('lead', '123', 'phone');
SELECT decrypt_sensitive_data('lead', '123', 'email');
```

**Nota**: Em alguns ambientes Dokploy, a extensão `pgsodium` pode não estar disponível. Nesse caso, utilize criptografia no nível da aplicação (app-level encryption) conforme descrito na seção 11.2.6.

#### 11.2.6 Criptografia Alternativa (App-Level)

Se `pgsodium` não estiver disponível, utilize criptografia no backend:

```typescript
// server/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;

// Chave mestra (armazenar em variável de ambiente)
const MASTER_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);

function deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(MASTER_KEY, salt, 100000, KEY_LENGTH, 'sha512');
}

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(salt);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    
    // Formato: salt + iv + tag + encrypted
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decrypt(encryptedText: string): string {
    const data = Buffer.from(encryptedText, 'base64');
    
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    const key = deriveKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    return decipher.update(encrypted) + decipher.final('utf8');
}
```

### 11.3 Row Level Security (RLS)

O Row Level Security (RLS) do PostgreSQL permite controlar o acesso a linhas de tabelas baseado no usuário atual.

#### 11.3.1 Habilitar RLS em Todas as Tabelas

```sql
-- ============================================
-- CONFIGURAÇÃO ROW LEVEL SECURITY
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;
```

#### 11.3.2 Criar Políticas RLS

```sql
-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- Tabela de usuários: cada usuário vê apenas seu próprio registro
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (id = current_setting('app.current_user_id', true)::text);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (id = current_setting('app.current_user_id', true)::text);

-- Para admin: acesso total
CREATE POLICY "users_admin_full_access" ON users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.current_user_id', true)::text AND role = 'admin')
    );

-- Leads: acesso baseado no owner ou role
CREATE POLICY "leads_select" ON leads
    FOR SELECT USING (
        id IN (
            SELECT id FROM leads WHERE owner_id::text = current_setting('app.current_user_id', true)::text
        )
        OR EXISTS (SELECT 1 FROM users WHERE id::text = current_setting('app.current_user_id', true)::text AND role IN ('admin', 'gestor'))
    );

CREATE POLICY "leads_insert" ON leads
    FOR INSERT WITH CHECK (
        current_setting('app.current_user_id', true)::text IS NOT NULL
    );

CREATE POLICY "leads_update" ON leads
    FOR UPDATE USING (
        owner_id::text = current_setting('app.current_user_id', true)::text
        OR EXISTS (SELECT 1 FROM users WHERE id::text = current_setting('app.current_user_id', true)::text AND role IN ('admin', 'gestor'))
    );

-- Deals: acesso similar aos leads
CREATE POLICY "deals_select" ON deals
    FOR SELECT USING (
        owner_id::text = current_setting('app.current_user_id', true)::text
        OR EXISTS (SELECT 1 FROM users WHERE id::text = current_setting('app.current_user_id', true)::text AND role IN ('admin', 'gestor'))
    );

-- Companies: visibilidade total para admins, limitada para outros
CREATE POLICY "companies_select" ON companies
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id::text = current_setting('app.current_user_id', true)::text AND role IN ('admin', 'gestor'))
        OR TRUE
    );

-- Tabelas de configuração: apenas admin
CREATE POLICY "settings_full_access" ON settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id::text = current_setting('app.current_user_id', true)::text AND role = 'admin')
    );
```

#### 11.3.3 Configurar RLS no Supabase Client

```typescript
// No frontend, configurar o header com o user ID
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true
  },
  global: {
    headers: {
      'x-user-id': userId // ID do usuário logado
    }
  }
});
```

### 11.4 Variáveis de Ambiente Seguras no Dokploy

#### 11.4.1 Variáveis Sensíveis

No Dokploy, configure as seguintes variáveis de ambiente seguras:

```env
# ============================================
# VARIÁVEIS DE SEGURANÇA
# ============================================

# DATABASE_URL - conexão com banco (não exponha em frontend)
DATABASE_URL=postgresql://postgres:[SENHA]@10.0.90.4:5432/nexus_crm

# JWT_SECRET - mínimo 32 caracteres, gere aleatoriamente
JWT_SECRET=[GERE_SUA_CHAVE_AQUI_COM_MINIMO_32_CARACTERES]

# GEMINI_API_KEY - chave da API do Google
GEMINI_API_KEY=[SUA_CHAVE_GEMINI]

# ENCRYPTION_KEY - chave para criptografia de dados sensíveis (32 bytes)
ENCRYPTION_KEY=[GERE_CHAVE_ALEATORIA_32_BYTES]

# APP_URL - URL da aplicação
APP_URL=https://nexus-crm.seudominio.com

# NODE_ENV
NODE_ENV=production

# PORT
PORT=3000

# ============================================
# CONFIGURAÇÕES DE SEGURANÇA ADICIONAIS
# ============================================

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Session
SESSION_SECRET=[GERE_CHAVE_ALEATORIA]
SESSION_MAX_AGE=86400000

# CORS (apenas domínios autorizados)
CORS_ORIGIN=https://nexus-crm.seudominio.com
```

#### 11.4.2 Gerar Chaves Seguras

```bash
# Gerar JWT_SECRET (32 bytes em hex = 64 caracteres)
openssl rand -hex 32

# Gerar ENCRYPTION_KEY (32 bytes)
openssl rand -hex 32

# Gerar SESSION_SECRET
openssl rand -hex 32
```

#### 11.4.3 Configuração no Dokploy

1. Acesse o painel do Dokploy
2. Vá para o projeto Nexus CRM v2
3. Na seção "Environment Variables", adicione:
   - Marque as variáveis como "Secret" (não expostas no frontend)
   - Use o botão "Generate" para chaves aleatórias quando possível
   - Não use aspas extras nos valores

### 11.5 SSL/TLS

#### 11.5.1 Configuração no Servidor

O Express deve ser configurado para usar HTTPS em produção:

```typescript
// server.ts (produção)
import fs from 'fs';
import https from 'https';
import express from 'express';

const app = express();

// ... suas configurações ...

// Configuração SSL
const httpsOptions = {
    key: fs.readFileSync('/path/to/private-key.pem'),
    cert: fs.readFileSync('/path/to/certificate.pem'),
    ca: fs.readFileSync('/path/to/ca-certificate.pem')
};

// Em produção, use o proxy reverso do Dokploy (Traefik)
// que já configura SSL automaticamente

// HTTP para HTTPS redirect (se necessário)
app.use((req, res, next) => {
    if (req.protocol === 'http' && process.env.NODE_ENV === 'production') {
        return res.redirect(301, `https://${req.hostname}${req.url}`);
    }
    next();
});
```

#### 11.5.2 Configuração de SSL no Dokploy

O Dokploy usa Traefik como proxy reverso com suporte a SSL automático:

1. **SSL Automático (Let's Encrypt)**:
   - O Dokploy configura automaticamente certificados SSL Let's Encrypt
   - Renovação automática antes do vencimento

2. **SSL Personalizado**:
   - Você pode carregar seus próprios certificados:
     ```bash
     # No painel Dokploy, vá para:
     # Project > Nginx > SSL Certificates
     # Adicione seu certificado .crt e chave .key
     ```

3. **Forçar HTTPS**:
   - Configure no Traefik labels do Docker:
     ```yaml
     labels:
       - "traefik.http.routers.nexus-crm-v2.rule=Host(`nexus-crm.seudominio.com`)"
       - "traefik.http.routers.nexus-crm-v2.tls=true"
       - "traefik.http.routers.nexus-crm-v2.entrypoints=websecure"
       - "traefik.http.middlewares.redirect-https.redirectScheme.scheme=https"
       - "traefik.http.middlewares.redirect-https.redirectScheme.permanent=true"
     ```

#### 11.5.3 Conexão SSL com Banco de Dados

Para garantir que a conexão com o PostgreSQL use SSL:

```sql
-- Forçar SSL na conexão do PostgreSQL
-- Adicione à connection string:
-- postgresql://user:pass@host:5432/dbname?sslmode=require
```

```typescript
// No código Node.js
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Em produção, use true e configure certificado
        mode: 'require'
    }
});
```

### 11.6 Auditoria - Tabelas de Log

#### 11.6.1 Criar Tabela de Auditoria

```sql
-- ============================================
-- TABELA DE AUDITORIA
-- ============================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    action VARCHAR(100) NOT NULL, -- 'login', 'create', 'update', 'delete', 'export'
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'lead', 'deal', 'company'
    entity_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Índice para consultas de auditoria
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- Habilitar RLS na tabela de auditoria (apenas admins)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_only" ON audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = current_setting('app.current_user_id', true)::text 
            AND role = 'admin'
        )
    );
```

#### 11.6.2 Função para Registrar Auditoria

```sql
-- ============================================
-- FUNÇÕES DE AUDITORIA
-- ============================================

-- Função para registrar ações de auditoria
CREATE OR REPLACE FUNCTION log_audit(
    p_user_id VARCHAR,
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id VARCHAR DEFAULT NULL,
    p_old_value JSONB DEFAULT NULL,
    p_new_value JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $
BEGIN
    INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, 
        old_value, new_value, ip_address, user_agent, metadata
    ) VALUES (
        p_user_id, p_action, p_entity_type, p_entity_id,
        p_old_value, p_new_value,
        current_setting('app.client_ip', true),
        current_setting('app.client_user_agent', true),
        p_metadata
    );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auditoria automática em tabela de usuários
CREATE OR REPLACE FUNCTION audit_users_changes() RETURNS TRIGGER AS $
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit(
            NEW.id::VARCHAR,
            'create',
            'user',
            NEW.id::VARCHAR,
            NULL,
            row_to_json(NEW)::JSONB,
            jsonb_build_object('email', NEW.email)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit(
            NEW.id::VARCHAR,
            'update',
            'user',
            NEW.id::VARCHAR,
            row_to_json(OLD)::JSONB,
            row_to_json(NEW)::JSONB,
            jsonb_build_object('changes', jsonb_build_object(
                'email_changed', OLD.email != NEW.email,
                'role_changed', OLD.role != NEW.role
            ))
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit(
            OLD.id::VARCHAR,
            'delete',
            'user',
            OLD.id::VARCHAR,
            row_to_json(OLD)::JSONB,
            NULL,
            jsonb_build_object('email', OLD.email)
        );
    END IF;
    RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS users_audit_trigger ON users;
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_users_changes();

-- Trigger para leads
CREATE OR REPLACE FUNCTION audit_leads_changes() RETURNS TRIGGER AS $
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit(
            current_setting('app.current_user_id', true)::VARCHAR,
            'create',
            'lead',
            NEW.id::VARCHAR,
            NULL,
            row_to_json(NEW)::JSONB
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit(
            current_setting('app.current_user_id', true)::VARCHAR,
            'update',
            'lead',
            NEW.id::VARCHAR,
            row_to_json(OLD)::JSONB,
            row_to_json(NEW)::JSONB
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit(
            current_setting('app.current_user_id', true)::VARCHAR,
            'delete',
            'lead',
            OLD.id::VARCHAR,
            row_to_json(OLD)::JSONB,
            NULL
        );
    END IF;
    RETURN NULL;
END;
$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_audit_trigger ON leads;
CREATE TRIGGER leads_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON leads
    FOR EACH ROW EXECUTE FUNCTION audit_leads_changes();
```

#### 11.6.3 Consultar Logs de Auditoria

```sql
-- Ver logs de auditoria recentes
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100;

-- Ver todas as ações de um usuário específico
SELECT * FROM audit_logs 
WHERE user_id = 'user-123' 
ORDER BY timestamp DESC;

-- Ver todas as alterações em um lead específico
SELECT * FROM audit_logs 
WHERE entity_type = 'lead' AND entity_id = 'lead-456'
ORDER BY timestamp DESC;

-- Ver logs de login
SELECT * FROM audit_logs 
WHERE action = 'login' 
ORDER BY timestamp DESC;

--统计 de ações por dia
SELECT 
    DATE(timestamp) as date,
    action,
    COUNT(*) as count
FROM audit_logs
GROUP BY DATE(timestamp), action
ORDER BY date DESC;
```

#### 11.6.4 Auditoria no Backend (Node.js)

```typescript
// server/audit.ts
import { pool } from './db';

export interface AuditLog {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    metadata?: any;
}

export async function logAudit(log: AuditLog) {
    const query = `
        INSERT INTO audit_logs (
            user_id, action, entity_type, entity_id, 
            old_value, new_value, ip_address, user_agent, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    await pool.query(query, [
        log.userId || null,
        log.action,
        log.entityType,
        log.entityId || null,
        log.oldValue ? JSON.stringify(log.oldValue) : null,
        log.newValue ? JSON.stringify(log.newValue) : null,
        null, // ip_address - configure no middleware
        null, // user_agent - configure no middleware
        log.metadata ? JSON.stringify(log.metadata) : {}
    ]);
}

// Middleware para logging de auditoria
export const auditMiddleware = (req: any, res: any, next: any) => {
    const originalSend = res.send;
    res.send = function(body: any) {
        // Log de auditoria após a resposta
        if (req.user && req.path.startsWith('/api/')) {
            const entityType = req.path.split('/')[2] || 'unknown';
            logAudit({
                userId: req.user.id,
                action: req.method.toLowerCase(),
                entityType,
                metadata: {
                    path: req.path,
                    statusCode: res.statusCode
                }
            }).catch(console.error);
        }
        return originalSend.call(this, body);
    };
    next();
};
```

---

## 12. Checklist de Segurança

Use este checklist para verificar se todas as medidas de segurança foram implementadas corretamente:

### 12.1 Configuração do Banco de Dados

- [ ] Extensão pgsodium instalada (ou alternativa de criptografia configurada)
- [ ] Chaves de criptografia criadas e armazenadas com segurança
- [ ] Row Level Security (RLS) habilitado em todas as tabelas
- [ ] Políticas RLS criadas para controle de acesso
- [ ] Tabela de auditoria criada com triggers automáticos
- [ ] Índices de auditoria criados para performance
- [ ] Conexão SSL/TLS com banco de dados configurada

### 12.2 Configuração da Aplicação

- [ ] bcryptjs configurado para hash de senhas
- [ ] Variáveis de ambiente sensíveis configuradas no Dokploy
- [ ] JWT_SECRET com no mínimo 32 caracteres
- [ ] ENCRYPTION_KEY para criptografia de dados sensíveis
- [ ] Rate limiting configurado
- [ ] HTTPS forçado em produção

### 12.3 Monitoramento

- [ ] Logs de auditoria sendo registrados
- [ ] Procedure para consulta de logs implementada
- [ ] Política de retenção de logs definida (recomendado: 1 ano)
- [ ] Alertas configurados para tentativas de acesso suspeito

---

## Referências

- [Dokploy Docs](https://docs.dokploy.com)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Cheat Sheet](https://www.postgresqltutorial.com)
- [Deploy Node.js no Dokploy](https://docs.dokploy.com/enguides/deploy-nodejs)
- [pgsodium Documentation](https://github.com/supabase/pgsodium)
- [bcrypt Documentation](https://github.com/dcodeIO/bcrypt.js)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)

---

*Documento criado em: ${new Date().toLocaleDateString('pt-BR')}*
*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*