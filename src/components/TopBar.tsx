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
  User,
  Hexagon
} from 'lucide-react';
import { Page } from '../types';

interface TopBarProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  workspaceType?: 'general' | 'barbershop' | 'law_firm';
  businessName?: string;
  onOpenMobileMenu: () => void;
  sidebarMode?: 'fixed' | 'auto' | 'minimized';
  currentPage: Page;
}

export function TopBar({ 
  user,
  onLogout,
  onNavigate, 
  isCollapsed, 
  onToggleCollapse, 
  workspaceType = 'general',
  businessName = workspaceType === 'barbershop' ? 'Central Barber DoBoy' : 'CRM DoBoy',
  onOpenMobileMenu,
  sidebarMode = 'auto',
  currentPage
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

        {/* Botão de Toggle - Oculto no modo Automático para evitar conflitos de clique/hover */}
        {sidebarMode !== 'auto' && (
          <button 
            onClick={onToggleCollapse}
            className="hidden md:flex p-2 text-text-sec hover:text-primary hover:bg-bg-card rounded-lg transition-colors"
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        )}
        
        <div className="flex items-center gap-3 ml-2 border-l border-border-color pl-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-primary/50 uppercase tracking-[0.2em] leading-none mb-0.5">
              {workspaceType === 'barbershop' ? 'Gestão de Unidade' : 'BI Intelligence'}
            </span>
            <h2 className="text-sm font-black text-white uppercase tracking-tighter leading-none">
              {workspaceType === 'barbershop' ? 'Central Barber DoBoy' : 
               workspaceType === 'law_firm' ? 'Advocacia Nexus' : 
               businessName || 'Nexus CRM v2'}
            </h2>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1 ml-4">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
              currentPage === 'dashboard' ? 'text-primary bg-primary/10' : 'text-text-sec hover:text-text-main hover:bg-bg-card'
            }`}
          >
            <LayoutGrid size={14} />
            Dashboard
          </button>
          {(workspaceType === 'barbershop' || workspaceType === 'law_firm') && (
            <button 
              onClick={() => onNavigate('calendar')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
                currentPage === 'calendar' ? 'text-primary bg-primary/10' : 'text-text-sec hover:text-text-main hover:bg-bg-card'
              }`}
            >
              <CalendarIcon size={14} />
              Agenda
            </button>
          )}
          <button 
            onClick={() => onNavigate('form')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
              currentPage === 'form' ? 'text-primary bg-primary/10' : 'text-text-sec hover:text-text-main hover:bg-bg-card'
            }`}
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
                  <div 
                    onClick={() => {
                      onNavigate('contacts');
                      setIsNotificationsOpen(false);
                    }}
                    className="p-4 border-b border-border-color hover:bg-bg-card transition-colors cursor-pointer"
                  >
                    <p className="text-sm text-text-main font-medium">Novo lead cadastrado</p>
                    <p className="text-xs text-text-sec mt-1">João Silva se cadastrou via formulário do site.</p>
                    <p className="text-[10px] text-text-sec mt-2">Há 5 minutos</p>
                  </div>
                  <div 
                    onClick={() => {
                      onNavigate('subscriptions');
                      setIsNotificationsOpen(false);
                    }}
                    className="p-4 border-b border-border-color hover:bg-bg-card transition-colors cursor-pointer"
                  >
                    <p className="text-sm text-text-main font-medium">Pagamento confirmado</p>
                    <p className="text-xs text-text-sec mt-1">Fatura #1024 paga com sucesso.</p>
                    <p className="text-[10px] text-text-sec mt-2">Há 2 horas</p>
                  </div>
                </div>
                <div className="p-3 text-center border-t border-border-color bg-bg-main/50">
                  <button 
                    onClick={() => {
                      onNavigate('notifications');
                      setIsNotificationsOpen(false);
                    }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Ver todas
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="hidden sm:block h-8 w-px bg-border-color mx-1"></div>

          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1 hover:bg-bg-card rounded-full transition-all border border-transparent hover:border-border-color group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-grad-start to-grad-end flex items-center justify-center text-[var(--text-on-grad)] font-black text-[13px] border border-primary/30 shadow-lg shadow-primary/10 shrink-0 transform group-hover:scale-105 transition-transform">
                {user?.name?.substring(0, 2).toUpperCase() || 'DX'}
              </div>
              <div className="hidden sm:block text-left mr-1">
                <p className="text-[12px] font-bold text-text-main leading-tight group-hover:text-primary transition-colors">{user?.name || 'Diogo Admin'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 tracking-widest uppercase">{user?.role || 'ADMIN'}</span>
                </div>
              </div>
              <ChevronDown size={14} className={`text-text-sec transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-bg-sidebar border border-border-color rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-border-color bg-bg-main/50">
                  <p className="text-sm font-bold text-text-main">{user?.name || 'Usuário DoBoy'}</p>
                  <p className="text-xs text-text-sec truncate">{user?.email || 'email@exemplo.com'}</p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => {
                      onNavigate('profile');
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
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors text-left font-bold"
                  >
                    <LogOut size={16} />
                    Sair da Sessão
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
