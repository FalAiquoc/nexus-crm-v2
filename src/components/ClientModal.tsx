import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, DollarSign, Tag, Calendar, MessageSquare, Save, Trash2, FileText } from 'lucide-react';
import { Client } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  onDelete?: (id: string) => void;
}

export function ClientModal({ client, isOpen, onClose, onSave, onDelete }: ClientModalProps) {
  const [editedClient, setEditedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (client) {
      setEditedClient({ ...client });
    }
  }, [client]);

  if (!isOpen || !editedClient) return null;

  const handleChange = (field: keyof Client, value: any) => {
    setEditedClient(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = () => {
    if (editedClient) {
      onSave(editedClient);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-bg-sidebar w-full max-w-2xl rounded-2xl border border-border-color shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-border-color flex items-center justify-between bg-bg-main/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {editedClient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-main">Detalhes do Lead</h2>
                <p className="text-xs text-text-sec uppercase tracking-widest font-semibold">ID: {editedClient.id}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-bg-card rounded-full text-text-sec hover:text-text-main transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Basic Info */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                <User size={16} />
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-sec">Nome Completo</label>
                  <input 
                    type="text"
                    value={editedClient.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-sec">E-mail</label>
                  <input 
                    type="email"
                    value={editedClient.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-sec">Telefone / WhatsApp</label>
                  <input 
                    type="text"
                    value={editedClient.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-sec flex items-center gap-1.5">
                    <FileText size={12} className="text-primary" /> CPF / CNPJ
                  </label>
                  <input 
                    type="text"
                    value={editedClient.cpf_cnpj || ''}
                    onChange={(e) => handleChange('cpf_cnpj', e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-sec">Origem do Lead</label>
                  <select 
                    value={editedClient.source}
                    onChange={(e) => handleChange('source', e.target.value)}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Google">Google</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Address */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                <MapPin size={16} />
                Localização (Giga-Dados)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-xs font-medium text-text-sec">Endereço / Logradouro</label>
                  <input 
                    type="text"
                    value={editedClient.address?.street || ''}
                    onChange={(e) => handleChange('address', { ...editedClient.address, street: e.target.value })}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-all"
                    placeholder="Rua, Av..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-sec">Nº</label>
                  <input 
                    type="text"
                    value={editedClient.address?.number || ''}
                    onChange={(e) => handleChange('address', { ...editedClient.address, number: e.target.value })}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-text-sec">Cidade</label>
                  <input 
                    type="text"
                    value={editedClient.address?.city || ''}
                    onChange={(e) => handleChange('address', { ...editedClient.address, city: e.target.value })}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-sec">Estado (UF)</label>
                  <input 
                    type="text"
                    value={editedClient.address?.state || ''}
                    onChange={(e) => handleChange('address', { ...editedClient.address, state: e.target.value })}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-sec">CEP</label>
                  <input 
                    type="text"
                    value={editedClient.address?.zip || ''}
                    onChange={(e) => handleChange('address', { ...editedClient.address, zip: e.target.value })}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Tags */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                <Tag size={16} />
                Segmentação e Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Empresa', 'Urgente', 'VIP', 'Processado', 'Aguardando'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      const currentTags = editedClient.tags || [];
                      const newTags = currentTags.includes(tag) 
                        ? currentTags.filter(t => t !== tag)
                        : [...currentTags, tag];
                      handleChange('tags', newTags);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      (editedClient.tags || []).includes(tag)
                        ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
                        : 'bg-bg-main border-border-color text-text-sec hover:border-primary/50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </section>

            {/* Business Info */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                <DollarSign size={16} />
                Dados de Negócio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-sec">Valor Estimado (R$)</label>
                  <input 
                    type="number"
                    value={editedClient.value}
                    onChange={(e) => handleChange('value', parseFloat(e.target.value))}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-sec">Status / Etapa</label>
                  <select 
                    value={editedClient.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="Novo Lead">Novo Lead</option>
                    <option value="Em Contato">Em Contato</option>
                    <option value="Qualificado">Qualificado</option>
                    <option value="Proposta">Proposta</option>
                    <option value="Negociação">Negociação</option>
                    <option value="Fechado">Fechado</option>
                    <option value="Perdido">Perdido</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Notes */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={16} />
                Observações e Histórico
              </h3>
              <textarea 
                value={editedClient.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Adicione detalhes sobre o atendimento, preferências do cliente ou próximos passos..."
                className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary transition-all min-h-[120px] resize-none"
              />
            </section>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border-color bg-bg-main/20 flex items-center justify-between">
            {onDelete ? (
              <button 
                onClick={() => onDelete(editedClient.id)}
                className="flex items-center gap-2 text-rose-500 hover:text-rose-600 font-semibold transition-colors"
              >
                <Trash2 size={18} />
                Excluir Lead
              </button>
            ) : <div />}
            
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-border-color text-text-main font-semibold hover:bg-bg-card transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-primary text-bg-main font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20"
              >
                <Save size={18} />
                Salvar Alterações
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
