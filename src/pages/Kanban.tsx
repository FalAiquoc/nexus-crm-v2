import React, { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { WhatsAppWindow } from '../components/WhatsAppWindow';
import {
  LayoutGrid, FileText, MessageCircle, Loader2, Search, Plus, DollarSign
} from 'lucide-react';
import { Client } from '../types';
import { useApp } from '../context/AppContext';

// Fallback de estágios padrão (caso o banco não retorne)
const DEFAULT_STAGES = [
  { id: 's1', name: 'Novo Lead',   pipeline_id: 'p1', sort_order: 1 },
  { id: 's2', name: 'Em Contato',  pipeline_id: 'p1', sort_order: 2 },
  { id: 's3', name: 'Qualificado', pipeline_id: 'p1', sort_order: 3 },
  { id: 's4', name: 'Proposta',    pipeline_id: 'p1', sort_order: 4 },
  { id: 's5', name: 'Negociação',  pipeline_id: 'p1', sort_order: 5 },
  { id: 's6', name: 'Fechado',     pipeline_id: 'p1', sort_order: 6 },
];

const STAGE_COLORS: Record<string, { accent: string; bg: string; border: string; dot: string }> = {
  'Novo Lead':   { accent: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/25',    dot: 'bg-blue-400' },
  'Em Contato':  { accent: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   dot: 'bg-amber-400' },
  'Qualificado': { accent: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/25',  dot: 'bg-violet-400' },
  'Proposta':    { accent: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/25',    dot: 'bg-cyan-400' },
  'Negociação':  { accent: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25',  dot: 'bg-orange-400' },
  'Fechado':     { accent: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', dot: 'bg-emerald-400' },
  'Perdido':     { accent: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/25',    dot: 'bg-rose-400' },
};
const DEFAULT_COLOR = { accent: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/25', dot: 'bg-primary' };

const SOURCE_ICONS: Record<string, string> = {
  'WhatsApp': '💬', 'Instagram': '📸', 'LinkedIn': '💼',
  'Email': '📧', 'Indicação': '🤝', 'Site': '🌐', 'Manual': '✍️',
};

function getInitials(name: string) {
  const parts = (name || 'NN').split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
}

interface KanbanProps {
  onSelectClient?: (client: any) => void;
}

export function Kanban({ onSelectClient }: KanbanProps) {
  const { clients, stages: dbStages, isLoading, updateClient } = useApp();
  const stages = (dbStages && dbStages.length > 0) ? dbStages : DEFAULT_STAGES;

  const [search, setSearch] = useState('');
  const [selectedClientForWA, setSelectedClientForWA] = useState<Client | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const filteredClients = (clients || []).filter(c =>
    c && (
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const getColumnValue = (colName: string) =>
    filteredClients
      .filter(c => c.status === colName)
      .reduce((sum, c) => sum + (Number(c.value) || 0), 0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.kanban-card')) return;
    setIsDraggingScroll(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeftPos(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingScroll) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeftPos - walk;
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const client = (clients || []).find(c => c.id === draggableId);
    if (client) {
      updateClient({ ...client, status: destination.droppableId as Client['status'] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-primary">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
            <LayoutGrid className="text-primary" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Pipeline de Vendas</h1>
            <p className="text-xs text-text-sec mt-0.5">
              {filteredClients.length} leads · arraste para mover entre estágios
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" size={15} />
          <input
            type="text"
            placeholder="Filtrar leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-bg-card border border-border-color rounded-xl pl-9 pr-4 py-2 text-sm text-text-main focus:outline-none focus:border-primary transition-colors w-52"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={() => setIsDraggingScroll(false)}
          onMouseUp={() => setIsDraggingScroll(false)}
          onMouseMove={handleMouseMove}
          style={{ cursor: isDraggingScroll ? 'grabbing' : 'grab' }}
          className="flex-1 overflow-x-auto overflow-y-hidden pb-3 select-none"
        >
          <div className="flex gap-4 h-full min-w-max px-0.5">
            {stages.map(col => {
              const color = STAGE_COLORS[col.name] || DEFAULT_COLOR;
              const colClients = filteredClients.filter(c => c.status === col.name);
              const colValue = getColumnValue(col.name);

              return (
                <Droppable droppableId={col.name} key={col.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex flex-col w-72 shrink-0 rounded-2xl border transition-all duration-200 ${
                        snapshot.isDraggingOver
                          ? `${color.bg} ${color.border} border-2`
                          : 'bg-bg-sidebar border-border-color'
                      }`}
                    >
                      {/* Column Header */}
                      <div className="p-4 border-b border-border-color shrink-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
                            <h3 className={`font-bold text-xs uppercase tracking-wider ${color.accent}`}>
                              {col.name}
                            </h3>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color.bg} ${color.accent} border ${color.border}`}>
                            {colClients.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-text-sec mt-1 min-h-[16px]">
                          <DollarSign size={11} />
                          <span className="font-semibold">
                            R$ {colValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>

                      {/* Cards */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[120px]">
                        {colClients.map((client, index) => (
                          <React.Fragment key={client.id}>
                            <Draggable draggableId={client.id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  onClick={() => onSelectClient?.(client)}
                                  className={`kanban-card bg-bg-card rounded-xl border p-3.5 cursor-pointer transition-all ${
                                    dragSnapshot.isDragging
                                      ? 'border-primary shadow-2xl shadow-primary/20 scale-[1.03] rotate-1'
                                      : 'border-border-color hover:border-primary/40 hover:shadow-md'
                                  }`}
                                >
                                  {/* Card Header */}
                                  <div className="flex items-start gap-2.5 mb-2.5">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${color.bg} ${color.accent} border ${color.border}`}>
                                      {getInitials(client.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-text-main text-sm truncate leading-snug">
                                        {client.name || 'Sem Nome'}
                                      </p>
                                      {client.email && (
                                        <p className="text-[10px] text-text-sec truncate mt-0.5">
                                          {client.email}
                                        </p>
                                      )}
                                    </div>
                                    {(Number(client.value) || 0) > 0 && (
                                      <span className="text-[11px] font-bold text-secondary shrink-0">
                                        R$ {(Number(client.value) || 0).toLocaleString('pt-BR')}
                                      </span>
                                    )}
                                  </div>

                                  {/* Source */}
                                  <div className="flex items-center gap-1 mb-2.5">
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-text-sec bg-bg-main border border-border-color px-2 py-0.5 rounded-md">
                                      <span>{SOURCE_ICONS[client.source || ''] || '📌'}</span>
                                      {client.source || 'Manual'}
                                    </span>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1.5 pt-2 border-t border-border-color/50">
                                    <button
                                      onClick={e => { e.stopPropagation(); setSelectedClientForWA(client); }}
                                      className="flex items-center gap-1 px-2 py-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-lg border border-[#25D366]/20 transition-colors text-[10px] font-bold"
                                    >
                                      <MessageCircle size={10} />
                                      WhatsApp
                                    </button>
                                    <button
                                      onClick={e => { e.stopPropagation(); onSelectClient?.(client); }}
                                      className="flex items-center gap-1 px-2 py-1 bg-bg-main hover:bg-primary/10 text-text-sec hover:text-primary rounded-lg border border-border-color transition-colors text-[10px] font-bold ml-auto"
                                    >
                                      <FileText size={10} />
                                      Ver
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          </React.Fragment>
                        ))}
                        {provided.placeholder}

                        {/* Empty State */}
                        {colClients.length === 0 && (
                          <div className={`flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-xl transition-colors ${
                            snapshot.isDraggingOver
                              ? `${color.border} ${color.bg}`
                              : 'border-border-color/50'
                          }`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color.bg} border ${color.border}`}>
                              <Plus size={15} className={color.accent} />
                            </div>
                            <p className="text-[11px] text-text-sec text-center">
                              {snapshot.isDraggingOver ? 'Soltar aqui' : 'Nenhum lead'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {/* WhatsApp Popup */}
      {selectedClientForWA && (
        <WhatsAppWindow
          client={selectedClientForWA}
          onClose={() => setSelectedClientForWA(null)}
        />
      )}
    </div>
  );
}
