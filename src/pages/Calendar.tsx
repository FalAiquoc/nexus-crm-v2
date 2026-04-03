import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Phone,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  FileText
} from 'lucide-react';
import { Appointment, Client } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';

export function Calendar() {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    client_id: '',
    title: '',
    start_date: '',
    start_time: '09:00',
    end_time: '10:00',
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchClients();
  }, []);

  const handleGoogleSync = () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    
    // Simulating Google OAuth and Sync
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus('success');
      fetchAppointments(); // Refresh data
      
      // Reset status after a few seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
    }, 2500);
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('nexus_token');
      const res = await fetch('/api/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('nexus_token');
      const res = await fetch('/api/leads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const calendarDays = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-24 md:h-32 border border-border-color bg-bg-main/10"></div>);
    }

    // Days of current month
    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayAppointments = appointments.filter(a => a.start_time.startsWith(dateStr));
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      calendarDays.push(
        <div key={d} className={`h-24 md:h-32 border border-border-color p-1 md:p-2 hover:bg-bg-card transition-colors relative ${isToday ? 'bg-primary/5' : ''}`}>
          <span className={`text-sm font-medium ${isToday ? 'text-primary bg-primary/10 px-2 py-0.5 rounded-full' : 'text-text-sec'}`}>{d}</span>
          <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-1.5rem)]">
            {dayAppointments.map(app => (
              <div key={app.id} className="text-[10px] md:text-xs p-1 rounded bg-primary/20 text-secondary truncate border border-primary/30">
                {new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {app.client_name}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return calendarDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight italic serif">Agenda de Atendimentos</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-text-sec">Gerencie seus horários e compromissos com os clientes.</p>
            <div className="h-4 w-px bg-border-color mx-1 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Google Calendar Conectado
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGoogleSync}
            disabled={isSyncing}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all border ${
              syncStatus === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-bg-card border-border-color text-text-main hover:bg-border-color'
            }`}
          >
            {isSyncing ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : syncStatus === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <RefreshCw size={18} />
            )}
            <span className="hidden sm:inline">
              {isSyncing ? 'Sincronizando...' : syncStatus === 'success' ? 'Sincronizado' : 'Sincronizar Google'}
            </span>
          </button>
          
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-bg-main px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            Novo Agendamento
          </button>
        </div>
      </div>

      <div className="bg-bg-sidebar rounded-2xl border border-border-color overflow-hidden shadow-2xl">
        <div className="p-4 md:p-6 border-bottom border-border-color flex items-center justify-between bg-bg-main/20">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-text-main min-w-[150px]">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-2 hover:bg-bg-card rounded-lg text-text-sec transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-bg-card rounded-lg text-text-sec transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            <button className="px-4 py-1.5 rounded-lg bg-primary text-bg-main text-sm font-medium">Mês</button>
            <button className="px-4 py-1.5 rounded-lg hover:bg-bg-card text-text-sec text-sm font-medium transition-colors">Semana</button>
            <button className="px-4 py-1.5 rounded-lg hover:bg-bg-card text-text-sec text-sm font-medium transition-colors">Dia</button>
          </div>
        </div>

        <div className="grid grid-cols-7 bg-bg-main/40 border-b border-border-color">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-text-sec uppercase tracking-widest">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {isLoading ? (
            <div className="col-span-7 h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : renderCalendar()}
        </div>
      </div>

      {/* Próximos Compromissos (Lista) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-sidebar rounded-2xl border border-border-color p-6">
          <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Próximos Atendimentos
          </h3>
          <div className="space-y-4">
            {appointments.slice(0, 5).map(app => (
              <div key={app.id} className="flex items-center justify-between p-4 rounded-xl bg-bg-card border border-border-color hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {app.client_name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-text-main group-hover:text-primary transition-colors">{app.client_name}</h4>
                    <div className="flex items-center gap-3 text-xs text-text-sec mt-1">
                      <span className="flex items-center gap-1"><CalendarIcon size={12} /> {new Date(app.start_time).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    app.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-500' :
                    app.status === 'Cancelado' ? 'bg-red-500/10 text-red-500' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="text-center py-8 text-text-sec">Nenhum agendamento encontrado.</div>
            )}
          </div>
        </div>

        <div className="bg-bg-sidebar rounded-2xl border border-border-color p-6">
          <h3 className="text-lg font-semibold text-text-main mb-4">Resumo da Semana</h3>
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-text-sec">Total de Atendimentos</p>
              <p className="text-3xl font-bold text-primary mt-1">{appointments.length}</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-text-sec uppercase tracking-widest">Status dos Agendamentos</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-sec">Confirmados</span>
                <span className="text-text-main font-medium">{appointments.filter(a => a.status === 'Confirmado').length}</span>
              </div>
              <div className="w-full bg-bg-card h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: '65%' }}></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-sec">Pendentes</span>
                <span className="text-text-main font-medium">{appointments.filter(a => a.status === 'Agendado').length}</span>
              </div>
              <div className="w-full bg-bg-card h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500/50 h-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Novo Agendamento (BUG-003 fix) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-bg-sidebar w-full max-w-lg rounded-2xl border border-border-color shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-color flex items-center justify-between bg-bg-main/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <CalendarIcon size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-main">Novo Agendamento</h2>
                    <p className="text-xs text-text-sec">Agende um atendimento com um cliente.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-bg-card rounded-xl text-text-sec hover:text-text-main transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> Cliente
                  </label>
                  <select
                    value={newAppointment.client_id}
                    onChange={(e) => setNewAppointment({...newAppointment, client_id: e.target.value})}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all appearance-none"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} /> Título
                  </label>
                  <input
                    type="text"
                    value={newAppointment.title}
                    onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                    placeholder="Ex: Reunião inicial, Consulta..."
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest flex items-center gap-2">
                    <CalendarIcon size={14} /> Data
                  </label>
                  <input
                    type="date"
                    value={newAppointment.start_date}
                    onChange={(e) => setNewAppointment({...newAppointment, start_date: e.target.value})}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} /> Hora Início
                    </label>
                    <input
                      type="time"
                      value={newAppointment.start_time}
                      onChange={(e) => setNewAppointment({...newAppointment, start_time: e.target.value})}
                      className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} /> Hora Fim
                    </label>
                    <input
                      type="time"
                      value={newAppointment.end_time}
                      onChange={(e) => setNewAppointment({...newAppointment, end_time: e.target.value})}
                      className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest">Observações</label>
                  <textarea
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                    placeholder="Detalhes adicionais..."
                    rows={3}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-bg-main/20 border-t border-border-color flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-border-color text-text-main rounded-xl font-bold hover:bg-bg-main transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    if (!newAppointment.client_id || !newAppointment.title || !newAppointment.start_date) {
                      showToast('Preencha cliente, título e data', 'error');
                      return;
                    }
                    setIsSavingAppointment(true);
                    try {
                      const token = localStorage.getItem('nexus_token');
                      const startISO = `${newAppointment.start_date}T${newAppointment.start_time}:00`;
                      const endISO = `${newAppointment.start_date}T${newAppointment.end_time}:00`;
                      const res = await fetch('/api/appointments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                          client_id: newAppointment.client_id,
                          title: newAppointment.title,
                          start_time: startISO,
                          end_time: endISO,
                          notes: newAppointment.notes
                        })
                      });
                      if (res.ok) {
                        showToast('Agendamento criado com sucesso!', 'success');
                        fetchAppointments();
                        setShowModal(false);
                        setNewAppointment({ client_id: '', title: '', start_date: '', start_time: '09:00', end_time: '10:00', notes: '' });
                      } else {
                        showToast('Erro ao criar agendamento', 'error');
                      }
                    } catch (err) {
                      showToast('Erro de conexão', 'error');
                    } finally {
                      setIsSavingAppointment(false);
                    }
                  }}
                  disabled={isSavingAppointment}
                  className="flex-1 py-3 bg-primary text-bg-main rounded-xl font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSavingAppointment ? 'Salvando...' : 'Agendar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
