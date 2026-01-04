
import React, { useState } from 'react';
import { Search, Bell, LogOut, Menu, ShieldAlert, Check, X, Mail, MailOpen, Trash2, MessageSquare } from 'lucide-react';
import { ApprovalRequest, MuralMessage } from '../types';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface HeaderProps {
  title: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
  userEmail: string;
  pendingApprovals: ApprovalRequest[];
  processedRequests: ApprovalRequest[];
  onApprove: (request: ApprovalRequest, status: 'approved' | 'denied') => void;
  isAdmin: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, onLogout, onToggleSidebar, userEmail, pendingApprovals, processedRequests, onApprove, isAdmin }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const getUserGreeting = () => {
    if (!userEmail) return 'Administrador';
    const namePart = userEmail.split(/[.@]/)[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
  };

  const userName = getUserGreeting();
  
  // Notificações ativas: Pendentes (se admin) + Processadas que me pertencem (se comum)
  const myProcessed = processedRequests.filter(r => r.userEmail === userEmail);
  const activeNotifications = isAdmin ? [...pendingApprovals, ...myProcessed] : myProcessed;
  const unreadCount = activeNotifications.filter(n => !n.isSeen).length;

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "approval_requests", id), { isSeen: true });
  };

  const clearAll = async () => {
    // Apenas marca como lidas ou remove da visão as processadas
    const promises = activeNotifications.map(n => updateDoc(doc(db, "approval_requests", n.id), { isSeen: true }));
    await Promise.all(promises);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-30 transition-all duration-300">
      <div className="flex items-center min-w-0">
        <button onClick={onToggleSidebar} className="p-2 mr-4 text-gray-500 lg:hidden hover:text-[#8B0000]">
          <Menu size={24} />
        </button>
        <h2 className="text-lg md:text-xl font-black text-gray-800 tracking-tighter truncate">{title}</h2>
      </div>
      
      <div className="flex items-center space-x-3 md:space-x-6">
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`p-2.5 rounded-full transition-all relative ${isNotificationsOpen ? 'bg-red-50 text-[#8B0000]' : 'text-gray-400 hover:text-[#8B0000] hover:bg-gray-50'}`}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#8B0000] text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Central SAP Cloud</span>
                <button onClick={clearAll} className="text-[9px] font-black text-[#8B0000] hover:underline uppercase tracking-widest flex items-center"><Check size={12} className="mr-1" /> Marcar Lidas</button>
              </div>

              <div className="max-h-[450px] overflow-y-auto scrollbar-hide">
                {activeNotifications.length === 0 ? (
                  <div className="py-16 text-center opacity-20">
                    <MailOpen size={48} className="mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Tudo em ordem</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {activeNotifications.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map((req) => {
                      const isPending = req.status === 'pending';
                      const isApproved = req.status === 'approved';
                      const isMyReq = req.userEmail === userEmail;

                      return (
                        <div key={req.id} className={`p-5 transition-all ${!req.isSeen ? 'bg-red-50/30' : 'bg-white'}`} onClick={() => markAsRead(req.id)}>
                          <div className="flex items-start space-x-4">
                            <div className={`p-2 rounded-xl shrink-0 ${isPending ? 'bg-amber-50 text-amber-600' : isApproved ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {req.isSeen ? <MailOpen size={18} /> : <Mail size={18} className="animate-bounce" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-[11px] font-black text-gray-900 leading-tight uppercase tracking-tight">
                                  {isMyReq ? (isPending ? 'Sua Solicitação Pendente' : isApproved ? 'Sua Solicitação Aprovada' : 'Sua Solicitação Recusada') : `Pedido de ${req.type === 'delete' ? 'Exclusão' : 'Retrocesso'}`}
                                </p>
                                <span className="text-[8px] font-bold text-gray-300 uppercase shrink-0">{new Date(req.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                                {isMyReq ? (req.status === 'denied' ? 'O administrador recusou seu pedido.' : 'Processo finalizado pelo sistema.') : `O usuário ${req.userEmail.split('@')[0]} deseja ${req.type === 'delete' ? 'excluir' : 'retroceder'} um lead.`}
                              </p>
                              
                              {isAdmin && isPending && (
                                <div className="flex space-x-2 mt-4">
                                  <button onClick={(e) => { e.stopPropagation(); onApprove(req, 'approved'); }} className="flex-1 py-2 bg-[#8B0000] text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">Aprovar</button>
                                  <button onClick={(e) => { e.stopPropagation(); onApprove(req, 'denied'); }} className="flex-1 py-2 bg-gray-100 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500">Recusar</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                <button onClick={() => setIsNotificationsOpen(false)} className="text-[10px] font-black uppercase text-[#8B0000] tracking-[0.2em] hover:opacity-70">Fechar Central Cloud</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3 pl-6 border-l border-gray-100">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-gray-900 leading-none mb-1">Olá, {userName}</p>
            <p className="text-[10px] text-gray-400 font-bold lowercase truncate max-w-[150px]">{userEmail}</p>
          </div>
          <button onClick={onLogout} className="w-10 h-10 bg-[#1F1F1F] text-white rounded-xl flex items-center justify-center font-black shadow-lg hover:bg-[#8B0000] transition-all transform hover:rotate-3 group relative overflow-hidden">
             <span className="group-hover:translate-y-10 transition-transform duration-300">{userName.charAt(0).toUpperCase()}</span>
             <LogOut size={16} className="absolute -translate-y-10 group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
