
import React, { useState, useEffect, useRef } from 'react';
import { 
  Client, Broker, Property, Bank, ConstructionCompany, Lead, 
  ViewType, LeadPhase, PHASES_ORDER, ApprovalRequest
} from './types';
import { MENU_ITEMS } from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import LeadTable from './components/LeadTable';
import Login from './components/Login';
import GenericCrud from './components/GenericCrud';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { 
  clientService, brokerService, propertyService, 
  bankService, companyService, leadService 
} from './dataService';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Settings, Bell, MessageSquare } from 'lucide-react';

const ADMIN_EMAILS = ['mario.igor1982@gmail.com', 'michael.hugo1985@hotmail.com'];

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
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  const inactivityTimer = useRef<any>(null);

  // Inactivity Timeout - 10 Minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        handleLogout();
        alert("Sessão encerrada por inatividade.");
      }, 10 * 60 * 1000); 
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [isAuthenticated]);

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

    // Monitoramento de Aprovações para Admins
    let unsubApprovals = () => {};
    if (isAdmin) {
      const q = query(collection(db, "approval_requests"), where("status", "==", "pending"));
      unsubApprovals = onSnapshot(q, (snap) => {
        setPendingApprovals(snap.docs.map(d => ({ id: d.id, ...d.data() } as ApprovalRequest)));
      });
    }

    return () => {
      unsubClients(); unsubBrokers(); unsubProps();
      unsubBanks(); unsubCompanies(); unsubLeads();
      unsubApprovals();
    };
  }, [isAuthenticated, isAdmin]);

  const handleUpdateLeadPhase = async (leadId: string, newPhase: LeadPhase) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const currentIdx = PHASES_ORDER.indexOf(lead.currentPhase);
    const nextIdx = PHASES_ORDER.indexOf(newPhase);

    // Regra: Bloquear retrocesso para não-admins
    if (!isAdmin && nextIdx < currentIdx) {
      await addDoc(collection(db, "approval_requests"), {
        type: 'regress',
        userId: user?.uid,
        userEmail: user?.email,
        leadId,
        targetPhase: newPhase,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert("Retrocesso de fase requer aprovação do Administrador.");
      return;
    }

    const updatedHistory = [...(lead.history || []), { phase: newPhase, date: new Date().toISOString() }];
    await leadService.update(leadId, { ...lead, currentPhase: newPhase, history: updatedHistory });
    alert("Lead Avançado com sucesso!");
  };

  const handleDeleteLead = async (id: string) => {
    if (!isAdmin) {
      await addDoc(collection(db, "approval_requests"), {
        type: 'delete',
        userId: user?.uid,
        userEmail: user?.email,
        leadId: id,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert("Ação não permitida: Pedido de exclusão enviado para aprovação Admin.");
      return;
    }

    if (confirm('Deseja realmente excluir este lead permanentemente?')) {
      await leadService.remove(id);
      if (viewingLead?.id === id) setIsLeadViewOpen(false);
    }
  };

  const handleApprove = async (request: ApprovalRequest, status: 'approved' | 'denied') => {
    await updateDoc(doc(db, "approval_requests", request.id), { status });
    
    if (status === 'approved') {
      if (request.type === 'delete') {
        await leadService.remove(request.leadId);
      } else if (request.type === 'regress' && request.targetPhase) {
        const leadSnap = await getDoc(doc(db, "leads", request.leadId));
        const lead = leadSnap.data() as Lead;
        const updatedHistory = [...(lead.history || []), { 
          phase: request.targetPhase, 
          date: new Date().toISOString(),
          message: "Aprovado por Admin"
        }];
        await updateDoc(doc(db, "leads", request.leadId), {
          currentPhase: request.targetPhase,
          history: updatedHistory
        });
      }
    }
  };

  const handleLogout = () => signOut(auth);

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard': return <Dashboard leads={leads} clients={clients} properties={properties} brokers={brokers} />;
      case 'Kanban': return <KanbanBoard leads={leads} clients={clients} brokers={brokers} properties={properties} updatePhase={handleUpdateLeadPhase} onAddLead={() => setIsLeadModalOpen(true)} onEditLead={setEditingLead} onViewLead={setIsLeadViewOpen as any} onDeleteLead={handleDeleteLead} isAdmin={isAdmin} />;
      case 'List': return <LeadTable leads={leads} clients={clients} brokers={brokers} properties={properties} banks={banks} companies={companies} updatePhase={handleUpdateLeadPhase} onAddLead={() => setIsLeadModalOpen(true)} onEditLead={setEditingLead as any} onDeleteLead={handleDeleteLead} onViewLead={setIsLeadViewOpen as any} isAdmin={isAdmin} />;
      case 'Clientes': return <GenericCrud title="Clientes" data={clients} type="client" onSave={(d) => d.id ? clientService.update(d.id, d) : clientService.create(d)} onDelete={clientService.remove} properties={properties} brokers={brokers} banks={banks} propertyService={propertyService} brokerService={brokerService} bankService={bankService} leads={leads} companies={companies} />;
      case 'Corretores': return <GenericCrud title="Corretores" data={brokers} type="broker" onSave={(d) => d.id ? brokerService.update(d.id, d) : brokerService.create(d)} onDelete={brokerService.remove} leads={leads} properties={properties} clients={clients} companies={companies} />;
      case 'Properties': return <GenericCrud title="Imóveis" data={properties} type="property" onSave={(d) => d.id ? propertyService.update(d.id, d) : propertyService.create(d)} onDelete={propertyService.remove} companies={companies} companyService={companyService} />;
      case 'Bancos': return <GenericCrud title="Bancos" data={banks} type="bank" onSave={(d) => d.id ? bankService.update(d.id, d) : bankService.create(d)} onDelete={bankService.remove} />;
      case 'Construtoras': return <GenericCrud title="Construtoras" data={companies} type="company" onSave={(d) => d.id ? companyService.update(d.id, d) : companyService.create(d)} onDelete={companyService.remove} />;
      case 'Settings': return isAdmin ? <div className="p-8"><h2 className="text-2xl font-black mb-6">Painel Administrativo SAP</h2><p className="text-gray-500 font-bold uppercase text-xs">Monitoramento de Segurança Ativo</p></div> : null;
      default: return null;
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#F4F6F8]"><div className="w-12 h-12 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex h-screen bg-[#F4F6F8] overflow-hidden">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} isAdmin={isAdmin} isCollapsed={!isSidebarOpen} setIsCollapsed={(v) => setIsSidebarOpen(!v)} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header title={currentView} onLogout={handleLogout} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} userEmail={user?.email || ''} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto h-full">{renderView()}</div>
        </main>
      </div>

      {isAdmin && pendingApprovals.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[100] w-96 animate-in slide-in-from-right duration-500">
          {pendingApprovals.map(req => (
            <div key={req.id} className="bg-white rounded-3xl shadow-2xl border-l-8 border-[#8B0000] p-6 mb-4 overflow-hidden relative group">
               <div className="flex items-start space-x-4">
                  <div className="p-3 bg-red-50 text-[#8B0000] rounded-2xl"><ShieldAlert size={24} /></div>
                  <div className="flex-1">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Solicitação Pendente</p>
                     <p className="text-sm font-black text-gray-900 leading-tight">
                        {req.userEmail.split('@')[0]} deseja {req.type === 'delete' ? 'excluir' : 'retroceder'} um lead.
                     </p>
                     <div className="flex space-x-2 mt-4">
                        <button onClick={() => handleApprove(req, 'approved')} className="flex-1 py-2 bg-[#8B0000] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Aprovar</button>
                        <button onClick={() => handleApprove(req, 'denied')} className="flex-1 py-2 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Negar</button>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {isLeadModalOpen && (
        <LeadModal 
          lead={editingLead} 
          onClose={() => { setIsLeadModalOpen(false); setEditingLead(null); }} 
          onSave={async (d: any) => { 
            if(editingLead) await leadService.update(editingLead.id, d);
            else await leadService.create(d);
            setIsLeadModalOpen(false);
          }} 
          clients={clients} brokers={brokers} properties={properties} banks={banks} 
          clientService={clientService} propertyService={propertyService}
        />
      )}

      {isLeadViewOpen && viewingLead && (
        <LeadDetailsModal 
          lead={viewingLead} 
          onClose={() => { setIsLeadViewOpen(false); setViewingLead(null); }} 
          onEdit={() => { setEditingLead(viewingLead); setIsLeadModalOpen(true); setIsLeadViewOpen(false); }} 
          onDelete={() => handleDeleteLead(viewingLead.id)} 
          clients={clients} brokers={brokers} properties={properties} banks={banks} companies={companies}
        />
      )}
    </div>
  );
};

// --- Modals Refatorados com campo de Mensagem Interna ---

const LeadModal: React.FC<any> = ({ lead, onClose, onSave, clients, brokers, properties, banks, clientService, propertyService }) => {
  const [data, setData] = useState({
    clientId: lead?.clientId || '',
    brokerId: lead?.brokerId || '',
    propertyId: lead?.propertyId || '',
    bankId: lead?.bankId || '',
    internalMessage: lead?.internalMessage || '',
    currentPhase: lead?.currentPhase || LeadPhase.ABERTURA_CREDITO
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-[#8B0000] px-8 py-6 flex items-center justify-between text-white">
          <h3 className="font-black uppercase tracking-widest text-sm">{lead ? 'Editar Lead' : 'Novo Lead'}</h3>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Cliente</label>
                <select className="w-full border p-3 rounded-xl font-bold" value={data.clientId} onChange={e => setData({...data, clientId: e.target.value})}>
                  <option value="">Selecione...</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Imóvel</label>
                <select className="w-full border p-3 rounded-xl font-bold" value={data.propertyId} onChange={e => setData({...data, propertyId: e.target.value})}>
                  <option value="">Selecione...</option>
                  {properties.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><MessageSquare size={12} className="mr-2" /> Mensagem Operacional (Comunicação)</label>
                <textarea 
                  className="w-full border border-gray-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#8B0000] outline-none min-h-[100px]"
                  placeholder="Instruções internas para este lead..."
                  value={data.internalMessage}
                  onChange={e => setData({...data, internalMessage: e.target.value})}
                />
             </div>
          </div>
          <button onClick={() => onSave(data)} className="w-full py-4 bg-[#8B0000] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Salvar Lead Cloud</button>
        </div>
      </div>
    </div>
  );
};

const LeadDetailsModal: React.FC<any> = ({ lead, onClose, onEdit, onDelete, clients, brokers, properties, banks, companies }) => {
  const client = clients.find((c: any) => c.id === lead.clientId);
  const property = properties.find((p: any) => p.id === lead.propertyId);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-10 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{client?.name}</h2>
            <span className="text-[10px] font-black text-[#8B0000] bg-red-50 px-3 py-1.5 rounded-full mt-2 inline-block uppercase tracking-widest">{lead.currentPhase}</span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><X size={32} /></button>
        </div>
        
        <div className="p-10 pt-4 space-y-10">
          <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex items-start space-x-6">
             <div className="p-4 bg-white rounded-2xl text-[#8B0000] shadow-sm"><MessageSquare size={28} /></div>
             <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mensagem Operacional Interna</h4>
                <p className="text-gray-700 font-bold italic">"{lead.internalMessage || 'Nenhuma instrução adicional vinculada.'}"</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Ativo Imobiliário</label>
                <p className="font-black text-xl">{property?.title}</p>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Valor VGV</label>
                <p className="font-black text-xl text-[#8B0000]">{formatCurrency(property?.value || 0)}</p>
             </div>
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 flex justify-end space-x-4 bg-white">
          <button onClick={onDelete} className="px-8 py-3.5 border border-red-100 text-red-600 rounded-2xl font-black text-[10px] uppercase">Excluir Lead</button>
          <button onClick={onEdit} className="px-12 py-3.5 bg-[#8B0000] text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Editar Dados</button>
        </div>
      </div>
    </div>
  );
};

export default App;
