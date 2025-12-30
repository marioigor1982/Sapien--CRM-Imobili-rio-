
import React, { useState } from 'react';
import { Lead, LeadPhase, PHASES_ORDER, Client, Broker, Property } from '../types';
import { MoreHorizontal, User, MapPin, Plus } from 'lucide-react';

interface KanbanBoardProps {
  leads: Lead[];
  clients: Client[];
  brokers: Broker[];
  properties: Property[];
  updatePhase: (leadId: string, newPhase: LeadPhase) => void;
  onAddLead?: () => void;
  onEditLead?: (lead: Lead) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  leads, clients, brokers, properties, updatePhase, onAddLead, onEditLead 
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('leadId', leadId);
    e.dataTransfer.effectAllowed = 'move';
    // Create a ghost element look
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggedLeadId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPhase: LeadPhase) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId') || draggedLeadId;
    if (leadId) {
      updatePhase(leadId, targetPhase);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Pipeline de Vendas (3 Colunas x 2 Linhas)</h3>
        <button 
          onClick={onAddLead}
          className="flex items-center space-x-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-[#6b0000] transition-all"
        >
          <Plus size={16} />
          <span>Novo Lead</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PHASES_ORDER.map((phase, index) => {
          const phaseLeads = leads.filter(l => l.currentPhase === phase);
          const progress = Math.round(((index + 1) / PHASES_ORDER.length) * 100);

          return (
            <div 
              key={phase} 
              className="flex flex-col h-[450px] bg-gray-50 rounded-xl border border-gray-200 shadow-sm transition-all overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, phase)}
            >
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[#1F1F1F] text-xs uppercase tracking-wider truncate max-w-[180px]">{phase}</h3>
                  <span className="bg-[#8B0000] text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {phaseLeads.length}
                  </span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full">
                  <div 
                    className="h-full bg-[#8B0000] rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>

              <div className="flex-1 p-3 space-y-3 overflow-y-auto bg-gray-50/50 scrollbar-hide">
                {phaseLeads.map(lead => {
                  const client = clients.find(c => c.id === lead.clientId);
                  const property = properties.find(p => p.id === lead.propertyId);
                  const broker = brokers.find(b => b.id === lead.brokerId);

                  return (
                    <div 
                      key={lead.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onEditLead?.(lead)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-[#8B0000] hover:shadow-md transition-all cursor-move active:scale-95 group relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-[#8B0000] transition-colors line-clamp-1">{client?.name || 'Cliente'}</h4>
                        <button className="text-gray-300 hover:text-gray-500">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center text-[11px] text-gray-500">
                          <MapPin size={10} className="mr-1.5 shrink-0 text-red-400" />
                          <span className="truncate">{property?.title || 'Sem imóvel vinculado'}</span>
                        </div>
                        <div className="flex items-center text-[11px] text-gray-500">
                          <User size={10} className="mr-1.5 shrink-0 text-gray-400" />
                          <span className="truncate">Corretor: {broker?.name || 'Não atribuído'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#8B0000]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property?.value || 0)}
                        </span>
                        <div className="flex -space-x-1">
                           <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 border border-white text-[8px] flex items-center justify-center font-bold text-gray-600 shadow-sm uppercase">
                            {client?.name?.substring(0, 2) || 'LE'}
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {phaseLeads.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center space-y-2 opacity-30">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center">
                      <Plus size={20} className="text-gray-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Vazio</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
