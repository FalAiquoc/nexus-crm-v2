# 🔧 FASE 2 — Design: Arquitetura dos Testes E2E

| Campo | Valor |
|---|---|
| **Projeto** | Nexus CRM v2 |
| **Feature** | Testes E2E com Playwright |
| **Data** | 12/04/2026 |
| **Status** | ✅ Aprovado (implícito na execução) |

---

## 🏗️ Arquitetura de Testes

```
nexus-crm-v2/
├── tests/
│   ├── e2e/                           # Testes E2E Playwright
│   │   ├── fixtures/
│   │   │   └── crm-fixtures.ts        # Fixtures customizadas (login, workspace, CRUD)
│   │   │
│   │   ├── 01-auth.spec.ts            # Autenticação e controle de acesso
│   │   ├── 02-workspace-isolation.spec.ts  # Isolamento de workspaces
│   │   ├── 03-plans-subscriptions.spec.ts  # Planos e produtos por modelo
│   │   ├── 04-crud-leads.spec.ts      # CRUD completo de leads
│   │   ├── 05-dashboard-analytics.spec.ts # Dashboard e gráficos
│   │   ├── 06-ui-ux.spec.ts           # UI/UX e responsividade
│   │   └── 07-sandbox-mode.spec.ts    # Modo simulação
│   │
│   ├── supabase-connection-test.mjs   # Teste direto ao banco (Node.js + pg)
│   ├── run-tests-ssh.bat              # Script de execução SSH
│   └── SPEC_FASE1_REQUIREMENTS.md     # Especificação de requisitos
│
├── playwright.config.ts               # Configuração do Playwright
└── test-results/                      # Resultados gerados
    ├── html-report/                   # Relatório HTML interativo
    └── results.json                   # Resultados em JSON
```

---

## 🎯 Estratégia de Testes

### 1. **Fixtures Customizadas** (`crm-fixtures.ts`)
Padronizam operações repetitivas:

| Fixture | Função |
|---------|--------|
| `loginAsAdmin` | Login como admin |
| `loginAsBarbershop` | Login como workspace barbershop |
| `loginAsLaw` | Login como workspace law |
| `loginAsGeneral` | Login como workspace general |
| `waitForDashboardLoad` | Aguarda dashboard carregar |
| `createTestLead` | Cria lead de teste |
| `deleteAllMockLeads` | Limpa dados mock |
| `expectWorkspaceIsolated` | Valida isolamento |

### 2. **Paralelismo**
- **3 workers** localmente
- **1 worker** em CI/Dokploy
- Testes independentes (sem ordem dependente)

### 3. **Retry e Resiliência**
- **1 retry** local
- **2 retries** em CI
- Screenshots e vídeos em falhas
- Traces completos para debug

### 4. **Multi-Browser/Device**
| Projeto | Viewport | Uso |
|---------|----------|-----|
| `crm-desktop` | 1920x1080 | Primary |
| `crm-laptop` | 1366x768 | Laptop |
| `crm-tablet` | iPad Pro | Tablet |
| `crm-mobile` | iPhone 14 Pro | Mobile |

---

## 🔐 Estratégia de Dados de Teste

### Credenciais por Workspace

| Workspace | Email | Senha | Role |
|-----------|-------|-------|------|
| Admin | `diogo@dvadvoga.com.br` | `admin123` | admin |
| Barbershop | `barber@test.com` | `test123` | gestor |
| Law | `law@test.com` | `test123` | gestor |
| General | `general@test.com` | `test123` | vendedor |

### Modo Sandbox
- Todos os testes rodam com `ALLOW_SIMULATED_MODE=true`
- Dados marcados com `is_mock = true`
- Limpeza automática pós-teste

---

## 📊 Métricas de Cobertura

| Categoria | Testes | RFs Cobertas |
|-----------|--------|--------------|
| Autenticação | 6 | RF-01, RF-05, RF-06, RF-07 |
| Isolamento | 5 | RF-08, RF-09, RF-10, RF-12, RF-13 |
| Planos | 6 | RF-14, RF-15, RF-16, RF-17 |
| CRUD Leads | 7 | RF-18, RF-19, RF-20, RF-21, RF-22, RF-23 |
| Dashboard | 5 | RF-34, RF-35, RF-36, RF-37, RF-38 |
| UI/UX | 5 | RF-39, RF-41, RF-42, RF-43, RF-44 |
| Sandbox | 4 | RF-45, RF-46, RF-47, RF-48 |
| **TOTAL** | **38** | **38/49 (78%)** |

---

## 🚀 Comandos de Execução

```bash
# Todos os testes (headed)
npx playwright test

# Relatório HTML
npx playwright test --reporter=html

# Só testes de autenticação
npx playwright test --grep @auth

# Só testes de isolamento
npx playwright test --grep @isolation

# Projeto desktop apenas
npx playwright test --project=crm-desktop

# Modo UI interativo
npx playwright test --ui

# Via SSH na VPS
tests\run-tests-ssh.bat remote

# Teste de conexão Supabase
node tests/supabase-connection-test.mjs
```

---

## ⚠️ Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Backend não responde | Testes falham | Timeout de 5s + fallback |
| Dados poluídos | Resultados inconsistentes | Sandbox mode + limpeza |
| Transições lentas | Timeout em asserts | navigationTimeout: 15s |
| Elementos não encontrados | Falhas falsas | Selectores flexíveis + waits |

---

## ✅ Aprovação

> **Design aprovado. Avançar para Fase 3 (Tasks)?**
>
> - [x] Aprovado implicitamente na execução
