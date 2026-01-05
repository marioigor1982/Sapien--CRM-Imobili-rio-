
import React, { useState } from 'react';
import { Lead, LeadPhase, LeadStatus, Client, Property, Bank, PHASES_ORDER } from '../types';
import { X, Calendar, AlertCircle, CheckCircle, HelpCircle, Save, TrendingUp, TrendingDown } from 'lucide-react';

interface LeadDetailModalProps {
  lead: Lead;
  client?: Client;
  property?: Property;
  bank?: Bank;
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => Promise<void>;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, client, property, bank, onClose, onUpdate }) => {
  const [showMotiveInput, setShowMotiveInput] = useState<LeadStatus | null>(null);
  const [motiveText, setMotiveText] = useState('');
  const [appraisalValue, setAppraisalValue] = useState<number>(lead.appraisalValue || 0);
  const [dateValue, setDateValue] = useState<string>('');

  const isUrgent = (startDate: string) => {
    const diff = Date.now() - new Date(startDate).getTime();
    return diff > 10 * 24 * 60 * 60 * 1000;
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

  const getStatusIcon = (status: LeadStatus) => {
    if (urgent) return '❗️';
    switch (status) {
      case LeadStatus.CONCLUIDO: return '✅';
      case LeadStatus.PENDENTE: return '⚠️';
      case LeadStatus.CANCELADO: return '✖';
      case LeadStatus.EM_ANDAMENTO: return '🚩';
      default: return '';
    }
  };

  const renderPhaseContent = () => {
    switch (lead.currentPhase) {
      case LeadPhase.SIMULACAO_COLETA:
        return (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-700">Enviado para o Banco?</h4>
            <div className="flex gap-4">
              <button onClick={() => handleAdvance(LeadStatus.CONCLUIDO)} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
                <CheckCircle size={20} /> SIM (Concluir)
              </button>
              <button onClick={() => setShowMotiveInput(LeadStatus.CANCELADO)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                <X size={20} /> Cancelar
              </button>
            </div>
          </div>
        );

      case LeadPhase.APROVACAO_CREDITO:
        return (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-700">Status da Aprovação</h4>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleAdvance(LeadStatus.CONCLUIDO)} className="bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">APROVADO</button>
              <button onClick={() => handleAdvance(LeadStatus.REPROVADO)} className="bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700">REPROVADO</button>
              <button onClick={() => setShowMotiveInput(LeadStatus.PENDENTE)} className="bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600">CONDICIONADO</button>
              <button onClick={() => setShowMotiveInput(LeadStatus.CANCELADO)} className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200">CANCELAR</button>
            </div>
          </div>
        );

      case LeadPhase.VISITA_IMOVEL:
      case LeadPhase.REGISTRO_CARTORIO:
        const label = lead.currentPhase === LeadPhase.VISITA_IMOVEL ? 'Deseja marcar a visita?' : 'Imóvel registrado?';
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
              <p className="text-xs font-black text-gray-400 uppercase">Resumo Cloud</p>
              <p className="text-sm font-bold text-gray-800">Imóvel: {property?.title}</p>
              <p className="text-sm font-bold text-gray-800">VGV: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property?.value || 0)}</p>
              <p className="text-sm font-bold text-gray-800">Banco: {bank?.name}</p>
            </div>
            <h4 className="text-sm font-bold text-gray-700">{label}</h4>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Data do Evento</label>
                <input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} className="w-full border-gray-200 rounded-xl font-bold" />
              </div>
              <button 
                onClick={() => dateValue && handleAdvance(LeadStatus.CONCLUIDO, { [lead.currentPhase === LeadPhase.VISITA_IMOVEL ? 'visitDate' : 'registryDate']: dateValue })} 
                disabled={!dateValue}
                className="bg-green-600 text-white px-8 rounded-xl font-bold disabled:opacity-50"
              >
                SIM
              </button>
              <button onClick={() => handleAdvance(LeadStatus.PENDENTE)} className="bg-amber-500 text-white px-8 rounded-xl font-bold">NÃO</button>
              <button onClick={() => setShowMotiveInput(LeadStatus.CANCELADO)} className="bg-gray-100 text-gray-700 px-4 rounded-xl font-bold">CANCELAR</button>
            </div>
          </div>
        );

      case LeadPhase.ENGENHARIA:
        const diffValue = appraisalValue - (property?.value || 0);
        const diffPerc = property?.value ? (diffValue / property.value) * 100 : 0;
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
              <p className="text-sm font-bold text-gray-800">VGV Venda: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property?.value || 0)}</p>
              <p className="text-sm font-bold text-gray-800">Banco: {bank?.name}</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Data da Vistoria</label>
                  <input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} className="w-full border-gray-200 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Valor de Avaliação / Laudo</label>
                  <input type="number" value={appraisalValue} onChange={e => setAppraisalValue(Number(e.target.value))} className="w-full border-gray-200 rounded-xl font-bold" />
                </div>
              </div>

              {appraisalValue > 0 && (
                <div className="p-4 rounded-2xl border border-gray-100 bg-white flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Diferença de Laudo</p>
                    <p className={`text-xl font-black ${diffValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diffValue)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 font-black text-lg ${diffPerc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {diffPerc >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    {diffPerc.toFixed(2)}% {diffPerc >= 0 ? '🔺' : '🔻'}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => handleAdvance(LeadStatus.CONCLUIDO, { appraisalValue, inspectionDate: dateValue })} 
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold"
                >
                  SIM (Avaliado)
                </button>
                <button onClick={() => handleAdvance(LeadStatus.PENDENTE)} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold">NÃO</button>
                <button onClick={() => setShowMotiveInput(LeadStatus.CANCELADO)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">CANCELAR</button>
              </div>
            </div>
          </div>
        );

      case LeadPhase.EMISSAO_CONTRATO:
      case LeadPhase.ASSINATURA_CONTRATO:
      case LeadPhase.LIBERACAO_RECURSOS:
        return (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-700">{lead.currentPhase}?</h4>
            <div className="flex gap-4">
              <button onClick={() => handleAdvance(LeadStatus.CONCLUIDO)} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">SIM (CONCLUÍDO)</button>
              <button onClick={() => handleAdvance(LeadStatus.PENDENTE)} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold">NÃO (PENDENTE)</button>
              {lead.currentPhase !== LeadPhase.LIBERACAO_RECURSOS && (
                <button onClick={() => setShowMotiveInput(LeadStatus.CANCELADO)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">CANCELAR</button>
              )}
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className={`bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 ${urgent ? 'border-4 border-red-500' : ''}`}>
        <div className={`p-8 text-white flex justify-between items-center ${urgent ? 'bg-red-600' : 'bg-[#1F1F1F]'}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getStatusIcon(lead.status)}</span>
            <div>
              <h3 className={`text-xl font-black tracking-tighter ${urgent ? 'animate-pulse' : ''}`}>
                {urgent ? 'URGÊNCIA SAP CLOUD' : 'TRATATIVA DE PIPELINE'}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Fase Atual: {lead.currentPhase}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between bg-gray-50 p-6 rounded-2xl">
             <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Lead / Cliente</p>
                <p className="text-lg font-black text-gray-900">{client?.name}</p>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Início da Fase</p>
                <p className="text-sm font-bold text-gray-600">{new Date(currentHistory.startDate).toLocaleDateString()} {new Date(currentHistory.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
             </div>
          </div>

          {!showMotiveInput ? renderPhaseContent() : (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={20} />
                <h4 className="font-bold">Motivo da Ação ({showMotiveInput})</h4>
              </div>
              <textarea 
                maxLength={800}
                placeholder="Descreva o motivo detalhado (máx 800 caracteres)..."
                className="w-full h-40 bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none resize-none"
                value={motiveText}
                onChange={e => setMotiveText(e.target.value)}
              />
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black text-gray-300 uppercase">{motiveText.length}/800</span>
                 <div className="flex gap-2">
                    <button onClick={() => setShowMotiveInput(null)} className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Voltar</button>
                    <button 
                      onClick={() => handleAdvance(showMotiveInput)} 
                      disabled={!motiveText.trim()}
                      className="px-8 py-3 bg-[#8B0000] text-white rounded-xl text-[10px] font-black uppercase shadow-lg disabled:opacity-50"
                    >
                      <Save size={14} className="inline mr-2" /> Gravar e Encerrar
                    </button>
                 </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
           <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">SAPIEN ENGINE v1.0.8 • Auditoria Ativa</p>
           {lead.internalMessage && (
             <div className="flex items-center gap-2 text-[#8B0000] animate-bounce">
                <HelpCircle size={14} />
                <span className="text-[9px] font-black uppercase">Mensagem Interna Disponível</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
