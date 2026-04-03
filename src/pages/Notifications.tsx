import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  Trash2, 
  CheckCheck,
  UserPlus,
  CreditCard,
  Calendar,
  AlertCircle,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { Page } from '../types';

interface NotificationsProps {
  onNavigate: (page: Page) => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'lead' | 'payment' | 'appointment' | 'system' | 'message';
  isRead: boolean;
  targetPage?: Page;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Novo lead cadastrado',
    description: 'João Silva se cadastrou via formulário do site.',
    time: 'Há 5 minutos',
    type: 'lead',
    isRead: false,
    targetPage: 'contacts'
  },
  {
    id: '2',
    title: 'Pagamento confirmado',
    description: 'Fatura #1024 paga com sucesso.',
    time: 'Há 2 horas',
    type: 'payment',
    isRead: false,
    targetPage: 'subscriptions'
  },
  {
    id: '3',
    title: 'Reunião agendada',
    description: 'Consulta jurídica com Maria Oliveira amanhã às 14:00.',
    time: 'Há 5 horas',
    type: 'appointment',
    isRead: true,
    targetPage: 'calendar'
  },
  {
    id: '4',
    title: 'Atualização do Sistema',
    description: 'Versão 2.1.0 disponível com novas automações.',
    time: 'Ontem',
    type: 'system',
    isRead: true,
    targetPage: 'automation'
  },
  {
    id: '5',
    title: 'Nova mensagem',
    description: 'Você recebeu uma resposta do suporte técnico.',
    time: 'Há 2 dias',
    type: 'message',
    isRead: true
  }
];

export function Notifications({ onNavigate }: NotificationsProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'lead': return <UserPlus size={18} className="text-primary" />;
      case 'payment': return <CreditCard size={18} className="text-green-500" />;
      case 'appointment': return <Calendar size={18} className="text-blue-500" />;
      case 'message': return <MessageSquare size={18} className="text-purple-500" />;
      default: return <AlertCircle size={18} className="text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-border-color/50 mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-inner shadow-primary/5">
            <Bell size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-main tracking-tight">Central de Notificações</h2>
            <p className="text-xs text-text-sec uppercase tracking-widest font-bold mt-0.5">Gerencie seus alertas e prazos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-text-sec hover:text-primary hover:bg-bg-card rounded-xl transition-all"
          >
            <CheckCheck size={16} />
            Lidas
          </button>
          <button className="p-2 text-text-sec hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
            filter === 'all' 
              ? 'bg-primary text-bg-main shadow-lg shadow-primary/20' 
              : 'text-text-sec hover:bg-bg-card'
          }`}
        >
          Todas
          <span className="ml-2 py-0.5 px-1.5 bg-black/20 rounded-md text-[10px]">{notifications.length}</span>
        </button>
        <button 
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
            filter === 'unread' 
              ? 'bg-primary text-bg-main shadow-lg shadow-primary/20' 
              : 'text-text-sec hover:bg-bg-card'
          }`}
        >
          Não Lidas
          <span className="ml-2 py-0.5 px-1.5 bg-black/20 rounded-md text-[10px]">
            {notifications.filter(n => !n.isRead).length}
          </span>
        </button>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id}
              onClick={() => notification.targetPage && onNavigate(notification.targetPage)}
              className={`group relative flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                notification.isRead 
                  ? 'bg-bg-sidebar/40 border-border-color hover:border-primary/30' 
                  : 'bg-bg-sidebar border-primary/20 shadow-lg shadow-primary/5 hover:border-primary/50'
              }`}
            >
              {!notification.isRead && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-primary rounded-r-full shadow-[0_0_15px_rgba(212,175,55,0.5)]"></div>
              )}

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                notification.isRead ? 'bg-bg-main/50' : 'bg-primary/10'
              }`}>
                {getIcon(notification.type)}
              </div>

              <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className={`text-sm md:text-base font-bold truncate ${
                    notification.isRead ? 'text-text-sec' : 'text-text-main'
                  }`}>
                    {notification.title}
                  </h3>
                  <span className="text-[10px] text-text-sec font-medium shrink-0">{notification.time}</span>
                </div>
                <p className="text-xs md:text-sm text-text-sec line-clamp-1 group-hover:line-clamp-none transition-all">
                  {notification.description}
                </p>
              </div>

              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => deleteNotification(notification.id, e)}
                  className="p-2 text-text-sec hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
                {notification.targetPage && (
                  <div className="p-2 text-primary">
                    <ChevronRight size={16} />
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-bg-sidebar/20 border border-dashed border-border-color rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-bg-card rounded-full text-text-sec/20">
              <Bell size={48} />
            </div>
            <div className="space-y-1">
              <p className="text-text-main font-bold">Nenhuma notificação por aqui!</p>
              <p className="text-xs text-text-sec">Tudo limpo! Avisaremos você de novos eventos importantes.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
