import { Client } from './types';

export const mockClients: Client[] = [
  { id: '1', name: 'Ana Silva', email: 'ana@example.com', phone: '(11) 99999-1111', source: 'WhatsApp', value: 5000, status: 'Novo Lead', notes: 'Interesse em plano anual' },
  { id: '2', name: 'Carlos Souza', email: 'carlos@example.com', phone: '(11) 99999-2222', source: 'Instagram', value: 3500, status: 'Em Contato', notes: 'Pediu mais detalhes' },
  { id: '3', name: 'Beatriz Lima', email: 'beatriz@example.com', phone: '(11) 99999-3333', source: 'Site', value: 12000, status: 'Proposta Enviada', notes: 'Aguardando aprovação da diretoria' },
  { id: '4', name: 'Daniel Costa', email: 'daniel@example.com', phone: '(11) 99999-4444', source: 'Indicação', value: 8000, status: 'Fechado', notes: 'Contrato assinado' },
  { id: '5', name: 'Eduardo Alves', email: 'eduardo@example.com', phone: '(11) 99999-5555', source: 'WhatsApp', value: 2000, status: 'Perdido', notes: 'Achou caro' },
];
