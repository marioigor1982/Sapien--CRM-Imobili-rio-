
import React, { useState } from 'react';
import { MuralMessage } from '../types';
import { Send, MessageSquare, User, Clock, Plus, Trash2, Mail, ChevronDown } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, arrayUnion, deleteDoc } from 'firebase/firestore';

interface MuralProps {
  messages: MuralMessage[];
  user: any;
}

const Mural: React.FC<MuralProps> = ({ messages, user }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content) return;

    await addDoc(collection(db, "mural"), {
      subject,
      content,
      authorName: user.email.split('@')[0],
      authorEmail: user.email,
      createdAt: new Date().toISOString(),
      replies: []
    });

    setSubject('');
    setContent('');
    setIsFormOpen(false);
  };

  const handleReply = async (msgId: string) => {
    const text = replyText[msgId];
    if (!text) return;

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
    if (confirm("Deseja remover esta corrente de comunicação?")) {
      await deleteDoc(doc(db, "mural", id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Mural de Inteligência SAP</h3>
           <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Comunicação Global Cloud</h2>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#1F1F1F] text-white px-8 py-3.5 rounded-2xl flex items-center justify-center space-x-3 font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all"
        >
          <Plus size={18} />
          <span>{isFormOpen ? 'Fechar Mural' : 'Nova Corrente'}</span>
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleCreateMessage} className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-6">
            <div className="space-y-1.5">
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
               <label className="text-[10px] font-black text-[#8B0000] uppercase tracking-widest">Conteúdo da Mensagem</label>
               <textarea 
                 className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold h-32 focus:ring-2 focus:ring-[#8B0000] outline-none"
                 placeholder="Descreva seu comunicado para todos os usuários..."
                 value={content}
                 onChange={e => setContent(e.target.value)}
                 required
               />
            </div>
            <button type="submit" className="w-full py-4 bg-[#8B0000] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center space-x-3 hover:scale-105 transition-all">
               <Send size={16} />
               <span>Publicar para Todos</span>
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden group hover:border-[#8B0000] transition-all">
            <div className="p-8 md:p-10">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#8B0000] font-black text-lg shadow-inner">
                       {msg.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                       <h4 className="text-xl font-black text-gray-900 tracking-tighter leading-none">{msg.subject}</h4>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Por {msg.authorName} • {new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                 </div>
                 {user.email === msg.authorEmail && (
                   <button onClick={() => handleDelete(msg.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                 )}
              </div>

              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 text-sm text-gray-700 font-bold leading-relaxed mb-8">
                 {msg.content}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                 <button 
                   onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                   className="flex items-center space-x-3 text-[10px] font-black uppercase text-gray-400 hover:text-[#8B0000] transition-colors"
                 >
                    <MessageSquare size={16} />
                    <span>{msg.replies?.length || 0} Respostas na Corrente</span>
                    <ChevronDown size={14} className={`transform transition-transform ${expandedId === msg.id ? 'rotate-180' : ''}`} />
                 </button>
                 
                 <div className="flex-1 max-w-lg ml-8 flex space-x-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-[#8B0000]" 
                      placeholder="Responder..."
                      value={replyText[msg.id] || ''}
                      onChange={e => setReplyText({...replyText, [msg.id]: e.target.value})}
                      onKeyDown={e => e.key === 'Enter' && handleReply(msg.id)}
                    />
                    <button onClick={() => handleReply(msg.id)} className="p-2 bg-[#8B0000] text-white rounded-xl shadow-lg hover:scale-105 transition-all"><Send size={14} /></button>
                 </div>
              </div>

              {expandedId === msg.id && (
                <div className="mt-8 space-y-4 pt-8 border-t border-gray-50 animate-in slide-in-from-bottom-2">
                   {msg.replies?.map((reply, i) => (
                     <div key={i} className="flex items-start space-x-4 pl-8 border-l-2 border-gray-100 py-2">
                        <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[9px] font-black text-gray-400 shrink-0 uppercase">
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
                   {(!msg.replies || msg.replies.length === 0) && <p className="text-center text-[9px] font-black uppercase text-gray-300 py-4">Nenhuma resposta nesta corrente</p>}
                </div>
              )}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="py-32 text-center opacity-20">
             <Mail size={80} strokeWidth={1} className="mx-auto mb-6" />
             <p className="text-[11px] font-black uppercase tracking-[0.5em]">Silêncio Total no Mural Cloud</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mural;
