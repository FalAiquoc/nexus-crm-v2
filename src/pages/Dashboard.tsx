import React, { useMemo } from 'react';
import { 
  Filter, Download, Activity, Loader2, AlertCircle, Shield, ShoppingBag, Rocket
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WidgetContainer } from '../components/dashboard/WidgetContainer';
import { ExportModal } from '../components/dashboard/ExportModal';

export function Dashboard({ onSelectClient }: { onSelectClient?: (client: any) => void }) {
  const { clients, stages, settings, updateSettings, isLoading, isSimulatedMode } = useApp();
  const workspaceType = settings.workspace_type || 'general';
  const [dateFilter, setDateFilter] = React.useState('total');
  const [isExportOpen, setIsExportOpen] = React.useState(false);

  const filterOptions = useMemo(() => {
    if (workspaceType === 'law') return [
      { id: 'total', label: 'Todo o Período' },
      { id: 'semester', label: 'Este Semestre' },
      { id: 'quarter', label: 'Este Trimestre' },
      { id: 'month', label: 'Este Mês' }
    ];
    if (workspaceType === 'barber') return [
      { id: 'total', label: 'Todo o Período' },
      { id: 'month', label: 'Este Mês' },
      { id: 'week', label: 'Esta Semana' },
      { id: 'today', label: 'Hoje' }
    ];
    return [
      { id: 'total', label: 'Todo o Período' },
      { id: 'ytd', label: 'Este Ano (YTD)' },
      { id: 'month', label: 'Este Mês' },
      { id: '30days', label: 'Últimos 30 dias' }
    ];
  }, [workspaceType]);

  const memoizedData = useMemo(() => {
    let list = clients || [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter !== 'total') {
      list = list.filter(c => {
        if (!c.created_at) return false;
        const created = new Date(c.created_at);
        switch (dateFilter) {
          case 'today': return created >= startOfToday;
          case 'week': return created >= new Date(now.setDate(now.getDate() - now.getDay()));
          case 'month': return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
          case 'quarter': return Math.floor(now.getMonth()/3) === Math.floor(created.getMonth()/3) && created.getFullYear() === now.getFullYear();
          case 'semester': return (now.getMonth() < 6 ? 0 : 1) === (created.getMonth() < 6 ? 0 : 1) && created.getFullYear() === now.getFullYear();
          case 'ytd': return created.getFullYear() === now.getFullYear();
          case '30days': return created >= new Date(new Date().setDate(now.getDate() - 30));
          default: return true;
        }
      });
    }

    const totalLeads = list.length;
    const openValue = list.filter(c => c.status !== 'Fechado' && c.status !== 'Perdido').reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const closedValue = list.filter(c => c.status === 'Fechado').reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const totalValue = list.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const conversionRate = totalLeads > 0 ? ((list.filter(c => c.status === 'Fechado').length / totalLeads) * 100).toFixed(1) : 0;

    const funnelData = (stages || []).map((s: any) => ({
      name: s.name,
      value: list.filter(c => c?.status === s.name).reduce((sum, c) => sum + (Number(c.value) || 0), 0)
    }));

    const sourceMap = list.reduce((acc: any, c) => {
      const source = c.source || 'Outro';
      if (!acc[source]) acc[source] = { name: source, count: 0, revenue: 0 };
      acc[source].count += 1;
      if (c.status === 'Fechado') acc[source].revenue += (Number(c.value) || 0);
      return acc;
    }, {});

    const distributionData = [
      { name: 'Em Pipeline', value: list.filter(c => c.status !== 'Fechado' && c.status !== 'Perdido').reduce((acc, curr) => acc + (Number(curr.value) || 0), 0), color: '#eab308' },
      { name: 'Convertido', value: closedValue, color: '#22c55e' },
      { name: 'Perdido', value: list.filter(c => c.status === 'Perdido').reduce((acc, curr) => acc + (Number(curr.value) || 0), 0), color: '#ef4444' }
    ];

    return {
      totalLeads, totalValue, openValue, closedValue, conversionRate,
      funnelData, sourceData: Object.values(sourceMap).sort((a: any, b: any) => b.revenue - a.revenue),
      distributionData, list
    };
  }, [clients, dateFilter, stages]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-primary"><Loader2 size={40} className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 overflow-x-hidden">
      
      <div className="flex items-center gap-2 p-1 bg-bg-sidebar border border-border-color rounded-2xl w-fit mb-2 shadow-sm animate-in fade-in slide-in-from-top duration-500">
        <button 
          onClick={() => updateSettings('workspace_type', 'general')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${workspaceType === 'general' ? 'bg-primary text-bg-main shadow-lg shadow-primary/20' : 'text-text-sec hover:text-text-main'}`}
        >
          <Activity size={12} /> Geral
        </button>
        <button 
          onClick={() => updateSettings('workspace_type', 'law')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${workspaceType === 'law' ? 'bg-primary text-bg-main shadow-lg shadow-primary/20' : 'text-text-sec hover:text-text-main'}`}
        >
          <Shield size={12} /> Advocacia
        </button>
        <button 
          onClick={() => updateSettings('workspace_type', 'barber')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${workspaceType === 'barber' ? 'bg-primary text-bg-main shadow-lg shadow-primary/20' : 'text-text-sec hover:text-text-main'}`}
        >
          <ShoppingBag size={12} /> Estética
        </button>
        <button 
          onClick={() => updateSettings('workspace_type', 'saas')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${workspaceType === 'saas' ? 'bg-primary text-bg-main shadow-lg shadow-primary/20' : 'text-text-sec hover:text-text-main'}`}
        >
          <Rocket size={12} /> SaaS/Agência
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-sidebar border border-border-color p-5 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-all"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-bg-main border border-border-color rounded-2xl shadow-inner group-hover:border-primary/50 transition-all">
            <Activity className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-main tracking-tighter flex items-center gap-2">
              BI Intelligence
            </h1>
            <p className="text-text-sec mt-0.5 text-xs font-medium opacity-60">Análise de liquidez e previsibilidade de caixa.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto mt-2 md:mt-0">
          <div className="flex bg-bg-main border border-border-color rounded-2xl overflow-hidden focus-within:border-primary transition-all flex-1 md:flex-none">
            <div className="bg-bg-card px-3 flex items-center border-r border-border-color">
              <Filter size={14} className="text-text-sec" />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent px-4 py-2.5 text-[11px] font-black uppercase text-text-main focus:outline-none appearance-none cursor-pointer pr-10"
            >
              {filterOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setIsExportOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/30 rounded-2xl text-[11px] font-black uppercase text-primary hover:bg-primary hover:text-bg-main transition-all group-active:scale-95 shadow-lg shadow-primary/5"
          >
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {isSimulatedMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
            <AlertCircle className="text-amber-500" size={20} />
            <p className="text-xs font-bold text-amber-500 uppercase tracking-tighter">Sandbox Mode Active: Visualizing Synthetic Intelligence Data</p>
        </div>
      )}

      <WidgetContainer type="insight" workspace={workspaceType as any} data={memoizedData} />

      <WidgetContainer type="kpi-strip" workspace={workspaceType as any} data={memoizedData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WidgetContainer type="distribution" workspace={workspaceType as any} data={memoizedData} />
        <WidgetContainer type="revenue-main" workspace={workspaceType as any} data={memoizedData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetContainer type="source-analysis" workspace={workspaceType as any} data={memoizedData} />
        <WidgetContainer type="activity" workspace={workspaceType as any} data={memoizedData} onSelectClient={onSelectClient} />
      </div>

      <WidgetContainer type="spotlight" workspace={workspaceType as any} data={memoizedData} onSelectClient={onSelectClient} />

      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        data={memoizedData} 
        workspaceType={workspaceType} 
      />
    </div>
  );
}
