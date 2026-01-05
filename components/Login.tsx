
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { RefreshCw } from 'lucide-react';

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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-[#211111] font-display">
      
      {/* Camada de Fundo Dinâmica */}
      <div className="absolute inset-0 z-0 bg-animated animate-gradient-slow opacity-80"></div>
      
      {/* Elementos Decorativos de Brilho */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#ea2a33]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] mix-blend-overlay"></div>
      </div>

      {/* Container de Login Smoky Glass */}
      <div className="smoky-glass relative z-10 w-full max-w-[420px] rounded-2xl overflow-hidden animate-float">
        
        {/* Cabeçalho */}
        <div className="pt-10 pb-6 px-8 text-center border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
          <div className="mb-4 inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[#ea2a33]/10 border border-[#ea2a33]/20 p-1 shadow-[0_0_20px_rgba(234,42,51,0.3)] overflow-hidden">
            <img 
              src="https://i.postimg.cc/5NTGwxd0/LOGO_SISTEMMA.jpg" 
              alt="Sapien Logo" 
              className="w-full h-full object-cover rounded-xl" 
            />
          </div>
          <h1 className="text-white tracking-tight text-[28px] font-bold leading-tight pb-2">SAPIEN CRM</h1>
          <p className="text-[#b89d9f] text-sm font-normal tracking-wide uppercase opacity-80">Inteligência e Gestão Imobiliária</p>
        </div>

        {/* Formulário */}
        <div className="p-8 flex flex-col gap-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-[10px] font-black text-center text-red-500 tracking-widest uppercase animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Campo E-mail */}
            <div className="flex flex-col gap-2">
              <label className="text-[#e5e5e5] text-sm font-medium leading-normal pl-1">Login / E-mail</label>
              <div className="flex items-center input-glass rounded-lg border border-white/5 focus-within:border-[#ea2a33]/50 focus-within:ring-1 focus-within:ring-[#ea2a33]/50 focus-within:bg-black/40 transition-all duration-300">
                <div className="pl-4 pr-2 text-[#b89d9f] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input 
                  className="flex w-full bg-transparent border-none text-white placeholder:text-[#b89d9f]/50 h-12 text-base focus:ring-0" 
                  placeholder="usuario@empresa.com.br" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="flex flex-col gap-2">
              <label className="text-[#e5e5e5] text-sm font-medium leading-normal pl-1">Senha de Acesso</label>
              <div className="flex items-center input-glass rounded-lg border border-white/5 focus-within:border-[#ea2a33]/50 focus-within:ring-1 focus-within:ring-[#ea2a33]/50 focus-within:bg-black/40 transition-all duration-300">
                <div className="pl-4 pr-2 text-[#b89d9f] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">vpn_key</span>
                </div>
                <input 
                  className="flex w-full bg-transparent border-none text-white placeholder:text-[#b89d9f]/50 h-12 text-base focus:ring-0" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 pl-2 text-[#b89d9f] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Botão de Ação */}
            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#ea2a33] hover:bg-red-600 text-white text-base font-bold rounded-lg shadow-[0_4px_14px_0_rgba(234,42,51,0.39)] hover:shadow-[0_6px_20px_rgba(234,42,51,0.23)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>AUTENTICAR</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Links Auxiliares */}
          <div className="flex flex-col items-center gap-4 mt-2">
            <button 
              onClick={() => alert('Suporte SAP: Contate o administrador.')}
              className="text-sm text-[#b89d9f] hover:text-white transition-colors flex items-center gap-1 group"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:text-[#ea2a33] transition-colors">lock_reset</span>
              Esqueceu sua senha?
            </button>
            
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <p className="text-sm text-[#b89d9f]">
              Novo na plataforma? 
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-white hover:text-[#ea2a33] font-medium transition-colors ml-1 underline decoration-[#ea2a33]/50 underline-offset-4 hover:decoration-[#ea2a33]"
              >
                Solicitar Acesso
              </button>
            </p>
          </div>
        </div>

        {/* Rodapé de Status */}
        <div className="bg-black/20 px-6 py-3 border-t border-white/5 flex justify-between items-center text-[10px] uppercase tracking-widest text-[#b89d9f]/60">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">verified_user</span>
            v2.4.0
          </span>
          <span className="flex items-center gap-1.5">
            Status do Servidor
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_5px_#22c55e]"></span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
