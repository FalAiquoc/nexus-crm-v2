import React, { useState } from 'react';
import { Hexagon, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, User } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [view, setView] = useState<'login' | 'forgot' | 'request'>('login');
  const [successMessage, setSuccessMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [business, setBusiness] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let endpoint = '/api/auth/login';
      let body = {};

      if (view === 'login') {
        body = { email, password };
      } else if (view === 'forgot') {
        endpoint = '/api/auth/forgot-password';
        body = { email };
      } else {
        endpoint = '/api/auth/request-access';
        body = { name, email, business, business_name: 'CRM DoBoy' };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (view === 'login') {
          onLogin(data.token, data.user);
        } else {
          setSuccessMessage(data.message);
          setTimeout(() => {
            setView('login');
            setSuccessMessage('');
          }, 3000);
        }
      } else {
        setError(data.error || 'Erro na operação');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-bg-main font-bold text-2xl shadow-lg shadow-primary/20 mb-4">
            B
          </div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">CRM DoBoy</h1>
          <p className="text-text-sec mt-2">Entre com suas credenciais para acessar o painel.</p>
        </div>

        <div className="bg-bg-sidebar p-8 rounded-2xl border border-border-color shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-bg-main">
                  <ArrowRight size={12} className="-rotate-45" />
                </div>
                {successMessage}
              </div>
            )}

            {view === 'request' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-sec uppercase tracking-wider ml-1">Nome Completo</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-bg-main border border-border-color rounded-xl pl-10 pr-4 py-3 text-text-main focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-sec uppercase tracking-wider ml-1">E-mail Profissional</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-bg-main border border-border-color rounded-xl pl-10 pr-4 py-3 text-text-main focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {view === 'request' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-sec uppercase tracking-wider ml-1">Nome do Escritório / Empresa</label>
                <input 
                  type="text" 
                  required
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  placeholder="Ex: DV Advoga"
                  className="w-full bg-bg-main border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            {view === 'login' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider">Senha</label>
                  <button 
                    type="button" 
                    onClick={() => setView('forgot')}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-bg-main border border-border-color rounded-xl pl-10 pr-12 py-3 text-text-main focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sec hover:text-primary transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-bg-main font-bold py-4 rounded-xl hover:bg-secondary transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/10"
            >
              {isLoading ? 'Aguarde...' : 
               view === 'login' ? 'Acessar Sistema' : 
               view === 'forgot' ? 'Recuperar Senha' : 'Enviar Solicitação'}
              {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>

            {view !== 'login' && (
              <button 
                type="button"
                onClick={() => setView('login')}
                className="w-full text-center text-sm text-text-sec hover:text-primary transition-colors font-medium"
              >
                Voltar para o login
              </button>
            )}
          </form>
        </div>

        <p className="text-center mt-8 text-text-sec text-sm">
          {view === 'request' ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}
          <button 
            onClick={() => setView(view === 'request' ? 'login' : 'request')}
            className="text-primary font-semibold hover:underline ml-1"
          >
            {view === 'request' ? 'Faça login' : 'Solicite acesso'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
