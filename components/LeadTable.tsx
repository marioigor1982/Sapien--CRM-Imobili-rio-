
import React, { useState } from 'react';
import { Lead, Client, Broker, Property, Bank, ConstructionCompany, LeadPhase, LeadStatus } from '../types';
import { Eye, Edit2, Trash2, Zap, Clock, User, Briefcase, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

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
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operações em Tempo Real</h3>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Gestão de Leads Cloud</h2>
        </div>
        <button 
          onClick={onAddLead}
          className="flex items-center space-x-3 bg-[#8B0000] text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-black transition-all"
        >
          <Zap size={16} />
          <span>Inserir Novo Lead</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Proponente</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Corretor</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fase Atual</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativo VGV</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tratativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest opacity-30">
                    Nenhum lead encontrado no Sapien Cloud
                  </td>
                </tr>
              ) : leads.map(lead => {
                const client = clients.find(c => c.id === lead.clientId);
                const property = properties.find(p => p.id === lead.propertyId);
                const broker = brokers.find(b => b.id === lead.brokerId);
                const isExpanded = expandedLead === lead.id;

                return (
                  <React.Fragment key={lead.id}>
                    <tr className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-4">
                          <span className="text-lg">{getStatusEmoji(lead)}</span>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-sm">{client?.name || 'Cliente Externo'}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{client?.taxId || 'S/ DOC'}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <Briefcase size={14} className="text-[#8B0000]" />
                           <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">{broker?.name || '---'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-lg border border-slate-200 tracking-tighter">
                          {lead.currentPhase}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-[#8B0000]">{formatCurrency(property?.value || 0)}</span>
                          <span className="text-[9px] font-bold text-slate-400 truncate max-w-[150px]">{property?.title}</span>
                        </div>
                      </td>

                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                            className="p-2 text-slate-300 hover:text-slate-600 transition-colors"
                            title="Ver Evolução"
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <Clock size={18} />}
                          </button>
                          <button 
                            onClick={() => onViewLead?.(lead)}
                            className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-black transition-all"
                          >
                            <Zap size={14} /> Tratar
                          </button>
                          <button onClick={() => onDeleteLead(lead.id)} className="p-2 text-slate-300 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={5} className="px-10 py-8 border-l-4 border-[#8B0000]">
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-4">Evolução de Fases (Histórico Digital)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {lead.history.map((hist, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                  <div className={`absolute top-0 left-0 w-1 h-full ${hist.endDate ? 'bg-green-500' : 'bg-[#8B0000]'}`}></div>
                                  <p className="text-[9px] font-black text-[#8B0000] uppercase mb-1">{hist.phase}</p>
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                      <Clock size={10} /> Início: {formatDate(hist.startDate)}
                                    </p>
                                    {hist.endDate && (
                                      <p className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                                        <CheckCircle size={10} /> Fim: {formatDate(hist.endDate)}
                                      </p>
                                    )}
                                    <p className="text-[9px] font-black uppercase text-slate-400 mt-2">Status: {hist.status}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CheckCircle = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default LeadTable;
