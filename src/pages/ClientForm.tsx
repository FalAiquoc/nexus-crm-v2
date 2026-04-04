import React, { useState } from 'react';
import { MockupGenerator } from '../components/MockupGenerator';
import { UserPlus, User, Phone, Mail, Globe, DollarSign, FileText, Check } from 'lucide-react';
import { Client } from '../types';

interface ClientFormProps {
  onAddClient: (client: Client) => void;
}

export function ClientForm({ onAddClient }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'WhatsApp' as Client['source'],
    value: '',
    notes: ''
  });
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      source: formData.source,
      value: Number(formData.value) || 0,
      status: 'Novo Lead',
      notes: formData.notes
    };

    onAddClient(newClient);
    
    // Show toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Clear form
    setFormData({
      name: '',
      phone: '',
      email: '',
      source: 'WhatsApp',
      value: '',
      notes: ''
    });
  };

  return (
    <div className="max-w-3xl mx-auto w-full relative">
      {showToast && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 bg-primary text-bg-main px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 z-50">
          <Check size={18} />
          Cliente salvo com sucesso!
        </div>
      )}

      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <UserPlus className="text-primary" size={28} />
        <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-wide">Novo Cliente</h2>
      </div>
      
      <div className="bg-bg-card border border-border-color rounded-xl p-6 md:p-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-text-sec mb-2 uppercase tracking-wider flex items-center gap-2">
                  <User size={14} className="text-primary" /> Nome Completo
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-bg-main border border-border-color rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                  placeholder="Ex: João Silva" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-sec mb-2 uppercase tracking-wider flex items-center gap-2">
                  <Phone size={14} className="text-primary" /> Telefone
                </label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-bg-main border border-border-color rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                  placeholder="(00) 00000-0000" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-text-sec mb-2 uppercase tracking-wider flex items-center gap-2">
                  <Mail size={14} className="text-primary" /> E-mail
                </label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-bg-main border border-border-color rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                  placeholder="joao@exemplo.com" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-sec mb-2 uppercase tracking-wider flex items-center gap-2">
                  <Globe size={14} className="text-primary" /> Origem
                </label>
                <select 
                  value={formData.source}
                  onChange={e => setFormData({...formData, source: e.target.value as Client['source']})}
                  className="w-full bg-bg-main border border-border-color rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Site">Site</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-text-sec mb-2 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign size={14} className="text-primary" /> Valor (R$)
                </label>
                <input 
                  type="number" 
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: e.target.value})}
                  className="w-full bg-bg-main border border-border-color rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                  placeholder="0.00" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-text-sec mb-2 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} className="text-primary" /> Notas Rápidas
                </label>
                <input 
                  type="text" 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-bg-main border border-border-color rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                  placeholder="Ex: Urgente, prefere WhatsApp..."
                />
              </div>
            </div>

          
          <div className="pt-6 flex justify-end">
            <button type="submit" className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-grad-start to-grad-end hover:from-primary hover:to-secondary text-bg-main rounded-lg font-bold transition-all flex items-center justify-center gap-2">
              <Check size={18} />
              SALVAR CLIENTE
            </button>
          </div>
        </form>
      </div>

      <MockupGenerator 
        pageName="Client Registration Form" 
        promptDescription="A clean, modern form with input fields for Name, Phone, Email, Source dropdown, Estimated Value, and a text area for Notes. Includes a prominent Save button." 
      />
    </div>
  );
}
