
import React from 'react';
import { Lead, Client, Property, LeadPhase } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Activity, CreditCard, DollarSign, Home } from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
  clients: Client[];
  properties: Property[];
}

const Dashboard: React.FC<DashboardProps> = ({ leads, clients, properties }) => {
  const phaseStats = Object.values(LeadPhase).map(phase => ({
    name: phase,
    count: leads.filter(l => l.currentPhase === phase).length
  }));

  const COLORS = ['#8B0000', '#C0C0C0', '#4A4A4A', '#D1D5DB', '#6B7280', '#1F1F1F'];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL'
    }).format(val);
  };

  // SOMA: Leads apenas na fase de Abertura de Crédito
  const leadsInAbertura = leads.filter(l => l.currentPhase === LeadPhase.ABERTURA_CREDITO);
  const totalValueAbertura = leadsInAbertura.reduce((acc, lead) => {
    const prop = properties.find(p => p.id === lead.propertyId);
    return acc + (Number(prop?.value) || 0);
  }, 0);

  // SOMA: Todos os leads APÓS a fase de Abertura de Crédito
  const leadsEmAprovacao = leads.filter(l => l.currentPhase !== LeadPhase.ABERTURA_CREDITO);
  const totalValueEmAprovacao = leadsEmAprovacao.reduce((acc, lead) => {
    const prop = properties.find(p => p.id === lead.propertyId);
    return acc + (Number(prop?.value) || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Total de Leads" 
          value={leads.length} 
          icon={<Activity className="text-blue-500" />} 
          trend="Fluxo Ativo" 
        />
        <MetricCard 
          label="VGV Abertura" 
          value={formatCurrency(totalValueAbertura)} 
          subValue={`${leadsInAbertura.length} leads`}
          icon={<CreditCard className="text-gray-400" />} 
          trend="Início Pipeline" 
        />
        <MetricCard 
          label="Valor em Aprovação" 
          value={formatCurrency(totalValueEmAprovacao)} 
          subValue={`${leadsEmAprovacao.length} leads`}
          icon={<DollarSign className="text-[#8B0000]" />} 
          trend="Soma Monetária" 
        />
        <MetricCard 
          label="Imóveis Ativos" 
          value={properties.length} 
          icon={<Home className="text-purple-500" />} 
          trend="Estoque" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Distribuição por Fase</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip 
                  cursor={{fill: '#f4f6f8'}} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Bar dataKey="count" fill="#8B0000" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Volume do Pipeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={phaseStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {phaseStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string, value: string | number, subValue?: string, icon: React.ReactNode, trend: string }> = ({ label, value, subValue, icon, trend }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-red-50 transition-colors">{icon}</div>
      <span className="text-[10px] font-black text-[#8B0000] bg-red-50 px-2 py-1 rounded uppercase tracking-tighter">{trend}</span>
    </div>
    <h4 className="text-xl font-black text-gray-900 truncate">{value}</h4>
    {subValue && <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{subValue}</p>}
    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">{label}</p>
  </div>
);

export default Dashboard;
