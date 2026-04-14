import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, MessageSquare, ChevronRight, FileText, Calendar, Link2, Monitor, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NexusBotWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NexusBotWidget({ isOpen, onClose }: NexusBotWidgetProps) {
  const { user, settings } = useApp();
  const [messages, setMessages] = useState<{ id: string; type: 'bot' | 'user'; text: string; link?: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const workspaceType = settings.workspace_type;
  const userName = user?.name?.split(' ')[0] || 'Usuário';

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Inicia a conversa quando abre a primeira vez
      setIsTyping(true);
      setTimeout(() => {
        setMessages([
          { 
            id: '1', 
            type: 'bot', 
            text: `Olá, ${userName}! 👋 Sou o NexusBot, seu assistente virtual. Como posso ajudar com o seu ${
              workspaceType === 'law_firm' ? 'escritório de advocacia' :
              workspaceType === 'barbershop' ? 'negócio de estética/barbearia' :
              'empresa SaaS'
            } hoje?` 
          }
        ]);
        setIsTyping(false);
      }, 800);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleActionClick = (actionName: string, textResponse: string) => {
    // Adiciona a mensagem do usuário
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', text: actionName }]);
    
    setIsTyping(true);
    // Simula resposta do bot
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), type: 'bot', text: textResponse }]);
      setIsTyping(false);
    }, 1000);
  };

  // Sugestões contextuais baseadas no nicho
  const getContextualActions = () => {
    const defaultActions = [
      { id: '1', icon: Monitor, label: 'Como usar o Dashboard', response: 'No Dashboard você tem uma visão geral das suas métricas. Clique nos ícones da TopBar para ações rápidas, ou navegue pelo menu lateral para acessar relatórios detalhados.' },
      { id: '2', icon: Link2, label: 'Integrações (WhatsApp)', response: 'Vá em "Integrações" ou "WhatsApp" no menu lateral. Você pode escanear o QR Code para conectar sua instância da Evolution API e iniciar mensagens automatizadas.' }
    ];

    if (workspaceType === 'law_firm') {
      return [
        { id: 'law1', icon: FileText, label: 'Criação de Processos', response: 'Para cadastrar um novo Processo, acesse "Processos" no menu lateral e clique em "Adicionar Novo". Arraste os cards para alterar a fase no Kanban legal.' },
        ...defaultActions
      ];
    } else if (workspaceType === 'barbershop') {
      return [
        { id: 'bb1', icon: Calendar, label: 'Agendamentos e Planos', response: 'Você pode gerenciar os horários em "Agenda" e criar as assinaturas do Clube da Barba através da tela de "Assinaturas" -> "Novo Plano".' },
        ...defaultActions
      ];
    } else {
      return [
        { id: 'saas1', icon: MessageSquare, label: 'Automações e IA', response: 'Configure fluxos de lead no menu "Automação" e crie agentes personalizados de atendimento na aba "Agentes IA". Isso requer os planos Pro ou Elite.' },
        ...defaultActions
      ];
    }
  };

  const actions = getContextualActions();

  return (
    <>
      {isOpen && (
        <div
          className="fixed bottom-[80px] left-6 z-[90] w-[340px] h-[480px] bg-bg-card border border-border-color rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
        >
          {/* Header */}
          <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Bot size={22} className="text-bg-main" fill="currentColor" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-bg-card" />
              </div>
              <div>
                <h3 className="font-bold text-text-main text-sm">Nexus Bot</h3>
                <p className="text-[10px] text-text-sec flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online e pronto
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-text-sec hover:text-text-main hover:bg-bg-sidebar rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-main/50 relative">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.type === 'user' 
                      ? 'bg-primary text-bg-main rounded-tr-sm' 
                      : 'bg-bg-sidebar border border-border-color text-text-main rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start">
                <div className="bg-bg-sidebar border border-border-color p-3 rounded-2xl rounded-tl-sm flex gap-1">
                  <div className="w-1.5 h-1.5 bg-text-sec rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-text-sec rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-text-sec rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Area */}
          <div className="p-3 bg-bg-sidebar border-t border-border-color shrink-0">
            <p className="text-[10px] text-text-sec font-medium mb-2 px-1">TUTORIAIS RÁPIDOS:</p>
            <div className="space-y-1.5">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action.label, action.response)}
                    className="w-full flex items-center justify-between p-2.5 bg-bg-card hover:bg-primary/10 border border-border-color hover:border-primary/20 rounded-xl transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-primary" />
                      <span className="text-xs font-medium text-text-main group-hover:text-primary transition-colors">{action.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-text-sec group-hover:text-primary transition-colors opacity-50 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
