import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Search, Edit2, Trash2, Mail, Shield, Key, Link as LinkIcon, CheckCircle2, X, Clock, Check, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'gestor' | 'vendedor' | 'cliente';
  plan?: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

export function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'requests'>('active');
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/requests', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` }
      });
      
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        setAccessRequests(data);
      } else {
        const text = await res.text();
        console.warn('⚠️ [USERS_API_WARNING] Resposta não-JSON:', text.substring(0, 100));
      }
    } catch (err) {
      console.error('🔥 [USERS_API_ERROR] Falha ao buscar solicitações:', err);
      showToast('Erro ao sincronizar solicitações.', 'error');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, []);
  
  const [newUser, setNewUser] = useState<Partial<UserData>>({
    name: '',
    email: '',
    role: 'cliente',
    plan: 'Basic',
    status: 'active'
  });

  const [generatedLink, setGeneratedLink] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveUser = async () => {
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexus_token')}`
        },
        body: JSON.stringify(newUser)
      });

      if (res.ok) {
        showToast(editingUser ? 'Usuário atualizado!' : 'Usuário criado com sucesso!', 'success');
        fetchUsers();
        setIsModalOpen(false);
        setNewUser({ name: '', email: '', role: 'cliente', plan: 'Basic', status: 'active' });
        setEditingUser(null);
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Erro ao salvar usuário', 'error');
      }
    } catch (err) {
      showToast('Erro crítico ao salvar usuário', 'error');
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setNewUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const res = await fetch(`/api/users/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` }
        });
        if (res.ok) {
          showToast('Usuário removido com sucesso', 'success');
          fetchUsers();
        } else {
          const errData = await res.json();
          showToast(errData.error || 'Erro ao excluir usuário', 'error');
        }
      } catch (err) {
        showToast('Erro ao excluir usuário', 'error');
      }
    }
  };

  const generateLink = () => {
    const link = `https://nexus-crm.app/signup?plan=${newUser.plan}&role=${newUser.role}&token=${Math.random().toString(36).substr(2, 9)}`;
    setGeneratedLink(link);
    setIsLinkModalOpen(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    showToast('Link copiado para a área de transferência!', 'info');
  };

  const handleApproveRequest = (request: any) => {
    setNewUser({
      name: request.name,
      email: request.email,
      role: 'cliente',
      plan: 'Basic',
      status: 'active'
    });
    setEditingUser(null);
    setIsModalOpen(true);
    // Nota: O request só é deletado após o salvamento bem-sucedido do usuário (em um cenário real)
    // aqui vamos deletar manualmente para o mock
    handleRejectRequest(request.id, false);
  };

  const handleRejectRequest = async (id: string, notify = true) => {
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token')}` }
      });
      if (res.ok) {
        setAccessRequests(accessRequests.filter(r => r.id !== id));
        if (notify) showToast('Solicitação removida.', 'info');
      }
    } catch (err) {
      showToast('Erro ao remover solicitação.', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UsersIcon className="text-primary" size={28} />
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Usuários e Clientes</h1>
            <p className="text-text-sec mt-1">Gerencie acessos, planos e convites do sistema.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setEditingUser(null);
              setNewUser({ name: '', email: '', role: 'cliente', plan: 'Basic', status: 'active' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary rounded-xl text-bg-main font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/10"
          >
            <Plus size={20} />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-border-color gap-8 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap ${
            activeTab === 'active' ? 'text-primary' : 'text-text-sec hover:text-text-main'
          }`}
        >
          Usuários Ativos
          {activeTab === 'active' && (
            <motion.div layoutId="activeTabProp" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'requests' ? 'text-primary' : 'text-text-sec hover:text-text-main'
          }`}
        >
          Solicitações Pendentes
          {accessRequests.length > 0 && (
            <span className="w-5 h-5 bg-rose-500 text-[10px] text-white rounded-full flex items-center justify-center">
              {accessRequests.length}
            </span>
          )}
          {activeTab === 'requests' && (
            <motion.div layoutId="activeTabProp" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      <div className="bg-bg-sidebar rounded-2xl border border-border-color overflow-hidden">
        <div className="p-6 border-b border-border-color flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-main/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-main border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'active' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-color bg-bg-main/30">
                  <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Função</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Plano</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Último Acesso</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-text-sec">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-bg-card transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-grad-start to-grad-end flex items-center justify-center text-bg-main font-bold text-sm border border-primary/20 shrink-0">
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-text-main">{user.name}</p>
                            <p className="text-xs text-text-sec flex items-center gap-1">
                              <Mail size={10} />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Shield size={14} className={user.role === 'admin' ? 'text-rose-500' : 'text-primary'} />
                          <span className="text-sm text-text-main capitalize">{user.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-main font-medium">{user.plan || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-sec">
                        {user.lastLogin}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(user)}
                            className="p-2 text-text-sec hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-text-sec hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Excluir"
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
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-color bg-bg-main/30">
                  <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Interessado</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Empresa / Motivo</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-sec uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {accessRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-text-sec">
                      Nenhuma solicitação pendente no momento.
                    </td>
                  </tr>
                ) : (
                  accessRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-bg-card transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-text-main">{request.name}</p>
                          <p className="text-xs text-text-sec flex items-center gap-1">
                            <Mail size={10} />
                            {request.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-main">{request.business || 'Não informado'}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-text-sec">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg font-bold transition-all"
                          >
                            <XCircle size={14} />
                            Recusar
                          </button>
                          <button 
                            onClick={() => handleApproveRequest(request)}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-bg-main hover:bg-emerald-600 rounded-lg font-bold transition-all shadow-lg shadow-emerald-500/10"
                          >
                            <Check size={14} />
                            Aprovar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-bg-sidebar border border-border-color rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-border-color flex items-center justify-between bg-bg-main/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <UsersIcon size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-main">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                    <p className="text-xs text-text-sec">Configure os acessos e plano do usuário.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-text-sec hover:text-text-main hover:bg-bg-card rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest">Nome Completo</label>
                  <input 
                    type="text" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all"
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest">E-mail</label>
                  <input 
                    type="email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all"
                    placeholder="joao@exemplo.com"
                  />
                </div>

                {!editingUser && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-widest">Senha Provisória</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" size={16} />
                      <input 
                        type="password" 
                        className="w-full bg-bg-main border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all"
                        placeholder="Deixe em branco para gerar link"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-widest">Função</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                      className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all appearance-none"
                    >
                      <option value="cliente">Cliente</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="gestor">Gestor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-widest">Plano</label>
                    <select 
                      value={newUser.plan}
                      onChange={(e) => setNewUser({...newUser, plan: e.target.value})}
                      className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all appearance-none"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Pro">Pro</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest">Status</label>
                  <select 
                    value={newUser.status}
                    onChange={(e) => setNewUser({...newUser, status: e.target.value as any})}
                    className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all appearance-none"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="p-6 bg-bg-main/20 border-t border-border-color flex gap-3">
                {!editingUser && (
                  <button 
                    onClick={generateLink}
                    className="p-3 border border-border-color text-text-main rounded-xl hover:bg-bg-main transition-all flex items-center justify-center"
                    title="Gerar Link de Cadastro"
                  >
                    <LinkIcon size={20} />
                  </button>
                )}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-border-color text-text-main rounded-xl font-bold hover:bg-bg-main transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveUser}
                  className="flex-1 py-3 bg-primary text-bg-main rounded-xl font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generated Link Modal */}
      <AnimatePresence>
        {isLinkModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-bg-sidebar border border-border-color rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-text-main">Link Gerado!</h3>
                <p className="text-sm text-text-sec">Envie este link para o usuário se cadastrar com o plano e função definidos.</p>
                
                <div className="p-3 bg-bg-main border border-border-color rounded-xl break-all text-xs text-text-main font-mono text-left">
                  {generatedLink}
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsLinkModalOpen(false)}
                    className="flex-1 py-2.5 border border-border-color text-text-main rounded-xl font-bold hover:bg-bg-main transition-all"
                  >
                    Fechar
                  </button>
                  <button 
                    onClick={copyLink}
                    className="flex-1 py-2.5 bg-primary text-bg-main rounded-xl font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20"
                  >
                    Copiar Link
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
