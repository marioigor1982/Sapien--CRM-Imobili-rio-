
import React, { useState, useEffect, useRef } from 'react';
import { MuralMessage, MuralStatus, MuralFile, MuralReply } from '../types';
import { db, storage } from '../firebase';
import { collection, addDoc, updateDoc, doc, arrayUnion, arrayRemove, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Paperclip, Send, Trash2, FileText, Clock, ThumbsUp, Search, Filter, Calendar, Plus, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface MuralProps {
  messages: MuralMessage[];
  user: any;
  onInteraction?: () => void;
}

const STATUS_UI: Record<MuralStatus, { color: string; bg: string }> = {
  [MuralStatus.CRITICO]: { color: 'text-red-700', bg: 'bg-red-100' },
  [MuralStatus.IMPORTANTE]: { color: 'text-amber-700', bg: 'bg-amber-100' },
  [MuralStatus.EXECUTAR]: { color: 'text-blue-700', bg: 'bg-blue-100' },
  [MuralStatus.AGUARDANDO]: { color: 'text-slate-700', bg: 'bg-slate-100' },
  [MuralStatus.FALAR_CORRETOR]: { color: 'text-orange-700', bg: 'bg-orange-100' },
  [MuralStatus.FALAR_BANCO]: { color: 'text-indigo-700', bg: 'bg-indigo-100' },
  [MuralStatus.AVANCAR_FASE]: { color: 'text-emerald-700', bg: 'bg-emerald-100' }
};

const Mural: React.FC<MuralProps> = ({ messages, user, onInteraction }) => {
  const [selectedId, setSelectedId] = useState<string | null>(messages[0]?.id || null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<MuralStatus>(MuralStatus.EXECUTAR);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedId && messages.length > 0) {
      setSelectedId(messages[0].id);
    }
  }, [messages, selectedId]);

  const activeMsg = messages.find(m => m.id === selectedId);

  useEffect(() => {
    if (selectedId && user?.email) {
      const msg = messages.find(m => m.id === selectedId);
      if (msg && (!msg.lido_por || !msg.lido_por.includes(user.email))) {
        markAsRead(selectedId);
      }
    }
  }, [selectedId]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "mural", id), {
        lido_por: arrayUnion(user.email)
      });
    } catch (e) {}
  };

  const handleFileUpload = async (files: File[]): Promise<string | null> => {
    if (files.length === 0) return null;
    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      alert('Arquivo excede o limite de 2MB.');
      return null;
    }
    try {
      const fileRef = ref(storage, `mural/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (e) {
      return null;
    }
  };

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !content) return;
    setUploading('main');
    try {
      const arquivoUrl = await handleFileUpload(selectedFiles);
      const docRef = await addDoc(collection(db, "mural"), {
        titulo, content, status, importante: status === MuralStatus.CRITICO,
        authorName: user.email.split(/[.@]/)[0].toUpperCase(),
        criador_id: user.email,
        createdAt: new Date().toISOString(),
        timestamp_ultima_interacao: serverTimestamp(),
        lido_por: [user.email],
        likes: [],
        arquivos: arquivoUrl ? [{ nome: selectedFiles[0].name, url: arquivoUrl, tipo: selectedFiles[0].type }] : [],
        interacoes: []
      });
      setSelectedId(docRef.id);
      setTitulo(''); setContent(''); setIsFormOpen(false); setSelectedFiles([]);
    } finally {
      setUploading(null);
    }
  };

  const handleReply = async (msgId: string) => {
    const texto = replyText[msgId]?.trim();
    if (!texto && selectedFiles.length === 0) return;
    setUploading(msgId);
    try {
      const arquivoUrl = await handleFileUpload(selectedFiles);
      const novaInteracao: MuralReply = {
        id: crypto.randomUUID(),
        autor: user.email,
        texto: texto || "Anexo compartilhado",
        timestamp: new Date().toISOString(),
        arquivo: arquivoUrl || undefined,
        likes: []
      };
      
      const docRef = doc(db, "mural", msgId);
      // CORREÇÃO CRÍTICA: arrayUnion para garantir acúmulo e zerar lido_por para outros
      await updateDoc(docRef, {
        interacoes: arrayUnion(novaInteracao),
        timestamp_ultima_interacao: serverTimestamp(),
        lido_por: [user.email] 
      });
      
      setReplyText({ ...replyText, [msgId]: '' });
      setSelectedFiles([]);
      onInteraction?.();
    } catch (e) {
      console.error("Erro ao enviar resposta:", e);
    } finally {
      setUploading(null);
    }
  };

  const handleLikeMessage = async (msg: MuralMessage) => {
    const ref = doc(db, "mural", msg.id);
    const hasLiked = msg.likes?.includes(user.email);
    await updateDoc(ref, {
      likes: hasLiked ? arrayRemove(user.email) : arrayUnion(user.email)
    });
  };

  const handleLikeReply = async (msg: MuralMessage, replyId: string) => {
    const ref = doc(db, "mural", msg.id);
    const updatedInteracoes = msg.interacoes.map(reply => {
      if (reply.id === replyId) {
        const likes = reply.likes || [];
        const hasLiked = likes.includes(user.email);
        return {
          ...reply,
          likes: hasLiked ? likes.filter(e => e !== user.email) : [...likes, user.email]
        };
      }
      return reply;
    });
    await updateDoc(ref, { interacoes: updatedInteracoes });
  };

  const filteredMessages = messages.filter(m => 
    m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-[#F8FAFC] overflow-hidden font-sans relative">
      
      {/* PAINEL LATERAL ESQUERDO: LISTA + WIDGETS */}
      <div className="w-full md:w-[360px] lg:w-[400px] border-r border-slate-200 flex flex-col bg-white shrink-0 overflow-y-auto scrollbar-hide">
        
        {/* Entrada Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                <Send size={18} className="rotate-[-45deg]" />
             </div>
             <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Entrada</h2>
          </div>
          <button className="p-2 text-slate-400 hover:text-red-600"><Filter size={18} /></button>
        </div>

        {/* Busca */}
        <div className="px-6 py-4">
           <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="text" placeholder="Pesquisar mural..." 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-100"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Lista de Mensagens */}
        <div className="flex-1 divide-y divide-slate-50">
          {filteredMessages.map((msg) => {
            const isSelected = selectedId === msg.id;
            const isUnread = !msg.lido_por?.includes(user.email);
            const ui = STATUS_UI[msg.status] || STATUS_UI[MuralStatus.EXECUTAR];

            return (
              <div 
                key={msg.id}
                onClick={() => setSelectedId(msg.id)}
                className={`p-6 cursor-pointer transition-all relative ${isSelected ? 'bg-slate-50 border-l-4 border-red-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-black uppercase">
                        {msg.authorName?.charAt(0)}
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none">{msg.authorName}</p>
                        <p className="text-[9px] font-bold text-slate-300 mt-0.5">{new Date(msg.createdAt).toLocaleDateString('pt-BR')}</p>
                     </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg ${ui.bg} ${ui.color} text-[8px] font-black uppercase`}>{msg.status}</span>
                </div>
                <h3 className={`text-sm tracking-tight truncate ${isUnread ? 'font-black text-slate-900' : 'font-semibold text-slate-600'}`}>
                  {msg.titulo}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-medium">{msg.content}</p>
                
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                     <Clock size={12} /> {msg.interacoes?.length || 0} Interações
                  </div>
                  {isUnread && <div className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                </div>
              </div>
            );
          })}
          <button className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Carregar mais tópicos</button>
        </div>

        {/* WIDGETS DE RODAPÉ LATERAL (Outlook Style) */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-8">
           
           {/* Relógio & Status */}
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</h2>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                 <span className="text-[9px] font-black text-emerald-600 uppercase">Online</span>
              </div>
           </div>

           {/* Calendário Widget */}
           <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{currentTime.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                 <div className="flex gap-2">
                    <button className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">{'<'}</button>
                    <button className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">{'>'}</button>
                 </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-4">
                 {['D','S','T','Q','Q','S','S'].map(d => <span key={d} className="text-[9px] font-black text-slate-300">{d}</span>)}
                 {Array.from({length: 31}).map((_, i) => {
                    const day = i + 1;
                    const isToday = day === currentTime.getDate();
                    return (
                       <span key={i} className={`text-[10px] font-bold p-1 rounded-lg ${isToday ? 'bg-red-500 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'}`}>
                          {day}
                       </span>
                    );
                 })}
              </div>
              <div className="pt-4 border-t border-slate-50">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-3">Eventos do Dia</p>
                 <div className="space-y-3">
                    <EventItem color="bg-red-500" title="Reunião Geral" time="10:00 - 11:30" />
                    <EventItem color="bg-blue-500" title="Almoço com TI" time="12:30 - 13:30" />
                 </div>
              </div>
           </div>

           {/* Arquivos Rápidos */}
           <div className="space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={12} /> Arquivos Rápidos</p>
              <button 
                onClick={() => setIsFormOpen(true)}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-100 flex items-center justify-center gap-2"
              >
                 <Paperclip size={14} /> Anexar Imagens ou PDFs
              </button>
              <div className="flex justify-center gap-4 text-[9px] font-black text-slate-400 uppercase">
                 <span className="flex items-center gap-1"><ImageIcon size={10} /> JPG, PNG</span>
                 <span className="flex items-center gap-1"><FileText size={10} /> PDF, DOC</span>
              </div>
           </div>

        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (MENSAGEM SELECIONADA) */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden min-w-0">
        {activeMsg ? (
          <>
            {/* Header da Discussão */}
            <div className="p-8 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center text-3xl font-black shadow-2xl">
                    {activeMsg.authorName?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                       <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{activeMsg.titulo}</h1>
                       <span className={`px-3 py-1 rounded-full ${STATUS_UI[activeMsg.status]?.bg} ${STATUS_UI[activeMsg.status]?.color} text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-100`}>
                          {activeMsg.status}
                       </span>
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">
                      De: <span className="text-red-500">{activeMsg.authorName}</span> • Enviado em {new Date(activeMsg.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleLikeMessage(activeMsg)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMsg.likes?.includes(user.email) ? 'bg-red-600 text-white shadow-xl shadow-red-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    <ThumbsUp size={16} /> {activeMsg.likes?.length || 0}
                  </button>
                  {user.email === activeMsg.criador_id && (
                    <button onClick={() => deleteDoc(doc(db, "mural", activeMsg.id))} className="p-3 text-slate-300 hover:text-red-600 transition-colors">
                      <Trash2 size={22} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Scroll da Conversa */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide bg-slate-50/30">
              
              {/* Post Principal */}
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4">
                <div className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                  {activeMsg.content}
                </div>
                {activeMsg.arquivos && activeMsg.arquivos.length > 0 && (
                  <div className="mt-10 pt-10 border-t border-slate-50 flex flex-wrap gap-4">
                    {activeMsg.arquivos.map((file, idx) => (
                      <a 
                        key={idx} href={file.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-4 bg-slate-50 hover:bg-red-50 border border-slate-200 p-4 rounded-3xl transition-all group"
                      >
                        <div className="p-3 bg-white rounded-xl group-hover:text-red-500 text-slate-400 shadow-sm transition-colors">
                          <FileText size={20} />
                        </div>
                        <div className="text-left">
                           <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{file.nome}</p>
                           <p className="text-[10px] font-bold text-slate-400">Ver documento indexado</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Linha de Tempo / Threads */}
              <div className="space-y-8 pb-10">
                <div className="flex items-center gap-4 px-4">
                   <div className="h-px bg-slate-200 flex-1"></div>
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Histórico de Interações</span>
                   <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                
                {activeMsg.interacoes?.map((reply) => (
                  <div key={reply.id} className="flex gap-6 animate-in slide-in-from-bottom-4 group">
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 text-slate-900 shadow-sm">
                      {reply.autor?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative group transition-all hover:shadow-md">
                        <div className="flex justify-between items-center mb-3">
                           <div className="flex items-center gap-3">
                              <span className="text-[11px] font-black text-red-600 uppercase tracking-widest">{reply.autor?.split('@')[0]}</span>
                              <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(reply.timestamp).toLocaleString('pt-BR')}</span>
                           </div>
                           <button 
                             onClick={() => handleLikeReply(activeMsg, reply.id)}
                             className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black transition-all ${reply.likes?.includes(user.email) ? 'bg-red-500 text-white' : 'text-slate-300 hover:text-red-500'}`}
                           >
                              <ThumbsUp size={12} /> {reply.likes?.length || 0}
                           </button>
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{reply.texto}</p>
                        
                        {reply.arquivo && (
                          <div className="mt-4 pt-4 border-t border-slate-50">
                             <a href={reply.arquivo} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-red-600 transition-colors">
                               <FileText size={14} /> DOCUMENTO ANEXADO
                             </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barra de Resposta Outlook Style */}
            <div className="p-8 bg-white border-t border-slate-200 shrink-0">
              <div className="relative">
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] py-5 pl-8 pr-48 text-sm font-medium focus:ring-4 focus:ring-red-100 focus:bg-white outline-none resize-none transition-all h-24"
                  placeholder="Responder a esta discussão..."
                  value={replyText[activeMsg.id] || ''}
                  onChange={e => setReplyText({...replyText, [activeMsg.id]: e.target.value})}
                />
                <div className="absolute right-6 bottom-6 flex items-center gap-3">
                  <button 
                    onClick={() => replyFileInputRef.current?.click()}
                    className={`p-3 rounded-2xl transition-all ${selectedFiles.length > 0 ? 'bg-emerald-500 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-100 hover:text-red-600'}`}
                    title="Anexar PDF ou Imagem (Máx 2MB)"
                  >
                    <Paperclip size={24} />
                    <input type="file" ref={replyFileInputRef} className="hidden" accept=".pdf,image/*" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
                  </button>
                  <button 
                    onClick={() => handleReply(activeMsg.id)}
                    disabled={uploading === activeMsg.id}
                    className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl shadow-red-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {uploading === activeMsg.id ? <Clock size={24} className="animate-spin" /> : <Send size={24} />}
                  </button>
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="flex items-center gap-3 mt-4 px-6 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 w-fit">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest truncate max-w-xs">{selectedFiles[0].name}</p>
                   <button onClick={() => setSelectedFiles([])} className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20 text-center">
             <div className="w-40 h-40 bg-slate-100 rounded-[4rem] flex items-center justify-center mb-10 border border-slate-200">
                <Send size={64} className="rotate-[-45deg] opacity-10" />
             </div>
             <h3 className="text-2xl font-black text-slate-400 tracking-tighter uppercase mb-4">Escolha uma mensagem</h3>
             <p className="text-sm font-bold max-w-sm text-slate-300">Central de Inteligência Sapien: Todas as mensagens e interações de outros usuários serão acumuladas aqui em tempo real.</p>
          </div>
        )}
      </div>

      {/* BOTÃO FLUTUANTE DE NOVO TÓPICO (Outlook Style) */}
      <button 
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-red-600 text-white rounded-full shadow-[0_20px_50px_rgba(220,38,38,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-[90] group"
      >
        <Plus size={36} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* MODAL DE CRIAÇÃO (Inspirado no visual SAP/Outlook) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-slate-900 p-10 flex justify-between items-center text-white">
                 <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase">Nova Discussão SAP</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1">Sincronização Cloud Ativa</p>
                 </div>
                 <button onClick={() => setIsFormOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                    <X size={32} />
                 </button>
              </div>
              <form onSubmit={handleCreateMessage} className="p-10 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 relative">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Assunto Principal</label>
                       <div className="relative group">
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-5 pr-14 text-sm font-bold focus:ring-4 focus:ring-red-100 transition-all" 
                            value={titulo} 
                            onChange={e => setTitulo(e.target.value)} 
                            placeholder="Ex: Atualização de Tabelas..."
                            required 
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-100 hover:scale-110 transition-transform">
                             <Plus size={16} />
                          </button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Classificação Sapien</label>
                       <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-red-100 outline-none" value={status} onChange={e => setStatus(e.target.value as MuralStatus)}>
                          {Object.values(MuralStatus).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Corpo da Mensagem</label>
                    <textarea className="w-full bg-slate-50 border-none rounded-3xl py-6 px-6 text-sm font-medium h-48 focus:ring-4 focus:ring-red-100 outline-none resize-none" value={content} onChange={e => setContent(e.target.value)} placeholder="Descreva os detalhes importantes para todo o time..." required />
                 </div>
                 <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 text-slate-400 hover:text-red-600 transition-colors">
                       <div className={`p-3 rounded-2xl ${selectedFiles.length > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Paperclip size={20} />
                       </div>
                       <span className="text-[11px] font-black uppercase tracking-widest">{selectedFiles.length > 0 ? 'Anexo pronto' : 'Anexar (2MB)'}</span>
                       <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
                    </button>
                    <button type="submit" disabled={uploading === 'main'} className="bg-red-600 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-red-200 hover:scale-105 transition-all flex items-center gap-3">
                       {uploading === 'main' ? <Clock className="animate-spin" /> : <Send size={18} className="rotate-[-45deg]" />}
                       Publicar Agora
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

const EventItem = ({ color, title, time }: { color: string, title: string, time: string }) => (
  <div className="flex items-center gap-3 group">
     <div className={`w-1 h-6 ${color} rounded-full`}></div>
     <div>
        <p className="text-[10px] font-black text-slate-700 leading-none mb-1 group-hover:text-red-600 transition-colors">{title}</p>
        <p className="text-[9px] font-bold text-slate-300 leading-none">{time}</p>
     </div>
  </div>
);

export default Mural;
