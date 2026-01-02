
import React from 'react';
import { LogIn } from 'lucide-react';

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
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1F1F1F] via-[#4A4A4A] to-[#8B0000] p-6">
      <div className="max-w-md w-full">
        {/* Glassmorphism card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 text-white">
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 flex items-center justify-center mb-6 transform hover:scale-105 transition-transform duration-500 overflow-hidden">
              <SapienLogoLarge className="w-full h-full" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-1">SAPIEN</h1>
            <h2 className="text-2xl font-bold tracking-widest text-white/90 mb-2">CRM</h2>
            <p className="text-gray-300 text-sm font-medium uppercase tracking-[0.2em]">Inteligência Imobiliária</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">Usuário</label>
              <input 
                type="text" 
                defaultValue="admin@sapiencrm.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#8B0000] transition-all placeholder:text-gray-500 text-white font-medium"
                placeholder="Insira seu e-mail"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">Senha</label>
              <input 
                type="password" 
                defaultValue="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#8B0000] transition-all placeholder:text-gray-500 text-white font-medium"
                placeholder="Insira sua senha"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#8B0000] focus:ring-0" />
                <span className="text-gray-400 group-hover:text-white transition-colors">Lembrar acesso</span>
              </label>
              <a href="#" className="text-[#8B0000] font-bold hover:text-red-400 transition-colors">Esqueceu a senha?</a>
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-[#D40000] to-red-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-red-900/20 hover:shadow-red-900/40 transform hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center space-x-3"
            >
              <LogIn size={20} />
              <span>ENTRAR NO SISTEMA</span>
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-gray-500 text-xs">
              © 2024 Sapien Intelligence Systems. <br/>
              Acesso restrito para parceiros credenciados.
            </p>
          </div>
        </div>

        {/* Floating background elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#D40000]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
};

export default Login;
