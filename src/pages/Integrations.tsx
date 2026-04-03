import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  Search, 
  Calendar, 
  MessageCircle, 
  Send, 
  Instagram, 
  Facebook, 
  Target, 
  CheckCircle2, 
  Plus,
  ArrowRight,
  ExternalLink,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { IntegrationModal, IntegrationModalConfig } from '../components/IntegrationModal';

type IntegrationStatus = 'connected' | 'disconnected' | 'syncing' | 'error';
type Category = 'all' | 'ai' | 'communication' | 'marketing' | 'productivity';

interface IntegrationDef {
  id: string; // The primary ID to associate
  name: string;
  description: string;
  category: Category;
  icon: React.ElementType;
  color: string;
  checkSettingsKey: string; // The key in settings to check if connected
  modalConfig: IntegrationModalConfig;
}

const integrationDefinitions: IntegrationDef[] = [
  // --- AI / LLMs ---
  {
    id: 'google-gemini',
    name: 'Google Gemini AI',
    description: 'Inteligência Artificial poderosa do Google. Padrão nativo com amplo Free Tier para startups.',
    category: 'ai',
    icon: Bot,
    color: 'text-blue-500',
    checkSettingsKey: 'gemini_api_key',
    modalConfig: {
      id: 'google-gemini',
      name: 'Google Gemini',
      icon: Bot,
      color: 'text-blue-500',
      type: 'api_key',
      instructions: 'Para utilizar o Google Gemini gratuitamente ou na versão Pro, acesse o Google AI Studio, crie um novo projeto e gere sua API Key.',
      docsUrl: 'https://aistudio.google.com/app/apikey',
      fields: [
        { key: 'gemini_api_key', label: 'API Key do Google Gemini', type: 'password', placeholder: 'AIzaSy...' }
      ]
    }
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    description: 'Integração com GPT-4o e GPT-3.5 para atendimento avançado e processamento de linguagem natural.',
    category: 'ai',
    icon: Bot,
    color: 'text-emerald-500',
    checkSettingsKey: 'openai_api_key',
    modalConfig: {
      id: 'openai',
      name: 'OpenAI ChatGPT',
      icon: Bot,
      color: 'text-emerald-500',
      type: 'api_key',
      instructions: 'Acesse a plataforma de desenvolvedores da OpenAI, adicione créditos à sua conta (Freemium/Pay-as-you-go) e crie uma nova Secret Key.',
      docsUrl: 'https://platform.openai.com/api-keys',
      fields: [
        { key: 'openai_api_key', label: 'OpenAI Secret Key', type: 'password', placeholder: 'sk-proj-...' }
      ]
    }
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Integração com Claude 3.5 Sonnet/Opus. Excelente para análise de contratos e funis jurídicos.',
    category: 'ai',
    icon: Bot,
    color: 'text-orange-500',
    checkSettingsKey: 'anthropic_api_key',
    modalConfig: {
      id: 'anthropic',
      name: 'Anthropic Claude',
      icon: Bot,
      color: 'text-orange-500',
      type: 'api_key',
      instructions: 'Acesse o console da Anthropic e gere sua API Key. Recomendado para análise textual complexa.',
      docsUrl: 'https://console.anthropic.com/settings/keys',
      fields: [
        { key: 'anthropic_api_key', label: 'Anthropic API Key', type: 'password', placeholder: 'sk-ant-...' }
      ]
    }
  },
  {
    id: 'groq',
    name: 'Groq (Open Source / Llama 3)',
    description: 'Incrível velocidade utilizando modelos abertos como Llama 3 via LPU. Possui Free Tier gigante.',
    category: 'ai',
    icon: Bot,
    color: 'text-rose-500',
    checkSettingsKey: 'groq_api_key',
    modalConfig: {
      id: 'groq',
      name: 'Groq (Llama Models)',
      icon: Bot,
      color: 'text-rose-500',
      type: 'api_key',
      instructions: 'GroqCloud oferece inferência ultra-rápida gratuita (com limites generosos) para Llama, Mixtral e Gemma. Acesse o console logando com Github ou Google e crie sua chave.',
      docsUrl: 'https://console.groq.com/keys',
      fields: [
        { key: 'groq_api_key', label: 'Groq API Key', type: 'password', placeholder: 'gsk_...' }
      ]
    }
  },

  // --- COMMUNICATION ---
  {
    id: 'whatsapp-evo',
    name: 'WhatsApp Business (Evo)',
    description: 'Envie mensagens automáticas e atenda clientes diretamente pelo CRM (via Evolution API).',
    category: 'communication',
    icon: MessageCircle,
    color: 'text-emerald-500',
    checkSettingsKey: 'whatsapp_evo_url',
    modalConfig: {
      id: 'whatsapp-evo',
      name: 'WhatsApp Business',
      icon: MessageCircle,
      color: 'text-emerald-500',
      type: 'webhook',
      instructions: 'Para integrar o WhatsApp não-oficial, insira a URL da sua Evolution API e o Global API Key (ou chave da instância).',
      docsUrl: 'https://evolution-api.com',
      fields: [
        { key: 'whatsapp_evo_url', label: 'Evolution API URL', type: 'text', placeholder: 'https://api.seudominio.com' },
        { key: 'whatsapp_evo_key', label: 'API Key (Global/Instância)', type: 'password', placeholder: 'Insira o token...' }
      ]
    }
  },
  {
    id: 'instagram',
    name: 'Instagram Direct',
    description: 'Responda directs, menções nos stories e automatize o primeiro contato.',
    category: 'communication',
    icon: Instagram,
    color: 'text-pink-500',
    checkSettingsKey: 'instagram_token',
    modalConfig: {
      id: 'instagram',
      name: 'Instagram Direct',
      icon: Instagram,
      color: 'text-pink-500',
      type: 'oauth',
      instructions: 'A integração direta via Meta requisita um longo processo ou uma ferramenta parceira terceira. Forneça o Webhook Token.',
      fields: [
        { key: 'instagram_token', label: 'Instagram Access Token', type: 'password', placeholder: 'IGQ...' }
      ]
    }
  },

  // --- MARKETING ---
  {
    id: 'meta-ads',
    name: 'Meta Ads',
    description: 'Capture leads nativos do Facebook e Instagram diretamente para o seu funil.',
    category: 'marketing',
    icon: Facebook,
    color: 'text-blue-600',
    checkSettingsKey: 'meta_ads_token',
    modalConfig: {
      id: 'meta-ads',
      name: 'Meta Ads',
      icon: Facebook,
      color: 'text-blue-600',
      type: 'api_key',
      instructions: 'Gere um token de acesso de sistema no App Dashboard do Meta para Facebook Lead Ads.',
      docsUrl: 'https://developers.facebook.com/docs/marketing-api/',
      fields: [
        { key: 'meta_ads_token', label: 'System User Token', type: 'password', placeholder: 'EAAB...' }
      ]
    }
  },
  
  // --- PRODUCTIVITY ---
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sincronize seus agendamentos, reuniões e lembretes bidirecionalmente.',
    category: 'productivity',
    icon: Calendar,
    color: 'text-blue-500',
    checkSettingsKey: 'gcal_token',
    modalConfig: {
      id: 'google-calendar',
      name: 'Google Calendar',
      icon: Calendar,
      color: 'text-blue-500',
      type: 'oauth',
      instructions: 'Você precisa autorizar o Nexus CRM a ler e escrever eventos no seu Google Calendar utilizando contas de serviço ou Oauth2.',
      fields: [
        { key: 'gcal_token', label: 'Refresh Token', type: 'password', placeholder: '1//...' }
      ]
    }
  }
];

export function Integrations() {
  const { settings, refreshData, updateSettings } = useApp();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [selectedConfig, setSelectedConfig] = useState<IntegrationModalConfig | null>(null);

  useEffect(() => {
    // Ensure we trigger a refresh of settings to get latest keys when opening integrations
    refreshData();
  }, []);

  const getStatus = (checkKey: string): IntegrationStatus => {
    // If we have any value saved for this key, it is connected.
    if (settings && settings[checkKey]) {
      return 'connected';
    }
    return 'disconnected';
  };

  const filteredIntegrations = integrationDefinitions.filter(int => {
    const matchesSearch = int.name.toLowerCase().includes(search.toLowerCase()) || 
                          int.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || int.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConnectClick = (config: IntegrationModalConfig) => {
    setSelectedConfig(config);
  };

  const handleSuccess = (id: string) => {
    refreshData(); // Refresh from API to update local state so badges change to connected
  };

  // Only to clear from DB to visually show disconnection
  const handleDisconnect = async (checkKeys: string[]) => {
    if (confirm("Tem certeza que deseja desconectar? Suas conversas ou automações podem parar.")) {
      try {
        // Here we ideally send a DEL or update to empty for all keys involved
        for (const key of checkKeys) {
            await updateSettings(key, '');
        }
        await refreshData();
      } catch (err) {
        console.error(err);
        alert('Erro ao desconectar');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link2 className="text-primary" size={28} />
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Integrações</h1>
            <p className="text-text-sec mt-1">Conecte o Nexus CRM às suas ferramentas, inclusive inteligência artificial.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-bg-card border border-border-color rounded-xl text-text-main font-bold hover:bg-hover-color/20 transition-all">
          <Plus size={20} />
          Solicitar Integração
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-bg-sidebar p-4 rounded-2xl border border-border-color">
        <div className="flex overflow-x-auto hide-scrollbar w-full md:w-auto gap-2 pb-2 md:pb-0">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'ai', label: 'Inteligência Artificial' },
            { id: 'communication', label: 'Comunicação' },
            { id: 'marketing', label: 'Marketing' },
            { id: 'productivity', label: 'Produtividade' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as Category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-text-sec hover:text-text-main hover:bg-bg-card border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" size={18} />
          <input 
            type="text" 
            placeholder="Buscar integrações..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-main border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredIntegrations.map((def) => {
            const status = getStatus(def.checkSettingsKey);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={def.id}
                className={`bg-bg-sidebar rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden group ${
                  status === 'connected' 
                    ? 'border-primary/30 shadow-[0_0_15px_rgba(201,168,76,0.05)]' 
                    : 'border-border-color hover:border-hover-color'
                }`}
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-bg-main border border-border-color flex items-center justify-center ${def.color} shadow-inner`}>
                      <def.icon size={24} />
                    </div>
                    
                    {status === 'connected' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 size={12} />
                        Conectado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-main text-text-sec border border-border-color text-[10px] font-bold uppercase tracking-wider">
                        Desconectado
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-text-main mb-2">{def.name}</h3>
                  <p className="text-sm text-text-sec leading-relaxed line-clamp-3">
                    {def.description}
                  </p>
                </div>

                <div className="p-4 border-t border-border-color bg-bg-main/50 flex items-center justify-between mt-auto">
                  <div className="text-xs text-text-sec">
                    {status === 'connected' ? (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Disponível
                      </span>
                    ) : (
                      <span>Pronto para conectar</span>
                    )}
                  </div>
                  
                  {status === 'connected' ? (
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => handleConnectClick(def.modalConfig)}
                        className="text-xs font-bold text-primary hover:text-primary/70 transition-colors uppercase tracking-wider"
                      >
                        Ajustar
                      </button>
                      <span className="text-border-color">|</span>
                      <button 
                        onClick={() => handleDisconnect(def.modalConfig.fields.map(f => f.key))}
                        className="text-xs font-bold text-text-sec hover:text-rose-500 transition-colors uppercase tracking-wider"
                      >
                        Desconectar
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleConnectClick(def.modalConfig)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-bg-main rounded-lg text-xs font-bold hover:bg-secondary transition-colors"
                    >
                      Conectar
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-20 bg-bg-sidebar rounded-2xl border border-border-color">
          <Link2 size={48} className="mx-auto text-hover-color mb-4" />
          <h3 className="text-xl font-bold text-text-main mb-2">Nenhuma integração encontrada</h3>
          <p className="text-text-sec">Tente buscar com outros termos ou limpe os filtros.</p>
        </div>
      )}

      {/* Custom Webhook Card */}
      <div className="bg-bg-sidebar border border-border-color p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between mt-8 gap-4">
        <div>
          <h4 className="font-bold text-text-main mb-1">API Personalizada (Webhooks)</h4>
          <p className="text-sm text-text-sec">Receba leads de qualquer sistema via POST request.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-bg-main text-primary rounded-xl border border-border-color hover:border-primary/50 transition-colors font-bold text-sm">
          Acessar Documentação da API <ExternalLink size={16} />
        </button>
      </div>

      <IntegrationModal 
        isOpen={selectedConfig !== null}
        onClose={() => setSelectedConfig(null)}
        config={selectedConfig}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
