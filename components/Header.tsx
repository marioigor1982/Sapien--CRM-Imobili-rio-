
import React from 'react';
import { Search, Bell, LogOut } from 'lucide-react';

interface HeaderProps {
  title: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onLogout }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-gray-800 mr-8">{title}</h2>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar no sistema..." 
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] transition-all w-64"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <button className="text-gray-400 hover:text-[#8B0000] transition-colors relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#8B0000] rounded-full border-2 border-white" />
        </button>
        <div className="flex items-center space-x-3 pl-6 border-l border-gray-100">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">Administrador</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Unidade São Paulo</p>
          </div>
          <button 
            onClick={onLogout}
            className="w-10 h-10 bg-gradient-to-br from-[#8B0000] to-[#C0C0C0] rounded-full flex items-center justify-center text-white font-bold shadow-inner hover:opacity-80 transition-opacity group relative"
          >
            <span className="group-hover:hidden">AD</span>
            <LogOut size={18} className="hidden group-hover:block" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
