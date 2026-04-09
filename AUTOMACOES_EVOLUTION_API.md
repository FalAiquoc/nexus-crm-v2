# 📱 Nexus CRM v2 - Agentes e Automações com Evolution API

## 🎯 Resumo da Implementação

Esta documentação cobre a implementação completa de agentes e automações integradas com a **Evolution API v2** para envio/recebimento de mensagens WhatsApp.

---

## 📦 O que foi Implementado

### 1. **Schema SQL Atualizado** (`setup_supabase.sql`)

#### Novas Tabelas Criadas:

| Tabela | Descrição |
|--------|-----------|
| `automation_rules` | Regras de automação com steps JSON, config de integração e flag `is_mock` |
| `whatsapp_instances` | Instâncias WhatsApp (Evolution API) com status, API keys e webhooks |
| `whatsapp_messages` | Log completo de mensagens enviadas/recebidas com metadata |
| `automation_logs` | Histórico de execuções de automações com status e erros |

#### Campos Importantes em `automation_rules`:
```sql
- id TEXT PRIMARY KEY
- name VARCHAR(255)
- trigger_name VARCHAR(255) -- Ex: "Lead Criado", "WhatsApp Recebido"
- status VARCHAR(50) -- 'active' | 'paused'
- steps JSONB -- Array de steps do workflow
- integration_config JSONB -- Configurações da instância WhatsApp
- is_mock BOOLEAN -- Flag para dados de sandbox
- last_run TIMESTAMP
```

---

### 2. **Serviço Evolution API** (`server/services/evolution.service.ts`)

Cliente HTTP completo para integração com Evolution API v2.

#### Métodos Disponíveis:

| Método | Descrição |
|--------|-----------|
| `healthCheck()` | Verifica se Evolution API está online |
| `createInstance()` | Cria nova instância WhatsApp |
| `listInstances()` | Lista todas as instâncias |
| `connectInstance()` | Gera QR Code para conexão |
| `disconnectInstance()` | Desconecta instância |
| `deleteInstance()` | Remove instância permanentemente |
| `sendTextMessage()` | Envia mensagem de texto |
| `sendButtonMessage()` | Envia mensagem com botões |
| `sendListMessage()` | Envia lista de opções |
| `sendMediaMessage()` | Envia imagem/documento |
| `setWebhook()` | Configura webhook de instância |
| `findChats()` | Lista conversas ativas |
| `sendPresence()` | Envia "digitando..." ou "gravando..." |

#### Configuração via Variáveis de Ambiente:
```env
EVOLUTION_API_URL=http://localhost:8081
EVOLUTION_GLOBAL_API_KEY=sua_chave_global
EVOLUTION_INSTANCE_NAME=nexus-crm
EVOLUTION_INSTANCE_API_KEY=chave_da_instancia
BACKEND_URL=http://localhost:3001
```

---

### 3. **Motor de Execução de Automações** (`server/services/automation.engine.ts`)

Engine que executa workflows definidos como JSON.

#### Tipos de Steps Suportados:

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `trigger` | Gatilho inicial (descritivo) | "Lead Criado" |
| `action` | Ação executada | Enviar WhatsApp, Email, Atualizar Lead |
| `condition` | Condição if/else | "Se status == 'Novo Lead'" |
| `delay` | Espera temporizada | "Aguardar 2 dias" |
| `chain` | Chama outro workflow | Executar fluxo de follow-up |

#### Triggers Implementados:

```typescript
automationEngine.triggerLeadCreated(leadId)
automationEngine.triggerWhatsAppMessageReceived(instance, phone, message)
automationEngine.triggerLeadStatusChanged(leadId, oldStatus, newStatus)
```

#### Sistema de Variáveis:
Os steps podem usar variáveis no formato `{{variable_name}}`:
- `{{trigger_type}}` - Tipo do gatilho
- `{{trigger_payload}}` - Dados do trigger
- `{{timestamp}}` - Timestamp da execução

#### Exemplo de Workflow JSON:
```json
{
  "name": "Boas-vindas WhatsApp",
  "trigger_name": "Lead Criado",
  "steps": [
    {
      "id": "s1",
      "type": "trigger",
      "title": "Novo Lead",
      "description": "Quando um lead for criado"
    },
    {
      "id": "s2",
      "type": "action",
      "title": "Enviar WhatsApp",
      "description": "Mensagem de boas-vindas",
      "config": {
        "action_type": "whatsapp",
        "message": "Olá {{lead_name}}! Bem-vindo!"
      }
    }
  ]
}
```

---

### 4. **Endpoints da API**

#### WhatsApp / Evolution API:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/whatsapp/health` | GET | Health check da Evolution API |
| `/api/whatsapp/instances` | GET | Lista instâncias (Evolution + DB) |
| `/api/whatsapp/instances` | POST | Cria nova instância |
| `/api/whatsapp/instances/:id/connect` | POST | Conecta (gera QR Code) |
| `/api/whatsapp/instances/:id/disconnect` | POST | Desconecta instância |
| `/api/whatsapp/instances/:id` | DELETE | Deleta instância |
| `/api/whatsapp/instances/:id/webhook` | POST | Configura webhook |
| `/api/whatsapp/send-test` | POST | Envia mensagem de teste |
| `/api/whatsapp/messages` | GET | Lista mensagens (inbound/outbound) |

#### Automações:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/automation` | GET | Lista automações do usuário |
| `/api/automation` | POST | Cria automação |
| `/api/automation/:id` | PUT | Atualiza automação |
| `/api/automation/:id` | DELETE | Deleta automação |
| `/api/automation/generate` | POST | Gera workflow com IA (Gemini) |
| `/api/automation/logs` | GET | Lista logs de execução |

#### Webhooks (sem autenticação):

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/webhook/whatsapp` | POST | Recebe eventos da Evolution API |

---

### 5. **Frontend Atualizado**

#### Nova Página: `WhatsAppInstances.tsx`
- ✅ Dashboard de status da Evolution API
- ✅ CRUD completo de instâncias (criar, conectar, desconectar, deletar)
- ✅ Visualização de QR Code para conexão
- ✅ Configuração de webhook com 1 clique
- ✅ Envio de mensagem de teste
- ✅ Visualização de API key (com toggle show/hide)
- ✅ Cards de status por instância (conectado/desconectado/conectando)

#### Sidebar Atualizado:
- ✅ Novo item "WhatsApp" com ícone `MessageCircle`
- ✅ Posicionado após "Automação" para fácil acesso

---

### 6. **Modo Simulado (Sandbox) Atualizado**

O `db.ts` agora suporta:
- ✅ Dados mock de `automation_rules` com `integration_config`
- ✅ Dados mock de `whatsapp_instances`
- ✅ Dados mock de `whatsapp_messages`
- ✅ Dados mock de `automation_logs`
- ✅ Operações CRUD completas para todas as novas tabelas

---

## 🚀 Como Usar

### Passo 1: Configurar Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# Evolution API
EVOLUTION_API_URL=http://localhost:8081
EVOLUTION_GLOBAL_API_KEY=sua_chave_global_aqui
BACKEND_URL=http://localhost:3001
```

### Passo 2: Garantir que Evolution API está Rodando

Execute o script existente:
```bash
start_bot_whatsapp.bat
```

Isso sobe Redis + Evolution API na porta 8081.

### Passo 3: Aplicar Schema SQL no Banco

Execute no seu banco Supabase/PostgreSQL:
```bash
psql -U postgres -d seu_banco -f setup_supabase.sql
```

Ou aplique manualmente as tabelas novas.

### Passo 4: Iniciar o CRM

```bash
cd nexus-crm-v2
npm run dev
```

O servidor rodará em `http://localhost:3001`.

### Passo 5: Criar Instância WhatsApp

1. Acesse `http://localhost:3001`
2. Faça login
3. Clique em **WhatsApp** no sidebar
4. Clique em **Nova Instância**
5. Preencha nome e identificador
6. Clique em **Conectar** para gerar QR Code
7. Escaneie com seu WhatsApp mobile
8. Clique em **Webhook** para configurar eventos

### Passo 6: Criar Automação com WhatsApp

1. Acesse **Automação** no sidebar
2. Clique em **Novo Fluxo** ou **Criar com IA**
3. Descreva o fluxo desejado
4. A IA vai gerar os steps automaticamente
5. Nos steps de ação WhatsApp, configure:
   - `instance_name`: Nome da sua instância
   - `api_key`: API key da instância
   - `message`: Texto da mensagem (suporta variáveis `{{}}`)
6. Salve o fluxo

---

## 📋 Roadmap Original - Status

| Tarefa | Status | Detalhes |
|--------|--------|----------|
| ✅ Padronização Total do Seed | **CONCLUÍDO** | `automation_rules` com `is_mock` no db.ts |
| ✅ Finalização do CRUD de Automações | **CONCLUÍDO** | CRUD completo + toggle status |
| ✅ Integração do Cérebro de IA | **CONCLUÍDO** | Gemini 3 Flash com `thinkingLevel: HIGH` |
| ⚙️ Estabilização de Conectividade WhatsApp | **EM ANDAMENTO** | Proxy Evolution API implementado, falta teste em produção |

---

## 🔧 Próximos Passos Recomendados

1. **Testar Execução Real de Automações**
   - Criar um lead manualmente
   - Verificar se automação é disparada
   - Checar logs em `/api/automation/logs`

2. **Implementar Trigger no CREATE de Leads**
   - Adicionar chamada `automationEngine.triggerLeadCreated()` no endpoint `POST /api/leads`

3. **Adicionar Mais Ações**
   - Envio de email (SendGrid, AWS SES)
   - Criação de tarefas
   - Atualização de pipeline/stage

4. **Webhook Público**
   - Garantir que `BACKEND_URL` seja acessível pela Evolution API (ngrok ou domínio real)

5. **UI de Logs de Automação**
   - Criar página para visualizar execuções passadas
   - Mostrar success/fail rate
   - Permitir re-execução manual

---

## 🐛 Troubleshooting

### Evolution API Offline
```bash
# Verificar se containers estão rodando
docker ps | grep evolution

# Restart
docker restart evolution-api
```

### Webhook Não Recebe Eventos
```bash
# Verificar BACKEND_URL no .env
# Testar manualmente:
curl -X POST http://localhost:3001/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"event":"MESSAGES_UPSERT","data":{"key":{"instanceName":"test","remoteJid":"5511999999999@s.whatsapp.net"},"message":{"conversation":"teste"}}}'
```

### Automação Não Executa
```bash
# Ver logs do servidor
# Deve aparecer:
# 🚀 [AUTOMATION] Executando: Nome da Automação
# ⚙️ [AUTOMATION] Executando step X/Y: Nome do Step

# Checar logs no banco
SELECT * FROM automation_logs ORDER BY started_at DESC LIMIT 10;
```

---

## 📚 Referências

- [Evolution API Docs](https://docs.evolutionfoundation.com.br)
- [Evolution API GitHub](https://github.com/EvolutionAPI)
- [Google Gemini SDK](https://ai.google.dev/gemini-api/docs)

---

## 📄 Arquivos Criados/Modificados

### Novos Arquivos:
- ✅ `server/services/evolution.service.ts`
- ✅ `server/services/automation.engine.ts`
- ✅ `src/pages/WhatsAppInstances.tsx`

### Arquivos Modificados:
- ✅ `setup_supabase.sql` (adicionadas 4 tabelas + índices)
- ✅ `server.ts` (adicionados endpoints WhatsApp + webhook)
- ✅ `server/db.ts` (suporte a novas tabelas no mock)
- ✅ `src/App.tsx` (rota `/whatsapp`)
- ✅ `src/components/Sidebar.tsx` (item WhatsApp)
- ✅ `.env.example` (variáveis Evolution API)

---

**Implementado por:** Qwen Code  
**Data:** 9 de Abril de 2026  
**Versão:** 1.0.0
