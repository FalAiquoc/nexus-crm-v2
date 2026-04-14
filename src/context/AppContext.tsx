import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Appointment, User, WorkspaceSettings, Stage, Pipeline } from '../types';

export interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  settings: WorkspaceSettings;
  setSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
  pipelines: Pipeline[];
  stages: Stage[];
  setStages: React.Dispatch<React.SetStateAction<Stage[]>>;
  isLoading: boolean;
  isSimulatedMode: boolean;
  refreshData: () => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateSettings: (key: string, value: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PIPELINES: Pipeline[] = [
  { id: 'sales', name: 'Funil de Vendas', is_default: 1 }
];

const DEFAULT_STAGES: Stage[] = [
  { id: 'lead', name: 'Lead', pipeline_id: 'sales', sort_order: 0 },
  { id: 'contact', name: 'Contato', pipeline_id: 'sales', sort_order: 1 },
  { id: 'proposal', name: 'Proposta', pipeline_id: 'sales', sort_order: 2 },
  { id: 'negotiation', name: 'Negociação', pipeline_id: 'sales', sort_order: 3 },
  { id: 'closed', name: 'Fechado', pipeline_id: 'sales', sort_order: 4 }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings>(() => {
    const savedSettings = localStorage.getItem('doboy_settings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch {
        return {
          businessName: 'Nexus CRM',
          primaryColor: '#EAB308',
          sidebarMode: 'auto',
          theme: 'dark'
        };
      }
    }
    return {
      businessName: 'Nexus CRM',
      primaryColor: '#EAB308',
      sidebarMode: 'auto',
      theme: 'dark'
    };
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulatedMode, setIsSimulatedMode] = useState(() => {
    return localStorage.getItem('doboy_simulated_mode') === 'true';
  });

  const refreshData = async () => {
    const token = localStorage.getItem('nexus_token');

    if (isSimulatedMode) {
      setIsLoading(false);
      return;
    }

    if (!token) {
      setIsLoading(false);
      return;
    }

    let backendResponding = false;

    // Health check antes de tentar autenticação
    try {
      const healthRes = await fetch('/api/health');
      backendResponding = healthRes.ok;
    } catch {
      backendResponding = false;
    }

    if (!backendResponding) {
      console.warn('⚠️ Backend indisponível, ativando modo simulado...');
      setIsSimulatedMode(true);
      setIsLoading(false);
      return;
    }

    try {
      const userRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (userRes.ok) {
        backendResponding = true;
        const userData = await userRes.json();

        const nicheToType: Record<string, any> = {
          law: 'law_firm',
          barbershop: 'barbershop',
          general: 'general'
        };

        setUser({
          ...userData,
          workspace_type: nicheToType[userData.workspace_niche] || 'general'
        });

        // Carregar dados auxiliares
        const [leadsRes, settingsRes, plansRes, subRes, pipelinesRes] = await Promise.all([
          fetch('/api/leads', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/plans', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/subscriptions', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/pipelines', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (leadsRes.ok) {
          setClients(await leadsRes.json());
        }

        if (settingsRes.ok) {
          setSettings(await settingsRes.json());
        }

        if (plansRes.ok) setPlans(await plansRes.json());
        if (subRes.ok) setSubscriptions(await subRes.json());

        if (pipelinesRes.ok) {
          const pipelinesData = await pipelinesRes.json();
          if (pipelinesData.length > 0) {
            try {
              const stagesRes = await fetch(`/api/pipelines/${pipelinesData[0].id}/stages`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (stagesRes.ok) setStages(await stagesRes.json());
            } catch (e) {
              console.warn('⚠️ Falha ao carregar stages, usando defaults:', e);
            }
          }
        }
      } else {
        localStorage.removeItem('nexus_token');
        setUser(null);
      }
    } catch (err) {
      console.error('⚠️ Erro na conexão:', err);
      if (!backendResponding) {
        console.warn('⚠️ Backend indisponível, ativando modo simulado...');
        setIsSimulatedMode(true);
      } else {
        console.warn('⚠️ Token inválido ou expirado, fazendo logout...');
        localStorage.removeItem('nexus_token');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const updateClient = async (client: Client) => {
    try {
      const token = localStorage.getItem('nexus_token');
      await fetch(`/api/leads/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(client)
      });
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const token = localStorage.getItem('nexus_token');
      await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateSettings = async (key: string, value: string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('doboy_settings', JSON.stringify(newSettings));

    if (!isSimulatedMode) {
      try {
        const token = localStorage.getItem('nexus_token');
        // Endpoint correto: PUT /api/settings/:key
        await fetch(`/api/settings/${key}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ value })
        });
      } catch (err) {
        console.warn('⚠️ Falha ao sincronizar settings com backend:', err);
      }
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    try {
      const token = localStorage.getItem('nexus_token');
      await fetch('/api/calendar/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(appointment)
      });
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      clients, setClients,
      stages, setStages,
      appointments, setAppointments,
      settings, setSettings,
      pipelines: DEFAULT_PIPELINES,
      isLoading,
      isSimulatedMode,
      refreshData,
      updateClient,
      deleteClient,
      updateSettings,
      addAppointment
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
