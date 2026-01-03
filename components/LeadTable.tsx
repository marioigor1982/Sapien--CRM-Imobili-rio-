
import React from 'react';
import { Lead, Client, Broker, Property, Bank, ConstructionCompany, LeadPhase, PHASES_ORDER } from '../types';
import { Eye, Edit2, Trash2, ArrowUpRight, Plus, Clock, User, Hash } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  clients: Client[];
  brokers: Broker[];
  properties: Property[];
  banks: Bank[];
  companies: ConstructionCompany[];
  updatePhase: (leadId: string, newPhase: LeadPhase) => void;
  // Fixed: Changed onAddLead type from void to () => void to allow passing a function
  onAddLead: () => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onViewLead?: (lead: Lead) => void;
}

const LeadTable: React.FC<LeadTableProps> = ({ 
  leads, clients, brokers, properties, updatePhase, onAddLead, onEditLead, onDeleteLead, onViewLead
}) => {
  const getPhaseColor = (phase: LeadPhase) => {
    switch (phase) {
      case LeadPhase.ABERTURA_CREDITO:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case LeadPhase.APROVACAO_CREDITO:
        return 'bg-green-100 text-green-700 border-green-200';
      case LeadPhase.VISITA_IMOVEL:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case LeadPhase.ENGENHARIA:
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case LeadPhase.EMISSAO_CONTRATO:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case LeadPhase.ASSINATURA_CONTRATO:
        return 'bg-emerald-500 text-white border-emerald-600';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const calculateProcessDays = (lead: Lead) => {
    const startEntry = lead.history?.find(h => h.phase === LeadPhase.ABERTURA_CREDITO);
    const startDate = startEntry ? new Date(startEntry.date) : new Date(lead.createdAt);
    
    const endEntry = lead.history?.find(h => h.phase === LeadPhase.ASSINATURA_CONTRATO);
    const endDate = endEntry ? new Date(endEntry.date) : new Date();
    
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Operações de Pipeline</h3>
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Gestão de Leads</h2>
        </div>
        <button 
          // Fixed: Corrected onClick handler to use onAddLead directly now that the type is correct
          onClick={onAddLead}
          className="flex items-center space-x-2 bg-[#8B0000] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#6b0000] transition-all hover:scale-105"
        >
          <Plus size={16} />
          <span>Novo Lead Cloud</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente / ID</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Fase Operacional</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tempo de Ciclo</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativo Imobiliário</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor VGV</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsável</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map(lead => {
                const client = clients.find(c => c.id === lead.clientId);
                const property = properties.find(p => p.id === lead.propertyId);
                const broker = brokers.find(b => b.id === lead.brokerId);
                
                const phaseIndex = PHASES_ORDER.indexOf(lead.currentPhase);
                const progress = Math.round(((phaseIndex + 1) / PHASES_ORDER.length) * 100);
                const daysInProcess = calculateProcessDays(lead);
                const isCompleted = lead.currentPhase === LeadPhase.ASSINATURA_CONTRATO;

                return (
                  <tr key={lead.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-5 cursor-pointer whitespace-nowrap" onClick={() => onViewLead?.(lead)}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center font-black text-[10px] shrink-0 border border-gray-800">
                          {client?.name?.charAt(0) || 'L'}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900 group-hover:text-[#8B0000] transition-colors truncate max-w-[180px]">
                            {client?.name || 'Cliente Externo'}
                          </span>
                          <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 tracking-tighter uppercase shrink-0">
                            {client?.taxId || 'S/ DOC'}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <span className={`px-3 py-1.5 border ${getPhaseColor(lead.currentPhase)} text-[9px] font-black uppercase rounded-lg shadow-sm tracking-widest inline-block min-w-[140px]`}>
                        {lead.currentPhase}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : 'bg-[#8B0000]'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest flex items-center ${isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>
                          <Clock size={10} className="mr-1.5" />
                          {daysInProcess} {daysInProcess === 1 ? 'dia' : 'dias'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 font-bold truncate max-w-[150px]">
                          {property?.title || 'Não vinculado'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-xs font-black text-gray-900">
                        {formatCurrency(property?.value || 0)}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-400">
                          <User size={10} />
                        </div>
                        <span className="text-xs text-gray-600 font-bold">{broker?.name || '---'}</span>
                      </div>
                    </td>

                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-x-2">
                        <button 
                          onClick={() => onViewLead?.(lead)}
                          className="p-2 text-gray-400 hover:text-[#8B0000] hover:bg-red-50 rounded-xl transition-all"
                          title="Detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        {phaseIndex < PHASES_ORDER.length - 1 && (
                          <button 
                            onClick={() => updatePhase(lead.id, PHASES_ORDER[phaseIndex + 1])}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Avançar Pipeline"
                          >
                            <ArrowUpRight size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => onEditLead(lead)}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => { if(confirm('Remover este lead permanentemente?')) onDeleteLead(lead.id) }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Remover"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {leads.length === 0 && (
          <div className="py-32 text-center">
            <div className="flex flex-col items-center justify-center opacity-20">
              <Eye size={64} strokeWidth={1} className="mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Vazio: Sem leads ativos no Sapien DB</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-[#8B0000]"></div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ativos Cloud</span>
           </div>
           <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Convertidos</span>
           </div>
        </div>
        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Sapien Engine v1.0.4</span>
      </div>
    </div>
  );
};

export default LeadTable;
