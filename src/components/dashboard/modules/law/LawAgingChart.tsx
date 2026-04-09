import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, AlertCircle } from 'lucide-react';
import { CustomTooltip, formatCurrency } from '../../DashboardUtils';

export function LawAgingChart({ data, noContainer = false }: { data: any, noContainer?: boolean }) {
  // Cálculo de Aging (Expectativa vs Liquidação) para Advocacia
  const agingData = [
    { month: 'Jan', expectation: 45000, reality: 42000 },
    { month: 'Fev', expectation: 52000, reality: 48000 },
    { month: 'Mar', expectation: 48000, reality: 49500 },
    { month: 'Abr', expectation: 61000, reality: 35000 }, // Gap detectado
  ];

  const content = (
    <>
      <div style={{ width: '100%', height: 260 }} className="-ml-4">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={agingData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.1} />
            <XAxis dataKey="month" stroke="var(--text-sec)" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
            <YAxis stroke="var(--text-sec)" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip formatter={(val: number) => formatCurrency(val)} />} />
            <Bar dataKey="expectation" fill="var(--primary)" fillOpacity={0.2} radius={[4, 4, 0, 0]} name="Expectativa/Contrato" />
            <Bar dataKey="reality" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Liquidação Real" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-bg-main/50 rounded-2xl border border-border-color flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-text-sec uppercase">Aging Médio (D+N)</p>
            <p className="text-xl font-black text-text-main">41 Dias</p>
          </div>
        </div>
        <div className="p-4 bg-bg-main/50 rounded-2xl border border-border-color flex items-center gap-3">
          <AlertCircle size={20} className="text-rose-500 shrink-0" />
          <p className="text-[11px] text-text-sec leading-tight">
            <strong className="text-text-main">Atenção Crítica:</strong> Gap de faturamento em Abril (Aging {'>'} 60 dias). Recomendamos antecipação de honorários ou revisão de acordos.
          </p>
        </div>
      </div>
    </>
  );

  if (noContainer) return content;

  return (
    <div className="lg:col-span-2 bg-bg-sidebar p-6 md:p-8 rounded-2xl border border-border-color shadow-sm group hover:border-primary/30 transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-text-main tracking-tight uppercase opacity-80">Aging de Honorários: Expectativa vs Liquidação</h3>
          <p className="text-xs text-text-sec mt-1">Comparativo entre contratos assinados e valores efetivamente liquidados.</p>
        </div>
        <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-1.5 animate-pulse">
          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
          <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Liquidez sob Risco</span>
        </div>
      </div>
      {content}
    </div>
  );
}
