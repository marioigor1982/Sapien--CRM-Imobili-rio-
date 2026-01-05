
import React, { useState } from 'react';
import { Lead, Client, Broker, Property, Bank, ConstructionCompany, LeadPhase, LeadStatus, PHASES_ORDER } from '../types';
import { Eye, Edit2, Trash2, Zap, Clock, User, Briefcase, ChevronDown, ChevronUp, Calendar, ArrowRight, CheckCircle2, Wallet } from 'lucide-react';

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
    const currentHistory = lead.history?.find(h => h.phase === lead.currentPhase);
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
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleQuickAdvance = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const currentIndex = PHASES_ORDER.indexOf(lead.currentPhase);
    if (currentIndex < PHASES_ORDER.length - 1) {
      const nextPhase = PHASES_ORDER[currentIndex + 1];
      if (confirm(`Deseja avançar o lead para a fase: ${nextPhase}?`)) {
        updatePhase(lead.id, nextPhase);
      }
    } else {
      alert("Este lead já está na fase final do pipeline.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operações em Lista</h3>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Gestão de Leads Cloud</h2>
        </div>
        <button 
          onClick={onAddLead}
          className="flex items-center space-x-3 bg-[#8B0000] text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-black transition-all"
        >
          <Zap size={16} />
          <span>Inserir Novo Lead Cloud</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proponente / Status</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Corretor</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fase Atual</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">VGV Ativo</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comissão (R$)</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <Briefcase size={48} className="mb-4" />
                      <p className="font-black uppercase text-xs tracking-widest">Nenhum lead encontrado no Sapien Cloud</p>
                    </div>
                  </td>
                </tr>
              ) : leads.map(lead => {
                const client = clients.find(c => c.id === lead.clientId);
                const property = properties.find(p => p.id === lead.propertyId);
                const broker = brokers.find(b => b.id === lead.brokerId);
                const isExpanded = expandedLead === lead.id;
                
                // Cálculo da comissão
                const commissionValue = (Number(property?.value || 0) * Number(broker?.commissionRate || 0)) / 100;

                return (
                  <React.Fragment key={lead.id}>
                    <tr className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => onViewLead?.(lead)}>
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-4">
                          <span className="text-xl shrink-0">{getStatusEmoji(lead)}</span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-black text-slate-900 text-sm truncate uppercase">{client?.name || 'Cliente Externo'}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{client?.taxId || 'S/ DOCUMENTO'}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter truncate max-w-[120px]">
                              {broker?.name || 'Não Vinculado'}
                           </span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase">CRECI: {broker?.creci || '---'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-lg border border-slate-200 tracking-tighter">
                          {lead.currentPhase}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-xs font-black text-slate-600">{formatCurrency(property?.value || 0)}</span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          <Wallet size={12} className="text-[#8B0000]" />
                          <span className="text-xs font-black text-[#8B0000]">{formatCurrency(commissionValue)}</span>
                        </div>
                      </td>

                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end space-x-2" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                            className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-[#8B0000] text-white shadow-lg' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}
                            title="Ver Evolução"
                          >
                            <Clock size={18} />
                          </button>
                          
                          <button 
                            onClick={(e) => handleQuickAdvance(e, lead)}
                            className="p-2 text-slate-300 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                            title="Avançar Próxima Fase"
                          >
                            <ArrowRight size={18} />
                          </button>

                          <button 
                            onClick={() => onViewLead?.(lead)}
                            className="bg-[#8B0000] text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-all"
                          >
                            <Zap size={16} />
                          </button>
                          
                          <button onClick={() => onDeleteLead(lead.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="bg-slate-50/80 animate-in slide-in-from-top-2 duration-300">
                        <td colSpan={6} className="px-10 py-10 border-l-8 border-[#8B0000]">
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                               <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                                 <HistoryIcon size={16} className="text-[#8B0000]" /> Linha do Tempo de Evolução Digital
                               </h4>
                               <span className="text-[9px] font-black text-slate-400 uppercase">Auditado em tempo real</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {(lead.history || []).map((hist, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-soft relative overflow-hidden group hover:border-[#8B0000] transition-colors">
                                  <div className={`absolute top-0 left-0 w-1.5 h-full ${hist.endDate ? 'bg-green-500' : 'bg-[#8B0000] animate-pulse'}`}></div>
                                  <p className="text-[10px] font-black text-[#8B0000] uppercase mb-3 tracking-tighter">{hist.phase}</p>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                       <span className="text-[8px] font-black text-slate-300 uppercase">Abertura</span>
                                       <span className="text-[10px] font-bold text-slate-600">{formatDate(hist.startDate)}</span>
                                    </div>
                                    {hist.endDate && (
                                      <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                                         <span className="text-[8px] font-black text-green-400 uppercase">Encerramento</span>
                                         <span className="text-[10px] font-bold text-green-700">{formatDate(hist.endDate)}</span>
                                      </div>
                                    )}
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

const HistoryIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

export default LeadTable;
