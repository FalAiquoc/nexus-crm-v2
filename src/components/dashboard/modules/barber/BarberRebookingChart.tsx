import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, BarChart, Bar, Cell
} from 'recharts';
import { CustomTooltip } from '../../DashboardUtils';

const rebookingData = [
  { month: 'Jan', returning: 65, newLeads: 45, rate: 58 },
  { month: 'Fev', returning: 72, newLeads: 38, rate: 65 },
  { month: 'Mar', returning: 85, newLeads: 52, rate: 62 },
  { month: 'Abr', returning: 92, newLeads: 48, rate: 68 },
  { month: 'Mai', returning: 110, newLeads: 60, rate: 71 },
  { month: 'Jun', returning: 125, newLeads: 55, rate: 75 },
];

export function BarberRebookingChart({ data, noContainer }: { data?: any, noContainer?: boolean }) {
  const renderChart = () => (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rebookingData}>
          <defs>
            <linearGradient id="colorReturning" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
          />
          <Tooltip content={<CustomTooltip suffix=" agendamentos" />} />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            content={({ payload }) => (
              <div className="flex justify-end gap-4 mb-6">
                {payload?.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-sec">{entry.value === 'returning' ? 'Retenção' : 'Aquisição'}</span>
                  </div>
                ))}
              </div>
            )}
          />
          <Area 
            name="newLeads"
            type="monotone" 
            dataKey="newLeads" 
            stroke="#6366F1" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorNew)" 
          />
          <Area 
            name="returning"
            type="monotone" 
            dataKey="returning" 
            stroke="var(--primary)" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorReturning)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  if (noContainer) return renderChart();

  return (
    <div className="bg-bg-sidebar border border-border-color p-6 rounded-3xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Rebooking Rate</h3>
          <p className="text-[10px] text-text-sec mt-1 font-medium opacity-60">Fidelização vs Novos Clientes</p>
        </div>
        <div className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-black rounded-lg uppercase tracking-tighter">
          Target: 70%
        </div>
      </div>
      {renderChart()}
      
      {/* IA Insight Footer */}
      <div className="mt-6 pt-6 border-t border-border-color flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <span className="text-primary font-black text-xs">AI</span>
        </div>
        <div>
          <p className="text-[10px] text-text-main font-bold uppercase tracking-tight">Insight Estratégico</p>
          <p className="text-[10px] text-text-sec mt-1 leading-relaxed italic">
            "Sua taxa de rebooking cresceu 7% nos últimos 2 meses. O aumento na base de 'Retenção' indica que a estratégia de fidelização pós-corte está consolidando a receita recorrente."
          </p>
        </div>
      </div>
    </div>
  );
}

export function BarberPredictiveTable() {
  const segments = [
    { name: 'Champions', count: 42, color: '#22c55e', risk: 'Baixo', action: 'Programa VIP' },
    { name: 'Leal', count: 128, color: '#eab308', risk: 'Médio', action: 'Upsell Barba' },
    { name: 'Em Risco', count: 35, color: '#ef4444', risk: 'Alto', action: 'Cupom Retorno' },
    { name: 'Perdido', count: 12, color: '#6b7280', risk: 'Crítico', action: 'Reativação' },
  ];

  return (
    <div className="bg-bg-sidebar border border-border-color p-6 rounded-3xl h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Status de Retenção</h3>
          <p className="text-[10px] text-text-sec mt-1 font-medium opacity-60">Segmentação Preditiva (IA)</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {segments.map((seg, idx) => (
          <div key={idx} className="p-4 bg-bg-main border border-border-color rounded-2xl flex items-center justify-between hover:border-primary/30 transition-all cursor-default group">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: seg.color }} />
              <div>
                <h4 className="text-xs font-black text-text-main uppercase">{seg.name}</h4>
                <p className="text-[10px] text-text-sec mt-0.5">{seg.count} Clientes</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                seg.risk === 'Baixo' ? 'bg-green-500/10 text-green-500' : 
                seg.risk === 'Médio' ? 'bg-yellow-500/10 text-yellow-500' : 
                'bg-red-500/10 text-red-500'
              }`}>
                Risco {seg.risk}
              </span>
              <p className="text-[9px] text-primary font-bold mt-1.5 uppercase group-hover:underline">{seg.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
