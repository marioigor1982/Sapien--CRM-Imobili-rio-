
import React, { useState, useEffect, useRef } from 'react';
import { MuralMessage, MuralStatus, MuralFile, MuralReply } from '../types';
import { db, storage } from '../firebase';
import { collection, addDoc, updateDoc, doc, arrayUnion, arrayRemove, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Paperclip, Send, Trash2, FileText, Clock, ThumbsUp, MoreVertical, Search, Filter, User } from 'lucide-react';

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-seleciona a primeira mensagem se não houver seleção
  useEffect(() => {
    if (!selectedId && messages.length > 0) {
      setSelectedId(messages[0].id);
    }
  }, [messages, selectedId]);

  const activeMsg = messages.find(m => m.id === selectedId);

  // Marcar como lido ao selecionar
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
      alert('Arquivo excede o limite de 2MB do Sapien.');
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
        isSeenGlobal: false,
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
      await updateDoc(doc(db, "mural", msgId), {
        interacoes: arrayUnion(novaInteracao),
        timestamp_ultima_interacao: serverTimestamp(),
        lido_por: [user.email] // Reseta lidos apenas para quem comentou no momento? Na verdade o onSnapshot cuidará do aviso
      });
      setReplyText({ ...replyText, [msgId]: '' });
      setSelectedFiles([]);
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
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden font-sans">
      
      {/* COLUNA ESQUERDA: LISTA DE MENSAGENS (Outlook Style) */}
      <div className="w-full md:w-[380px] border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tighter text-slate-800">Entrada Mural</h2>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="p-1.5 bg-[#ea2a33] text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Send size={18} className="rotate-[-45deg] translate-y-[-1px]" />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" placeholder="Pesquisar discussões..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-100"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-slate-100">
          {filteredMessages.map((msg) => {
            const isSelected = selectedId === msg.id;
            const isUnread = !msg.lido_por?.includes(user.email);
            const ui = STATUS_UI[msg.status] || STATUS_UI[MuralStatus.EXECUTAR];

            return (
              <div 
                key={msg.id}
                onClick={() => setSelectedId(msg.id)}
                className={`p-4 cursor-pointer transition-all relative ${isSelected ? 'bg-red-50/50 border-l-4 border-red-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${ui.color}`}>{msg.status}</span>
                  <span className="text-[9px] font-bold text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className={`text-sm tracking-tight truncate ${isUnread ? 'font-black text-slate-900' : 'font-semibold text-slate-600'}`}>
                  {msg.titulo}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-medium">{msg.content}</p>
                
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex -space-x-2">
                    {msg.interacoes?.slice(0, 3).map((it, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-slate-800 text-[8px] flex items-center justify-center text-white font-black uppercase">
                        {it.autor?.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                    {msg.interacoes?.length || 0} interações
                  </span>
                  {isUnread && <div className="ml-auto w-2.5 h-2.5 bg-[#ea2a33] rounded-full shadow-lg shadow-red-200"></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COLUNA DIREITA: VISUALIZAÇÃO DE CONTEÚDO */}
      <div className="flex-1 flex flex-col bg-slate-50 relative min-w-0">
        {activeMsg ? (
          <>
            {/* Header da Mensagem */}
            <div className="p-8 bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl">
                    {activeMsg.authorName?.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{activeMsg.titulo}</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                      De: <span className="text-red-500">{activeMsg.authorName}</span> • Enviado em {new Date(activeMsg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleLikeMessage(activeMsg)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMsg.likes?.includes(user.email) ? 'bg-[#ea2a33] text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    <ThumbsUp size={16} /> {activeMsg.likes?.length || 0}
                  </button>
                  {user.email === activeMsg.criador_id && (
                    <button className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Scroll de Conteúdo e Conversa */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
              {/* Texto Principal */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="prose prose-sm max-w-none text-slate-700 font-medium leading-relaxed">
                  {activeMsg.content}
                </div>
                {activeMsg.arquivos && activeMsg.arquivos.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-slate-50 flex flex-wrap gap-3">
                    {activeMsg.arquivos.map((file, idx) => (
                      <a 
                        key={idx} href={file.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 bg-slate-50 hover:bg-red-50 border border-slate-100 p-3 rounded-2xl transition-all group"
                      >
                        <div className="p-2 bg-white rounded-lg group-hover:text-red-500 text-slate-400 transition-colors">
                          <FileText size={18} />
                        </div>
                        <div className="text-left">
                           <p className="text-[10px] font-black text-slate-700 uppercase leading-none mb-1">{file.nome}</p>
                           <p className="text-[9px] font-bold text-slate-400">Clique para abrir Cloud</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Thread de Respostas */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">Conversa e Atualizações</h4>
                
                {activeMsg.interacoes?.map((reply) => (
                  <div key={reply.id} className={`flex gap-4 group animate-in slide-in-from-bottom-4`}>
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xs font-black shrink-0 text-slate-900">
                      {reply.autor?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative group">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-black text-red-500 uppercase">{reply.autor?.split('@')[0]}</span>
                           <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(reply.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium">{reply.texto}</p>
                        
                        {reply.arquivo && (
                          <a href={reply.arquivo} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors">
                            <FileText size={14} /> VER ANEXO (PDF/IMG)
                          </a>
                        )}

                        <div className="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-100 transition-all">
                           <button 
                             onClick={() => handleLikeReply(activeMsg, reply.id)}
                             className={`p-2 rounded-full shadow-xl border ${reply.likes?.includes(user.email) ? 'bg-[#ea2a33] text-white' : 'bg-white text-slate-400 hover:text-red-500'}`}
                           >
                              <ThumbsUp size={14} />
                           </button>
                        </div>
                        {reply.likes && reply.likes.length > 0 && (
                          <div className="mt-3 flex items-center gap-1.5">
                             <ThumbsUp size={10} className="text-red-400" />
                             <span className="text-[9px] font-black text-slate-400">{reply.likes.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barra de Resposta (Footer) */}
            <div className="p-6 bg-white border-t border-slate-200">
              <div className="relative group">
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] py-4 pl-6 pr-40 text-sm font-medium focus:ring-4 focus:ring-red-100 focus:bg-white outline-none resize-none transition-all h-20"
                  placeholder="Escrever resposta..."
                  value={replyText[activeMsg.id] || ''}
                  onChange={e => setReplyText({...replyText, [activeMsg.id]: e.target.value})}
                />
                <div className="absolute right-4 bottom-4 flex items-center gap-2">
                  <button 
                    onClick={() => replyFileInputRef.current?.click()}
                    className={`p-2.5 rounded-xl transition-all ${selectedFiles.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:bg-slate-100 hover:text-red-500'}`}
                    title="Anexar (Máx 2MB)"
                  >
                    <Paperclip size={20} />
                    <input type="file" ref={replyFileInputRef} className="hidden" accept=".pdf,image/*" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
                  </button>
                  <button 
                    onClick={() => handleReply(activeMsg.id)}
                    disabled={uploading === activeMsg.id}
                    className="bg-[#ea2a33] text-white p-3 rounded-2xl shadow-xl shadow-red-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {uploading === activeMsg.id ? <Clock size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="flex items-center gap-2 mt-3 px-4">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pendente: {selectedFiles[0].name}</p>
                   <button onClick={() => setSelectedFiles([])} className="text-slate-400 hover:text-red-500 font-bold ml-2">Limpar</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20 text-center">
             <div className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center mb-8">
                <Send size={48} className="rotate-[-45deg] opacity-20" />
             </div>
             <h3 className="text-xl font-black text-slate-400 tracking-tighter uppercase mb-2">Selecione uma discussão</h3>
             <p className="text-xs font-bold max-w-xs">Use o mural global para alinhar processos, compartilhar anexos e curtir atualizações do time.</p>
          </div>
        )}
      </div>

      {/* MODAL DE NOVO TÓPICO */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
                 <div>
                    <h2 className="text-xl font-black tracking-tighter uppercase">Nova Mensagem Cloud</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Disparo Global Sapien</p>
                 </div>
                 <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <XIcon size={24} />
                 </button>
              </div>
              <form onSubmit={handleCreateMessage} className="p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título do Assunto</label>
                       <input type="text" className="w-full border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-4 focus:ring-red-100" value={titulo} onChange={e => setTitulo(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classificação</label>
                       <select className="w-full border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold" value={status} onChange={e => setStatus(e.target.value as MuralStatus)}>
                          {Object.values(MuralStatus).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corpo da Mensagem</label>
                    <textarea className="w-full border-slate-200 rounded-2xl py-4 px-4 text-sm font-medium h-32 focus:ring-4 focus:ring-red-100 outline-none resize-none" value={content} onChange={e => setContent(e.target.value)} required />
                 </div>
                 <div className="flex items-center justify-between pt-4">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 text-slate-500 hover:text-red-500 transition-colors">
                       <Paperclip size={18} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Anexar PDF/IMAGEM</span>
                       <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
                    </button>
                    <button type="submit" disabled={uploading === 'main'} className="bg-[#ea2a33] text-white px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 hover:scale-105 transition-all">
                       {uploading === 'main' ? 'Processando...' : 'Publicar Agora'}
                    </button>
                 </div>
                 {selectedFiles.length > 0 && <p className="text-[10px] font-bold text-emerald-600 text-center mt-2">Arquivo Selecionado: {selectedFiles[0].name}</p>}
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

const XIcon = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default Mural;
