# 🚀 Planejamento e Status do MVP - Nexus CRM / Central Barber

Este documento detalha o status atual de desenvolvimento do projeto, a análise de conclusão do MVP (Minimum Viable Product) e o roadmap com os próximos passos. Ideal para acompanhamento e apresentação em portfólio no GitHub.

## 📊 Análise de Conclusão do MVP

**Status Atual: ~95% Concluído (BI Elite Edition)**

O projeto atingiu o patamar de plataforma de Business Intelligence (BI) de alta performance. A arquitetura foi refatorada para utilizar um Contexto Global (`AppContext`), com persistência via Supabase e modo Sandbox operacional.

### Progresso por Módulo
- 🟢 **UI/UX e Design System:** 100% (Temas dinâmicos, responsividade, animações)
- 🟢 **Branding Dinâmico (HUD):** 100% (Identidade do cliente no HUD vs Marca do Sistema no Menu)
- 🟢 **BI Intelligence:** 100% (KPIs de Barbearia/SaaS, IA Insights, Exportação)
- 🟢 **Arquitetura de Estado Global:** 100% (Implementação do `AppContext` e centralização de lógica)
- 🟢 **Navegação e Roteamento:** 100% (Sidebar Fixa, Transições Luxuosas de 550ms)
- 🟢 **Automação & CRM:** 95% (CRUD Leads, Fluxos de Automação com IA, Busca Debounced)
- 🟢 **Dashboard Sandbox:** 100% (Isolamento de dados fakes em ambiente de simulação)

---

## 📋 Checklist de Próximos Passos (Roadmap)

### Fase 1: Fundações e Automação (CONCLUÍDO)
- [x] Escolha da Stack: Supabase + Node.js.
- [x] Modelagem do Banco: Tabelas de leads, settings, appointments.
- [x] Automação com IA: Geração de fluxos via Gemini 3 Flash.
- [x] Sandbox Mode: Injeção e limpeza controlada de dados fakes.

### Fase 2: CRM & UX Evolution (CONCLUÍDO)
- [x] Busca Avançada: Implementação de debounce e filtros multi-campos.
- [x] Estabilidade de Layout: Correção de "layout shift" na Sidebar e TopBar.
- [x] Sidebar Fixa: Modo estático e transição aumentada para 550ms.
- [x] Branding Dinâmico: Nome da empresa no HUD, Marca principal na Sidebar.

### Fase 3: BI Profissional & Export (CONCLUÍDO)
- [x] Multi-Perspectiva: KPIs específicos para Barbearia (Rebooking) vs SaaS (MRR).
- [x] IA Insights Footer: Integração de análises automáticas em gráficos.
- [x] Exportação: Modal funcional para PDF e CSV com progresso.
- [x] Estética Premium: Tooltips Recharts dark-mode e fontes de alta densidade.

### Fase 4: Validação Final & Auditoria (EM ANDAMENTO)
- [x] Correção do Backend Hardening (Crash-only in Prod, Bloqueio de Mock)
- [x] Estabilização do Webhook Evolution API (resolução segura de keys/instâncias)
- [x] Patch do motor de automação (`trigger_name` vs `trigger`)
- [ ] Auditoria de Persistência (Check F5 em todos os módulos).
- [ ] Limpeza final de resquícios de dados fakes em produção.
- [ ] Documentação de Integração de API (Evolution API).
- [ ] Encerramento de Projeto e Backup Estrutural.

### Fase 5: Arquitetura Enterprise (Benchmark Top 3 Open Source e Top 3 White Label)
- [ ] **Alinhamento Arquitetural Open Source (Referência: Odoo, ERPNext, SuiteCRM):**
  - *Modo Dinâmico/EAV (Entity-Attribute-Value):* Transformar entidades estáticas em dinâmicas (Custom Fields robustos com suporte a FK indexadas, comum no Odoo).
  - *Event-Driven Queues:* Extrair o disparo do webhook do fluxo síncrono e jogar para filas assíncronas (ex: RabbitMQ/Redis) para evitar Timeout caso APIs de terceiros engasguem.
  - *Data Isolation Granular:* Melhorar as policies de RLS no Supabase herdando estruturas do ERPNext para multi-empresas (SaaS escalável real).
- [ ] **Evolução White Label Modular (Referência: GoHighLevel, ActiveCampaign, HubSpot):**
  - *Snapshots de Contas:* Capacidade do Workspace Master "clonar" assets (Funis de Venda, Configurações de Webhook, Modelos de Automação) para sub-workspaces, espelhando o GHL.
  - *Extensibilidade da API Pública:* Criação de um namespace `/openapi` protegido por Bearer Token do Cliente (JWT Client-Level) espelhando o padrão Pipedrive/HubSpot.
  - *Pipeline de Automação Visual:* Evoluir a interface de edição de Automações (`automation.engine.ts`) de listas JSON para manipulação orientada a Nós visuais e Actions assíncronas nativas.
- [ ] Preparo de Pipeline de Deploy Independente usando Github Actions para microsserviços.

---

## 💼 Notas para Portfólio (Destaques Técnicos)

1. **BI Elite Architecture:** Uso de Recharts com tooltips personalizados e slots dinâmicos para widgets de negócio específicos.
2. **IA-Driven Insights:** Componentes de rodapé que processam dados estatísticos e fornecem análises estratégicas via texto.
3. **Advanced State Management:** Uso de AppContext com sincronização entre LocalStorage e Banco de Dados (Settings).
4. **UX Premium:** Design focado em profissionais de alto nível, com micro-interações refinadas e transições cronometradas para passar luxo.
5. **Sandbox Infrastructure:** Sistema de isolamento de dados de teste que permite demonstração completa do sistema sem poluir o banco de produção.

## 🧪 Estratégia de Automação de Testes (E2E)

**Diretriz Arquitetural de Testes (E2E & Unit):** 
Testes locais e via Playwright **sempre** devem engatilhar o Modo Simulação (via API Admin ou Mocks) antes da injeção de dados. 
1. **Motivo:** Isso previne a gravação de Leads fictícios (ex: "Robô de Teste") no PostgreSQL de Produção, mantendo o Supabase 100% puro para métricas reais de Business Intelligence.
2. **Isolamento Confirmado:** As travas estritas (Hardening Prod) recém implementadas não bloqueiam a exclusão por `is_mock=true`, garantindo que eventuais testes de sandbox reais que caiam na base sejam drenados num clique. A arquitetura atual permite a demonstração sem contaminar faturamentos reais.
