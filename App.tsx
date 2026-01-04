
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

const ADMIN_EMAILS = ['mario.igor1982@gmail.com', 'michael.hugo1985@hotmail.com'];

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [companies, setCompanies] = useState<ConstructionCompany[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [processedApprovals, setProcessedApprovals] = useState<ApprovalRequest[]>([]);
  const [muralMessages, setMuralMessages] = useState<MuralMessage[]>([]);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  const inactivityTimer = useRef<any>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (isAuthenticated) {
      // 10 minutos de timeout
      inactivityTimer.current = setTimeout(() => { handleLogout(); }, 10 * 60 * 1000); 
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();
    return () => events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
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

  const handleLogout = () => {
    signOut(auth).then(() => {
      localStorage.clear();
      sessionStorage.clear();
      // Força recarregamento completo para limpar o estado do React e Recharts
      window.location.href = '/'; 
    }).catch(err => console.error("Erro no logout:", err));
  };

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
      alert("Retrocesso enviado para aprovação.");
      return;
    }

    const updatedHistory = [...(lead.history || []), { phase: newPhase, date: new Date().toISOString() }];
    await leadService.update(leadId, { ...lead, currentPhase: newPhase, history: updatedHistory });
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
            const updatedHistory = [...(leadData.history || []), { phase: request.targetPhase, date: new Date().toISOString() }];
            await updateDoc(doc(db, "leads", request.leadId), { currentPhase: request.targetPhase, history: updatedHistory });
          }
        }
      }
      await updateDoc(doc(db, "approval_requests", request.id), { status, isSeen: false });
    } catch (err) { console.error(err); }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#F4F6F8]"><div className="w-10 h-10 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex h-screen bg-[#F4F6F8] overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        onLogout={handleLogout} 
        isAdmin={isAdmin} 
        isCollapsed={!isSidebarOpen} 
        setIsCollapsed={(v) => setIsSidebarOpen(!v)} 
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={currentView} 
          onLogout={handleLogout} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          userEmail={user?.email || ''} 
          pendingApprovals={pendingApprovals} 
          processedRequests={processedApprovals}
          muralMessages={muralMessages}
          onApprove={handleApprove} 
          isAdmin={isAdmin} 
        />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {currentView === 'Dashboard' && <Dashboard leads={leads} clients={clients} properties={properties} brokers={brokers} />}
            {currentView === 'Kanban' && <KanbanBoard leads={leads} clients={clients} brokers={brokers} properties={properties} updatePhase={handleUpdateLeadPhase} isAdmin={isAdmin} onDeleteLead={id => isAdmin ? leadService.remove(id) : alert('Ação restrita')} />}
            {currentView === 'List' && <LeadTable leads={leads} clients={clients} brokers={brokers} properties={properties} banks={banks} companies={companies} updatePhase={handleUpdateLeadPhase} onAddLead={() => {}} onEditLead={() => {}} onDeleteLead={id => isAdmin ? leadService.remove(id) : alert('Ação restrita')} />}
            {currentView === 'Mural' && <Mural messages={muralMessages} user={user} onInteraction={resetInactivityTimer} />}
            {currentView === 'Clientes' && <GenericCrud title="Clientes" data={clients} type="client" onSave={d => d.id ? clientService.update(d.id, d) : clientService.create(d)} onDelete={clientService.remove} isAdmin={isAdmin} />}
            {currentView === 'Corretores' && <GenericCrud title="Corretores" data={brokers} type="broker" onSave={d => d.id ? brokerService.update(d.id, d) : brokerService.create(d)} onDelete={brokerService.remove} isAdmin={isAdmin} />}
            {currentView === 'Properties' && <GenericCrud title="Imóveis" data={properties} type="property" onSave={d => d.id ? propertyService.update(d.id, d) : propertyService.create(d)} onDelete={propertyService.remove} isAdmin={isAdmin} />}
            {currentView === 'Bancos' && <GenericCrud title="Bancos" data={banks} type="bank" onSave={d => d.id ? bankService.update(d.id, d) : bankService.create(d)} onDelete={bankService.remove} isAdmin={isAdmin} />}
            {currentView === 'Construtoras' && <GenericCrud title="Construtoras" data={companies} type="company" onSave={d => d.id ? companyService.update(d.id, d) : companyService.create(d)} onDelete={companyService.remove} isAdmin={isAdmin} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
