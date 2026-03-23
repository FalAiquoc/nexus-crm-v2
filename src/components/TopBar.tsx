import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Plus, 
  ChevronDown,
  LayoutGrid,
  Calendar as CalendarIcon,
  UserPlus,
  PanelLeftClose,
  PanelLeft,
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { Page } from '../types';

interface TopBarProps {
  onNavigate: (page: Page) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  workspaceType?: 'general' | 'barbershop' | 'law_firm';
  businessName?: string;
  onOpenMobileMenu: () => void;
}

export function TopBar({ 
  onNavigate, 
  isCollapsed, 
  onToggleCollapse, 
  workspaceType = 'general',
  businessName = 'Nexus CRM',
  onOpenMobileMenu
}: TopBarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-bg-main border-b border-border-color flex items-center justify-between px-4 md:px-8 shrink-0 z-20">
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-text-sec hover:text-primary hover:bg-bg-card rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>

        <button 
          onClick={onToggleCollapse}
          className="hidden md:flex p-2 text-text-sec hover:text-primary hover:bg-bg-card rounded-lg transition-colors"
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-bg-main font-bold shrink-0">
            N
          </div>
          <span className="text-text-main font-semibold text-sm truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">
            {businessName === 'Nexus CRM' && workspaceType === 'barbershop' ? 'Central Barber' : businessName}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1 ml-4">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="px-3 py-1.5 text-xs font-medium text-text-sec hover:text-text-main hover:bg-bg-card rounded-md transition-colors flex items-center gap-2"
          >
            <LayoutGrid size={14} />
            Dashboard
          </button>
          {(workspaceType === 'barbershop' || workspaceType === 'law_firm') && (
            <button 
              onClick={() => onNavigate('calendar')}
              className="px-3 py-1.5 text-xs font-medium text-text-sec hover:text-text-main hover:bg-bg-card rounded-md transition-colors flex items-center gap-2"
            >
              <CalendarIcon size={14} />
              Agenda
            </button>
          )}
          <button 
            onClick={() => onNavigate('form')}
            className="px-3 py-1.5 text-xs font-medium text-text-sec hover:text-text-main hover:bg-bg-card rounded-md transition-colors flex items-center gap-2"
          >
            <UserPlus size={14} />
            {workspaceType === 'barbershop' ? 'Novo Cliente' : 'Novo Lead'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="bg-bg-card border border-border-color rounded-full pl-10 pr-4 py-1.5 text-xs text-text-main focus:outline-none focus:border-primary w-40 lg:w-64 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 text-text-sec hover:text-primary hover:bg-bg-card rounded-full transition-colors relative"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-bg-main"></span>
            </button>
            
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-bg-sidebar border border-border-color rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-border-color flex items-center justify-between bg-bg-main/50">
                  <h3 className="font-bold text-text-main">Notificações</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">2 novas</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="p-4 border-b border-border-color hover:bg-bg-card transition-colors cursor-pointer">
                    <p className="text-sm text-text-main font-medium">Novo lead cadastrado</p>
                    <p className="text-xs text-text-sec mt-1">João Silva se cadastrou via formulário do site.</p>
                    <p className="text-[10px] text-text-sec mt-2">Há 5 minutos</p>
                  </div>
                  <div className="p-4 border-b border-border-color hover:bg-bg-card transition-colors cursor-pointer">
                    <p className="text-sm text-text-main font-medium">Pagamento confirmado</p>
                    <p className="text-xs text-text-sec mt-1">Fatura #1024 paga com sucesso.</p>
                    <p className="text-[10px] text-text-sec mt-2">Há 2 horas</p>
                  </div>
                </div>
                <div className="p-3 text-center border-t border-border-color bg-bg-main/50">
                  <button className="text-xs text-primary font-bold hover:underline">Ver todas</button>
                </div>
              </div>
            )}
          </div>
          
          <div className="hidden sm:block h-8 w-px bg-border-color mx-1"></div>

          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 pl-1 pr-2 hover:bg-bg-card rounded-full transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-grad-start to-grad-end flex items-center justify-center text-bg-main font-bold text-xs border border-primary/20 shrink-0">
                PR
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-bold text-text-main leading-none">Pedro Renault</p>
                <p className="text-[9px] text-text-sec leading-none mt-0.5 uppercase tracking-tighter">Administrador</p>
              </div>
              <ChevronDown size={14} className="text-text-sec group-hover:text-text-main" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-bg-sidebar border border-border-color rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-border-color bg-bg-main/50">
                  <p className="text-sm font-bold text-text-main">Pedro Renault</p>
                  <p className="text-xs text-text-sec truncate">pedrorenault31@gmail.com</p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => {
                      onNavigate('settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-sec hover:text-text-main hover:bg-bg-card rounded-xl transition-colors text-left"
                  >
                    <User size={16} />
                    Meu Perfil
                  </button>
                  <button 
                    onClick={() => {
                      onNavigate('settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-sec hover:text-text-main hover:bg-bg-card rounded-xl transition-colors text-left"
                  >
                    <Settings size={16} />
                    Ajustes
                  </button>
                </div>
                <div className="p-2 border-t border-border-color">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors text-left">
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
