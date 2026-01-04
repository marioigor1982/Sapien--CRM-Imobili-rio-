
import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
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
      setError('Credenciais inválidas ou erro de rede.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] p-6">
      <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#8B0000] rounded-[2rem] mx-auto mb-6 flex items-center justify-center text-white font-black text-3xl shadow-xl">S</div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 leading-none">SAPIEN <span className="text-[#8B0000]">CRM</span></h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mt-3">Inteligência Imobiliária</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] text-center font-black uppercase">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#8B0000] outline-none text-gray-900 font-bold"
              placeholder="exemplo@sapien.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#8B0000] outline-none text-gray-900 font-bold"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#1F1F1F] text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-black transition-all flex items-center justify-center space-x-3 text-xs uppercase tracking-[0.2em]"
          >
            {loading ? 'PROCESSANDO...' : (mode === 'login' ? 'ENTRAR' : 'CADASTRAR')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[10px] font-black uppercase text-gray-400 hover:text-[#8B0000] tracking-widest"
          >
            {mode === 'login' ? 'Criar nova conta cloud' : 'Já possui conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
