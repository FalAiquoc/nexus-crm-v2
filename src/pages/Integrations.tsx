import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Smartphone, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  RefreshCw, 
  Plus, 
  Trash2,
  Zap,
  Bot,
  ExternalLink,
  Loader2,
  Database,
  Unplug
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { MockupGenerator } from '../components/MockupGenerator';

interface WhatsAppInstance {
  instanceName: string;
  status: 'connected' | 'disconnected' | 'connecting';
  type: string;
}

export function Integrations() {
  const { settings, updateSettings, isSimulationMode } = useApp();
  const { showToast } = useToast();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [activeInstance, setActiveInstance] = useState<string | null>(null);

  // 🔄 Fetch WhatsApp Status
  const fetchStatus = async () => {
    // Se estiver em modo simulação, injetamos uma instância fake conectada
    if (isSimulationMode) {
      setInstances([{
        instanceName: 'nexus_v2_simulated',
        status: 'connected',
        type: 'WHATSAPP-BAILEYS'
      }]);
      return;
    }

    try {
      const token = localStorage.getItem('doboy_token');
      const res = await fetch('/api/whatsapp/instances', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setInstances(data.map(inst => ({
          instanceName: inst.instanceName,
          status: inst.connectionStatus === 'open' ? 'connected' : 'disconnected',
          type: inst.owner || 'BAILEYS'
        })));
      }
    } catch (err) {
      console.error("Erro status WA:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [isSimulationMode]);

  const handleConnect = async () => {
    if (isSimulationMode) {
      showToast("Modo Simulação: WhatsApp conectado automaticamente.", "success");
      return;
    }

    setIsGeneratingQR(true);
    setQrCodeData(null);
    try {
      const token = localStorage.getItem('doboy_token');
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ instanceName: 'nexus_v2' })
      });
      const data = await res.json();
      
      if (data.qrcode?.base64) {
        setQrCodeData(data.qrcode.base64);
        setActiveInstance('nexus_v2');
      } else {
        showToast("Erro ao gerar QR Code. Tente novamente.", "error");
      }
    } catch (err) {
      showToast("Falha na conexão com a Evolution API", "error");
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleDeleteInstance = async (name: string) => {
    if (!window.confirm(`Deseja realmente desconectar a instância ${name}?`)) return;
    
    try {
      const token = localStorage.getItem('doboy_token');
      await fetch(`/api/whatsapp/instance/${name}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      showToast("Instância desconectada.", "success");
      fetchStatus();
    } catch (err) {
      showToast("Erro ao desconectar.", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🚀 Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Hub de Integrações</h2>
          <p className="text-text-sec text-sm mt-1">Conecte o Nexus CRM às ferramentas que você já utiliza.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 📱 WhatsApp Evolution Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-bg-sidebar border border-border-color rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-border-color bg-bg-sidebar/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-[#25D366]/10 text-[#25D366]">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-text-main uppercase tracking-widest text-sm">WhatsApp Business</h3>
                  <p className="text-xs text-text-sec">Via Evolution API v2</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSimulationMode && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20 uppercase">
                    <Database size={10} /> Simulado
                  </span>
                )}
                <button 
                  onClick={fetchStatus}
                  className="p-2 rounded-xl border border-border-color hover:bg-bg-main transition-colors"
                >
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="p-8">
              {instances.length > 0 ? (
                <div className="space-y-4">
                  {instances.map((inst, i) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-bg-main/50 border border-border-color group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${inst.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-text-main text-sm">{inst.instanceName}</p>
                          <p className="text-[10px] text-text-sec uppercase tracking-widest">{inst.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${
                            inst.status === 'connected' ? 'text-emerald-500' : 'text-red-500'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${inst.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {inst.status === 'connected' ? 'Conectado' : 'Desconectado'}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteInstance(inst.instanceName)}
                          className="p-2 rounded-lg text-text-sec hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Unplug size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-6">
                  <div className="mx-auto w-20 h-20 rounded-full bg-bg-main flex items-center justify-center border-2 border-dashed border-border-color">
                    <Smartphone className="text-text-sec/30" size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main mb-1 text-lg">Nenhuma conexão ativa</h4>
                    <p className="text-sm text-text-sec max-w-xs mx-auto">Conecte seu WhatsApp para habilitar notificações e chatbots inteligentes.</p>
                  </div>
                  <button 
                    onClick={handleConnect}
                    disabled={isGeneratingQR}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-bg-main rounded-2xl font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingQR ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                    PAREAR WHATSAPP AGORA
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 🧩 QR Code Modal / Overlay */}
          {qrCodeData && (
            <div className="bg-bg-sidebar border border-primary/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95">
              <div className="bg-white p-4 rounded-3xl shadow-2xl">
                <img src={qrCodeData} alt="WhatsApp QR Code" className="w-64 h-64" />
              </div>
              <div className="max-w-xs">
                <h4 className="font-bold text-text-main text-lg mb-2">Escaneie o QR Code</h4>
                <p className="text-xs text-text-sec leading-relaxed">Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e aponte a câmera para esta tela.</p>
              </div>
              <button 
                onClick={() => setQrCodeData(null)}
                className="text-xs font-bold text-text-sec hover:text-primary transition-colors uppercase tracking-widest"
              >
                Cancelar Pareamento
              </button>
            </div>
          )}

          {/* 🤖 Chatbot & Automation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-bg-sidebar border border-border-color p-6 rounded-3xl group hover:border-primary/30 transition-all cursor-pointer">
              <div className="p-3 w-fit rounded-2xl bg-primary/10 text-primary mb-4">
                <Bot size={24} />
              </div>
              <h4 className="font-bold text-text-main mb-2">Nexus AI Agent</h4>
              <p className="text-xs text-text-sec leading-relaxed">Inteligência artificial que responde leads automaticamente 24/7 com contexto do seu negócio.</p>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                Configurar <ExternalLink size={12} />
              </div>
            </div>

            <div className="bg-bg-sidebar border border-border-color p-6 rounded-3xl group hover:border-primary/30 transition-all cursor-pointer">
              <div className="p-3 w-fit rounded-2xl bg-blue-500/10 text-blue-400 mb-4">
                <Zap size={24} />
              </div>
              <h4 className="font-bold text-text-main mb-2">Fluxos de Automação</h4>
              <p className="text-xs text-text-sec leading-relaxed">Crie réguas de cobrança, confirmação de agendamentos e boas-vindas sem códigos.</p>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                Explorar <ExternalLink size={12} />
              </div>
            </div>
          </div>
        </div>

        {/* ⚙️ API Settings & Details */}
        <div className="lg:col-span-4 space-y-8">
          {/* 🧪 Simulation Controls (Admin Only - SDD) */}
          <div className="bg-bg-sidebar border border-border-color p-6 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Database className="text-amber-500" size={20} />
              <h3 className="text-xs font-bold text-text-main border-b border-amber-500/30 pb-1 uppercase tracking-widest">Controles de Simulação</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-[10px] text-text-sec leading-relaxed mb-4">
                Gerencie dados fictícios para demonstração e testes de estresse da interface.
              </p>

              <button 
                onClick={async () => {
                  if (!window.confirm("Isso irá remover TODOS os dados marcados como simulação. Continuar?")) return;
                  const token = localStorage.getItem("doboy_token");
                  const res = await fetch("/api/admin/clear-mock-data", { 
                    method: "POST", 
                    headers: { "Authorization": `Bearer ${token}` } 
                  });
                  const data = await res.json();
                  if (data.success) showToast(data.message, "success");
                }}
                className="w-full py-3 rounded-xl border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Limpar Dados Fake
              </button>

              <button 
                onClick={async () => {
                  const token = localStorage.getItem("doboy_token");
                  const res = await fetch("/api/admin/seed-mock-data", { 
                    method: "POST", 
                    headers: { "Authorization": `Bearer ${token}` } 
                  });
                  const data = await res.json();
                  if (data.success) showToast(data.message, "success");
                }}
                className="w-full py-3 rounded-xl bg-amber-500 text-bg-sidebar text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Zap size={14} /> Adicionar Dados Fake
              </button>
            </div>
          </div>

          <div className="bg-bg-sidebar border border-border-color p-6 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <SettingsIcon className="text-primary" size={20} />
              <h3 className="text-xs font-bold text-text-main uppercase tracking-widest">Configuração Técnica</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-text-sec uppercase tracking-[0.2em] mb-2">Evolution URL</label>
                <div className="px-4 py-3 bg-bg-main border border-border-color rounded-xl text-xs text-text-sec truncate">
                  {settings.whatsapp_evo_url || 'Não configurado'}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-sec uppercase tracking-[0.2em] mb-2">Global API Key</label>
                <div className="px-4 py-3 bg-bg-main border border-border-color rounded-xl text-xs text-text-sec tracking-widest">
                  ••••••••••••••••••••••••
                </div>
              </div>

              <div className="pt-4 border-t border-border-color">
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="text-text-sec">Versão da API</span>
                  <span className="text-text-main font-bold">2.1.1 (v2)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-sec">Engine de Proxy</span>
                  <span className="text-emerald-400 font-bold">Ativa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Status */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Webhooks Ativos</h4>
            </div>
            <p className="text-[11px] text-text-sec leading-relaxed">
              Recebendo eventos em tempo real para: 
              <br/><br/>
              • Mensagens Recebidas
              <br/>
              • Status de Conexão
              <br/>
              • Presença do Usuário
            </p>
          </div>
        </div>
      </div>

      <MockupGenerator 
        pageName="Integrations" 
        promptDescription="An integrations hub showing WhatsApp connectivity status with a QR code pairing section. Tech-focused design with neon green and gold accents." 
      />
    </div>
  );
}
