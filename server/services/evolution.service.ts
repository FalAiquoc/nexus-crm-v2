/**
 * Serviço de integração com Evolution API v2
 * Documentação: https://docs.evolutionfoundation.com.br
 */

interface EvolutionConfig {
  apiUrl: string;
  globalApiKey: string;
}

interface InstanceConfig {
  instanceName: string;
  apiKey: string;
}

interface SendMessagePayload {
  number: string;
  text: string;
  options?: {
    delay?: number;
    presence?: 'composing' | 'recording' | 'available';
  };
}

interface CreateInstancePayload {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  integration?: string;
  reject_call?: boolean;
  groups_ignore?: boolean;
  always_online?: boolean;
  read_messages?: boolean;
  read_status?: boolean;
  sync_full_history?: boolean;
}

interface WebhookConfig {
  webhook: {
    enabled: boolean;
    url: string;
    events?: string[];
    webhook_by_events?: boolean;
    webhook_base64?: boolean;
  };
}

export class EvolutionService {
  private config: EvolutionConfig;

  constructor() {
    this.config = {
      apiUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8081',
      globalApiKey: process.env.EVOLUTION_GLOBAL_API_KEY || ''
    };
  }

  /**
   * Configura a URL e API Key global
   */
  configure(apiUrl?: string, globalApiKey?: string) {
    if (apiUrl) this.config.apiUrl = apiUrl;
    if (globalApiKey) this.config.globalApiKey = globalApiKey;
  }

  /**
   * Health check da Evolution API
   */
  async healthCheck(): Promise<{ status: string; message?: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/`, {
        method: 'GET',
        headers: {
          'apikey': this.config.globalApiKey
        }
      });

      if (response.ok) {
        return { status: 'online', message: 'Evolution API está conectada' };
      }
      return { status: 'offline', message: 'Falha na conexão com Evolution API' };
    } catch (error: any) {
      return { status: 'offline', message: error.message || 'Evolution API indisponível' };
    }
  }

  /**
   * Cria uma nova instância WhatsApp
   * Formato validado para Evolution API v2.1.1
   */
  async createInstance(payload: CreateInstancePayload): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.globalApiKey
      },
      body: JSON.stringify({
        instanceName: payload.instanceName,
        token: payload.token || payload.instanceName,
        qrcode: payload.qrcode !== false,
        integration: payload.integration || 'WHATSAPP-BAILEYS',
        reject_call: payload.reject_call ?? false,
        groups_ignore: payload.groups_ignore ?? false,
        always_online: payload.always_online ?? true,
        read_messages: payload.read_messages ?? true,
        read_status: payload.read_status ?? false,
        sync_full_history: payload.sync_full_history ?? false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.response?.message?.join(', ') || error.message || 'Falha ao criar instância');
    }

    return response.json();
  }

  /**
   * Lista todas as instâncias
   */
  async listInstances(): Promise<any[]> {
    const response = await fetch(`${this.config.apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': this.config.globalApiKey
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao listar instâncias');
    }

    return response.json();
  }

  /**
   * Conecta uma instância (gera QR Code)
   */
  async connectInstance(instanceName: string): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': this.config.globalApiKey
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha ao conectar instância');
    }

    return response.json();
  }

  /**
   * Desconecta uma instância
   */
  async disconnectInstance(instanceName: string): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': this.config.globalApiKey
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao desconectar instância');
    }

    return response.json();
  }

  /**
   * Deleta uma instância
   */
  async deleteInstance(instanceName: string): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': this.config.globalApiKey
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao deletar instância');
    }

    return response.json();
  }

  /**
   * Obtém o status de uma instância
   */
  async getInstanceStatus(instanceName: string): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': this.config.globalApiKey
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao obter status da instância');
    }

    return response.json();
  }

  /**
   * Envia mensagem de texto via WhatsApp
   */
  async sendTextMessage(instance: InstanceConfig, payload: SendMessagePayload): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/message/sendText/${instance.instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': instance.apiKey
      },
      body: JSON.stringify({
        number: payload.number.replace(/\D/g, ''),
        text: payload.text,
        options: payload.options || {}
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha ao enviar mensagem');
    }

    return response.json();
  }

  /**
   * Envia mensagem com botão (buttons)
   */
  async sendButtonMessage(instance: InstanceConfig, payload: any): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/message/sendButtons/${instance.instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': instance.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha ao enviar mensagem com botões');
    }

    return response.json();
  }

  /**
   * Envia mensagem com lista (list)
   */
  async sendListMessage(instance: InstanceConfig, payload: any): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/message/sendList/${instance.instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': instance.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha ao enviar lista');
    }

    return response.json();
  }

  /**
   * Envia mídia (imagem, documento, etc.)
   */
  async sendMediaMessage(instance: InstanceConfig, payload: any): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/message/sendMedia/${instance.instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': instance.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha ao enviar mídia');
    }

    return response.json();
  }

  /**
   * Configura webhook de uma instância
   * Formato validado para Evolution API v2.1.1
   */
  async setWebhook(instanceName: string, config: WebhookConfig): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.globalApiKey
      },
      body: JSON.stringify({
        webhook: {
          enabled: config.webhook.enabled !== false,
          url: config.webhook.url,
          events: config.webhook.events || [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CONNECTION_UPDATE',
            'SEND_MESSAGE'
          ],
          webhook_by_events: config.webhook.webhook_by_events ?? false,
          webhook_base64: config.webhook.webhook_base64 ?? false
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.response?.message?.join(', ') || error.message || 'Falha ao configurar webhook');
    }

    return response.json();
  }

  /**
   * Obtém configuração do webhook de uma instância
   */
  async getWebhook(instanceName: string): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/webhook/find/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': this.config.globalApiKey
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao obter configuração do webhook');
    }

    return response.json();
  }

  /**
   * Busca contatos/conversas de uma instância
   */
  async findChats(instanceName: string): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/chat/findChats/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': this.config.globalApiKey
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao buscar conversas');
    }

    return response.json();
  }

  /**
   * Envia presença (composing, recording, etc.)
   */
  async sendPresence(instance: InstanceConfig, payload: {
    number: string;
    presence: 'composing' | 'recording' | 'available';
    delay?: number;
  }): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}/chat/sendPresence/${instance.instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': instance.apiKey
      },
      body: JSON.stringify({
        number: payload.number.replace(/\D/g, ''),
        presence: payload.presence,
        delay: payload.delay || 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha ao enviar presença');
    }

    return response.json();
  }
}

export const evolutionService = new EvolutionService();
