
import React, { useState } from 'react';
import { Lead, LeadPhase, PHASES_ORDER, Client, Broker, Property } from '../types';
import { MoreHorizontal, User, MapPin, Plus, GripVertical, Eye } from 'lucide-react';

interface KanbanBoardProps {
  leads: Lead[];
  clients: Client[];
  brokers: Broker[];
  properties: Property[];
  updatePhase: (leadId: string, newPhase: LeadPhase) => void;
  onAddLead?: () => void;
  onEditLead?: (lead: Lead) => void;
  onViewLead?: (lead: Lead) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  leads, clients, brokers, properties, updatePhase, onAddLead, onEditLead, onViewLead 
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<LeadPhase | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('leadId', leadId);
    e.dataTransfer.effectAllowed = 'move';
    
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => {
      target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggedLeadId(null);
    setActiveDropZone(null);
  };

  const handleDragOver = (e: React.DragEvent, phase: LeadPhase) => {
    e.preventDefault();
    if (activeDropZone !== phase) {
      setActiveDropZone(phase);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX <= rect.left || e.clientX >= rect.right ||
      e.clientY <= rect.top || e.clientY >= rect.bottom
    ) {
      setActiveDropZone(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetPhase: LeadPhase) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId') || draggedLeadId;
    if (leadId) {
      updatePhase(leadId, targetPhase);
    }
    setActiveDropZone(null);
    setDraggedLeadId(null);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Pipeline de Vendas</h3>
          <p className="text-[10px] text-gray-400 font-medium">Arraste os cards para mudar de fase</p>
        </div>
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
          const isOver = activeDropZone === phase;

          return (
            <div 
              key={phase} 
              className={`flex flex-col h-[500px] rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                isOver 
                  ? 'bg-[#8B0000]/5 border-[#8B0000] border-dashed shadow-inner' 
                  : 'bg-gray-50 border-gray-200 shadow-sm'
              }`}
              onDragOver={(e) => handleDragOver(e, phase)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, phase)}
            >
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[#1F1F1F] text-[11px] uppercase tracking-wider truncate max-w-[180px]">{phase}</h3>
                  <span className="bg-[#8B0000] text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {phaseLeads.length}
                  </span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#8B0000] rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>

              <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-hide">
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
                      onClick={() => onViewLead?.(lead)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-[#8B0000] hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
                    >
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 transition-opacity">
                        <GripVertical size={16} />
                      </div>

                      <div className="flex justify-between items-start mb-2 pl-2">
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-[#8B0000] transition-colors line-clamp-1">
                          {client?.name || 'Cliente s/ nome'}
                        </h4>
                        <button className="text-gray-300 hover:text-[#8B0000] transition-colors" onClick={(e) => { e.stopPropagation(); onViewLead?.(lead); }}>
                          <Eye size={14} />
                        </button>
                      </div>

                      <div className="space-y-1.5 mb-3 pl-2">
                        <div className="flex items-center text-[11px] text-gray-500">
                          <MapPin size={10} className="mr-1.5 shrink-0 text-red-400" />
                          <span className="truncate">{property?.title || 'Sem imóvel'}</span>
                        </div>
                        <div className="flex items-center text-[11px] text-gray-500">
                          <User size={10} className="mr-1.5 shrink-0 text-gray-400" />
                          <span className="truncate">{broker?.name || 'Não atribuído'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between pl-2">
                        <span className="text-[11px] font-bold text-[#8B0000]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property?.value || 0)}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#8B0000]/10 to-[#8B0000]/20 border border-white text-[8px] flex items-center justify-center font-bold text-[#8B0000] shadow-sm uppercase">
                          {client?.name?.substring(0, 2) || 'LE'}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {phaseLeads.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center space-y-2 opacity-20 py-10">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center">
                      <Plus size={20} className="text-gray-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Arraste aqui</span>
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
