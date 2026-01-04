
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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-[#2d2929] font-sans">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#211111] to-[#2d2929]"></div>
      
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center animate-in fade-in zoom-in duration-500">
        
        {/* Logo Container - Red Square with Intense Glow */}
        <div className="mb-8 w-36 h-36 rounded-[2.5rem] bg-[#ea2a33] p-1.5 shadow-[0_0_60px_rgba(234,42,51,0.6)] flex items-center justify-center border border-white/20 overflow-hidden">
           <img 
            src="https://i.postimg.cc/5NTGwxd0/LOGO_SISTEMMA.jpg" 
            alt="Sapien Logo" 
            className="w-full h-full object-cover rounded-[2.2rem]" 
          />
        </div>

        <div className="text-center mb-12">
          <h1 className="text-white text-4xl font-black tracking-tighter leading-none mb-3">SAPIEN CRM</h1>
          <p className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.4em] opacity-80">SISTEMA GESTOR IMOBILIÁRIO</p>
        </div>

        <div className="w-full space-y-7 px-4">
          <div className="h-px bg-white/5 w-full"></div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-[10px] font-black text-center text-red-500 tracking-widest uppercase">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-3">
              <label className="text-gray-400 text-[11px] font-bold uppercase tracking-widest pl-1 block">Login / E-mail</label>
              <div className="flex items-center bg-[#242121] border border-white/5 rounded-2xl focus-within:ring-2 focus-within:ring-[#ea2a33]/40 transition-all shadow-inner">
                <div className="pl-5 pr-3 text-gray-500">
                  <span className="material-icons-round text-2xl">mail</span>
                </div>
                <input 
                  className="w-full bg-transparent border-none text-white placeholder:text-gray-700 h-16 text-sm font-semibold focus:ring-0" 
                  placeholder="usuario@sapien.com.br" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <label className="text-gray-400 text-[11px] font-bold uppercase tracking-widest pl-1 block">Senha</label>
              <div className="flex items-center bg-[#242121] border border-white/5 rounded-2xl focus-within:ring-2 focus-within:ring-[#ea2a33]/40 transition-all shadow-inner">
                <div className="pl-5 pr-3 text-gray-500">
                  <span className="material-icons-round text-2xl">vpn_key</span>
                </div>
                <input 
                  className="w-full bg-transparent border-none text-white placeholder:text-gray-700 h-16 text-sm font-semibold focus:ring-0" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-5 pl-2 text-gray-500 hover:text-white transition-colors"
                >
                  <span className="material-icons-round text-2xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Main Action Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-[#ea2a33] hover:bg-[#ff3b45] text-white rounded-2xl shadow-[0_12px_40px_rgba(234,42,51,0.4)] hover:shadow-[0_15px_50px_rgba(234,42,51,0.5)] transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <RefreshCw size={24} className="animate-spin" />
              ) : (
                <>
                  <span className="text-xs font-black uppercase tracking-widest">ACESSAR O SISTEMA</span>
                  <span className="material-icons-round text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Secondary Actions */}
          <div className="flex flex-col items-center space-y-8 pt-4">
            <button 
              type="button"
              onClick={() => alert('Suporte SAP: Contate o administrador para reset de credenciais.')}
              className="text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider group"
            >
              <span className="material-icons-round text-xl text-gray-600 group-hover:text-[#ea2a33]">lock_reset</span>
              Esqueceu a senha?
            </button>
            
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              <span>Não tem acesso?</span>
              <button 
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-white hover:text-[#ea2a33] transition-colors underline decoration-white/20 underline-offset-8"
              >
                Solicitar acesso
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Status Footer */}
      <div className="absolute bottom-8 flex items-center gap-8 opacity-20 pointer-events-none">
        <div className="flex items-center gap-2">
           <span className="material-icons-round text-sm text-[#ea2a33]">security</span>
           <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Encrypted Session</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">SAP Data Center Online</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
