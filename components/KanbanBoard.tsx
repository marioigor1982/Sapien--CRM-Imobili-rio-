
import React, { useState } from 'react';
import { Lead, LeadPhase, PHASES_ORDER, Client, Broker, Property, LeadStatus, Bank } from '../types';
import { MapPin, Plus, Trash2, MessageSquare, AlertTriangle, Briefcase, Landmark, Eye, Edit2, Zap, Wallet } from 'lucide-react';

interface KanbanBoardProps {
  leads: Lead[];
  clients: Client[];
  brokers: Broker[];
  properties: Property[];
  banks: Bank[];
  updatePhase: (leadId: string, newPhase: LeadPhase) => void;
  onAddLead?: () => void;
  onEditLead?: (lead: Lead) => void;
  onViewLead?: (lead: Lead) => void;
  onDeleteLead?: (id: string) => void;
  isAdmin: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  leads, clients, brokers, properties, banks, updatePhase, onAddLead, onEditLead, onViewLead, onDeleteLead, isAdmin 
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('leadId', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPhase: LeadPhase) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId') || draggedLeadId;
    if (leadId) {
      updatePhase(leadId, targetPhase);
    }
    setDraggedLeadId(null);
  };

  const getStatusEmoji = (lead: Lead) => {
    const currentHistory = lead.history.find(h => h.phase === lead.currentPhase);
    const startDate = currentHistory ? currentHistory.startDate : lead.createdAt;
    const diff = Date.now() - new Date(startDate).getTime();
    const isUrgent = diff > 10 * 24 * 60 * 60 * 1000;

    if (isUrgent) return '❗️';
    switch (lead.status) {
      case LeadStatus.CONCLUIDO: return '✅';
      case LeadStatus.PENDENTE: return '⚠️';
      case LeadStatus.CANCELADO: return '✖';
      case LeadStatus.EM_ANDAMENTO: return '🚩';
      default: return '🚩';
    }
  };

  const isLeadUrgent = (lead: Lead) => {
    const currentHistory = lead.history.find(h => h.phase === lead.currentPhase);
    const startDate = currentHistory ? currentHistory.startDate : lead.createdAt;
    const diff = Date.now() - new Date(startDate).getTime();
    return diff > 10 * 24 * 60 * 60 * 1000;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const renderPhaseColumn = (phase: LeadPhase) => {
    const phaseLeads = leads.filter(l => l.currentPhase === phase);
    return (
      <div 
        key={phase} 
        className="flex flex-col min-w-[280px] bg-slate-50/50 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm transition-all hover:bg-slate-100/50"
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={(e) => handleDrop(e, phase)}
      >
        <div className="p-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-black text-[9px] text-slate-900 uppercase tracking-widest truncate max-w-[180px]" title={phase}>{phase}</h4>
          </div>
          <span className="bg-[#8B0000] text-white px-2.5 py-1 rounded-xl text-[9px] font-black shadow-lg shadow-red-100">{phaseLeads.length}</span>
        </div>

        <div className="flex-1 p-3 space-y-4 overflow-y-auto max-h-[450px] scrollbar-hide min-h-[150px]">
          {phaseLeads.map(lead => {
            const client = clients.find(c => c.id === lead.clientId);
            const property = properties.find(p => p.id === lead.propertyId);
            const broker = brokers.find(b => b.id === lead.brokerId);
            const bank = banks.find(b => b.id === lead.bankId);
            const urgent = isLeadUrgent(lead);
            
            // Cálculo da comissão para o Kanban
            const commissionValue = (Number(property?.value || 0) * Number(broker?.commissionRate || 0)) / 100;

            return (
              <div 
                key={lead.id} 
                draggable 
                onDragStart={(e) => handleDragStart(e, lead.id)}
                onClick={() => onViewLead?.(lead)}
                className={`bg-white rounded-3xl shadow-soft border transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden transform hover:-translate-y-1 hover:shadow-xl ${urgent ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-100 hover:border-[#8B0000]'}`}
              >
                {property?.photos?.[0] && (
                  <div className="h-24 w-full overflow-hidden relative">
                    <img src={property.photos[0]} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2">
                       <span className="text-sm">{getStatusEmoji(lead)}</span>
                       <h5 className={`font-black text-[11px] truncate max-w-[140px] uppercase tracking-tighter ${urgent ? 'text-red-600' : 'text-slate-900'}`}>{client?.name}</h5>
                     </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-2 px-1">
                     <Briefcase size={10} className="text-[#8B0000]" />
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter truncate">{broker?.name || 'Sem Corretor'}</span>
                  </div>
                  
                  <div className="space-y-2 mb-3 px-1">
                     <div className={`flex items-center text-[9px] font-bold ${urgent ? 'text-red-500' : 'text-slate-400'}`}>
                       <MapPin size={10} className="mr-1 shrink-0" /> 
                       <span className="truncate">{property?.title || 'Sem Ativo'}</span>
                     </div>
                     <div className="flex items-center gap-1.5 bg-slate-50 py-1.5 px-2 rounded-lg border border-slate-100">
                        <Wallet size={10} className="text-[#8B0000]" />
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Previsão Comissão</span>
                           <span className="text-[10px] font-black text-[#8B0000]">{formatCurrency(commissionValue)}</span>
                        </div>
                     </div>
                  </div>

                  <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        {bank?.logo && (
                          <img src={bank.logo} className="h-4 w-4 object-contain opacity-60 group-hover:opacity-100 transition-opacity" title={bank.name} />
                        )}
                        <span className={`text-[11px] font-black ${urgent ? 'text-red-700 underline' : 'text-slate-600'}`}>
                          {formatCurrency(property?.value || 0)}
                        </span>
                     </div>
                     <div className="flex items-center gap-1.5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onViewLead?.(lead); }} 
                          className="bg-[#8B0000] text-white p-1.5 rounded-lg shadow-sm hover:scale-110 transition-transform"
                        >
                          <Zap size={10} />
                        </button>
                        {isAdmin && (
                          <button onClick={(e) => { e.stopPropagation(); onDeleteLead?.(lead.id); }} className="p-1 text-slate-300 hover:text-red-600 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        )}
                     </div>
                  </div>
                </div>

                {urgent && (
                  <div className="absolute top-3 right-3 bg-red-600 text-white px-2.5 py-1 rounded-full text-[7px] font-black uppercase flex items-center gap-1 animate-pulse z-10 shadow-lg shadow-red-200">
                    <AlertTriangle size={8} /> Urgente
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Pipeline Cloud Sapien</h3>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Fluxo de Conversão</h2>
        </div>
        <button onClick={onAddLead} className="bg-[#8B0000] text-white px-8 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-red-200 flex items-center hover:scale-105 transition-all active:scale-95">
          <Plus size={18} className="mr-3" /> Abrir Novo Lead Cloud
        </button>
      </div>

      <div className="space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {PHASES_ORDER.slice(0, 4).map(phase => renderPhaseColumn(phase))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {PHASES_ORDER.slice(4, 8).map(phase => renderPhaseColumn(phase))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
