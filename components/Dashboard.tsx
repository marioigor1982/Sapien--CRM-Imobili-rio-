
import React from 'react';
import { Lead, Client, Property, LeadPhase, Broker } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Activity, CreditCard, DollarSign, Home, Database, Users, Eye, Settings, Wallet } from 'lucide-react';
import { initDatabase } from '../initDatabase';

interface DashboardProps {
  leads: Lead[];
  clients: Client[];
  properties: Property[];
  brokers: Broker[];
}

const Dashboard: React.FC<DashboardProps> = ({ leads, clients, properties, brokers }) => {
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

  // 1. SOMA: Leads apenas na fase de Abertura de Crédito (VGV)
  const leadsInAbertura = leads.filter(l => l.currentPhase === LeadPhase.ABERTURA_CREDITO);
  const totalValueAbertura = leadsInAbertura.reduce((acc, lead) => {
    const prop = properties.find(p => p.id === lead.propertyId);
    return acc + (Number(prop?.value) || 0);
  }, 0);

  // 2. SOMA: Todos os leads APÓS a fase de Abertura de Crédito
  const leadsEmAprovacao = leads.filter(l => l.currentPhase !== LeadPhase.ABERTURA_CREDITO);
  const totalValueEmAprovacao = leadsEmAprovacao.reduce((acc, lead) => {
    const prop = properties.find(p => p.id === lead.propertyId);
    return acc + (Number(prop?.value) || 0);
  }, 0);

  // 3. NOVO: Total de comissões (Abertura até Emissão)
  const commissionPhases = [
    LeadPhase.ABERTURA_CREDITO,
    LeadPhase.APROVACAO_CREDITO,
    LeadPhase.VISITA_IMOVEL,
    LeadPhase.ENGENHARIA,
    LeadPhase.EMISSAO_CONTRATO
  ];
  const totalCommissions = leads
    .filter(l => commissionPhases.includes(l.currentPhase))
    .reduce((acc, lead) => {
      const prop = properties.find(p => p.id === lead.propertyId);
      const broker = brokers.find(b => b.id === lead.brokerId);
      if (prop && broker) {
        return acc + (Number(prop.value) * Number(broker.commissionRate) / 100);
      }
      return acc;
    }, 0);

  // 4. NOVO: Contagem de Visita ao Imóvel
  const visitasCount = leads.filter(l => l.currentPhase === LeadPhase.VISITA_IMOVEL).length;

  // 5. NOVO: Contagem de Engenharia
  const engenhariaCount = leads.filter(l => l.currentPhase === LeadPhase.ENGENHARIA).length;

  const handleInit = async () => {
    if (confirm("Deseja inicializar o banco de dados com dados de exemplo? Isso criará as coleções no Firestore.")) {
      await initDatabase();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Visão Geral de Performance</h2>
        <button 
          onClick={handleInit}
          className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-md transition-colors text-[10px] font-black uppercase tracking-widest border border-gray-200"
        >
          <Database size={12} />
          <span>Inicializar Banco</span>
        </button>
      </div>

      {/* Grid de Métricas (Agora com 8 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Novos 4 Cards */}
        <MetricCard 
          label="Total Comissões" 
          value={formatCurrency(totalCommissions)} 
          subValue="Fases: Abertura à Emissão"
          icon={<Wallet className="text-green-500" />} 
          trend="Previsão" 
        />
        <MetricCard 
          label="Visitas ao Imóvel" 
          value={visitasCount} 
          subValue="Em andamento"
          icon={<Eye className="text-orange-500" />} 
          trend="Na Fase" 
        />
        <MetricCard 
          label="Engenharia" 
          value={engenhariaCount} 
          subValue="Vistorias/Laudos"
          icon={<Settings className="text-sky-500" />} 
          trend="Na Fase" 
        />
        <MetricCard 
          label="Clientes na Base" 
          value={clients.length} 
          icon={<Users className="text-indigo-500" />} 
          trend="Carteira" 
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
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col justify-between">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-red-50 transition-colors shrink-0">{icon}</div>
      <span className="text-[10px] font-black text-[#8B0000] bg-red-50 px-2 py-1 rounded uppercase tracking-tighter whitespace-nowrap ml-2">{trend}</span>
    </div>
    <div className="min-h-[3rem]">
      <h4 className="text-xl font-black text-gray-900 truncate tracking-tighter">{value}</h4>
      {subValue && <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5 line-clamp-1">{subValue}</p>}
    </div>
    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 border-t border-gray-50 pt-2">{label}</p>
  </div>
);

export default Dashboard;
