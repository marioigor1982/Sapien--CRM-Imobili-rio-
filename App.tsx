
import React, { useState, useEffect, useRef } from 'react';
import { 
  Client, Broker, Property, Bank, ConstructionCompany, Lead, 
  ViewType, LeadPhase, PHASES_ORDER, ApprovalRequest, MuralMessage
} from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import LeadTable from './components/LeadTable';
import Login from './components/Login';
import GenericCrud from './components/GenericCrud';
import Mural from './components/Mural';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, getDoc, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { 
  clientService, brokerService, propertyService, 
  bankService, companyService, leadService 
} from './dataService';
import { X, ShieldAlert, CheckCircle2, Users, History, Lock, ShieldCheck, MessageSquare, AlertTriangle, Mail } from 'lucide-react';

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
  const [processedApprovals, setProcessedApprovals] = useState<ApprovalRequest[]>([]);
  const [muralMessages, setMuralMessages] = useState<MuralMessage[]>([]);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  const inactivityTimer = useRef<any>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => { handleLogout(); }, 15 * 60 * 1000); 
    };
    const events = ['mousemove', 'keydown', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => events.forEach(e => window.removeEventListener(e, resetTimer));
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

    // Notificações em Tempo Real (Sem Looping Pop-up)
    const unsubPending = onSnapshot(query(collection(db, "approval_requests"), where("status", "==", "pending")), (snap) => {
      setPendingApprovals(snap.docs.map(d => ({ id: d.id, ...d.data() } as ApprovalRequest)));
    });

    const unsubProcessed = onSnapshot(query(collection(db, "approval_requests"), where("status", "!=", "pending"), limit(20)), (snap) => {
      setProcessedApprovals(snap.docs.map(d => ({ id: d.id, ...d.data() } as ApprovalRequest)));
    });

    const unsubMural = onSnapshot(query(collection(db, "mural"), orderBy("createdAt", "desc"), limit(50)), (snap) => {
      setMuralMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as MuralMessage)));
    });

    return () => {
      unsubClients(); unsubBrokers(); unsubProps();
      unsubBanks(); unsubCompanies(); unsubLeads();
      unsubPending(); unsubProcessed(); unsubMural();
    };
  }, [isAuthenticated]);

  const handleUpdateLeadPhase = async (leadId: string, newPhase: LeadPhase) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const currentIdx = PHASES_ORDER.indexOf(lead.currentPhase);
    const nextIdx = PHASES_ORDER.indexOf(newPhase);

    if (!isAdmin && nextIdx < currentIdx) {
      await addDoc(collection(db, "approval_requests"), {
        type: 'regress',
        userId: user?.uid,
        userEmail: user?.email,
        leadId,
        targetPhase: newPhase,
        status: 'pending',
        isSeen: false,
        createdAt: new Date().toISOString()
      });
      alert("Pedido de retrocesso gerado no Sino do ADM.");
      return;
    }

    const updatedHistory = [...(lead.history || []), { phase: newPhase, date: new Date().toISOString() }];
    await leadService.update(leadId, { ...lead, currentPhase: newPhase, history: updatedHistory });
  };

  const handleDeleteLead = async (id: string) => {
    if (!isAdmin) {
      await addDoc(collection(db, "approval_requests"), {
        type: 'delete',
        userId: user?.uid,
        userEmail: user?.email,
        leadId: id,
        status: 'pending',
        isSeen: false,
        createdAt: new Date().toISOString()
      });
      alert("Pedido de exclusão gerado no Sino do ADM.");
      return;
    }
    if (confirm('Deletar permanentemente este Ativo de Lead?')) {
      await leadService.remove(id);
      setIsLeadViewOpen(false);
      setViewingLead(null);
    }
  };

  const handleApprove = async (request: ApprovalRequest, status: 'approved' | 'denied') => {
    try {
      if (status === 'approved') {
        if (request.type === 'delete') {
          await leadService.remove(request.leadId);
        } else if (request.type === 'regress' && request.targetPhase) {
          const leadSnap = await getDoc(doc(db, "leads", request.leadId));
          if (leadSnap.exists()) {
            const leadData = leadSnap.data() as Lead;
            const updatedHistory = [...(leadData.history || []), { phase: request.targetPhase, date: new Date().toISOString(), message: "Aprovado por ADM" }];
            await updateDoc(doc(db, "leads", request.leadId), { currentPhase: request.targetPhase, history: updatedHistory });
          }
        }
      }
      await updateDoc(doc(db, "approval_requests", request.id), { status, isSeen: false });
      if (viewingLead?.id === request.leadId && status === 'approved') { setIsLeadViewOpen(false); setViewingLead(null); }
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => signOut(auth);

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard': return <Dashboard leads={leads} clients={clients} properties={properties} brokers={brokers} />;
      case 'Kanban': return <KanbanBoard leads={leads} clients={clients} brokers={brokers} properties={properties} updatePhase={handleUpdateLeadPhase} onAddLead={() => setIsLeadModalOpen(true)} onEditLead={setEditingLead} onViewLead={(l: any) => { setViewingLead(l); setIsLeadViewOpen(true); }} onDeleteLead={handleDeleteLead} isAdmin={isAdmin} />;
      case 'List': return <LeadTable leads={leads} clients={clients} brokers={brokers} properties={properties} updatePhase={handleUpdateLeadPhase} onAddLead={() => setIsLeadModalOpen(true)} onEditLead={setEditingLead as any} onDeleteLead={handleDeleteLead} onViewLead={(l: any) => { setViewingLead(l); setIsLeadViewOpen(true); }} />;
      case 'Clientes': return <GenericCrud title="Clientes" data={clients} type="client" onSave={(d) => d.id ? clientService.update(d.id, d) : clientService.create(d)} onDelete={clientService.remove} isAdmin={isAdmin} />;
      case 'Corretores': return <GenericCrud title="Corretores" data={brokers} type="broker" onSave={(d) => d.id ? brokerService.update(d.id, d) : brokerService.create(d)} onDelete={brokerService.remove} isAdmin={isAdmin} />;
      case 'Properties': return <GenericCrud title="Imóveis" data={properties} type="property" onSave={(d) => d.id ? propertyService.update(d.id, d) : propertyService.create(d)} onDelete={propertyService.remove} isAdmin={isAdmin} />;
      case 'Bancos': return <GenericCrud title="Bancos" data={banks} type="bank" onSave={(d) => d.id ? bankService.update(d.id, d) : bankService.create(d)} onDelete={bankService.remove} isAdmin={isAdmin} />;
      case 'Construtoras': return <GenericCrud title="Construtoras" data={companies} type="company" onSave={(d) => d.id ? companyService.update(d.id, d) : companyService.create(d)} onDelete={companyService.remove} isAdmin={isAdmin} />;
      case 'Mural': return <Mural messages={muralMessages} user={user} />;
      default: return <Dashboard leads={leads} clients={clients} properties={properties} brokers={brokers} />;
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#F4F6F8]"><div className="w-12 h-12 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex h-screen bg-[#F4F6F8] overflow-hidden">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} isAdmin={isAdmin} isCollapsed={!isSidebarOpen} setIsCollapsed={(v) => setIsSidebarOpen(!v)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={currentView} 
          onLogout={handleLogout} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          userEmail={user?.email || ''} 
          pendingApprovals={pendingApprovals} 
          processedRequests={processedApprovals}
          onApprove={handleApprove} 
          isAdmin={isAdmin} 
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto h-full">{renderView()}</div>
        </main>
      </div>

      {isLeadModalOpen && (
        <LeadModal lead={editingLead} onClose={() => { setIsLeadModalOpen(false); setEditingLead(null); }} onSave={async (d: any) => { if(editingLead) await leadService.update(editingLead.id, d); else await leadService.create(d); setIsLeadModalOpen(false); }} clients={clients} properties={properties} />
      )}

      {isLeadViewOpen && viewingLead && (
        <LeadDetailsModal 
          lead={viewingLead} 
          onClose={() => { setIsLeadViewOpen(false); setViewingLead(null); }} 
          onEdit={() => { setEditingLead(viewingLead); setIsLeadModalOpen(true); setIsLeadViewOpen(false); }} 
          onDelete={() => handleDeleteLead(viewingLead.id)} 
          clients={clients} 
          properties={properties} 
          isAdmin={isAdmin}
          processedRequests={processedApprovals}
        />
      )}
    </div>
  );
};

const LeadModal: React.FC<any> = ({ lead, onClose, onSave, clients, properties }) => {
  const [data, setData] = useState({ clientId: lead?.clientId || '', propertyId: lead?.propertyId || '', internalMessage: lead?.internalMessage || '', currentPhase: lead?.currentPhase || LeadPhase.ABERTURA_CREDITO });
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-[#8B0000] p-6 flex items-center justify-between text-white font-black uppercase tracking-widest text-[10px]">
          <span>{lead ? 'Editar' : 'Novo'} Ficha de Lead Cloud</span>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-10 space-y-6">
           <div className="space-y-4">
              <select className="w-full border p-3.5 rounded-xl font-bold bg-gray-50 text-sm" value={data.clientId} onChange={e => setData({...data, clientId: e.target.value})}>
                <option value="">Cliente Titular...</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="w-full border p-3.5 rounded-xl font-bold bg-gray-50 text-sm" value={data.propertyId} onChange={e => setData({...data, propertyId: e.target.value})}>
                <option value="">Imóvel de Referência...</option>
                {properties.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <textarea className="w-full border p-4 rounded-xl font-bold bg-gray-50 h-32 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none" placeholder="Instruções internas..." value={data.internalMessage} onChange={e => setData({...data, internalMessage: e.target.value})} />
           </div>
           <button onClick={() => onSave(data)} className="w-full py-4 bg-[#8B0000] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Sincronizar Cloud</button>
        </div>
      </div>
    </div>
  );
};

const LeadDetailsModal: React.FC<any> = ({ lead, onClose, onEdit, onDelete, clients, properties, isAdmin, processedRequests }) => {
  const client = clients.find((c: any) => c.id === lead.clientId);
  const property = properties.find((p: any) => p.id === lead.propertyId);
  const myReq = processedRequests.find(r => r.leadId === lead.id && r.status === 'denied');
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-10 flex justify-between items-start border-b border-gray-50">
          <div>
             <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-widest">Painel Operacional Lead</h4>
             <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{client?.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><X size={32} /></button>
        </div>
        <div className="p-10 space-y-8">
           {myReq && (
             <div className="bg-red-600 text-white p-4 rounded-2xl flex items-center space-x-3 shadow-lg">
                <AlertTriangle size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Recusado pelo administrador SAP</span>
             </div>
           )}
           <div className="bg-gray-50 p-6 rounded-2xl border-l-8 border-[#8B0000]">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center"><MessageSquare size={14} className="mr-2" /> Comunicação SAP</h4>
              <p className="text-gray-700 font-bold italic">"{lead.internalMessage || 'Sem observações.'}"</p>
           </div>
           <div className="grid grid-cols-2 gap-8">
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Imóvel</label><p className="font-black text-lg text-gray-900 leading-tight">{property?.title}</p></div>
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fase Atual</label><p className="font-black text-lg text-[#8B0000] uppercase">{lead.currentPhase}</p></div>
           </div>
        </div>
        <div className="p-8 border-t border-gray-100 flex justify-end space-x-4">
          <button onClick={onDelete} className={`px-8 py-3.5 border rounded-2xl font-black text-[10px] uppercase transition-all ${isAdmin ? 'text-red-600 border-red-100 hover:bg-red-50' : 'text-gray-400 border-gray-200'}`}>
            {isAdmin ? 'Excluir Agora' : 'Sinalizar Exclusão'}
          </button>
          <button onClick={onEdit} className="px-12 py-3.5 bg-[#8B0000] text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105">Editar Ficha</button>
        </div>
      </div>
    </div>
  );
};

export default App;
