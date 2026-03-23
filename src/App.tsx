/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
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
import { Login } from './pages/Login';
import { ClientModal } from './components/ClientModal';
import { useApp } from './context/AppContext';
import { Page, Client } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { 
    user, setUser, 
    clients, updateClient, deleteClient,
    settings, refreshData,
    isLoading
  } = useApp();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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
        setCurrentPage('contacts');
      }
    } catch (err) {
      console.error('Failed to add client:', err);
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
        return <Users />;
      case 'settings':
        return <Settings />;
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
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar 
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
        onSave={updateClient}
        onDelete={(id) => {
          deleteClient(id);
          setSelectedClient(null);
        }}
      />
    </div>
  );
}
