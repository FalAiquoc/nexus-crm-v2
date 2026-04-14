import React, { useState, useEffect } from 'react';
import { 
  Bot, Plus, Play, Settings, Trash2, Edit2, MessageCircle, 
  Brain, Zap, Globe, Database, Webhook, Loader2, Send, 
  CheckCircle, XCircle, AlertCircle, Sparkles, ChevronRight,
  Eye, EyeOff, Copy, TestTube
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  prompt: string;
  status: 'active' | 'paused' | 'error';
  instance_name?: string;
  webhook_url?: string;
  knowledge_base?: string;
  created_at: string;
  last_execution?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const AI_MODELS = [
  { value: 'gpt-4o', label: 'OpenAI GPT-4o', icon: '🧠' },
  { value: 'gpt-4o-mini', label: 'OpenAI GPT-4o Mini', icon: '⚡' },
  { value: 'gemini-pro', label: 'Google Gemini Pro', icon: '💎' },
  { value: 'gemini-flash', label: 'Google Gemini Flash', icon: '⚡' },
  { value: 'claude-3-sonnet', label: 'Anthropic Claude 3 Sonnet', icon: '🎯' },
];

const defaultAgents: Agent[] = [
  {
    id: '1',
    name: 'Atendente Virtual',
    description: 'Atende clientes e responde dúvidas sobre serviços',
    model: 'gpt-4o',
    prompt: 'Você é um atendente virtual da empresa. Seja educado, objetivo e prestativo. Responda dúvidas sobre nossos serviços e horários de funcionamento.',
    status: 'active',
    instance_name: 'ncrm-01',
    webhook_url: 'https://crm.dvadvoga.com.br/api/webhook/whatsapp',
    created_at: '2026-04-09',
    last_execution: '2026-04-10 14:30'
  },
  {
    id: '2',
    name: 'Qualificador de Leads',
    description: 'Qualifica leads fazendo perguntas estratégicas',
    model: 'gpt-4o-mini',
    prompt: 'Você é um qualificador de leads. Faça perguntas para entender o perfil do cliente: orçamento, urgência, necessidades. Classifique como QUENTE, MORNO ou FRIO.',
    status: 'paused',
    created_at: '2026-04-08'
  }
];

export function AgentBuilder() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isTestChatOpen, setIsTestChatOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Test chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [selectedTestAgent, setSelectedTestAgent] = useState<string>('');

  // Editor state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formModel, setFormModel] = useState('gpt-4o');
  const [formPrompt, setFormPrompt] = useState('');
  const [formInstance, setFormInstance] = useState('');
  const [formWebhookUrl, setFormWebhookUrl] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const token = localStorage.getItem('doboy_token');
    try {
      // Por enquanto usa dados mock - quando tiver endpoint real, substituir
      setAgents(defaultAgents);
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditor = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormName(agent.name);
      setFormDescription(agent.description);
      setFormModel(agent.model);
      setFormPrompt(agent.prompt);
      setFormInstance(agent.instance_name || '');
      setFormWebhookUrl(agent.webhook_url || '');
    } else {
      setEditingAgent(null);
      setFormName('');
      setFormDescription('');
      setFormModel('gpt-4o');
      setFormPrompt('');
      setFormInstance('ncrm-01');
      setFormWebhookUrl('https://crm.dvadvoga.com.br/api/webhook/whatsapp');
    }
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formPrompt) return;

    setIsSaving(true);
    const token = localStorage.getItem('doboy_token');

    const newAgent: Agent = {
      id: editingAgent?.id || Math.random().toString(36).substr(2, 9),
      name: formName,
      description: formDescription,
      model: formModel,
      prompt: formPrompt,
      status: 'active',
      instance_name: formInstance || undefined,
      webhook_url: formWebhookUrl || undefined,
      created_at: new Date().toISOString().split('T')[0],
      last_execution: undefined
    };

    try {
      // TODO: Endpoint real para salvar
      // await fetch('/api/agents', { method: 'POST/PUT', ... })
      
      if (editingAgent) {
        setAgents(agents.map(a => a.id === editingAgent.id ? newAgent : a));
      } else {
        setAgents([...agents, newAgent]);
      }
      
      setIsEditorOpen(false);
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este agente?')) return;
    setAgents(agents.filter(a => a.id !== id));
  };

  const toggleStatus = (id: string) => {
    setAgents(agents.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'active' ? 'paused' : 'active' };
      }
      return a;
    }));
  };

  const openTestChat = (agentId: string) => {
    setSelectedTestAgent(agentId);
    setChatMessages([]);
    setIsTestChatOpen(true);
  };

  const sendTestMessage = async () => {
    if (!chatInput.trim() || !selectedTestAgent) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatSending(true);

    // Simula resposta do agente (substituir por chamada real à API)
    setTimeout(() => {
      const agent = agents.find(a => a.id === selectedTestAgent);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: `[Simulação] Resposta do agente "${agent?.name}" usando ${agent?.model}.\n\nNa versão final, esta mensagem será gerada pela IA com base no prompt configurado: "${agent?.prompt?.substring(0, 100)}..."`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, assistantMsg]);
      setIsChatSending(false);
    }, 1500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="text-emerald-500" size={18} />;
      case 'paused': return <AlertCircle className="text-amber-500" size={18} />;
      case 'error': return <XCircle className="text-rose-500" size={18} />;
      default: return <AlertCircle className="text-gray-500" size={18} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'paused': return 'Pausado';
      case 'error': return 'Erro';
      default: return status;
    }
  };

  const getModelIcon = (model: string) => {
    return AI_MODELS.find(m => m.value === model)?.icon || '🤖';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="text-primary animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bot className="text-primary" size={28} />
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Agentes de IA</h1>
            <p className="text-text-sec mt-1">Crie e gerencie agentes inteligentes integrados ao WhatsApp.</p>
          </div>
        </div>
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-6 py-3 bg-primary rounded-xl text-bg-main font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/10"
        >
          <Plus size={20} />
          Novo Agente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Agentes Ativos', value: agents.filter(a => a.status === 'active').length, icon: Bot, color: 'text-primary' },
          { label: 'Modelo Principal', value: 'GPT-4o', icon: Brain, color: 'text-purple-500' },
          { label: 'WhatsApp Conectado', value: 'ncrm-01', icon: MessageCircle, color: 'text-emerald-500' },
          { label: 'Webhook', value: 'Ativo', icon: Webhook, color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-bg-sidebar p-6 rounded-2xl border border-border-color flex items-center gap-4">
            <div className={`p-3 bg-bg-main rounded-xl border border-border-color ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-text-sec text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-text-main">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.length === 0 ? (
          <div className="col-span-full bg-bg-sidebar rounded-2xl border border-border-color p-12 text-center">
            <Bot className="mx-auto text-text-sec mb-4" size={48} />
            <h3 className="text-xl font-bold text-text-main mb-2">Nenhum agente criado</h3>
            <p className="text-text-sec mb-6">Crie seu primeiro agente de IA para automatizar atendimentos.</p>
            <button
              onClick={() => openEditor()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary rounded-xl text-bg-main font-bold hover:bg-secondary transition-all"
            >
              <Plus size={20} />
              Criar Primeiro Agente
            </button>
          </div>
        ) : (
          agents.map(agent => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-sidebar rounded-2xl border border-border-color overflow-hidden hover:border-primary/30 transition-colors"
            >
              {/* Header do Card */}
              <div className="p-6 border-b border-border-color bg-bg-main/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <span className="text-xl">{getModelIcon(agent.model)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-text-main">{agent.name}</h3>
                      <p className="text-xs text-text-sec">{agent.model}</p>
                    </div>
                  </div>
                  {getStatusIcon(agent.status)}
                </div>
                <p className="text-sm text-text-sec line-clamp-2">{agent.description}</p>
              </div>

              {/* Configurações */}
              <div className="p-4 space-y-3">
                {agent.instance_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-sec flex items-center gap-2">
                      <MessageCircle size={14} />
                      WhatsApp
                    </span>
                    <span className="text-text-main font-medium">{agent.instance_name}</span>
                  </div>
                )}
                {agent.webhook_url && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-sec flex items-center gap-2">
                      <Webhook size={14} />
                      Webhook
                    </span>
                    <span className="text-text-main font-medium text-xs truncate max-w-[200px]">
                      {agent.webhook_url}
                    </span>
                  </div>
                )}
                {agent.last_execution && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-sec">Última execução</span>
                    <span className="text-text-main font-medium">{agent.last_execution}</span>
                  </div>
                )}

                {/* Ações */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border-color">
                  <button
                    onClick={() => toggleStatus(agent.id)}
                    className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold transition-all ${
                      agent.status === 'active' 
                        ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' 
                        : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                    }`}
                    title={agent.status === 'active' ? 'Pausar' : 'Ativar'}
                  >
                    {agent.status === 'active' ? <Zap size={14} /> : <Play size={14} />}
                    {agent.status === 'active' ? 'Pausar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => openEditor(agent)}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => openTestChat(agent.id)}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-all"
                    title="Testar"
                  >
                    <TestTube size={14} />
                    Testar
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Editor de Agente */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-bg-sidebar border border-border-color rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border-color bg-bg-main/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-main">
                      {editingAgent ? 'Editar Agente' : 'Criar Novo Agente'}
                    </h2>
                    <p className="text-sm text-text-sec">Configure o comportamento do seu agente de IA</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 hover:bg-bg-card rounded-xl transition-colors text-text-sec"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Nome */}
                <div>
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider mb-2 block">
                    Nome do Agente *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Atendente Virtual"
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider mb-2 block">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ex: Atende clientes e responde dúvidas"
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Modelo IA */}
                <div>
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider mb-2 block">
                    Modelo de IA *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AI_MODELS.map(model => (
                      <button
                        key={model.value}
                        onClick={() => setFormModel(model.value)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          formModel === model.value 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border-color bg-bg-main hover:border-primary/30'
                        }`}
                      >
                        <span className="text-lg">{model.icon}</span>
                        <p className="text-xs text-text-main font-medium mt-1">{model.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider mb-2 block">
                    Prompt do Sistema *
                  </label>
                  <textarea
                    value={formPrompt}
                    onChange={(e) => setFormPrompt(e.target.value)}
                    placeholder="Descreva o comportamento do agente. Ex: Você é um atendente virtual da empresa. Seja educado, objetivo e prestativo..."
                    rows={6}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary resize-none leading-relaxed"
                  />
                  <p className="text-xs text-text-sec mt-2">
                    💡 Este prompt define como o agente se comporta ao responder mensagens.
                  </p>
                </div>

                {/* Instância WhatsApp */}
                <div>
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider mb-2 block">
                    Instância WhatsApp
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={formInstance}
                      onChange={(e) => setFormInstance(e.target.value.toLowerCase())}
                      placeholder="ncrm-01"
                      className="flex-1 bg-bg-main border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary"
                    />
                    <span className="text-xs text-text-sec">
                      {formInstance ? '✅ Conectado' : 'Opcional'}
                    </span>
                  </div>
                </div>

                {/* Webhook URL */}
                <div>
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider mb-2 block">
                    URL do Webhook
                  </label>
                  <input
                    type="text"
                    value={formWebhookUrl}
                    onChange={(e) => setFormWebhookUrl(e.target.value)}
                    placeholder="https://crm.dvadvoga.com.br/api/webhook/whatsapp"
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border-color flex gap-3">
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="flex-1 px-6 py-3 border border-border-color rounded-xl text-text-main font-bold hover:bg-bg-main transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formName || !formPrompt}
                  className="flex-[2] px-6 py-3 bg-primary rounded-xl text-bg-main font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      {editingAgent ? 'Salvar Alterações' : 'Criar Agente'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Chat de Teste */}
      <AnimatePresence>
        {isTestChatOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-sidebar border border-border-color rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
              style={{ height: '70vh' }}
            >
              {/* Header */}
              <div className="p-4 border-b border-border-color flex items-center justify-between bg-bg-main/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                    <TestTube size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-main">Testar Agente</h2>
                    <p className="text-xs text-text-sec">
                      {agents.find(a => a.id === selectedTestAgent)?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTestChatOpen(false)}
                  className="p-2 hover:bg-bg-card rounded-xl transition-colors text-text-sec"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12 text-text-sec">
                    <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Envie uma mensagem para testar o agente</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-bg-main' 
                        : 'bg-bg-main border border-border-color text-text-main'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-2 ${
                        msg.role === 'user' ? 'text-bg-main/60' : 'text-text-sec'
                      }`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {isChatSending && (
                  <div className="flex justify-start">
                    <div className="bg-bg-main border border-border-color rounded-2xl px-4 py-3">
                      <Loader2 size={16} className="text-text-sec animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border-color">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-bg-main border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={sendTestMessage}
                    disabled={isChatSending || !chatInput.trim()}
                    className="px-4 bg-primary rounded-xl text-bg-main hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
