
import React, { useState, useEffect } from 'react';
import { 
  Client, Broker, Property, Bank, ConstructionCompany, Lead, 
  ViewType, LeadPhase, PHASES_ORDER
} from './types';
import { MENU_ITEMS } from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import LeadTable from './components/LeadTable';
import Login from './components/Login';
import GenericCrud from './components/GenericCrud';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  clientService, brokerService, propertyService, 
  bankService, companyService, leadService 
} from './dataService';
import { X, User, Home, Landmark, Briefcase, Calendar, Clock, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('Dashboard');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isLeadViewOpen, setIsLeadViewOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [companies, setCompanies] = useState<ConstructionCompany[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubClients = clientService.subscribe(setClients);
    const unsubBrokers = brokerService.subscribe(setBrokers);
    const unsubProps = propertyService.subscribe(setProperties);
    const unsubBanks = bankService.subscribe(setBanks);
    const unsubCompanies = companyService.subscribe(setCompanies);
    const unsubLeads = leadService.subscribe(setLeads);

    return () => {
      unsubClients(); unsubBrokers(); unsubProps();
      unsubBanks(); unsubCompanies(); unsubLeads();
    };
  }, [isAuthenticated]);

  const handleUpdateLeadPhase = async (leadId: string, newPhase: LeadPhase) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      const updatedHistory = [...(lead.history || []), { phase: newPhase, date: new Date().toISOString() }];
      await leadService.update(leadId, { ...lead, currentPhase: newPhase, history: updatedHistory });
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm('Deseja realmente excluir este lead permanentemente?')) {
      await leadService.remove(id);
      if (viewingLead?.id === id) setIsLeadViewOpen(false);
    }
  };

  const openLeadModal = (lead: Lead | null = null) => {
    setEditingLead(lead);
    setIsLeadModalOpen(true);
  };

  const openLeadView = (lead: Lead) => {
    setViewingLead(lead);
    setIsLeadViewOpen(true);
  };

  const saveLead = async (leadData: Partial<Lead>) => {
    try {
      if (editingLead) {
        await leadService.update(editingLead.id, leadData);
      } else {
        await leadService.create({
          ...leadData,
          history: [{ phase: leadData.currentPhase || LeadPhase.ABERTURA_CREDITO, date: new Date().toISOString() }]
        });
      }
      setIsLeadModalOpen(false);
    } catch (e) {
      alert("Erro ao salvar lead no Firestore");
    }
  };

  const handleLogout = () => signOut(auth);

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#F4F6F8]">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-[#8B0000] uppercase tracking-widest text-xs animate-pulse">Sincronizando Sapien Cloud...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard': return <Dashboard leads={leads} clients={clients} properties={properties} />;
      case 'Kanban': return <KanbanBoard leads={leads} clients={clients} brokers={brokers} properties={properties} updatePhase={handleUpdateLeadPhase} onAddLead={() => openLeadModal()} onEditLead={openLeadModal} onViewLead={openLeadView} onDeleteLead={handleDeleteLead} />;
      case 'List': return <LeadTable leads={leads} clients={clients} brokers={brokers} properties={properties} banks={banks} companies={companies} updatePhase={handleUpdateLeadPhase} onAddLead={() => openLeadModal()} onEditLead={openLeadModal} onDeleteLead={handleDeleteLead} onViewLead={openLeadView} />;
      case 'Clientes': return <GenericCrud title="Clientes" data={clients} type="client" onSave={(d) => d.id ? clientService.update(d.id, d) : clientService.create(d)} onDelete={clientService.remove} />;
      case 'Corretores': return <GenericCrud title="Corretores" data={brokers} type="broker" onSave={(d) => d.id ? brokerService.update(d.id, d) : brokerService.create(d)} onDelete={brokerService.remove} leads={leads} properties={properties} />;
      case 'Properties': return <GenericCrud title="Imóveis" data={properties} type="property" onSave={(d) => d.id ? propertyService.update(d.id, d) : propertyService.create(d)} onDelete={propertyService.remove} companies={companies} />;
      case 'Bancos': return <GenericCrud title="Bancos" data={banks} type="bank" onSave={(d) => d.id ? bankService.update(d.id, d) : bankService.create(d)} onDelete={bankService.remove} />;
      case 'Construtoras': return <GenericCrud title="Construtoras" data={companies} type="company" onSave={(d) => d.id ? companyService.update(d.id, d) : companyService.create(d)} onDelete={companyService.remove} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F6F8]">
      <Sidebar currentView={currentView} setView={setCurrentView} menuItems={MENU_ITEMS} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={currentView} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto h-full">{renderView()}</div>
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
        />
      )}

      {isLeadViewOpen && viewingLead && (
        <LeadDetailsModal 
          lead={viewingLead} 
          onClose={() => setIsLeadViewOpen(false)} 
          onEdit={() => { setIsLeadViewOpen(false); openLeadModal(viewingLead); }} 
          onDelete={() => handleDeleteLead(viewingLead.id)} 
          clients={clients} 
          brokers={brokers} 
          properties={properties} 
          banks={banks} 
        />
      )}
    </div>
  );
};

const LeadModal: React.FC<any> = ({ lead, onClose, onSave, clients, brokers, properties, banks }) => {
  const [data, setData] = useState({
    clientId: lead?.clientId || '',
    brokerId: lead?.brokerId || '',
    propertyId: lead?.propertyId || '',
    bankId: lead?.bankId || '',
    currentPhase: lead?.currentPhase || LeadPhase.ABERTURA_CREDITO
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#8B0000] px-6 py-4 flex items-center justify-between text-white">
          <h3 className="font-bold uppercase tracking-widest text-sm">{lead ? 'Editar Lead Cloud' : 'Novo Lead Cloud'}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(data); }} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase">Cliente</label>
            <select className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-900 font-bold" value={data.clientId} onChange={e => setData({...data, clientId: e.target.value})} required>
              <option value="">Selecione um cliente...</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase">Imóvel</label>
            <select className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-900 font-bold" value={data.propertyId} onChange={e => setData({...data, propertyId: e.target.value})} required>
              <option value="">Selecione um imóvel...</option>
              {properties.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase">Corretor</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-900 font-bold" value={data.brokerId} onChange={e => setData({...data, brokerId: e.target.value})}>
                <option value="">Opcional...</option>
                {brokers.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase">Banco</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-900 font-bold" value={data.bankId} onChange={e => setData({...data, bankId: e.target.value})}>
                <option value="">Opcional...</option>
                {banks.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2 text-gray-400 font-bold uppercase text-xs">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-[#8B0000] text-white rounded-lg font-black uppercase text-xs shadow-lg hover:bg-[#6b0000]">Salvar no Firestore</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LeadDetailsModal: React.FC<any> = ({ lead, onClose, onEdit, onDelete, clients, brokers, properties, banks }) => {
  const client = clients.find((c: any) => c.id === lead.clientId);
  const property = properties.find((p: any) => p.id === lead.propertyId);
  const broker = brokers.find((b: any) => b.id === lead.brokerId);
  const bank = banks.find((b: any) => b.id === lead.bankId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B0000] bg-red-50 px-2 py-1 rounded">Lead Detail (Cloud)</span>
              <h2 className="text-3xl font-black text-gray-900 mt-2">{client?.name || 'Cliente'}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Property Image Section */}
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 shadow-lg border border-gray-100">
                {property?.photos?.[0] ? (
                  <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={48} strokeWidth={1} />
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Imóvel</h4>
                <p className="font-bold text-gray-900 text-lg line-clamp-2">{property?.title || 'Não vinculado'}</p>
                <p className="text-2xl font-black text-[#8B0000] mt-2">
                  {property ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.value) : 'R$ 0,00'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Corretor</h4>
                  <p className="text-sm font-bold text-gray-900 truncate">{broker?.name || 'Não atribuído'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Banco</h4>
                  <p className="text-sm font-bold text-gray-900 truncate">{bank?.name || 'Não definido'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Histórico do Pipeline</h4>
              <div className="relative pl-6 space-y-6 border-l-2 border-gray-100 ml-2">
                {lead.history?.slice().reverse().map((h: any, i: number) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${i === 0 ? 'bg-[#8B0000]' : 'bg-gray-300'}`} />
                    <p className={`text-xs font-bold uppercase ${i === 0 ? 'text-[#8B0000]' : 'text-gray-500'}`}>{h.phase}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{new Date(h.date).toLocaleDateString()} às {new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end space-x-3">
            <button onClick={onDelete} className="px-6 py-2 border border-red-200 text-red-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-colors">Excluir</button>
            <button onClick={onEdit} className="px-6 py-2 bg-[#8B0000] text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-md hover:bg-[#6b0000] transition-colors">Editar Dados</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
