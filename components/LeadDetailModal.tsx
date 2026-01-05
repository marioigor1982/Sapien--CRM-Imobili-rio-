
import React, { useState, useEffect } from 'react';
import { Lead, LeadPhase, LeadStatus, Client, Property, Bank, PHASES_ORDER, ConstructionCompany } from '../types';
import { X, Calendar, AlertCircle, CheckCircle, HelpCircle, Save, TrendingUp, TrendingDown, Landmark, Building2, MapPin } from 'lucide-react';

interface LeadDetailModalProps {
  lead: Lead;
  client?: Client;
  property?: Property;
  bank?: Bank;
  company?: ConstructionCompany;
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => Promise<void>;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, client, property, bank, company, onClose, onUpdate }) => {
  const [showMotiveInput, setShowMotiveInput] = useState<LeadStatus | null>(null);
  const [motiveText, setMotiveText] = useState('');
  const [appraisalValue, setAppraisalValue] = useState<number>(lead.appraisalValue || 0);
  const [dateValue, setDateValue] = useState<string>('');
  const [isEvaluated, setIsEvaluated] = useState<boolean | null>(null);

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
    
    // Atualiza histórico da fase atual
    const newHistory = lead.history.map(h => {
      if (h.phase === lead.currentPhase) {
        return { ...h, endDate: now, status: newStatus, motive: motiveText, ...specificData };
      }
      return h;
    });

    // Se concluiu e não é a última fase, avança
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

  const getStatusEmoji = (status: LeadStatus) => {
    if (urgent) return '❗️';
    switch (status) {
      case LeadStatus.CONCLUIDO: return '✅';
      case LeadStatus.PENDENTE: return '⚠️';
      case LeadStatus.CANCELADO: return '✖';
      case LeadStatus.EM_ANDAMENTO: return '🚩';
      default: return '';
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
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
                      <span className="text-xl">{diffPerc >= 0 ? '🔺' : '🔻'}</span>
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
        
        {/* Foto do Imóvel no Topo do Modal */}
        {property?.photos?.[0] && (
          <div className="h-48 w-full relative">
            <img src={property.photos[0]} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-6 left-8 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-2">Imóvel Associado</p>
              <h4 className="text-2xl font-black tracking-tighter">{property.title}</h4>
            </div>
          </div>
        )}

        <div className={`p-8 text-white flex justify-between items-center ${urgent ? 'bg-red-600' : 'bg-[#1F1F1F]'}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getStatusEmoji(lead.status)}</span>
            <div>
              <h3 className={`text-xl font-black tracking-tighter ${urgent ? 'animate-pulse' : ''}`}>
                {urgent ? 'URGÊNCIA SAP CLOUD (>10 DIAS)' : 'TRATATIVA DE PIPELINE'}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Sincronização em Tempo Real</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
        </div>

        <div className={`p-8 space-y-8 ${urgent ? 'bg-red-50/10' : ''}`}>
          
          {/* Dados Automáticos do Display */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
             <div className="col-span-2 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cliente / Proponente</p>
                <p className={`text-lg font-black tracking-tight ${urgent ? 'text-red-700' : 'text-gray-900'}`}>{client?.name}</p>
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
                  placeholder="Digite o motivo detalhado aqui (obrigatório para gravar)..."
                  className="w-full h-40 bg-gray-50 border-gray-100 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-[#8B0000] outline-none resize-none shadow-inner"
                  value={motiveText}
                  onChange={e => setMotiveText(e.target.value)}
                />
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-gray-300 uppercase">{motiveText.length} / 800 CARACTERES</span>
                   <div className="flex gap-2">
                      <button onClick={() => setShowMotiveInput(null)} className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600">Voltar</button>
                      <button 
                        onClick={() => handleAdvance(showMotiveInput)} 
                        disabled={!motiveText.trim()}
                        className="px-10 py-3 bg-[#8B0000] text-white rounded-xl text-[10px] font-black uppercase shadow-xl disabled:opacity-30 hover:scale-105 transition-all"
                      >
                        <Save size={14} className="inline mr-2" /> Gravar e Finalizar
                      </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[9px] font-black text-gray-300 uppercase tracking-widest">
           <span>Engine v2.1.0 • Pipeline Ativo</span>
           <div className="flex items-center gap-4">
              <span>Status Fase: {lead.status} {getStatusEmoji(lead.status)}</span>
              {lead.internalMessage && <span className="text-red-600 animate-pulse">Mensagem Interna Disponível</span>}
           </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
