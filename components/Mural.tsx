
import React, { useState, useEffect, useRef } from 'react';
import { MuralMessage, MuralStatus, MuralFile, MuralReply } from '../types';
import { db, storage } from '../firebase';
import { collection, addDoc, updateDoc, doc, arrayUnion, arrayRemove, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Paperclip, Send, Trash2, FileText, Clock, ThumbsUp, Search, 
  Calendar as CalendarIcon, Plus, X, Image as ImageIcon, 
  Share2, MessageSquare, Star, Smile, CheckCircle2, XCircle, MoreHorizontal, Video, Utensils, CalendarDays,
  Reply, Heart, Download
} from 'lucide-react';

interface MuralProps {
  messages: MuralMessage[];
  user: any;
  onInteraction?: () => void;
}

const Mural: React.FC<MuralProps> = ({ messages, user, onInteraction }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<MuralStatus>(MuralStatus.EXECUTAR);
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFileUpload = async (files: File[]): Promise<string | null> => {
    if (files.length === 0) return null;
    const file = files[0];
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
      await addDoc(collection(db, "mural"), {
        titulo, content, status, importante: status === MuralStatus.CRITICO || status === MuralStatus.IMPORTANTE,
        authorName: user.email.split(/[.@]/)[0].toUpperCase(),
        criador_id: user.email,
        createdAt: new Date().toISOString(),
        timestamp_ultima_interacao: serverTimestamp(),
        lido_por: [user.email],
        likes: [],
        arquivos: arquivoUrl ? [{ nome: selectedFiles[0].name, url: arquivoUrl, tipo: selectedFiles[0].type }] : [],
        interacoes: []
      });
      setTitulo(''); setContent(''); setIsFormOpen(false); setSelectedFiles([]);
    } finally {
      setUploading(null);
    }
  };

  /**
   * FUNÇÃO CHAVE: enviarResposta
   * Utiliza arrayUnion com ID Único (UUID) para garantir o acúmulo cronológico
   * de todas as interações no mesmo documento Firestore.
   */
  const handleReply = async (msgId: string) => {
    const texto = replyInputs[msgId]?.trim();
    if (!texto && selectedFiles.length === 0) return;
    
    setUploading(msgId);
    try {
      const arquivoUrl = await handleFileUpload(selectedFiles);
      
      const novaInteracao: MuralReply = {
        id: crypto.randomUUID(), // Essencial para o arrayUnion não ignorar mensagens iguais
        autor: user.email,
        texto: texto || "Documento anexado à discussão cloud.",
        timestamp: new Date().toISOString(),
        arquivo: arquivoUrl || undefined,
        likes: []
      };

      const docRef = doc(db, "mural", msgId);
      
      // Acúmulo Real-time no Firebase
      await updateDoc(docRef, {
        interacoes: arrayUnion(novaInteracao),
        timestamp_ultima_interacao: serverTimestamp(), // Faz o tópico subir no feed global
        lido_por: [user.email] // Reseta visualização para os outros membros (notificação)
      });

      // Limpeza de estado local
      setReplyInputs({ ...replyInputs, [msgId]: '' });
      setSelectedFiles([]);
      if (onInteraction) onInteraction();
    } catch (error) {
      console.error("Erro ao acumular resposta:", error);
      alert("Falha na sincronização cloud. Verifique sua conexão.");
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

  return (
    <div className="bg-[#F1F5F9] min-h-screen font-sans pb-10">
      <main className="max-w-7xl mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: FEED DE MENSAGENS (MANTENDO LAYOUT) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <button 
            onClick={() => setIsFormOpen(true)}
            className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-2xl py-5 px-6 shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
          >
            <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
              <Plus size={20} />
            </div>
            <span className="font-black text-sm uppercase tracking-widest">Nova Mensagem</span>
          </button>

          <div className="space-y-6">
            {messages.map((msg) => (
              <article 
                key={msg.id} 
                className={`rounded-2xl shadow-sm border overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                  msg.status === MuralStatus.CRITICO 
                  ? 'bg-[#FFEBEE] border-red-200' 
                  : 'bg-white border-slate-200'
                }`}
              >
                <div className="p-6 relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {msg.status === MuralStatus.CRITICO && (
                        <span className="bg-[#D32F2F] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Crítico</span>
                      )}
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Financeiro</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      {new Date(msg.createdAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 leading-tight mb-4 tracking-tighter">{msg.titulo}</h3>
                  
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-10 w-10 rounded-full bg-red-100 text-[#D32F2F] flex items-center justify-center text-xs font-black border border-red-200 shrink-0">
                      {msg.authorName?.charAt(0)}
                    </div>
                    <div className="text-sm text-slate-600 font-medium leading-relaxed">
                      {msg.content}
                    </div>
                  </div>

                  {msg.status === MuralStatus.CRITICO && (
                    <div className="flex gap-2 mb-6">
                      <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[11px] font-black uppercase py-2.5 rounded-xl shadow-lg shadow-green-200 transition">Aprovar</button>
                      <button className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-black uppercase py-2.5 rounded-xl transition">Negar</button>
                    </div>
                  )}

                  {/* HISTÓRICO ACUMULADO (THREADS) */}
                  {msg.interacoes && msg.interacoes.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-6">
                      {msg.interacoes.map((reply) => (
                        <div key={reply.id} className="flex gap-4 group">
                           <div className="shrink-0 pt-1">
                              {reply.arquivo ? (
                                <div className="h-12 w-10 bg-white border border-slate-200 rounded flex flex-col items-center justify-center shadow-sm">
                                  <FileText size={18} className="text-red-500" />
                                  <span className="text-[8px] font-black text-slate-400 uppercase mt-0.5">PDF</span>
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                                   {reply.autor?.charAt(0).toUpperCase()}
                                </div>
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-1">
                                 <h4 className="text-sm font-black text-slate-900 truncate">{reply.autor?.split('@')[0]}</h4>
                                 <span className="text-[10px] font-bold text-slate-400 shrink-0">{new Date(reply.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                 {reply.texto}
                              </p>
                              <div className="mt-3 flex gap-4">
                                 <button className="text-slate-400 hover:text-red-600 text-[10px] font-black uppercase flex items-center gap-1 transition">
                                    <Reply size={14} /> Responder
                                 </button>
                                 <button className="text-slate-400 hover:text-red-600 text-[10px] font-black uppercase flex items-center gap-1 transition">
                                    <Heart size={14} /> Curtir
                                 </button>
                                 {reply.arquivo && (
                                   <a href={reply.arquivo} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-[10px] font-black uppercase flex items-center gap-1">
                                      <Download size={14} /> Baixar
                                   </a>
                                 )}
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BARRA DE RESPOSTA RÁPIDA (ACÚMULO) */}
                <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-grow relative">
                      <input 
                        type="text" 
                        placeholder="Responder rapidamente..." 
                        className="w-full bg-white border-none rounded-xl py-3 pl-4 pr-12 text-sm font-bold shadow-sm focus:ring-1 focus:ring-[#D32F2F] placeholder:text-slate-300 transition-all"
                        value={replyInputs[msg.id] || ''}
                        onChange={e => setReplyInputs({...replyInputs, [msg.id]: e.target.value})}
                        onKeyDown={e => e.key === 'Enter' && handleReply(msg.id)}
                      />
                      <button 
                        onClick={() => replyFileInputRef.current?.click()}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${selectedFiles.length > 0 ? 'text-green-600' : 'text-slate-300 hover:text-red-600'}`}
                      >
                        <Paperclip size={18} />
                        <input type="file" ref={replyFileInputRef} className="hidden" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleReply(msg.id)}
                      disabled={uploading === msg.id}
                      className="bg-slate-200 hover:bg-[#D32F2F] hover:text-white text-slate-600 p-3 rounded-xl transition shadow-sm disabled:opacity-50"
                    >
                      {uploading === msg.id ? <Clock size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </div>
              </article>
            ))}

            <div className="text-center pt-4">
              <button className="text-[11px] font-black text-slate-400 hover:text-[#D32F2F] transition uppercase tracking-[0.2em]">
                Carregar mensagens anteriores
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: WIDGETS (MANTENDO LAYOUT) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 flex flex-col relative overflow-hidden group">
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="text-7xl font-black text-slate-800 tracking-tighter tabular-nums leading-none">
                  {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-[11px] text-slate-500 font-black mt-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                  {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }).toUpperCase()}
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Online</span>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-5">
               <Clock size={180} strokeWidth={1} />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
              Ações Rápidas
            </h3>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="w-full bg-white border border-slate-200 hover:border-[#D32F2F]/50 hover:bg-slate-50 text-slate-700 font-black py-5 px-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 group"
            >
              <div className="bg-slate-100 p-2 rounded-xl group-hover:text-[#D32F2F] transition-colors">
                <ImageIcon size={20} />
              </div>
              <span className="text-xs uppercase tracking-widest">Anexar Imagens ou PDFs</span>
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-tighter">
                <CalendarIcon size={18} className="text-[#D32F2F]" />
                Janeiro 2026
              </h3>
            </div>
            <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-300 mb-4 uppercase tracking-widest">
              {['D','S','T','Q','Q','S','S'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-xs mb-8">
              {[28,29,30,31,1,2,3].map((d, i) => (
                <div key={i} className={`py-1.5 font-bold ${i < 4 ? 'text-slate-200' : 'text-slate-600'}`}>{d}</div>
              ))}
              <div className="py-2 relative bg-[#D32F2F] text-white font-black rounded-xl shadow-lg shadow-red-500/30 text-xs">
                4
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></span>
              </div>
              {[5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map(d => (
                <div key={d} className="py-2 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors font-bold relative">
                   {d}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex justify-between items-center">
                <span>Assuntos Imputados</span>
                <span className="text-[9px] text-[#D32F2F] bg-red-50 px-2 py-0.5 rounded-full font-black">04 JAN</span>
              </h4>
              <div className="space-y-3">
                <EventItem icon={<Video size={14} />} title="Reunião Geral" time="10:00 - 11:30 • Sala A" color="border-l-[#D32F2F]" />
                <EventItem icon={<Utensils size={14} />} title="Almoço com TI" time="12:30 - 13:30 • Externo" color="border-l-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE NOVA MENSAGEM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-slate-900 p-10 flex justify-between items-center text-white">
                 <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Nova Comunicação</h2>
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.4em] mt-2">Mural Corporativo Sapien</p>
                 </div>
                 <button onClick={() => setIsFormOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                    <X size={32} />
                 </button>
              </div>
              <form onSubmit={handleCreateMessage} className="p-10 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Título do Assunto</label>
                       <input type="text" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-red-100 outline-none" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Lead Maria Silva..." required />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Prioridade Cloud</label>
                       <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-red-100 outline-none" value={status} onChange={e => setStatus(e.target.value as MuralStatus)}>
                          {Object.values(MuralStatus).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Mensagem Detalhada</label>
                    <textarea className="w-full bg-slate-50 border-none rounded-3xl py-6 px-6 text-sm font-medium h-48 focus:ring-4 focus:ring-red-100 outline-none resize-none" value={content} onChange={e => setContent(e.target.value)} placeholder="Descreva os pontos de atenção..." required />
                 </div>
                 <div className="flex items-center justify-between pt-6">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 text-slate-400 hover:text-[#D32F2F] transition-colors">
                       <div className={`p-3 rounded-2xl ${selectedFiles.length > 0 ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100'}`}>
                          <Paperclip size={20} />
                       </div>
                       <span className="text-[11px] font-black uppercase tracking-widest">{selectedFiles.length > 0 ? 'Arquivo Pronto' : 'Anexar Doc'}</span>
                       <input type="file" ref={fileInputRef} className="hidden" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
                    </button>
                    <button type="submit" disabled={uploading === 'main'} className="bg-[#D32F2F] text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all disabled:opacity-50">
                       {uploading === 'main' ? 'Enviando...' : 'Publicar Agora'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const EventItem = ({ icon, title, time, color, opacity = "" }: { icon: React.ReactNode, title: string, time: string, color: string, opacity?: string }) => (
  <div className={`flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer border-l-4 ${color} border-y border-r border-slate-100 shadow-sm group ${opacity}`}>
    <div className="flex-grow">
      <p className="text-[12px] font-black text-slate-800 group-hover:text-[#D32F2F] transition-colors">{title}</p>
      <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-tight">{time}</p>
    </div>
    <div className="text-slate-400 group-hover:text-[#D32F2F] transition-colors">
       {icon}
    </div>
  </div>
);

export default Mural;
