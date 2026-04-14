import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Phone, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface BlacklistItem {
  phone_number: string;
  description: string;
  created_at: string;
}

export function WhatsAppBlacklist() {
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { showToast } = useToast();

  const fetchBlacklist = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/blacklist', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('doboy_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBlacklist(data);
      }
    } catch (err) {
      showToast('Erro ao carregar blacklist', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/settings/blacklist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('doboy_token')}` 
        },
        body: JSON.stringify({ phone_number: newPhone, description: newDesc })
      });

      if (res.ok) {
        showToast('Número bloqueado com sucesso', 'success');
        setNewPhone('');
        setNewDesc('');
        fetchBlacklist();
      } else {
        showToast('Erro ao adicionar número', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (phone: string) => {
    if (!window.confirm('Deseja remover este número da blacklist? Ele voltará a ser processado pelo CRM.')) return;

    try {
      const res = await fetch(`/api/settings/blacklist/${phone}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('doboy_token')}` }
      });

      if (res.ok) {
        showToast('Número removido da blacklist', 'success');
        fetchBlacklist();
      }
    } catch (err) {
      showToast('Erro ao remover', 'error');
    }
  };

  return (
    <div className="bg-bg-sidebar border border-border-color p-6 md:p-8 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="text-secondary" size={20} />
          <h3 className="text-lg font-semibold text-text-main uppercase tracking-wider">Privacidade / Blacklist WhatsApp</h3>
        </div>
      </div>

      <p className="text-sm text-text-sec mb-6 leading-relaxed">
        Adicione números pessoais, familiares ou grupos que você deseja que o CRM <strong>ignore completamente</strong>. 
        Mensagens destes números não serão salvas e não dispararão automações.
      </p>

      {/* Formulário de Adição */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="relative group">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sec" size={16} />
          <input 
            type="text" 
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="DDI + DDD + Número"
            className="w-full bg-bg-main/50 border border-border-color rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-secondary/50 transition-all text-sm"
          />
        </div>
        <div className="relative group">
          <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sec" size={16} />
          <input 
            type="text" 
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descrição (Ex: Familiar)"
            className="w-full bg-bg-main/50 border border-border-color rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-secondary/50 transition-all text-sm"
          />
        </div>
        <button 
          type="submit"
          disabled={isAdding || !newPhone}
          className="bg-secondary text-bg-main py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isAdding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          Bloquear Número
        </button>
      </form>

      {/* Lista de Números */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : blacklist.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border-color rounded-xl">
            <AlertCircle className="mx-auto text-text-sec mb-2" size={24} />
            <p className="text-sm text-text-sec">Nenhum número bloqueado no momento.</p>
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {blacklist.map((item) => (
              <div key={item.phone_number} className="flex items-center justify-between p-4 bg-bg-main/30 border border-border-color rounded-xl group hover:border-secondary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-main">+{item.phone_number}</h4>
                    <p className="text-xs text-text-sec">{item.description}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemove(item.phone_number)}
                  className="p-2 text-text-sec hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
