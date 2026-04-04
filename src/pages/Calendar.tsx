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
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
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
      const token = localStorage.getItem('doboy_token');
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
      const token = localStorage.getItem('doboy_token');
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

  const prevPeriod = () => {
    if (view === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    else if (view === 'week') setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    else setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
  };
  
  const nextPeriod = () => {
    if (view === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    else if (view === 'week') setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    else setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const hours = Array.from({ length: 24 }, (_, i) => i); // 00:00 to 23:59

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const calendarDays = [];

    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-24 md:h-32 border border-border-color bg-bg-main/10"></div>);
    }

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

    return (
      <div className="grid grid-cols-7">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-text-sec uppercase tracking-widest bg-bg-main/40 border-b border-border-color">{day}</div>
        ))}
        {calendarDays}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    return (
      <div className="flex flex-col h-[600px] overflow-hidden bg-bg-sidebar rounded-xl">
        <div className="grid grid-cols-8 border-b border-border-color bg-bg-main/40">
          <div className="p-3 border-r border-border-color bg-bg-main/60"></div>
          {Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`p-3 text-center border-r border-border-color last:border-r-0 ${isToday ? 'bg-primary/10' : 'bg-bg-main/20'}`}>
                <p className="text-[10px] font-bold text-text-sec uppercase tracking-widest">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i]}</p>
                <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-text-main'}`}>{date.getDate()}</p>
              </div>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-bg-main/10">
          <div className="grid grid-cols-8 relative">
            {/* Time Axis */}
            <div className="flex flex-col border-r border-border-color bg-bg-main/40">
              {hours.map(h => (
                <div key={h} className="h-20 border-b border-border-color/50 p-2 text-right text-[10px] text-text-sec font-medium">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            {/* Days Columns */}
            {Array.from({ length: 7 }).map((_, i) => {
              const dayDate = new Date(startOfWeek);
              dayDate.setDate(startOfWeek.getDate() + i);
              const dateStr = dayDate.toISOString().split('T')[0];
              const dayApps = appointments.filter(a => a.start_time.startsWith(dateStr));
              
              return (
                <div key={i} className="flex flex-col border-r border-border-color last:border-r-0 relative group hover:bg-bg-main/20 transition-colors bg-bg-sidebar">
                  {hours.map(h => (
                    <div key={h} className="h-20 border-b border-border-color/20"></div>
                  ))}
                  {/* Appointment Overlays */}
                  {dayApps.map(app => {
                    const start = new Date(app.start_time);
                    const top = start.getHours() * 80 + (start.getMinutes() / 60) * 80;
                    const isDone = app.status === 'Concluído';
                    return (
                      <div 
                        key={app.id} 
                        style={{ top: `${top}px`, height: '70px' }}
                        className={`absolute left-1 right-1 rounded-lg p-2 border-l-4 text-[10px] overflow-hidden shadow-sm z-10 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer ${
                          isDone 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500/80 line-through opacity-70' 
                            : 'bg-primary/20 border-primary text-secondary'
                        }`}
                      >
                        <p className="font-bold">{app.client_name}</p>
                        <p>{app.title}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const isToday = currentDate.toDateString() === new Date().toDateString();
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayApps = appointments.filter(a => a.start_time.startsWith(dateStr));

    return (
      <div className="flex flex-col h-[600px] overflow-hidden">
        <div className="p-4 border-b border-border-color bg-bg-main/40 text-center">
          <p className="text-xs font-bold text-text-sec uppercase tracking-widest mb-1">
            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][currentDate.getDay()]}
          </p>
          <p className={`text-2xl font-bold ${isToday ? 'text-primary' : 'text-text-main'}`}>
            {currentDate.getDate()} de {monthNames[currentDate.getMonth()]}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative border-l border-border-color ml-16">
            {hours.map(h => (
              <div key={h} className="h-24 border-b border-border-color/30 flex items-start -ml-16">
                <span className="w-16 text-right pr-4 text-xs text-text-sec font-medium mt-1">{String(h).padStart(2, '0')}:00</span>
                <div className="flex-1"></div>
              </div>
            ))}
            {dayApps.map(app => {
              const start = new Date(app.start_time);
              const top = start.getHours() * 96 + (start.getMinutes() / 60) * 96;
              return (
                <div 
                  key={app.id} 
                  style={{ top: `${top}px` }}
                  className="absolute left-4 right-4 h-20 rounded-2xl p-4 bg-bg-card border border-border-color shadow-lg flex items-center gap-4 group hover:border-primary/50 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {app.client_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-text-main">{app.client_name}</h4>
                    <p className="text-xs text-text-sec">{app.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[10px] text-text-sec">{app.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
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
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all border border-border-color ${
              syncStatus === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-bg-card text-text-main hover:bg-border-color'
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
            className="flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-bg-main px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 border border-primary/20"
          >
            <Plus size={20} />
            Novo Agendamento
          </button>
        </div>
      </div>

      <div className="bg-bg-sidebar rounded-2xl border border-border-color overflow-hidden shadow-2xl">
        <div className="p-4 md:p-6 border-b border-border-color flex items-center justify-between bg-bg-main/20">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-text-main min-w-[200px]">
              {view === 'month' ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` : 
               view === 'week' ? `Semana ${Math.ceil(currentDate.getDate() / 7)} de ${monthNames[currentDate.getMonth()]}` :
               `${currentDate.getDate()} de ${monthNames[currentDate.getMonth()]}`}
            </h2>
            <div className="flex gap-1">
              <button onClick={prevPeriod} className="p-2 hover:bg-bg-card rounded-lg text-text-sec transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextPeriod} className="p-2 hover:bg-bg-card rounded-lg text-text-sec transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="hidden md:flex gap-1 bg-bg-main/50 p-1 rounded-xl border border-border-color">
            <button 
              onClick={() => setView('month')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'month' ? 'bg-primary text-bg-main shadow-lg shadow-primary/20' : 'text-text-sec hover:bg-bg-card'}`}
            >
              Mês
            </button>
            <button 
              onClick={() => setView('week')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'week' ? 'bg-primary text-bg-main shadow-lg shadow-primary/20' : 'text-text-sec hover:bg-bg-card'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setView('day')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'day' ? 'bg-primary text-bg-main shadow-lg shadow-primary/20' : 'text-text-sec hover:bg-bg-card'}`}
            >
              Dia
            </button>
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${view}-${currentDate.getTime()}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {view === 'month' && renderMonthView()}
                  {view === 'week' && renderWeekView()}
                  {view === 'day' && renderDayView()}
                </>
              )}
            </motion.div>
          </AnimatePresence>
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
                      const token = localStorage.getItem('doboy_token');
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
