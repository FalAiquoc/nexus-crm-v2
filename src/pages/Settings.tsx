import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Palette, CheckCircle2, Briefcase, Scissors, Scale, Building2, Monitor, Sidebar as SidebarIcon, Frame, Database, Trash2, PlayCircle, AlertTriangle } from 'lucide-react';
import { MockupGenerator } from '../components/MockupGenerator';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

import { PRESET_THEMES, ThemeName } from '../constants';

const WORKSPACE_TYPES = [
  { id: 'general', name: 'CRM DoBoy', icon: Building2, description: 'Foco em funil de vendas, leads e gestão comercial.' },
  { id: 'barbershop', name: 'Central Barber DoBoy', icon: Scissors, description: 'Foco em agenda, horários e experiência na barbearia.' },
  { id: 'law_firm', name: 'Advocacia Nexus', icon: Scale, description: 'Foco em captação jurídica, processos e consultas.' },
];

export function Settings() {
  const { settings, updateSettings, setSettings, user, refreshData, isSimulationMode, setIsSimulationMode } = useApp();
  const { showToast } = useToast();
  const [activeTheme, setActiveTheme] = useState(Object.keys(PRESET_THEMES)[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const themeName = settings.active_theme || localStorage.getItem('doboy_theme');
    
    if (themeName && PRESET_THEMES[themeName as ThemeName]) {
      setActiveTheme(themeName);
    }
  }, [settings.active_theme]);

  const handleUpdateSetting = async (key: string, value: string) => {
    setIsSaving(true);
    await updateSettings(key, value);
    setIsSaving(false);
  };

  const applyTheme = async (name: ThemeName) => {
    setActiveTheme(name);
    const themeVars = PRESET_THEMES[name];
    
    // Aplicação imediata visual
    const root = document.documentElement;
    Object.entries(themeVars).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val);
    });
    
    // Backup local
    localStorage.setItem('doboy_theme', name);
    
    // Sincronização oficial com BD
    await handleUpdateSetting('active_theme', name);
    
    showToast(`Tema "${name}" integrado ao sistema!`, 'success');
  };

  const handleClearMockData = async () => {
    if (!window.confirm('Tem certeza que deseja apagar os dados de simulação? Seus dados REAIS não serão afetados.')) return;
    
    try {
      const token = localStorage.getItem('doboy_token');
      const res = await fetch('/api/admin/clear-mock-data', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Dados de simulação removidos! Ocultando Modo Simulação.', 'success');
        setIsSimulationMode(false); // Desativa globalmente
        await refreshData();
      } else {
        showToast('Erro ao limpar dados', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão', 'error');
    }
  };

  const handleSeedMockData = async () => {
    try {
      const token = localStorage.getItem('doboy_token');
      const res = await fetch('/api/admin/seed-mock-data', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Dados Profissionais Injetados! Ativando Modo Simulação.', 'success');
        setIsSimulationMode(true); // Ativa globalmente
        await refreshData();
      } else {
        showToast('Erro ao injetar dados', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="text-primary" size={28} />
          <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-wide">Ajustes & Personalização</h2>
        </div>
        {isSaving && <span className="text-xs text-primary animate-pulse">Salvando alterações...</span>}
      </div>

      {/* Perfil do Negócio */}
      <div className="bg-bg-sidebar border border-border-color p-6 md:p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Briefcase className="text-primary" size={20} />
          <h3 className="text-lg font-semibold text-text-main uppercase tracking-wider">Perfil do Negócio</h3>
        </div>

        <div className="mb-10">
          <label className="block text-xs font-bold text-text-sec uppercase tracking-[0.2em] mb-3">Nome da Organização</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sec group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                value={settings.business_name}
                onChange={(e) => setSettings(prev => ({ ...prev, business_name: e.target.value }))}
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                className="w-full border border-border-color rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium placeholder:text-text-sec/30"
                placeholder="Ex: CRM DoBoy"
              />
            </div>
            <button 
              onClick={() => handleUpdateSetting('business_name', settings.business_name)}
              disabled={isSaving}
              className="px-8 py-3 bg-primary text-bg-main rounded-xl font-bold hover:bg-secondary active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/10 whitespace-nowrap"
            >
              Atualizar Nome
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <label className="block text-sm font-medium text-text-sec">Modelo de Negócio</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {WORKSPACE_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => handleUpdateSetting('workspace_type', type.id)}
                disabled={isSaving}
                className={`p-5 rounded-xl border transition-all text-left ${
                  settings.workspace_type === type.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border-color bg-bg-main/20 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-lg ${settings.workspace_type === type.id ? 'bg-primary text-bg-main' : 'bg-primary/10 text-primary'}`}>
                    <type.icon size={24} />
                  </div>
                  {settings.workspace_type === type.id && <CheckCircle2 size={20} className="text-primary" />}
                </div>
                <h4 className="font-bold text-text-main text-lg mb-1">{type.name}</h4>
                <p className="text-xs text-text-sec leading-relaxed">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Temas */}
      <div className="bg-bg-sidebar border border-border-color p-6 md:p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Palette className="text-primary" size={20} />
          <h3 className="text-lg font-semibold text-text-main uppercase tracking-wider">Temas de Cores</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(PRESET_THEMES)
            .filter(([name]) => {
              const barberThemes = ['Barber Classic', 'Barber Dark', 'Modern Chrome', 'Luxury Barber'];
              if (settings.workspace_type === 'barbershop') {
                return barberThemes.includes(name);
              }
              return !barberThemes.includes(name);
            })
            .map(([name, vars]) => (
            <button
              key={name}
              onClick={() => applyTheme(name as ThemeName)}
              className={`flex flex-col items-start p-4 rounded-xl border transition-all ${
                activeTheme === name 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border-color bg-bg-main/20 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span className="font-medium text-text-main">{name}</span>
                {activeTheme === name && <CheckCircle2 size={18} className="text-primary" />}
              </div>
              <div className="flex gap-2 w-full">
                <div className="h-6 flex-1 rounded" style={{ backgroundColor: vars['bg-main'], border: '1px solid var(--border-color)' }}></div>
                <div className="h-6 flex-1 rounded" style={{ backgroundColor: vars['bg-sidebar'], border: '1px solid var(--border-color)' }}></div>
                <div className="h-6 flex-1 rounded" style={{ backgroundColor: vars['primary'] }}></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* UX & Layout */}
      <div className="bg-bg-sidebar border border-border-color p-6 md:p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Monitor className="text-primary" size={20} />
          <h3 className="text-lg font-semibold text-text-main uppercase tracking-wider">Experiência do Usuário (UX)</h3>
        </div>
        
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-text-sec mb-3">Densidade da Interface</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'comfortable', name: 'Confortável (Padrão)', desc: 'Espaçamentos largos e leitura suave', icon: Frame },
                { id: 'compact', name: 'Comprimida', desc: 'Mais dados na tela, paddings reduzidos', icon: Frame },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleUpdateSetting('ui_density', opt.id)}
                  disabled={isSaving}
                  className={`p-4 rounded-xl border transition-all text-left flex items-start gap-4 ${
                    (settings.ui_density || 'comfortable') === opt.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border-color bg-bg-main/20 hover:border-primary/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    (settings.ui_density || 'comfortable') === opt.id ? 'bg-primary text-bg-main' : 'bg-bg-card text-text-sec'
                  }`}>
                    <opt.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-main text-sm">{opt.name}</span>
                      {(settings.ui_density || 'comfortable') === opt.id && <CheckCircle2 size={16} className="text-primary" />}
                    </div>
                    <p className="text-xs text-text-sec leading-relaxed mt-1">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-sec mb-3">Comportamento do Menu Lateral</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'auto', name: 'Automático', desc: 'Expande sobre o conteúdo ao passar o mouse' },
                { id: 'fixed', name: 'Fixo', desc: 'Sempre aberto, dividindo espaço com a tela' },
                { id: 'minimized', name: 'Minimizado', desc: 'Apenas ícones e sem expansão fluida' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleUpdateSetting('sidebar_mode', opt.id)}
                  disabled={isSaving}
                  className={`p-4 rounded-xl border transition-all text-left flex items-start gap-3 ${
                    (settings.sidebar_mode || 'auto') === opt.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border-color bg-bg-main/20 hover:border-primary/50'
                  }`}
                >
                  <SidebarIcon size={18} className={(settings.sidebar_mode || 'auto') === opt.id ? 'text-primary' : 'text-text-sec'} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-main text-sm">{opt.name}</span>
                      {(settings.sidebar_mode || 'auto') === opt.id && <CheckCircle2 size={16} className="text-primary" />}
                    </div>
                    <p className="text-[11px] text-text-sec leading-relaxed mt-1">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Controls - Simulation */}
      {user?.role === 'admin' && (
        <div className="bg-bg-sidebar border border-border-color p-6 md:p-8 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Database className="text-primary" size={20} />
            <h3 className="text-lg font-semibold text-text-main uppercase tracking-wider">Controles de Desenvolvedor</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={handleSeedMockData}
              className="p-4 rounded-xl border border-border-color bg-bg-main/20 hover:bg-primary/10 hover:border-primary/50 transition-all text-left flex items-center gap-3"
            >
              <PlayCircle className="text-primary" size={24} />
              <div>
                <span className="font-bold text-text-main text-sm block">Injetar Dados Fake</span>
                <span className="text-[10px] text-text-sec">Popula o sistema para testes</span>
              </div>
            </button>

            <button
              onClick={handleClearMockData}
              className="p-4 rounded-xl border border-border-color bg-bg-main/20 hover:bg-red-500/10 hover:border-red-500/50 transition-all text-left flex items-center gap-3"
            >
              <Trash2 className="text-red-500" size={24} />
              <div>
                <span className="font-bold text-text-main text-sm block">Limpar Dados Fake</span>
                <span className="text-[10px] text-text-sec">Remove todos os dados de teste</span>
              </div>
            </button>

            <button
              onClick={() => setIsSimulationMode(!isSimulationMode)}
              className={`p-4 rounded-xl border transition-all text-left flex items-center gap-3 ${
                isSimulationMode ? 'bg-amber-500/10 border-amber-500/50' : 'bg-bg-main/20 hover:border-primary/50'
              }`}
            >
              <AlertTriangle className={isSimulationMode ? 'text-amber-500' : 'text-text-sec'} size={24} />
              <div>
                <span className="font-bold text-text-main text-sm block">Modo Simulação</span>
                <span className="text-[10px] text-text-sec">{isSimulationMode ? 'Ativo' : 'Inativo'}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      <MockupGenerator 
        pageName="Settings" 
        promptDescription="A settings page showing business profile selection and theme customization. Minimalist icons." 
      />
    </div>
  );
}
