
import React from 'react';
import { ViewType } from '../types';
import { LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  menuItems: any[];
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, menuItems, onLogout }) => {
  return (
    <aside className="w-64 bg-[#1F1F1F] text-white flex flex-col shadow-2xl z-20">
      <div className="p-6 flex items-center space-x-3 border-b border-gray-800">
        <div className="w-10 h-10 bg-[#8B0000] rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-xl font-bold italic">S</span>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">SAPIEN CRM</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Real Estate OS</p>
        </div>
      </div>
      
      <nav className="flex-1 mt-6 overflow-y-auto px-4">
        {menuItems.map((item, idx) => {
          if (item.type === 'divider') {
            return <div key={`div-${idx}`} className="my-4 border-t border-gray-800" />;
          }

          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewType)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-200 mb-1 ${
                isActive 
                  ? 'bg-[#8B0000] text-white shadow-md' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                 <div className="ml-auto w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-gray-800 space-y-4">
        <div className="flex items-center space-x-3 text-xs text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Servidor Local Ativo</span>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-red-900/30 hover:border-[#8B0000] transition-all font-bold text-xs uppercase tracking-wider group"
        >
          <LogOut size={16} className="group-hover:scale-110 transition-transform" />
          <span>Voltar para Login</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
