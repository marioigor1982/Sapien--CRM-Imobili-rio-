
import React, { useState, useEffect } from 'react';
import { Client, Property, Broker, Bank, ConstructionCompany, Lead, LeadPhase, LeadStatus } from '../types';
import { X, User, MapPin, Landmark, Briefcase, Building2, Save, Search } from 'lucide-react';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Partial<Lead>) => Promise<void>;
  clients: Client[];
  properties: Property[];
  brokers: Broker[];
  banks: Bank[];
  companies: ConstructionCompany[];
}

const LeadFormModal: React.FC<LeadFormModalProps> = ({ 
  isOpen, onClose, onSave, clients, properties, brokers, banks, companies 
}) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    client?: Client,
    property?: Property,
    broker?: Broker,
    bank?: Bank,
    company?: ConstructionCompany
  }>({});

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        const property = properties.find(p => p.id === client.propertyId);
        const broker = brokers.find(b => b.id === client.brokerId);
        const bank = banks.find(b => b.id === client.bankId);
        const company = property ? companies.find(c => c.id === property.constructionCompanyId) : undefined;
        
        setPreview({ client, property, broker, bank, company });
      }
    } else {
      setPreview({});
    }
  }, [selectedClientId, clients, properties, brokers, banks, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !preview.property) {
      alert("Selecione um cliente que possua um imóvel vinculado.");
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const newLead: Partial<Lead> = {
        clientId: selectedClientId,
        propertyId: preview.property.id,
        brokerId: preview.broker?.id || '',
        bankId: preview.bank?.id || '',
        constructionCompanyId: preview.company?.id || '',
        currentPhase: LeadPhase.SIMULACAO_COLETA,
        status: LeadStatus.EM_ANDAMENTO,
        createdAt: now,
        history: [{
          phase: LeadPhase.SIMULACAO_COLETA,
          startDate: now,
          status: LeadStatus.EM_ANDAMENTO
        }]
      };
      await onSave(newLead);
      onClose();
    } catch (error) {
      alert("Erro ao salvar Lead.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300 my-8">
        <div className="bg-[#1F1F1F] p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Novo Lead Pipeline</h2>
            <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.4em] mt-2">Automação Cloud Sapien</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={32} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Search size={14} className="text-red-600" /> Selecionar Proponente (Cliente)
              </label>
              <select 
                value={selectedClientId} 
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-red-100 outline-none"
                required
              >
                <option value="">Buscar na base de dados...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.taxId}</option>)}
              </select>
            </div>

            {preview.property && (
              <div className="rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-soft bg-white animate-in fade-in slide-in-from-bottom-4">
                <div className="h-48 w-full relative">
                  <img src={preview.property.photos?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=400'} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black text-[#8B0000] shadow-sm uppercase">
                    {preview.property.type}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <h4 className="font-black text-slate-900 leading-tight">{preview.property.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-[#8B0000]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preview.property.value)}
                    </span>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-slate-400 uppercase">Localização</p>
                       <p className="text-[10px] font-bold text-slate-600">{preview.property.neighborhood}, {preview.property.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Display de Vínculos Automáticos</h3>
            
            <DisplayItem icon={<Briefcase size={18} />} label="Corretor Responsável" value={preview.broker?.name} />
            <DisplayItem 
              icon={preview.bank?.logo ? <img src={preview.bank.logo} className="w-5 h-5 object-contain" /> : <Landmark size={18} />} 
              label="Instituição Bancária" 
              value={preview.bank?.name} 
            />
            <DisplayItem icon={<Building2 size={18} />} label="Construtora / Incorporadora" value={preview.company?.name} />
            
            <div className="pt-6 border-t border-slate-100 mt-6">
               <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Status Inicial de Pipeline</p>
                  <p className="text-sm font-bold text-red-900 leading-relaxed">
                    Este lead será iniciado na fase de <span className="underline">Simulação e Coleta</span> com a data de abertura registrada em {new Date().toLocaleDateString()}.
                  </p>
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !selectedClientId}
              className="w-full bg-[#8B0000] text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] transition-all disabled:opacity-30 mt-8"
            >
              {loading ? 'Sincronizando Base Cloud...' : 'Confirmar e Iniciar Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DisplayItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-red-200 transition-colors">
    <div className="p-2.5 bg-white rounded-xl text-slate-400 group-hover:text-red-600 transition-colors shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-slate-900">{value || 'Não vinculado'}</p>
    </div>
  </div>
);

export default LeadFormModal;
