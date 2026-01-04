
import React, { useState } from 'react';
import { LogIn, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError('Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-10 text-center border-b border-gray-50">
          <div className="w-20 h-20 bg-white rounded-xl mx-auto mb-6 flex items-center justify-center shadow-md border border-gray-100">
            <img 
              src="https://i.postimg.cc/GHPqRnpw/LOGO-SISTEMMA.jpg" 
              alt="Sapien Logo" 
              className="w-16 h-16 object-contain rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
            SAPIEN <span className="text-[#8B0000]">CRM</span>
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2">Sistema Gestor Imobiliário</p>
        </div>

        <div className="p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 animate-pulse text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">E-mail Corporativo</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#8B0000] outline-none text-sm font-bold text-gray-900"
                placeholder="usuario@sapien.com"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Chave de Acesso</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#8B0000] outline-none text-sm font-bold text-gray-900"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#1F1F1F] text-white font-black py-4 rounded-xl shadow-lg hover:bg-black transition-all flex items-center justify-center space-x-3 text-xs uppercase tracking-widest"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  <span>{mode === 'login' ? 'Entrar no Sistema' : 'Solicitar Cadastro'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-[10px] font-black uppercase text-gray-400 hover:text-[#8B0000] transition-colors"
            >
              {mode === 'login' ? 'Não possui acesso? Clique aqui' : 'Já é cadastrado? Voltar ao Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
