
import React from 'react';
import { Lead, Client, Broker, Property, Bank, ConstructionCompany, LeadPhase, PHASES_ORDER } from '../types';
import { Eye, Edit2, Trash2, ArrowUpRight, Plus } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  clients: Client[];
  brokers: Broker[];
  properties: Property[];
  banks: Bank[];
  companies: ConstructionCompany[];
  updatePhase: (leadId: string, newPhase: LeadPhase) => void;
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Gestão de Leads</h3>
        <button 
          onClick={onAddLead}
          className="flex items-center space-x-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-[#6b0000] transition-all"
        >
          <Plus size={16} />
          <span>Novo Lead</span>
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Fase Atual</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Progresso</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Imóvel</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Corretor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map(lead => {
                const client = clients.find(c => c.id === lead.clientId);
                const property = properties.find(p => p.id === lead.propertyId);
                const broker = brokers.find(b => b.id === lead.brokerId);
                
                const phaseIndex = PHASES_ORDER.indexOf(lead.currentPhase);
                const progress = Math.round(((phaseIndex + 1) / PHASES_ORDER.length) * 100);

                return (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => onViewLead?.(lead)}>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 group-hover:text-[#8B0000] transition-colors">{client?.name || 'Cliente não definido'}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{client?.taxId || 'Sem CPF/CNPJ'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1.5 border ${getPhaseColor(lead.currentPhase)} text-[10px] font-bold uppercase rounded-full whitespace-nowrap shadow-sm`}>
                        {lead.currentPhase}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-500">{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full">
                          <div 
                            className="h-full bg-gradient-to-r from-[#8B0000] to-red-600 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 font-medium truncate max-w-[150px] inline-block">
                        {property?.title || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property?.value || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 whitespace-nowrap">{broker?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onViewLead?.(lead)}
                          className="p-1.5 text-gray-400 hover:text-[#8B0000] hover:bg-red-50 rounded transition-all"
                          title="Ver Detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        {phaseIndex < PHASES_ORDER.length - 1 && (
                          <button 
                            onClick={() => updatePhase(lead.id, PHASES_ORDER[phaseIndex + 1])}
                            className="p-1.5 text-gray-400 hover:text-[#8B0000] hover:bg-red-50 rounded transition-all"
                            title="Avançar Fase"
                          >
                            <ArrowUpRight size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => onEditLead(lead)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
                          title="Editar Lead"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => { if(confirm('Excluir este lead?')) onDeleteLead(lead.id) }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                          title="Excluir Lead"
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
          <div className="py-20 text-center">
            <p className="text-gray-400 font-medium">Nenhum lead encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadTable;
