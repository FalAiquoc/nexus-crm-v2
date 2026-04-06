import { useState, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter,
  BarChart3,
  PieChart,
  UserPlus
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useApp } from '../context/AppContext';
import { Client } from '../types';
import { MockupGenerator } from '../components/MockupGenerator';

const COLORS = ['#D4AF37', '#B8860B', '#DAA520', '#C0C0C0', '#4A4A4A', '#8B4513'];

export function Dashboard() {
  const { clients: leads = [], subscriptions = [], appointments = [], isLoading } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // 📈 Cálculos de Funil e Métricas (Seguros contra nulos)
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const activeSubs = subscriptions.filter(s => s.status === 'active').length;
    const apptsCount = appointments.length;
    
    // Renda Mensal recorrente estimada (MRR)
    const mrr = subscriptions
      .filter(s => s.status === 'active')
      .reduce((acc, sub) => acc + (Number(sub.plan_price) || 0), 0);

    return { totalLeads, activeSubs, apptsCount, mrr };
  }, [leads, subscriptions, appointments]);

  // 📊 Distribuição por Funil (Criação de dados para o gráfico)
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      counts[l.status] = (counts[l.status] || 0) + 1;
    });

    const stages = ['Novo Lead', 'Contato Inicial', 'Proposta Enviada', 'Negociação', 'Fechado'];
    return stages.map(stage => ({
      name: stage,
      value: counts[stage] || 0 // Aqui permitimos 0 para refletir limpeza real
    }));
  }, [leads]);

  // 🕒 Tendência de Growth (Mockado para visual mas derivado da data real de leads)
  const growthData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return months.map((m, i) => {
      const monthLeads = leads.filter(l => new Date(l.created_at).getMonth() === i);
      const revenue = subscriptions
        .filter(s => s.status === 'active' && new Date(s.created_at || Date.now()).getMonth() === i)
        .reduce((acc, sub) => acc + (Number(sub.plan_price) || 0), 0);
        
      return {
        month: m,
        leads: monthLeads.length,
        revenue: revenue
      };
    });
  }, [leads, subscriptions]);

  const filteredLeads = leads
    .filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🚀 Header & Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Visão Geral</h2>
          <p className="text-text-sec text-sm mt-1">Bem-vindo ao Elite CRM. Aqui está o pulso do seu negócio hoje.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-sidebar border border-border-color rounded-xl text-xs font-bold text-text-main hover:bg-bg-sidebar/50 transition-all uppercase tracking-wider">
            <Filter size={14} /> Filtrar Período
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-bg-main rounded-xl text-xs font-bold hover:bg-secondary active:scale-[0.98] transition-all shadow-lg shadow-primary/20 uppercase tracking-widest">
            <UserPlus size={14} /> Novo Contato
          </button>
        </div>
      </div>

      {/* 💎 Cards de Métricas Elite (Sem dados fantasmas - SDD) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Leads', value: stats.totalLeads, icon: Users, color: 'text-primary' },
          { label: 'Assinaturas Ativas', value: stats.activeSubs, icon: DollarSign, color: 'text-blue-400' },
          { label: 'Agenda Semanal', value: stats.apptsCount, icon: Calendar, color: 'text-emerald-400' },
          { label: 'Receita Est. (MRR)', value: `R$ ${stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-primary' }
        ].map((card, i) => (
          <div key={i} className="group bg-bg-sidebar border border-border-color p-6 rounded-2xl hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-bg-main/50 ${card.color}`}>
                <card.icon size={22} />
              </div>
            </div>
            <h3 className="text-text-sec text-[11px] font-bold uppercase tracking-[0.15em] mb-1">{card.label}</h3>
            <p className="text-2xl font-bold text-text-main tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      {/* 📊 Seção de Analytics Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Tendência (Area Chart Premium) */}
        <div className="bg-bg-sidebar border border-border-color p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-primary" size={18} />
              <h3 className="text-sm font-bold text-text-main uppercase tracking-widest">Tendência de Aquisição</h3>
            </div>
            <PieChart className="text-text-sec/30" size={18} />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-sec)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-sec)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', borderRadius: '12px', color: 'var(--text-main)' }}
                  itemStyle={{ color: 'var(--primary)' }}
                />
                <Area type="monotone" dataKey="leads" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funil de Vendas (Bar Chart Estilizado) */}
        <div className="bg-bg-sidebar border border-border-color p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-primary" size={18} />
              <h3 className="text-sm font-bold text-text-main uppercase tracking-widest">Conversão do Funil</h3>
            </div>
            <Users className="text-text-sec/30" size={18} />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-sec)" fontSize={11} width={100} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', borderRadius: '12px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={25}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 📋 Leads Recentes & Busca */}
      <div className="bg-bg-sidebar border border-border-color rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-border-color flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-sidebar/50">
          <h3 className="text-sm font-bold text-text-main uppercase tracking-widest">Atividade Recente</h3>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-bg-main border border-border-color rounded-xl text-xs text-text-main focus:outline-none focus:border-primary/50 w-full sm:w-64 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-bg-main/30 text-text-sec text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Status no Funil</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-bg-main/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-main">{lead.name}</div>
                        <div className="text-[10px] text-text-sec">{lead.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      lead.status === 'Fechado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      lead.status === 'Perdido' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      'bg-primary/10 text-primary border-primary/20'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-text-sec">{lead.source}</td>
                  <td className="px-6 py-4 text-[11px] text-text-sec">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                      Perfil Completo
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-sec italic text-sm">
                    Nenhum contato encontrado no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MockupGenerator 
        pageName="Dashboard" 
        promptDescription="A modern, dark-themed dashboard showing analytics cards, a line graph for growth, and a leads list. Premium aesthetics with gold accents." 
      />
    </div>
  );
}
