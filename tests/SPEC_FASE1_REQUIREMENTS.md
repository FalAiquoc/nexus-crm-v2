# 📋 FASE 1 — Requirements: Testes E2E Nexus CRM v2

| Campo | Valor |
|---|---|
| **Projeto** | Nexus CRM v2 (CRM DoBoy) |
| **Feature/Escopo** | Testes E2E completos com Playwright - Validação de isolamento de workspaces, planos e funcionalidades |
| **Data** | 12/04/2026 |
| **Status** | ⏳ Aguardando Aprovação |
| **Solicitado por** | Diogo |

---

## 🎯 Objetivo Central

Criar suíte completa de testes E2E com **Playwright** para validar que o CRM DoBoy opera corretamente em **todos os 4 modelos de negócio** (Admin, Barbershop, Law, General), garantindo **isolamento total** entre workspaces, persistência de dados, funcionamento de planos/produtos por modelo, e integridade do banco Supabase via conexão MCP.

---

## ✅ Requisitos Funcionais

### 🔐 AUTENTICAÇÃO E USUÁRIOS
- [ ] RF-01: Login funcional para **usuário Admin** (role: admin)
- [ ] RF-02: Login funcional para **usuário Barbershop** (workspace: barbershop)
- [ ] RF-03: Login funcional para **usuário Law** (workspace: law)
- [ ] RF-04: Login funcional para **usuário General** (workspace: general)
- [ ] RF-05: Logout funcional com redirecionamento para /login
- [ ] RF-06: Proteção de rotas - usuário não-admin não acessa /users
- [ ] RF-07: Persistência de sessão via token JWT no localStorage

### 🏢 ISOLAMENTO DE WORKSPACES
- [ ] RF-08: Workspace Barbershop **NÃO** vê dados de Law/General/admin
- [ ] RF-09: Workspace Law **NÃO** vê dados de Barbershop/general/admin
- [ ] RF-10: Workspace General **NÃO** vê dados de Barbershop/law/admin
- [ ] RF-11: Cada workspace tem **gráficos diferentes** no Dashboard
  - Barbershop: Rebooking Rate, Ticket Médio, No-Show Rate
  - Law: Casos por Área, Tempo Médio, Taxa de Sucesso
  - General: Funil de Vendas, Velocidade do Pipeline, Conversão
- [ ] RF-12: `workspace_type` persiste após F5
- [ ] RF-13: Sidebar exibe nome correto do negócio por workspace

### 📦 PLANOS E PRODUTOS POR MODELO
- [ ] RF-14: Página /subscriptions exibe **planos específicos do workspace**
  - Barbershop: Planos de assinatura para barbearias
  - Law: Planos para escritórios de advocacia
  - General: Planos SaaS genéricos
- [ ] RF-15: Completude de planos - cada modelo tem seus campos customizados
- [ ] RF-16: CRUD de assinaturas funciona por workspace isolado
- [ ] RF-17: Planos de um workspace **NÃO** aparecem em outro

### 👥 CRUD DE LEADS/CLIENTES
- [ ] RF-18: Criar lead via formulário (/form)
- [ ] RF-19: Listar leads em tabela (/contacts)
- [ ] RF-20: Mover lead no Kanban (drag-and-drop)
- [ ] RF-21: Editar lead existente
- [ ] RF-22: Deletar lead com confirmação
- [ ] RF-23: Busca de leads com debounce funcional
- [ ] RF-24: Filtros por status, fonte, valor funcionam

### ⚡ AUTOMAÇÕES
- [ ] RF-25: Listar regras de automação (/automation)
- [ ] RF-26: Criar nova regra com triggers e actions
- [ ] RF-27: Ativar/desativar regra
- [ ] RF-28: Editar regra existente
- [ ] RF-29: Deletar regra
- [ ] RF-30: Visual builder de fluxos renderiza corretamente

### 📅 AGENDA E CALENDÁRIO
- [ ] RF-31: Página /calendar carrega sem erros
- [ ] RF-32: Criar agendamento
- [ ] RF-33: Visualizar agendamentos por dia/semana/mês

### 📊 DASHBOARD E ANALYTICS
- [ ] RF-34: Dashboard carrega com KPIs corretos do workspace
- [ ] RF-35: Filtros de data funcionam (Hoje, Semana, Mês, Total)
- [ ] RF-36: Gráficos renderizam com dados corretos
- [ ] RF-37: Analytics page carrega sem erros
- [ ] RF-38: Export modal funciona (PDF, CSV)

### 🎨 UI/UX E RESPONSIVIDADE
- [ ] RF-39: Sidebar colapsa/expand funciona
- [ ] RF-40: Menu mobile funciona (hamburger)
- [ ] RF-41: Temas dinâmicos aplicam corretamente (ouro-negro, etc.)
- [ ] RF-42: Transições de página suaves (motion)
- [ ] RF-43: Toast notifications aparecem em ações CRUD
- [ ] RF-44: Loading states exibidos durante fetch de dados

### 🛡️ MODO SIMULAÇÃO (SANDBOX)
- [ ] RF-45: Banner de sandbox aparece quando ativo
- [ ] RF-46: Ativar/desativar sandbox funciona
- [ ] RF-47: Dados fakes são inseridos/removidos corretamente
- [ ] RF-48: Sandbox mode persiste após F5
- [ ] RF-49: `is_mock = true` em dados de simulação

---

## 🛡️ Requisitos Não-Funcionais

- [ ] RNF-01: **Performance** - Cada teste E2E deve executar em <30s
- [ ] RNF-02: **Isolamento** - Cada teste deve rodar independentemente (sem ordem dependente)
- [ ] RNF-03: **Cobertura** - Mínimo 90% das rotas testadas
- [ ] RNF-04: **Relatório** - HTML report gerado ao final da execução
- [ ] RNF-05: **Paralelismo** - Testes devem rodar em paralelo quando possível
- [ ] RNF-06: **Retry** - Testes com falha devem retry automático (2x)
- [ ] RNF-07: **Screenshots** - Captura automática em caso de falha
- [ ] RNF-08: **SSH** - Capacidade de executar testes remotamente via SSH na VPS
- [ ] RNF-09: **MCP Supabase** - Testar conexão direta ao banco para validar dados

---

## 🚫 Fora do Escopo (Out of Scope)

- Testes unitários de componentes individuais (foco em E2E)
- Testes de performance/load testing
- Testes de segurança/pentest
- Integração com Evolution API (será mockada)
- Testes de envio real de WhatsApp/email

---

## ⚠️ Restrições

- **Stack**: Playwright + TypeScript + Test Runner built-in
- **Ambiente**: CRM rodando em `https://crm.dvadvoga.com.br` (produção) + localhost:3001 (dev)
- **Dados**: Usar modo sandbox para não poluir dados reais
- **SSH**: Conexão via `root@72.61.222.243` com chave `~/.ssh/id_ed25519`
- **Supabase**: Auto-hosted no Dokploy - testar via SQL queries diretas
- **Navegadores**: Chromium primário (Desktop), Firefox/WebKit opcional
- **Modo**: Headless para CI, headed para debug local

---

## 📎 Referências

- `nexus-crm-v2/src/types.ts` - Tipos TypeScript do CRM
- `nexus-crm-v2/server/db.ts` - Lógica de banco e modo simulado
- `nexus-crm-v2/docker-compose.yml` - Configuração de deploy
- `nexus-crm-v2/src/context/AppContext.tsx` - Estado global e persistência
- `supabase_compose.yml` - Stack Supabase local

---

## ✍️ Aprovação

> **Para avançar para a FASE 2 (Design), o usuário deve aprovar este documento.**
>
> - [ ] Aprovado por: _______________
> - [ ] Data da aprovação: _______________
