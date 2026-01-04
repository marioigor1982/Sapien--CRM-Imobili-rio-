
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
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, getDoc, orderBy, limit } from 'firebase/firestore';
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

  // 3. REGRAS DE SESSÃO: Inatividade de 10 minutos
  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        handleLogout();
        alert("Sessão encerrada por inatividade (10 minutos).");
      }, 10 * 60 * 1000); 
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
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
        // Registrar Log de Login
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

    // 2. FLUXO DE APROVAÇÃO EM TEMPO REAL (onSnapshot)
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

    // 1. REGRAS DE ACESSO: Bloquear retrocesso para não-admins
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
      alert("Ação não permitida: Retrocesso de fase requer aprovação do Administrador.");
      return;
    }

    const updatedHistory = [...(lead.history || []), { phase: newPhase, date: new Date().toISOString() }];
    await leadService.update(leadId, { ...lead, currentPhase: newPhase, history: updatedHistory });
    
    // 3. FEEDBACK: Alerta de sucesso
    alert("Lead Avançado com sucesso!");
  };

  const handleDeleteLead = async (id: string) => {
    // 1. REGRAS DE ACESSO: Bloquear exclusão para não-admins
    if (!isAdmin) {
      await addDoc(collection(db, "approval_requests"), {
        type: 'delete',
        userId: user?.uid,
        userEmail: user?.email,
        leadId: id,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert("Ação não permitida: Pedido de exclusão enviado para o Administrador.");
      return;
    }

    if (confirm('Deseja realmente excluir este lead permanentemente?')) {
      await leadService.remove(id);
      if (viewingLead?.id === id) setIsLeadViewOpen(false);
    }
  };

  const handleApprove = async (request: ApprovalRequest, status: 'approved' | 'denied') => {
    // Ação física executada pelo Admin
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
        // Limpa estado do modal caso esteja aberto para o lead aprovado
        if (viewingLead?.id === request.leadId && request.type === 'delete') {
          setIsLeadViewOpen(false);
          setViewingLead(null);
        }
        alert("Solicitação SAP Aprovada com Sucesso.");
      } catch (err) {
        console.error("Erro ao aprovar:", err);
        alert("Erro ao processar ação no DB.");
      }
    } else {
      alert("Solicitação Negada.");
    }

    // Finaliza a solicitação no Firestore
    await updateDoc(doc(db, "approval_requests", request.id), { status });
  };

  const handleLogout = () => signOut(auth);

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard': return <Dashboard leads={leads} clients={clients} properties={properties} brokers={brokers} />;
      case 'Kanban': return <KanbanBoard leads={leads} clients={clients} brokers={brokers} properties={properties} updatePhase={handleUpdateLeadPhase} onAddLead={() => setIsLeadModalOpen(true)} onEditLead={setEditingLead} onViewLead={setIsLeadViewOpen as any} onDeleteLead={handleDeleteLead} isAdmin={isAdmin} />;
      case 'List': return <LeadTable leads={leads} clients={clients} brokers={brokers} properties={properties} banks={banks} companies={companies} updatePhase={handleUpdateLeadPhase} onAddLead={() => setIsLeadModalOpen(true)} onEditLead={setEditingLead as any} onDeleteLead={handleDeleteLead} onViewLead={setIsLeadViewOpen as any} isAdmin={isAdmin} />;
      case 'Clientes': return <GenericCrud title="Clientes" data={clients} type="client" onSave={(d) => d.id ? clientService.update(d.id, d) : clientService.create(d)} onDelete={clientService.remove} properties={properties} brokers={brokers} banks={banks} propertyService={propertyService} brokerService={brokerService} bankService={bankService} leads={leads} companies={companies} isAdmin={isAdmin} />;
      case 'Corretores': return <GenericCrud title="Corretores" data={brokers} type="broker" onSave={(d) => d.id ? brokerService.update(d.id, d) : brokerService.create(d)} onDelete={brokerService.remove} leads={leads} properties={properties} clients={clients} companies={companies} isAdmin={isAdmin} />;
      case 'Properties': return <GenericCrud title="Imóveis" data={properties} type="property" onSave={(d) => d.id ? propertyService.update(d.id, d) : propertyService.create(d)} onDelete={propertyService.remove} companies={companies} companyService={companyService} isAdmin={isAdmin} />;
      case 'Bancos': return <GenericCrud title="Bancos" data={banks} type="bank" onSave={(d) => d.id ? bankService.update(d.id, d) : bankService.create(d)} onDelete={bankService.remove} isAdmin={isAdmin} />;
      case 'Construtoras': return <GenericCrud title="Construtoras" data={companies} type="company" onSave={(d) => d.id ? companyService.update(d.id, d) : companyService.create(d)} onDelete={companyService.remove} isAdmin={isAdmin} />;
      case 'Settings': return isAdmin ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
             <div className="space-y-1">
                <h3 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.4em]">Governance & Security</h3>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Painel Administrativo SAP</h2>
             </div>
             <ShieldCheck size={40} className="text-[#8B0000]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100">
               <div className="flex items-center space-x-3 mb-6">
                  <Users size={20} className="text-[#8B0000]" />
                  <h4 className="font-black text-xs uppercase tracking-widest">Últimos Acessos (Logins)</h4>
               </div>
               <div className="space-y-4">
                  {loginLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                       <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${log.isAdmin ? 'bg-[#8B0000]' : 'bg-green-500'}`} />
                          <span className="text-xs font-bold text-gray-700">{log.email}</span>
                       </div>
                       <span className="text-[10px] text-gray-400 font-black">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100">
               <div className="flex items-center space-x-3 mb-6">
                  <History size={20} className="text-[#8B0000]" />
                  <h4 className="font-black text-xs uppercase tracking-widest">Ações Pendentes de Aprovação</h4>
               </div>
               {pendingApprovals.length === 0 ? (
                 <div className="py-12 text-center opacity-30">
                    <CheckCircle2 size={48} className="mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Tudo em conformidade</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                    {pendingApprovals.map(req => (
                      <div key={req.id} className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
                         <div className="space-y-1">
                            <p className="text-xs font-black text-red-900">{req.type === 'delete' ? 'Excluir Lead' : 'Retroceder Lead'}</p>
                            <p className="text-[10px] text-red-600 font-bold uppercase">{req.userEmail}</p>
                         </div>
                         <div className="flex space-x-2">
                            <button onClick={() => handleApprove(req, 'approved')} className="px-3 py-1.5 bg-[#8B0000] text-white rounded-lg text-[10px] font-black">SIM</button>
                            <button onClick={() => handleApprove(req, 'denied')} className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-[10px] font-black">NÃO</button>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      ) : <div className="p-12 text-center"><Lock size={64} className="mx-auto text-gray-300 mb-4" /><h2 className="text-xl font-black uppercase tracking-widest">Acesso Restrito ao Administrador</h2></div>;
      default: return null;
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#F4F6F8]"><div className="w-12 h-12 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex h-screen bg-[#F4F6F8] overflow-hidden">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} isAdmin={isAdmin} isCollapsed={!isSidebarOpen} setIsCollapsed={(v) => setIsSidebarOpen(!v)} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header 
          title={currentView} 
          onLogout={handleLogout} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          userEmail={user?.email || ''} 
          pendingApprovals={pendingApprovals}
          onApprove={handleApprove}
          isAdmin={isAdmin}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto h-full">{renderView()}</div>
        </main>
      </div>

      {/* Pop-up persistente apenas para o primeiro da lista no Dashboard para Admins */}
      {isAdmin && pendingApprovals.length > 0 && currentView === 'Dashboard' && (
        <div className="fixed top-20 right-6 z-[100] w-80 animate-in slide-in-from-right duration-500">
           <div className="bg-[#1F1F1F] text-white p-6 rounded-[2rem] shadow-2xl border-l-8 border-[#8B0000] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert size={80} /></div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-2">Solicitação SAP urgente</h4>
              <p className="text-sm font-bold leading-tight mb-6">
                O usuário <strong>{pendingApprovals[0].userEmail.split('@')[0]}</strong> aguarda autorização para uma ação crítica.
              </p>
              <div className="flex space-x-3">
                 <button onClick={() => handleApprove(pendingApprovals[0], 'approved')} className="flex-1 bg-[#8B0000] py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Autorizar</button>
                 <button onClick={() => handleApprove(pendingApprovals[0], 'denied')} className="px-4 bg-white/10 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-white/20">Negar</button>
              </div>
           </div>
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
            alert("Lead Operacional Salvo!");
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
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

// ... Rest of the components (LeadModal, LeadDetailsModal) remain the same ...
// (Including them to ensure full file content as requested)

const LeadModal: React.FC<any> = ({ lead, onClose, onSave, clients, brokers, properties, banks }) => {
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
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-[#8B0000] px-8 py-6 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
             <MessageSquare size={20} />
             <h3 className="font-black uppercase tracking-widest text-xs">Ativo de Lead Cloud</h3>
          </div>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="p-10 space-y-6">
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente Associado</label>
                <select className="w-full border-gray-200 border p-3.5 rounded-xl font-bold text-sm bg-gray-50" value={data.clientId} onChange={e => setData({...data, clientId: e.target.value})}>
                  <option value="">Escolher...</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativo de Interesse</label>
                <select className="w-full border-gray-200 border p-3.5 rounded-xl font-bold text-sm bg-gray-50" value={data.propertyId} onChange={e => setData({...data, propertyId: e.target.value})}>
                  <option value="">Escolher...</option>
                  {properties.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mensagem Operacional (Interna)</label>
                <textarea 
                  className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold min-h-[120px] focus:ring-2 focus:ring-[#8B0000] outline-none"
                  placeholder="Instruções para a equipe..."
                  value={data.internalMessage}
                  onChange={e => setData({...data, internalMessage: e.target.value})}
                />
             </div>
          </div>
          <button onClick={() => onSave(data)} className="w-full py-4 bg-[#8B0000] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all">Sincronizar Lead</button>
        </div>
      </div>
    </div>
  );
};

const LeadDetailsModal: React.FC<any> = ({ lead, onClose, onEdit, onDelete, clients, brokers, properties, isAdmin }) => {
  const client = clients.find((c: any) => c.id === lead.clientId);
  const property = properties.find((p: any) => p.id === lead.propertyId);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-10 pb-4 flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.4em]">Ficha Operacional</h4>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{client?.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><X size={32} /></button>
        </div>
        
        <div className="p-10 pt-4 space-y-10">
          <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 border-l-8 border-l-[#8B0000]">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center"><MessageSquare size={14} className="mr-2" /> Comunicação Interna</h4>
             <p className="text-gray-700 font-bold italic text-sm">"{lead.internalMessage || 'Sem observações vinculadas.'}"</p>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Imóvel</label>
                <p className="font-black text-lg text-gray-900 leading-none">{property?.title}</p>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fase Atual</label>
                <p className="font-black text-lg text-[#8B0000] leading-none uppercase">{lead.currentPhase}</p>
             </div>
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 flex justify-end space-x-4 bg-white">
          <button onClick={onDelete} className={`px-8 py-3.5 border border-red-100 rounded-2xl font-black text-[10px] uppercase transition-all ${isAdmin ? 'text-red-600 hover:bg-red-50' : 'text-gray-300 cursor-not-allowed'}`}>
            {isAdmin ? 'Excluir Definitivo' : 'Solicitar Exclusão'}
          </button>
          <button onClick={onEdit} className="px-12 py-3.5 bg-[#8B0000] text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all">Editar Dados</button>
        </div>
      </div>
    </div>
  );
};

export default App;
