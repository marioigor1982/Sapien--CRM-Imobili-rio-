
import React, { useState, useEffect } from 'react';
import { Lead, Client, Property, LeadPhase, Broker } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Activity, CreditCard, DollarSign, Home, Database, Users, Eye, Settings, Wallet } from 'lucide-react';
import { initDatabase } from '../initDatabase';

interface DashboardProps {
  leads: Lead[];
  clients: Client[];
  properties: Property[];
  brokers: Broker[];
}

const PHASE_COLORS: Record<string, string> = {
  [LeadPhase.ABERTURA_CREDITO]: '#3B82F6',
  [LeadPhase.APROVACAO_CREDITO]: '#22C55E',
  [LeadPhase.VISITA_IMOVEL]: '#F97316',
  [LeadPhase.ENGENHARIA]: '#0EA5E9',
  [LeadPhase.EMISSAO_CONTRATO]: '#EAB308',
  [LeadPhase.ASSINATURA_CONTRATO]: '#10B981'
};

const Dashboard: React.FC<DashboardProps> = ({ leads, clients, properties, brokers }) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    // Garantia de que o container no DOM existe antes de injetar os gráficos
    const timer = setTimeout(() => {
      const mainContainer = document.getElementById('dashboard-main-container');
      if (mainContainer && mainContainer.offsetWidth > 0) {
        setIsRendered(true);
      } else {
        // Tenta novamente em 50ms se o DOM ainda estiver carregando
        setTimeout(() => setIsRendered(true), 50);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const phaseStats = Object.values(LeadPhase).map(phase => ({
    name: phase,
    count: leads.filter(l => l.currentPhase === phase).length
  }));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const leadsInAbertura = leads.filter(l => l.currentPhase === LeadPhase.ABERTURA_CREDITO);
  const totalValueAbertura = leadsInAbertura.reduce((acc, lead) => {
    const prop = properties.find(p => p.id === lead.propertyId);
    return acc + (Number(prop?.value) || 0);
  }, 0);

  const leadsEmAprovacao = leads.filter(l => l.currentPhase !== LeadPhase.ABERTURA_CREDITO);
  const totalValueEmAprovacao = leadsEmAprovacao.reduce((acc, lead) => {
    const prop = properties.find(p => p.id === lead.propertyId);
    return acc + (Number(prop?.value) || 0);
  }, 0);

  return (
    <div className="space-y-6" id="dashboard-main-container">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Visão Geral SAP Engine</h2>
        <button onClick={() => confirm("Deseja inicializar?") && initDatabase()} className="text-[10px] font-black uppercase text-gray-400 border px-3 py-1 rounded-lg">Inicializar Banco</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total de Leads" value={leads.length} icon={<Activity className="text-blue-500" />} />
        <MetricCard label="VGV Abertura" value={formatCurrency(totalValueAbertura)} icon={<CreditCard className="text-gray-400" />} />
        <MetricCard label="Valor em Aprovação" value={formatCurrency(totalValueEmAprovacao)} icon={<DollarSign className="text-[#8B0000]" />} />
        <MetricCard label="Imóveis Ativos" value={properties.length} icon={<Home className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 min-h-[350px]">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Pipeline Operacional</h3>
          <div className="h-64">
            {isRendered && (
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={phaseStats} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 9, fontWeight: 'bold'}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={15}>
                    {phaseStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PHASE_COLORS[entry.name] || '#8B0000'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 min-h-[350px]">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Conversão Total</h3>
          <div className="h-64">
            {isRendered && (
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie data={phaseStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count">
                    {phaseStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PHASE_COLORS[entry.name] || '#C0C0C0'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between min-h-[140px]">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
    </div>
    <div>
      <h4 className="text-2xl font-black text-gray-900 tracking-tighter">{value}</h4>
      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">{label}</p>
    </div>
  </div>
);

export default Dashboard;
