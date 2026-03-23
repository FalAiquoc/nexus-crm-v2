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
  X
} from 'lucide-react';
import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  workspaceType?: 'general' | 'barbershop' | 'law_firm';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export function Sidebar({ 
  currentPage, 
  onNavigate, 
  onLogout, 
  workspaceType = 'general',
  isCollapsed,
  onToggleCollapse,
  isMobileMenuOpen,
  onCloseMobileMenu
}: SidebarProps) {
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
    { id: 'users', label: 'Usuários', icon: Users, show: true },
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
                <h1 className="text-xl font-bold text-primary tracking-wide flex items-center gap-3 uppercase">
                  <Hexagon size={24} className="text-secondary" />
                  {workspaceType === 'barbershop' ? 'Central Barber' : 'Nexus CRM'}
                </h1>
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
                      <Icon size={20} className={isActive ? 'text-primary' : ''} strokeWidth={isActive ? 2.5 : 2} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border-color">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all duration-200 font-medium"
                >
                  <LogOut size={20} />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className={`${isCollapsed ? 'w-20' : 'w-64'} hidden md:flex h-screen bg-bg-sidebar border-r border-border-color flex-col shrink-0 transition-all duration-300 ease-in-out relative`}>
        <div className={`p-6 ${isCollapsed ? 'px-4' : 'px-8'} pb-6 border-b border-border-color flex items-center justify-between`}>
          <h1 className={`text-2xl font-bold text-primary tracking-wide flex items-center gap-3 uppercase overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <Hexagon size={24} className="text-secondary shrink-0" />
            {workspaceType === 'barbershop' ? 'Central Barber' : 'Nexus CRM'}
          </h1>
          {isCollapsed && <Hexagon size={24} className="text-secondary mx-auto" />}
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto overflow-x-hidden">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as Page)}
                title={isCollapsed ? item.label : ''}
                className={`w-full flex items-center space-x-4 px-3 py-3 rounded-lg transition-all duration-200 font-medium group ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-text-sec hover:text-text-main hover:bg-bg-card'
                }`}
              >
                <Icon size={20} className={`${isActive ? 'text-primary' : ''} shrink-0`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 translate-x-4' : 'opacity-100 w-auto translate-x-0'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-3 border-t border-border-color">
          <button 
            onClick={onLogout}
            title={isCollapsed ? 'Sair' : ''}
            className={`w-full flex items-center space-x-4 px-3 py-3 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all duration-200 font-medium group`}
          >
            <LogOut size={20} className="shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 translate-x-4' : 'opacity-100 w-auto translate-x-0'}`}>
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
