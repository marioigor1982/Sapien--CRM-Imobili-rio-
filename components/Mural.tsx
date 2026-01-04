
import React, { useState, useEffect } from 'react';
import { MuralMessage, MuralStatus } from '../types';
import { 
  Send, MessageSquare, Clock, Plus, Trash2, 
  AlertTriangle, Star, Play, UserSearch, 
  Landmark, ArrowUpRight, ChevronDown, X, Edit3
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, arrayUnion, deleteDoc } from 'firebase/firestore';

interface MuralProps {
  messages: MuralMessage[];
  user: any;
  onInteraction?: () => void;
}

const STATUS_CONFIG: Record<MuralStatus, { color: string; bg: string; icon: React.ReactNode; border: string }> = {
  [MuralStatus.CRITICO]: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500', icon: <AlertTriangle size={14} className="animate-pulse" /> },
  [MuralStatus.IMPORTANTE]: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Star size={14} /> },
  [MuralStatus.EXECUTAR]: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Play size={14} /> },
  [MuralStatus.AGUARDANDO]: { color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-300', icon: <Clock size={14} /> },
  [MuralStatus.FALAR_CORRETOR]: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: <UserSearch size={14} /> },
  [MuralStatus.FALAR_BANCO]: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: <Landmark size={14} /> },
  [MuralStatus.AVANCAR_FASE]: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <ArrowUpRight size={14} /> }
};

const Mural: React.FC<MuralProps> = ({ messages, user, onInteraction }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<MuralStatus>(MuralStatus.EXECUTAR);
  const [important, setImportant] = useState(false);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content) return;
    onInteraction?.();

    await addDoc(collection(db, "mural"), {
      subject,
      content,
      status,
      important,
      authorName: user.email.split('@')[0],
      authorEmail: user.email, // Vinculação do criador_id pelo email
      createdAt: new Date().toISOString(),
      isSeenGlobal: false,
      replies: []
    });

    setSubject('');
    setContent('');
    setStatus(MuralStatus.EXECUTAR);
    setImportant(false);
    setIsFormOpen(false);
  };

  const handleReply = async (msgId: string) => {
    const text = replyText[msgId];
    if (!text) return;
    onInteraction?.();

    await updateDoc(doc(db, "mural", msgId), {
      replies: arrayUnion({
        authorName: user.email.split('@')[0],
        content: text,
        date: new Date().toISOString()
      })
    });

    setReplyText({ ...replyText, [msgId]: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja remover esta corrente de discussão permanentemente?")) {
      await deleteDoc(doc(db, "mural", id));
      onInteraction?.();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Mural de Inteligência SAP</h3>
           <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Comunicação Global</h2>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#1F1F1F] text-white px-8 py-3.5 rounded-2xl flex items-center space-x-3 font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
        >
          <Plus size={18} />
          <span>{isFormOpen ? 'Fechar' : 'Novo Tópico'}</span>
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleCreateMessage} className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-in slide-in-from-top-4">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                 <label className="text-[10px] font-black text-[#8B0000] uppercase tracking-widest">Assunto do Tópico</label>
                 <input 
                   type="text" 
                   className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#8B0000] outline-none"
                   placeholder="Sobre o que vamos falar?"
                   value={subject}
                   onChange={e => setSubject(e.target.value)}
                   required
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-[#8B0000] uppercase tracking-widest">Status da Flag</label>
                 <select 
                   className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#8B0000] outline-none bg-white"
                   value={status}
                   onChange={e => setStatus(e.target.value as MuralStatus)}
                 >
                    {Object.values(MuralStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-[#8B0000] uppercase tracking-widest">Conteúdo da Mensagem</label>
               <textarea 
                 className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold h-32 focus:ring-2 focus:ring-[#8B0000] outline-none"
                 placeholder="Descreva seu comunicado..."
                 value={content}
                 onChange={e => setContent(e.target.value)}
                 required
               />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-3 cursor-pointer">
                 <input type="checkbox" checked={important} onChange={e => setImportant(e.target.checked)} className="w-5 h-5 accent-[#8B0000] rounded" />
                 <span className="text-[10px] font-black uppercase text-gray-500">Marcar como Importante</span>
              </label>
              <button type="submit" className="bg-[#8B0000] text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Publicar Agora</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6">
        {messages.map(msg => {
          const config = STATUS_CONFIG[msg.status] || STATUS_CONFIG[MuralStatus.EXECUTAR];
          // Verificação rigorosa do criador_id pelo email do usuário logado
          const isOwner = user?.email === msg.authorEmail;

          return (
            <div key={msg.id} className={`bg-white rounded-[2.5rem] shadow-xl border-2 ${msg.status === MuralStatus.CRITICO ? 'border-red-500' : 'border-gray-50'} overflow-hidden transition-all hover:border-gray-200`}>
              <div className="p-8 md:p-10">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${config.bg} rounded-2xl flex items-center justify-center ${config.color} font-black text-lg border ${config.border}`}>
                         {msg.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <div className="flex items-center space-x-3">
                            <h4 className="text-xl font-black text-gray-900 tracking-tighter">{msg.subject}</h4>
                            <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-[9px] font-black uppercase ${config.bg} ${config.color}`}>
                               {config.icon} <span>{msg.status}</span>
                            </span>
                         </div>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Por {msg.authorName} • {new Date(msg.createdAt).toLocaleString()}</p>
                      </div>
                   </div>
                   
                   {/* CONTROLE DE ACESSO: SÓ O CRIADOR PODE EXCLUIR OU EDITAR */}
                   {isOwner && (
                     <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => alert("Função de edição em breve.")} 
                          className="p-2 text-gray-300 hover:text-blue-600 transition-colors"
                          title="Editar Mensagem"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(msg.id)} 
                          className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                          title="Excluir Tópico"
                        >
                          <Trash2 size={18} />
                        </button>
                     </div>
                   )}
                </div>

                <div className="bg-gray-50/50 p-6 rounded-2xl text-sm text-gray-700 font-bold leading-relaxed mb-8 border border-gray-100">
                   {msg.content}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                   <button 
                     onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                     className="flex items-center space-x-3 text-[10px] font-black uppercase text-gray-400 hover:text-[#8B0000] transition-colors"
                   >
                      <MessageSquare size={16} />
                      <span>{msg.replies?.length || 0} Interações</span>
                      <ChevronDown size={14} className={`transform transition-transform ${expandedId === msg.id ? 'rotate-180' : ''}`} />
                   </button>
                   
                   <div className="flex-1 max-w-lg ml-8 flex space-x-2">
                      <input 
                        type="text" 
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:bg-white focus:border-[#8B0000] transition-all" 
                        placeholder="Responder a esta discussão..."
                        value={replyText[msg.id] || ''}
                        onChange={e => setReplyText({...replyText, [msg.id]: e.target.value})}
                        onKeyDown={e => e.key === 'Enter' && handleReply(msg.id)}
                      />
                      <button 
                        onClick={() => handleReply(msg.id)} 
                        className="p-2 bg-[#8B0000] text-white rounded-xl hover:bg-red-800 transition-colors"
                      >
                        <Send size={14} />
                      </button>
                   </div>
                </div>

                {expandedId === msg.id && (
                  <div className="mt-8 space-y-4 pt-8 border-t border-gray-100 animate-in slide-in-from-bottom-2 duration-300">
                     {msg.replies?.map((reply, i) => (
                       <div key={i} className="flex items-start space-x-4 pl-8 border-l-2 border-gray-100 py-2 group">
                          <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[9px] font-black text-gray-400 shrink-0 uppercase group-hover:border-[#8B0000] transition-colors">
                             {reply.authorName.charAt(0)}
                          </div>
                          <div className="flex-1">
                             <div className="flex items-center space-x-3 mb-1">
                                <span className="text-[10px] font-black text-gray-900">{reply.authorName}</span>
                                <span className="text-[8px] font-bold text-gray-300 uppercase">{new Date(reply.date).toLocaleTimeString()}</span>
                             </div>
                             <p className="text-xs text-gray-600 font-bold">{reply.content}</p>
                          </div>
                       </div>
                     ))}
                     {(!msg.replies || msg.replies.length === 0) && (
                       <p className="text-center py-4 text-[10px] font-black uppercase text-gray-300 tracking-widest">Nenhuma interação registrada ainda.</p>
                     )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="py-20 text-center opacity-20">
             <MessageSquare size={64} className="mx-auto mb-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Mural Cloud sem tópicos ativos</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mural;
