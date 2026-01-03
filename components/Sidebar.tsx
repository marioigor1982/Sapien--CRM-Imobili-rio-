
import React from 'react';
import { ViewType } from '../types';
import { LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  menuItems: any[];
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

const SapienLogo = ({ className }: { className?: string }) => (
  <img 
    src="https://i.postimg.cc/NLXBjNHq/file-00000000731471f5848228adbf7dd9f0-(1).png" 
    alt="Sapien CRM Logo" 
    className={className}
    style={{ objectFit: 'contain', imageRendering: 'auto' }}
  />
);

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, setView, menuItems, onLogout, isCollapsed, setIsCollapsed 
}) => {
  return (
    <>
      {/* Mobile Overlay Background */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside 
        className={`fixed lg:static inset-y-0 left-0 bg-[#1F1F1F] text-white flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'
        }`}
      >
        <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} border-b border-gray-800 relative h-20 shrink-0`}>
          <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} flex items-center justify-center overflow-hidden transition-all`}>
            <SapienLogo className="w-full h-full" />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-500">
              <h1 className="text-md font-bold tracking-tight">SAPIEN CRM</h1>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">Real Estate OS</p>
            </div>
          )}
          
          {/* Collapse/Expand Toggle (Desktop only) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-7 bg-[#8B0000] w-6 h-6 rounded-full items-center justify-center text-white border-2 border-[#F4F6F8] shadow-md hover:scale-110 transition-transform"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Close for Mobile */}
          <button 
            onClick={() => setIsCollapsed(true)}
            className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 mt-6 overflow-y-auto px-3 scrollbar-hide">
          {menuItems.map((item, idx) => {
            if (item.type === 'divider') {
              return <div key={`div-${idx}`} className={`my-4 border-t border-gray-800 ${isCollapsed ? 'mx-2' : ''}`} />;
            }

            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as ViewType);
                  if (window.innerWidth < 1024) setIsCollapsed(true);
                }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all duration-200 mb-1 relative group ${
                  isActive 
                    ? 'bg-[#8B0000] text-white shadow-md' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <div className="shrink-0">{item.icon}</div>
                {!isCollapsed && <span className="font-medium text-sm animate-in slide-in-from-left-2 duration-200">{item.label}</span>}
                {isActive && !isCollapsed && (
                   <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                )}
                {isCollapsed && isActive && (
                   <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-gray-800 space-y-4 ${isCollapsed ? 'items-center' : ''} flex flex-col`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest animate-in fade-in duration-300">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span>Conectado Cloud</span>
            </div>
          )}
          
          <button 
            onClick={onLogout}
            className={`flex items-center justify-center ${isCollapsed ? 'w-10 h-10 p-0' : 'w-full py-2.5 px-4 space-x-2'} rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-red-900/30 hover:border-[#8B0000] transition-all font-bold text-xs uppercase tracking-wider group`}
            title={isCollapsed ? 'Encerrar' : ''}
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform shrink-0" />
            {!isCollapsed && <span className="animate-in slide-in-from-left-2">Encerrar</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
