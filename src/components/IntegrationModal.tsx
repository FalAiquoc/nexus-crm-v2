import React, { useState } from 'react';
import { X, ExternalLink, HelpCircle, Key, Link as LinkIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

export interface IntegrationModalConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  type: 'api_key' | 'webhook' | 'oauth' | 'custom_url';
  instructions: string;
  docsUrl?: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'password';
    placeholder: string;
  }[];
}

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: IntegrationModalConfig | null;
  onSuccess: (id: string) => void;
}

export function IntegrationModal({ isOpen, onClose, config, onSuccess }: IntegrationModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { updateSettings, refreshData } = useApp();

  if (!isOpen || !config) return null;

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // Create a payload matching the backend structure
      const payload: Record<string, string> = {};
      
      // We will map the incoming settings dynamically
      Object.keys(formData).forEach(key => {
        // e.g. gemini_api_key, openai_api_key
        payload[key] = formData[key];
      });

      // Save to backend
      for (const [k, v] of Object.entries(payload)) {
         await updateSettings(k, v);
      }
      
      await refreshData();

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess(config.id);
        onClose();
        setFormData({});
      }, 1500);
    } catch (err) {
      console.error('Error saving integration', err);
      setError('Falha ao conectar integração. Verifique os dados inseridos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-bg-sidebar border border-border-color rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-border-color flex items-center justify-between bg-bg-main/50">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-bg-main border border-border-color flex items-center justify-center ${config.color} shadow-inner`}>
                <config.icon size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-main">Conectar {config.name}</h2>
                <p className="text-sm text-text-sec flex items-center gap-1">
                  {config.type === 'api_key' ? <Key size={14} /> : <LinkIcon size={14} />}
                  Configuração de Segurança
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-text-sec hover:text-text-main transition-colors p-2 rounded-lg hover:bg-bg-card"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 overflow-y-auto hide-scrollbar space-y-6">
            
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3 text-sm text-primary">
              <HelpCircle className="shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold mb-1">Instruções de Conexão</p>
                <p className="opacity-90">{config.instructions}</p>
                {config.docsUrl && (
                  <a href={config.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 font-bold hover:underline">
                    Ver documentação oficial
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {config.fields.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-sm font-medium text-text-main ml-1 block">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              ))}
            </div>

            {error && (
              <p className="text-sm text-rose-500 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border-color bg-bg-main/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-text-sec border border-border-color hover:bg-bg-card rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading || success || config.fields.some(f => !formData[f.key])}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-bg-main rounded-xl text-sm font-bold hover:bg-secondary transition-colors disabled:opacity-50 min-w-[140px] justify-center"
            >
              {success ? (
                <>
                  <CheckCircle2 size={18} />
                  Salvo!
                </>
              ) : loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar e Conectar'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
