
import React from 'react';
import { Lead, Client, Property, LeadPhase } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, Home, Activity } from 'lucide-react';

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

  const totalValue = leads.reduce((acc, lead) => {
    const prop = properties.find(p => p.id === lead.propertyId);
    return acc + (prop?.value || 0);
  }, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="Total de Leads" 
          value={leads.length} 
          icon={<Activity className="text-blue-500" />} 
          trend="+12% este mês" 
        />
        <MetricCard 
          label="Clientes Ativos" 
          value={clients.filter(c => c.status === 'Ativo').length} 
          icon={<Users className="text-green-500" />} 
          trend="+5 novos" 
        />
        <MetricCard 
          label="Imóveis no Portfólio" 
          value={properties.length} 
          icon={<Home className="text-purple-500" />} 
          trend="Atualizado hoje" 
        />
        <MetricCard 
          label="Valor em Negociação" 
          value={formatCurrency(totalValue)} 
          icon={<TrendingUp className="text-[#8B0000]" />} 
          trend="Meta: R$ 5M" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Fases */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Leads por Fase</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f4f6f8'}} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Bar dataKey="count" fill="#8B0000" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Rosca - Conversão */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Distribuição de Status</h3>
          <div className="h-64 flex items-center justify-center">
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
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode, trend: string }> = ({ label, value, icon, trend }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{trend}</span>
    </div>
    <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
    <p className="text-sm text-gray-500 font-medium">{label}</p>
  </div>
);

export default Dashboard;
