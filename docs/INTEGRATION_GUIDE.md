# 📡 Guia de Integração: Evolution API v2 & WhatsApp

Este documento descreve como operar a integração de mensageria do Nexus CRM v2 (Central Barber) com a Evolution API.

## 1. Visão Geral da Arquitetura
A integração funciona através de um **Backend Proxy** localizado no servidor do CRM, que faz a ponte entre a interface do usuário e a instância da Evolution API.

- **Modelo**: API REST v2
- **Protocolo**: HTTPS
- **Segurança**: Bearer Token (API Key da Instância)

## 2. Fluxo de Conectividade (Warmup)
Para garantir estabilidade, o sistema implementa um fluxo de "Warmup" de **15 segundos** ao iniciar ou parear uma instância.

### Passo a Passo:
1. Acesse o menu **Integrações**.
2. Clique no botão **"Parear WhatsApp"**.
3. Aguarde a geração do QR Code (processo leva ~5-10 segundos).
4. Escaneie com seu aparelho.
5. **CRÍTICO**: O sistema aguardará a confirmação da Evolution API antes de liberar o status como "Conectado".

## 3. Automação e IA Insights
As mensagens recebidas via Evolution API são processadas pelo motor de IA (Gemini 3 Flash) seguindo estas regras:

- **Detecção de Intenção**: Identifica se o cliente quer agendar, cancelar ou tirar dúvidas.
- **Inserção no CRM**: Leads vindos do WhatsApp são automaticamente inseridos com a tag `source: WhatsApp`.
- **Sandbox Mode**: Se o modo Sandbox estiver ativo, as mensagens simuladas não disparam webhooks reais para evitar spam.

## 4. Configurações Técnicas (.env)
Certifique-se de que as seguintes variáveis estão configuradas no seu ambiente Dokploy:

```env
EVOLUTION_API_URL=https://api.sua-instancia.com
EVOLUTION_API_KEY=sua_global_key_aqui
WHATSAPP_INSTANCE_NAME=nexus_production
```

## 5. Troubleshooting
- **QR Code não aparece**: Verifique se a URL da Evolution API está acessível via rede interna do Dokploy.
- **Status "Desconectado" após scan**: Aguarde 15 segundos; a sincronização de sessão da Evolution v2 pode levar alguns ciclos de polling.
- **Erro 429**: Muitas tentativas de reconexão. O CRM implementa um debounce de 30 segundos entre tentativas.

---
*Nexus CRM v2 - BI Elite Edition | 2026*
