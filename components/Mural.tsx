
import React, { useState, useEffect, useRef } from 'react';
import { MuralMessage, MuralStatus, MuralFile, MuralReply } from '../types';
import { db, storage } from '../firebase';
import { collection, addDoc, updateDoc, doc, arrayUnion, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Paperclip, Send, Trash2, ImageIcon, FileText, X, Clock, Calendar } from 'lucide-react';

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

  const handleFileUpload = async (files: File[]): Promise<string | null> => {
    if (files.length === 0) return null;
    const file = files[0];

    if (file.size > 2 * 1024 * 1024) {
      alert('O arquivo excede o limite de 2MB do Sapien Cloud.');
      return null;
    }

    try {
      const fileRef = ref(storage, `mural/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (e) {
      console.error("Erro no upload para o Storage:", e);
      return null;
    }
  };

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !content) return;
    setUploading('main');
    onInteraction?.();

    try {
      const arquivoUrl = await handleFileUpload(selectedFiles);
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
        arquivos: arquivoUrl ? [{ nome: selectedFiles[0].name, url: arquivoUrl, tipo: selectedFiles[0].type }] : [],
        interacoes: [] 
      });

      setTitulo(''); setContent(''); setStatus(MuralStatus.EXECUTAR);
      setImportante(false); setSelectedFiles([]); setIsFormOpen(false);
    } catch (err) {
      console.error("Erro ao criar tópico:", err);
      alert("Erro crítico ao gravar tópico. Verifique o console.");
    } finally {
      setUploading(null);
    }
  };

  const handleReply = async (msgId: string) => {
    const textoMensagem = replyText[msgId]?.trim();
    if (!textoMensagem && selectedFiles.length === 0) return;
    
    setUploading(msgId);
    onInteraction?.();

    try {
      const arquivoUrl = await handleFileUpload(selectedFiles);
      
      const novaInteracao: MuralReply = {
        autor: user.email,
        texto: textoMensagem || "Anexo enviado via Sapien Cloud",
        timestamp: new Date().toISOString()
      };
      
      if (arquivoUrl) {
        novaInteracao.arquivo = arquivoUrl;
      }

      const refTopico = doc(db, "mural", msgId);
      
      // PERSISTÊNCIA ROBUSTA
      await updateDoc(refTopico, {
        interacoes: arrayUnion(novaInteracao),
        timestamp_ultima_interacao: serverTimestamp(),
        isSeenGlobal: false 
      });

      // Limpa apenas o campo deste tópico específico
      setReplyText(prev => {
        const newState = { ...prev };
        delete newState[msgId];
        return newState;
      });
      setSelectedFiles([]);
      
    } catch (e: any) {
      console.error("Erro detalhado na gravação:", e);
      let erroMsg = "Falha ao gravar interação.";
      
      if (e.code === 'permission-denied') {
        erroMsg = "Acesso Negado: As regras do seu Firebase não permitem que você edite este tópico. Verifique se o banco está em 'Modo Teste' ou com permissões abertas para 'update'.";
      } else if (e.code === 'not-found') {
        erroMsg = "Tópico não encontrado: Ele pode ter sido excluído por outro operador.";
      }
      
      alert(erroMsg);
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja remover este tópico permanentemente do Cloud?")) {
      try {
        await deleteDoc(doc(db, "mural", id));
        onInteraction?.();
      } catch (e) {
        alert("Você não tem permissão para excluir este tópico.");
      }
    }
  };

  return (
    <div id="mural-viewport" className="max-w-7xl mx-auto px-4 pt-6 pb-20 font-sans animate-in fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tighter">
              <span className="material-icons-round text-[#ea2a33] text-3xl">forum</span>
              Mural Cloud Sapien
            </h2>
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isFormOpen ? 'bg-slate-200 text-slate-600' : 'bg-[#ea2a33] text-white shadow-lg shadow-red-200'}`}
            >
              {isFormOpen ? 'Fechar' : 'Nova Mensagem'}
            </button>
          </div>

          {isFormOpen && (
            <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-8 mb-8 animate-in slide-in-from-top-4 duration-300">
              <form onSubmit={handleCreateMessage} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Assunto" value={titulo} onChange={setTitulo} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prioridade</label>
                    <select className="w-full border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-red-100 outline-none" value={status} onChange={e => setStatus(e.target.value as MuralStatus)}>
                      {Object.values(MuralStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <textarea placeholder="Descrição detalhada..." className="w-full border-slate-200 rounded-2xl py-4 px-4 text-sm font-medium h-32 focus:ring-2 focus:ring-red-100 outline-none resize-none" value={content} onChange={e => setContent(e.target.value)} required />
                <div className="flex items-center justify-between pt-2">
                   <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-slate-500 hover:text-[#ea2a33] transition-colors">
                      <Paperclip size={18} />
                      <span className="text-xs font-black uppercase tracking-widest">Anexar (2MB)</span>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
                   </button>
                   <button type="submit" disabled={!!uploading} className="bg-[#ea2a33] text-white px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50">
                      {uploading === 'main' ? 'Processando...' : 'Publicar'}
                   </button>
                </div>
                {selectedFiles.length > 0 && <p className="text-[10px] font-bold text-emerald-600">Arquivo pendente: {selectedFiles[0].name}</p>}
              </form>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg) => {
              const ui = STATUS_UI[msg.status] || STATUS_UI[MuralStatus.EXECUTAR];
              const ehCriador = user?.email === msg.criador_id;
              const isExpanded = expandedId === msg.id;

              return (
                <article key={msg.id} className="bg-white rounded-[2rem] shadow-soft border border-slate-100 overflow-hidden transition-all hover:shadow-lg">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                          {msg.authorName?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-black text-xl text-slate-900 tracking-tight">{msg.titulo}</h3>
                            <span className={`px-3 py-1 rounded-full ${ui.bg} ${ui.color} text-[9px] font-black uppercase tracking-widest`}>{msg.status}</span>
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
                    <div className="bg-slate-50 rounded-2xl p-5 text-slate-700 text-sm mb-4">{msg.content}</div>
                    
                    {msg.arquivos && msg.arquivos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {msg.arquivos.map((f, i) => (
                          <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-500 hover:text-[#ea2a33]">
                            <FileText size={14} /> {f.nome}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <button onClick={() => setExpandedId(isExpanded ? null : msg.id)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#ea2a33]">
                        <Send size={14} className="rotate-45" /> {msg.interacoes?.length || 0} Interações
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50/50 border-t border-slate-100 p-6 space-y-4">
                      <div className="space-y-3">
                        {msg.interacoes?.map((res, idx) => (
                          <div key={idx} className="flex gap-3 animate-in slide-in-from-left-2">
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
                                {res.arquivo && (
                                  <a href={res.arquivo} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-[#ea2a33] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 transition-all">
                                    <FileText size={12} /> Ver Anexo
                                  </a>
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
                            placeholder="Adicionar resposta..." 
                            value={replyText[msg.id] || ''}
                            onChange={e => setReplyText({ ...replyText, [msg.id]: e.target.value })}
                          />
                          <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            <button onClick={() => { replyFileInputRef.current?.click() }} className="p-2 text-slate-400 hover:text-[#ea2a33]" title="Anexar">
                              <Paperclip size={20} />
                              <input type="file" ref={replyFileInputRef} className="hidden" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
                            </button>
                            <button onClick={() => handleReply(msg.id)} disabled={uploading === msg.id} className="bg-[#ea2a33] text-white p-2.5 rounded-xl shadow-lg shadow-red-200">
                              {uploading === msg.id ? <Clock size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                          </div>
                        </div>
                        {selectedFiles.length > 0 && <p className="text-[9px] font-bold text-emerald-600 mt-2">Pendente: {selectedFiles[0].name}</p>}
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

const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-red-100 outline-none" required />
  </div>
);

export default Mural;
