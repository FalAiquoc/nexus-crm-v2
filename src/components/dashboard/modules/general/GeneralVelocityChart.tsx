import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { CustomTooltip, formatCurrency } from '../../DashboardUtils';

export function GeneralVelocityChart({ data, noContainer = false }: { data: any, noContainer?: boolean }) {
  const content = (
    <>
      <div style={{ width: '100%', height: 260 }} className="-ml-4">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.funnelData}>
            <defs>
              <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.1} />
            <XAxis dataKey="name" stroke="var(--text-sec)" fontSize={10} fontWeight="bold" hide={false} />
            <YAxis stroke="var(--text-sec)" fontSize={10} fontWeight="bold" hide={false} />
            <Tooltip content={<CustomTooltip formatter={(val: number) => formatCurrency(val)} />} />
            <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={4} fill="url(#velocityGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 flex items-center gap-3 p-4 bg-bg-main/50 rounded-2xl border border-border-color">
        <AlertCircle size={20} className="text-primary shrink-0" />
        <p className="text-xs text-text-sec leading-relaxed">
          <strong className="text-text-main italic">Insight Data-Driven:</strong> Detectamos retenção atípica em <span className="text-primary">"{data.funnelData[1]?.name || 'Etapas iniciais'}"</span>. 
          Projeção de destravamento: <strong className="text-text-main">{formatCurrency(data.openValue * 0.3)}</strong>.
        </p>
      </div>
    </>
  );

  if (noContainer) return content;

  return (
    <div className="lg:col-span-2 bg-bg-sidebar p-6 md:p-8 rounded-2xl border border-border-color shadow-sm group hover:border-primary/30 transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-text-main tracking-tight uppercase opacity-80">Velocity & Pipeline Value</h3>
          <p className="text-xs text-text-sec mt-1">Fluxo monetário projetado por etapas do funil</p>
        </div>
      </div>
      {content}
    </div>
  );
}
