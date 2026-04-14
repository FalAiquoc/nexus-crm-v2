import { useState, useEffect, lazy, Suspense } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { ClientModal } from "./components/ClientModal";
import { useApp } from "./hooks/useApp";
import { useToast } from "./context/ToastContext";
import { Page, Client } from "./types";
import { AlertTriangle } from "lucide-react";

// Pages lazy loaded (Named exports)
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Kanban = lazy(() => import("./pages/Kanban").then(m => ({ default: m.Kanban })));
const ClientForm = lazy(() => import("./pages/ClientForm").then(m => ({ default: m.ClientForm })));
const Contacts = lazy(() => import("./pages/Contacts").then(m => ({ default: m.Contacts })));
const Automation = lazy(() => import("./pages/Automation").then(m => ({ default: m.Automation })));
const AgentBuilder = lazy(() => import("./pages/AgentBuilder").then(m => ({ default: m.AgentBuilder })));
const WhatsAppInstances = lazy(() => import("./pages/WhatsAppInstances").then(m => ({ default: m.WhatsAppInstances })));
const Calendar = lazy(() => import("./pages/Calendar").then(m => ({ default: m.Calendar })));
const Subscriptions = lazy(() => import("./pages/Subscriptions").then(m => ({ default: m.Subscriptions })));
const Analytics = lazy(() => import("./pages/Analytics").then(m => ({ default: m.Analytics })));
const Integrations = lazy(() => import("./pages/Integrations").then(m => ({ default: m.Integrations })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const Users = lazy(() => import("./pages/Users").then(m => ({ default: m.Users })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const Notifications = lazy(() => import("./pages/Notifications").then(m => ({ default: m.Notifications })));
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const {
    user,
    setUser,
    clients,
    updateClient,
    deleteClient,
    settings,
    refreshData,
    updateSettings,
    isLoading,
    isSimulatedMode,
  } = useApp();
  const { showToast } = useToast();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("nexus_token");
    setUser(null);
    showToast("Sessão encerrada", "info");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <Dashboard />;
      case "kanban": return <Kanban />;
      case "form": return <ClientForm />;
      case "contacts": return <Contacts />;
      case "automation": return <Automation />;
      case "agents": return <AgentBuilder />;
      case "whatsapp": return <WhatsAppInstances />;
      case "calendar": return <Calendar />;
      case "subscriptions": return <Subscriptions />;
      case "analytics": return <Analytics />;
      case "integrations": return <Integrations />;
      case "settings": return <Settings />;
      case "users": return <Users />;
      case "profile": return <Profile />;
      case "notifications": return <Notifications />;
      default: return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-main">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<div className="h-screen bg-bg-main flex items-center justify-center text-text-sec animate-pulse">Iniciando ambiente...</div>}>
        <Login
          onLogin={(token, userData) => {
            localStorage.setItem("nexus_token", token);
            setUser(userData);
            showToast("Bem-vindo de volta!", "success");
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen bg-bg-main text-text-main overflow-hidden font-sans">
      <div className="flex-1 flex flex-col min-w-0 bg-bg-main relative shadow-2xl">
        <TopBar
          onLogout={handleLogout}
          businessName={settings.businessName}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          user={user}
        />
        <div className="flex-1 flex min-h-0">
          <Sidebar
            user={user}
            onLogout={handleLogout}
            onNavigate={setCurrentPage}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            workspaceType={user.workspace_type}
            businessName={settings.businessName}
            sidebarMode={settings.sidebarMode}
            isMobileMenuOpen={isMobileMenuOpen}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
            currentPage={currentPage}
          />
          <main
            className={`flex-1 min-h-0 pb-24 md:pb-0 relative ${currentPage === "kanban"
              ? "overflow-hidden p-4 md:p-6 flex flex-col"
              : "overflow-y-auto p-4 md:p-8 custom-scrollbar"
              }`}
          >
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-text-sec font-bold">Acessando {currentPage}</span>
              </div>
            }>
              {renderPage()}
            </Suspense>
          </main>
        </div>
      </div>
      
      {isSimulatedMode && (
        <div className="fixed bottom-6 right-6 bg-amber-500 text-black px-4 py-2 rounded-full shadow-2xl z-[100] flex items-center gap-2 animate-bounce border-2 border-amber-400">
          <AlertTriangle size={16} />
          <span className="text-xs font-black uppercase tracking-wider">Modo Simulado Ativo</span>
        </div>
      )}

      {selectedClient && (
        <ClientModal
          isOpen={!!selectedClient}
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onSave={async (client) => {
            await updateClient(client);
            showToast("Lead atualizado com sucesso!", "success");
          }}
          onDelete={async (id) => {
            await deleteClient(id);
            setSelectedClient(null);
            showToast("Lead removido com sucesso!", "success");
          }}
        />
      )}
    </div>
  );
}
