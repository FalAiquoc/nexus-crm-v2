import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Shield } from 'lucide-react';
import { CustomTooltip } from '../../DashboardUtils';

export function LawRadarChart({ data, noContainer = false }: { data: any, noContainer?: boolean }) {
  // Dados de balanceamento por competência jurídica
  const radarData = [
    { subject: 'Judiciário', A: 120, fullMark: 150 },
    { subject: 'Extrajudicial', A: 98, fullMark: 150 },
    { subject: 'Consultivo', A: 86, fullMark: 150 },
    { subject: 'Administrativo', A: 99, fullMark: 150 },
    { subject: 'Compliance', A: 85, fullMark: 150 },
  ];

  const content = (
    <>
      <div style={{ width: '100%', height: 260 }} className="relative mt-2">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid stroke="var(--border-color)" opacity={0.3} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-sec)', fontSize: 10, fontWeight: 'bold' }} />
            <Radar
              name="Volume de Ativos"
              dataKey="A"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.4}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-col gap-2">
         <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-tighter text-text-sec">
            <span>Foco Principal</span>
            <span className="text-primary">Judiciário (42%)</span>
         </div>
         <div className="w-full h-1 bg-bg-main rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '42%' }} />
         </div>
      </div>
    </>
  );

  if (noContainer) return content;

  return (
    <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color shadow-sm flex flex-col justify-between relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-black text-text-main tracking-widest uppercase opacity-80">Pista do Cliente</h3>
          <p className="text-[10px] text-text-sec mt-0.5">Balanceamento de Competências</p>
        </div>
        <Shield size={14} className="text-primary" />
      </div>
      {content}
    </div>
  );
}
