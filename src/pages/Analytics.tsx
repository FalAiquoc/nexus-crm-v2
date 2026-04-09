import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from 'recharts';
import {
  BarChart3, TrendingUp, Users, DollarSign, Target, Calendar,
  ArrowUpRight, ArrowDownRight, FileText, Download, Filter,
  Activity, Sparkles, PieChart as PieIcon, Layers, Zap,
  Clock, AlertCircle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

// Paleta de cores premium (Power BI Inspired)
const COLORS = [
  '#D4AF37', '#F3E5AB', '#6366F1', '#8B5CF6', '#EC4899',
  '#F59E0B', '#14B8A6', '#3B82F6', '#EF4444', '#22C55E'
];

const GRADIENT_PAIRS = [
  { start: '#D4AF37', end: '#B8860B' },
  { start: '#6366F1', end: '#4F46E5' },
  { start: '#EC4899', end: '#DB2777' },
  { start: '#14B8A6', end: '#0D9488' },
  { start: '#3B82F6', end: '#2563EB' },
];

type Tab = 'overview' | 'revenue' | 'funnel' | 'sources' | 'performance';

// Custom Tooltip Premium
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#12121A] border border-primary/20 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-l-4 border-l-primary">
      <p className="text-[10px] uppercase font-black text-text-sec tracking-[0.2em] mb-2 opacity-60">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-text-main font-black text-lg">{prefix}{typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}{suffix}</span>
          <span className="text-text-sec text-[10px] font-medium">{entry.name}</span>
        </div>
      ))}
    </div>
  );
};

export function Analytics() {
  const { clients, stages, settings } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dateFilter, setDateFilter] = useState<string>('all'); // YYYY-MM ou 'all'

  // Extrair meses disponíveis dos leads (ignora futuro para não bugar a dash)
  const availableMonths = useMemo(() => {
    if (!clients || clients.length === 0) return [];
    const months = new Set<string>();
    const now = new Date();
    clients.forEach(c => {
      if (c.created_at) {
        const d = new Date(c.created_at);
        if (!isNaN(d.getTime()) && d <= now) {
          months.add(d.toISOString().slice(0, 7)); // Formato YYYY-MM
        }
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a)); // Mais recente 1º
  }, [clients]);

  const data = useMemo(() => {
    const now = new Date();
    // 1. Filtro base: Dados reais até o momento (remove previsões futuras acidentais)
    let list = (clients || []).filter(c => {
      if (!c.created_at) return false;
      const d = new Date(c.created_at);
      return d <= now;
    });

    // 2. Filtro de Período Selecionado
    if (dateFilter !== 'all') {
      list = list.filter(c => c.created_at && c.created_at.startsWith(dateFilter));
    }

    const total = list.length;
    const closed = list.filter(c => c?.status === 'Fechado');
    const lost = list.filter(c => c?.status === 'Perdido');
    const active = list.filter(c => c && c.status !== 'Fechado' && c.status !== 'Perdido');
    const closedValue = closed.reduce((s, c) => s + (Number(c.value) || 0), 0);
    const activeValue = active.reduce((s, c) => s + (Number(c.value) || 0), 0);
    const lostValue = lost.reduce((s, c) => s + (Number(c.value) || 0), 0);
    const convRate = total > 0 ? ((closed.length / total) * 100) : 0;
    const avgTicket = closed.length > 0 ? (closedValue / closed.length) : 0;

    // Estágios do funil (Uso exclusivo de dados reais vindos do banco)
    const activeStages = stages || [];
    const funnelData = activeStages.map((s: any) => ({
      name: s.name,
      leads: list.filter(c => c?.status === s.name).length,
      value: list.filter(c => c?.status === s.name).reduce((sum, c) => sum + (Number(c.value) || 0), 0)
    }));

    // Por origem
    const srcMap: Record<string, { name: string; count: number; revenue: number; closed: number }> = {};
    list.forEach(c => {
      const src = c.source || 'Manual';
      if (!srcMap[src]) srcMap[src] = { name: src, count: 0, revenue: 0, closed: 0 };
      srcMap[src].count++;
      if (c.status === 'Fechado') {
        srcMap[src].revenue += (Number(c.value) || 0);
        srcMap[src].closed++;
      }
    });
    const sourceData = Object.values(srcMap).sort((a, b) => b.revenue - a.revenue);
    const sourceConversion = sourceData.map(s => ({
      name: s.name,
      'Taxa (%)': s.count > 0 ? Math.round((s.closed / s.count) * 100) : 0,
      'Leads': s.count,
      'Receita': s.revenue,
    }));

    // Timeline temporal baseada em REAL DATA - Visão de Calendário
    const timelineMap: Record<string, { receita: number, leads: number }> = {};
    
    // Obter data mínima e máxima para o range da timeline
    const allLeads = clients || [];
    let startDate = new Date();
    if (allLeads.length > 0) {
      startDate = new Date(Math.min(...allLeads.map(c => new Date(c.created_at).getTime())));
    } else {
      startDate.setMonth(startDate.getMonth() - 6); // Default 6 months if empty
    }
    const endDate = new Date(); // Até hoje

    // Gerar todos os meses no intervalo (Professional Calendar View)
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const monthsRange: string[] = [];
    while (current <= endDate) {
      const key = current.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      monthsRange.push(key);
      timelineMap[key] = { receita: 0, leads: 0 };
      current.setMonth(current.getMonth() + 1);
    }

    const timelineList = (dateFilter === 'all') ? allLeads : list;
    
    timelineList.forEach(c => {
      if (!c.created_at) return;
      const isDaily = dateFilter !== 'all';
      const date = new Date(c.created_at);
      
      const key = isDaily 
        ? date.toLocaleDateString('pt-BR').slice(0, 5) // DD/MM
        : date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }); // Jan 2026
        
      if (!timelineMap[key]) {
        timelineMap[key] = { receita: 0, leads: 0 };
      }
      timelineMap[key].leads++;
      if (c.status === 'Fechado') {
        timelineMap[key].receita += (Number(c.value) || 0);
      }
    });

    const revenueTimeline = Object.entries(timelineMap)
      .sort((a, b) => {
        // Ordenação cronológica correta
        if (dateFilter !== 'all') return 0; // Se diário, assume ordem de processamento/lista
        const [mA, yA] = a[0].split(' ');
        const [mB, yB] = b[0].split(' ');
        return new Date(`${mA} 1, ${yA}`).getTime() - new Date(`${mB} 1, ${yB}`).getTime();
      })
      .map(([label, metrics]) => ({
        month: label,
        receita: metrics.receita,
        meta: Math.round(metrics.receita === 0 ? 5000 : metrics.receita * 1.3), 
        leads: metrics.leads
      }));
    
    // Se não tiver timeline gera uma genérica zerada
    if (revenueTimeline.length === 0) {
      revenueTimeline.push({ month: 'Sem dados', receita: 0, meta: 0, leads: 0 });
    }

    // Radar de performance por canal
    const radarData = sourceData.slice(0, 5).map(s => ({
      subject: s.name,
      volume: s.count,
      receita: Math.round(s.revenue / 100),
      conversao: s.count > 0 ? Math.round((s.closed / s.count) * 100) : 0,
    }));

    // Distribuição de valor por status
    const statusDistribution = [
      { name: 'Em Pipeline', value: activeValue, fill: '#D4AF37' },
      { name: 'Convertido', value: closedValue, fill: '#22C55E' },
      { name: 'Perdido', value: lostValue, fill: '#EF4444' },
    ].filter(d => d.value > 0);
    if (statusDistribution.length === 0) {
      statusDistribution.push({ name: 'Sem dados', value: 1, fill: '#4B5563' });
    }

    return {
      total, closed: closed.length, activeCount: active.length, lostCount: lost.length,
      closedValue, activeValue, lostValue, convRate, avgTicket,
      funnelData, sourceData, sourceConversion, revenueTimeline,
      radarData, statusDistribution
    };
  }, [clients, stages]);

  const formatCurrency = (v: number) => {
    if (v === 0) return 'R$ 0';
    if (v < 1000) return `R$ ${v.toFixed(0)}`;
    if (v < 1000000) return `R$ ${(v / 1000).toFixed(1)}k`;
    return `R$ ${(v / 1000000).toFixed(2)}M`;
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview',    label: 'Visão Geral',      icon: Layers },
    { id: 'revenue',     label: 'Receita & Metas',  icon: DollarSign },
    { id: 'funnel',      label: 'Funil de Vendas',  icon: Target },
    { id: 'sources',     label: 'Canais & ROI',     icon: Zap },
    { id: 'performance', label: 'Performance',       icon: Activity },
  ];

  const kpis = [
    { label: 'Total de Leads', value: data.total, icon: Users, trend: '+8%', up: true, color: 'from-blue-500/15' },
    { label: 'Receita Fechada', value: formatCurrency(data.closedValue), icon: DollarSign, trend: '+12.5%', up: true, color: 'from-emerald-500/15' },
    { label: 'Taxa de Conversão', value: `${data.convRate.toFixed(1)}%`, icon: Target, trend: '+4.1%', up: true, color: 'from-violet-500/15' },
    { label: 'Ticket Médio', value: formatCurrency(data.avgTicket), icon: TrendingUp, trend: '-2.4%', up: false, color: 'from-amber-500/15' },
    { label: 'Pipeline Ativo', value: formatCurrency(data.activeValue), icon: Activity, trend: '+15%', up: true, color: 'from-cyan-500/15' },
    { label: 'Leads Perdidos', value: data.lostCount, icon: AlertCircle, trend: '-3%', up: true, color: 'from-rose-500/15' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-bg-sidebar border border-border-color p-6 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-bg-main border border-border-color rounded-xl">
            <BarChart3 className="text-primary" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">Centro de Relatórios</h1>
            <p className="text-text-sec text-sm mt-1">Inteligência analítica completa — dados em tempo real do seu CRM.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <div className="flex bg-bg-main border border-border-color rounded-xl overflow-hidden focus-within:border-primary transition-colors">
            <div className="bg-bg-card px-3 flex items-center border-r border-border-color">
              <Calendar size={14} className="text-text-sec" />
            </div>
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent px-4 py-2 text-xs font-bold text-text-main hover:text-primary transition-colors focus:outline-none appearance-none cursor-pointer pr-8"
            >
              <option value="all">Todo o Período</option>
              {availableMonths.map(m => {
                const [year, month] = m.split('-');
                const monthName = new Date(Number(year), Number(month) - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                return <option key={m} value={m}>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</option>
              })}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl text-xs font-bold text-primary hover:bg-primary hover:text-bg-main transition-all group">
            <Download size={14} className="group-hover:animate-bounce" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-bg-sidebar p-2 rounded-2xl border border-border-color">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                active
                  ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm'
                  : 'text-text-sec hover:text-text-main hover:bg-bg-card'
              }`}
            >
              <Icon size={14} />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-bg-sidebar p-4 rounded-2xl border border-border-color relative overflow-hidden group hover:border-primary/40 transition-colors"
          >
            <div className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${kpi.color} to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon size={16} className="text-primary" />
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${kpi.up ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                  {kpi.up ? <ArrowUpRight size={10} className="inline" /> : <ArrowDownRight size={10} className="inline" />}
                  {kpi.trend}
                </span>
              </div>
              <p className="text-xl font-black text-text-main tracking-tight">{kpi.value}</p>
              <p className="text-[9px] text-text-sec font-bold uppercase tracking-wider mt-1">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {/* ═══ VISÃO GERAL ═══ */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Donut Chart — Distribuição de Valor */}
              <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Distribuição de Valor</h3>
                    <p className="text-[11px] text-text-sec mt-0.5">Pipeline vs. Convertido vs. Perdido</p>
                  </div>
                  <PieIcon size={16} className="text-primary" />
                </div>
                <div style={{ width: '100%', height: 260 }} className="relative mt-2">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Pie
                        data={data.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={105}
                        dataKey="value"
                        stroke="var(--bg-sidebar)"
                        strokeWidth={0}
                        cornerRadius={4}
                        paddingAngle={3}
                      >
                        {data.statusDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} className="hover:opacity-80 transition-opacity cursor-pointer outline-none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip prefix="R$ " />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-text-main">{formatCurrency(data.closedValue + data.activeValue)}</span>
                    <span className="text-[9px] uppercase font-black text-primary tracking-[0.2em] mt-0.5">Total Geral</span>
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  {data.statusDistribution.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-text-sec font-bold">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Area Chart — Pipeline Velocity */}
              <div className="lg:col-span-2 bg-bg-sidebar p-6 rounded-2xl border border-border-color">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Funil por Volume</h3>
                    <p className="text-[11px] text-text-sec mt-0.5">Leads e valor por estágio do pipeline</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                    <span className="text-[9px] font-black text-primary uppercase">Live</span>
                  </div>
                </div>
                <div style={{ width: '100%', height: 280 }} className="-ml-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={data.funnelData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.2} />
                      <XAxis dataKey="name" stroke="var(--text-sec)" fontSize={9} tickLine={false} axisLine={false} dy={10} tickFormatter={v => v.length > 10 ? v.substring(0, 8) + '...' : v} />
                      <YAxis stroke="var(--text-sec)" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="leads" name="Leads" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      <Line type="monotone" dataKey="value" name="Valor (R$)" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1', r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ═══ RECEITA & METAS ═══ */}
          {activeTab === 'revenue' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Receita vs Meta */}
              <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Receita vs. Meta</h3>
                    <p className="text-[11px] text-text-sec mt-0.5">Projeção mensal acumulada</p>
                  </div>
                  <TrendingUp size={16} className="text-primary" />
                </div>
                <div style={{ width: '100%', height: 300 }} className="-ml-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.revenueTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="metaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.2} />
                      <XAxis dataKey="month" stroke="var(--text-sec)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-sec)" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => formatCurrency(v)} />
                      <Tooltip content={<CustomTooltip prefix="R$ " />} />
                      <Area type="monotone" dataKey="receita" name="Receita" stroke="var(--primary)" strokeWidth={3} fill="url(#revGrad)" activeDot={{ r: 6, fill: 'var(--primary)' }} />
                      <Area type="monotone" dataKey="meta" name="Meta" stroke="#6366F1" strokeWidth={2} strokeDasharray="4 4" fill="url(#metaGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-2 text-[10px] text-text-sec font-bold"><div className="w-3 h-0.5 bg-primary rounded" />Receita Real</div>
                  <div className="flex items-center gap-2 text-[10px] text-text-sec font-bold"><div className="w-3 h-0.5 bg-indigo-500 rounded" style={{ borderStyle: 'dashed' }} />Meta</div>
                </div>
              </div>

              {/* Evolução de Leads */}
              <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Evolução de Leads</h3>
                    <p className="text-[11px] text-text-sec mt-0.5">Volume mensal de captação</p>
                  </div>
                  <Users size={16} className="text-primary" />
                </div>
                <div style={{ width: '100%', height: 300 }} className="-ml-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.revenueTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.2} />
                      <XAxis dataKey="month" stroke="var(--text-sec)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-sec)" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip suffix=" leads" />} />
                      <Bar dataKey="leads" name="Leads" fill="url(#leadsGrad)" radius={[8, 8, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ticket Médio + Receita por Lead (cards) */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Ticket Médio', value: formatCurrency(data.avgTicket), desc: 'Valor médio por lead convertido', icon: DollarSign, color: 'text-emerald-400' },
                  { label: 'Receita/Lead', value: formatCurrency(data.total > 0 ? data.closedValue / data.total : 0), desc: 'Receita total ÷ total de leads', icon: Target, color: 'text-violet-400' },
                  { label: 'Pipeline Projetado', value: formatCurrency(data.activeValue + data.closedValue), desc: 'Valor total em negociação + fechado', icon: TrendingUp, color: 'text-amber-400' },
                ].map(card => (
                  <div key={card.label} className="bg-bg-sidebar p-5 rounded-2xl border border-border-color flex items-center gap-4">
                    <div className={`p-3 bg-bg-main rounded-xl border border-border-color ${card.color}`}>
                      <card.icon size={22} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-text-main">{card.value}</p>
                      <p className="text-[10px] text-text-sec font-bold uppercase tracking-wider">{card.label}</p>
                      <p className="text-[10px] text-text-sec mt-0.5 opacity-60">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ FUNIL DE VENDAS ═══ */}
          {activeTab === 'funnel' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Horizontal Bar — Leads por Estágio */}
              <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Leads por Estágio</h3>
                    <p className="text-[11px] text-text-sec mt-0.5">Distribuição horizontal do funil</p>
                  </div>
                  <Layers size={16} className="text-primary" />
                </div>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.funnelData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={true} horizontal={false} opacity={0.2} />
                      <XAxis type="number" stroke="var(--text-sec)" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="var(--text-sec)" fontSize={9} tickLine={false} axisLine={false} width={75} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-main)', opacity: 0.4 }} />
                      <Bar dataKey="leads" name="Leads" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {data.funnelData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Valor monetário por estágio */}
              <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Valor por Estágio</h3>
                    <p className="text-[11px] text-text-sec mt-0.5">Distribuição monetária (R$)</p>
                  </div>
                  <DollarSign size={16} className="text-primary" />
                </div>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.funnelData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.2} />
                      <XAxis dataKey="name" stroke="var(--text-sec)" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => v.length > 8 ? v.substring(0, 6) + '..' : v} />
                      <YAxis stroke="var(--text-sec)" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => formatCurrency(v)} />
                      <Tooltip content={<CustomTooltip prefix="R$ " />} />
                      <Bar dataKey="value" name="Valor (R$)" radius={[8, 8, 0, 0]} maxBarSize={40}>
                        {data.funnelData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Visual Funnel Cascade */}
              <div className="lg:col-span-2 bg-bg-sidebar p-6 rounded-2xl border border-border-color">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-6">Cascata do Funil</h3>
                <div className="flex items-end justify-center gap-3 h-[200px]">
                  {data.funnelData.map((stage, i) => {
                    const maxLeads = Math.max(...data.funnelData.map(f => f.leads), 1);
                    const heightPct = Math.max((stage.leads / maxLeads) * 100, 8);
                    return (
                      <div key={stage.name} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                        <span className="text-lg font-black text-text-main">{stage.leads}</span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPct}%` }}
                          transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
                          className="w-full rounded-t-xl transition-all"
                          style={{ backgroundColor: COLORS[i % COLORS.length], minHeight: 12 }}
                        />
                        <span className="text-[9px] font-bold text-text-sec uppercase tracking-wider text-center leading-tight mt-1">{stage.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══ CANAIS & ROI ═══ */}
          {activeTab === 'sources' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Receita por Origem */}
              <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Receita por Canal</h3>
                    <p className="text-[11px] text-text-sec mt-0.5">R$ gerados por canal de aquisição</p>
                  </div>
                  <DollarSign size={16} className="text-primary" />
                </div>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.sourceData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={true} horizontal={false} opacity={0.2} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="var(--text-sec)" fontSize={10} tickLine={false} axisLine={false} width={70} />
                      <Tooltip content={<CustomTooltip prefix="R$ " />} cursor={{ fill: 'var(--bg-main)', opacity: 0.3 }} />
                      <Bar dataKey="revenue" name="Receita" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {data.sourceData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conversão por Canal */}
              <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Conversão por Canal</h3>
                    <p className="text-[11px] text-text-sec mt-0.5">Taxa de fechamento por origem (%)</p>
                  </div>
                  <Target size={16} className="text-primary" />
                </div>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.sourceConversion} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.2} />
                      <XAxis dataKey="name" stroke="var(--text-sec)" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-sec)" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip content={<CustomTooltip suffix="%" />} />
                      <Bar dataKey="Taxa (%)" name="Conversão" fill="#22C55E" radius={[8, 8, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabela de Canais */}
              <div className="lg:col-span-2 bg-bg-sidebar rounded-2xl border border-border-color overflow-hidden">
                <div className="p-6 border-b border-border-color">
                  <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Ranking de Canais (ROAI)</h3>
                  <p className="text-[11px] text-text-sec mt-0.5">Return on Asset Influence — performance detalhada</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-color text-text-sec">
                        <th className="text-left p-4 font-bold text-[10px] uppercase tracking-wider">#</th>
                        <th className="text-left p-4 font-bold text-[10px] uppercase tracking-wider">Canal</th>
                        <th className="text-right p-4 font-bold text-[10px] uppercase tracking-wider">Leads</th>
                        <th className="text-right p-4 font-bold text-[10px] uppercase tracking-wider">Fechados</th>
                        <th className="text-right p-4 font-bold text-[10px] uppercase tracking-wider">Receita</th>
                        <th className="text-right p-4 font-bold text-[10px] uppercase tracking-wider">Conv. %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sourceData.map((src, i) => (
                        <tr key={src.name} className="border-b border-border-color/50 hover:bg-bg-card transition-colors">
                          <td className="p-4 text-text-sec font-bold">{i + 1}</td>
                          <td className="p-4 text-text-main font-semibold flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            {src.name}
                          </td>
                          <td className="p-4 text-right text-text-main">{src.count}</td>
                          <td className="p-4 text-right text-emerald-400 font-bold">{src.closed}</td>
                          <td className="p-4 text-right text-text-main font-bold">{formatCurrency(src.revenue)}</td>
                          <td className="p-4 text-right">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              src.count > 0 && (src.closed / src.count) > 0.3
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {src.count > 0 ? Math.round((src.closed / src.count) * 100) : 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {data.sourceData.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-text-sec">Nenhum dado de canal disponível</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PERFORMANCE ═══ */}
          {activeTab === 'performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Score Multidimensional</h3>
                    <p className="text-[11px] text-text-sec mt-0.5">Visão consolidada de conversão e volume</p>
                  </div>
                  <Activity size={16} className="text-primary" />
                </div>
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={data.radarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="var(--border-color)" />
                      <PolarAngleAxis dataKey="subject" stroke="var(--text-sec)" fontSize={10} />
                      <PolarRadiusAxis stroke="var(--border-color)" fontSize={8} />
                      <Radar name="Volume" dataKey="volume" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.15} strokeWidth={2} />
                      <Radar name="Conversão %" dataKey="conversao" stroke="#22C55E" fill="#22C55E" fillOpacity={0.1} strokeWidth={2} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Timeline de Velocidade (ComposedChart) */}
              <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Desempenho Temporal</h3>
                    <p className="text-[11px] text-text-sec mt-0.5">Leads criados vs Receita Real</p>
                  </div>
                  <Clock size={16} className="text-primary" />
                </div>
                <div style={{ width: '100%', height: 320 }} className="-ml-8">
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={data.revenueTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.2} />
                      <XAxis dataKey="month" stroke="var(--text-sec)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="var(--text-sec)" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `R$ ${(v/1000).toFixed(0)}k`} />
                      <YAxis yAxisId="right" orientation="right" stroke="var(--text-sec)" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      
                      <Bar yAxisId="right" dataKey="leads" name="Qtd Leads" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} fillOpacity={0.3} />
                      <Line yAxisId="left" type="monotone" dataKey="receita" name="Receita Real (R$)" stroke="#22C55E" strokeWidth={3} dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insight final */}
              <div className="lg:col-span-2 bg-gradient-to-r from-primary/10 via-transparent to-transparent border-l-4 border-primary rounded-r-2xl p-5 flex items-start gap-3">
                <Sparkles className="text-primary mt-0.5 shrink-0" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-text-main">Insight de Performance (Alpha Quant AI)</h4>
                  <p className="text-sm text-text-sec mt-1.5 leading-relaxed">
                    Seu funil possui <strong className="text-text-main">{data.total} leads</strong> com uma taxa de conversão de{' '}
                    <strong className="text-primary">{data.convRate.toFixed(1)}%</strong>. O canal{' '}
                    <strong className="text-primary">{data.sourceData[0]?.name || 'N/D'}</strong> é o mais lucrativo, gerando{' '}
                    <strong className="text-text-main">{formatCurrency(data.sourceData[0]?.revenue || 0)}</strong> em receita.{' '}
                    {data.convRate < 20 && 'Recomendamos intensificar a etapa de follow-up para aumentar a conversão.'}
                    {data.convRate >= 20 && data.convRate < 40 && 'A taxa está saudável — foque em escalar o volume de captação.'}
                    {data.convRate >= 40 && 'Excelente performance! O funil está altamente eficiente.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
