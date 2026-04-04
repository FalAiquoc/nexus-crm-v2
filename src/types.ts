export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'gestor' | 'vendedor';
}

export interface Pipeline {
  id: string;
  name: string;
  is_default: number;
}

export interface Stage {
  id: string;
  pipeline_id: string;
  name: string;
  sort_order: number;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  actions_count: number;
  status: 'active' | 'draft' | 'paused';
  last_run?: string;
  steps?: any[]; // Array of steps for the visual builder
}

export type Page = 'dashboard' | 'kanban' | 'calendar' | 'subscriptions' | 'form' | 'contacts' | 'automation' | 'analytics' | 'integrations' | 'settings' | 'login' | 'users' | 'profile' | 'notifications';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  value: number;
  status: string;
  notes: string;
  cpf_cnpj?: string;
  rg?: string;
  birth_date?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
  tags?: string[];
  custom_fields?: Record<string, any>;
  history?: Array<{
    date: string;
    action: string;
    content: string;
    user_id?: string;
  }>;
}

export interface Appointment {
  id: string;
  client_id: string;
  client_name?: string;
  user_id?: string;
  title: string;
  start_time: string;
  end_time: string;
  status: 'Agendado' | 'Confirmado' | 'Concluído' | 'Cancelado' | 'Falta';
  notes?: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_interval: 'monthly' | 'yearly';
}

export interface Subscription {
  id: string;
  client_id: string;
  client_name?: string;
  plan_id: string;
  plan_name?: string;
  plan_price?: number;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  next_billing_date: string;
  last_billing_date?: string;
  auto_renew: number;
}

export interface WorkspaceSettings {
  workspace_type: 'general' | 'barbershop' | 'law_firm';
  business_name: string;
  ui_density?: 'comfortable' | 'compact';
  sidebar_mode?: 'fixed' | 'auto' | 'minimized';
  theme?: string;
  active_theme?: string;
}
