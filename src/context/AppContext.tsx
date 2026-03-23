import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Appointment, User, WorkspaceSettings, Stage, Pipeline } from '../types';

interface AppContextType {
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
  isLoading: boolean;
  refreshData: () => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateSettings: (key: string, value: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings>({
    workspace_type: 'general',
    business_name: 'Nexus CRM'
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    const token = localStorage.getItem('nexus_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch User
      const userRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userRes.ok) {
        setUser(await userRes.json());
      }

      // Fetch Settings
      const settingsRes = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (settingsRes.ok) {
        setSettings(await settingsRes.json());
      }

      // Fetch Clients
      const clientsRes = await fetch('/api/leads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (clientsRes.ok) {
        setClients(await clientsRes.json());
      }

      // Fetch Pipelines & Stages
      const pipeRes = await fetch('/api/pipelines', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pipeRes.ok) {
        const pipes = await pipeRes.json();
        setPipelines(pipes);
        if (pipes.length > 0) {
          const defaultPipe = pipes.find((p: any) => p.is_default) || pipes[0];
          const stageRes = await fetch(`/api/pipelines/${defaultPipe.id}/stages`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (stageRes.ok) {
            setStages(await stageRes.json());
          }
        }
      }

      // Fetch Appointments (Mock for now if API doesn't exist)
      // setAppointments([...]);

    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const updateClient = async (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    const token = localStorage.getItem('nexus_token');
    try {
      await fetch(`/api/leads/${updatedClient.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedClient)
      });
    } catch (err) {
      console.error('Failed to update client:', err);
    }
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    const token = localStorage.getItem('nexus_token');
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Failed to delete client:', err);
    }
  };

  const updateSettings = async (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    const token = localStorage.getItem('nexus_token');
    try {
      await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value })
      });
    } catch (err) {
      console.error('Failed to update setting:', err);
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    const newAppointment = { ...appointment, id: Math.random().toString(36).substr(2, 9) } as Appointment;
    setAppointments(prev => [...prev, newAppointment]);
    // API call would go here
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      clients, setClients,
      appointments, setAppointments,
      settings, setSettings,
      pipelines, stages,
      isLoading,
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

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
