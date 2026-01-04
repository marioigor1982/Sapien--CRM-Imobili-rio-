
import React, { useState, useEffect } from 'react';
import { Lead, Client, Property, LeadPhase, Broker } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Activity, CreditCard, DollarSign, Home, Database, TrendingUp, Users } from 'lucide-react';
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
    const timer = setTimeout(() => setIsRendered(true), 300);
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Performance SAP</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Monitoramento de Fluxo em Tempo Real</p>
        </div>
        <button 
          onClick={() => confirm("Deseja sincronizar a base cloud?") && initDatabase()} 
          className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
        >
          <Database size={14} />
          <span>Sincronizar Cloud</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total de Leads" value={leads.length} icon={<Activity className="text-blue-500" />} />
        <MetricCard label="VGV Abertura" value={formatCurrency(totalValueAbertura)} icon={<CreditCard className="text-gray-400" />} />
        <MetricCard label="Em Aprovação" value={formatCurrency(totalValueEmAprovacao)} icon={<DollarSign className="text-[#8B0000]" />} />
        <MetricCard label="Imóveis Ativos" value={properties.length} icon={<Home className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pipeline Operacional</h3>
            <TrendingUp size={16} className="text-gray-300" />
          </div>
          <div className="h-72">
            {isRendered && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={phaseStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={140} tick={{fontSize: 9, fontWeight: 'bold', fill: '#6b7280'}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                    {phaseStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PHASE_COLORS[entry.name] || '#8B0000'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Conversão Total</h3>
            <Users size={16} className="text-gray-300" />
          </div>
          <div className="h-72">
            {isRendered && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={phaseStats} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="count">
                    {phaseStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PHASE_COLORS[entry.name] || '#C0C0C0'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
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
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
    </div>
    <div>
      <h4 className="text-xl font-black text-gray-900 tracking-tighter">{value}</h4>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{label}</p>
    </div>
  </div>
);

export default Dashboard;
