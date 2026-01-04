
import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowRight, RefreshCw, Key } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err: any) {
      console.error(err);
      setError('FALHA NA AUTENTICAÇÃO. ACESSO NEGADO.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden font-display">
      {/* Dynamic Background Layer */}
      <div className="absolute inset-0 z-0 bg-animated animate-gradient-slow opacity-80"></div>
      
      {/* Decorative Elements for "Alive" feel */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] mix-blend-overlay"></div>
      </div>

      {/* Smoky Login Container */}
      <div className="smoky-glass relative z-10 w-full max-w-[420px] rounded-2xl p-0 overflow-hidden animate-float">
        
        {/* Header Section */}
        <div className="pt-10 pb-6 px-8 text-center border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
          <div className="mb-4 inline-flex items-center justify-center p-0 w-24 h-24 rounded-2xl bg-white border border-primary/20 shadow-[0_0_25px_rgba(234,42,51,0.4)] overflow-hidden">
             <img 
              src="https://i.postimg.cc/5NTGwxd0/LOGO_SISTEMMA.jpg" 
              alt="Sapien Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-white tracking-tight text-[28px] font-bold leading-tight pb-1 uppercase">SAPIEN CRM</h1>
          <p className="text-[#b89d9f] text-[10px] font-black tracking-[0.3em] uppercase opacity-80">Sistema Gestor Imobiliário</p>
        </div>

        {/* Login Form */}
        <div className="p-8 flex flex-col gap-5">
          {error && (
            <div className="bg-primary/20 border border-primary/30 p-3 rounded-lg text-xs font-black text-center text-primary tracking-widest animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[#e5e5e5] text-sm font-medium leading-normal pl-1">Login / E-mail</label>
              <div className="flex items-center input-glass rounded-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 focus-within:bg-black/40 transition-all duration-300">
                <div className="pl-4 pr-2 text-[#b89d9f] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input 
                  className="flex w-full bg-transparent border-none text-white placeholder:text-[#b89d9f]/30 h-12 text-base focus:ring-0" 
                  placeholder="usuario@sapien.com.br" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[#e5e5e5] text-sm font-medium leading-normal pl-1">Senha</label>
              <div className="flex items-center input-glass rounded-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 focus-within:bg-black/40 transition-all duration-300">
                <div className="pl-4 pr-2 text-[#b89d9f] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">vpn_key</span>
                </div>
                <input 
                  className="flex w-full bg-transparent border-none text-white placeholder:text-[#b89d9f]/30 h-12 text-base focus:ring-0" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 pl-2 text-[#b89d9f] hover:text-white transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary hover:bg-red-600 text-white text-base font-bold rounded-lg shadow-[0_4px_14px_0_rgba(234,42,51,0.39)] hover:shadow-[0_6px_20px_rgba(234,42,51,0.23)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RefreshCw size={24} className="animate-spin" />
                ) : (
                  <>
                    <span className="tracking-widest uppercase">Acessar o Sistema</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Helper Links */}
          <div className="flex flex-col items-center gap-4 mt-2">
            <button 
              onClick={() => alert('Entre em contato com o suporte para recuperar sua senha.')}
              className="text-sm text-[#b89d9f] hover:text-white transition-colors flex items-center gap-1 group"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:text-primary transition-colors">lock_reset</span>
              Esqueceu a senha?
            </button>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <p className="text-sm text-[#b89d9f]">
              {mode === 'login' ? 'Não tem acesso?' : 'Já possui cadastro?'} 
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-white hover:text-primary font-medium transition-colors ml-1 underline decoration-primary/50 underline-offset-4 hover:decoration-primary"
              >
                {mode === 'login' ? 'Solicitar acesso' : 'Voltar ao Login'}
              </button>
            </p>
          </div>
        </div>

        {/* Status Bar Footer */}
        <div className="bg-black/20 px-6 py-3 border-t border-white/5 flex justify-between items-center text-[10px] uppercase tracking-widest text-[#b89d9f]/60">
          <span className="flex items-center gap-1 font-black">
            <span className="material-symbols-outlined text-[12px] text-primary">verified_user</span>
            v2.5.0
          </span>
          <span className="flex items-center gap-1.5 font-black">
            Status do Servidor
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
