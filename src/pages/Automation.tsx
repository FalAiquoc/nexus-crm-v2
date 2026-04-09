import React, { useState, useEffect } from 'react';
import { Zap, Plus, Play, Pause, Edit2, Trash2, Search, Filter, ArrowRight, MousePointer2, Mail, Tag, Bell, MessageCircle, X, Check, Sparkles, Loader2, Calendar, FileText, Clock, User, ArrowDown, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Workflow } from '../types';
import * as Icons from 'lucide-react';

type StepType = 'trigger' | 'action' | 'condition' | 'delay' | string;

interface WorkflowStep {
  id: string;
  type: StepType;
  title: string;
  description: string;
  icon: string;
  targetWorkflowId?: string; // For workflow chains
}
const defaultTemplates = [
  {
    id: 't1',
    name: 'Boas-vindas WhatsApp',
    prompt: 'Quando um novo lead entrar, envie uma mensagem de boas-vindas no WhatsApp.',
    steps: [
      { id: 's1', type: 'trigger', title: 'Novo Lead', description: 'Quando um lead for criado no sistema', icon: 'user' },
      { id: 's2', type: 'action', title: 'Enviar WhatsApp', description: 'Mensagem de boas-vindas inicial', icon: 'message-circle' }
    ]
  },
  {
    id: 't2',
    name: 'Cobrança de Assinatura',
    prompt: 'Quando uma assinatura vencer, espere 1 dia e envie um lembrete de cobrança.',
    steps: [
      { id: 's1', type: 'trigger', title: 'Assinatura Vencida', description: 'Quando o status da assinatura mudar para vencida', icon: 'file-text' },
      { id: 's2', type: 'delay', title: 'Esperar 1 dia', description: 'Aguardar 24 horas antes de cobrar', icon: 'clock' },
      { id: 's3', type: 'action', title: 'Enviar Lembrete', description: 'Mensagem de cobrança via WhatsApp', icon: 'message-circle' }
    ]
  },
  {
    id: 't3',
    name: 'Reunião Agendada',
    prompt: 'Quando uma reunião for agendada, notifique a equipe e envie confirmação ao cliente.',
    steps: [
      { id: 's1', type: 'trigger', title: 'Novo Agendamento', description: 'Quando um evento for criado no calendário', icon: 'calendar' },
      { id: 's2', type: 'action', title: 'Notificar Equipe', description: 'Aviso interno no sistema', icon: 'bell' },
      { id: 's3', type: 'action', title: 'Confirmar Cliente', description: 'E-mail de confirmação com detalhes', icon: 'mail' }
    ]
  }
];

const IconComponent = ({ name, ...props }: { name: string, [key: string]: any }) => {
  const pascalName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  const Icon = (Icons as any)[pascalName] || Icons.Zap;
  return <Icon {...props} />;
};

export function Automation() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState(defaultTemplates);
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isGlobalCreatorOpen, setIsGlobalCreatorOpen] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  
  // Global Creator state
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [isGlobalGenerating, setIsGlobalGenerating] = useState(false);

  // Builder state
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSteps, setGeneratedSteps] = useState<WorkflowStep[]>([]);
  const [workflowName, setWorkflowName] = useState('');

  // Step editing state
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);

  // Load workflows from API
  useEffect(() => {
    fetchWorkflows();
    
    const savedTemplates = localStorage.getItem('doboy_user_templates');
    if (savedTemplates) {
      setTemplates([...defaultTemplates, ...JSON.parse(savedTemplates)]);
    }
  }, []);

  // Debounce logic for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchWorkflows = async () => {
    const token = localStorage.getItem('doboy_token');
    try {
      const res = await fetch('/api/automation', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      }
    } catch (err) {
      console.error("Erro ao carregar automações:", err);
    }
  };

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const openBuilder = (workflow?: Workflow) => {
    if (workflow) {
      setEditingWorkflowId(workflow.id);
      setWorkflowName(workflow.name);
      setGeneratedSteps(workflow.steps as WorkflowStep[] || []);
      setPrompt('');
    } else {
      setEditingWorkflowId(null);
      setWorkflowName('');
      setGeneratedSteps([]);
      setPrompt('');
    }
    setIsBuilderOpen(true);
  };

  const generateMultipleWorkflows = async () => {
    if (!globalPrompt.trim()) return;
    
    setIsGlobalGenerating(true);
    const token = localStorage.getItem('doboy_token');
    
    try {
      const response = await fetch('/api/automation/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: globalPrompt, globalMode: true })
      });
      
      if (!response.ok) throw new Error("Falha na geração");
      
      const generatedWorkflows = await response.json();
      
      // Save each generated workflow to backend
      for (const gw of generatedWorkflows) {
        const steps = gw.steps.map((s: any, i: number) => ({ ...s, id: `step-${i}` }));
        await fetch('/api/automation', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: gw.name,
            trigger_name: steps[0]?.title || 'Gatilho',
            steps: steps,
            status: 'active'
          })
        });
      }

      await fetchWorkflows(); // Refresh list
      setIsGlobalCreatorOpen(false);
      setGlobalPrompt('');
      
    } catch (error) {
      console.error("Erro ao gerar múltiplos fluxos:", error);
    } finally {
      setIsGlobalGenerating(false);
    }
  };

  const generateWorkflow = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    const token = localStorage.getItem('doboy_token');

    try {
      const response = await fetch('/api/automation/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, currentSteps: generatedSteps, globalMode: false })
      });
      
      if (!response.ok) throw new Error("Falha na geração");
      const steps = await response.json();
      setGeneratedSteps(steps.map((s: any, i: number) => ({ ...s, id: s.id || `step-${i}` })));
    } catch (error) {
      console.error("Erro ao refinar fluxo:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyTemplate = (template: typeof templates[0]) => {
    setPrompt(template.prompt);
    setWorkflowName(template.name);
    setGeneratedSteps(template.steps as WorkflowStep[]);
  };

  const handleSaveWorkflow = async () => {
    if (generatedSteps.length === 0) return;

    const finalName = workflowName || 'Nova Automação';
    const token = localStorage.getItem('doboy_token');
    
    try {
      if (editingWorkflowId) {
        await fetch(`/api/automation/${editingWorkflowId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: finalName,
            trigger_name: generatedSteps[0]?.title || 'Gatilho',
            steps: generatedSteps,
            status: workflows.find(w => w.id === editingWorkflowId)?.status || 'active'
          })
        });
      } else {
        await fetch('/api/automation', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: finalName,
            trigger_name: generatedSteps[0]?.title || 'Gatilho',
            steps: generatedSteps,
            status: 'active'
          })
        });
      }

      await fetchWorkflows();
      setIsBuilderOpen(false);
      setPrompt('');
      setGeneratedSteps([]);
      setWorkflowName('');
      setEditingWorkflowId(null);
    } catch (err) {
      console.error("Erro ao salvar fluxo:", err);
    }
  };

  const toggleStatus = async (workflow: Workflow) => {
    const token = localStorage.getItem('doboy_token');
    const newStatus = workflow.status === 'active' ? 'paused' : 'active';
    try {
      await fetch(`/api/automation/${workflow.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...workflow,
          trigger_name: workflow.trigger,
          status: newStatus
        })
      });
      await fetchWorkflows();
    } catch (err) {
      console.error("Erro ao alternar status:", err);
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;
    
    const token = localStorage.getItem('doboy_token');
    try {
      await fetch(`/api/automation/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchWorkflows();
    } catch (err) {
      console.error("Erro ao excluir fluxo:", err);
    }
  };

  const handleEditStep = (index: number) => {
    setSelectedStepIndex(index);
    setEditingStep({ ...generatedSteps[index] });
    setIsStepModalOpen(true);
  };

  const handleSaveStep = () => {
    if (selectedStepIndex !== null && editingStep) {
      const newSteps = [...generatedSteps];
      newSteps[selectedStepIndex] = editingStep;
      setGeneratedSteps(newSteps);
      setIsStepModalOpen(false);
    }
  };

  const handleDeleteStep = (index: number) => {
    const newSteps = [...generatedSteps];
    newSteps.splice(index, 1);
    setGeneratedSteps(newSteps);
    setIsStepModalOpen(false);
  };

  const handleAddStep = (index: number) => {
    const newStep: WorkflowStep = {
      id: `step-${Math.random().toString(36).substr(2, 9)}`,
      type: 'action',
      title: 'Nova Ação',
      description: 'Configure esta nova ação',
      icon: 'zap'
    };
    const newSteps = [...generatedSteps];
    newSteps.splice(index, 0, newStep);
    setGeneratedSteps(newSteps);
    
    setSelectedStepIndex(index);
    setEditingStep(newStep);
    setIsStepModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Zap className="text-primary" size={28} />
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Automação</h1>
            <p className="text-text-sec mt-1">Crie regras de negócio com o poder da Inteligência Artificial.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsGlobalCreatorOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary/10 border border-primary/20 rounded-xl text-primary font-bold hover:bg-primary/20 transition-all shadow-sm group"
          >
            <Sparkles size={20} className="group-hover:animate-pulse" />
            Criar com IA
          </button>
          <button 
            onClick={() => openBuilder()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary rounded-xl text-bg-main font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/10 group"
          >
            <Plus size={20} />
            Novo Fluxo
          </button>
        </div>

      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Regras Ativas', value: workflows.filter(w => w.status === 'active').length, icon: Play, color: 'text-emerald-500' },
          { label: 'Execuções (24h)', value: '124', icon: Zap, color: 'text-primary' },
          { label: 'Horas Economizadas', value: '14h', icon: Bell, color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-bg-sidebar p-6 rounded-2xl border border-border-color flex items-center gap-4">
            <div className={`p-3 bg-bg-main rounded-xl border border-border-color ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-text-sec text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-text-main">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & List */}
      <div className="bg-bg-sidebar rounded-2xl border border-border-color overflow-hidden">
        <div className="p-6 border-b border-border-color flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-main/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" size={18} />
            <input 
              type="text" 
              placeholder="Buscar regras..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-main border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-color bg-bg-main/30">
                <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Nome da Regra</th>
                <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Gatilho</th>
                <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Última Execução</th>
                <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-sec">
                    Nenhuma regra encontrada.
                  </td>
                </tr>
              ) : (
                filteredWorkflows.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-bg-card transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <Zap size={20} />
                        </div>
                        <span className="font-medium text-text-main group-hover:text-primary transition-colors">{workflow.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-text-sec">
                      <div className="flex items-center gap-2">
                        <MousePointer2 size={14} className="text-primary" />
                        {workflow.trigger}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <button 
                        onClick={() => toggleStatus(workflow)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          workflow.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          workflow.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                        }`} />
                        {workflow.status === 'active' ? 'Ativo' : 'Pausado'}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-sm text-text-sec">
                      {workflow.last_run || '-'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openBuilder(workflow)}
                          className="p-2 hover:bg-bg-card rounded-lg text-text-sec hover:text-primary transition-all"
                          title="Editar regra"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteWorkflow(workflow.id)}
                          className="p-2 hover:bg-bg-card rounded-lg text-text-sec hover:text-rose-500 transition-all"
                          title="Excluir regra"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global AI Creator Modal */}
      <AnimatePresence>
        {isGlobalCreatorOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-bg-sidebar border border-border-color rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-border-color bg-bg-main/30 relative">
                <button 
                  onClick={() => setIsGlobalCreatorOpen(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-bg-main rounded-xl transition-colors text-text-sec"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-text-main">Criar com IA</h2>
                    <p className="text-text-sec">Descreva o que você quer automatizar e a IA criará todos os fluxos necessários.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest">O que você deseja automatizar?</label>
                  <textarea 
                    value={globalPrompt}
                    onChange={(e) => setGlobalPrompt(e.target.value)}
                    placeholder="Ex: Crie um sistema completo de vendas que envia boas-vindas, faz follow-up após 2 dias e se o cliente não responder, chama um fluxo de recuperação de leads."
                    className="w-full bg-bg-main border border-border-color rounded-2xl p-5 text-text-main focus:outline-none focus:border-primary transition-all min-h-[150px] resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <Zap size={20} />
                  </div>
                  <p className="text-xs text-text-sec leading-relaxed">
                    <span className="text-primary font-bold">Dica:</span> Você pode pedir automações complexas que envolvam múltiplos passos e conexões entre diferentes fluxos.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    onClick={() => setIsGlobalCreatorOpen(false)}
                    className="flex-1 px-6 py-4 border border-border-color rounded-2xl text-text-main font-bold hover:bg-bg-main transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={generateMultipleWorkflows}
                    disabled={isGlobalGenerating || !globalPrompt.trim()}
                    className="flex-[2] px-6 py-4 bg-primary rounded-2xl text-bg-main font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGlobalGenerating ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Analisando e Criando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Gerar Automações</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Builder Modal */}
      <AnimatePresence>
        {isBuilderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-bg-main border border-border-color rounded-2xl shadow-2xl w-full max-w-5xl h-[95vh] md:h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 md:p-6 border-b border-border-color flex items-center justify-between bg-bg-sidebar">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary hidden sm:block">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-text-main">
                      {editingWorkflowId ? 'Editar Automação' : 'Construtor por IA'}
                    </h2>
                    <p className="text-xs md:text-sm text-text-sec hidden sm:block">
                      {editingWorkflowId ? 'Ajuste os passos do seu fluxo.' : 'Descreva o que você quer e a IA monta.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSaveWorkflow}
                    disabled={generatedSteps.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-bg-main rounded-xl font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
                  >
                    <Save size={18} />
                    <span>Salvar Fluxo</span>
                  </button>
                  <button 
                    onClick={() => setIsBuilderOpen(false)}
                    className="p-2 text-text-sec hover:text-text-main hover:bg-bg-card rounded-xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Body - Split View */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                
                {/* Left Panel - Prompt & Templates */}
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border-color bg-bg-sidebar p-4 md:p-6 flex flex-col gap-4 md:gap-6 overflow-y-auto">
                  
                  {/* Prompt Input */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-text-main">
                      {editingWorkflowId ? 'Refinar com IA' : 'Descreva a automação'}
                    </label>
                    <div className="relative">
                      <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: Enviar e-mail após 1 hora."
                        className="w-full h-24 md:h-32 bg-bg-main border border-border-color rounded-xl p-4 text-text-main placeholder-text-sec/50 focus:outline-none focus:border-primary transition-colors resize-none text-sm"
                      />
                      <button 
                        onClick={generateWorkflow}
                        disabled={isGenerating || !prompt.trim()}
                        className="absolute bottom-3 right-3 p-2 bg-primary text-bg-main rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Templates */}
                  <div className="space-y-3 hidden md:block">
                    <label className="block text-xs font-bold text-text-sec uppercase tracking-wider flex items-center justify-between">
                      Templates e Atalhos
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Auto-Aprendizado Ativo</span>
                    </label>
                    <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className={`text-left p-3 rounded-xl border transition-all group relative ${
                            template.id.startsWith('ut-') 
                              ? 'border-primary/30 bg-primary/5 hover:bg-primary/10' 
                              : 'border-border-color bg-bg-main hover:border-primary hover:bg-primary/5'
                          }`}
                        >
                          {template.id.startsWith('ut-') && (
                            <div className="absolute top-2 right-2">
                              <Sparkles size={12} className="text-primary animate-pulse" />
                            </div>
                          )}
                          <h4 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{template.name}</h4>
                          <p className="text-xs text-text-sec mt-1 line-clamp-1">{template.prompt}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Templates Horizontal Scroll */}
                  <div className="md:hidden space-y-2">
                    <label className="block text-xs font-bold text-text-sec uppercase tracking-wider">Templates</label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className="flex-shrink-0 w-48 text-left p-3 rounded-xl border border-border-color bg-bg-main hover:border-primary transition-all"
                        >
                          <h4 className="text-xs font-bold text-text-main truncate">{template.name}</h4>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Panel - Diagram Canvas */}
                <div className="w-full md:w-2/3 bg-bg-main relative flex flex-col overflow-hidden">
                  
                  {/* Canvas Header */}
                  <div className="p-4 border-b border-border-color flex items-center justify-between bg-bg-main/80 backdrop-blur-sm z-10">
                    <input 
                      type="text"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      placeholder="Nome..."
                      className="bg-transparent border-none text-base md:text-lg font-bold text-text-main focus:outline-none focus:ring-0 placeholder-text-sec/30 w-1/2"
                    />
                    <button 
                      onClick={handleSaveWorkflow}
                      disabled={generatedSteps.length === 0}
                      className="px-3 py-1.5 md:px-4 md:py-2 bg-primary text-bg-main font-bold rounded-xl hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                    >
                      <Check size={16} />
                      <span className="hidden sm:inline">{editingWorkflowId ? 'Atualizar' : 'Salvar'}</span>
                    </button>
                  </div>

                  {/* Diagram Area */}
                  <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
                    {isGenerating ? (
                      <div className="flex flex-col items-center justify-center h-full text-text-sec gap-4 text-center">
                        <Loader2 size={40} className="animate-spin text-primary" />
                        <p className="animate-pulse">A IA está desenhando o seu fluxo...</p>
                      </div>
                    ) : generatedSteps.length > 0 ? (
                      <div className="relative flex flex-col items-center w-full max-w-md">
                        {generatedSteps.map((step, index) => (
                          <React.Fragment key={step.id}>
                            {/* Connecting Arrow */}
                            {index > 0 && (
                              <div className="flex flex-col items-center my-2 relative group">
                                <div className="w-0.5 h-8 bg-border-color group-hover:bg-primary transition-colors" />
                                <button 
                                  onClick={() => handleAddStep(index)}
                                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-bg-main border border-border-color rounded-full flex items-center justify-center text-text-sec hover:text-primary hover:border-primary transition-all opacity-0 group-hover:opacity-100 z-10"
                                  title="Adicionar passo aqui"
                                >
                                  <Plus size={14} />
                                </button>
                                <ArrowDown size={16} className="text-border-color -mt-1 group-hover:text-primary transition-colors" />
                              </div>
                            )}
                            
                            {/* Node Card */}
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              onClick={() => handleEditStep(index)}
                              className={`w-full bg-bg-sidebar border rounded-2xl p-5 flex items-start gap-4 hover:border-primary transition-colors cursor-pointer group shadow-lg ${
                                !['trigger', 'action', 'condition', 'delay'].includes(step.type) ? 'border-primary/40 bg-primary/5' : 'border-border-color'
                              }`}
                            >
                              <div className={`p-3 rounded-xl flex-shrink-0 ${
                                step.type === 'trigger' ? 'bg-emerald-500/10 text-emerald-500' :
                                step.type === 'delay' ? 'bg-amber-500/10 text-amber-500' :
                                step.type === 'condition' ? 'bg-purple-500/10 text-purple-500' :
                                step.type === 'chain' ? 'bg-blue-500/10 text-blue-500' :
                                !['trigger', 'action', 'condition', 'delay', 'chain'].includes(step.type) ? 'bg-primary/20 text-primary animate-pulse' :
                                'bg-primary/10 text-primary'
                              }`}>
                                <IconComponent name={step.icon} size={24} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-sec flex items-center gap-1">
                                    {step.type === 'trigger' ? 'Gatilho' : step.type === 'delay' ? 'Espera' : step.type === 'condition' ? 'Condição' : step.type === 'chain' ? 'Cadeia de Fluxo' : 'Ação'}
                                    {!['trigger', 'action', 'condition', 'delay', 'chain'].includes(step.type) && (
                                      <span className="bg-primary text-bg-main px-1 rounded text-[8px]">Novo Tipo</span>
                                    )}
                                  </span>
                                  <Edit2 size={14} className="text-border-color group-hover:text-primary transition-colors" />
                                </div>
                                <h4 className="text-text-main font-bold text-base">{step.title}</h4>
                                <p className="text-text-sec text-sm mt-1 leading-relaxed">{step.description}</p>
                                {step.type === 'chain' && step.targetWorkflowId && (
                                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-blue-500 bg-blue-500/5 py-1 px-2 rounded-lg border border-blue-500/10 w-fit">
                                    <ArrowRight size={10} />
                                    <span>Chama: {workflows.find(w => w.id === step.targetWorkflowId)?.name || 'Fluxo Externo'}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </React.Fragment>
                        ))}
                        
                        {/* End Node Indicator */}
                        <div className="flex flex-col items-center mt-2 relative group">
                          <div className="w-0.5 h-8 bg-border-color group-hover:bg-primary transition-colors" />
                          <button 
                            onClick={() => handleAddStep(generatedSteps.length)}
                            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-bg-main border border-border-color rounded-full flex items-center justify-center text-text-sec hover:text-primary hover:border-primary transition-all opacity-0 group-hover:opacity-100 z-10"
                            title="Adicionar passo final"
                          >
                            <Plus size={14} />
                          </button>
                          <div className="w-3 h-3 rounded-full bg-border-color mt-1 group-hover:bg-primary transition-colors" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-border-color gap-4 text-center max-w-sm">
                        <Sparkles size={48} className="opacity-20" />
                        <p>Descreva a automação que você deseja no painel ao lado ou escolha um template para começar.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Step Edit Modal */}
      <AnimatePresence>
        {isStepModalOpen && editingStep && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-bg-sidebar w-full max-w-md rounded-3xl border border-border-color shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-color flex items-center justify-between bg-bg-main/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-main">Editar Passo</h2>
                    <p className="text-xs text-text-sec">Configure os detalhes desta etapa.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsStepModalOpen(false)}
                  className="p-2 hover:bg-bg-main rounded-full text-text-sec transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-widest">Tipo</label>
                    <select 
                      value={editingStep.type}
                      onChange={(e) => setEditingStep({ ...editingStep, type: e.target.value as StepType })}
                      className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all appearance-none"
                    >
                      <option value="trigger">Gatilho (Trigger)</option>
                      <option value="action">Ação (Action)</option>
                      <option value="condition">Condição (Condition)</option>
                      <option value="delay">Espera (Delay)</option>
                      <option value="chain">Cadeia de Fluxo (Chain)</option>
                      {customTypes.map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)} (IA Aprendido)</option>
                      ))}
                    </select>
                  </div>

                  {editingStep.type === 'chain' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-sec uppercase tracking-widest">Fluxo Alvo</label>
                      <select 
                        value={editingStep.targetWorkflowId || ''}
                        onChange={(e) => setEditingStep({ ...editingStep, targetWorkflowId: e.target.value })}
                        className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all appearance-none"
                      >
                        <option value="">Selecionar Fluxo...</option>
                        {workflows.filter(w => w.id !== editingWorkflowId).map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest">Título</label>
                  <input 
                    type="text"
                    value={editingStep.title}
                    onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest">Descrição / Configuração</label>
                  <textarea 
                    value={editingStep.description}
                    onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })}
                    rows={3}
                    className="w-full bg-bg-main border border-border-color rounded-xl p-4 text-sm text-text-main focus:outline-none focus:border-primary transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest">Ícone (Nome)</label>
                  <input 
                    type="text"
                    value={editingStep.icon}
                    onChange={(e) => setEditingStep({ ...editingStep, icon: e.target.value })}
                    placeholder="ex: zap, mail, message-circle"
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="p-6 bg-bg-main/20 border-t border-border-color flex gap-3">
                <button 
                  onClick={() => handleDeleteStep(selectedStepIndex!)}
                  className="p-3 border border-border-color text-rose-500 rounded-xl hover:bg-rose-500/10 transition-all"
                  title="Excluir Passo"
                >
                  <Trash2 size={20} />
                </button>
                <div className="flex-1 flex gap-3">
                  <button 
                    onClick={() => setIsStepModalOpen(false)}
                    className="flex-1 py-3 border border-border-color text-text-main rounded-xl font-bold hover:bg-bg-main transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveStep}
                    className="flex-1 py-3 bg-primary text-bg-main rounded-xl font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
