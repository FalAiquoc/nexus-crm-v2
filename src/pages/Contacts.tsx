import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  ChevronLeft,
  ChevronRight,
  Download,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { MockupGenerator } from '../components/MockupGenerator';
import { useApp } from '../context/AppContext';

interface ContactsProps {
  onAddClient: () => void;
  onSelectClient?: (client: any) => void;
}

export function Contacts({ onAddClient, onSelectClient }: ContactsProps) {
  const { clients } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['Todos', 'Novo Lead', 'Em Contato', 'Qualificado', 'Proposta', 'Negociação', 'Fechado', 'Perdido'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="text-primary" size={28} />
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Contatos</h1>
            <p className="text-text-sec mt-1">Gerencie sua base de leads e clientes.</p>
          </div>
        </div>
        <button 
          onClick={onAddClient}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary rounded-xl text-bg-main font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/10"
        >
          <Plus size={20} />
          Novo Lead
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-bg-sidebar p-4 rounded-2xl border border-border-color flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-main border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-medium transition-all border ${
                statusFilter === status 
                  ? 'bg-primary/10 text-primary border-primary/50' 
                  : 'bg-bg-main text-text-sec border-border-color hover:border-primary/30'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button className="p-2.5 bg-bg-main border border-border-color rounded-xl text-text-sec hover:text-primary transition-colors">
          <Download size={20} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-bg-sidebar rounded-2xl border border-border-color overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-main border-b border-border-color">
                <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Nome</th>
                <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Origem</th>
                <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Contato</th>
                <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filteredClients.map((client, index) => (
                <motion.tr 
                  key={client.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectClient?.(client)}
                  className="hover:bg-bg-card transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-border-color flex items-center justify-center text-primary font-bold text-sm">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">{client.name}</p>
                        <p className="text-xs text-text-sec">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      client.status === 'Fechado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      client.status === 'Perdido' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      'bg-primary/10 text-primary border-primary/20'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-text-sec bg-bg-main px-2 py-1 rounded border border-border-color">
                      {client.source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-text-main">R$ {client.value.toLocaleString('pt-BR')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 bg-bg-main border border-border-color rounded-lg text-text-sec hover:text-primary transition-colors">
                        <Mail size={14} />
                      </button>
                      <button className="p-1.5 bg-bg-main border border-border-color rounded-lg text-text-sec hover:text-primary transition-colors">
                        <Phone size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-1.5 text-text-sec hover:text-text-main transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="p-4 bg-bg-main border-t border-border-color flex items-center justify-between">
          <p className="text-xs text-text-sec">Mostrando {filteredClients.length} de {clients.length} contatos</p>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-bg-sidebar border border-border-color rounded-lg text-text-sec disabled:opacity-50" disabled>
              <ChevronLeft size={16} />
            </button>
            <button className="p-2 bg-bg-sidebar border border-border-color rounded-lg text-text-sec disabled:opacity-50" disabled>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <MockupGenerator 
        pageName="Contacts Table" 
        promptDescription="A professional data table for managing CRM contacts. Features search, status filters, and a clean list with avatars, status badges, and action buttons." 
      />
    </div>
  );
}
