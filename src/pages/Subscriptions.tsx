import { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, Filter, MoreVertical, CheckCircle2, AlertCircle, Clock, Trash2, Edit2, Zap, Scissors, Building2, X, MessageSquare, Calendar } from 'lucide-react';
import { Subscription, Plan, Client } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

interface Automation {
  id: string;
  title: string;
  description: string;
  message: string;
  timing: string;
  active: boolean;
}

export function Subscriptions() {
  const { settings } = useApp();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: 'pre_due',
      title: 'Lembrete Pré-Vencimento',
      description: 'Envia mensagem 3 dias antes do vencimento.',
      message: 'Olá {cliente}, passando para lembrar que sua assinatura do plano {plano} vence em 3 dias. Evite interrupções no serviço!',
      timing: '3 dias antes',
      active: true
    },
    {
      id: 'post_due',
      title: 'Cobrança de Atraso',
      description: 'Envia mensagem no dia seguinte ao vencimento.',
      message: 'Olá {cliente}, notamos que sua assinatura do plano {plano} está pendente. O link para pagamento é: {link_pagamento}. Podemos ajudar?',
      timing: '1 dia depois',
      active: true
    }
  ]);

  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);

  const isBarbershop = settings.workspace_type === 'barbershop';

  const barbershopPlans = [
    {
      id: 'plan_tesoura',
      name: 'Plano Tesoura (Básico)',
      price: 49.90,
      billing_interval: 'monthly',
      description: 'Gestão de agenda, clientes e financeiro básico. Sem integrações externas.',
      features: ['Agenda Ilimitada', 'Gestão de Clientes', 'Controle Financeiro Básico', 'Suporte por Email']
    },
    {
      id: 'plan_maquina',
      name: 'Plano Máquina (Pro)',
      price: 129.90,
      billing_interval: 'monthly',
      description: 'Tudo do básico + Automação de WhatsApp e Agendamento Online.',
      features: ['Tudo do Plano Tesoura', 'Lembretes via WhatsApp', 'Agendamento Online (Link)', 'Relatórios Avançados', 'Suporte Prioritário']
    }
  ];

  const genericPlans = [
    {
      id: 'plan_starter',
      name: 'Starter CRM',
      price: 99.90,
      billing_interval: 'monthly',
      description: 'Gestão de funil, contatos e tarefas. Ideal para autônomos.',
      features: ['Funil de Vendas', 'Gestão de Contatos', 'Tarefas e Lembretes', 'Suporte por Email']
    },
    {
      id: 'plan_pro',
      name: 'Pro CRM',
      price: 249.90,
      billing_interval: 'monthly',
      description: 'Automações, integrações e múltiplos usuários.',
      features: ['Tudo do Starter', 'Automação de WhatsApp', 'Integração Meta/Google Ads', 'Até 5 Usuários', 'Suporte Prioritário']
    }
  ];

  const displayPlans = isBarbershop ? barbershopPlans : genericPlans;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('nexus_token');
      const [subsRes] = await Promise.all([
        fetch('/api/subscriptions', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      
      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubscriptions(subsData);
      }
      // Using local mock plans for demonstration based on workspace
      setPlans(displayPlans as Plan[]);
    } catch (err) {
      console.error('Failed to fetch subscription data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Assinaturas Ativas', value: subscriptions.filter(s => s.status === 'active').length, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Atrasadas/Pendentes', value: subscriptions.filter(s => s.status === 'past_due' || s.status === 'unpaid').length, icon: AlertCircle, color: 'text-red-500' },
    { label: 'Receita Recorrente', value: `R$ ${subscriptions.reduce((acc, s) => acc + (s.plan_price || 0), 0).toLocaleString()}`, icon: CreditCard, color: 'text-primary' },
  ];

  const handleToggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(auto => 
      auto.id === id ? { ...auto, active: !auto.active } : auto
    ));
  };

  const handleEditAutomation = (automation: Automation) => {
    setSelectedAutomation({ ...automation });
    setIsAutomationModalOpen(true);
  };

  const handleSaveAutomation = () => {
    if (selectedAutomation) {
      setAutomations(prev => prev.map(auto => 
        auto.id === selectedAutomation.id ? selectedAutomation : auto
      ));
      setIsAutomationModalOpen(false);
      setSelectedAutomation(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight italic serif">Clube de Assinaturas</h1>
          <p className="text-text-sec mt-1">Gerencie seus planos recorrentes e cobranças automáticas.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center justify-center gap-2 bg-bg-card hover:bg-border-color text-text-main px-6 py-2.5 rounded-xl font-semibold transition-all border border-border-color">
            <Zap size={20} className="text-primary" />
            Configurar Automação
          </button>
          <button className="flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-bg-main px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20">
            <Plus size={20} />
            Nova Assinatura
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-bg-sidebar p-6 rounded-2xl border border-border-color shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon size={48} className={stat.color} />
            </div>
            <p className="text-sm text-text-sec font-medium">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-bg-sidebar rounded-2xl border border-border-color overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-border-color flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-main/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente ou plano..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-main/40 border border-border-color rounded-xl py-2.5 pl-10 pr-4 text-text-main focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 rounded-xl bg-bg-main/40 border border-border-color text-text-sec hover:text-text-main transition-all">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-main/40 text-text-sec text-xs uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Próximo Vencimento</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                  </td>
                </tr>
              ) : filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-bg-card transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {sub.client_name?.charAt(0)}
                      </div>
                      <span className="font-medium text-text-main">{sub.client_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-bg-card text-xs text-text-sec border border-border-color">
                      {sub.plan_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                      sub.status === 'past_due' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {sub.status === 'active' ? 'Ativo' : sub.status === 'past_due' ? 'Atrasado' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-sec">
                    {new Date(sub.next_billing_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">
                    R$ {sub.plan_price?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredSubscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-sec">
                    Nenhuma assinatura encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-sidebar rounded-2xl border border-border-color p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-text-main mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-primary" />
              Automações de Cobrança (WhatsApp)
            </div>
            <span className="text-xs font-normal text-text-sec bg-bg-main px-2 py-1 rounded border border-border-color">
              API Ativa
            </span>
          </h3>
          <div className="space-y-4">
            {automations.map((auto) => (
              <div 
                key={auto.id}
                onClick={() => handleEditAutomation(auto)}
                className="p-4 rounded-xl bg-bg-card border border-border-color flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-main group-hover:text-primary transition-colors">{auto.title}</p>
                    <Edit2 size={12} className="text-text-sec opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-text-sec">{auto.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] bg-bg-main text-text-sec px-1.5 py-0.5 rounded border border-border-color flex items-center gap-1">
                      <Clock size={10} />
                      {auto.timing}
                    </span>
                    {auto.active && (
                      <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        Ativo
                      </span>
                    )}
                  </div>
                </div>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleAutomation(auto.id);
                  }}
                  className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${auto.active ? 'bg-primary' : 'bg-border-color'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${auto.active ? 'right-0.5' : 'left-0.5'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-sidebar rounded-2xl border border-border-color p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-text-main mb-6 flex items-center gap-2">
            {isBarbershop ? <Scissors size={20} className="text-primary" /> : <Building2 size={20} className="text-primary" />}
            Planos Disponíveis ({isBarbershop ? 'Barbearia' : 'CRM'})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan: any) => (
              <div key={plan.id} className="p-5 rounded-xl bg-bg-main/20 border border-border-color hover:border-primary/30 transition-all flex flex-col h-full">
                <p className="text-xs font-bold text-text-sec uppercase tracking-widest">{plan.billing_interval === 'monthly' ? 'Mensal' : 'Anual'}</p>
                <h4 className="font-bold text-text-main mt-1 text-lg">{plan.name}</h4>
                <p className="text-3xl font-black text-primary mt-2">R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-text-sec mt-3 mb-4 flex-1">{plan.description}</p>
                
                <ul className="space-y-2 mb-6">
                  {plan.features?.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-text-main">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className="w-full py-2.5 bg-bg-card border border-border-color text-text-main rounded-lg font-semibold hover:bg-primary hover:text-bg-main hover:border-primary transition-all mt-auto">
                  Assinar Plano
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Automation Edit Modal */}
      <AnimatePresence>
        {isAutomationModalOpen && selectedAutomation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-bg-sidebar w-full max-w-lg rounded-3xl border border-border-color shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-color flex items-center justify-between bg-bg-main/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-main">Editar Automação</h2>
                    <p className="text-xs text-text-sec">{selectedAutomation.title}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAutomationModalOpen(false)}
                  className="p-2 hover:bg-bg-main rounded-full text-text-sec transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} />
                    Template da Mensagem
                  </label>
                  <textarea 
                    value={selectedAutomation.message}
                    onChange={(e) => setSelectedAutomation({ ...selectedAutomation, message: e.target.value })}
                    rows={5}
                    className="w-full bg-bg-main border border-border-color rounded-xl p-4 text-sm text-text-main focus:outline-none focus:border-primary transition-all resize-none"
                    placeholder="Escreva a mensagem aqui..."
                  />
                  <p className="text-[10px] text-text-sec italic">
                    Use tags como {'{cliente}'}, {'{plano}'}, {'{valor}'}, {'{link_pagamento}'}.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} />
                      Tempo de Disparo
                    </label>
                    <input 
                      type="text"
                      value={selectedAutomation.timing}
                      onChange={(e) => setSelectedAutomation({ ...selectedAutomation, timing: e.target.value })}
                      className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-widest">Status</label>
                    <div 
                      onClick={() => setSelectedAutomation({ ...selectedAutomation, active: !selectedAutomation.active })}
                      className="flex items-center gap-3 cursor-pointer p-2.5 bg-bg-main border border-border-color rounded-xl"
                    >
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${selectedAutomation.active ? 'bg-primary' : 'bg-border-color'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${selectedAutomation.active ? 'right-0.5' : 'left-0.5'}`}></div>
                      </div>
                      <span className="text-sm text-text-main">{selectedAutomation.active ? 'Ativado' : 'Desativado'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-bg-main/20 border-t border-border-color flex gap-3">
                <button 
                  onClick={() => setIsAutomationModalOpen(false)}
                  className="flex-1 py-3 border border-border-color text-text-main rounded-xl font-bold hover:bg-bg-main transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveAutomation}
                  className="flex-1 py-3 bg-primary text-bg-main rounded-xl font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
