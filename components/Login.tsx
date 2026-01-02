
import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
  const [email, setEmail] = useState('admin@sapiencrm.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      setError('Falha na autenticação. Verifique e-mail e senha.');
      console.error(err);
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

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-xs text-center font-bold">{error}</div>}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">Usuário</label>
              <input 
                type="text" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#8B0000] text-white font-medium"
                placeholder="Insira seu e-mail"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#8B0000] text-white font-medium"
                placeholder="Insira sua senha"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D40000] to-red-600 text-white font-bold py-4 rounded-xl shadow-xl hover:shadow-red-900/40 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              <LogIn size={20} />
              <span>{loading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
