import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Palette, CheckCircle2, Briefcase, Scissors, Scale, Building2 } from 'lucide-react';
import { MockupGenerator } from '../components/MockupGenerator';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

export const PRESET_THEMES = [
  { name: 'Ouro Premium (Padrão)', primary: '#D4AF37', secondary: '#F3E5AB', gradStart: '#B8860B', gradEnd: '#D4AF37', bgMain: '#0A0A0A', bgSidebar: '#121212', bgCard: '#1A1A1A' },
  { name: 'Azul Meia-Noite', primary: '#3B82F6', secondary: '#60A5FA', gradStart: '#2563EB', gradEnd: '#3B82F6', bgMain: '#0B1120', bgSidebar: '#0F172A', bgCard: '#1E293B' },
  { name: 'Verde Sálvia', primary: '#10B981', secondary: '#34D399', gradStart: '#059669', gradEnd: '#10B981', bgMain: '#022C22', bgSidebar: '#064E3B', bgCard: '#065F46' },
  { name: 'Roxo Imperial', primary: '#A855F7', secondary: '#C084FC', gradStart: '#9333EA', gradEnd: '#A855F7', bgMain: '#09090B', bgSidebar: '#18181B', bgCard: '#27272A' },
  { name: 'Titânio Minimalista', primary: '#F8FAFC', secondary: '#E2E8F0', gradStart: '#94A3B8', gradEnd: '#F8FAFC', bgMain: '#000000', bgSidebar: '#0A0A0A', bgCard: '#141414' },
];

const WORKSPACE_TYPES = [
  { id: 'general', name: 'Vendas Gerais', icon: Building2, description: 'Foco em funil de vendas e leads.' },
  { id: 'barbershop', name: 'Central Barber', icon: Scissors, description: 'Foco em agenda, horários e assinaturas.' },
  { id: 'law_firm', name: 'Advocacia', icon: Scale, description: 'Foco em captação, processos e consultas.' },
];

export function Settings() {
  const { settings, updateSettings, setSettings } = useApp();
  const { showToast } = useToast();
  const [activeTheme, setActiveTheme] = useState(PRESET_THEMES[0].name);
  const [isSaving, setIsSaving] = useState(false);

  // Restaurar tema do Settings Global (DB)
  useEffect(() => {
    const activeThemeDb = settings.active_theme;
    const activeThemeLocal = localStorage.getItem('nexus_theme');
    
    // O banco é a source of truth
    const themeName = activeThemeDb || activeThemeLocal;
    
    if (themeName) {
      const dbTheme = PRESET_THEMES.find(t => t.name === themeName);
      if (dbTheme) {
        setActiveTheme(dbTheme.name);
      }
    }
  }, [settings.active_theme]);

  const handleUpdateSetting = async (key: string, value: string) => {
    setIsSaving(true);
    await updateSettings(key, value);
    setIsSaving(false);
  };

  const applyTheme = async (theme: typeof PRESET_THEMES[0]) => {
    setActiveTheme(theme.name);
    // Aplicação imediata visual
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--grad-start', theme.gradStart);
    root.style.setProperty('--grad-end', theme.gradEnd);
    root.style.setProperty('--bg-main', theme.bgMain);
    root.style.setProperty('--bg-sidebar', theme.bgSidebar);
    root.style.setProperty('--bg-card', theme.bgCard);
    
    // Backup local
    localStorage.setItem('nexus_theme', theme.name);
    
    // Sincronização oficial com BD
    await handleUpdateSetting('active_theme', theme.name);
    
    showToast(`Tema "${theme.name}" integrado ao sistema!`, 'success');
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

        <div className="mb-8">
          <label className="block text-sm font-medium text-text-sec mb-2">Nome do Negócio</label>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={settings.business_name}
              onChange={(e) => setSettings(prev => ({ ...prev, business_name: e.target.value }))}
              className="flex-1 bg-bg-main/20 border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-colors"
              placeholder="Ex: Nexus CRM"
            />
            <button 
              onClick={() => handleUpdateSetting('business_name', settings.business_name)}
              disabled={isSaving}
              className="px-6 py-2.5 bg-primary text-bg-main rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50"
            >
              Salvar Nome
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
          {PRESET_THEMES.map(theme => (
            <button
              key={theme.name}
              onClick={() => applyTheme(theme)}
              className={`flex flex-col items-start p-4 rounded-xl border transition-all ${
                activeTheme === theme.name 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border-color bg-bg-main/20 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span className="font-medium text-text-main">{theme.name}</span>
                {activeTheme === theme.name && <CheckCircle2 size={18} className="text-primary" />}
              </div>
              <div className="flex gap-2 w-full">
                <div className="h-6 flex-1 rounded" style={{ backgroundColor: theme.bgMain, border: '1px solid var(--border-color)' }}></div>
                <div className="h-6 flex-1 rounded" style={{ backgroundColor: theme.bgSidebar, border: '1px solid var(--border-color)' }}></div>
                <div className="h-6 flex-1 rounded" style={{ backgroundColor: theme.primary }}></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <MockupGenerator 
        pageName="Settings" 
        promptDescription="A settings page showing business profile selection and theme customization. Minimalist icons." 
      />
    </div>
  );
}
