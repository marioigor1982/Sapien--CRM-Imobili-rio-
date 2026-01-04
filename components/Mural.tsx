
import React, { useState, useEffect } from 'react';
import { MuralMessage, MuralStatus } from '../types';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, arrayUnion, deleteDoc } from 'firebase/firestore';

interface MuralProps {
  messages: MuralMessage[];
  user: any;
  onInteraction?: () => void;
}

const STATUS_UI: Record<MuralStatus, { color: string; bg: string; icon: string }> = {
  [MuralStatus.CRITICO]: { color: 'text-red-700', bg: 'bg-red-100', icon: 'report_problem' },
  [MuralStatus.IMPORTANTE]: { color: 'text-amber-700', bg: 'bg-amber-100', icon: 'star' },
  [MuralStatus.EXECUTAR]: { color: 'text-blue-700', bg: 'bg-blue-100', icon: 'play_arrow' },
  [MuralStatus.AGUARDANDO]: { color: 'text-slate-700', bg: 'bg-slate-100', icon: 'hourglass_empty' },
  [MuralStatus.FALAR_CORRETOR]: { color: 'text-orange-700', bg: 'bg-orange-100', icon: 'person_search' },
  [MuralStatus.FALAR_BANCO]: { color: 'text-indigo-700', bg: 'bg-indigo-100', icon: 'account_balance' },
  [MuralStatus.AVANCAR_FASE]: { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: 'trending_up' }
};

const Mural: React.FC<MuralProps> = ({ messages, user, onInteraction }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<MuralStatus>(MuralStatus.EXECUTAR);
  const [important, setImportant] = useState(false);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content) return;
    onInteraction?.();

    await addDoc(collection(db, "mural"), {
      subject,
      content,
      status,
      important,
      authorName: user.email.split(/[.@]/)[0].toUpperCase(),
      authorEmail: user.email,
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
        authorName: user.email.split(/[.@]/)[0].toUpperCase(),
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
    <div className="max-w-7xl mx-auto px-4 pt-2 pb-20 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: FEED DE MENSAGENS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <span className="material-icons-round text-[#ea2a33]">inbox</span>
              Entrada
            </h2>
            <div className="flex space-x-4">
              <button 
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="text-sm font-bold text-[#ea2a33] hover:text-red-700 transition flex items-center gap-1 uppercase tracking-wider"
              >
                <span className="material-icons-round text-base">{isFormOpen ? 'close' : 'add_circle'}</span>
                {isFormOpen ? 'Cancelar' : 'Novo Tópico'}
              </button>
              <button className="text-sm font-medium text-slate-400 hover:text-[#ea2a33] transition flex items-center gap-1">
                <span className="material-icons-round text-base">filter_list</span>
                Filtrar
              </button>
            </div>
          </div>

          {/* FORMULÁRIO DE NOVA MENSAGEM */}
          {isFormOpen && (
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 mb-8 animate-in slide-in-from-top-4 duration-300">
              <form onSubmit={handleCreateMessage} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Assunto do Tópico..." 
                    className="w-full border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-red-100 focus:border-[#ea2a33] outline-none"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                  />
                  <select 
                    className="w-full border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-red-100 outline-none bg-white"
                    value={status}
                    onChange={e => setStatus(e.target.value as MuralStatus)}
                  >
                    {Object.values(MuralStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <textarea 
                  placeholder="Descreva o comunicado detalhadamente..." 
                  className="w-full border-slate-200 rounded-xl py-3 px-4 text-sm font-medium h-32 focus:ring-2 focus:ring-red-100 outline-none"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                />
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="rounded text-[#ea2a33] focus:ring-red-100 w-5 h-5 border-slate-300" 
                      checked={important}
                      onChange={e => setImportant(e.target.checked)}
                    />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 uppercase tracking-widest">Importante</span>
                  </label>
                  <button type="submit" className="bg-[#ea2a33] hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-200 transition-all active:scale-95">
                    Publicar no Mural
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LISTA DE MENSAGENS */}
          <div className="space-y-6">
            {messages.map((msg) => {
              const ui = STATUS_UI[msg.status] || STATUS_UI[MuralStatus.EXECUTAR];
              const isOwner = user?.email === msg.authorEmail;
              const isExpanded = expandedId === msg.id;

              return (
                <article key={msg.id} className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden transition-all hover:shadow-md animate-in fade-in duration-300">
                  <div className="p-5 pb-2">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg border border-slate-200 shrink-0 uppercase">
                          {msg.authorName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg text-slate-900 leading-tight">{msg.subject}</h3>
                            <span className={`px-2 py-0.5 rounded-full ${ui.bg} ${ui.color} text-[10px] font-black uppercase tracking-wide border border-current/20 flex items-center gap-1`}>
                              <span className="material-icons-round text-[10px]">{ui.icon}</span>
                              {msg.status}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-slate-400 mt-0.5">
                            <span className="font-bold text-slate-500 uppercase">{msg.authorName}</span>
                            <span className="mx-1.5">•</span>
                            <span>{new Date(msg.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* BOTÃO DE MAIS OPÇÕES / EXCLUIR - APENAS PARA O DONO */}
                      {isOwner && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleDelete(msg.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                            title="Excluir Tópico"
                          >
                            <span className="material-icons-round text-xl">delete_outline</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-3">
                    <div className="bg-slate-50 rounded-xl p-4 text-slate-700 text-sm font-medium leading-relaxed border border-slate-100/50">
                      <p>{msg.content}</p>
                    </div>
                  </div>

                  {/* INTERAÇÕES E RESPOSTAS */}
                  <div className="px-5 py-2 flex items-center justify-between border-b border-slate-50">
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#ea2a33] transition uppercase tracking-widest"
                    >
                      <span className="material-icons-round text-base">chat_bubble_outline</span>
                      {msg.replies?.length || 0} Interações
                      <span className="material-icons-round text-base transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                    </button>
                  </div>

                  {/* ÁREA DE RESPOSTAS EXPANDIDA */}
                  {isExpanded && (
                    <div className="bg-slate-50/50 p-5 space-y-4 border-b border-slate-50">
                      {msg.replies?.map((reply, idx) => (
                        <div key={idx} className="flex gap-3 animate-in slide-in-from-left-2">
                          <div className="h-7 w-7 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-black shrink-0 uppercase">
                            {reply.authorName.charAt(0)}
                          </div>
                          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black text-slate-800 uppercase">{reply.authorName}</span>
                              <span className="text-[9px] text-slate-300 font-bold">{new Date(reply.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                      {(!msg.replies || msg.replies.length === 0) && (
                        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">Sem interações neste tópico</p>
                      )}
                    </div>
                  )}

                  {/* CAMPO DE RESPOSTA RÁPIDA */}
                  <div className="p-4 bg-slate-50">
                    <div className="relative flex items-center gap-2">
                      <input 
                        className="w-full bg-white border-none rounded-xl py-3 pl-4 pr-12 text-sm shadow-sm focus:ring-2 focus:ring-red-100 placeholder-slate-300 text-slate-800 font-medium" 
                        placeholder="Responder a esta discussão..." 
                        type="text"
                        value={replyText[msg.id] || ''}
                        onChange={e => setReplyText({ ...replyText, [msg.id]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleReply(msg.id)}
                      />
                      <button 
                        onClick={() => handleReply(msg.id)}
                        className="absolute right-2 p-2 bg-[#ea2a33] hover:bg-red-700 text-white rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center"
                      >
                        <span className="material-icons-round text-lg transform -rotate-45 translate-x-0.5 -translate-y-0.5">send</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            
            {messages.length === 0 && (
              <div className="py-20 text-center opacity-30">
                <span className="material-icons-round text-6xl text-slate-300 mb-4">forum</span>
                <p className="text-xs font-black uppercase tracking-[0.4em]">Mural Vazio</p>
              </div>
            )}
            
            <div className="text-center py-4">
              <button className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#ea2a33] transition bg-slate-100 px-6 py-3 rounded-xl border border-slate-200">
                Carregar mais tópicos
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: WIDGETS SAP */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* WIDGET RELÓGIO */}
          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 flex items-center justify-between relative overflow-hidden transition-all hover:shadow-lg">
            <div className="relative z-10">
              <div className="text-5xl font-black text-slate-800 tracking-tighter tabular-nums">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-sm text-slate-500 font-bold mt-1 flex items-center gap-1.5 uppercase tracking-tight">
                <span className="material-icons-round text-sm text-[#ea2a33]">today</span>
                {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </div>
            </div>
            <div className="relative z-10 flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-green-700 uppercase tracking-wide">Cloud Online</span>
              </div>
            </div>
            <span className="material-icons-round text-[9rem] absolute -right-6 -bottom-10 text-slate-50 pointer-events-none select-none">schedule</span>
          </div>

          {/* WIDGET ARQUIVOS */}
          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6">
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <span className="material-icons-round text-[#ea2a33]">folder_open</span>
              Arquivos Rápidos
            </h3>
            <button className="w-full bg-[#ea2a33] hover:bg-red-700 active:scale-[0.98] text-white font-black py-4 px-4 rounded-2xl shadow-lg shadow-red-100 transition-all duration-200 flex items-center justify-center gap-2 group text-xs uppercase tracking-widest">
              <span className="material-icons-round text-xl group-hover:-rotate-12 transition-transform">attach_file</span>
              <span>Anexar Imagens ou PDFs</span>
            </button>
            <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              <span className="flex items-center gap-1"><span className="material-icons-round text-sm">image</span> JPG, PNG</span>
              <span className="flex items-center gap-1"><span className="material-icons-round text-sm">description</span> PDF, DOC</span>
            </div>
          </div>

          {/* WIDGET CALENDÁRIO */}
          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-widest">
                <span className="material-icons-round text-[#ea2a33]">calendar_month</span>
                Janeiro 2026
              </h3>
              <div className="flex gap-1">
                <button className="p-1 text-slate-300 hover:text-slate-600 rounded-full hover:bg-slate-50 transition">
                  <span className="material-icons-round text-xl">chevron_left</span>
                </button>
                <button className="p-1 text-slate-300 hover:text-slate-600 rounded-full hover:bg-slate-50 transition">
                  <span className="material-icons-round text-xl">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-[9px] font-black text-slate-300 mb-3 uppercase tracking-tighter">
              <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {[28, 29, 30, 31, 1, 2, 3].map((d, i) => <div key={i} className="py-2 text-slate-200">{d}</div>)}
              <div className="py-2 relative bg-[#ea2a33] text-white font-black rounded-xl shadow-md shadow-red-100">
                4
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
              </div>
              {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map(d => (
                <div key={d} className="py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl cursor-pointer relative">
                  {d}
                  {d === 9 && <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-[#ea2a33] rounded-full"></span>}
                  {d === 15 && <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-blue-500 rounded-full"></span>}
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-slate-50 pt-4">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Próximos Eventos</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 transition cursor-pointer hover:bg-white hover:shadow-sm">
                  <div className="w-1 h-8 bg-[#ea2a33] rounded-full"></div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Reunião Geral</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">10:00 - 11:30</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 transition cursor-pointer hover:bg-white hover:shadow-sm">
                  <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Sincronização TI</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">14:00 - 15:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mural;
