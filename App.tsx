
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
import { X } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('Dashboard');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
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
    </div>
  );
};

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

export default App;
