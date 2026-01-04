
import React, { useState, useEffect, useRef } from 'react';
import { 
  Client, Broker, Property, Bank, ConstructionCompany, Lead, 
  ViewType, LeadPhase, PHASES_ORDER, ApprovalRequest
} from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import LeadTable from './components/LeadTable';
import Login from './components/Login';
import GenericCrud from './components/GenericCrud';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, getDoc, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { 
  clientService, brokerService, propertyService, 
  bankService, companyService, leadService 
} from './dataService';
import { X, ShieldAlert, CheckCircle2, Users, History, Lock, ShieldCheck, MessageSquare } from 'lucide-react';

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
  const [loginLogs, setLoginLogs] = useState<any[]>([]);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  const inactivityTimer = useRef<any>(null);

  // Monitor de Inatividade (10 min)
  useEffect(() => {
    if (!isAuthenticated) return;
    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        handleLogout();
        alert("Sessão expirada por inatividade.");
      }, 10 * 60 * 1000); 
    };
    const events = ['mousemove', 'keydown', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await addDoc(collection(db, "login_logs"), {
          email: firebaseUser.email,
          timestamp: new Date().toISOString(),
          isAdmin: ADMIN_EMAILS.includes(firebaseUser.email || '')
        });
      }
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

    let unsubApprovals = () => {};
    let unsubLogs = () => {};
    
    if (isAdmin) {
      const qApprovals = query(collection(db, "approval_requests"), where("status", "==", "pending"));
      unsubApprovals = onSnapshot(qApprovals, (snap) => {
        setPendingApprovals(snap.docs.map(d => ({ id: d.id, ...d.data() } as ApprovalRequest)));
      });

      const qLogs = query(collection(db, "login_logs"), orderBy("timestamp", "desc"), limit(10));
      unsubLogs = onSnapshot(qLogs, (snap) => {
        setLoginLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    return () => {
      unsubClients(); unsubBrokers(); unsubProps();
      unsubBanks(); unsubCompanies(); unsubLeads();
      unsubApprovals(); unsubLogs();
    };
  }, [isAuthenticated, isAdmin]);

  const handleUpdateLeadPhase = async (leadId: string, newPhase: LeadPhase) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const currentIdx = PHASES_ORDER.indexOf(lead.currentPhase);
    const nextIdx = PHASES_ORDER.indexOf(newPhase);

    // Bloqueio de Retrocesso
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
      alert("Ação Restrita: Solicitação de retrocesso enviada ao Sino do ADM.");
      return;
    }

    // Avanço é livre
    const updatedHistory = [...(lead.history || []), { phase: newPhase, date: new Date().toISOString() }];
    await leadService.update(leadId, { ...lead, currentPhase: newPhase, history: updatedHistory });
    alert("Lead Avançado com sucesso!");
  };

  const handleDeleteLead = async (id: string) => {
    if (!isAdmin) {
      // Apenas sinaliza
      await addDoc(collection(db, "approval_requests"), {
        type: 'delete',
        userId: user?.uid,
        userEmail: user?.email,
        leadId: id,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert("Ação Restrita: Pedido de exclusão enviado para aprovação Admin.");
      return;
    }

    // Admin deleta fisicamente
    if (confirm('Deseja realmente excluir este lead permanentemente?')) {
      await leadService.remove(id);
      setIsLeadViewOpen(false);
      setViewingLead(null);
    }
  };

  const handleApprove = async (request: ApprovalRequest, status: 'approved' | 'denied') => {
    // 1. Ação Física executada pelo Admin
    if (status === 'approved') {
      try {
        if (request.type === 'delete') {
          await leadService.remove(request.leadId);
        } else if (request.type === 'regress' && request.targetPhase) {
          const leadSnap = await getDoc(doc(db, "leads", request.leadId));
          if (leadSnap.exists()) {
            const leadData = leadSnap.data() as Lead;
            const updatedHistory = [...(leadData.history || []), { 
              phase: request.targetPhase, 
              date: new Date().toISOString(),
              message: "Aprovado por ADM"
            }];
            await updateDoc(doc(db, "leads", request.leadId), {
              currentPhase: request.targetPhase,
              history: updatedHistory
            });
          }
        }
        alert("Ação Processada com Sucesso.");
      } catch (err) {
        alert("Erro ao processar ação no banco de dados.");
      }
    }

    // 2. Limpeza de Interface e Banco
    await updateDoc(doc(db, "approval_requests", request.id), { status });
    
    // 3. Forçar fechamento de modais de detalhes se o lead foi deletado/alterado
    if (viewingLead?.id === request.leadId) {
      setIsLeadViewOpen(false);
      setViewingLead(null);
    }
  };

  const handleLogout = () => signOut(auth);

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard': return <Dashboard leads={leads} clients={clients} properties={properties} brokers={brokers} />;
      case 'Kanban': return <KanbanBoard leads={leads} clients={clients} brokers={brokers} properties={properties} updatePhase={handleUpdateLeadPhase} onAddLead={() => setIsLeadModalOpen(true)} onEditLead={setEditingLead} onViewLead={(l: any) => { setViewingLead(l); setIsLeadViewOpen(true); }} onDeleteLead={handleDeleteLead} isAdmin={isAdmin} />;
      case 'List': return <LeadTable leads={leads} clients={clients} brokers={brokers} properties={properties} banks={banks} companies={companies} updatePhase={handleUpdateLeadPhase} onAddLead={() => setIsLeadModalOpen(true)} onEditLead={setEditingLead as any} onDeleteLead={handleDeleteLead} onViewLead={(l: any) => { setViewingLead(l); setIsLeadViewOpen(true); }} />;
      case 'Clientes': return <GenericCrud title="Clientes" data={clients} type="client" onSave={(d) => d.id ? clientService.update(d.id, d) : clientService.create(d)} onDelete={clientService.remove} properties={properties} brokers={brokers} banks={banks} isAdmin={isAdmin} leads={leads} />;
      case 'Corretores': return <GenericCrud title="Corretores" data={brokers} type="broker" onSave={(d) => d.id ? brokerService.update(d.id, d) : brokerService.create(d)} onDelete={brokerService.remove} leads={leads} properties={properties} clients={clients} isAdmin={isAdmin} />;
      case 'Properties': return <GenericCrud title="Imóveis" data={properties} type="property" onSave={(d) => d.id ? propertyService.update(d.id, d) : propertyService.create(d)} onDelete={propertyService.remove} isAdmin={isAdmin} companies={companies} />;
      case 'Bancos': return <GenericCrud title="Bancos" data={banks} type="bank" onSave={(d) => d.id ? bankService.update(d.id, d) : bankService.create(d)} onDelete={bankService.remove} isAdmin={isAdmin} />;
      case 'Construtoras': return <GenericCrud title="Construtoras" data={companies} type="company" onSave={(d) => d.id ? companyService.update(d.id, d) : companyService.create(d)} onDelete={companyService.remove} isAdmin={isAdmin} />;
      case 'Settings': return isAdmin ? (
        <div className="space-y-8 animate-in fade-in">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Central de Governança</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
               <h4 className="text-[10px] font-black uppercase text-[#8B0000] tracking-widest mb-6">Log de Acessos Recentes</h4>
               <div className="space-y-3">
                  {loginLogs.map(log => (
                    <div key={log.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center text-xs">
                       <span className="font-bold">{log.email}</span>
                       <span className="text-gray-400 font-black">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
               </div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
               <h4 className="text-[10px] font-black uppercase text-[#8B0000] tracking-widest mb-6">Pendências de Aprovação</h4>
               <div className="space-y-3">
                  {pendingApprovals.map(req => (
                    <div key={req.id} className="p-4 bg-red-50 rounded-2xl flex justify-between items-center text-xs border border-red-100">
                       <div>
                          <p className="font-black text-[#8B0000]">{req.type === 'delete' ? 'Exclusão' : 'Retrocesso'}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{req.userEmail}</p>
                       </div>
                       <button onClick={() => handleApprove(req, 'approved')} className="bg-[#8B0000] text-white px-4 py-2 rounded-lg font-black text-[10px]">APROVAR</button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      ) : null;
      default: return null;
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50">Carregando Sapien CRM...</div>;
  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex h-screen bg-[#F4F6F8] overflow-hidden">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} isAdmin={isAdmin} isCollapsed={!isSidebarOpen} setIsCollapsed={(v) => setIsSidebarOpen(!v)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={currentView} onLogout={handleLogout} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} userEmail={user?.email || ''} pendingApprovals={pendingApprovals} onApprove={handleApprove} isAdmin={isAdmin} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto h-full">{renderView()}</div>
        </main>
      </div>

      {isLeadModalOpen && (
        <LeadModal lead={editingLead} onClose={() => { setIsLeadModalOpen(false); setEditingLead(null); }} onSave={async (d: any) => { if(editingLead) await leadService.update(editingLead.id, d); else await leadService.create(d); setIsLeadModalOpen(false); }} clients={clients} brokers={brokers} properties={properties} />
      )}

      {isLeadViewOpen && viewingLead && (
        <LeadDetailsModal lead={viewingLead} onClose={() => { setIsLeadViewOpen(false); setViewingLead(null); }} onEdit={() => { setEditingLead(viewingLead); setIsLeadModalOpen(true); setIsLeadViewOpen(false); }} onDelete={() => handleDeleteLead(viewingLead.id)} clients={clients} properties={properties} isAdmin={isAdmin} />
      )}
    </div>
  );
};

const LeadModal: React.FC<any> = ({ lead, onClose, onSave, clients, properties }) => {
  const [data, setData] = useState({ clientId: lead?.clientId || '', propertyId: lead?.propertyId || '', internalMessage: lead?.internalMessage || '', currentPhase: lead?.currentPhase || LeadPhase.ABERTURA_CREDITO });
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-[#8B0000] p-6 flex items-center justify-between text-white font-black uppercase tracking-widest text-xs">
          <span>{lead ? 'Editar' : 'Novo'} Lead Cloud</span>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="p-10 space-y-6">
           <div className="space-y-4">
              <select className="w-full border p-3.5 rounded-xl font-bold bg-gray-50" value={data.clientId} onChange={e => setData({...data, clientId: e.target.value})}>
                <option value="">Cliente...</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="w-full border p-3.5 rounded-xl font-bold bg-gray-50" value={data.propertyId} onChange={e => setData({...data, propertyId: e.target.value})}>
                <option value="">Imóvel...</option>
                {properties.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <textarea className="w-full border p-4 rounded-xl font-bold bg-gray-50 h-32" placeholder="Mensagem interna..." value={data.internalMessage} onChange={e => setData({...data, internalMessage: e.target.value})} />
           </div>
           <button onClick={() => onSave(data)} className="w-full py-4 bg-[#8B0000] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Sincronizar Lead</button>
        </div>
      </div>
    </div>
  );
};

const LeadDetailsModal: React.FC<any> = ({ lead, onClose, onEdit, onDelete, clients, properties, isAdmin }) => {
  const client = clients.find((c: any) => c.id === lead.clientId);
  const property = properties.find((p: any) => p.id === lead.propertyId);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in">
        <div className="p-10 flex justify-between items-start border-b border-gray-50">
          <div>
             <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-widest">Ativo Operacional</h4>
             <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{client?.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><X size={32} /></button>
        </div>
        <div className="p-10 space-y-8">
           <div className="bg-gray-50 p-6 rounded-2xl border-l-8 border-[#8B0000]">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center"><MessageSquare size={14} className="mr-2" /> Comunicação SAP</h4>
              <p className="text-gray-700 font-bold italic">"{lead.internalMessage || 'Sem observações.'}"</p>
           </div>
           <div className="grid grid-cols-2 gap-8">
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Imóvel</label><p className="font-black text-lg">{property?.title}</p></div>
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fase Atual</label><p className="font-black text-lg text-[#8B0000] uppercase">{lead.currentPhase}</p></div>
           </div>
        </div>
        <div className="p-8 border-t border-gray-100 flex justify-end space-x-4">
          <button onClick={onDelete} className={`px-8 py-3.5 border rounded-2xl font-black text-[10px] uppercase transition-all ${isAdmin ? 'text-red-600 border-red-100 hover:bg-red-50' : 'text-gray-300 border-gray-100'}`}>
            {isAdmin ? 'Excluir Agora' : 'Sinalizar Exclusão'}
          </button>
          <button onClick={onEdit} className="px-12 py-3.5 bg-[#8B0000] text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all">Editar Ficha</button>
        </div>
      </div>
    </div>
  );
};

export default App;
