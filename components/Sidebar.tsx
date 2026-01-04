
import React from 'react';
import { ViewType } from '../types';
import { LogOut, ChevronLeft, ChevronRight, LayoutDashboard, Trello, List, Users, Briefcase, Home, Landmark, Building2, Settings } from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  onLogout: () => void;
  isAdmin: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout, isAdmin, isCollapsed, setIsCollapsed }) => {
  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'Kanban', label: 'Pipeline (Kanban)', icon: <Trello size={20} /> },
    { id: 'List', label: 'Lista de Leads', icon: <List size={20} /> },
    { type: 'divider' },
    { id: 'Clientes', label: 'Clientes', icon: <Users size={20} /> },
    { id: 'Corretores', label: 'Corretores', icon: <Briefcase size={20} /> },
    { id: 'Properties', label: 'Imóveis', icon: <Home size={20} /> },
    { id: 'Bancos', label: 'Bancos', icon: <Landmark size={20} /> },
    { id: 'Construtoras', label: 'Construtoras', icon: <Building2 size={20} /> },
  ];

  if (isAdmin) {
    menuItems.push({ type: 'divider' });
    menuItems.push({ id: 'Settings', label: 'Configurações', icon: <Settings size={20} /> });
  }

  return (
    <aside className={`bg-[#1F1F1F] text-white flex flex-col shadow-2xl transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
         {!isCollapsed && <span className="font-black tracking-tighter text-xl">SAPIEN <span className="text-[#8B0000]">CRM</span></span>}
         <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-gray-800 rounded">{isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
      </div>
      <nav className="flex-1 mt-6 px-3">
        {menuItems.map((item, idx) => {
          if (item.type === 'divider') return <div key={idx} className="my-4 border-t border-gray-800 mx-2" />;
          const isActive = currentView === item.id;
          return (
            <button key={item.id} onClick={() => setView(item.id as ViewType)} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all mb-1 ${isActive ? 'bg-[#8B0000] text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
              {item.icon}
              {!isCollapsed && <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className="p-6 border-t border-gray-800">
        <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 py-3 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:bg-red-900/20 transition-all font-black text-[10px] uppercase">
          <LogOut size={16} />
          {!isCollapsed && <span>Encerrar Sessão</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
