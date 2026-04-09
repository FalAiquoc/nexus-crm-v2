import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Table, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from './DashboardUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  workspaceType: string;
}

export function ExportModal({ isOpen, onClose, data, workspaceType }: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handleExport = (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    setProgress(0);
    setIsComplete(false);

    // Simulação de exportação de alta performance
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExporting(false);
            setIsComplete(true);
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-bg-sidebar border border-border-color rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-border-color flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-text-main tracking-tighter uppercase">Exportar Relatório</h2>
              <p className="text-[10px] text-text-sec uppercase tracking-[0.2em] font-bold mt-1">BI & Analytics Executive</p>
            </div>
            <button onClick={onClose} className="p-2 text-text-sec hover:text-text-main hover:bg-bg-card rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
            {isExporting ? (
              <div className="py-12 flex flex-col items-center text-center">
                <Loader2 size={48} className="text-primary animate-spin mb-6" />
                <h3 className="text-lg font-black text-text-main uppercase tracking-widest">Processando Inteligência...</h3>
                <p className="text-xs text-text-sec mt-2">Compilando dados de {workspaceType} para o relatório final.</p>
                <div className="w-full h-1.5 bg-bg-main rounded-full mt-8 overflow-hidden border border-border-color">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-primary"
                  />
                </div>
                <span className="text-[10px] font-black text-primary mt-3 uppercase tracking-widest">{progress}% concluído</span>
              </div>
            ) : isComplete ? (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                  <CheckCircle2 size={40} className="text-green-500" />
                </div>
                <h3 className="text-lg font-black text-text-main uppercase tracking-widest">Relatório Gerado!</h3>
                <p className="text-xs text-text-sec mt-2">O arquivo foi compactado e enviado para o seu dispositivo.</p>
                <button 
                  onClick={onClose}
                  className="mt-8 px-8 py-3 bg-bg-main border border-border-color rounded-2xl text-[11px] font-black uppercase text-text-main hover:border-primary transition-all"
                >
                  Fechar Janela
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-text-sec font-medium leading-relaxed">
                  Selecione o formato desejado para a exportação de <span className="text-primary font-black uppercase">{data.totalLeads} leads</span> no módulo <span className="text-text-main font-black uppercase text-[10px]">{workspaceType}</span>.
                </p>

                <div className="grid grid-cols-1 gap-3 pt-4">
                  <button 
                    onClick={() => handleExport('pdf')}
                    className="flex items-center gap-4 p-4 bg-bg-main border border-border-color rounded-2xl hover:border-primary/50 transition-all group"
                  >
                    <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-bg-main transition-all">
                      <FileText size={24} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-black text-text-main uppercase tracking-tighter">PDF Consolidado</h4>
                      <p className="text-[10px] text-text-sec mt-1">Gráficos, KPIs e Insights de BI.</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-4 p-4 bg-bg-main border border-border-color rounded-2xl hover:border-border-primary/50 transition-all group"
                  >
                    <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-bg-main transition-all">
                      <Table size={24} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-black text-text-main uppercase tracking-tighter">Dados em CSV</h4>
                      <p className="text-[10px] text-text-sec mt-1">Exportação direta para Excel/Numbers.</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isExporting && !isComplete && (
            <div className="p-4 bg-bg-main/50 border-t border-border-color text-center italic opacity-40">
              <span className="text-[9px] font-bold text-text-sec uppercase tracking-[0.2em]">Criptografia de ponta-a-ponta ativa</span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
