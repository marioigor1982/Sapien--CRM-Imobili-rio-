
import React from 'react';
import { ViewType } from '../types';
import { LogOut, ChevronLeft, ChevronRight, LayoutDashboard, Trello, List, Users, Briefcase, Home, Landmark, Building2, Settings, MessageSquare } from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  onLogout: () => void;
  isAdmin: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  unreadMuralCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, setView, onLogout, isAdmin, 
  isCollapsed, setIsCollapsed, unreadMuralCount = 0 
}) => {
  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'Kanban', label: 'Pipeline (Kanban)', icon: <Trello size={20} /> },
    { id: 'List', label: 'Lista de Leads', icon: <List size={20} /> },
    { id: 'Mural', label: 'Mural Global', icon: <MessageSquare size={20} />, hasBadge: true },
    { type: 'divider' },
    { id: 'Clientes', label: 'Clientes', icon: <Users size={20} /> },
    { id: 'Corretores', label: 'Corretores', icon: <Briefcase size={20} /> },
    { id: 'Properties', label: 'Imóveis', icon: <Home size={20} /> },
    { id: 'Bancos', label: 'Bancos', icon: <Landmark size={20} /> },
    { id: 'Construtoras', label: 'Construtoras', icon: <Building2 size={20} /> },
  ];

  if (isAdmin) {
    menuItems.push({ type: 'divider' });
    menuItems.push({ id: 'Settings', label: 'Governança SAP', icon: <Settings size={20} /> });
  }

  return (
    <aside className={`bg-[#1F1F1F] text-white flex flex-col shadow-2xl transition-all duration-300 z-40 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-4 border-b border-gray-800 flex items-center justify-between h-20">
         {!isCollapsed ? (
           <div className="flex items-center space-x-3 overflow-hidden">
             <div className="w-10 h-10 bg-white rounded-xl overflow-hidden shrink-0 border-2 border-[#8B0000]">
               <img src="https://i.postimg.cc/5NTGwxd0/LOGO_SISTEMMA.jpg" alt="Logo" className="w-full h-full object-cover" />
             </div>
             <span className="font-black tracking-tighter text-xl">SAPIEN <span className="text-[#8B0000]">CRM</span></span>
           </div>
         ) : (
           <div className="w-10 h-10 bg-white rounded-xl overflow-hidden border-2 border-[#8B0000] mx-auto">
             <img src="https://i.postimg.cc/5NTGwxd0/LOGO_SISTEMMA.jpg" alt="Logo" className="w-full h-full object-cover" />
           </div>
         )}
         {!isCollapsed && (
           <button onClick={() => setIsCollapsed(true)} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors ml-auto text-gray-500">
             <ChevronLeft size={20} />
           </button>
         )}
      </div>
      
      {isCollapsed && (
        <button onClick={() => setIsCollapsed(false)} className="mx-auto mt-4 p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
          <ChevronRight size={20} />
        </button>
      )}

      <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item, idx) => {
          if (item.type === 'divider') return <div key={idx} className="my-4 border-t border-gray-800 mx-4" />;
          const isActive = currentView === item.id;
          const showBadge = item.id === 'Mural' && unreadMuralCount > 0;

          return (
            <button 
              key={item.id} 
              onClick={() => setView(item.id as ViewType)} 
              className={`w-full flex items-center relative ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-4 rounded-2xl transition-all ${isActive ? 'bg-[#8B0000] text-white shadow-[0_10px_20px_-5px_rgba(139,0,0,0.5)]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <div className="relative">
                <div className={isActive ? 'animate-pulse' : ''}>{item.icon}</div>
                {showBadge && (
                  <span className={`absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-[#1F1F1F] animate-bounce`}>
                    {unreadMuralCount > 9 ? '9+' : unreadMuralCount}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="font-black text-[10px] uppercase tracking-widest truncate">{item.label}</span>
                  {showBadge && (
                    <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full ml-2">
                      {unreadMuralCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-gray-800 bg-[#1A1A1A]">
        <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 py-4 border border-gray-700 rounded-2xl text-gray-400 hover:text-white hover:bg-red-900/30 transition-all font-black text-[10px] uppercase tracking-widest group">
          <LogOut size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          {!isCollapsed && <span>Encerrar SAP</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
