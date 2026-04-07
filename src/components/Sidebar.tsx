import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  UserPlus, 
  Users, 
  Hexagon, 
  Zap, 
  BarChart3, 
  Link2, 
  Settings,
  LogOut,
  Calendar,
  CreditCard,
  X,
  Monitor,
  PanelLeftClose
} from 'lucide-react';
import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  workspaceType?: 'general' | 'barbershop' | 'law_firm';
  sidebarMode?: 'fixed' | 'auto' | 'minimized';
  setSidebarMode?: (mode: 'fixed' | 'auto' | 'minimized') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  user: any;
  pendingRequestsCount?: number;
  businessName?: string;
}


export function Sidebar({ 
  currentPage, 
  onNavigate, 
  onLogout, 
  workspaceType = 'general',
  user,
  sidebarMode = 'auto',
  setSidebarMode,
  isCollapsed,
  onToggleCollapse, 
  isMobileMenuOpen,
  onCloseMobileMenu,
  pendingRequestsCount = 0,
  businessName = workspaceType === 'barbershop' ? 'Central Barber DoBoy' : 'CRM DoBoy'
}: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Lógica cirúrgica: no modo auto, ignoramos isCollapsed para evitar travas
  const effectiveCollapsed = 
    sidebarMode === 'auto' ? !isHovered : 
    sidebarMode === 'minimized' ? true : 
    isCollapsed;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { 
      id: 'calendar', 
      label: 'Agenda', 
      icon: Calendar, 
      show: workspaceType === 'barbershop' || workspaceType === 'law_firm' 
    },
    { 
      id: 'kanban', 
      label: workspaceType === 'law_firm' ? 'Processos' : 'Kanban', 
      icon: KanbanSquare, 
      show: true 
    },
    { 
      id: 'subscriptions', 
      label: workspaceType === 'barbershop' ? 'Clube / Planos' : 'Assinaturas', 
      icon: CreditCard, 
      show: workspaceType === 'barbershop' 
    },
    { id: 'form', label: workspaceType === 'barbershop' ? 'Novo Cliente' : 'Novo Lead', icon: UserPlus, show: true },
    { id: 'contacts', label: 'Contatos', icon: Users, show: true },
    { id: 'automation', label: 'Automação', icon: Zap, show: true },
    { id: 'analytics', label: 'Relatórios', icon: BarChart3, show: true },
    { id: 'integrations', label: 'Integrações', icon: Link2, show: true },
    { id: 'users', label: 'Usuários', icon: Users, show: user?.role === 'admin' },
    { id: 'settings', label: 'Ajustes', icon: Settings, show: true },
  ] as const;

  const visibleItems = navItems.filter(item => item.show);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    onCloseMobileMenu();
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobileMenu}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-bg-sidebar border-r border-border-color z-[70] md:hidden flex flex-col"
            >
              <div className="p-6 border-b border-border-color flex items-center justify-between">
                <div className="flex items-center gap-2 max-w-[120px] xs:max-w-none">
                  <div className="w-8 h-8 bg-gradient-to-br from-grad-start to-grad-end rounded-lg flex items-center justify-center text-bg-main font-bold shrink-0 shadow-lg shadow-primary/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-bg-main">
                      <path d="M12 2L17.5 5.5L22 12L17.5 18.5L12 22L6.5 18.5L2 12L6.5 5.5L12 2Z" />
                    </svg>
                  </div>
                  <span className="text-text-main font-bold text-sm truncate uppercase tracking-tight">
                    {businessName}
                  </span>
                </div>
                <button 
                  onClick={onCloseMobileMenu}
                  className="p-2 text-text-sec hover:text-text-main hover:bg-bg-card rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>


              <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id as Page)}
                      className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                        isActive
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-text-sec hover:text-text-main hover:bg-bg-card'
                      }`}
                    >
                      <div className="relative">
                        <Icon size={20} className={isActive ? 'text-primary' : ''} strokeWidth={isActive ? 2.5 : 2} />
                        {item.id === 'users' && pendingRequestsCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-bg-sidebar" />
                        )}
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border-color space-y-2">
                <div className="flex items-center gap-1 bg-bg-main/50 p-1 rounded-lg border border-border-color">
                  {(['fixed', 'auto', 'minimized'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSidebarMode?.(mode);
                      }}
                      title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                      className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${
                        sidebarMode === mode ? 'bg-primary text-bg-main' : 'text-text-sec hover:text-text-main'
                      }`}
                    >
                      {mode === 'fixed' && <Monitor size={14} />}
                      {mode === 'auto' && <Zap size={14} />}
                      {mode === 'minimized' && <PanelLeftClose size={14} />}
                    </button>
                  ))}
                </div>

                <div className="px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest text-shadow-sm">v2.2.0 Platinum</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    </div>
                  </div>
                  <p className="text-[9px] text-text-sec font-medium leading-tight">Módulo BI & Analytics Restaurado</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-amber-500/80 hover:text-amber-500 hover:bg-amber-500/10 transition-all font-bold text-xs"
                >
                  <LogOut size={18} />
                  <span className="whitespace-nowrap">Encerrar Sessão</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div 
        onMouseEnter={() => sidebarMode === 'auto' && setIsHovered(true)}
        onMouseLeave={() => sidebarMode === 'auto' && setIsHovered(false)}
        className={`${effectiveCollapsed ? 'w-20' : 'w-64'} hidden md:flex h-screen bg-bg-sidebar border-r border-border-color flex-col shrink-0 transition-all duration-300 ease-in-out relative ${sidebarMode === 'auto' && isCollapsed ? 'z-50 shadow-2xl' : ''}`}
      >
        <div className={`p-6 ${effectiveCollapsed ? 'px-4' : 'px-8'} pb-6 border-b border-border-color flex items-center justify-between`}>
          <div className={`flex items-center gap-3 transition-all duration-300 ${effectiveCollapsed ? 'justify-center w-full' : 'w-auto'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-grad-start to-grad-end rounded-lg flex items-center justify-center text-bg-main font-bold shrink-0 shadow-lg shadow-primary/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-bg-main">
                <path d="M12 2L17.5 5.5L22 12L17.5 18.5L12 22L6.5 18.5L2 12L6.5 5.5L12 2Z" />
              </svg>
            </div>
            {!effectiveCollapsed && (
              <h1 className="text-2xl font-bold text-primary tracking-wide uppercase truncate">
                {businessName}
              </h1>
            )}
          </div>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto overflow-x-hidden">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as Page)}
                title={effectiveCollapsed ? item.label : ''}
                className={`w-full flex items-center space-x-4 px-3 py-3 rounded-lg transition-all duration-200 font-medium group ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-text-sec hover:text-text-main hover:bg-bg-card'
                }`}
              >
                <div className="relative">
                  <Icon size={20} className={`${isActive ? 'text-primary' : ''} shrink-0`} strokeWidth={isActive ? 2.5 : 2} />
                  {item.id === 'users' && pendingRequestsCount > 0 && (
                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-bg-sidebar transition-all ${effectiveCollapsed ? 'scale-110' : 'scale-100'}`} />
                  )}
                </div>
                <span className={`whitespace-nowrap transition-all duration-300 ${effectiveCollapsed ? 'opacity-0 w-0 translate-x-4' : 'opacity-100 w-auto translate-x-0'}`}>
                  {item.label}
                  {item.id === 'users' && pendingRequestsCount > 0 && !effectiveCollapsed && (
                    <span className="ml-2 px-1.5 py-0.5 bg-rose-500 text-[10px] text-white rounded-md font-bold">
                      {pendingRequestsCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-3 border-t border-border-color space-y-2">
          {!effectiveCollapsed && (
            <div className="flex items-center gap-1 bg-bg-main/50 p-1 rounded-lg border border-border-color">
              {(['fixed', 'auto', 'minimized'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSidebarMode?.(mode)}
                  title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${
                    sidebarMode === mode ? 'bg-primary text-bg-main' : 'text-text-sec hover:text-text-main'
                  }`}
                >
                  {mode === 'fixed' && <Monitor size={14} />}
                  {mode === 'auto' && <Zap size={14} />}
                  {mode === 'minimized' && <PanelLeftClose size={14} />}
                </button>
              ))}
            </div>
          )}
          {!effectiveCollapsed && (
            <div className="px-3 py-2 mb-2 flex items-center gap-2 border border-primary/10 rounded-lg bg-primary/5">
              <span className="px-1.5 py-0.5 bg-primary text-bg-main text-[9px] font-black rounded-md shadow-sm">
                PT
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-main font-black tracking-tight leading-none">v2.2.0 Platinum</span>
                <span className="text-[8px] text-text-sec uppercase tracking-widest font-medium mt-0.5">Nexus Executive</span>
              </div>
            </div>
          )}
          <button 
            onClick={onLogout}
            title={effectiveCollapsed ? 'Sair' : ''}
            className={`w-full flex items-center space-x-4 px-3 py-3 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all duration-200 font-medium group`}
          >
            <LogOut size={20} className="shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${effectiveCollapsed ? 'opacity-0 w-0 translate-x-4' : 'opacity-100 w-auto translate-x-0'}`}>
              Sair
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-bg-sidebar border-t border-border-color z-50 px-2 py-1 pb-safe overflow-x-auto hide-scrollbar select-none cursor-${isDragging ? 'grabbing' : 'default'}`}
      >
        <nav className="flex items-center min-w-max h-16">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as Page)}
                className={`relative flex flex-col items-center justify-center px-5 py-2 transition-colors duration-300 ${
                  isActive ? 'text-primary' : 'text-text-sec'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/5 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                <span className="text-[9px] font-bold uppercase tracking-widest mt-1 relative z-10">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center px-5 py-2 text-rose-500"
          >
            <LogOut size={20} />
            <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Sair</span>
          </button>
        </nav>
      </div>
    </>
  );
}
