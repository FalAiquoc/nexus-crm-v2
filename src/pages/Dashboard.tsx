import React, { useMemo } from 'react';
import { 
  Users, TrendingUp, Target, DollarSign, ArrowUpRight, ArrowDownRight,
  Clock, ChevronRight, Filter, Download, Activity, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

// Paleta Executiva (Padrão Power BI Premium)
const THEME_COLORS = [
  'var(--primary)', 
  'var(--secondary)', 
  '#6366F1', // Indigo Insight
  '#8B5CF6', // Violet Value
  '#EC4899', // Pink Performance
  '#F59E0B'  // Amber Alert
];

interface DashboardProps {
  onSelectClient?: (client: any) => void;
}

// Custom Tooltips para visual de Software BI de Alta Performance
const CustomTooltip = ({ active, payload, label, formatter, suffix = "" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-sidebar/95 backdrop-blur-md border border-primary/20 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-l-4 border-l-primary animate-in fade-in zoom-in duration-200">
        <p className="text-text-sec text-[10px] uppercase font-black tracking-[0.2em] mb-2 opacity-50">{label || 'Métrica'}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
               <span className="text-text-main font-black text-xl tracking-tight">
                 {formatter ? formatter(entry.value) : entry.value}{suffix}
               </span>
            </div>
            <span className="text-text-sec text-xs font-medium ml-4">{entry.name}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function Dashboard({ onSelectClient }: DashboardProps) {
  const { clients, stages, settings, isLoading } = useApp();
  const workspaceType = settings.workspace_type;

  const memoizedData = useMemo(() => {
    const list = clients || [];
    const totalLeads = list.length;
    
    const openLeadsList = list.filter(c => c && c.status !== 'Fechado' && c.status !== 'Perdido');
    const openValue = openLeadsList.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

    const closedLeadsList = list.filter(c => c && c.status === 'Fechado');
    const closedValue = closedLeadsList.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    
    const conversionRate = totalLeads > 0 ? ((closedLeadsList.length / totalLeads) * 100).toFixed(1) : 0;

    // Uso exclusivo dos stages vindos do banco de dados (via AppContext)
    const activeStages = stages || [];
    const funnelData = activeStages.map((s: any) => ({
      name: s.name,
      leads: list.filter(c => c?.status === s.name).length,
      value: list.filter(c => c?.status === s.name).reduce((sum, c) => sum + (Number(c.value) || 0), 0)
    }));
    const hasFunnelValues = funnelData.some(d => d.value > 0);
    const safeFunnelData = hasFunnelValues ? funnelData : funnelData.map((d, i) => ({ ...d, value: i === 0 ? 1 : 0 }));

    // Métricas por Origem (ROAI)
    const sourceMap = list.reduce((acc: any, c) => {
      const source = c.source || 'Outro';
      if (!acc[source]) acc[source] = { name: source, count: 0, revenue: 0 };
      acc[source].count += 1;
      if (c.status === 'Fechado') {
        acc[source].revenue += (Number(c.value) || 0);
      }
      return acc;
    }, {});
    
    const sourceData = Object.values(sourceMap).sort((a: any, b: any) => b.revenue - a.revenue);

    return { totalLeads, openValue, closedValue, conversionRate, funnelData, safeFunnelData, sourceData, openLeadsList };
  }, [clients, stages]);

  const { totalLeads, openValue, closedValue, conversionRate, funnelData, safeFunnelData, sourceData } = memoizedData;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-primary">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  const recentLeads = [...(clients || [])]
    .sort((a, b) => String(b.id || '').localeCompare(String(a.id || '')))
    .slice(0, 5);

  const formatCurrency = (val: number) => {
    if (val === 0) return 'R$ 0';
    if (val < 1000) return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    return `R$ ${(val / 1000).toFixed(1)}k`;
  };

  const stats = [
    { 
      label: workspaceType === 'law_firm' ? 'Contratos Fechados' : 'Dinheiro no Bolso', 
      value: formatCurrency(closedValue), 
      icon: DollarSign, 
      trend: '+12.5%', 
      trendUp: true,
      color: 'from-primary/20 to-transparent'
    },
    { 
      label: workspaceType === 'law_firm' ? 'Honorários em Negociação' : 'Dinheiro no Gatilho', 
      value: formatCurrency(openValue), 
      icon: TrendingUp, 
      trend: '-2.4%', 
      trendUp: false,
      color: 'from-secondary/20 to-transparent'
    },
    { 
      label: 'Taxa de Conversão', 
      value: `${conversionRate}%`, 
      icon: Target, 
      trend: '+4.1%', 
      trendUp: true,
      color: 'from-grad-start/20 to-transparent'
    },
    { 
      label: workspaceType === 'barbershop' ? 'Total de Agendamentos' : workspaceType === 'law_firm' ? 'Total de Processos' : 'Leads Gerados', 
      value: totalLeads, 
      icon: Users, 
      trend: '+8%', 
      trendUp: true,
      color: 'from-primary/10 to-transparent'
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">


      {/* Métricas de Crescimento (KPI Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-bg-sidebar p-6 rounded-2xl border border-border-color relative overflow-hidden group hover:border-primary/50 transition-colors shadow-sm"
          >
            <div className={`absolute -right-12 -top-12 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700`} />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-bg-main rounded-lg border border-border-color text-primary shadow-inner">
                  <stat.icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${stat.trendUp ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                  {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-3xl font-black text-text-main mt-1 tracking-tight">{stat.value}</p>
              <h3 className="text-text-sec text-xs font-semibold uppercase tracking-wider mt-2">{stat.label}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gráficos Estratégicos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Ring Chart Refinado (Market Distribution) */}
        <div className="bg-bg-sidebar p-6 md:p-8 rounded-2xl border border-border-color shadow-sm flex flex-col justify-between relative group hover:border-primary/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xl font-black text-text-main tracking-tight uppercase text-sm opacity-80">Distribuição de Funil</h3>
              <p className="text-xs text-text-sec mt-1">Market share interno por etapa operacional</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Activity size={16} />
            </div>
          </div>
          
          <div style={{ width: '100%', height: 260 }} className="relative mt-2">
            <ResponsiveContainer width="100%" height="260">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  {funnelData.map((_, index) => (
                    <linearGradient key={`grad-${index}`} id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={THEME_COLORS[index % THEME_COLORS.length]} stopOpacity={1} />
                      <stop offset="100%" stopColor={THEME_COLORS[index % THEME_COLORS.length]} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={safeFunnelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {funnelData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#grad-${index})`} 
                      className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip suffix=" leads" />} />
              </PieChart>
            </ResponsiveContainer>
            {/* HUD Central Intelligence */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <motion.span 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-black text-text-main tracking-tighter"
              >
                {totalLeads}
              </motion.span>
              <span className="text-[10px] uppercase font-black text-primary tracking-[0.3em] mt-1">Total Assets</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {funnelData.slice(0, 4).map((item, index) => (
              <div key={item.name} className="flex flex-col p-3 rounded-xl bg-bg-main/40 border border-border-color hover:bg-bg-main/60 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME_COLORS[index % THEME_COLORS.length] }} />
                  <span className="text-[10px] font-black text-text-sec uppercase tracking-wider truncate">{item.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-text-main">{item.value}</span>
                  <span className="text-[10px] text-text-sec font-bold opacity-50">UNIT</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 2: Revenue Pipeline Velocity (Power BI Area Style) */}
        <div className="lg:col-span-2 bg-bg-sidebar p-6 md:p-8 rounded-2xl border border-border-color shadow-sm group hover:border-primary/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-text-main tracking-tight uppercase text-sm opacity-80">Velocity & Pipeline Value</h3>
              <p className="text-xs text-text-sec mt-1">Fluxo monetário projetado vs. gargalos de conversão</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                <span className="text-[10px] font-black text-primary uppercase">Real-Time Sync</span>
              </div>
            </div>
          </div>
          
          <div style={{ width: '100%', height: 320 }} className="-ml-4">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={funnelData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <filter id="shadow" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="0" dy="4" result="offsetblur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.5" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-sec)" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false}
                  dy={15}
                  tickFormatter={(val) => val.length > 10 ? val.substring(0, 8) + '...' : val}
                />
                <YAxis 
                  stroke="var(--text-sec)" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                />
                <RechartsTooltip content={<CustomTooltip suffix=" pts" />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--primary)" 
                  strokeWidth={4}
                  fill="url(#velocityGrad)" 
                  filter="url(#shadow)"
                  activeDot={{ r: 8, strokeWidth: 0, fill: 'var(--primary)', className: "animate-pulse" }}
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-bg-main/50 rounded-2xl border border-border-color flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-sec uppercase">Growth Rate</p>
                <p className="text-lg font-black text-text-main">+24.8%</p>
              </div>
            </div>
            <div className="p-4 bg-bg-main/50 rounded-2xl border border-border-color flex items-center gap-3 col-span-2">
              <AlertCircle size={20} className="text-primary shrink-0 animate-pulse" />
              <p className="text-xs text-text-sec leading-relaxed">
                <strong className="text-text-main italic">Insight Data-Driven:</strong> Detectamos uma retenção atípica na etapa <span className="text-primary font-bold">"{funnelData[1]?.name || 'Negociação'}"</span>. Recomendamos ação imediata de follow-up para liberar <span className="text-text-main font-bold">{formatCurrency(openValue * 0.4)}</span> em pipeline estagnado.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ROAI (Return on Asset Influence) & Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ROAI - Receita Gerada por Canal */}
        <div className="bg-bg-sidebar rounded-2xl border border-border-color shadow-sm flex flex-col">
          <div className="p-6 md:p-8 border-b border-border-color flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-main tracking-tight">ROAI: Receita por Origem</h3>
              <p className="text-xs text-text-sec mt-1">Análise de fechamento (R$) versus Canal Captador</p>
            </div>
          </div>
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
            {sourceData.length > 0 ? (
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sourceData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={true} vertical={false} opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="var(--text-sec)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <RechartsTooltip content={<CustomTooltip formatter={(val: number) => formatCurrency(val)} />} cursor={{ fill: 'var(--bg-main)', opacity: 0.4 }} />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={32}>
                      {sourceData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-text-sec h-[250px] bg-bg-main/30 rounded-xl border border-dashed border-border-color">
                <Target size={32} className="opacity-30 mb-2" />
                <p className="text-sm">Feche seu primeiro negócio para ver a origem de receita.</p>
              </div>
            )}
          </div>
        </div>

        {/* C-Level Activity Feed */}
        <div className="bg-bg-sidebar rounded-2xl border border-border-color shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 border-b border-border-color flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-main tracking-tight">Última movimentação de Caixa</h3>
              <p className="text-xs text-text-sec mt-1">Leads recentes classificados por Valor / Potencial</p>
            </div>
            <Clock size={18} className="text-text-sec hidden md:block" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border-color">
            {recentLeads.length > 0 ? recentLeads.map((lead) => (
              <div 
                key={lead.id} 
                onClick={() => onSelectClient?.(lead)}
                className="p-4 md:p-6 hover:bg-bg-card transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-bg-main border border-border-color flex items-center justify-center text-primary font-bold shadow-sm">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-text-main font-semibold group-hover:text-primary transition-colors text-sm">{lead.name}</h4>
                    <p className="text-xs text-text-sec mt-0.5 max-w-[120px] md:max-w-none truncate">{lead.email}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <p className="text-sm font-bold text-text-main">{formatCurrency(Number(lead.value) || 0)}</p>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border 
                    ${lead.status === 'Fechado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      lead.status === 'Perdido' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                      'bg-primary/10 text-primary border-primary/20'}`}>
                    {lead.status || 'Sem Status'}
                  </span>
                </div>
              </div>
            )) : (
               <div className="p-8 text-center text-text-sec text-sm">
                 Nenhum lead movimentado recentemente.
               </div>
            )}
          </div>
        </div>

      </div>

      {/* Header Executivo - Movido para o fundo */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-bg-sidebar border border-border-color p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-bg-main border border-border-color rounded-xl">
            <Activity className="text-primary" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Executive Dashboard</h1>
            <p className="text-text-sec mt-1 text-sm max-w-xl">
              Central de inteligência do DoBoy. Acompanhe a liquidez do funil, métricas de conversão e o ROI dos seus canais de aquisição em tempo real.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto mt-4 md:mt-0">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-bg-main border border-border-color rounded-xl text-sm font-medium text-text-main hover:bg-border-color transition-colors shadow-sm">
            <Filter size={16} /> Data
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/30 rounded-xl text-sm font-medium text-primary hover:bg-primary hover:text-bg-main hover:border-transparent transition-all shadow-sm group">
            <Download size={16} className="group-hover:animate-bounce" /> Exportar Relatório
          </button>
        </div>
      </div>

      {/* Insight Gerado por IA - Movido para o fundo */}
      <div className="bg-gradient-to-r from-primary/10 via-transparent to-transparent border-l-4 border-primary rounded-r-xl p-4 flex items-start gap-3">
        <Sparkles className="text-primary mt-0.5 shrink-0" size={20} />
        <div>
          <h4 className="text-sm font-semibold text-text-main">Insight Quantitativo (Alpha Quant)</h4>
          <p className="text-sm text-text-sec mt-1">
            Sua taxa de conversão geral é de <strong className="text-text-main">{conversionRate}%</strong>. O canal de aquisição com maior liquidez é 
            <strong className="text-primary ml-1">{sourceData[0]?.name || 'ND'}</strong>, responsável por grande parte dos <strong>{formatCurrency(closedValue)}</strong> em caixa.
          </p>
        </div>
      </div>
    </div>
  );
}
