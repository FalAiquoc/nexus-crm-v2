# Central Barber - CRM para Barbearias e Estéticas

![Central Barber](https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=2074&ixlib=rb-4.0.3)

O **Central Barber** (ou **Nexus CRM**) é um sistema de CRM (Customer Relationship Management) moderno e responsivo, desenvolvido especificamente para atender às necessidades de barbearias e clínicas de estética (quando o modelo "Central Barber" está ativo) ou outros negócios de vendas gerais e advocacia. O sistema oferece uma interface intuitiva com tema escuro (dark mode), focada na gestão de clientes, agendamentos, assinaturas (clubes) e funil de vendas (Kanban).

## 📊 Análise de Conclusão do MVP (Minimum Viable Product)

**Status Atual do MVP: ~75% Concluído**

O frontend da aplicação está altamente desenvolvido, com interfaces ricas, navegação fluida e componentes responsivos. O foco principal para atingir 100% do MVP é a integração com um backend real (banco de dados e autenticação).

### Progresso por Módulo:
- **Interface e Navegação (UI/UX):** 100% (Com branding dinâmico baseado no modelo de negócio)
- **Autenticação (UI):** 100%
- **Dashboard e Métricas:** 90% (Aguardando dados reais)
- **Gestão de Clientes (Lista e Formulário):** 90% (Aguardando persistência)
- **Agenda e Horários:** 80% (Aguardando lógica de conflitos e banco de dados)
- **Kanban (Funil de Vendas):** 80% (Aguardando drag-and-drop persistente)
- **Assinaturas e Planos:** 70% (Aguardando gateway de pagamento)
- **Integração Backend/Banco de Dados:** 10% (Atualmente utilizando mocks/localStorage)

---

## 🚀 Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Vite
- **Estilização:** Tailwind CSS (com suporte a temas dinâmicos)
- **Ícones:** Lucide React
- **Animações:** Framer Motion (motion/react)
- **Roteamento/Estado:** React Hooks (useState, useEffect)

---

## 📋 Planejamento e Próximos Passos (Roadmap)

Abaixo está o checklist de melhorias e integrações necessárias para finalizar o projeto e prepará-lo para produção.

### Fase 1: Backend e Autenticação (Prioridade Alta)
- [ ] **Configuração do Backend:** Integrar com Firebase, Supabase ou Node.js + PostgreSQL.
- [ ] **Autenticação Real:** Implementar login, registro e recuperação de senha (JWT ou Firebase Auth).
- [ ] **Proteção de Rotas:** Garantir que apenas usuários autenticados acessem o painel.
- [ ] **Modelagem de Dados:** Criar schemas para Usuários, Clientes, Agendamentos, Planos e Tarefas.

### Fase 2: Funcionalidades Core (Prioridade Alta)
- [ ] **CRUD de Clientes:** Conectar o formulário de "Novo Cliente" e a lista de "Clientes" ao banco de dados.
- [ ] **Agenda Dinâmica:** Implementar criação, edição e exclusão de agendamentos com validação de horários disponíveis.
- [ ] **Kanban Funcional:** Salvar o estado dos cards (drag-and-drop) no banco de dados em tempo real.
- [ ] **Dashboard Real-time:** Alimentar os gráficos e métricas do Dashboard com dados reais do banco.

### Fase 3: Integrações e Pagamentos (Prioridade Média)
- [ ] **Gateway de Pagamento:** Integrar Stripe, Mercado Pago ou Asaas para gestão de assinaturas (Clube do Barbeiro).
- [ ] **Automação de WhatsApp:** Integrar API (ex: Evolution API, Z-API ou Twilio) para envio de lembretes de agendamento automáticos.
- [ ] **Notificações:** Implementar sistema de notificações in-app e push notifications.

### Fase 4: Refinamento e Deploy (Prioridade Baixa)
- [ ] **Testes E2E e Unitários:** Implementar testes com Cypress e Vitest.
- [ ] **Otimização de Performance:** Lazy loading de componentes e otimização de imagens.
- [ ] **PWA (Progressive Web App):** Configurar manifest e service workers para instalação no celular.
- [ ] **Deploy em Produção:** Configurar CI/CD e hospedar na Vercel, Netlify ou Cloud Run.

---

## 💡 Destaques do Projeto (Para Portfólio)

- **Design System Customizável:** O projeto permite a troca de temas (cores primárias, secundárias e gradientes) em tempo real através da página de configurações, utilizando variáveis CSS injetadas dinamicamente.
- **Branding Dinâmico:** O nome e a identidade visual do sistema se adaptam automaticamente ao modelo de negócio selecionado (ex: "Central Barber" para barbearias ou "Nexus CRM" para vendas gerais).
- **Arquitetura Baseada em Componentes:** Código limpo e modular, com separação clara de responsabilidades (Sidebar, TopBar, Páginas isoladas).
- **Responsividade Avançada:** Layout perfeitamente adaptado para dispositivos móveis, tablets e desktops, com menus retráteis e grids fluidos.
- **Foco na Experiência do Usuário (UX):** Utilização de animações suaves (Framer Motion) para transições de tela e feedback visual imediato em ações do usuário.

---

*Documentação gerada para acompanhamento de desenvolvimento e apresentação de portfólio.*
