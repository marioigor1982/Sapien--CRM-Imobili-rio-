
import React, { useState, useEffect, useRef } from 'react';
import { MuralMessage, MuralStatus, MuralFile, MuralReply } from '../types';
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
  const [titulo, setTitulo] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<MuralStatus>(MuralStatus.EXECUTAR);
  const [importante, setImportante] = useState(false);
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
      // Validação de 2MB conforme solicitado
      if (file.size > 2 * 1024 * 1024) {
        alert(`Arquivo ${file.name} muito grande! Limite de 2MB excedido.`);
        continue;
      }
      const fileRef = ref(storage, `mural/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      uploadedFiles.push({
        nome: file.name,
        url,
        tipo: file.type
      });
    }
    return uploadedFiles;
  };

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !content) return;
    setUploading('main');
    onInteraction?.();

    try {
      const arquivos = await handleFileUpload(selectedFiles);
      const now = new Date().toISOString();
      
      await addDoc(collection(db, "mural"), {
        titulo,
        content,
        status,
        importante,
        authorName: user.email.split(/[.@]/)[0].toUpperCase(),
        criador_id: user.email,
        createdAt: now,
        timestamp_ultima_interacao: serverTimestamp(),
        isSeenGlobal: false,
        arquivos,
        respostas: []
      });

      setTitulo('');
      setContent('');
      setStatus(MuralStatus.EXECUTAR);
      setImportante(false);
      setSelectedFiles([]);
      setIsFormOpen(false);
    } catch (err) {
      console.error("Erro ao criar tópico:", err);
      alert("Falha ao abrir discussão no Cloud.");
    } finally {
      setUploading(null);
    }
  };

  const handleReply = async (msgId: string) => {
    const texto = replyText[msgId];
    if (!texto && selectedFiles.length === 0) return;
    
    setUploading(msgId);
    onInteraction?.();

    try {
      const arquivos = await handleFileUpload(selectedFiles);
      
      // Objeto de Interação Acumulada
      const novaInteracao: MuralReply = {
        autor: user.email,
        texto: texto || "Arquivo em anexo",
        timestamp: new Date().toISOString(),
        arquivos
      };

      const refTopico = doc(db, "mural", msgId);
      
      // PERSISTÊNCIA VIA arrayUnion (Não sobrescreve, acumula)
      await updateDoc(refTopico, {
        respostas: arrayUnion(novaInteracao),
        timestamp_ultima_interacao: serverTimestamp(), // Força subida para o topo
        isSeenGlobal: false 
      });

      setReplyText(prev => ({ ...prev, [msgId]: '' }));
      setSelectedFiles([]);
    } catch (err) {
      console.error("Erro ao acumular resposta:", err);
      alert("Erro ao enviar interação. Verifique sua conexão.");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja remover este tópico permanentemente? Apenas o criador tem este poder.")) {
      await deleteDoc(doc(db, "mural", id));
      onInteraction?.();
    }
  };

  return (
    <div id="mural-global" className="max-w-7xl mx-auto px-4 pt-6 pb-20 font-sans animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tighter">
              <span className="material-icons-round text-[#ea2a33] text-3xl">forum</span>
              Mural Global Interativo
            </h2>
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isFormOpen ? 'bg-slate-200 text-slate-600' : 'bg-[#ea2a33] text-white shadow-lg shadow-red-200'}`}
            >
              <span className="material-icons-round text-sm">{isFormOpen ? 'close' : 'add'}</span>
              {isFormOpen ? 'Cancelar' : 'Novo Tópico'}
            </button>
          </div>

          {isFormOpen && (
            <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-8 mb-8 animate-in slide-in-from-top-4 duration-300">
              <form onSubmit={handleCreateMessage} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assunto do Tópico</label>
                    <input 
                      type="text" 
                      placeholder="Título curto..." 
                      className="w-full border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-red-100 focus:border-[#ea2a33] outline-none"
                      value={titulo}
                      onChange={e => setTitulo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade</label>
                    <select 
                      className="w-full border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-red-100 outline-none bg-white"
                      value={status}
                      onChange={e => setStatus(e.target.value as MuralStatus)}
                    >
                      {Object.values(MuralStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição detalhada</label>
                  <textarea 
                    placeholder="O que deseja comunicar ao time?" 
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
                        className="rounded text-[#ea2a33] focus:ring-red-100 w-5 h-5" 
                        checked={importante}
                        onChange={e => setImportante(e.target.checked)}
                      />
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Destaque</span>
                    </label>

                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-slate-500 hover:text-[#ea2a33] transition-colors"
                    >
                      <Paperclip size={18} />
                      <span className="text-xs font-black uppercase tracking-widest">Anexar</span>
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
                    className="bg-[#ea2a33] hover:bg-red-700 text-white px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl disabled:opacity-50"
                  >
                    {uploading === 'main' ? <Clock className="animate-spin" size={16} /> : 'Publicar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg) => {
              const ui = STATUS_UI[msg.status] || STATUS_UI[MuralStatus.EXECUTAR];
              const ehCriador = user?.email === msg.criador_id;
              const isExpanded = expandedId === msg.id;

              return (
                <article key={msg.id} className="bg-white rounded-[2rem] shadow-soft border border-slate-100 overflow-hidden transition-all hover:shadow-lg animate-in fade-in">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                          {msg.authorName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-black text-xl text-slate-900 tracking-tight">{msg.titulo}</h3>
                            <span className={`px-3 py-1 rounded-full ${ui.bg} ${ui.color} text-[9px] font-black uppercase tracking-widest border border-current/10`}>
                              {msg.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            {msg.authorName} • {new Date(msg.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      {ehCriador && (
                        <button onClick={() => handleDelete(msg.id)} className="text-slate-300 hover:text-red-600 p-2 rounded-xl">
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 text-slate-700 text-sm mb-4 border border-slate-100">
                      {msg.content}
                    </div>

                    {msg.arquivos && msg.arquivos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {msg.arquivos.map((file, idx) => (
                          <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-600 hover:text-[#ea2a33]">
                            {file.tipo.includes('image') ? <ImageIcon size={14} /> : <FileText size={14} />}
                            <span className="max-w-[120px] truncate">{file.nome}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <button 
                        onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#ea2a33]"
                      >
                        <span className="material-icons-round text-lg">chat</span>
                        {msg.respostas?.length || 0} Respostas
                        <span className={`material-icons-round text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                      </button>
                    </div>
                  </div>

                  {/* AREA DE RESPOSTAS ACUMULADAS */}
                  {isExpanded && (
                    <div className="bg-slate-50/50 border-t border-slate-100 p-6 space-y-4">
                      <div className="space-y-3">
                        {msg.respostas?.map((res, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 text-slate-900 flex items-center justify-center text-[10px] font-black shrink-0 uppercase">
                              {res.autor?.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[9px] font-black text-[#ea2a33] uppercase">{res.autor?.split('@')[0]}</span>
                                  <span className="text-[8px] font-bold text-slate-400">{new Date(res.timestamp).toLocaleTimeString('pt-BR')}</span>
                                </div>
                                <p className="text-sm text-slate-700 font-medium">{res.texto}</p>
                                
                                {res.arquivos && res.arquivos.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-50">
                                    {res.arquivos.map((rf, ri) => (
                                      <a key={ri} href={rf.url} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-slate-400 hover:text-[#ea2a33] flex items-center gap-1">
                                        <Paperclip size={10} /> {rf.nome}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-slate-200">
                        <div className="relative">
                          <textarea 
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-4 pr-32 text-sm shadow-sm focus:ring-2 focus:ring-red-100 outline-none resize-none h-16" 
                            placeholder="Sua resposta..." 
                            value={replyText[msg.id] || ''}
                            onChange={e => setReplyText({ ...replyText, [msg.id]: e.target.value })}
                          />
                          <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            <button onClick={() => replyFileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-[#ea2a33]" title="Anexar">
                              <Paperclip size={20} />
                              <input type="file" ref={replyFileInputRef} className="hidden" multiple onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
                            </button>
                            <button onClick={() => handleReply(msg.id)} disabled={uploading === msg.id} className="bg-[#ea2a33] text-white p-2.5 rounded-xl shadow-lg shadow-red-200">
                              {uploading === msg.id ? <Clock size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8">
            <div className="text-6xl font-black text-white tracking-tighter mb-1">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm text-red-500 font-black uppercase tracking-[0.3em] flex items-center gap-2">
              <Calendar size={14} />
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Mural;
