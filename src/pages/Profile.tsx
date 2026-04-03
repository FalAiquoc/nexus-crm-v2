import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Camera,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

export function Profile() {
  const { user, setUser } = useApp();
  const { showToast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de persistência (em produção seria chamada de API)
    if (user) {
      setUser({ ...user, name: formData.name, email: formData.email });
      showToast('Perfil atualizado com sucesso!', 'success');
      setIsEditing(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      showToast('As senhas não coincidem!', 'error');
      return;
    }
    if (formData.newPassword.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres!', 'error');
      return;
    }
    
    showToast('Senha alterada com sucesso!', 'success');
    setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
        <div className="relative group">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-grad-start to-grad-end flex items-center justify-center text-bg-main font-bold text-3xl md:text-5xl border-4 border-bg-sidebar shadow-2xl overflow-hidden relative">
            {user?.name?.substring(0, 2).toUpperCase() || 'EX'}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera size={24} className="text-white" />
            </div>
          </div>
          <div className="absolute bottom-1 right-1 w-6 h-6 md:w-8 md:h-8 bg-green-500 border-4 border-bg-main rounded-full shadow-lg"></div>
        </div>
        
        <div className="flex-1 space-y-1">
          <h2 className="text-3xl md:text-4xl font-bold text-text-main tracking-tight">
            {user?.name || 'Seu Nome'}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-text-sec text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full font-bold uppercase tracking-widest text-[10px]">
              <Shield size={12} />
              {user?.role || 'Acesso'}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={14} />
              {user?.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              Membro desde Abril 2024
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Coluna Esquerda: Informações Gerais */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-bg-sidebar border border-border-color p-6 md:p-8 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <User size={20} />
                </div>
                <h3 className="text-lg font-bold text-text-main uppercase tracking-wider">Informações Pessoais</h3>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm font-bold text-primary hover:underline transition-all"
              >
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest pl-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    disabled={!isEditing}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-bg-main/20 border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest pl-1">E-mail Profissional</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    disabled={!isEditing}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-bg-main/20 border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {isEditing && (
                <button 
                  type="submit"
                  className="w-full md:w-auto px-8 py-3 bg-primary text-bg-main border-none rounded-xl font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20"
                >
                  Salvar Alterações
                </button>
              )}
            </form>
          </div>

          <div className="bg-bg-sidebar border border-border-color p-6 md:p-8 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                <Lock size={20} />
              </div>
              <h3 className="text-lg font-bold text-text-main uppercase tracking-wider">Segurança & Senha</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-sec uppercase tracking-widest pl-1">Senha Atual</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full bg-bg-main/20 border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary transition-all"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-sec hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest pl-1">Nova Senha</label>
                  <input 
                    type="password" 
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full bg-bg-main/20 border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-widest pl-1">Confirmar Senha</label>
                  <input 
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full bg-bg-main/20 border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full md:w-auto px-8 py-3 bg-bg-main border border-border-color text-text-main rounded-xl font-bold hover:bg-bg-card transition-all"
              >
                Atualizar Senha
              </button>
            </form>
          </div>
        </div>

        {/* Coluna Direita: Extras/Status */}
        <div className="space-y-6">
          <div className="bg-bg-sidebar border border-border-color p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="text-primary" size={20} />
              <h3 className="font-bold text-text-main uppercase tracking-widest text-xs">Vínculo Profissional</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-bg-main/20 rounded-xl border border-border-color">
                <p className="text-[10px] text-text-sec uppercase tracking-tighter mb-1">Empresa Principal</p>
                <p className="text-sm font-bold text-text-main">Nexus Soluções Jurídicas</p>
              </div>
              <div className="p-3 bg-bg-main/20 rounded-xl border border-border-color">
                <p className="text-[10px] text-text-sec uppercase tracking-tighter mb-1">Plano Ativo</p>
                <p className="text-sm font-bold text-primary flex items-center gap-2">
                  Plano Enterprise
                  <CheckCircle2 size={14} />
                </p>
              </div>
            </div>
          </div>

          <div className="bg-bg-sidebar border border-border-color p-6 rounded-2xl shadow-xl flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-text-main">CONTA VERIFICADA</h4>
              <p className="text-xs text-text-sec leading-relaxed">Sua conta possui acesso total a todos os módulos do sistema.</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex gap-4">
            <AlertCircle className="text-amber-500 shrink-0" size={20} />
            <div className="space-y-1">
                <h5 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Aviso de Segurança</h5>
                <p className="text-[10px] text-text-sec leading-relaxed">
                    Recomendamos a alteração de sua senha a cada 90 dias para manter a segurança de seus dados.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
