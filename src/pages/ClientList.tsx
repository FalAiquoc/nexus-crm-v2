import { useState } from 'react';
import { Search, SlidersHorizontal, Users } from 'lucide-react';
import { MockupGenerator } from '../components/MockupGenerator';
import { Client } from '../types';

interface ClientListProps {
  clients: Client[];
}

export function ClientList({ clients }: ClientListProps) {
  const [search, setSearch] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <Users className="text-primary" size={28} />
        <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-wide">Lista de Clientes</h2>
      </div>
      
      <div className="bg-bg-card border border-border-color rounded-xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border-color flex flex-col sm:flex-row gap-4 justify-between items-center bg-bg-sidebar">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sec" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-main border border-border-color rounded-lg pl-11 pr-4 py-2.5 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-bg-main hover:bg-border-color text-text-main border border-border-color rounded-lg transition-colors w-full sm:w-auto justify-center text-sm font-medium">
            <SlidersHorizontal size={16} className="text-primary" />
            FILTROS
          </button>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-main text-text-sec text-xs uppercase tracking-wider border-b border-border-color">
                <th className="p-4 font-medium">Nome</th>
                <th className="p-4 font-medium">Contato</th>
                <th className="p-4 font-medium">Origem</th>
                <th className="p-4 font-medium">Valor</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-bg-sidebar transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-text-main">{client.name}</p>
                    <p className="text-xs text-text-sec mt-0.5">{client.email}</p>
                  </td>
                  <td className="p-4 text-text-main text-sm">{client.phone}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-bg-main border border-border-color text-text-sec rounded text-xs uppercase tracking-wider">
                      {client.source}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-secondary">
                    R$ {client.value.toLocaleString('pt-BR')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${
                      client.status === 'Fechado' ? 'bg-primary/10 text-primary border-primary/20' :
                      client.status === 'Perdido' ? 'bg-border-color text-text-sec border-border-color' :
                      'bg-bg-main text-secondary border-border-color'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-sec text-sm">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards View */}
        <div className="md:hidden flex flex-col divide-y divide-border-color">
          {filteredClients.map(client => (
            <div key={client.id} className="p-4 bg-bg-card space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-text-main text-lg">{client.name}</p>
                  <p className="text-xs text-text-sec">{client.email}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                  client.status === 'Fechado' ? 'bg-primary/10 text-primary border-primary/20' :
                  client.status === 'Perdido' ? 'bg-border-color text-text-sec border-border-color' :
                  'bg-bg-main text-secondary border-border-color'
                }`}>
                  {client.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-main">{client.phone}</span>
                <span className="font-semibold text-secondary">R$ {client.value.toLocaleString('pt-BR')}</span>
              </div>
              <div>
                <span className="px-2 py-1 bg-bg-main border border-border-color text-text-sec rounded text-[10px] uppercase tracking-wider">
                  {client.source}
                </span>
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && (
            <div className="p-8 text-center text-text-sec text-sm">
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      </div>

      <MockupGenerator 
        pageName="Client List Table" 
        promptDescription="A data table listing clients with columns for Name, Contact, Source, Value, and Status. Includes a search bar and filter button at the top." 
      />
    </div>
  );
}
