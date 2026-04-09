import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, Plus, Power, PowerOff, Trash2, RefreshCw, 
  QrCode, Smartphone, CheckCircle, XCircle, AlertCircle, Loader2,
  Send, Copy, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhatsAppInstance {
  id: string;
  name: string;
  instance_name: string;
  api_key: string;
  status: string;
  webhook_url?: string;
  is_default: boolean;
  connection_status?: any;
  created_at: string;
}

interface EvolutionInstance {
  instanceName: string;
  status: string;
  owner?: string;
}

export function WhatsAppInstances() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [evolutionInstances, setEvolutionInstances] = useState<EvolutionInstance[]>([]);
  const [evolutionHealth, setEvolutionHealth] = useState<{ status: string; message?: string }>({ status: 'checking' });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<string | null>(null);

  // Formulário
  const [formName, setFormName] = useState('');
  const [formInstanceName, setFormInstanceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Test message
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testInstanceId, setTestInstanceId] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadInstances();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    const token = localStorage.getItem('doboy_token');
    try {
      const res = await fetch('/api/whatsapp/health', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvolutionHealth(data);
      } else {
        setEvolutionHealth({ status: 'offline', message: 'Evolution API indisponível' });
      }
    } catch (error) {
      setEvolutionHealth({ status: 'offline', message: 'Erro de conexão' });
    }
  };

  const loadInstances = async () => {
    const token = localStorage.getItem('doboy_token');
    try {
      const res = await fetch('/api/whatsapp/instances', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInstances(data.database || []);
        setEvolutionInstances(data.evolution || []);
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInstance = async () => {
    if (!formName || !formInstanceName) return;

    setIsCreating(true);
    const token = localStorage.getItem('doboy_token');

    try {
      const res = await fetch('/api/whatsapp/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName,
          instance_name: formInstanceName.toLowerCase().replace(/\s+/g, '-'),
          qrcode: true
        })
      });

      if (res.ok) {
        await loadInstances();
        setIsCreateModalOpen(false);
        setFormName('');
        setFormInstanceName('');
      }
    } catch (error) {
      console.error('Erro ao criar instância:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnect = async (instance: WhatsAppInstance) => {
    const token = localStorage.getItem('doboy_token');
    try {
      const res = await fetch(`/api/whatsapp/instances/${instance.id}/connect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        // Mostra QR Code se disponível
        if (data.data?.base64) {
          setQrCode(data.data.base64);
          setIsQRModalOpen(true);
        }
        await loadInstances();
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
    }
  };

  const handleDisconnect = async (instance: WhatsAppInstance) => {
    if (!confirm(`Deseja desconectar "${instance.name}"?`)) return;

    const token = localStorage.getItem('doboy_token');
    try {
      await fetch(`/api/whatsapp/instances/${instance.id}/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await loadInstances();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  const handleDelete = async (instance: WhatsAppInstance) => {
    if (!confirm(`Deseja excluir permanentemente "${instance.name}"?`)) return;

    const token = localStorage.getItem('doboy_token');
    try {
      await fetch(`/api/whatsapp/instances/${instance.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await loadInstances();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const handleSetupWebhook = async (instance: WhatsAppInstance) => {
    const token = localStorage.getItem('doboy_token');
    try {
      const res = await fetch(`/api/whatsapp/instances/${instance.id}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE']
        })
      });

      if (res.ok) {
        alert('Webhook configurado com sucesso!');
        await loadInstances();
      }
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      alert('Erro ao configurar webhook');
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone || !testMessage || !testInstanceId) return;

    setIsSending(true);
    const token = localStorage.getItem('doboy_token');

    try {
      const res = await fetch('/api/whatsapp/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instance_id: testInstanceId,
          phone_number: testPhone.replace(/\D/g, ''),
          message: testMessage
        })
      });

      if (res.ok) {
        alert('Mensagem enviada com sucesso!');
        setTestPhone('');
        setTestMessage('');
      } else {
        const error = await res.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return <CheckCircle className="text-emerald-500" size={20} />;
      case 'connecting':
        return <Loader2 className="text-amber-500 animate-spin" size={20} />;
      case 'disconnected':
        return <XCircle className="text-rose-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'disconnected':
        return 'Desconectado';
      default:
        return status;
    }
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
          <MessageCircle className="text-primary" size={28} />
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">WhatsApp</h1>
            <p className="text-text-sec mt-1">Gerencie suas instâncias e conexões com Evolution API.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={checkHealth}
            className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-color rounded-xl text-text-sec hover:text-text-main transition-all"
          >
            <RefreshCw size={16} />
            Verificar Status
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary rounded-xl text-bg-main font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/10"
          >
            <Plus size={20} />
            Nova Instância
          </button>
        </div>
      </div>

      {/* Status da Evolution API */}
      <div className="bg-bg-sidebar rounded-2xl border border-border-color p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl border ${
              evolutionHealth.status === 'online' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
            }`}>
              <Smartphone size={24} />
            </div>
            <div>
              <p className="text-text-sec text-sm">Evolution API</p>
              <p className={`text-lg font-bold ${
                evolutionHealth.status === 'online' ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {evolutionHealth.message || evolutionHealth.status}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-text-sec text-sm">Instâncias Ativas</p>
            <p className="text-2xl font-bold text-text-main">
              {instances.filter(i => i.status === 'connected' || i.status === 'open').length} / {instances.length}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Instâncias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instances.length === 0 ? (
          <div className="col-span-full bg-bg-sidebar rounded-2xl border border-border-color p-12 text-center">
            <MessageCircle className="mx-auto text-text-sec mb-4" size={48} />
            <h3 className="text-xl font-bold text-text-main mb-2">Nenhuma instância encontrada</h3>
            <p className="text-text-sec mb-6">Crie sua primeira instância WhatsApp para começar a automação.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary rounded-xl text-bg-main font-bold hover:bg-secondary transition-all"
            >
              <Plus size={20} />
              Criar Primeira Instância
            </button>
          </div>
        ) : (
          instances.map(instance => (
            <motion.div
              key={instance.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-sidebar rounded-2xl border border-border-color overflow-hidden"
            >
              {/* Header do Card */}
              <div className="p-6 border-b border-border-color bg-bg-main/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <MessageCircle size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-main">{instance.name}</h3>
                      <p className="text-xs text-text-sec">{instance.instance_name}</p>
                    </div>
                  </div>
                  {getStatusIcon(instance.status)}
                </div>
              </div>

              {/* Status */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-sec uppercase tracking-wider">Status</span>
                  <span className={`text-sm font-bold ${
                    instance.status === 'connected' || instance.status === 'open' 
                      ? 'text-emerald-500' 
                      : instance.status === 'connecting' 
                        ? 'text-amber-500' 
                        : 'text-rose-500'
                  }`}>
                    {getStatusLabel(instance.status)}
                  </span>
                </div>

                {/* API Key */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-sec uppercase tracking-wider">API Key</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-bg-card px-2 py-1 rounded">
                      {showApiKey === instance.id ? instance.api_key : '••••••••'}
                    </code>
                    <button
                      onClick={() => setShowApiKey(showApiKey === instance.id ? null : instance.id)}
                      className="text-text-sec hover:text-text-main transition-colors"
                    >
                      {showApiKey === instance.id ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {instance.status !== 'connected' && instance.status !== 'open' ? (
                    <button
                      onClick={() => handleConnect(instance)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-xs font-bold hover:bg-emerald-500/20 transition-all"
                    >
                      <Power size={14} />
                      Conectar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDisconnect(instance)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-xs font-bold hover:bg-amber-500/20 transition-all"
                    >
                      <PowerOff size={14} />
                      Desconectar
                    </button>
                  )}
                  <button
                    onClick={() => handleSetupWebhook(instance)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-500 text-xs font-bold hover:bg-blue-500/20 transition-all"
                  >
                    <QrCode size={14} />
                    Webhook
                  </button>
                </div>

                <button
                  onClick={() => {
                    setTestInstanceId(instance.id);
                    setTestPhone('');
                    setTestMessage('');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary text-xs font-bold hover:bg-primary/20 transition-all"
                >
                  <Send size={14} />
                  Enviar Mensagem de Teste
                </button>

                <button
                  onClick={() => handleDelete(instance)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-bold hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 size={14} />
                  Excluir Instância
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Criar Instância */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-sidebar border border-border-color rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-color bg-bg-main/30">
                <h2 className="text-xl font-bold text-text-main">Criar Nova Instância</h2>
                <p className="text-sm text-text-sec mt-1">Configure uma nova conexão WhatsApp</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider mb-2 block">
                    Nome da Instância
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Atendimento Principal"
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider mb-2 block">
                    Identificador (slug)
                  </label>
                  <input
                    type="text"
                    value={formInstanceName}
                    onChange={(e) => setFormInstanceName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="Ex: atendimento-principal"
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-border-color rounded-xl text-text-main font-bold hover:bg-bg-main transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateInstance}
                    disabled={isCreating || !formName || !formInstanceName}
                    className="flex-1 px-6 py-3 bg-primary rounded-xl text-bg-main font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Criar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal QR Code */}
      <AnimatePresence>
        {isQRModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-sidebar border border-border-color rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-color">
                <h2 className="text-xl font-bold text-text-main">Escaneie o QR Code</h2>
                <p className="text-sm text-text-sec mt-1">Abra o WhatsApp no seu celular e escaneie</p>
              </div>

              <div className="p-6 flex flex-col items-center">
                {qrCode ? (
                  <img src={qrCode} alt="QR Code" className="max-w-full rounded-xl border-4 border-border-color" />
                ) : (
                  <div className="w-64 h-64 bg-bg-main rounded-xl border-4 border-border-color flex items-center justify-center">
                    <Loader2 size={32} className="text-primary animate-spin" />
                  </div>
                )}
                <p className="text-xs text-text-sec mt-4 text-center">
                  O QR Code expira em 60 segundos. Se necessário, solicite um novo.
                </p>
              </div>

              <div className="p-6 border-t border-border-color">
                <button
                  onClick={() => setIsQRModalOpen(false)}
                  className="w-full px-6 py-3 bg-primary rounded-xl text-bg-main font-bold hover:opacity-90 transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Enviar Mensagem de Teste */}
      <AnimatePresence>
        {testInstanceId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-sidebar border border-border-color rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-color">
                <h2 className="text-xl font-bold text-text-main">Enviar Mensagem de Teste</h2>
                <p className="text-sm text-text-sec mt-1">Teste a conexão da sua instância</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider mb-2 block">
                    Número de Telefone
                  </label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Ex: 5511999999999"
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider mb-2 block">
                    Mensagem
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Digite sua mensagem de teste..."
                    rows={4}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setTestInstanceId('')}
                    className="flex-1 px-6 py-3 border border-border-color rounded-xl text-text-main font-bold hover:bg-bg-main transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSendTestMessage}
                    disabled={isSending || !testPhone || !testMessage}
                    className="flex-1 px-6 py-3 bg-primary rounded-xl text-bg-main font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Enviar
                      </>
                    )}
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
