import { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  MapPin, 
  Target, 
  Calendar, 
  ArrowUpRight, 
  BarChart3, 
  PieChart as PieChartIcon,
  Search,
  Filter,
  Download,
  Share2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { useApp } from '../context/AppContext';
import { MockupGenerator } from '../components/MockupGenerator';

const COLORS = ['#D4AF37', '#B8860B', '#DAA520', '#C0C0C0', '#4A4A4A', '#8B4513'];

export function Analytics() {
  const { leads, subscriptions, isLoading } = useApp();
  const [timeRange, setTimeRange] = useState('6m');

  // 📈 Kpis de Crescimento (Seguro contra nulos)
  const kpis = useMemo(() => {
    const totalLeads = leads.length;
    const closedLeads = leads.filter(l => l.status === 'Fechado');
    const conversionRate = totalLeads > 0 ? (closedLeads.length / totalLeads) * 100 : 0;
    
    const revenue = leads.reduce((acc, lead) => {
      if (lead.status !== 'Fechado') return acc;
      return acc + (Number(lead.value) || 0);
    }, 0);

    const averageTicket = closedLeads.length > 0 ? revenue / closedLeads.length : 0;

    return { totalLeads, conversionRate, revenue, averageTicket };
  }, [leads]);

  // 📊 Distribuição por Origem
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      counts[l.source] = (counts[l.source] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // 💰 Receita Mensal por Status (Gráfico de Barras Empilhadas)
  const monthlyRevenue = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return months.map((m, i) => {
      const monthLeads = leads.filter(l => new Date(l.created_at).getMonth() === i);
      const revenue = monthLeads
        .filter(l => l.status === 'Fechado')
        .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      
      const potential = monthLeads
        .filter(l => l.status !== 'Fechado' && l.status !== 'Perdido')
        .reduce((sum, l) => sum + (Number(l.value) || 0), 0);

      return { name: m, Realizado: revenue, Potencial: potential };
    });
  }, [leads]);

  // 🎯 Top Performance por Cidade/Região (Simulado via endereços se disponíveis)
  const regionData = [
    { name: 'São Paulo', value: 45 },
    { name: 'Rio de Janeiro', value: 25 },
    { name: 'Curitiba', value: 15 },
    { name: 'Belo Horizonte', value: 10 },
    { name: 'Brasília', value: 5 }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🚀 Header Profissional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Inteligência Estratégica</h2>
          <p className="text-text-sec text-sm mt-1">Análise profunda de conversão, ROI e desempenho comercial.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2.5 bg-bg-sidebar border border-border-color rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-primary/50"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="1y">Este ano</option>
          </select>
          <button className="p-2.5 bg-bg-sidebar border border-border-color rounded-xl text-text-sec hover:text-primary transition-all">
            <Download size={18} />
          </button>
          <button className="p-2.5 bg-bg-sidebar border border-border-color rounded-xl text-text-sec hover:text-primary transition-all">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* 💎 Dashboard de Indicadores Chave (Cards de Impacto) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Leads Captados', value: kpis.totalLeads, icon: Users, color: 'text-blue-400', pct: '+12.5%' },
          { label: 'Taxa de Conversão', value: `${kpis.conversionRate.toFixed(1)}%`, icon: Target, color: 'text-primary', pct: '+4.2%' },
          { label: 'Ticket Médio', value: `R$ ${kpis.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-emerald-400', pct: '+8.1%' },
          { label: 'Receita Total', value: `R$ ${kpis.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: BarChart3, color: 'text-primary', pct: '+22.4%' }
        ].map((kpi, i) => (
          <div key={i} className="group bg-bg-sidebar border border-border-color p-6 rounded-3xl hover:border-primary/30 transition-all shadow-xl relative overflow-hidden">
            <div className={`p-3 rounded-2xl w-fit ${kpi.color} bg-bg-main mb-4 group-hover:scale-110 transition-transform`}>
              <kpi.icon size={22} />
            </div>
            <h3 className="text-text-sec text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{kpi.label}</h3>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-text-main tabular-nums leading-none">{kpi.value}</p>
              <span className="text-[10px] font-bold text-emerald-400 mb-1">{kpi.pct}</span>
            </div>
            <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <kpi.icon size={48} />
            </div>
          </div>
        ))}
      </div>

      {/* 📊 Grid de Gráficos Nível Executivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Gráfico 01: Pipeline Monetário (Barras Empilhadas) */}
        <div className="lg:col-span-8 bg-bg-sidebar border border-border-color p-8 rounded-[2rem] shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-bold text-text-main tracking-tight">Volume de Negócios (R$)</h3>
              <p className="text-xs text-text-sec">Comparativo mensal entre Receita Direta e Pipeline Potencial.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-text-sec uppercase">
                <div className="w-3 h-3 rounded-sm bg-primary"></div> Realizado
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-text-sec uppercase">
                <div className="w-3 h-3 rounded-sm bg-white/20"></div> Potencial
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-sec)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-sec)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '16px' }}
                />
                <Bar dataKey="Realizado" stackId="a" fill="var(--primary)" radius={[0, 0, 0, 0]} barSize={20} />
                <Bar dataKey="Potencial" stackId="a" fill="rgba(255,255,255,0.1)" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 02: Canais de Aquisição (Donut Chart) */}
        <div className="lg:col-span-4 bg-bg-sidebar border border-border-color p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-main tracking-tight mb-1">Origem dos Leads</h3>
            <p className="text-xs text-text-sec mb-10">Eficiência por canal de marketing.</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '16px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-2">
            {sourceData.slice(0, 4).map((entry, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[11px] text-text-sec font-medium">{entry.name}</span>
                </div>
                <span className="text-[10px] font-bold text-text-main">{entry.value} leads</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 03: Distribuição Geográfica (Mini Heatmap ou Bar Chart de Ranking) */}
        <div className="lg:col-span-4 bg-bg-sidebar border border-border-color p-8 rounded-[2rem] shadow-2xl">
          <div className="flex items-center gap-2 mb-8">
            <MapPin className="text-primary" size={20} />
            <h3 className="text-sm font-bold text-text-main uppercase tracking-widest">Top Regiões</h3>
          </div>
          <div className="space-y-6">
            {regionData.map((region, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-text-sec">{region.name}</span>
                  <span className="font-bold text-primary">{region.value}%</span>
                </div>
                <div className="w-full h-1.5 bg-bg-main rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${region.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 04: Retenção/Recorrência (LTV Line Chart) */}
        <div className="lg:col-span-8 bg-bg-sidebar border border-border-color p-8 rounded-[2rem] shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <Calendar className="text-primary" size={20} />
              <h3 className="text-sm font-bold text-text-main uppercase tracking-widest">Taxa de Conversão Mensal</h3>
            </div>
            <p className="text-[10px] text-text-sec italic">*Baseado no fechamento de contratos x leads totais</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-sec)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-sec)" fontSize={11} axisLine={false} tickLine={false} hide />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '16px' }} />
                <Line type="step" dataKey="Realizado" stroke="var(--primary)" strokeWidth={4} dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--bg-sidebar)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <MockupGenerator 
        pageName="Analytics" 
        promptDescription="An advanced analytics page showing stacked revenue charts, acquisition donuts, and regional performance bars. Executive dashboard style with minimalist luxury aesthetics." 
      />
    </div>
  );
}
