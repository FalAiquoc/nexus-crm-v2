# Documento de Arquitetura (Fase 1)
**Projeto:** Plataforma CRM & Automação de Marketing (SaaS)

## 1.1 Módulos Principais do Sistema

A plataforma será dividida em três grandes pilares lógicos para garantir a modularidade:

**Pilar 1: CRM & Vendas (Core)**
*   **Gestão de Contatos e Empresas:** Base de dados centralizada, histórico de interações, deduplicação e campos customizados.
*   **Funil de Vendas (Pipelines):** Múltiplos funis, etapas customizáveis, regras de transição (campos obrigatórios), qualificação visual (estrelas).
*   **Gestão de Negociações (Deals):** Cards de oportunidade, atribuição de responsáveis, produtos/serviços vinculados, probabilidade de fechamento (forecast).
*   **Gestão de Tarefas e Atividades:** Agenda do vendedor, lembretes, registro de ligações, reuniões e e-mails.
*   **Gestão de Equipes e Permissões (RBAC):** Controle de acesso granular (Admin, Gestor de Vendas, Vendedor, Marketing).

**Pilar 2: Marketing & Aquisição**
*   **Landing Pages e Formulários:** Construtor de formulários embedáveis e páginas de captura.
*   **Gerenciador de Campanhas (Tráfego Pago):** Rastreamento de UTMs, atribuição de origem, cálculo de Custo por Lead (CPL).
*   **E-mail Marketing:** Criação de templates, disparos em massa, segmentação de listas, tracking de abertura/clique.

**Pilar 3: Automação & Inteligência**
*   **Automação de Marketing (Workflows):** Motor de regras (Gatilho -> Condição -> Ação) para réguas de relacionamento (nurturing), alertas internos e movimentação de funil.
*   **Lead Scoring & Tracking:** Pontuação dinâmica baseada em perfil (cargo, empresa) e interesse (abertura de e-mail, conversão em LP).
*   **Relatórios e Dashboards:** Análise de conversão do funil, ROI de campanhas, produtividade do time e previsão de receita (IA/Estatística).
*   **Integrações Externas:** Webhooks nativos, API REST aberta, conectores para WhatsApp, Meta/Google Ads e Calendários.

---

## 1.2 Entidades de Dados do Sistema (Dicionário Inicial)

Para garantir flexibilidade sem comprometer a performance, utilizaremos uma abordagem híbrida: colunas fixas para dados indexáveis e colunas JSONB para dados dinâmicos.

*   **Lead / Contato**
    *   *Campos:* `id` (UUID), `nome` (String), `email` (String, Unique), `telefone` (String), `origem` (String), `score` (Int), `status` (Enum: Lead, Qualificado, Cliente, Perdido), `tags` (Array de Strings), `custom_fields` (JSONB), `empresa_id` (FK, Nullable).
    *   *Validação:* E-mail obrigatório e válido. Telefone sanitizado.
*   **Empresa**
    *   *Campos:* `id` (UUID), `nome` (String), `cnpj` (String, Unique), `segmento` (String), `tamanho` (Enum), `endereco` (JSONB).
*   **Negociação (Deal)**
    *   *Campos:* `id` (UUID), `titulo` (String), `valor` (Decimal), `etapa_id` (FK), `responsavel_id` (FK), `probabilidade` (Int 0-100), `data_fechamento_esperada` (Date), `custom_fields` (JSONB).
    *   *Validação:* Valor >= 0. Probabilidade entre 0 e 100.
*   **Funil (Pipeline) & Etapas (Stages)**
    *   *Funil:* `id` (UUID), `nome` (String), `equipe_id` (FK), `is_default` (Boolean).
    *   *Etapa:* `id` (UUID), `funil_id` (FK), `nome` (String), `ordem` (Int), `campos_obrigatorios` (JSONB - lista de chaves exigidas para entrar na etapa).
*   **Tarefa**
    *   *Campos:* `id` (UUID), `tipo` (Enum: Call, Email, Meeting, Task), `data_vencimento` (DateTime), `responsavel_id` (FK), `negociacao_id` (FK, Nullable), `contato_id` (FK, Nullable), `status` (Enum: Pendente, Concluída).
*   **Campanha**
    *   *Campos:* `id` (UUID), `nome` (String), `canal` (String), `utm_source` (String), `utm_medium` (String), `utm_campaign` (String), `orcamento` (Decimal), `custo_atual` (Decimal).
*   **Automação (Workflow)**
    *   *Campos:* `id` (UUID), `nome` (String), `status` (Enum: Ativa, Inativa, Rascunho), `gatilho` (JSONB), `condicoes` (JSONB), `acoes` (JSONB).

---

## 1.3 Arquitetura Técnica Recomendada

A stack foi escolhida com foco em **alta performance, facilidade de contratação de equipe futura, e capacidade de rodar 100% self-hosted em Docker.**

1.  **Backend:** `Node.js` + `TypeScript`
    *   *Justificativa:* O ecossistema Node.js é imbatível para I/O assíncrono (essencial para webhooks, integrações e automações). O TypeScript garante segurança de tipos em um sistema complexo.
2.  **Frontend:** `React` + `Vite` + `TailwindCSS`
    *   *Justificativa:* Para um painel SaaS (dashboard), uma Single Page Application (SPA) com React + Vite oferece a navegação mais rápida e fluida. Tailwind permite estilização rápida e padronizada. (Next.js seria *over-engineering* para o painel autenticado, pois não precisamos de SEO no CRM).
3.  **Banco de Dados Principal:** `PostgreSQL`
    *   *Justificativa:* Robusto, ACID compliance e possui suporte nativo e indexável ao tipo `JSONB`. Isso elimina a necessidade do antipadrão EAV (Entity-Attribute-Value) para campos customizados, mantendo a performance altíssima.
4.  **Cache e Filas:** `Redis`
    *   *Justificativa:* Extremamente rápido. Servirá para cache de sessões, rate-limiting de APIs e como motor para o sistema de filas.
5.  **Mensageria / Background Jobs:** `BullMQ` (roda sobre o Redis)
    *   *Justificativa:* Em vez de adicionar a complexidade de um RabbitMQ ou Kafka agora, o BullMQ usa o Redis (que já teremos) e é perfeito para agendar disparos de e-mail, processar webhooks e rodar as automações em background com retentativas automáticas.
6.  **Serviço de E-mail:** `Nodemailer` (SMTP Genérico)
    *   *Justificativa:* O sistema se conectará a qualquer SMTP (Amazon SES, SendGrid, Mailgun ou um servidor Postfix próprio), garantindo zero dependência paga obrigatória.
7.  **Storage de Arquivos:** `MinIO`
    *   *Justificativa:* É um object storage 100% compatível com a API do Amazon S3, mas open-source e self-hosted via Docker. Perfeito para anexos de negociações e imagens de campanhas.
8.  **Autenticação:** `JWT` (Access Token) + `Refresh Token` (HttpOnly Cookie)
    *   *Justificativa:* Seguro, stateless para a API, e previne ataques XSS armazenando o refresh token em um cookie seguro. RBAC (Role-Based Access Control) será implementado via middlewares no backend.
9.  **API Gateway / Proxy Reverso:** `Traefik` (ou Nginx)
    *   *Justificativa:* Traefik integra nativamente com Docker, roteando o tráfego e gerando certificados SSL (Let's Encrypt) automaticamente para novos domínios ou subdomínios (útil para Landing Pages no futuro).
10. **Deploy:** `Docker Compose`
    *   *Justificativa:* Todo o ambiente (Postgres, Redis, MinIO, Backend, Frontend) subirá com um único comando `docker-compose up -d`, perfeitamente compatível com Dokploy ou qualquer VPS Ubuntu.
