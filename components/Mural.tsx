
import React, { useState, useEffect, useRef } from 'react';
import { MuralMessage, MuralStatus, MuralFile } from '../types';
import { db, storage } from '../firebase';
import { collection, addDoc, updateDoc, doc, arrayUnion, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Paperclip, Send, Trash2, Download, FileText, Image as ImageIcon, X, Clock, Calendar, CheckCircle } from 'lucide-react';

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
  const [uploading, setUploading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFileUpload = async (files: File[]): Promise<MuralFile[]> => {
    const uploadedFiles: MuralFile[] = [];
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        alert(`Arquivo ${file.name} excede o limite de 2MB!`);
        continue;
      }
      const fileRef = ref(storage, `mural/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      uploadedFiles.push({
        name: file.name,
        url,
        type: file.type
      });
    }
    return uploadedFiles;
  };

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content) return;
    setUploading('main');
    onInteraction?.();

    try {
      const files = await handleFileUpload(selectedFiles);
      const now = new Date().toISOString();
      
      await addDoc(collection(db, "mural"), {
        subject,
        content,
        status,
        important,
        authorName: user.email.split(/[.@]/)[0].toUpperCase(),
        authorEmail: user.email,
        createdAt: now,
        updatedAt: now,
        isSeenGlobal: false,
        files,
        replies: []
      });

      setSubject('');
      setContent('');
      setStatus(MuralStatus.EXECUTAR);
      setImportant(false);
      setSelectedFiles([]);
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao publicar tópico.");
    } finally {
      setUploading(null);
    }
  };

  const handleReply = async (msgId: string) => {
    const text = replyText[msgId];
    if (!text && selectedFiles.length === 0) return;
    setUploading(msgId);
    onInteraction?.();

    try {
      const files = await handleFileUpload(selectedFiles);
      const now = new Date().toISOString();
      
      await updateDoc(doc(db, "mural", msgId), {
        replies: arrayUnion({
          authorName: user.email.split(/[.@]/)[0].toUpperCase(),
          authorEmail: user.email,
          content: text || "Anexo enviado",
          date: now,
          files
        }),
        updatedAt: now // Move o tópico para o topo
      });

      setReplyText({ ...replyText, [msgId]: '' });
      setSelectedFiles([]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja remover esta discussão permanentemente? Todos os anexos e respostas serão perdidos.")) {
      await deleteDoc(doc(db, "mural", id));
      onInteraction?.();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-20 font-sans animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: FEED DE MENSAGENS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tighter">
              <span className="material-icons-round text-[#ea2a33] text-3xl">forum</span>
              Mural de Comunicação Global
            </h2>
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isFormOpen ? 'bg-slate-200 text-slate-600' : 'bg-[#ea2a33] text-white shadow-lg shadow-red-200 hover:scale-105'}`}
            >
              <span className="material-icons-round text-sm">{isFormOpen ? 'close' : 'add'}</span>
              {isFormOpen ? 'Cancelar' : 'Novo Tópico'}
            </button>
          </div>

          {/* FORMULÁRIO DE NOVO TÓPICO */}
          {isFormOpen && (
            <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-8 mb-8 animate-in slide-in-from-top-4 duration-300">
              <form onSubmit={handleCreateMessage} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título da Discussão</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Atualização de Taxas CEF..." 
                      className="w-full border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-red-100 focus:border-[#ea2a33] outline-none transition-all"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade / Status</label>
                    <select 
                      className="w-full border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-red-100 outline-none bg-white cursor-pointer"
                      value={status}
                      onChange={e => setStatus(e.target.value as MuralStatus)}
                    >
                      {Object.values(MuralStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conteúdo do Comunicado</label>
                  <textarea 
                    placeholder="Descreva aqui os detalhes..." 
                    className="w-full border-slate-200 rounded-2xl py-4 px-4 text-sm font-medium h-32 focus:ring-2 focus:ring-red-100 outline-none resize-none"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="rounded text-[#ea2a33] focus:ring-red-100 w-5 h-5 border-slate-300" 
                        checked={important}
                        onChange={e => setImportant(e.target.checked)}
                      />
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-700">Importante</span>
                    </label>

                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-slate-500 hover:text-[#ea2a33] transition-colors"
                    >
                      <Paperclip size={18} />
                      <span className="text-xs font-black uppercase tracking-widest">Anexar (Max 2MB)</span>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple 
                        onChange={e => setSelectedFiles(Array.from(e.target.files || []))} 
                      />
                    </button>
                  </div>

                  <button 
                    type="submit" 
                    disabled={!!uploading}
                    className="bg-[#ea2a33] hover:bg-red-700 text-white px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploading === 'main' ? <Clock className="animate-spin" size={16} /> : 'Publicar Tópico'}
                  </button>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 flex flex-wrap gap-2">
                    {selectedFiles.map((f, i) => (
                      <span key={i} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-2">
                        {f.name} <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))} />
                      </span>
                    ))}
                  </div>
                )}
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
                <article key={msg.id} className="bg-white rounded-[2rem] shadow-soft border border-slate-100 overflow-hidden transition-all hover:shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0 uppercase">
                          {msg.authorName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-black text-xl text-slate-900 leading-tight tracking-tight">{msg.subject}</h3>
                            {msg.important && (
                              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1">
                                <span className="material-icons-round text-[12px]">star</span>
                                Importante
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-full ${ui.bg} ${ui.color} text-[9px] font-black uppercase tracking-widest border border-current/10 flex items-center gap-1`}>
                              <span className="material-icons-round text-[12px]">{ui.icon}</span>
                              {msg.status}
                            </span>
                          </div>
                          <div className="flex items-center text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
                            <span>{msg.authorName}</span>
                            <span className="mx-2 opacity-30">•</span>
                            <span>{new Date(msg.createdAt).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      {isOwner && (
                        <button 
                          onClick={() => handleDelete(msg.id)}
                          className="text-slate-300 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-red-50"
                          title="Excluir Tópico"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 text-slate-700 text-sm leading-relaxed border border-slate-100/50 mb-4">
                      {msg.content}
                    </div>

                    {/* ANEXOS DO TÓPICO PRINCIPAL */}
                    {msg.files && msg.files.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-4">
                        {msg.files.map((file, idx) => (
                          <a 
                            key={idx} 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:border-[#ea2a33] hover:text-[#ea2a33] transition-all group"
                          >
                            {file.type.includes('image') ? <ImageIcon size={14} /> : <FileText size={14} />}
                            <span className="max-w-[150px] truncate">{file.name}</span>
                            <Download size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <button 
                        onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#ea2a33] transition-all"
                      >
                        <span className="material-icons-round text-lg">chat_bubble_outline</span>
                        {msg.replies?.length || 0} Interações
                        <span className={`material-icons-round text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                      </button>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        Atividade: {new Date(msg.updatedAt).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* ÁREA DE RESPOSTAS */}
                  {isExpanded && (
                    <div className="bg-slate-50/50 border-t border-slate-100 p-6 space-y-6">
                      <div className="space-y-4">
                        {msg.replies?.map((reply, idx) => (
                          <div key={idx} className="flex gap-4 animate-in slide-in-from-left-2">
                            <div className="h-8 w-8 rounded-xl bg-white border border-slate-100 text-slate-900 flex items-center justify-center text-[10px] font-black shrink-0 uppercase shadow-sm">
                              {reply.authorName.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-black text-[#ea2a33] uppercase tracking-widest">{reply.authorName}</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(reply.date).toLocaleString('pt-BR')}</span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">{reply.content}</p>
                                
                                {reply.files && reply.files.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-50">
                                    {reply.files.map((rf, ri) => (
                                      <a key={ri} href={rf.url} target="_blank" className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-[#ea2a33]">
                                        <Paperclip size={10} /> {rf.name}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* INPUT DE RESPOSTA RÁPIDA */}
                      <div className="pt-4 border-t border-slate-100">
                        <div className="relative">
                          <textarea 
                            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-5 pr-32 text-sm shadow-sm focus:ring-2 focus:ring-red-100 focus:border-[#ea2a33] outline-none placeholder-slate-400 text-slate-800 resize-none h-20" 
                            placeholder="Escreva sua resposta..." 
                            value={replyText[msg.id] || ''}
                            onChange={e => setReplyText({ ...replyText, [msg.id]: e.target.value })}
                          />
                          <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            <button 
                              onClick={() => replyFileInputRef.current?.click()}
                              className="p-2 text-slate-400 hover:text-[#ea2a33] transition-colors"
                              title="Anexar arquivo"
                            >
                              <Paperclip size={20} />
                              <input 
                                type="file" 
                                ref={replyFileInputRef} 
                                className="hidden" 
                                onChange={e => setSelectedFiles(Array.from(e.target.files || []))} 
                              />
                            </button>
                            <button 
                              onClick={() => handleReply(msg.id)}
                              disabled={uploading === msg.id}
                              className="bg-[#ea2a33] hover:bg-red-700 text-white p-3 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-50"
                            >
                              {uploading === msg.id ? <Clock size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                          </div>
                        </div>
                        {selectedFiles.length > 0 && !uploading && (
                          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                            {selectedFiles.map((f, i) => (
                              <span key={i} className="text-[10px] font-bold text-[#ea2a33] bg-red-50 px-2 py-1 rounded-md border border-red-100 flex items-center gap-1 whitespace-nowrap">
                                <FileText size={10} /> {f.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        {/* COLUNA DIREITA: WIDGETS SAP-STYLE */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* WIDGET RELÓGIO */}
          <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="text-6xl font-black text-white tracking-tighter tabular-nums mb-2">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-sm text-red-500 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <Calendar size={14} />
                {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
              <span className="material-icons-round text-[12rem] text-white">schedule</span>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Servidor Online</span>
              </div>
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Sapien v2.5.0</span>
            </div>
          </div>

          {/* WIDGET ESTATÍSTICAS DO MURAL */}
          <div className="bg-white rounded-[2.5rem] shadow-soft border border-slate-100 p-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <CheckCircle size={16} className="text-[#ea2a33]" />
              Resumo da Atividade
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-3xl font-black text-slate-900 leading-none mb-1">{messages.length}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tópicos</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-3xl font-black text-[#ea2a33] leading-none mb-1">
                  {messages.reduce((acc, m) => acc + (m.replies?.length || 0), 0)}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Respostas</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Casos Críticos</span>
                <span className="bg-red-700 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                  {messages.filter(m => m.status === MuralStatus.CRITICO).length}
                </span>
              </div>
            </div>
          </div>

          {/* CALENDÁRIO WIDGET */}
          <div className="bg-white rounded-[2.5rem] shadow-soft border border-slate-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 text-lg tracking-tight">Janeiro 2026</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">
              {['D','S','T','Q','Q','S','S'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
              {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                <div 
                  key={d} 
                  className={`py-2 rounded-xl transition-all cursor-pointer ${d === currentTime.getDate() ? 'bg-[#ea2a33] text-white shadow-lg shadow-red-200' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Mural;
