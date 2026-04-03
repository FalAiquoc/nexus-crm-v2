/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { Kanban } from './pages/Kanban';
import { ClientForm } from './pages/ClientForm';
import { Contacts } from './pages/Contacts';
import { Automation } from './pages/Automation';
import { Calendar } from './pages/Calendar';
import { Subscriptions } from './pages/Subscriptions';
import { Analytics } from './pages/Analytics';
import { Integrations } from './pages/Integrations';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';
import { Profile } from './pages/Profile';
import { Notifications } from './pages/Notifications';
import { Login } from './pages/Login';
import { ClientModal } from './components/ClientModal';
import { useApp } from './context/AppContext';
import { useToast } from './context/ToastContext';
import { Page, Client } from './types';

const PRESET_THEMES: Record<string, Record<string, string>> = {
  'Ouro Premium (Padrão)': { primary: '#D4AF37', secondary: '#F3E5AB', 'grad-start': '#B8860B', 'grad-end': '#D4AF37', 'bg-main': '#0A0A0A', 'bg-sidebar': '#121212', 'bg-card': '#1A1A1A' },
  'Azul Meia-Noite': { primary: '#3B82F6', secondary: '#60A5FA', 'grad-start': '#2563EB', 'grad-end': '#3B82F6', 'bg-main': '#0B1120', 'bg-sidebar': '#0F172A', 'bg-card': '#1E293B' },
  'Verde Sálvia': { primary: '#10B981', secondary: '#34D399', 'grad-start': '#059669', 'grad-end': '#10B981', 'bg-main': '#022C22', 'bg-sidebar': '#064E3B', 'bg-card': '#065F46' },
  'Roxo Imperial': { primary: '#A855F7', secondary: '#C084FC', 'grad-start': '#9333EA', 'grad-end': '#A855F7', 'bg-main': '#09090B', 'bg-sidebar': '#18181B', 'bg-card': '#27272A' },
  'Titânio Minimalista': { primary: '#F8FAFC', secondary: '#E2E8F0', 'grad-start': '#94A3B8', 'grad-end': '#F8FAFC', 'bg-main': '#000000', 'bg-sidebar': '#0A0A0A', 'bg-card': '#141414' },
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { 
    user, setUser, 
    clients, updateClient, deleteClient,
    settings, refreshData,
    isLoading
  } = useApp();
  const { showToast } = useToast();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Buscar contagem de solicitações para o Badge
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchRequests = async () => {
        try {
          const res = await fetch('/api/admin/requests', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` }
          });
          
          const contentType = res.headers.get("content-type");
          if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {
            const data = await res.json();
            setPendingRequestsCount(data.length);
          } else {
            const text = await res.text();
            console.warn('⚠️ [API_WARNING] Resposta não-JSON recebida:', text.substring(0, 100));
          }
        } catch (err) {
          console.error('🔥 [API_ERROR] Falha na busca de solicitações:', err);
        }
      };
      fetchRequests();
      const interval = setInterval(fetchRequests, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  // Restaurar tema (BUG-010 Global fix com BD Sync)
  useEffect(() => {
    const themeName = settings.active_theme || localStorage.getItem('nexus_theme');
    if (themeName && PRESET_THEMES[themeName]) {
      const vars = PRESET_THEMES[themeName];
      Object.entries(vars).forEach(([key, val]) => {
        document.documentElement.style.setProperty(`--${key}`, val);
      });
    }
  }, [settings.active_theme]);

  const handleLogin = (newToken: string, newUser: any) => {
    localStorage.setItem('nexus_token', newToken);
    setUser(newUser);
    refreshData();
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    setUser(null);
    setCurrentPage('login');
  };

  const handleAddClient = async (newClient: any) => {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newClient)
      });
      if (res.ok) {
        refreshData();
        showToast('Lead cadastrado com sucesso!', 'success');
        setCurrentPage('contacts');
      } else {
        showToast('Erro ao cadastrar lead', 'error');
      }
    } catch (err) {
      console.error('Failed to add client:', err);
      showToast('Erro de conexão ao salvar lead', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-bg-main items-center justify-center text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onSelectClient={setSelectedClient} />;
      case 'kanban':
        return <Kanban onSelectClient={setSelectedClient} />;
      case 'calendar':
        return <Calendar />;
      case 'subscriptions':
        return <Subscriptions />;
      case 'contacts':
        return <Contacts onAddClient={() => setCurrentPage('form')} onSelectClient={setSelectedClient} />;
      case 'form':
        return <ClientForm onAddClient={handleAddClient} />;
      case 'automation':
        return <Automation />;
      case 'analytics':
        return <Analytics />;
      case 'integrations':
        return <Integrations />;
      case 'users':
        if (user.role !== 'admin') {
          setCurrentPage('dashboard');
          return <Dashboard onSelectClient={setSelectedClient} />;
        }
        return <Users />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile />;
      case 'notifications':
        return <Notifications onNavigate={setCurrentPage} />;
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-text-sec space-y-4">
            <h2 className="text-2xl font-semibold text-text-main">Em breve: {currentPage}</h2>
            <p>Este módulo está em desenvolvimento.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-bg-main text-text-main font-sans overflow-hidden">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        onLogout={handleLogout} 
        workspaceType={settings.workspace_type}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        user={user}
        pendingRequestsCount={pendingRequestsCount}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar 
          user={user}
          onLogout={handleLogout}
          onNavigate={setCurrentPage} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          workspaceType={settings.workspace_type}
          businessName={settings.business_name}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 pb-24 md:pb-8">
          {renderPage()}
        </main>
      </div>

      <ClientModal 
        isOpen={!!selectedClient}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onSave={(client) => {
          updateClient(client);
          showToast('Lead atualizado com sucesso!', 'success');
        }}
        onDelete={(id) => {
          deleteClient(id);
          setSelectedClient(null);
          showToast('Lead excluído com sucesso!', 'success');
        }}
      />
    </div>
  );
}
