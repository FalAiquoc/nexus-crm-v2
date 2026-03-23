import React, { useState } from 'react';
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
  Loader2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MockupGenerator } from '../components/MockupGenerator';

type IntegrationStatus = 'connected' | 'disconnected' | 'syncing' | 'error';
type Category = 'all' | 'communication' | 'marketing' | 'productivity';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: Category;
  status: IntegrationStatus;
  icon: React.ElementType;
  color: string;
  lastSync?: string;
}

const mockIntegrations: Integration[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sincronize seus agendamentos, reuniões e lembretes bidirecionalmente.',
    category: 'productivity',
    status: 'connected',
    icon: Calendar,
    color: 'text-blue-500',
    lastSync: 'Há 5 min'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Envie mensagens automáticas, lembretes e atenda clientes diretamente pelo CRM.',
    category: 'communication',
    status: 'connected',
    icon: MessageCircle,
    color: 'text-emerald-500',
    lastSync: 'Agora mesmo'
  },
  {
    id: 'instagram',
    name: 'Instagram Direct',
    description: 'Responda directs, menções nos stories e automatize o primeiro contato.',
    category: 'communication',
    status: 'disconnected',
    icon: Instagram,
    color: 'text-pink-500'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Crie bots de atendimento e envie notificações para grupos ou canais.',
    category: 'communication',
    status: 'disconnected',
    icon: Send,
    color: 'text-sky-400'
  },
  {
    id: 'meta-ads',
    name: 'Meta Ads',
    description: 'Capture leads nativos do Facebook e Instagram diretamente para o seu funil.',
    category: 'marketing',
    status: 'connected',
    icon: Facebook,
    color: 'text-blue-600',
    lastSync: 'Há 1 hora'
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Acompanhe conversões de formulários e otimize suas campanhas de pesquisa.',
    category: 'marketing',
    status: 'disconnected',
    icon: Target,
    color: 'text-red-500'
  }
];

export function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const filteredIntegrations = integrations.filter(int => {
    const matchesSearch = int.name.toLowerCase().includes(search.toLowerCase()) || 
                          int.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || int.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConnect = (id: string) => {
    setConnectingId(id);
    // Simulate connection process
    setTimeout(() => {
      setIntegrations(integrations.map(int => 
        int.id === id ? { ...int, status: 'connected', lastSync: 'Agora mesmo' } : int
      ));
      setConnectingId(null);
    }, 2000);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(integrations.map(int => 
      int.id === id ? { ...int, status: 'disconnected', lastSync: undefined } : int
    ));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link2 className="text-primary" size={28} />
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Integrações</h1>
            <p className="text-text-sec mt-1">Conecte o Nexus CRM às suas ferramentas favoritas.</p>
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
            { id: 'communication', label: 'Comunicação' },
            { id: 'marketing', label: 'Marketing & Ads' },
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
          {filteredIntegrations.map((integration) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              key={integration.id}
              className={`bg-bg-sidebar rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden group ${
                integration.status === 'connected' 
                  ? 'border-primary/30 shadow-[0_0_15px_rgba(201,168,76,0.05)]' 
                  : 'border-border-color hover:border-hover-color'
              }`}
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-bg-main border border-border-color flex items-center justify-center ${integration.color} shadow-inner`}>
                    <integration.icon size={24} />
                  </div>
                  
                  {integration.status === 'connected' ? (
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
                
                <h3 className="text-lg font-bold text-text-main mb-2">{integration.name}</h3>
                <p className="text-sm text-text-sec leading-relaxed line-clamp-3">
                  {integration.description}
                </p>
              </div>

              <div className="p-4 border-t border-border-color bg-bg-main/50 flex items-center justify-between mt-auto">
                <div className="text-xs text-text-sec">
                  {integration.status === 'connected' && integration.lastSync ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Sincronizado: {integration.lastSync}
                    </span>
                  ) : (
                    <span>Pronto para conectar</span>
                  )}
                </div>
                
                {integration.status === 'connected' ? (
                  <button 
                    onClick={() => handleDisconnect(integration.id)}
                    className="text-xs font-bold text-text-sec hover:text-rose-500 transition-colors uppercase tracking-wider"
                  >
                    Desconectar
                  </button>
                ) : (
                  <button 
                    onClick={() => handleConnect(integration.id)}
                    disabled={connectingId === integration.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-bg-main rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-70"
                  >
                    {connectingId === integration.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        Conectar
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-20 bg-bg-sidebar rounded-2xl border border-border-color">
          <Link2 size={48} className="mx-auto text-hover-color mb-4" />
          <h3 className="text-xl font-bold text-text-main mb-2">Nenhuma integração encontrada</h3>
          <p className="text-text-sec">Tente buscar com outros termos ou limpe os filtros.</p>
        </div>
      )}

      <div className="bg-bg-sidebar border border-border-color p-6 rounded-2xl flex items-center justify-between mt-8">
        <div>
          <h4 className="font-bold text-text-main mb-1">API Personalizada (Webhooks)</h4>
          <p className="text-sm text-text-sec">Receba leads de qualquer sistema via POST request.</p>
        </div>
        <button className="p-3 bg-bg-main text-primary rounded-xl border border-border-color hover:border-primary/50 transition-colors">
          <ExternalLink size={20} />
        </button>
      </div>

      <MockupGenerator 
        pageName="Integrations" 
        promptDescription="A grid of integration cards (Google Calendar, WhatsApp, Meta Ads, etc). Each card has an icon, description, and a connect/disconnect button. Status badges show if it's active." 
      />
    </div>
  );
}
