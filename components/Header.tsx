
import React, { useState } from 'react';
import { Search, Bell, LogOut, Menu, ShieldAlert, Check, X, MessageSquare } from 'lucide-react';
import { ApprovalRequest } from '../types';

interface HeaderProps {
  title: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
  userEmail: string;
  pendingApprovals: ApprovalRequest[];
  onApprove: (request: ApprovalRequest, status: 'approved' | 'denied') => void;
  isAdmin: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, onLogout, onToggleSidebar, userEmail, pendingApprovals, onApprove, isAdmin }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const getUserGreeting = () => {
    if (!userEmail) return 'Administrador';
    const namePart = userEmail.split(/[.@]/)[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
  };

  const userName = getUserGreeting();
  const hasNotifications = isAdmin && pendingApprovals.length > 0;

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
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`p-2 rounded-full transition-colors relative ${isNotificationsOpen ? 'bg-red-50 text-[#8B0000]' : 'text-gray-400 hover:text-[#8B0000]'}`}
          >
            <Bell size={20} />
            {hasNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#8B0000] rounded-full border-2 border-white animate-pulse" />
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notificações SAP</span>
                {isAdmin && <span className="bg-[#8B0000] text-white px-2 py-0.5 rounded text-[9px] font-black">{pendingApprovals.length} Pendentes</span>}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {!isAdmin ? (
                  <div className="p-8 text-center">
                    <Check className="mx-auto mb-2 text-green-500" size={24} />
                    <p className="text-[10px] font-black uppercase text-gray-400">Nenhum alerta para você</p>
                  </div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="p-8 text-center">
                    <Check className="mx-auto mb-2 text-green-500" size={24} />
                    <p className="text-[10px] font-black uppercase text-gray-400">Sistema em Conformidade</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {pendingApprovals.map((req) => (
                      <div key={req.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-red-50 text-[#8B0000] rounded-lg shrink-0">
                            <ShieldAlert size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-gray-900 leading-tight">
                              Solicitação de {req.type === 'delete' ? 'Exclusão' : 'Retrocesso'}
                            </p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 truncate">
                              Por: {req.userEmail}
                            </p>
                            <div className="flex space-x-2 mt-3">
                              <button 
                                onClick={() => onApprove(req, 'approved')}
                                className="flex-1 py-1.5 bg-[#8B0000] text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg"
                              >
                                Aprovar
                              </button>
                              <button 
                                onClick={() => onApprove(req, 'denied')}
                                className="flex-1 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest"
                              >
                                Negar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                <button 
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-[9px] font-black uppercase text-[#8B0000] tracking-widest"
                >
                  Fechar Central
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-3 pl-3 md:pl-6 border-l border-gray-100">
          <div className="text-right hidden sm:block">
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
