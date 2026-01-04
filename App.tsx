
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
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, getDoc, orderBy, limit, deleteDoc, writeBatch } from 'firebase/firestore';
import { 
  clientService, brokerService, propertyService, 
  bankService, companyService, leadService 
} from './dataService';
import { CheckCircle2, X } from 'lucide-react';

const ADMIN_EMAILS = ['mario.igor1982@gmail.com', 'michael.hugo1985@hotmail.com'];

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  
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

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (isAuthenticated) {
      inactivityTimer.current = setTimeout(() => { handleLogout(); }, 10 * 60 * 1000); 
    }
  };

  useEffect(() => {
    if (currentView === 'Mural' && muralMessages.length > 0) {
      const unread = muralMessages.filter(m => !m.isSeenGlobal);
      if (unread.length > 0) {
        const batch = writeBatch(db);
        unread.forEach(msg => {
          const ref = doc(db, "mural", msg.id);
          batch.update(ref, { isSeenGlobal: true });
        });
        batch.commit().catch(err => console.error("Erro ao marcar lidas:", err));
      }
    }
  }, [currentView, muralMessages]);

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

    // UPDATED: Order by updatedAt desc to keep latest interaction on top
    const unsubMural = onSnapshot(query(collection(db, "mural"), orderBy("updatedAt", "desc"), limit(50)), (snap) => {
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
      window.location.href = '/'; 
    }).catch(err => console.error("Erro no logout:", err));
  };

  const handleUpdateLeadPhase = async (leadId: string, newPhase: LeadPhase) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const currentIdx = PHASES_ORDER.indexOf(lead.currentPhase);
    const nextIdx = PHASES_ORDER.indexOf(newPhase);

    const isAdvancing = nextIdx > currentIdx;

    if (!isAdmin && !isAdvancing) {
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
    
    if (isAdvancing) {
      showNotification('Lead Avançado com sucesso!');
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
            const updatedHistory = [...(leadData.history || []), { phase: request.targetPhase, date: new Date().toISOString() }];
            await updateDoc(doc(db, "leads", request.leadId), { currentPhase: request.targetPhase, history: updatedHistory });
          }
        }
      }
      await updateDoc(doc(db, "approval_requests", request.id), { status, isSeen: false });
    } catch (err) { console.error(err); }
  };

  const unreadMuralCount = muralMessages.filter(m => !m.isSeenGlobal).length;

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#F4F6F8]"><div className="w-10 h-10 border-4 border-[#ea2a33] border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex h-screen bg-[#F3F4F6] overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        onLogout={handleLogout} 
        isAdmin={isAdmin} 
        isCollapsed={!isSidebarOpen} 
        setIsCollapsed={(v) => setIsSidebarOpen(!v)}
        unreadMuralCount={unreadMuralCount}
      />
      <div className="flex-1 flex flex-col min-w-0 relative">
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
        <main className="flex-1 overflow-auto p-0">
          <div className="w-full h-full">
            {currentView === 'Dashboard' && <div className="p-8"><Dashboard leads={leads} clients={clients} properties={properties} brokers={brokers} /></div>}
            {currentView === 'Kanban' && <div className="p-8"><KanbanBoard leads={leads} clients={clients} brokers={brokers} properties={properties} updatePhase={handleUpdateLeadPhase} isAdmin={isAdmin} onDeleteLead={id => isAdmin ? leadService.remove(id) : alert('Ação restrita')} /></div>}
            {currentView === 'List' && <div className="p-8"><LeadTable leads={leads} clients={clients} brokers={brokers} properties={properties} banks={banks} companies={companies} updatePhase={handleUpdateLeadPhase} onAddLead={() => {}} onEditLead={() => {}} onDeleteLead={id => isAdmin ? leadService.remove(id) : alert('Ação restrita')} /></div>}
            {currentView === 'Mural' && <Mural messages={muralMessages} user={user} onInteraction={resetInactivityTimer} />}
            {currentView === 'Clientes' && <div className="p-8"><GenericCrud title="Clientes" data={clients} type="client" onSave={d => d.id ? clientService.update(d.id, d) : clientService.create(d)} onDelete={clientService.remove} isAdmin={isAdmin} /></div>}
            {currentView === 'Corretores' && <div className="p-8"><GenericCrud title="Corretores" data={brokers} type="broker" onSave={d => d.id ? brokerService.update(d.id, d) : brokerService.create(d)} onDelete={brokerService.remove} isAdmin={isAdmin} /></div>}
            {currentView === 'Properties' && <div className="p-8"><GenericCrud title="Imóveis" data={properties} type="property" onSave={d => d.id ? propertyService.update(d.id, d) : propertyService.create(d)} onDelete={propertyService.remove} isAdmin={isAdmin} /></div>}
            {currentView === 'Bancos' && <div className="p-8"><GenericCrud title="Bancos" data={banks} type="bank" onSave={d => d.id ? bankService.update(d.id, d) : bankService.create(d)} onDelete={bankService.remove} isAdmin={isAdmin} /></div>}
            {currentView === 'Construtoras' && <div className="p-8"><GenericCrud title="Construtoras" data={companies} type="company" onSave={d => d.id ? companyService.update(d.id, d) : companyService.create(d)} onDelete={companyService.remove} isAdmin={isAdmin} /></div>}
          </div>
        </main>

        {notification && (
          <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-10 duration-500">
            <div className="bg-[#1F1F1F] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 border-l-4 border-emerald-500">
              <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">Operação Realizada</p>
                <p className="text-sm font-bold text-white leading-none">{notification}</p>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors text-gray-500"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
