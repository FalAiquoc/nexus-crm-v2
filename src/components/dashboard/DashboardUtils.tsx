import React from 'react';

// Custom Tooltips para visual de Software BI de Alta Performance
export const CustomTooltip = ({ active, payload, label, formatter, suffix = "" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-primary/30 p-5 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.9)] border-l-4 border-l-primary animate-in fade-in zoom-in duration-200 relative z-[9999] opacity-100">
        <p className="text-text-sec text-[10px] uppercase font-black tracking-[0.2em] mb-3 opacity-50">{label || 'Métrica'}</p>
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

export const formatCurrency = (val: number) => {
  if (val === 0) return 'R$ 0,00';
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(2)}M`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`;
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
};

export const THEME_COLORS = [
  'var(--primary)',
  'var(--secondary)',
  '#6366F1', // Indigo Insight
  '#8B5CF6', // Violet Value
  '#EC4899', // Pink Performance
  '#F59E0B'  // Amber Alert
];
