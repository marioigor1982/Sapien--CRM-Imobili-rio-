
import React from 'react';
import { Search, Bell, LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
  userEmail: string;
}

const Header: React.FC<HeaderProps> = ({ title, onLogout, onToggleSidebar, userEmail }) => {
  // Lógica para extrair o primeiro nome do e-mail
  // mario.igor1982@gmail.com -> mario -> Mario
  const getUserGreeting = () => {
    if (!userEmail) return 'Administrador';
    
    // Pega a parte antes do @ e do primeiro ponto
    const namePart = userEmail.split(/[.@]/)[0];
    
    // Capitaliza a primeira letra
    return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
  };

  const userName = getUserGreeting();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-30 transition-all duration-300">
      <div className="flex items-center min-w-0">
        <button 
          onClick={onToggleSidebar}
          className="p-2 mr-4 text-gray-500 hover:text-[#8B0000] lg:hidden"
        >
          <Menu size={24} />
        </button>
        
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mr-8 truncate max-w-[120px] md:max-w-none">
          {title}
        </h2>
        
        <div className="relative hidden xl:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000] transition-all w-48 2xl:w-64"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-3 md:space-x-6">
        <button className="text-gray-400 hover:text-[#8B0000] transition-colors relative hidden sm:block">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#8B0000] rounded-full border-2 border-white" />
        </button>
        
        <div className="flex items-center space-x-2 md:space-x-3 pl-3 md:pl-6 border-l border-gray-100">
          <div className="text-right">
            <p className="text-xs md:text-sm font-bold text-gray-900 leading-tight">Olá, {userName}</p>
            <p className="text-[9px] text-gray-400 font-bold lowercase truncate max-w-[100px] md:max-w-[180px] mt-0.5">
              {userEmail}
            </p>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#8B0000] to-[#606060] rounded-full flex items-center justify-center text-white font-black shadow-inner hover:scale-105 transition-transform group relative overflow-hidden shrink-0"
          >
            <span className="group-hover:translate-y-10 transition-transform duration-300 text-[10px] md:text-xs">
              {userName.substring(0, 2).toUpperCase()}
            </span>
            <LogOut size={16} className="absolute -translate-y-10 group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
