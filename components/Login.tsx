
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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-[#211111] font-sans">
      
      {/* Camada de Fundo Dinâmica */}
      <div className="absolute inset-0 z-0 bg-animated animate-gradient-slow opacity-80"></div>
      
      {/* Elementos Decorativos de Brilho */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#ea2a33]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] mix-blend-overlay"></div>
      </div>

      {/* Container de Login Smoky Glass */}
      <div className="smoky-glass relative z-10 w-full max-w-[420px] rounded-3xl overflow-hidden animate-float">
        
        {/* Cabeçalho com Logo e Título */}
        <div className="pt-10 pb-6 px-8 text-center border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
          <div className="mb-6 inline-flex items-center justify-center w-32 h-32 rounded-[2.5rem] bg-[#ea2a33] p-1 shadow-[0_0_30px_rgba(234,42,51,0.5)] border border-white/20 overflow-hidden">
            <img 
              src="https://i.postimg.cc/5NTGwxd0/LOGO_SISTEMMA.jpg" 
              alt="Sapien Logo" 
              className="w-full h-full object-cover rounded-[2.2rem]" 
            />
          </div>
          <h1 className="text-white tracking-tighter text-3xl font-black leading-none mb-2">SAPIEN CRM</h1>
          <p className="text-[#b89d9f] text-[10px] font-black tracking-[0.4em] uppercase opacity-70">Sistema Gestor Imobiliário</p>
        </div>

        {/* Formulário de Login */}
        <div className="p-8 flex flex-col gap-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-[10px] font-black text-center text-red-500 tracking-widest uppercase animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Campo de E-mail */}
            <div className="flex flex-col gap-2">
              <label className="text-[#e5e5e5] text-[11px] font-black uppercase tracking-widest pl-1">Login / E-mail</label>
              <div className="flex items-center input-glass rounded-xl border border-white/5 focus-within:border-[#ea2a33]/50 focus-within:ring-1 focus-within:ring-[#ea2a33]/50 transition-all duration-300">
                <div className="pl-4 pr-2 text-[#b89d9f] flex items-center justify-center">
                  <span className="material-icons-round text-xl">mail</span>
                </div>
                <input 
                  className="flex w-full bg-transparent border-none text-white placeholder:text-[#b89d9f]/30 h-14 text-sm font-semibold focus:ring-0" 
                  placeholder="usuario@sapien.com.br" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Campo de Senha */}
            <div className="flex flex-col gap-2">
              <label className="text-[#e5e5e5] text-[11px] font-black uppercase tracking-widest pl-1">Senha de Acesso</label>
              <div className="flex items-center input-glass rounded-xl border border-white/5 focus-within:border-[#ea2a33]/50 focus-within:ring-1 focus-within:ring-[#ea2a33]/50 transition-all duration-300">
                <div className="pl-4 pr-2 text-[#b89d9f] flex items-center justify-center">
                  <span className="material-icons-round text-xl">vpn_key</span>
                </div>
                <input 
                  className="flex w-full bg-transparent border-none text-white placeholder:text-[#b89d9f]/30 h-14 text-sm font-semibold focus:ring-0" 
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
                  <span className="material-icons-round text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-[#ea2a33] hover:bg-red-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_8px_20px_rgba(234,42,51,0.4)] hover:shadow-[0_12px_30px_rgba(234,42,51,0.5)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>AUTENTICAR ACESSO</span>
                    <span className="material-icons-round text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Links de Ajuda */}
          <div className="flex flex-col items-center gap-5 mt-2">
            <button 
              onClick={() => alert('Suporte SAP: Contate o administrador.')}
              className="text-xs font-bold text-[#b89d9f] hover:text-white transition-colors flex items-center gap-2 group"
            >
              <span className="material-icons-round text-lg group-hover:text-[#ea2a33] transition-colors">lock_reset</span>
              Esqueceu sua senha?
            </button>
            
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <p className="text-xs font-bold text-[#b89d9f]">
              Não possui credenciais? 
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-white hover:text-[#ea2a33] font-black ml-2 underline decoration-[#ea2a33]/50 underline-offset-8 transition-all"
              >
                Solicitar Acesso
              </button>
            </p>
          </div>
        </div>

        {/* Barra de Status Footer */}
        <div className="bg-black/40 px-6 py-4 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-[#b89d9f]/60">
          <span className="flex items-center gap-2">
            <span className="material-icons-round text-xs">verified_user</span>
            SAP Cloud v2.5.0
          </span>
          <span className="flex items-center gap-2">
            Server Status
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
