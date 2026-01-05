
import React, { useState, useEffect, useRef } from 'react';
import { MuralMessage, MuralStatus, MuralFile, MuralReply } from '../types';
import { db, storage } from '../firebase';
import { collection, addDoc, updateDoc, doc, arrayUnion, arrayRemove, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Paperclip, Send, Trash2, FileText, Clock, ThumbsUp, Search, Filter, Calendar, Plus, X, Image as ImageIcon, CheckCircle2, ChevronDown } from 'lucide-react';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Seleção automática da primeira mensagem se nenhuma estiver selecionada
  useEffect(() => {
    if (!selectedId && messages.length > 0) {
      setSelectedId(messages[0].id);
    }
  }, [messages, selectedId]);

  // Scroll automático para o fim da conversa ao mudar de tópico ou receber nova interação
  const activeMsg = messages.find(m => m.id === selectedId);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedId, activeMsg?.interacoes?.length]);

  // Marcar como lido individualmente
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
    } catch (e) {
      console.error("Erro ao marcar como lido", e);
    }
  };

  const handleFileUpload = async (files: File[]): Promise<string | null> => {
    if (files.length === 0) return null;
    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      alert('O arquivo selecionado excede o limite de 2MB do Sapien Cloud.');
      return null;
    }
    try {
      const fileRef = ref(storage, `mural/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (e) {
      console.error("Erro no upload", e);
      return null;
    }
  };

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !content) return;
    setUploading('main');
    try {
      const arquivoUrl = await handleFileUpload(selectedFiles);
      const docData = {
        titulo, 
        content, 
        status, 
        importante: status === MuralStatus.CRITICO,
        authorName: user.email.split(/[.@]/)[0].toUpperCase(),
        criador_id: user.email,
        createdAt: new Date().toISOString(),
        timestamp_ultima_interacao: serverTimestamp(),
        lido_por: [user.email],
        likes: [],
        arquivos: arquivoUrl ? [{ nome: selectedFiles[0].name, url: arquivoUrl, tipo: selectedFiles[0].type }] : [],
        interacoes: []
      };
      const docRef = await addDoc(collection(db, "mural"), docData);
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
        id: crypto.randomUUID(), // ID ÚNICO PARA GARANTIR O ACÚMULO NO ARRAYUNION
        autor: user.email,
        texto: texto || "Arquivo compartilhado na discussão",
        timestamp: new Date().toISOString(),
        arquivo: arquivoUrl || undefined,
        likes: []
      };
      
      const docRef = doc(db, "mural", msgId);
      // O lido_por é resetado para quem comentou, fazendo com que apareça como "não lido" para os outros
      await updateDoc(docRef, {
        interacoes: arrayUnion(novaInteracao),
        timestamp_ultima_interacao: serverTimestamp(),
        lido_por: [user.email] 
      });
      
      setReplyText({ ...replyText, [msgId]: '' });
      setSelectedFiles([]);
      onInteraction?.();
    } catch (e) {
      console.error("Erro ao enviar resposta no acumulador", e);
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
      
      {/* PAINEL LATERAL ESQUERDO: LISTA DE ENTRADA + CALENDÁRIO */}
      <div className="w-full md:w-[380px] lg:w-[420px] border-r border-slate-200 flex flex-col bg-white shrink-0 overflow-hidden">
        
        {/* Header da Coluna */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl">
                <Send size={20} className="rotate-[-45deg] translate-y-[-1px]" />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase leading-none">Entrada</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Discussões Ativas</p>
             </div>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100"
          >
            <Plus size={14} /> Novo
          </button>
        </div>

        {/* Busca e Filtro */}
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-50">
           <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="text" placeholder="Pesquisar no histórico..." 
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-red-100 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Lista de Tópicos Acumulados */}
        <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-slate-50">
          {filteredMessages.map((msg) => {
            const isSelected = selectedId === msg.id;
            const isUnread = !msg.lido_por?.includes(user.email);
            const ui = STATUS_UI[msg.status] || STATUS_UI[MuralStatus.EXECUTAR];

            return (
              <div 
                key={msg.id}
                onClick={() => setSelectedId(msg.id)}
                className={`p-6 cursor-pointer transition-all relative group ${isSelected ? 'bg-red-50/30 border-l-4 border-red-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                     <div className={`w-9 h-9 rounded-2xl ${isSelected ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'} flex items-center justify-center text-[11px] font-black uppercase shadow-lg transition-colors`}>
                        {msg.authorName?.charAt(0)}
                     </div>
                     <div>
                        <p className={`text-[10px] font-black uppercase leading-none ${isSelected ? 'text-red-600' : 'text-slate-400'}`}>{msg.authorName}</p>
                        <p className="text-[9px] font-bold text-slate-300 mt-0.5">{new Date(msg.createdAt).toLocaleDateString('pt-BR')}</p>
                     </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg ${ui.bg} ${ui.color} text-[8px] font-black uppercase border border-white/50`}>{msg.status}</span>
                </div>
                <h3 className={`text-sm tracking-tight truncate mb-1 ${isUnread ? 'font-black text-slate-900' : 'font-semibold text-slate-500'}`}>
                  {msg.titulo}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 font-medium leading-relaxed">{msg.content}</p>
                
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-1 rounded-lg">
                     <Clock size={10} /> {msg.interacoes?.length || 0} INTERAÇÕES
                  </div>
                  {isUnread && <div className="ml-auto w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-200"></div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* WIDGETS INFERIORES (Outlook Style) */}
        <div className="p-8 bg-slate-900 border-t border-slate-100 space-y-8 text-white">
           {/* Relógio & Calendário Compacto */}
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-4xl font-black tracking-tighter leading-none">{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</h2>
                 <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] mt-2">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
              </div>
              <div className="text-right">
                 <div className="bg-white/10 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-black uppercase">Sapien Cloud Online</span>
                 </div>
              </div>
           </div>

           {/* Mini Calendário */}
           <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl text-slate-800">
              <div className="flex items-center justify-between mb-4 px-2">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{currentTime.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                 <div className="flex gap-1">
                    <button className="p-1 hover:text-red-600 transition-colors"><ChevronDown size={14} className="rotate-90" /></button>
                    <button className="p-1 hover:text-red-600 transition-colors"><ChevronDown size={14} className="-rotate-90" /></button>
                 </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold">
                 {['D','S','T','Q','Q','S','S'].map(d => <span key={d} className="text-slate-300 mb-2">{d}</span>)}
                 {Array.from({length: 31}).map((_, i) => {
                    const day = i + 1;
                    const isToday = day === currentTime.getDate();
                    return (
                       <span key={i} className={`p-1.5 rounded-xl transition-all ${isToday ? 'bg-red-600 text-white font-black shadow-lg shadow-red-200' : 'hover:bg-red-50 text-slate-600'}`}>
                          {day}
                       </span>
                    );
                 })}
              </div>
           </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (HISTÓRICO ACUMULADO) */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden min-w-0">
        {activeMsg ? (
          <>
            {/* Header do Tópico Selecionado */}
            <div className="p-8 bg-white border-b border-slate-100 shrink-0 sticky top-0 z-20 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center text-3xl font-black shadow-2xl border-4 border-white">
                    {activeMsg.authorName?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                       <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{activeMsg.titulo}</h1>
                       <span className={`px-3 py-1 rounded-full ${STATUS_UI[activeMsg.status]?.bg} ${STATUS_UI[activeMsg.status]?.color} text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-100`}>
                          {activeMsg.status}
                       </span>
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">
                      Lançado por: <span className="text-red-600">{activeMsg.authorName}</span> • {new Date(activeMsg.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleLikeMessage(activeMsg)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMsg.likes?.includes(user.email) ? 'bg-red-600 text-white shadow-xl shadow-red-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    <ThumbsUp size={16} /> {activeMsg.likes?.length || 0} Curtidas
                  </button>
                  {user.email === activeMsg.criador_id && (
                    <button onClick={() => confirm("Deseja deletar este tópico?") && deleteDoc(doc(db, "mural", activeMsg.id))} className="p-3 text-slate-300 hover:text-red-600 transition-colors">
                      <Trash2 size={24} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Viewport da Conversa Acumulada */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide bg-[#FDFDFD]"
            >
              
              {/* Conteúdo Inicial do Assunto */}
              <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 relative group animate-in fade-in slide-in-from-top-4">
                <div className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap text-lg">
                  {activeMsg.content}
                </div>
                {activeMsg.arquivos && activeMsg.arquivos.length > 0 && (
                  <div className="mt-10 pt-10 border-t border-slate-100 flex flex-wrap gap-4">
                    {activeMsg.arquivos.map((file, idx) => (
                      <a 
                        key={idx} href={file.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-4 bg-slate-50 hover:bg-red-50 border border-slate-200 p-5 rounded-[2rem] transition-all group/file shadow-sm"
                      >
                        <div className="p-3 bg-white rounded-2xl group-hover/file:text-red-600 text-slate-400 shadow-sm transition-colors">
                          <FileText size={24} />
                        </div>
                        <div className="text-left">
                           <p className="text-[12px] font-black text-slate-800 uppercase leading-none mb-1">{file.nome}</p>
                           <p className="text-[10px] font-bold text-slate-400">Clique para abrir documento</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Thread de Interações (Acúmulo) */}
              <div className="space-y-8 pb-10">
                <div className="flex items-center gap-5 px-6">
                   <div className="h-px bg-slate-100 flex-1"></div>
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Histórico Completo</span>
                   <div className="h-px bg-slate-100 flex-1"></div>
                </div>
                
                {activeMsg.interacoes?.map((reply) => (
                  <div key={reply.id} className="flex gap-6 animate-in slide-in-from-bottom-4 group">
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 text-slate-900 shadow-sm transition-transform group-hover:scale-110">
                      {reply.autor?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-white p-7 rounded-[2.8rem] shadow-sm border border-slate-100 relative group transition-all hover:shadow-xl hover:border-red-100">
                        <div className="flex justify-between items-center mb-4">
                           <div className="flex items-center gap-3">
                              <span className="text-[11px] font-black text-red-600 uppercase tracking-widest">{reply.autor?.split('@')[0]}</span>
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{new Date(reply.timestamp).toLocaleString('pt-BR')}</span>
                           </div>
                           <button 
                             onClick={() => handleLikeReply(activeMsg, reply.id)}
                             className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${reply.likes?.includes(user.email) ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-slate-50 text-slate-400 hover:text-red-600'}`}
                           >
                              <ThumbsUp size={14} /> {reply.likes?.length || 0}
                           </button>
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{reply.texto}</p>
                        
                        {reply.arquivo && (
                          <div className="mt-5 pt-5 border-t border-slate-50">
                             <a href={reply.arquivo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-[11px] font-black text-slate-500 hover:text-red-600 transition-colors bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                               <FileText size={16} /> VER ANEXO DA RESPOSTA
                             </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barra de Resposta Outlook Style (Sempre Acumulando) */}
            <div className="p-8 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
              <div className="relative">
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] py-6 pl-8 pr-56 text-sm font-medium focus:ring-8 focus:ring-red-50 focus:bg-white outline-none resize-none transition-all h-28"
                  placeholder="Responder para acumular no histórico..."
                  value={replyText[activeMsg.id] || ''}
                  onChange={e => setReplyText({...replyText, [activeMsg.id]: e.target.value})}
                />
                <div className="absolute right-6 bottom-6 flex items-center gap-3">
                  <button 
                    onClick={() => replyFileInputRef.current?.click()}
                    className={`p-4 rounded-[1.5rem] transition-all ${selectedFiles.length > 0 ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'text-slate-400 hover:bg-slate-100 hover:text-red-600'}`}
                    title="Anexar Prova Cloud (Máx 2MB)"
                  >
                    <Paperclip size={26} />
                    <input type="file" ref={replyFileInputRef} className="hidden" accept=".pdf,image/*" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
                  </button>
                  <button 
                    onClick={() => handleReply(activeMsg.id)}
                    disabled={uploading === activeMsg.id}
                    className="bg-red-600 text-white px-10 py-5 rounded-[1.8rem] shadow-2xl shadow-red-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 font-black text-[12px] uppercase tracking-widest flex items-center gap-3"
                  >
                    {uploading === activeMsg.id ? <Clock size={20} className="animate-spin" /> : <Send size={20} className="rotate-[-45deg] translate-y-[-1px]" />}
                    Enviar
                  </button>
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="flex items-center gap-3 mt-4 px-8 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 w-fit animate-in slide-in-from-left-4">
                   <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                   <p className="text-[11px] font-black text-emerald-800 uppercase tracking-widest truncate max-w-sm">{selectedFiles[0].name}</p>
                   <button onClick={() => setSelectedFiles([])} className="text-red-400 hover:text-red-600 p-1 bg-white rounded-full shadow-sm ml-2"><X size={14} /></button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20 text-center">
             <div className="w-48 h-48 bg-slate-50 rounded-[5rem] flex items-center justify-center mb-10 border-4 border-slate-100">
                <Send size={72} className="rotate-[-45deg] opacity-5" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-4">Escolha uma discussão</h3>
             <p className="text-sm font-bold max-w-sm text-slate-400 leading-relaxed">Selecione um tópico à esquerda para visualizar e acumular interações no Mural Cloud do Sapien CRM.</p>
          </div>
        )}
      </div>

      {/* BOTÃO FLUTUANTE DE NOVO TÓPICO GLOBAL */}
      <button 
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-10 right-10 w-24 h-24 bg-red-600 text-white rounded-full shadow-[0_30px_60px_rgba(220,38,38,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-[90] group border-4 border-white"
      >
        <Plus size={48} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>

      {/* MODAL DE CRIAÇÃO SAP / OUTLOOK STYLE */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] w-full max-w-3xl overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-slate-900 p-12 flex justify-between items-center text-white relative overflow-hidden">
                 <div className="relative z-10">
                    <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Nova Comunicação</h2>
                    <p className="text-[11px] text-red-500 font-black uppercase tracking-[0.5em] mt-3">Disparo Global Sapien Cloud</p>
                 </div>
                 <button onClick={() => setIsFormOpen(false)} className="p-4 hover:bg-white/10 rounded-full transition-colors relative z-10">
                    <X size={36} />
                 </button>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px]"></div>
              </div>
              <form onSubmit={handleCreateMessage} className="p-12 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-8 space-y-2">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-4">Assunto do Tópico</label>
                       <div className="relative flex items-center">
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] py-5 px-8 text-base font-black text-slate-900 focus:ring-8 focus:ring-red-50 focus:bg-white focus:border-red-100 outline-none transition-all placeholder:text-slate-300" 
                            value={titulo} 
                            onChange={e => setTitulo(e.target.value)} 
                            placeholder="Ex: Atualização do Banco Caixa..."
                            required 
                          />
                          <Plus size={24} className="absolute right-6 text-red-600" />
                       </div>
                    </div>
                    <div className="md:col-span-4 space-y-2">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-4">Prioridade</label>
                       <select className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] py-5 px-6 text-sm font-black text-slate-900 focus:ring-8 focus:ring-red-50 outline-none transition-all cursor-pointer" value={status} onChange={e => setStatus(e.target.value as MuralStatus)}>
                          {Object.values(MuralStatus).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-4">Mensagem Principal</label>
                    <textarea className="w-full bg-slate-50 border-2 border-slate-50 rounded-[3rem] py-8 px-8 text-base font-medium h-56 focus:ring-8 focus:ring-red-50 focus:bg-white focus:border-red-100 outline-none resize-none transition-all placeholder:text-slate-300" value={content} onChange={e => setContent(e.target.value)} placeholder="Descreva os detalhes importantes aqui..." required />
                 </div>
                 <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-4 text-slate-500 hover:text-red-600 transition-colors group">
                       <div className={`p-5 rounded-[1.8rem] transition-all ${selectedFiles.length > 0 ? 'bg-emerald-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400 group-hover:bg-red-50 group-hover:text-red-600'}`}>
                          <Paperclip size={24} />
                       </div>
                       <div className="text-left">
                          <p className="text-[12px] font-black uppercase tracking-widest">{selectedFiles.length > 0 ? 'Arquivo Pronto' : 'Anexar Documento'}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Máximo 2MB Cloud</p>
                       </div>
                       <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
                    </button>
                    <button type="submit" disabled={uploading === 'main'} className="bg-red-600 text-white px-16 py-6 rounded-[2.5rem] font-black text-[14px] uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50">
                       {uploading === 'main' ? <Clock className="animate-spin" /> : <Send size={24} className="rotate-[-45deg] translate-y-[-1px]" />}
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
  <div className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-white/5 rounded-2xl transition-all">
     <div className={`w-1.5 h-10 ${color} rounded-full`}></div>
     <div>
        <p className="text-[11px] font-black text-white group-hover:text-red-500 transition-colors leading-none mb-1.5">{title}</p>
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none">{time}</p>
     </div>
  </div>
);

export default Mural;
