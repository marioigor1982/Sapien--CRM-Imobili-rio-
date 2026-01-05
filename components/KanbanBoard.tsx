
import React, { useState } from 'react';
import { Lead, LeadPhase, PHASES_ORDER, Client, Broker, Property, LeadStatus, Bank } from '../types';
import { MapPin, Plus, Trash2, MessageSquare, AlertTriangle, Building2, Landmark } from 'lucide-react';

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
  leads, clients, brokers, properties, banks, updatePhase, onAddLead, onViewLead, onDeleteLead, isAdmin 
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDrop = (e: React.DragEvent, targetPhase: LeadPhase) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId') || draggedLeadId;
    if (leadId) updatePhase(leadId, targetPhase);
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

  const renderPhaseColumn = (phase: LeadPhase) => {
    const phaseLeads = leads.filter(l => l.currentPhase === phase);
    return (
      <div 
        key={phase} 
        className="flex flex-col min-w-[300px] bg-gray-50/50 rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, phase)}
      >
        <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
          <h4 className="font-black text-[9px] text-gray-900 uppercase tracking-widest truncate" title={phase}>{phase}</h4>
          <span className="bg-[#8B0000] text-white px-2 py-0.5 rounded-lg text-[9px] font-black">{phaseLeads.length}</span>
        </div>

        <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[400px] scrollbar-hide">
          {phaseLeads.map(lead => {
            const client = clients.find(c => c.id === lead.clientId);
            const property = properties.find(p => p.id === lead.propertyId);
            const bank = banks.find(b => b.id === lead.bankId);
            const urgent = isLeadUrgent(lead);
            
            return (
              <div 
                key={lead.id} 
                draggable 
                onDragStart={(e) => handleDragStart(e, lead.id)}
                onClick={() => onViewLead?.(lead)}
                className={`bg-white rounded-2xl shadow-soft border transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden ${urgent ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-100 hover:border-[#8B0000]'}`}
              >
                {/* Foto do Imóvel no Topo do Card */}
                {property?.photos?.[0] && (
                  <div className="h-20 w-full overflow-hidden">
                    <img src={property.photos[0]} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2">
                       <span className="text-sm">{getStatusEmoji(lead)}</span>
                       <h5 className={`font-black text-[11px] truncate max-w-[120px] ${urgent ? 'text-red-600' : 'text-gray-900'}`}>{client?.name}</h5>
                     </div>
                     {bank?.logo && (
                       <img src={bank.logo} alt={bank.name} className="h-5 w-5 object-contain rounded" />
                     )}
                  </div>
                  
                  <div className="space-y-1 mb-3">
                     <div className={`flex items-center text-[9px] font-bold ${urgent ? 'text-red-500' : 'text-gray-400'}`}>
                       <MapPin size={10} className="mr-1 shrink-0" /> 
                       <span className="truncate">{property?.title || 'Sem Imóvel'}</span>
                     </div>
                  </div>

                  <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                     <span className={`text-[10px] font-black ${urgent ? 'text-red-700 underline' : 'text-[#8B0000]'}`}>
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property?.value || 0)}
                     </span>
                     <div className="flex items-center gap-1">
                        {lead.internalMessage && <MessageSquare size={12} className="text-[#8B0000] animate-pulse" />}
                        {isAdmin && (
                          <button onClick={(e) => { e.stopPropagation(); onDeleteLead?.(lead.id); }} className="p-1 text-gray-300 hover:text-red-600 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        )}
                     </div>
                  </div>
                </div>

                {urgent && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase flex items-center gap-1 animate-pulse z-10">
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
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pipeline Cloud Sapien</h3>
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Fluxo Operacional (8 Fases)</h2>
        </div>
        <button onClick={onAddLead} className="bg-[#8B0000] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center hover:scale-105 transition-all">
          <Plus size={16} className="mr-2" /> Novo Lead Cloud
        </button>
      </div>

      {/* Kanban em 2 Linhas de 4 Colunas */}
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PHASES_ORDER.slice(0, 4).map(phase => renderPhaseColumn(phase))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PHASES_ORDER.slice(4, 8).map(phase => renderPhaseColumn(phase))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
