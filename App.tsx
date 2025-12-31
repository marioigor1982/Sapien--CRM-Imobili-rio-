
import React, { useState, useEffect } from 'react';
import { 
  Client, Broker, Property, Bank, ConstructionCompany, Lead, 
  ViewType, LeadPhase, PHASES_ORDER
} from './types';
import { 
  INITIAL_CLIENTS, INITIAL_BROKERS, INITIAL_PROPERTIES, 
  INITIAL_BANKS, INITIAL_COMPANIES, INITIAL_LEADS, MENU_ITEMS 
} from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import LeadTable from './components/LeadTable';
import Login from './components/Login';
import GenericCrud from './components/GenericCrud';
import { X, User, Home, Landmark, Briefcase, Calendar, Clock, Edit2, ImageIcon } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('Dashboard');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isLeadViewOpen, setIsLeadViewOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  
  // Persistence Layer Simulation
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('sapien_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });
  const [brokers, setBrokers] = useState<Broker[]>(() => {
    const saved = localStorage.getItem('sapien_brokers');
    return saved ? JSON.parse(saved) : INITIAL_BROKERS;
  });
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('sapien_properties');
    return saved ? JSON.parse(saved) : INITIAL_PROPERTIES;
  });
  const [banks, setBanks] = useState<Bank[]>(() => {
    const saved = localStorage.getItem('sapien_banks');
    return saved ? JSON.parse(saved) : INITIAL_BANKS;
  });
  const [companies, setCompanies] = useState<ConstructionCompany[]>(() => {
    const saved = localStorage.getItem('sapien_companies');
    return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
  });
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('sapien_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  useEffect(() => {
    localStorage.setItem('sapien_clients', JSON.stringify(clients));
    localStorage.setItem('sapien_brokers', JSON.stringify(brokers));
    localStorage.setItem('sapien_properties', JSON.stringify(properties));
    localStorage.setItem('sapien_banks', JSON.stringify(banks));
    localStorage.setItem('sapien_companies', JSON.stringify(companies));
    localStorage.setItem('sapien_leads', JSON.stringify(leads));
  }, [clients, brokers, properties, banks, companies, leads]);

  const handleUpdateLeadPhase = (leadId: string, newPhase: LeadPhase) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          currentPhase: newPhase,
          history: [...l.history, { phase: newPhase, date: new Date().toISOString() }]
        };
      }
      return l;
    }));
  };

  const openLeadModal = (lead: Lead | null = null) => {
    setEditingLead(lead);
    setIsLeadModalOpen(true);
    setIsLeadViewOpen(false);
  };

  const openLeadView = (lead: Lead) => {
    setViewingLead(lead);
    setIsLeadViewOpen(true);
  };

  const saveLead = (leadData: Partial<Lead>) => {
    if (editingLead) {
      setLeads(leads.map(l => l.id === editingLead.id ? { ...l, ...leadData } : l));
    } else {
      const newLead: Lead = {
        id: Math.random().toString(36).substr(2, 9),
        clientId: leadData.clientId || '',
        brokerId: leadData.brokerId || '',
        propertyId: leadData.propertyId || '',
        bankId: leadData.bankId || '',
        constructionCompanyId: leadData.constructionCompanyId || '',
        currentPhase: LeadPhase.ABERTURA_CREDITO,
        createdAt: new Date().toISOString(),
        history: [{ phase: LeadPhase.ABERTURA_CREDITO, date: new Date().toISOString() }],
        ...leadData
      };
      setLeads([...leads, newLead]);
    }
    setIsLeadModalOpen(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard':
        return <Dashboard leads={leads} clients={clients} properties={properties} />;
      case 'Kanban':
        return (
          <KanbanBoard 
            leads={leads} 
            clients={clients} 
            brokers={brokers} 
            properties={properties}
            updatePhase={handleUpdateLeadPhase}
            onAddLead={() => openLeadModal()}
            onEditLead={(l) => openLeadModal(l)}
            onViewLead={(l) => openLeadView(l)}
          />
        );
      case 'List':
        return (
          <LeadTable 
            leads={leads} 
            clients={clients} 
            brokers={brokers} 
            properties={properties}
            banks={banks}
            companies={companies}
            updatePhase={handleUpdateLeadPhase}
            onAddLead={() => openLeadModal()}
            onEditLead={(l) => openLeadModal(l)}
            onDeleteLead={(id) => setLeads(leads.filter(l => l.id !== id))}
            onViewLead={(l) => openLeadView(l)}
          />
        );
      case 'Clients':
        return <GenericCrud title="Clientes" data={clients} setData={setClients} type="client" />;
      case 'Brokers':
        return <GenericCrud title="Corretores" data={brokers} setData={setBrokers} type="broker" />;
      case 'Properties':
        return <GenericCrud title="Imóveis" data={properties} setData={setProperties} type="property" companies={companies} />;
      case 'Banks':
        return <GenericCrud title="Bancos" data={banks} setData={setBanks} type="bank" />;
      case 'Companies':
        return <GenericCrud title="Construtoras" data={companies} setData={setCompanies} type="company" />;
      default:
        return <div>View not implemented</div>;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#F4F6F8]">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        menuItems={MENU_ITEMS} 
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={currentView} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto h-full">
            {renderView()}
          </div>
        </main>
      </div>

      {isLeadModalOpen && (
        <LeadModal 
          lead={editingLead}
          onClose={() => setIsLeadModalOpen(false)}
          onSave={saveLead}
          clients={clients}
          brokers={brokers}
          properties={properties}
          banks={banks}
          companies={companies}
        />
      )}

      {isLeadViewOpen && viewingLead && (
        <LeadDetailsModal 
          lead={viewingLead}
          onClose={() => setIsLeadViewOpen(false)}
          onEdit={() => openLeadModal(viewingLead)}
          clients={clients}
          brokers={brokers}
          properties={properties}
          banks={banks}
        />
      )}
    </div>
  );
};

// --- MODALS ---

interface LeadModalProps {
  lead: Lead | null;
  onClose: () => void;
  onSave: (data: any) => void;
  clients: Client[];
  brokers: Broker[];
  properties: Property[];
  banks: Bank[];
  companies: ConstructionCompany[];
}

const LeadModal: React.FC<LeadModalProps> = ({ lead, onClose, onSave, clients, brokers, properties, banks, companies }) => {
  const [data, setData] = useState({
    clientId: lead?.clientId || '',
    brokerId: lead?.brokerId || '',
    propertyId: lead?.propertyId || '',
    bankId: lead?.bankId || '',
    constructionCompanyId: lead?.constructionCompanyId || '',
    currentPhase: lead?.currentPhase || LeadPhase.ABERTURA_CREDITO
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#8B0000] px-6 py-4 flex items-center justify-between text-white">
          <h3 className="font-bold uppercase tracking-widest text-sm">{lead ? 'Editar Lead' : 'Cadastrar Novo Lead'}</h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(data); }} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Cliente</label>
            <select className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={data.clientId} onChange={e => setData({...data, clientId: e.target.value})}>
              <option value="">Selecione um cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Imóvel de Interesse</label>
            <select className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={data.propertyId} onChange={e => setData({...data, propertyId: e.target.value})}>
              <option value="">Selecione um imóvel...</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.title} - R$ {p.value.toLocaleString()}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Corretor Responsável</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={data.brokerId} onChange={e => setData({...data, brokerId: e.target.value})}>
                <option value="">Selecione...</option>
                {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Banco Preferencial</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={data.bankId} onChange={e => setData({...data, bankId: e.target.value})}>
                <option value="">Selecione...</option>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Fase do Pipeline</label>
            <select className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={data.currentPhase} onChange={e => setData({...data, currentPhase: e.target.value as LeadPhase})}>
              {PHASES_ORDER.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-[#8B0000] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#6b0000] transition-colors">Salvar Lead</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface LeadDetailsModalProps {
  lead: Lead;
  onClose: () => void;
  onEdit: () => void;
  clients: Client[];
  brokers: Broker[];
  properties: Property[];
  banks: Bank[];
}

const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ lead, onClose, onEdit, clients, brokers, properties, banks }) => {
  const client = clients.find(c => c.id === lead.clientId);
  const property = properties.find(p => p.id === lead.propertyId);
  const broker = brokers.find(b => b.id === lead.brokerId);
  const bank = banks.find(b => b.id === lead.bankId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B0000] bg-red-50 px-2 py-1 rounded">Lead Insights</span>
              <h2 className="text-3xl font-black text-gray-900 leading-tight mt-2">{client?.name || 'Cliente Sem Nome'}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="font-bold">{client?.taxId}</span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                <span>{client?.email}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={24} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Esquerda: Info Principal */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 pr-4">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                      <Home size={12} className="mr-1" /> Imóvel Pretendido
                    </h4>
                    <p className="font-bold text-gray-900 text-lg mb-1">{property?.title || 'Nenhum imóvel vinculado'}</p>
                    <p className="text-sm text-gray-500 mb-2">{property?.address}</p>
                    <div className="text-2xl font-black text-[#8B0000]">
                      {property ? `R$ ${property.value.toLocaleString()}` : 'R$ 0,00'}
                    </div>
                  </div>
                  
                  {/* Miniatura da Foto do Imóvel */}
                  <div className="shrink-0">
                    <div className="w-24 h-24 rounded-xl border-2 border-white shadow-md overflow-hidden bg-white group-hover:scale-110 transition-transform duration-300">
                      {property?.photos?.[0] ? (
                        <img src={property.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <Home size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Background Decorativo */}
                <Home size={60} className="absolute -right-6 -bottom-6 text-gray-200 opacity-20 group-hover:text-[#8B0000]/10 transition-colors pointer-events-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                    <Briefcase size={12} className="mr-1" /> Corretor
                  </h4>
                  <p className="text-sm font-bold text-gray-900">{broker?.name || 'Pendente'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                   <div className="flex justify-between items-start mb-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                      <Landmark size={12} className="mr-1" /> Banco
                    </h4>
                    {bank?.logo && (
                      <div className="w-8 h-8 bg-white rounded-lg p-1 shadow-sm border border-gray-100 flex items-center justify-center">
                        <img src={bank.logo} alt={bank.name} className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-900">{bank?.name || 'Pendente'}</p>
                  {bank && <p className="text-[10px] font-bold text-[#8B0000]">{bank.avgRate}% Taxa Média</p>}
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <h4 className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-2">Status Financeiro</h4>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-900/60">Renda Mensal:</span>
                  <span className="font-bold text-red-900">R$ {client?.income.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Direita: Timeline */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                <Clock size={12} className="mr-1" /> Timeline do Lead
              </h4>
              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {lead.history.slice().reverse().map((h, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${i === 0 ? 'bg-[#8B0000] scale-125 shadow-lg' : 'bg-gray-300'}`} />
                    <div className="space-y-1">
                      <p className={`text-xs font-bold uppercase tracking-wide ${i === 0 ? 'text-[#8B0000]' : 'text-gray-500'}`}>
                        {h.phase}
                      </p>
                      <div className="flex items-center text-[10px] text-gray-400">
                        <Calendar size={10} className="mr-1" />
                        {new Date(h.date).toLocaleDateString()} às {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              ID: {lead.id.toUpperCase()}
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={onEdit} 
                className="flex items-center space-x-2 px-6 py-2 bg-[#8B0000] text-white rounded-lg font-bold text-sm shadow-lg hover:bg-[#6b0000] transition-all"
              >
                <Edit2 size={16} />
                <span>Editar Informações</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
