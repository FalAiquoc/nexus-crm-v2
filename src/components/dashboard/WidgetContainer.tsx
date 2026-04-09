import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, TrendingUp, Target, DollarSign, Clock, AlertCircle, Shield, Activity
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { CustomTooltip, formatCurrency, THEME_COLORS } from './DashboardUtils';
import { LawRadarChart } from './modules/law/LawRadarChart';
import { LawAgingChart } from './modules/law/LawAgingChart';
import { BarberRebookingChart, BarberPredictiveTable } from './modules/barber/BarberRebookingChart';
import { SaasMrrChart, SaasMetricCards } from './modules/saas/SaasMrrChart';
import { GeneralVelocityChart } from './modules/general/GeneralVelocityChart';

interface WidgetContainerProps {
  type: 'kpi-strip' | 'revenue-main' | 'distribution' | 'source-analysis' | 'activity' | 'spotlight' | 'insight';
  workspace: 'general' | 'barber' | 'law' | 'saas';
  data: any;
  onSelectClient?: (client: any) => void;
}

export function WidgetContainer({ type, workspace, data, onSelectClient }: WidgetContainerProps) {
  const [perspective, setPerspective] = React.useState<string>('default');

  // Helper para renderizar o seletor de perspectiva
  const PerspectiveSelector = ({ options }: { options: { id: string, label: string }[] }) => (
    <div className="flex bg-bg-main border border-border-color rounded-lg p-0.5 shadow-inner">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => setPerspective(opt.id)}
          className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all ${perspective === opt.id || (perspective === 'default' && opt.id === options[0].id) ? 'bg-primary text-bg-main shadow-sm' : 'text-text-sec hover:text-text-main'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  // --- SLOT: KPI STRIP (TOP BAR METRICS) ---
  if (type === 'kpi-strip') {
    let stats = [
      { label: 'Total de Leads', value: data.totalLeads, icon: Users, trend: '+8%', trendUp: true, color: 'text-primary' },
      { label: 'Receita Fechada', value: formatCurrency(data.closedValue), icon: DollarSign, trend: '+12.5%', trendUp: true, color: 'text-emerald-500' },
      { label: 'Taxa de Conversão', value: `${data.conversionRate}%`, icon: Target, trend: '+4.1%', trendUp: true, color: 'text-primary' },
      { label: 'Pipeline Total', value: formatCurrency(data.totalValue), icon: TrendingUp, trend: '+15%', trendUp: true, color: 'text-primary' },
    ];

    if (workspace === 'law') {
      stats = [
        { label: 'Contratos Ativos', value: data.totalLeads, icon: Shield, trend: '+2', trendUp: true, color: 'text-primary' },
        { label: 'Honorários Liquidados', value: formatCurrency(data.closedValue), icon: DollarSign, trend: '+12%', trendUp: true, color: 'text-emerald-500' },
        { label: 'Horas Faturáveis', value: '142h', icon: Clock, trend: '+8h', trendUp: true, color: 'text-primary' },
        { label: 'Taxa de Realização', value: '92%', icon: Activity, trend: '+3%', trendUp: true, color: 'text-emerald-500' },
      ];
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-bg-sidebar p-6 rounded-2xl border border-border-color hover:border-primary/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 bg-gradient-to-br from-bg-main to-bg-sidebar rounded-xl ${stat.color} border border-border-color shadow-inner`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded bg-bg-main/50 border border-border-color ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-2xl font-black text-text-main tracking-tighter">{stat.value}</p>
              <h3 className="text-text-sec text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-60 group-hover:opacity-100 transition-opacity">{stat.label}</h3>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // --- SLOT: INSIGHT (IA DATA-DRIVEN) ---
  if (type === 'insight') {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-transparent to-transparent border-l-4 border-primary rounded-r-xl p-4 flex items-start gap-3">
        <div className="p-1 px-1.5 bg-primary/20 text-primary rounded-lg text-xs font-bold animate-pulse">Alpha Quant</div>
        <div>
          <h4 className="text-sm font-semibold text-text-main">Intelligence: Fluxo de Liquidez</h4>
          <p className="text-sm text-text-sec mt-1">
            Sua taxa de conversão atual é de <strong className="text-text-main">{data.conversionRate}%</strong>. 
            {data.sourceData[0] && (
              <> O canal com maior potencial residual é <strong className="text-primary">{data.sourceData[0].name}</strong>.</>
            )}
          </p>
        </div>
      </div>
    );
  }

  // --- SLOT: DISTRIBUTION (RING CHART) ---
  if (type === 'distribution') {
    if (workspace === 'law' && perspective === 'default') {
      return (
        <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color shadow-sm relative group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-text-main tracking-widest uppercase opacity-80">Mapa de Radar</h3>
              <p className="text-[10px] text-text-sec mt-0.5">Visão Setorial Jurídica</p>
            </div>
            <PerspectiveSelector options={[{id: 'default', label: 'Radar'}, {id: 'bar', label: 'Barra'}]} />
          </div>
          {perspective === 'default' ? <LawRadarChart data={data} noContainer /> : 
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.distributionData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.3} />
                   <XAxis dataKey="name" stroke="var(--text-sec)" fontSize={10} axisLine={false} tickLine={false} />
                   <RechartsTooltip content={<CustomTooltip formatter={(val: number) => formatCurrency(val)} />} />
                   <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                     {data.distributionData.map((entry: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        </div>
      );
    }

    return (
      <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color shadow-sm flex flex-col justify-between relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-text-main tracking-widest uppercase opacity-80">Distribuição</h3>
            <p className="text-[10px] text-text-sec mt-0.5">Pipeline vs. Pago vs. Lost</p>
          </div>
          <PerspectiveSelector options={[{id: 'default', label: 'Rosca'}, {id: 'bar', label: 'Barra'}]} />
        </div>
        <div style={{ width: '100%', height: 260 }} className="relative mt-2">
          {perspective === 'default' || perspective === 'donut' ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.distributionData}
                    innerRadius={80}
                    outerRadius={112}
                    paddingAngle={2}
                    cornerRadius={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {data.distributionData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip formatter={(val: number) => formatCurrency(val)} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-2 z-10">
                <span className="text-2xl font-black text-text-main tracking-tighter">{formatCurrency(data.totalValue)}</span>
                <span className="text-[9px] uppercase font-black text-text-sec opacity-60 tracking-[0.3em] mt-1">Total Geral</span>
              </div>
            </>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--text-sec)" fontSize={10} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip formatter={(val: number) => formatCurrency(val)} />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.distributionData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  }

  // --- SLOT: REVENUE MAIN (MAIN GROWTH CHART / AGING) ---
  if (type === 'revenue-main') {
    return (
      <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color shadow-sm lg:col-span-2 relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-black text-text-main tracking-widest uppercase opacity-80">
              {workspace === 'law' ? 'Maturidade de Contratos' : 'Fluxo de Receita'}
            </h3>
            <p className="text-[10px] text-text-sec mt-0.5">Volume financeiro projetado por período</p>
          </div>
          <PerspectiveSelector options={[{id: 'default', label: 'Fluxo'}, {id: 'bar', label: 'Mensal'}]} />
        </div>
        <div className="w-full flex-1 min-h-[260px]">
          {perspective === 'bar' ? (
             <ResponsiveContainer width="100%" height={260}>
               <BarChart data={data.funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" stroke="var(--text-sec)" fontSize={10} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip formatter={(val: number) => formatCurrency(val)} />} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} opacity={0.8} />
               </BarChart>
             </ResponsiveContainer>
          ) : (
            workspace === 'law' ? <LawAgingChart data={data} noContainer /> : 
            workspace === 'barber' ? <BarberRebookingChart data={data} noContainer /> : 
            workspace === 'saas' ? <SaasMrrChart data={data} noContainer /> : 
            <GeneralVelocityChart data={data} noContainer />
          )}
        </div>
      </div>
    );
  }

  // --- SLOT: SPOTLIGHT (PARETO RANKING) ---
  if (type === 'spotlight') {
    const listToDisplay = [...(data.list || [])]
      .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
      .slice(0, 5);

    return (
      <div className="bg-bg-sidebar rounded-2xl border border-border-color shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-border-color flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div>
            <h3 className="text-sm font-bold text-text-main tracking-tight uppercase opacity-80">
              {workspace === 'law' ? '💎 Principais Contratos (Big Deals)' :
               workspace === 'barber' ? '🔥 Clientes VIP (Recorrência)' :
               workspace === 'saas' ? '🚀 High LTV Accounts' : '📊 Ranking de Oportunidades'}
            </h3>
            <p className="text-xs text-text-sec mt-1">Top 5 ativos com maior impacto financeiro no pipeline.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[10px] font-black text-text-sec uppercase tracking-[0.1em] border-b border-border-color bg-bg-main/30">
                <th className="px-6 py-4">Lead / Cliente</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Potencial</th>
                <th className="px-6 py-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {listToDisplay.map((lead, idx) => (
                <tr key={lead.id} className="group hover:bg-bg-card transition-colors cursor-pointer" onClick={() => onSelectClient?.(lead)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-bg-main border border-border-color flex items-center justify-center text-[10px] font-black text-primary font-mono">{idx + 1}</div>
                      <div>
                        <p className="font-bold text-text-main">{lead.name}</p>
                        <p className="text-[10px] text-text-sec">{lead.source}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md border ${
                      lead.status === 'Fechado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      lead.status === 'Perdido' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      'bg-primary/10 text-primary border-primary/20'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-bold text-text-sec">100%</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-black text-text-main">{formatCurrency(Number(lead.value) || 0)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- SLOT: SOURCE ANALYSIS ---
  if (type === 'source-analysis') {
    return (
      <div className="bg-bg-sidebar rounded-2xl border border-border-color shadow-sm flex flex-col">
        <div className="p-6 md:p-8 border-b border-border-color">
          <h3 className="text-sm font-bold text-text-main tracking-tight uppercase opacity-80">ROAI: Receita por Origem</h3>
          <p className="text-xs text-text-sec mt-1">Liquidez por Canal Captador</p>
        </div>
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.sourceData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={true} vertical={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-sec)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <RechartsTooltip content={<CustomTooltip formatter={(val: number) => formatCurrency(val)} />} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={32}>
                  {data.sourceData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  // --- SLOT: ACTIVITY (C-LEVEL FEED) ---
  if (type === 'activity') {
    const recentLeads = [...(data.list || [])]
      .sort((a, b) => String(b.id || '').localeCompare(String(a.id || '')))
      .slice(0, 5);

    return (
      <div className="bg-bg-sidebar rounded-2xl border border-border-color shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 md:p-8 border-b border-border-color">
          <h3 className="text-sm font-bold text-text-main tracking-tight uppercase opacity-80">Timeline de Movimentações</h3>
          <p className="text-xs text-text-sec mt-1">Leads recentes por volatilidade de valor</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border-color">
          {recentLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => onSelectClient?.(lead)}
              className="p-4 md:p-6 hover:bg-bg-card transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-bg-main border border-border-color flex items-center justify-center text-primary font-bold shadow-sm group-hover:border-primary/50">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-text-main font-semibold group-hover:text-primary transition-colors text-sm">{lead.name}</h4>
                  <p className="text-xs text-text-sec mt-0.5 truncate max-w-[120px] md:max-w-none">{lead.source}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-text-main">{formatCurrency(Number(lead.value) || 0)}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                   <div className={`w-1.5 h-1.5 rounded-full ${lead.status === 'Fechado' ? 'bg-emerald-500' : lead.status === 'Perdido' ? 'bg-rose-500' : 'bg-primary'}`} />
                   <span className="text-[9px] uppercase font-bold text-text-sec tracking-tighter">{lead.status || 'Active'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 text-center border-2 border-dashed border-border-color rounded-2xl">
      <p className="text-text-sec">Slot de Widget <strong>{type}</strong> aguardando componentes para <strong>{workspace}</strong></p>
    </div>
  );
}
