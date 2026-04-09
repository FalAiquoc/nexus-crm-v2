import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Cell, ReferenceLine
} from 'recharts';
import { CustomTooltip, formatCurrency } from '../../DashboardUtils';

const mrrData = [
  { month: 'Jan', new: 1500, expansion: 400, churn: -500, net: 1400 },
  { month: 'Fev', new: 2100, expansion: 600, churn: -300, net: 2400 },
  { month: 'Mar', new: 1800, expansion: 800, churn: -1200, net: 1400 },
  { month: 'Abr', new: 2500, expansion: 300, churn: -400, net: 2400 },
  { month: 'Mai', new: 3200, expansion: 1100, churn: -800, net: 3500 },
  { month: 'Jun', new: 2800, expansion: 500, churn: -200, net: 3100 },
];

export function SaasMrrChart({ data, noContainer }: { data?: any, noContainer?: boolean }) {
  const renderChart = () => (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={mrrData} stackOffset="sign">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
            tickFormatter={(value) => `R$ ${value}`}
          />
          <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            content={({ payload }) => (
              <div className="flex justify-end gap-4 mb-6">
                {payload?.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-sec">
                      {entry.value === 'new' ? 'New MRR' : entry.value === 'expansion' ? 'Expansion' : 'Churn'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
          <Bar dataKey="new" stackId="stack" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expansion" stackId="stack" fill="#6366F1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="churn" stackId="stack" fill="#ef4444" radius={[0, 0, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  if (noContainer) return renderChart();

  return (
    <div className="bg-bg-sidebar border border-border-color p-6 rounded-3xl relative overflow-hidden group h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Movimentação de MRR</h3>
          <p className="text-[10px] text-text-sec mt-1 font-medium opacity-60">Crescimento Mensal Recorrente</p>
        </div>
      </div>
      {renderChart()}
      
      {/* IA Insight Footer */}
      <div className="mt-6 pt-6 border-t border-border-color flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <span className="text-primary font-black text-xs">AI</span>
        </div>
        <div>
          <p className="text-[10px] text-text-main font-bold uppercase tracking-tight">Análise de Health Score</p>
          <p className="text-[10px] text-text-sec mt-1 leading-relaxed italic">
            "Sua 'Expansion MRR' superou o Churn em 2.4x este mês. O Net Revenue Retention (NRR) está em 108%, indicando um modelo de negócio saudável com crescimento orgânico na base atual."
          </p>
        </div>
      </div>
    </div>
  );
}

export function SaasMetricCards({ data }: { data: any }) {
  const metrics = [
    { label: 'LTV', value: 'R$ 14.200', trend: '+12%', sub: 'Lifetime Value' },
    { label: 'CAC', value: 'R$ 850', trend: '-5%', sub: 'Custo de Aquisição' },
    { label: 'Churn Rate', value: '2.4%', trend: '-0.5%', sub: 'Evasão Mensal' },
    { label: 'Payback', value: '3.2 meses', trend: 'Estável', sub: 'Retorno Invest.' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {metrics.map((m, idx) => (
        <div key={idx} className="bg-bg-main border border-border-color p-4 rounded-2xl hover:border-primary/30 transition-all flex flex-col justify-between group">
          <div>
            <span className="text-[9px] font-black text-text-sec uppercase tracking-[0.2em]">{m.label}</span>
            <h4 className="text-lg font-black text-text-main tracking-tighter mt-1">{m.value}</h4>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-[9px] text-text-sec opacity-60 italic">{m.sub}</span>
            <span className={`text-[9px] font-black uppercase ${m.trend.startsWith('+') ? 'text-green-500' : m.trend.startsWith('-') ? 'text-red-500' : 'text-text-sec'}`}>
              {m.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
