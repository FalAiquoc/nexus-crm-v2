/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { ClientModal } from "./components/ClientModal";
import { useApp } from "./context/AppContext";
import { useToast } from "./context/ToastContext";
import { Page, Client } from "./types";
import { AlertTriangle, Trash2, PlayCircle } from "lucide-react";

import { PRESET_THEMES, ThemeName } from "./constants";

// Lazy loaded pages - code splitting automático
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Kanban = lazy(() => import("./pages/Kanban"));
const ClientForm = lazy(() => import("./pages/ClientForm"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Automation = lazy(() => import("./pages/Automation"));
const AgentBuilder = lazy(() => import("./pages/AgentBuilder"));
const WhatsAppInstances = lazy(() => import("./pages/WhatsAppInstances"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Settings = lazy(() => import("./pages/Settings"));
const Users = lazy(() => import("./pages/Users"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Login = lazy(() => import("./pages/Login"));

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
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const performSandboxToggle = async (mode: boolean) => {
    try {
      const res = await fetch(
        mode ? "/api/admin/seed-mock-data" : "/api/admin/clear-mock-data",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("doboy_token")}`,
          },
        },
      );
      if (res.ok) {
        showToast(
          mode ? "Sandbox ativado com Fakes." : "Sandbox limpo. Retornando...",
          "success",
        );
        refreshData();
      }
    } catch {
      showToast("Erro ao transitar modos de Sandbox", "error");
    }
  };

  // Buscar contagem de solicitações para o Badge
  useEffect(() => {
    if (user?.role === "admin") {
      const fetchRequests = async () => {
        try {
          const res = await fetch("/api/admin/requests", {
            // Unificação cirúrgica das chaves para DoBoy
            headers: {
              Authorization: `Bearer ${localStorage.getItem("doboy_token")}`,
            },
          });

          const contentType = res.headers.get("content-type");
          if (
            res.ok &&
            contentType &&
            contentType.indexOf("application/json") !== -1
          ) {
            const data = await res.json();
            setPendingRequestsCount(data.length);
          } else {
            const text = await res.text();
            console.warn(
              "⚠️ [API_WARNING] Resposta não-JSON recebida:",
              text.substring(0, 100),
            );
          }
        } catch (err) {
          console.error("🔥 [API_ERROR] Falha na busca de solicitações:", err);
        }
      };
      fetchRequests();
      const interval = setInterval(fetchRequests, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const themeName = (settings.active_theme ||
      localStorage.getItem("doboy_theme")) as ThemeName;
    if (themeName && PRESET_THEMES[themeName]) {
      const vars = PRESET_THEMES[themeName];
      Object.entries(vars).forEach(([key, val]) => {
        document.documentElement.style.setProperty(`--${key}`, val);
      });
    }
  }, [settings.active_theme]);

  // Sincronizar Sidebar Mode & UI Density
  useEffect(() => {
    if (settings.sidebar_mode === "fixed") setIsSidebarCollapsed(false);
    if (settings.sidebar_mode === "minimized") setIsSidebarCollapsed(true);
  }, [settings.sidebar_mode]);

  const handleLogin = (newToken: string, newUser: any) => {
    localStorage.setItem("doboy_token", newToken);
    setUser(newUser);
    refreshData();
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("doboy_token");
    setUser(null);
    setCurrentPage("login");
  };

  const handleAddClient = async (newClient: any) => {
    const token = localStorage.getItem("doboy_token");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClient),
      });
      if (res.ok) {
        refreshData();
        showToast("Lead cadastrado com sucesso!", "success");
        setCurrentPage("contacts");
      } else {
        showToast("Erro ao cadastrar lead", "error");
      }
    } catch (err) {
      console.error("Failed to add client:", err);
      showToast("Erro de conexão ao salvar lead", "error");
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
    const PageWrapper = ({ children }: { children: React.ReactNode }) => (
      <Suspense
        fallback={
          <div className="flex h-[400px] items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }
      >
        {children}
      </Suspense>
    );

    switch (currentPage) {
      case "dashboard":
        return <PageWrapper><Dashboard onSelectClient={setSelectedClient} /></PageWrapper>;
      case "kanban":
        return <PageWrapper><Kanban onSelectClient={setSelectedClient} /></PageWrapper>;
      case "calendar":
        return <PageWrapper><Calendar /></PageWrapper>;
      case "subscriptions":
        return <PageWrapper><Subscriptions /></PageWrapper>;
      case "contacts":
        return (
          <PageWrapper>
            <Contacts
              onAddClient={() => setCurrentPage("form")}
              onSelectClient={setSelectedClient}
            />
          </PageWrapper>
        );
      case "form":
        return <PageWrapper><ClientForm onAddClient={handleAddClient} /></PageWrapper>;
      case "automation":
        return <PageWrapper><Automation /></PageWrapper>;
      case "agents":
        return <PageWrapper><AgentBuilder /></PageWrapper>;
      case "whatsapp":
        return <PageWrapper><WhatsAppInstances /></PageWrapper>;
      case "analytics":
        return <PageWrapper><Analytics /></PageWrapper>;
      case "integrations":
        return <PageWrapper><Integrations /></PageWrapper>;
      case "users":
        if (user.role !== "admin") {
          setCurrentPage("dashboard");
          return <PageWrapper><Dashboard onSelectClient={setSelectedClient} /></PageWrapper>;
        }
        return <PageWrapper><Users /></PageWrapper>;
      case "settings":
        return <PageWrapper><Settings /></PageWrapper>;
      case "profile":
        return <PageWrapper><Profile /></PageWrapper>;
      case "notifications":
        return <PageWrapper><Notifications onNavigate={setCurrentPage} /></PageWrapper>;
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-text-sec space-y-4">
            <h2 className="text-2xl font-semibold text-text-main">
              Em breve: {currentPage}
            </h2>
            <p>Este módulo está em desenvolvimento.</p>
          </div>
        );
    }
  };

  return (
    <div
      className={`flex flex-col h-screen bg-bg-main text-text-main font-sans overflow-hidden ${settings.ui_density === "compact" ? "density-compact" : ""} ${settings.active_theme || ""}`}
    >
      {isSimulatedMode && (
        <div className="w-full bg-amber-500 text-black py-1.5 px-4 text-center z-[100] flex items-center justify-center gap-4 animate-in slide-in-from-top flex-shrink-0 shadow-md">
          <span className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
            <AlertTriangle size={14} /> MODO DE SIMULAÇÃO (SANDBOX) ATIVO - DADOS FAKES APLICADOS
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => performSandboxToggle(false)}
              className="px-3 py-1 bg-black/10 hover:bg-black/20 text-black font-black text-[10px] uppercase rounded-lg transition-all border border-black/20 flex items-center gap-1.5"
              title="Zerar dados e desativar simulação"
            >
              <Trash2 size={12} /> Limpar e Sair
            </button>
            <button
              onClick={async () => {
                if (window.confirm('Deseja zerar todos os dados de simulação sem sair do modo?')) {
                  try {
                    // Feedback visual imediato
                    const res = await fetch("/api/admin/clear-mock-data", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${localStorage.getItem("doboy_token")}` }
                    });
                    if (res.ok) {
                      showToast("Sistema Zerado com Sucesso!", "success");
                      // Forçar refresh pesado
                      window.location.reload();
                    }
                  } catch (e) {
                    showToast("Erro na limpeza profunda", "error");
                  }
                }
              }}
              className="px-3 py-1 bg-black text-amber-500 font-black text-[10px] uppercase rounded-lg transition-all hover:bg-black/80 flex items-center gap-1.5 shadow-lg"
            >
              <PlayCircle size={12} className="rotate-180" /> Somente Limpar
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden relative">
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
          sidebarMode={settings.sidebar_mode}
          setSidebarMode={(mode) => updateSettings("sidebar_mode", mode)}
          pendingRequestsCount={pendingRequestsCount}
          businessName={
            settings.business_name ||
            (settings.workspace_type === "barbershop"
              ? "Central Barber DoBoy"
              : "CRM DoBoy")
          }
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <TopBar
            user={user}
            onLogout={handleLogout}
            onNavigate={setCurrentPage}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            workspaceType={settings.workspace_type}
            businessName={settings.business_name}
            sidebarMode={settings.sidebar_mode}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            currentPage={currentPage}
          />
          <main
            className={`flex-1 min-h-0 pb-24 md:pb-0 ${currentPage === "kanban"
              ? "overflow-hidden p-4 md:p-6 flex flex-col"
              : "overflow-y-auto p-[var(--page-padding)]"
              }`}
          >
            {renderPage()}
          </main>
        </div>
      </div>
      <ClientModal
        isOpen={!!selectedClient}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onSave={(client) => {
          updateClient(client);
          showToast("Lead atualizado com sucesso!", "success");
        }}
        onDelete={(id) => {
          deleteClient(id);
          setSelectedClient(null);
          showToast("Lead excluído com sucesso!", "success");
        }}
      />
    </div>
  );
}
