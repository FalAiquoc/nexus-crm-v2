import React from 'react';
import { 
  Users, 
  TrendingUp, 
  Target, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  ChevronRight,
  Filter,
  Download,
  Activity,
  Loader2
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { MockupGenerator } from '../components/MockupGenerator';
import { useApp } from '../context/AppContext';

const COLORS = ['var(--primary)', 'var(--secondary)', 'var(--grad-start)', 'var(--border-color)', 'var(--bg-card)'];

interface DashboardProps {
  onSelectClient?: (client: any) => void;
}

export function Dashboard({ onSelectClient }: DashboardProps) {
  const { clients, stages, settings, isLoading } = useApp();
  const workspaceType = settings.workspace_type;

  const totalLeads = clients.length;
  
  // Lógica corrigida:
  // Dinheiro no Gatilho = Leads que NÃO estão em 'Fechado' ou 'Perdido'
  const openLeadsList = clients.filter(c => c.status !== 'Fechado' && c.status !== 'Perdido');
  const openValue = openLeadsList.reduce((acc, curr) => acc + curr.value, 0);

  // Dinheiro no Bolso = Apenas leads em 'Fechado'
  const closedLeadsList = clients.filter(c => c.status === 'Fechado');
  const closedLeadsCount = closedLeadsList.length;
  const closedValue = closedLeadsList.reduce((acc, curr) => acc + curr.value, 0);
  
  const conversionRate = totalLeads > 0 ? ((closedLeadsCount / totalLeads) * 100).toFixed(1) : 0;

  const funnelData = stages.map(stage => ({
    name: stage.name,
    value: clients.filter(c => c.status === stage.name).length
  }));

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-primary">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  const recentLeads = [...clients].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);

  const formatNatalenseValue = (val: number) => {
    if (val === 0) return 'R$ 0';
    if (val < 1000) return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    return `R$ ${(val / 1000).toFixed(1)}k`;
  };

  const stats = [
    { 
      label: workspaceType === 'barbershop' ? 'Total de Clientes' : workspaceType === 'law_firm' ? 'Total de Casos' : 'Total de Contatos', 
      value: totalLeads, 
      icon: Users, 
      trend: '+12%', 
      trendUp: true,
      color: 'from-primary/20 to-transparent'
    },
    { 
      label: '% de Sucesso', 
      value: `${conversionRate}%`, 
      icon: Target, 
      trend: '+2.4%', 
      trendUp: true,
      color: 'from-secondary/20 to-transparent'
    },
    { 
      label: workspaceType === 'law_firm' ? 'Honorários Estimados' : 'Dinheiro no Gatilho', 
      value: formatNatalenseValue(openValue), 
      icon: DollarSign, 
      trend: '-3%', 
      trendUp: false,
      color: 'from-grad-start/20 to-transparent'
    },
    { 
      label: workspaceType === 'law_firm' ? 'Honorários Recebidos' : 'Dinheiro no Bolso', 
      value: formatNatalenseValue(closedValue), 
      icon: TrendingUp, 
      trend: '+0.5%', 
      trendUp: true,
      color: 'from-primary/10 to-transparent'
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="text-primary" size={28} />
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Dashboard Executivo</h1>
            <p className="text-text-sec mt-1">Visão geral da sua performance de marketing e vendas.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-color rounded-lg text-sm text-text-main hover:bg-border-color transition-colors">
            <Filter size={16} />
            Filtrar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-sm text-bg-main font-semibold hover:bg-secondary transition-colors">
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-bg-sidebar p-6 rounded-2xl border border-border-color relative overflow-hidden group`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-bg-main rounded-xl border border-border-color text-primary">
                  <stat.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.trend}
                </div>
              </div>
              <h3 className="text-text-sec text-sm font-medium">{stat.label}</h3>
              <p className="text-3xl font-bold text-text-main mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart - Pipeline Flow */}
        <div className="lg:col-span-2 bg-bg-sidebar p-8 rounded-2xl border border-border-color">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold text-text-main">Fluxo do Pipeline</h3>
            <select className="bg-bg-main border border-border-color rounded-lg px-3 py-1.5 text-xs text-text-sec focus:outline-none focus:border-primary">
              <option>Últimos 30 dias</option>
              <option>Últimos 90 dias</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={funnelData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-sec)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                  interval={window.innerWidth < 768 ? 1 : 0}
                />
                <YAxis 
                  stroke="var(--text-sec)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  width={30}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-main)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-main)'
                  }}
                  itemStyle={{ color: 'var(--primary)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart - Distribution */}
        <div className="bg-bg-sidebar p-8 rounded-2xl border border-border-color">
          <h3 className="text-xl font-semibold text-text-main mb-8">Distribuição de Status</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={funnelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-main)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {funnelData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-text-sec">{item.name}</span>
                </div>
                <span className="text-text-main font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Leads & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Leads */}
        <div className="bg-bg-sidebar rounded-2xl border border-border-color overflow-hidden">
          <div className="p-6 border-b border-border-color flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-main">Leads Recentes</h3>
            <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-border-color">
            {recentLeads.map((lead) => (
              <div 
                key={lead.id} 
                onClick={() => onSelectClient?.(lead)}
                className="p-4 hover:bg-bg-card transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-border-color flex items-center justify-center text-primary font-bold">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-text-main font-medium group-hover:text-primary transition-colors">{lead.name}</h4>
                    <p className="text-xs text-text-sec">{lead.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-main">R$ {lead.value.toLocaleString('pt-BR')}</p>
                  <span className="text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    {lead.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-bg-sidebar rounded-2xl border border-border-color overflow-hidden">
          <div className="p-6 border-b border-border-color flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-main">Atividades Recentes</h3>
            <Clock size={18} className="text-text-sec" />
          </div>
          <div className="p-6 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 relative">
                {i !== 4 && <div className="absolute left-4 top-8 bottom-[-24px] w-px bg-border-color" />}
                <div className="w-8 h-8 rounded-full bg-bg-main border border-border-color flex items-center justify-center shrink-0 z-10">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-main">
                    <span className="font-semibold">Lead qualificado</span> movido para <span className="text-primary">Proposta Enviada</span>
                  </p>
                  <p className="text-xs text-text-sec mt-1">Há {i * 15} minutos • Por Sistema</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MockupGenerator 
        pageName="Dashboard" 
        promptDescription="Features 4 metric cards at the top, a large area chart for pipeline flow, a distribution pie chart, and lists for recent leads and activities." 
      />
    </div>
  );
}
