import { X, MessageCircle, ExternalLink, Send } from 'lucide-react';
import { Client } from '../types';
import { useState } from 'react';

interface WhatsAppWindowProps {
  client: Client;
  onClose: () => void;
}

export function WhatsAppWindow({ client, onClose }: WhatsAppWindowProps) {
  const [message, setMessage] = useState('');

  const handleOpenWhatsApp = () => {
    const phone = client.phone.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(message);
    const url = `https://wa.me/${phone}${message ? `?text=${encodedMsg}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#2a2a2a] w-full max-w-md rounded-2xl border border-[#3a3a3a] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#212121] p-4 border-b border-[#3a3a3a] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20">
              <MessageCircle className="text-[#25D366]" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-[#F0EAD6] leading-tight">{client.name}</h3>
              <p className="text-xs text-[#9A9A9A]">{client.phone}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#3a3a3a] rounded-full text-[#9A9A9A] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#3a3a3a]">
            <p className="text-sm text-[#9A9A9A] mb-4">
              Você será redirecionado para o WhatsApp Web ou aplicativo para iniciar a conversa com este lead.
            </p>
            
            <div className="space-y-3">
              <label className="text-xs font-medium text-[#C9A84C] uppercase tracking-wider">
                Mensagem Inicial (Opcional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Olá, tudo bem? Vi seu interesse em..."
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 text-sm text-[#F0EAD6] focus:outline-none focus:border-[#C9A84C] transition-colors resize-none h-24"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleOpenWhatsApp}
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#22c35e] text-[#1a1a1a] font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/10"
            >
              <Send size={18} />
              ABRIR NO WHATSAPP
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 text-[#9A9A9A] hover:text-[#F0EAD6] text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#212121] p-3 text-center border-t border-[#3a3a3a]">
          <p className="text-[10px] text-[#555] flex items-center justify-center gap-1">
            <ExternalLink size={10} /> Link direto via wa.me
          </p>
        </div>
      </div>
    </div>
  );
}
