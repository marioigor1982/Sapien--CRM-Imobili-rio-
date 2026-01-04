
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
import { CheckCircle2, X, Bell } from 'lucide-react';

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
  const prevMuralStats = useRef<{ [key: string]: number }>({});

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthenticated(!!firebaseUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // LISTEN DO MURAL COM LÓGICA DE ALERTA NO SINO (REFINADA)
    const qMural = query(collection(db, "mural"), orderBy("timestamp_ultima_interacao", "desc"), limit(40));
    const unsubMural = onSnapshot(qMural, (snap) => {
      const newMessages = snap.docs.map(d => ({ id: d.id, ...d.data() } as MuralMessage));
      
      newMessages.forEach(msg => {
        const currentCount = msg.interacoes?.length || 0;
        const lastCount = prevMuralStats.current[msg.id];

        // SINO: Se aumentou e o autor não é o usuário atual
        if (lastCount !== undefined && currentCount > lastCount) {
          const lastInteraction = msg.interacoes[currentCount - 1];
          if (lastInteraction && lastInteraction.autor !== user.email) {
            showNotification(`Nova interação no mural: ${msg.titulo}`);
          }
        }
        prevMuralStats.current[msg.id] = currentCount;
      });

      setMuralMessages(newMessages);
    });

    const unsubClients = clientService.subscribe(setClients);
    const unsubBrokers = brokerService.subscribe(setBrokers);
    const unsubProps = propertyService.subscribe(setProperties);
    const unsubBanks = bankService.subscribe(setBanks);
    const unsubCompanies = companyService.subscribe(setCompanies);
    const unsubLeads = leadService.subscribe(setLeads);

    return () => {
      unsubMural(); unsubClients(); unsubBrokers(); 
      unsubProps(); unsubBanks(); unsubCompanies(); unsubLeads();
    };
  }, [isAuthenticated, user]);

  const handleLogout = () => signOut(auth).then(() => window.location.href = '/');

  const handleApprove = async (request: ApprovalRequest, status: 'approved' | 'denied') => {
    await updateDoc(doc(db, "approval_requests", request.id), { status, isSeen: false });
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-[#ea2a33] border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex h-screen bg-[#F3F4F6] overflow-hidden">
      <Sidebar 
        currentView={currentView} setView={setCurrentView} onLogout={handleLogout} 
        isAdmin={isAdmin} isCollapsed={!isSidebarOpen} setIsCollapsed={v => setIsSidebarOpen(!v)}
        unreadMuralCount={muralMessages.filter(m => !m.isSeenGlobal).length}
      />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header 
          title={currentView} onLogout={handleLogout} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          userEmail={user?.email || ''} pendingApprovals={pendingApprovals} processedRequests={processedApprovals}
          muralMessages={muralMessages} onApprove={handleApprove} isAdmin={isAdmin} 
        />
        <main className="flex-1 overflow-auto">
          {currentView === 'Dashboard' && <div className="p-8"><Dashboard leads={leads} clients={clients} properties={properties} brokers={brokers} /></div>}
          {currentView === 'Kanban' && <div className="p-8"><KanbanBoard leads={leads} clients={clients} brokers={brokers} properties={properties} updatePhase={() => {}} isAdmin={isAdmin} /></div>}
          {currentView === 'Mural' && <Mural messages={muralMessages} user={user} />}
          {currentView === 'Clientes' && <div className="p-8"><GenericCrud title="Clientes" data={clients} type="client" onSave={d => d.id ? clientService.update(d.id, d) : clientService.create(d)} onDelete={clientService.remove} isAdmin={isAdmin} /></div>}
          {currentView === 'Corretores' && <div className="p-8"><GenericCrud title="Corretores" data={brokers} type="broker" onSave={d => d.id ? brokerService.update(d.id, d) : brokerService.create(d)} onDelete={brokerService.remove} isAdmin={isAdmin} /></div>}
          {currentView === 'Properties' && <div className="p-8"><GenericCrud title="Imóveis" data={properties} type="property" onSave={d => d.id ? propertyService.update(d.id, d) : propertyService.create(d)} onDelete={propertyService.remove} isAdmin={isAdmin} /></div>}
          {currentView === 'Bancos' && <div className="p-8"><GenericCrud title="Bancos" data={banks} type="bank" onSave={d => d.id ? bankService.update(d.id, d) : bankService.create(d)} onDelete={bankService.remove} isAdmin={isAdmin} /></div>}
          {currentView === 'Construtoras' && <div className="p-8"><GenericCrud title="Construtoras" data={companies} type="company" onSave={d => d.id ? companyService.update(d.id, d) : companyService.create(d)} onDelete={companyService.remove} isAdmin={isAdmin} /></div>}
        </main>

        {notification && (
          <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-10">
            <div className="bg-[#1F1F1F] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 border-l-4 border-[#ea2a33]">
              <div className="bg-red-500/10 p-2 rounded-xl text-red-500"><Bell size={24} className="animate-bounce" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notificação SAP CLOUD</p>
                <p className="text-sm font-bold text-white leading-none">{notification}</p>
              </div>
              <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
