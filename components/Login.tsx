
import React, { useState } from 'react';
import { LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

interface LoginProps {
  onLogin: () => void;
}

const SapienLogoLarge = ({ className }: { className?: string }) => (
  <img 
    src="https://i.postimg.cc/NLXBjNHq/file-00000000731471f5848228adbf7dd9f0-(1).png" 
    alt="Sapien CRM Logo" 
    className={className}
    style={{ objectFit: 'contain', imageRendering: 'auto' }}
  />
);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') setError('Usuário não cadastrado.');
      else if (err.code === 'auth/wrong-password') setError('Senha incorreta.');
      else if (err.code === 'auth/email-already-in-use') setError('Este e-mail já está em uso.');
      else if (err.code === 'auth/weak-password') setError('A senha deve ter pelo menos 6 caracteres.');
      else setError('Erro na autenticação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1F1F1F] via-[#4A4A4A] to-[#8B0000] p-6">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 text-white">
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 flex items-center justify-center mb-6 overflow-hidden">
              <SapienLogoLarge className="w-full h-full" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-1">SAPIEN</h1>
            <p className="text-gray-300 text-sm font-medium uppercase tracking-[0.2em]">Inteligência Imobiliária</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-black/20 p-1 rounded-xl mb-8">
            <button 
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'login' ? 'bg-white text-[#8B0000] shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'signup' ? 'bg-white text-[#8B0000] shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Cadastro
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-[10px] text-center font-black uppercase tracking-wider text-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 ml-1">E-mail Corporativo</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#8B0000] text-gray-900 font-bold placeholder:text-gray-400"
                placeholder="exemplo@sapiencrm.com"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 ml-1">Senha de Acesso</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#8B0000] text-gray-900 font-bold placeholder:text-gray-400"
                placeholder="••••••••"
                required
              />
            </div>

            {mode === 'signup' && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 ml-1">Confirmar Senha</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#8B0000] text-gray-900 font-bold placeholder:text-gray-400"
                  placeholder="Repita sua senha"
                  required
                />
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D40000] to-red-600 text-white font-black py-4 rounded-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 disabled:opacity-50 mt-4 text-xs uppercase tracking-[0.2em]"
            >
              {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
              <span>{loading ? 'PROCESSANDO...' : (mode === 'login' ? 'ENTRAR NO SISTEMA' : 'CRIAR MINHA CONTA')}</span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {mode === 'login' ? 'Ainda não tem acesso?' : 'Já possui uma conta?'}
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="ml-2 text-white hover:text-red-400 underline underline-offset-4 transition-colors"
              >
                {mode === 'login' ? 'Cadastre-se aqui' : 'Faça login'}
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center space-x-4 opacity-50">
          <span className="h-px w-8 bg-white/20" />
          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Sapien Real Estate Technology</p>
          <span className="h-px w-8 bg-white/20" />
        </div>
      </div>
    </div>
  );
};

export default Login;
