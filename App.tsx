
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
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { 
  clientService, brokerService, propertyService, 
  bankService, companyService, leadService 
} from './dataService';
import { X, User, Home, Landmark, Briefcase, Calendar, Clock, Edit2, Trash2, Image as ImageIcon, DollarSign, Building2, Plus, Database } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthenticated(!!firebaseUser);
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
      case 'Dashboard': return <Dashboard leads={leads} clients={clients} properties={properties} brokers={brokers} />;
      case 'Kanban': return <KanbanBoard leads={leads} clients={clients} brokers={brokers} properties={properties} updatePhase={handleUpdateLeadPhase} onAddLead={() => openLeadModal()} onEditLead={openLeadModal} onViewLead={openLeadView} onDeleteLead={handleDeleteLead} />;
      case 'List': return <LeadTable leads={leads} clients={clients} brokers={brokers} properties={properties} banks={banks} companies={companies} updatePhase={handleUpdateLeadPhase} onAddLead={() => openLeadModal()} onEditLead={openLeadModal} onDeleteLead={handleDeleteLead} onViewLead={openLeadView} />;
      case 'Clientes': return <GenericCrud title="Clientes" data={clients} type="client" onSave={(d) => d.id ? clientService.update(d.id, d) : clientService.create(d)} onDelete={clientService.remove} properties={properties} brokers={brokers} banks={banks} propertyService={propertyService} brokerService={brokerService} bankService={bankService} leads={leads} companies={companies} />;
      case 'Corretores': return <GenericCrud title="Corretores" data={brokers} type="broker" onSave={(d) => d.id ? brokerService.update(d.id, d) : brokerService.create(d)} onDelete={brokerService.remove} leads={leads} properties={properties} clients={clients} companies={companies} />;
      case 'Properties': return <GenericCrud title="Imóveis" data={properties} type="property" onSave={(d) => d.id ? propertyService.update(d.id, d) : propertyService.create(d)} onDelete={propertyService.remove} companies={companies} companyService={companyService} />;
      case 'Bancos': return <GenericCrud title="Bancos" data={banks} type="bank" onSave={(d) => d.id ? bankService.update(d.id, d) : bankService.create(d)} onDelete={bankService.remove} />;
      case 'Construtoras': return <GenericCrud title="Construtoras" data={companies} type="company" onSave={(d) => d.id ? companyService.update(d.id, d) : companyService.create(d)} onDelete={companyService.remove} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F6F8] overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        menuItems={MENU_ITEMS} 
        onLogout={handleLogout} 
        isCollapsed={!isSidebarOpen}
        setIsCollapsed={(val) => setIsSidebarOpen(!val)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">
        <Header 
          title={currentView} 
          onLogout={handleLogout} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          userEmail={user?.email || ''}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
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
          clientService={clientService}
          propertyService={propertyService}
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
          companies={companies}
        />
      )}
    </div>
  );
};

const LeadModal: React.FC<any> = ({ lead, onClose, onSave, clients, brokers, properties, banks, clientService, propertyService }) => {
  const [data, setData] = useState({
    clientId: lead?.clientId || '',
    brokerId: lead?.brokerId || '',
    propertyId: lead?.propertyId || '',
    bankId: lead?.bankId || '',
    currentPhase: lead?.currentPhase || LeadPhase.ABERTURA_CREDITO
  });

  const [isQuickAdding, setIsQuickAdding] = useState<string | null>(null);

  const handleQuickSave = async (type: string, payload: any) => {
    try {
      let res;
      if (type === 'client') res = await clientService.create(payload);
      if (type === 'property') res = await propertyService.create(payload);
      
      if (res?.id) {
        if (type === 'client') setData({...data, clientId: res.id});
        if (type === 'property') setData({...data, propertyId: res.id});
      }
      setIsQuickAdding(null);
    } catch (e) {
      alert("Erro no cadastro rápido.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#8B0000] px-8 py-6 flex items-center justify-between text-white shrink-0">
          <div>
            <h3 className="font-black uppercase tracking-widest text-sm">{lead ? 'Editar Lead' : 'Novo Lead'}</h3>
            <p className="text-[10px] font-bold text-red-200 uppercase tracking-widest mt-0.5">Sincronização Cloud Ativa</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          <form onSubmit={(e) => { e.preventDefault(); onSave(data); }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente Associado</label>
              <div className="flex gap-2">
                <select className="flex-1 border border-gray-200 rounded-xl p-3 text-sm bg-white text-gray-900 font-bold focus:ring-2 focus:ring-[#8B0000] outline-none" value={data.clientId} onChange={e => setData({...data, clientId: e.target.value})} required>
                  <option value="">Selecione o cliente...</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={() => setIsQuickAdding('client')} className="p-3 bg-gray-50 text-[#8B0000] rounded-xl border border-gray-100 hover:bg-red-50 transition-colors"><Plus size={20} /></button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Imóvel de Interesse</label>
              <div className="flex gap-2">
                <select className="flex-1 border border-gray-200 rounded-xl p-3 text-sm bg-white text-gray-900 font-bold focus:ring-2 focus:ring-[#8B0000] outline-none" value={data.propertyId} onChange={e => setData({...data, propertyId: e.target.value})} required>
                  <option value="">Selecione o imóvel...</option>
                  {properties.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <button type="button" onClick={() => setIsQuickAdding('property')} className="p-3 bg-gray-50 text-[#8B0000] rounded-xl border border-gray-100 hover:bg-red-50 transition-colors"><Plus size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Corretor Responsável</label>
                <select className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-white text-gray-900 font-bold focus:ring-2 focus:ring-[#8B0000] outline-none" value={data.brokerId} onChange={e => setData({...data, brokerId: e.target.value})}>
                  <option value="">Opcional...</option>
                  {brokers.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Banco Financiador</label>
                <select className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-white text-gray-900 font-bold focus:ring-2 focus:ring-[#8B0000] outline-none" value={data.bankId} onChange={e => setData({...data, bankId: e.target.value})}>
                  <option value="">Opcional...</option>
                  {banks.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-10 pt-6 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-6 py-3 text-gray-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
              <button type="submit" className="px-10 py-3 bg-[#8B0000] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-[#6b0000] hover:scale-105 transition-all">Salvar Lead Cloud</button>
            </div>
          </form>
        </div>
      </div>

      {isQuickAdding && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                 <h4 className="font-black text-[#8B0000] uppercase text-xs tracking-widest">Cadastro Rápido: {isQuickAdding}</h4>
                 <button onClick={() => setIsQuickAdding(null)}><X size={20} className="text-gray-300" /></button>
              </div>
              <div className="space-y-4">
                 {isQuickAdding === 'client' && (
                   <>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Nome Completo</label>
                        <input id="q-name" className="w-full border border-gray-200 rounded-xl p-3 font-bold" placeholder="Nome do cliente" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">CPF</label>
                        <input id="q-tax" className="w-full border border-gray-200 rounded-xl p-3 font-bold" placeholder="000.000.000-00" />
                     </div>
                   </>
                 )}
                 {isQuickAdding === 'property' && (
                   <>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Descrição/Título</label>
                        <input id="q-title" className="w-full border border-gray-200 rounded-xl p-3 font-bold" placeholder="Apartamento..." />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Valor Venda</label>
                        <input id="q-val" type="number" className="w-full border border-gray-200 rounded-xl p-3 font-bold" placeholder="0.00" />
                     </div>
                   </>
                 )}
                 <button 
                  onClick={() => {
                    const payload: any = {};
                    if (isQuickAdding === 'client') {
                      payload.name = (document.getElementById('q-name') as HTMLInputElement).value;
                      payload.taxId = (document.getElementById('q-tax') as HTMLInputElement).value;
                      payload.status = 'Ativo';
                    } else {
                      payload.title = (document.getElementById('q-title') as HTMLInputElement).value;
                      payload.value = Number((document.getElementById('q-val') as HTMLInputElement).value);
                    }
                    handleQuickSave(isQuickAdding, payload);
                  }}
                  className="w-full py-3 bg-[#1F1F1F] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg mt-4"
                 >
                    Cadastrar e Selecionar
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const LeadDetailsModal: React.FC<any> = ({ lead, onClose, onEdit, onDelete, clients, brokers, properties, banks, companies }) => {
  const client = clients.find((c: any) => c.id === lead.clientId);
  const property = properties.find((p: any) => p.id === lead.propertyId);
  const broker = brokers.find((b: any) => b.id === lead.brokerId);
  const bank = banks.find((b: any) => b.id === lead.bankId);
  const company = companies.find((c: any) => c.id === property?.constructionCompanyId);

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

  const commissionValue = broker && property ? (Number(property.value) * Number(broker.commissionRate)) / 100 : 0;
  const daysInProcess = calculateProcessDays(lead);
  const isCompleted = lead.currentPhase === LeadPhase.ASSINATURA_CONTRATO;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-10 pb-4 flex justify-between items-start shrink-0 bg-white sticky top-0 z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B0000] bg-red-50 px-3 py-1.5 rounded-full">Executive Lead Insight</span>
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full ${isCompleted ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                {isCompleted ? `Ciclo Concluído: ${daysInProcess} dias` : `Ciclo em Aberto: ${daysInProcess} dias`}
              </span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{client?.name || 'Cliente Cloud'}</h2>
            <div className="flex items-center space-x-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
              <Clock size={14} className="text-[#8B0000]" />
              <span>Aberto em {new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full text-gray-300 transition-all"><X size={32} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-10 pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6">
            <div className="lg:col-span-7 space-y-8">
              <div className="relative group">
                <div className="w-full aspect-[16/10] rounded-[2rem] overflow-hidden bg-gray-100 shadow-2xl border border-gray-100">
                  {property?.photos?.[0] ? (
                    <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
                      <ImageIcon size={80} strokeWidth={1} />
                      <p className="text-[10px] font-black uppercase mt-4 tracking-widest">Sem Imagem do Imóvel</p>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-6 -right-6 bg-[#1F1F1F] text-white p-8 rounded-[2rem] shadow-2xl border-4 border-white animate-in slide-in-from-bottom duration-500">
                   <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">Valor do Ativo</p>
                   <p className="text-3xl font-black tracking-tighter">{property ? formatCurrency(property.value) : 'R$ 0,00'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalhes do Imóvel e Construtora</h4>
                  {company && <span className="bg-[#8B0000] text-white text-[9px] font-black uppercase px-2 py-1 rounded">{company.name}</span>}
                </div>
                <p className="font-black text-gray-900 text-xl leading-tight mb-4">{property?.title || 'Imóvel não vinculado'}</p>
                <div className="flex flex-wrap gap-3">
                   <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 uppercase">{property?.type}</span>
                   <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 uppercase">{property?.neighborhood}</span>
                   <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 uppercase">{property?.city} / {property?.state}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={20} /></div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Corretor Titular</h4>
                  </div>
                  <p className="text-lg font-black text-gray-900 leading-tight">{broker?.name || 'Não Atribuído'}</p>
                  {broker && (
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Comissão ({broker.commissionRate}%)</p>
                        <p className="text-md font-black text-green-600">{formatCurrency(commissionValue)}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-bold text-gray-400 uppercase">CRECI</p>
                         <p className="text-[10px] font-black text-gray-900">{broker.creci}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gray-50 text-gray-600 rounded-xl"><Landmark size={20} /></div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Banco Financiador</h4>
                  </div>
                  <div className="flex items-center space-x-4">
                    {bank?.logo && (
                      <div className="w-12 h-12 shrink-0 border border-gray-100 rounded-2xl p-2 bg-white flex items-center justify-center">
                        <img src={bank.logo} alt={bank.name} className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-black text-gray-900 leading-tight">{bank?.name || 'Venda Direta / À Vista'}</p>
                      {bank && <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Agência {bank.agency}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center">
                  <Clock size={16} className="mr-3 text-[#8B0000]" /> Histórico de Processamento
                </h4>
                <div className="relative pl-6 space-y-8 border-l-2 border-gray-200 ml-2 py-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                  {lead.history?.slice().reverse().map((h: any, i: number) => (
                    <div key={i} className="relative animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className={`absolute -left-[32px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-all ${i === 0 ? 'bg-[#8B0000] scale-125' : 'bg-gray-300'}`} />
                      <div className="space-y-1">
                        <p className={`text-xs font-black uppercase tracking-wider ${i === 0 ? 'text-[#8B0000]' : 'text-gray-500'}`}>{h.phase}</p>
                        <p className="text-[10px] text-gray-400 font-bold">
                          {new Date(h.date).toLocaleDateString()} às {new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 flex flex-wrap gap-4 justify-between items-center bg-white shrink-0">
          <div className="flex items-center space-x-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">
             <Database size={14} />
             <span>Sincronizado via Sapien DB Engine</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onDelete} 
              className="px-8 py-3.5 border border-red-100 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
            >
              Excluir Registro
            </button>
            <button 
              onClick={onEdit} 
              className="px-12 py-3.5 bg-[#8B0000] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-[#6b0000] hover:scale-105 transition-all flex items-center"
            >
              <Edit2 size={16} className="mr-3" /> Editar Lead Cloud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
