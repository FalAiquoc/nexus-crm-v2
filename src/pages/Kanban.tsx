import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { MockupGenerator } from '../components/MockupGenerator';
import { WhatsAppWindow } from '../components/WhatsAppWindow';
import { LayoutGrid, CircleDashed, MessageSquare, FileText, CheckCircle2, XCircle, Tag, MessageCircle, Loader2 } from 'lucide-react';
import { Client } from '../types';
import { useApp } from '../context/AppContext';

const iconMap: Record<string, any> = {
  'Novo Lead': CircleDashed,
  'Em Contato': MessageSquare,
  'Qualificado': Tag,
  'Proposta': FileText,
  'Negociação': MessageCircle,
  'Fechado': CheckCircle2,
  'Perdido': XCircle,
};

interface KanbanProps {
  onSelectClient?: (client: any) => void;
}

export function Kanban({ onSelectClient }: KanbanProps) {
  const { clients, stages, pipelines, settings, isLoading, updateClient } = useApp();
  const workspaceType = settings.workspace_type;
  
  const [activePipeline, setActivePipeline] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [search, setSearch] = useState('');
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    if (pipelines.length > 0 && !activePipeline) {
      const defaultPipe = pipelines.find(p => p.is_default) || pipelines[0];
      setActivePipeline(defaultPipe.id);
    }
  }, [pipelines]);

  useEffect(() => {
    if (stages.length > 0 && !activeTab) {
      setActiveTab(stages[0].name);
    }
  }, [stages]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const [selectedClientForWA, setSelectedClientForWA] = useState<Client | null>(null);
  
  // Grab-to-scroll logic
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Tabs scroll logic
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const [tabsStartX, setTabsStartX] = useState(0);
  const [tabsScrollLeft, setTabsScrollLeft] = useState(0);

  // Filter clients based on search
  const filteredClients = (clients || []).filter(c => 
    c && (
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  // Scroll Spy Logic: Sync active tab with board scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScrollSpy = () => {
      if (isDraggingScroll) return; // Don't update while manually dragging to avoid jitter

      const scrollPos = container.scrollLeft + (container.offsetWidth / 2);
      let closestCol: string = stages[0]?.name || '';
      let minDistance = Infinity;

      stages.forEach(col => {
        const el = document.getElementById(`column-${col.name}`);
        if (el) {
          const center = el.offsetLeft + (el.offsetWidth / 2);
          const distance = Math.abs(scrollPos - center);
          if (distance < minDistance) {
            minDistance = distance;
            closestCol = col.name;
          }
        }
      });

      if (closestCol !== activeTabRef.current) {
        setActiveTab(closestCol);
        
        // Also scroll the tabs container to keep active tab visible
        const activeTabBtn = document.getElementById(`tab-btn-${closestCol}`);
        if (activeTabBtn && tabsContainerRef.current) {
          const tabsContainer = tabsContainerRef.current;
          const btnLeft = activeTabBtn.offsetLeft;
          const btnWidth = activeTabBtn.offsetWidth;
          const containerWidth = tabsContainer.offsetWidth;
          
          tabsContainer.scrollTo({
            left: btnLeft - (containerWidth / 2) + (btnWidth / 2),
            behavior: 'smooth'
          });
        }
      }
    };

    container.addEventListener('scroll', handleScrollSpy);
    return () => container.removeEventListener('scroll', handleScrollSpy);
  }, [isDraggingScroll]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't trigger if clicking on a card (let dnd handle that)
    if ((e.target as HTMLElement).closest('.kanban-card')) return;
    
    setIsDraggingScroll(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleTabsMouseDown = (e: React.MouseEvent) => {
    setIsDraggingTabs(true);
    setTabsStartX(e.pageX - (tabsContainerRef.current?.offsetLeft || 0));
    setTabsScrollLeft(tabsContainerRef.current?.scrollLeft || 0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't trigger if touching a card
    if ((e.target as HTMLElement).closest('.kanban-card')) return;
    
    setIsDraggingScroll(true);
    setStartX(e.touches[0].pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleTabsTouchStart = (e: React.TouchEvent) => {
    setIsDraggingTabs(true);
    setTabsStartX(e.touches[0].pageX - (tabsContainerRef.current?.offsetLeft || 0));
    setTabsScrollLeft(tabsContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => {
    setIsDraggingScroll(false);
    setIsDraggingTabs(false);
  };

  const handleMouseUp = () => {
    setIsDraggingScroll(false);
    setIsDraggingTabs(false);
  };

  const handleTouchEnd = () => {
    setIsDraggingScroll(false);
    setIsDraggingTabs(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingScroll) {
      e.preventDefault();
      const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
      const walk = (x - startX) * 1.5;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
      }
    }
    if (isDraggingTabs) {
      e.preventDefault();
      const x = e.pageX - (tabsContainerRef.current?.offsetLeft || 0);
      const walk = (x - tabsStartX) * 1.5;
      if (tabsContainerRef.current) {
        tabsContainerRef.current.scrollLeft = tabsScrollLeft - walk;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingScroll) {
      const x = e.touches[0].pageX - (scrollContainerRef.current?.offsetLeft || 0);
      const walk = (x - startX) * 1.5;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
      }
    }
    if (isDraggingTabs) {
      const x = e.touches[0].pageX - (tabsContainerRef.current?.offsetLeft || 0);
      const walk = (x - tabsStartX) * 1.5;
      if (tabsContainerRef.current) {
        tabsContainerRef.current.scrollLeft = tabsScrollLeft - walk;
      }
    }
  };

  const scrollToColumn = (colName: string) => {
    setActiveTab(colName);
    const columnElement = document.getElementById(`column-${colName}`);
    if (columnElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const colLeft = columnElement.offsetLeft;
      container.scrollTo({
        left: colLeft - 16, // Padding adjustment
        behavior: 'smooth'
      });
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const client = (clients || []).find(c => c.id === draggableId);
    if (client) {
      updateClient({
        ...client,
        status: destination.droppableId as Client['status']
      });
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
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-8 shrink-0">
        <div className="flex items-center gap-3">
          <LayoutGrid className="text-primary" size={28} />
          <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-wide">
            {workspaceType === 'law_firm' ? 'Processos' : workspaceType === 'barbershop' ? 'Clientes' : 'Kanban'}
          </h2>
        </div>
        
        <div className="relative w-full md:w-72">
          <CircleDashed className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" size={16} />
          <input 
            type="text" 
            placeholder="Filtrar cards..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-card border border-border-color rounded-lg pl-10 pr-4 py-2 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div 
        ref={tabsContainerRef}
        onMouseDown={handleTabsMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTabsTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`md:hidden flex overflow-x-auto gap-2 mb-4 pb-2 shrink-0 hide-scrollbar select-none cursor-${isDraggingTabs ? 'grabbing' : 'default'}`}
      >
        {(stages || []).map(col => (
          <button
            key={col.id}
            id={`tab-btn-${col.name}`}
            onClick={() => scrollToColumn(col.name)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              activeTab === col.name 
                ? 'bg-primary/10 text-primary border-primary/50 scale-105' 
                : 'bg-bg-sidebar text-text-sec border-border-color'
            }`}
          >
            {col.name} ({filteredClients.filter(c => c.status === col.name).length})
          </button>
        ))}
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`flex-1 overflow-x-auto overflow-y-auto md:overflow-y-hidden pb-4 min-h-[500px] select-none cursor-${isDraggingScroll ? 'grabbing' : 'default'}`}
        >
          <div className="flex flex-row gap-4 md:gap-6 min-w-full md:min-w-max h-full px-1">
            {stages.map(col => {
              const Icon = iconMap[col.name] || Tag;
              const colClients = filteredClients.filter(c => c.status === col.name);
              
              return (
                <Droppable droppableId={col.name} key={col.id}>
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      id={`column-${col.name}`}
                      className="flex w-[85vw] max-w-[320px] md:w-80 shrink-0 flex-col bg-bg-sidebar rounded-xl border border-border-color overflow-hidden md:max-h-full h-full"
                    >
                      <div className="p-4 border-b border-border-color flex justify-between items-center shrink-0 bg-bg-main">
                        <h3 className="font-medium text-text-main flex items-center gap-2 text-sm uppercase tracking-wider">
                          <Icon size={16} className="text-primary" />
                          {col.name}
                        </h3>
                        <span className="text-primary font-semibold text-xs px-2 py-1 rounded bg-primary/10 border border-primary/20">
                          {colClients.length}
                        </span>
                      </div>
                      
                      <div className="p-3 flex-1 overflow-y-auto space-y-3">
                        {colClients.map((client, index) => (
                          <React.Fragment key={client.id}>
                            <Draggable draggableId={client.id} index={index}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => onSelectClient?.(client)}
                                  className={`kanban-card bg-bg-card p-4 rounded-lg border transition-all cursor-pointer ${
                                    snapshot.isDragging ? 'border-primary shadow-2xl scale-105 z-50' : 'border-border-color hover:border-primary/50'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-text-main truncate pr-2">{client.name || 'Sem Nome'}</h4>
                                    <span className="text-xs font-bold text-secondary whitespace-nowrap">
                                      R$ {(Number(client.value) || 0).toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="px-1.5 py-0.5 bg-bg-main border border-border-color text-text-sec rounded text-[10px] uppercase tracking-wider">
                                      {client.source}
                                    </span>
                                    <div className="flex -space-x-1">
                                      {[1, 2, 3].map(i => (
                                        <div key={i} className="w-4 h-4 rounded-full border border-bg-card bg-border-color flex items-center justify-center text-[8px] text-text-sec">
                                          U
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedClientForWA(client);
                                        }}
                                        className="p-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-md border border-[#25D366]/20 transition-colors"
                                      >
                                        <MessageCircle size={14} />
                                      </button>
                                      <button className="p-1.5 bg-border-color hover:bg-hover-color/20 text-text-sec rounded-md border border-border-color transition-colors">
                                        <FileText size={14} />
                                      </button>
                                    </div>
                                    <div className="text-[10px] text-text-sec uppercase tracking-tighter">
                                      {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          </React.Fragment>
                        ))}
                        {provided.placeholder}
                        {colClients.length === 0 && (
                          <div className="text-center p-8 border-2 border-dashed border-border-color rounded-lg text-text-sec text-xs italic">
                            Sem leads nesta etapa
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

      {selectedClientForWA && (
        <WhatsAppWindow 
          client={selectedClientForWA} 
          onClose={() => setSelectedClientForWA(null)} 
        />
      )}

      <div className="mt-auto pt-4 shrink-0">
        <MockupGenerator 
          pageName="Kanban Board" 
          promptDescription="Features 5 columns: Novo Lead, Em Contato, Proposta Enviada, Fechado, Perdido." 
        />
      </div>
    </div>
  );
}
