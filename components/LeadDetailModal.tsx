
import React, { useState, useEffect } from 'react';
import { Lead, LeadPhase, LeadStatus, Client, Property, Broker, Bank, PHASES_ORDER, ConstructionCompany } from '../types';
import { X, Calendar, AlertCircle, CheckCircle, HelpCircle, Save, TrendingUp, TrendingDown, Landmark, Building2, MapPin, Clock, History, Lock, Unlock, Briefcase, User } from 'lucide-react';

interface LeadDetailModalProps {
  lead: Lead;
  isAdmin: boolean;
  client?: Client;
  property?: Property;
  bank?: Bank;
  company?: ConstructionCompany;
  clients: Client[];
  brokers: Broker[];
  properties: Property[];
  banks: Bank[];
  companies: ConstructionCompany[];
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => Promise<void>;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ 
  lead, isAdmin, client, property, bank, company, 
  clients, brokers, properties, banks, companies,
  onClose, onUpdate 
}) => {
  const [showMotiveInput, setShowMotiveInput] = useState<LeadStatus | null>(null);
  const [motiveText, setMotiveText] = useState('');
  const [appraisalValue, setAppraisalValue] = useState<number>(lead.appraisalValue || 0);
  const [dateValue, setDateValue] = useState<string>('');
  const [isEvaluated, setIsEvaluated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'tratativa' | 'historico' | 'admin'>('tratativa');
  
  // Estados para Edição Total ADM
  const [isEditMode, setIsEditMode] = useState(false);
  const [admLeadData, setAdmLeadData] = useState<Lead>({ ...lead });

  useEffect(() => {
    setAdmLeadData({ ...lead });
  }, [lead]);

  const isUrgent = (startDate: string) => {
    const diff = Date.now() - new Date(startDate).getTime();
    return diff > 10 * 24 * 60 * 60 * 1000; // 10 dias
  };

  const currentHistory = lead.history.find(h => h.phase === lead.currentPhase) || { 
    phase: lead.currentPhase, 
    startDate: lead.createdAt, 
    status: lead.status 
  };
  
  const urgent = isUrgent(currentHistory.startDate);

  const handleAdvance = async (newStatus: LeadStatus, specificData: any = {}) => {
    const now = new Date().toISOString();
    const currentIndex = PHASES_ORDER.indexOf(lead.currentPhase);
    
    let updatedLead = { ...lead };
    
    const newHistory = lead.history.map(h => {
      if (h.phase === lead.currentPhase) {
        return { ...h, endDate: now, status: newStatus, motive: motiveText, ...specificData };
      }
      return h;
    });

    if (newStatus === LeadStatus.CONCLUIDO && currentIndex < PHASES_ORDER.length - 1) {
      const nextPhase = PHASES_ORDER[currentIndex + 1];
      updatedLead = {
        ...updatedLead,
        currentPhase: nextPhase,
        status: LeadStatus.EM_ANDAMENTO,
        history: [...newHistory, { phase: nextPhase, startDate: now, status: LeadStatus.EM_ANDAMENTO }]
      };
    } else {
      updatedLead = {
        ...updatedLead,
        status: newStatus,
        history: newHistory,
        motive: motiveText,
        ...specificData
      };
    }

    await onUpdate(updatedLead);
    onClose();
  };

  const handleAdminUpdate = async () => {
    if (!isAdmin) return;
    await onUpdate(admLeadData);
    onClose();
  };

  const getStatusEmoji = (status: LeadStatus) => {
    if (urgent) return '❗️';
    switch (status) {
      case LeadStatus.CONCLUIDO: return '✅';
      case LeadStatus.PENDENTE: return '⚠️';
      case LeadStatus.CANCELADO: return '✖';
      case LeadStatus.EM_ANDAMENTO: return '🚩';
      case LeadStatus.REPROVADO: return '🚫';
      default: return '🚩';
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderPhaseContent = () => {
    switch (lead.currentPhase) {
      case LeadPhase.SIMULACAO_COLETA:
        return (
          <div className="space-y-6">
            <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest">Enviado para o Banco?</h4>
            <div className="flex gap-4">
              <button onClick={() => handleAdvance(LeadStatus.CONCLUIDO)} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-100 transition-all">
                SIM (Concluir)
              </button>
              <button onClick={() => setShowMotiveInput(LeadStatus.CANCELADO)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">
                Cancelar
              </button>
            </div>
          </div>
        );

      case LeadPhase.APROVACAO_CREDITO:
        return (
          <div className="space-y-6">
            <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest">Status da Aprovação</h4>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleAdvance(LeadStatus.CONCLUIDO)} className="bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-green-700 shadow-md">APROVADO</button>
              <button onClick={() => handleAdvance(LeadStatus.REPROVADO)} className="bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-red-700 shadow-md">REPROVADO</button>
              <button onClick={() => setShowMotiveInput(LeadStatus.PENDENTE)} className="bg-amber-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-amber-600 shadow-md">CONDICIONADO</button>
              <button onClick={() => setShowMotiveInput(LeadStatus.CANCELADO)} className="bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-gray-200">CANCELAR</button>
            </div>
          </div>
        );

      case LeadPhase.VISITA_IMOVEL:
      case LeadPhase.REGISTRO_CARTORIO:
        const isRegistry = lead.currentPhase === LeadPhase.REGISTRO_CARTORIO;
        return (
          <div className="space-y-6">
            <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest">
              {isRegistry ? 'Imóvel registrado?' : 'Deseja marcar a visita?'}
            </h4>
            <div className="flex flex-col gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data do Evento</label>
                <input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} className="w-full border-gray-100 bg-gray-50 rounded-xl font-bold py-3 px-4 focus:ring-[#8B0000]" />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => dateValue && handleAdvance(LeadStatus.CONCLUIDO, { [isRegistry ? 'registryDate' : 'visitDate']: dateValue })} 
                  disabled={!dateValue}
                  className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-30"
                >SIM</button>
                <button onClick={() => handleAdvance(LeadStatus.PENDENTE)} className="flex-1 bg-amber-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">NÃO</button>
                <button onClick={() => setShowMotiveInput(LeadStatus.CANCELADO)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">CANCELAR</button>
              </div>
            </div>
          </div>
        );

      case LeadPhase.ENGENHARIA:
        const diffValue = appraisalValue - (property?.value || 0);
        const diffPerc = property?.value ? (diffValue / property.value) * 100 : 0;
        return (
          <div className="space-y-6">
            <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest">O imóvel foi avaliado?</h4>
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setIsEvaluated(true)} className={`py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${isEvaluated === true ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-400 border-gray-100'}`}>SIM</button>
               <button onClick={() => setIsEvaluated(false)} className={`py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${isEvaluated === false ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-400 border-gray-100'}`}>NÃO</button>
            </div>

            {isEvaluated === true && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data da Vistoria</label>
                    <input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} className="w-full border-gray-100 bg-gray-50 rounded-xl font-bold p-3" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avaliação / Laudo (R$)</label>
                    <input type="number" value={appraisalValue} onChange={e => setAppraisalValue(Number(e.target.value))} className="w-full border-gray-100 bg-gray-50 rounded-xl font-bold p-3" />
                  </div>
                </div>

                {appraisalValue > 0 && (
                  <div className="p-6 rounded-3xl border border-gray-100 bg-white flex justify-between items-center shadow-soft">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Diferença VGV vs Laudo</p>
                      <p className={`text-2xl font-black ${diffValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(diffValue)}
                      </p>
                    </div>
                    <div className={`flex flex-col items-end gap-1 font-black text-lg ${diffPerc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <div className="flex items-center gap-1">
                         {diffPerc >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                         {diffPerc.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button onClick={() => handleAdvance(LeadStatus.CONCLUIDO, { appraisalValue, inspectionDate: dateValue })} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">CONCLUIR FASE</button>
                  <button onClick={() => setShowMotiveInput(LeadStatus.CANCELADO)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">CANCELAR</button>
                </div>
              </div>
            )}
            {isEvaluated === false && (
              <button onClick={() => handleAdvance(LeadStatus.PENDENTE)} className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">SALVAR COMO PENDENTE</button>
            )}
          </div>
        );

      case LeadPhase.EMISSAO_CONTRATO:
      case LeadPhase.ASSINATURA_CONTRATO:
      case LeadPhase.LIBERACAO_RECURSOS:
        return (
          <div className="space-y-6">
            <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest">{lead.currentPhase} concluída?</h4>
            <div className="flex gap-4">
              <button onClick={() => handleAdvance(LeadStatus.CONCLUIDO)} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">SIM (CONCLUÍDO)</button>
              <button onClick={() => handleAdvance(LeadStatus.PENDENTE)} className="flex-1 bg-amber-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">NÃO (PENDENTE)</button>
              {lead.currentPhase !== LeadPhase.LIBERACAO_RECURSOS && (
                <button onClick={() => setShowMotiveInput(LeadStatus.CANCELADO)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">CANCELAR</button>
              )}
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className={`bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 ${urgent ? 'border-4 border-red-500' : ''}`}>
        
        {property?.photos?.[0] && !isEditMode && (
          <div className="h-40 w-full relative">
            <img src={property.photos[0]} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-6 left-8 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-2">Imóvel Associado</p>
              <h4 className="text-2xl font-black tracking-tighter uppercase">{property.title}</h4>
            </div>
          </div>
        )}

        <div className={`p-8 text-white flex justify-between items-center ${isEditMode ? 'bg-[#ea2a33]' : urgent ? 'bg-red-600' : 'bg-[#1F1F1F]'}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getStatusEmoji(admLeadData.status)}</span>
            <div>
              <h3 className={`text-xl font-black tracking-tighter uppercase ${urgent ? 'animate-pulse' : ''}`}>
                {isEditMode ? 'MODO EDIÇÃO TOTAL (ADM)' : urgent ? 'URGÊNCIA SAP CLOUD (>10 DIAS)' : 'TRATATIVA DE PIPELINE'}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Operação Cloud Sincronizada</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {isAdmin && (
               <button 
                onClick={() => {
                    setIsEditMode(!isEditMode);
                    setActiveTab(isEditMode ? 'tratativa' : 'admin');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-white text-red-600' : 'bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white'}`}
               >
                 {isEditMode ? <Lock size={14} /> : <Unlock size={14} />}
                 {isEditMode ? 'Sair da Edição' : 'Liberar ADM'}
               </button>
             )}
             <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
          </div>
        </div>

        <div className="flex border-b border-slate-100">
           <button 
            onClick={() => setActiveTab('tratativa')}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tratativa' ? 'border-b-4 border-[#8B0000] text-[#8B0000]' : 'text-slate-400'}`}
           >
             Tratativa Atual
           </button>
           <button 
            onClick={() => setActiveTab('historico')}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'historico' ? 'border-b-4 border-[#8B0000] text-[#8B0000]' : 'text-slate-400'}`}
           >
             Histórico Digital
           </button>
           {isAdmin && isEditMode && (
             <button 
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'border-b-4 border-[#8B0000] text-[#8B0000]' : 'text-slate-400'}`}
             >
               Controle Total
             </button>
           )}
        </div>

        <div className={`p-8 space-y-8 ${urgent ? 'bg-red-50/10' : ''} max-h-[60vh] overflow-y-auto`}>
          
          {activeTab === 'tratativa' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                 <div className="col-span-2 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cliente / Proponente</p>
                    <p className={`text-lg font-black tracking-tight uppercase ${urgent ? 'text-red-700' : 'text-gray-900'}`}>{client?.name}</p>
                    <div className="flex gap-4 mt-4">
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                          <Landmark size={12} className="text-[#8B0000]" /> {bank?.name}
                       </div>
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                          <Building2 size={12} className="text-[#8B0000]" /> {company?.name}
                       </div>
                    </div>
                 </div>
                 <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-center text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Início da Fase</p>
                    <p className="text-sm font-black text-gray-900">{new Date(currentHistory.startDate).toLocaleDateString()}</p>
                    <p className="text-[10px] font-bold text-gray-400">{new Date(currentHistory.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                 </div>
              </div>

              <div className={`p-6 rounded-[2rem] border-2 border-dashed ${urgent ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-white shadow-soft'}`}>
                {!showMotiveInput ? renderPhaseContent() : (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2 text-[#8B0000]">
                      <AlertCircle size={20} />
                      <h4 className="font-black text-xs uppercase tracking-widest">Motivo da Ação ({showMotiveInput})</h4>
                    </div>
                    <textarea 
                      maxLength={800}
                      placeholder="Digite o motivo detalhado aqui..."
                      className="w-full h-40 bg-gray-50 border-gray-100 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-[#8B0000] outline-none resize-none shadow-inner uppercase"
                      value={motiveText}
                      onChange={e => setMotiveText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                       <button onClick={() => setShowMotiveInput(null)} className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600">Voltar</button>
                       <button 
                        onClick={() => handleAdvance(showMotiveInput)} 
                        disabled={!motiveText.trim()}
                        className="px-10 py-3 bg-[#8B0000] text-white rounded-xl text-[10px] font-black uppercase shadow-xl disabled:opacity-30 hover:scale-105 transition-all"
                       >
                         Gravar Ação
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'historico' && (
            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <History size={16} className="text-[#8B0000]" /> Linha do Tempo de Evolução
              </h4>
              <div className="relative border-l-2 border-slate-100 ml-3 pl-8 space-y-8 pb-10">
                {lead.history.map((hist, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[41px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-md ${hist.endDate ? 'bg-green-500' : 'bg-[#8B0000] animate-pulse'}`}></div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tighter mb-2">{hist.phase}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase">Abertura</p>
                           <p className="text-[10px] font-bold text-slate-600">{formatDate(hist.startDate)}</p>
                        </div>
                        {hist.endDate && (
                          <div>
                             <p className="text-[9px] font-black text-green-500 uppercase">Encerramento</p>
                             <p className="text-[10px] font-bold text-green-700">{formatDate(hist.endDate)}</p>
                          </div>
                        )}
                      </div>
                      {hist.motive && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                           <p className="text-[10px] text-slate-500 italic font-medium leading-relaxed uppercase">{hist.motive}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'admin' && isEditMode && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-start gap-4">
                 <AlertCircle className="text-red-600 shrink-0" size={24} />
                 <div>
                    <h4 className="text-sm font-black text-red-900 uppercase tracking-widest">Controle de Governança Master</h4>
                    <p className="text-[10px] text-red-600 font-bold leading-relaxed uppercase">Você tem permissão para alterar qualquer vínculo deste lead. Use com responsabilidade.</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminSelect 
                  label="PROPOENTE (CLIENTE)" 
                  icon={<User size={16} />}
                  value={admLeadData.clientId} 
                  onChange={v => setAdmLeadData({...admLeadData, clientId: v})}
                  options={clients.map(c => ({ id: c.id, label: c.name }))}
                />
                <AdminSelect 
                  label="CORRETOR RESPONSÁVEL" 
                  icon={<Briefcase size={16} />}
                  value={admLeadData.brokerId} 
                  onChange={v => setAdmLeadData({...admLeadData, brokerId: v})}
                  options={brokers.map(b => ({ id: b.id, label: b.name }))}
                />
                <AdminSelect 
                  label="IMÓVEL DO ANÚNCIO" 
                  icon={<MapPin size={16} />}
                  value={admLeadData.propertyId} 
                  onChange={v => setAdmLeadData({...admLeadData, propertyId: v})}
                  options={properties.map(p => ({ id: p.id, label: p.title }))}
                />
                <AdminSelect 
                  label="INSTITUIÇÃO BANCÁRIA" 
                  icon={<Landmark size={16} />}
                  value={admLeadData.bankId} 
                  onChange={v => setAdmLeadData({...admLeadData, bankId: v})}
                  options={banks.map(b => ({ id: b.id, label: b.name }))}
                />
                <AdminSelect 
                  label="CONSTRUTORA" 
                  icon={<Building2 size={16} />}
                  value={admLeadData.constructionCompanyId} 
                  onChange={v => setAdmLeadData({...admLeadData, constructionCompanyId: v})}
                  options={companies.map(c => ({ id: c.id, label: c.name }))}
                />
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">FASE DO PIPELINE</label>
                   <select 
                    value={admLeadData.currentPhase} 
                    onChange={e => setAdmLeadData({...admLeadData, currentPhase: e.target.value as LeadPhase})}
                    className="w-full bg-red-50/50 border-2 border-red-100 rounded-2xl py-3 px-4 text-sm font-black uppercase outline-none focus:ring-4 focus:ring-red-100 transition-all"
                   >
                     {PHASES_ORDER.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">STATUS GLOBAL</label>
                   <select 
                    value={admLeadData.status} 
                    onChange={e => setAdmLeadData({...admLeadData, status: e.target.value as LeadStatus})}
                    className="w-full bg-red-50/50 border-2 border-red-100 rounded-2xl py-3 px-4 text-sm font-black uppercase outline-none focus:ring-4 focus:ring-red-100 transition-all"
                   >
                     {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                 <button 
                  onClick={handleAdminUpdate}
                  className="w-full bg-[#ea2a33] text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                 >
                   <Save size={18} /> Salvar Alterações Master
                 </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[9px] font-black text-gray-300 uppercase tracking-widest">
           <span>Engine SAP Cloud v2.5.0 • Administrador: {isAdmin ? 'AUTORIZADO' : 'BLOQUEADO'}</span>
           <span>Lead ID: {lead.id.slice(0,8)}...</span>
        </div>
      </div>
    </div>
  );
};

const AdminSelect = ({ label, value, onChange, options, icon }: { label: string, value: string, onChange: (v: string) => void, options: {id: string, label: string}[], icon: any }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 flex items-center gap-2">
      {icon} {label}
    </label>
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)}
      className="w-full bg-red-50/50 border-2 border-red-100 rounded-2xl py-3 px-4 text-sm font-black uppercase outline-none focus:ring-4 focus:ring-red-100 transition-all"
    >
      <option value="">Não Vinculado</option>
      {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  </div>
);

export default LeadDetailModal;
