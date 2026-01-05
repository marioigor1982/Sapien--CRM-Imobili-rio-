
import React from 'react';
import { Lead, Client, Broker, Property, Bank, ConstructionCompany, LeadPhase, PHASES_ORDER, LeadStatus } from '../types';
import { Eye, Edit2, Trash2, ArrowUpRight, Plus, Clock, User, Hash, AlertTriangle } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Operações de Pipeline</h3>
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Gestão de Leads</h2>
        </div>
        <button 
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
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Cliente</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Fase Operacional</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ativo</th>
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
                const urgent = isLeadUrgent(lead);

                return (
                  <tr key={lead.id} className={`hover:bg-gray-50/30 transition-colors group ${urgent ? 'bg-red-50/20' : ''}`}>
                    <td className="px-8 py-5 cursor-pointer whitespace-nowrap" onClick={() => onViewLead?.(lead)}>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getStatusEmoji(lead)}</span>
                        <div className="flex flex-col">
                          <span className={`font-bold transition-colors truncate max-w-[180px] ${urgent ? 'text-red-600' : 'text-gray-900 group-hover:text-[#8B0000]'}`}>
                            {client?.name || 'Cliente Externo'}
                          </span>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                            {client?.taxId || 'S/ DOC'}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <span className={`px-3 py-1.5 border text-[9px] font-black uppercase rounded-lg shadow-sm tracking-widest inline-block min-w-[160px] ${urgent ? 'border-red-500 bg-red-100 text-red-700' : 'border-gray-100 bg-gray-50 text-gray-600'}`}>
                        {lead.currentPhase}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold truncate max-w-[150px] ${urgent ? 'text-red-500' : 'text-gray-600'}`}>
                          {property?.title || 'Não vinculado'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`text-xs font-black ${urgent ? 'text-red-700 underline' : 'text-gray-900'}`}>
                        {formatCurrency(property?.value || 0)}
                      </span>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 font-bold">{broker?.name || '---'}</span>
                      </div>
                    </td>

                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-x-2">
                        <button 
                          onClick={() => onViewLead?.(lead)}
                          className="p-2 text-gray-400 hover:text-[#8B0000] hover:bg-red-50 rounded-xl transition-all"
                          title="Detalhes e Tratativa"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => onEditLead(lead)}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => { if(confirm('Remover este lead?')) onDeleteLead(lead.id) }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {['✅ Concluído', '⚠️ Pendente', '✖ Cancelado', '🚩 Em andamento', '❗️ Urgente (>10 dias)'].map(s => (
            <span key={s} className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeadTable;
