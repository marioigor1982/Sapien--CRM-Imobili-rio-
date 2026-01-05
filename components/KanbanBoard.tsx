
import React, { useState } from 'react';
import { Lead, LeadPhase, PHASES_ORDER, Client, Broker, Property, LeadStatus } from '../types';
import { MapPin, User, Plus, GripVertical, Eye, Trash2, Clock, MessageSquare, AlertTriangle } from 'lucide-react';

interface KanbanBoardProps {
  leads: Lead[];
  clients: Client[];
  brokers: Broker[];
  properties: Property[];
  updatePhase: (leadId: string, newPhase: LeadPhase) => void;
  onAddLead?: () => void;
  onEditLead?: (lead: Lead) => void;
  onViewLead?: (lead: Lead) => void;
  onDeleteLead?: (id: string) => void;
  isAdmin: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  leads, clients, brokers, properties, updatePhase, onAddLead, onViewLead, onDeleteLead, isAdmin 
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

  return (
    <div className="space-y-6 pb-10 overflow-x-auto">
      <div className="flex justify-between items-center min-w-max">
        <div><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pipeline Digital SAP Cloud</h3></div>
        <button onClick={onAddLead} className="bg-[#8B0000] text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center"><Plus size={16} className="mr-2" /> Novo Lead Cloud</button>
      </div>

      <div className="flex space-x-6 pb-6 scrollbar-hide">
        {PHASES_ORDER.map((phase) => {
          const phaseLeads = leads.filter(l => l.currentPhase === phase);
          return (
            <div 
              key={phase} 
              className="flex flex-col w-80 shrink-0 bg-gray-50/50 rounded-[2rem] border border-gray-200 overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, phase)}
            >
              <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                <h4 className="font-black text-[10px] text-gray-900 uppercase tracking-widest truncate mr-2" title={phase}>{phase}</h4>
                <span className="bg-[#8B0000] text-white px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0">{phaseLeads.length}</span>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[700px] scrollbar-hide">
                {phaseLeads.map(lead => {
                  const client = clients.find(c => c.id === lead.clientId);
                  const property = properties.find(p => p.id === lead.propertyId);
                  const urgent = isLeadUrgent(lead);
                  
                  return (
                    <div 
                      key={lead.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => onViewLead?.(lead)}
                      className={`bg-white p-5 rounded-2xl shadow-sm border transition-all cursor-grab active:cursor-grabbing group relative ${urgent ? 'border-red-500 bg-red-50/10' : 'border-gray-100 hover:border-[#8B0000]'}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-2">
                           <span className="text-sm">{getStatusEmoji(lead)}</span>
                           <h5 className={`font-black text-sm truncate max-w-[150px] ${urgent ? 'text-red-600' : 'text-gray-900'}`}>{client?.name}</h5>
                         </div>
                         {lead.internalMessage && <MessageSquare size={14} className="text-[#8B0000] animate-pulse" />}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                         <div className={`flex items-center text-[10px] font-bold ${urgent ? 'text-red-500' : 'text-gray-500'}`}>
                           <MapPin size={12} className="mr-2 shrink-0" /> 
                           <span className="truncate">{property?.title || 'Não vinculado'}</span>
                         </div>
                      </div>

                      <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                         <span className={`text-[11px] font-black ${urgent ? 'text-red-700 underline' : 'text-[#8B0000]'}`}>
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property?.value || 0)}
                         </span>
                         <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); onDeleteLead?.(lead.id); }} className="p-1.5 text-gray-300 hover:text-red-600"><Trash2 size={14} /></button>
                         </div>
                      </div>

                      {urgent && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] font-black text-red-600 uppercase animate-pulse">
                          <AlertTriangle size={10} /> Urgente
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
