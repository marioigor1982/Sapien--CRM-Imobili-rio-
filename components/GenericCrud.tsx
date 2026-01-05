
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Image as ImageIcon, 
  Eye, Landmark, Upload, Link as LinkIcon, Building2,
  Wallet, TrendingUp, Calendar, Filter, Briefcase, MapPin, User, ChevronRight, CheckCircle2, AlertCircle, Lock
} from 'lucide-react';
import { LeadPhase, ConstructionCompany, Lead, Property, Broker, Client, Bank } from '../types';

interface GenericCrudProps {
  title: string;
  data: any[];
  type: 'client' | 'broker' | 'property' | 'bank' | 'company';
  onSave?: (data: any) => Promise<any>;
  onDelete?: (id: string) => Promise<any>;
  companies?: ConstructionCompany[];
  leads?: Lead[]; 
  properties?: Property[]; 
  clients?: Client[];
  brokers?: Broker[];
  banks?: Bank[];
  isAdmin: boolean;
  companyService?: any;
  propertyService?: any;
  brokerService?: any;
  bankService?: any;
}

interface IBGEMunicipio {
  municipio: string;
  estado: string;
  uf: string;
}

const PROPERTY_TYPES = [
  "Apart-hotel / Flat", "Apartamento", "Bangalô", "Casa de condomínio", 
  "Casa Geminada", "Casa Sobreposta", "Casa Térrea", "Chácara", 
  "Cobertura", "Duplex / Triplex", "Edícula", "Fazenda", 
  "Galpão / Depósito", "Giardino / Garden", "Kitnet", "Laje Corporativa", 
  "Loft", "Loja de Rua", "Lote / Terreno", "Mansão", 
  "Sala Comercial", "Sítio", "Sobrado", "Studio"
];

const GenericCrud: React.FC<GenericCrudProps> = ({ 
  title, data, type, onSave, onDelete, 
  companies = [], leads = [], properties = [], clients = [], brokers = [], banks = [],
  companyService, propertyService, brokerService, bankService, isAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  
  const [municipiosIBGE, setMunicipiosIBGE] = useState<IBGEMunicipio[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [showCityResults, setShowCityResults] = useState(false);

  const [brokerDateStart, setBrokerDateStart] = useState('');
  const [brokerDateEnd, setBrokerDateEnd] = useState('');

  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios");
        const dados = await response.json();
        const formatados = dados.map((item: any) => ({
          municipio: item.nome.toUpperCase(),
          estado: item.microrregiao.mesorregiao.UF.nome.toUpperCase(),
          uf: item.microrregiao.mesorregiao.UF.sigla.toUpperCase()
        }));
        setMunicipiosIBGE(formatados);
      } catch (e) {
        console.error("Falha ao carregar municípios IBGE", e);
      }
    };
    fetchMunicipios();
  }, []);

  const filteredMunicipios = useMemo(() => {
    if (citySearch.length < 2) return [];
    return municipiosIBGE
      .filter(item => item.municipio.includes(citySearch.toUpperCase()))
      .slice(0, 15);
  }, [citySearch, municipiosIBGE]);

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert("AÇÃO RESTRITA: APENAS ADMINISTRADORES PODEM EXCLUIR REGISTROS DO SISTEMA.");
      return;
    }
    if (confirm(`DESEJA REALMENTE EXCLUIR ESTE ${title.slice(0,-1).toUpperCase()} PERMANENTEMENTE?`)) {
      if (onDelete) await onDelete(id);
      if (viewingItem?.id === id) setIsViewModalOpen(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
      setCitySearch(item.city || '');
    } else {
      setEditingItem(null);
      const defaults: any = {};
      if (type === 'client') { defaults.status = 'Ativo'; defaults.income = 0; }
      if (type === 'broker') { defaults.commissionRate = 0; }
      if (type === 'bank') { defaults.logo = ''; }
      if (type === 'property') { 
        defaults.value = 0; 
        defaults.photos = []; 
        defaults.type = "Apartamento"; 
        defaults.state = "";
        defaults.city = "";
        defaults.neighborhood = "";
        defaults.constructionCompanyId = "";
      }
      setFormData(defaults);
      setCitySearch('');
    }
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (item: any) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
    setBrokerDateStart('');
    setBrokerDateEnd('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let finalData = { ...formData };
    
    if (type === 'property') {
      const { type: pType, neighborhood, city, state } = finalData;
      const autoTitle = `${pType || ''} ${neighborhood || ''} ${city || ''} ${state || ''}`.trim().replace(/\s+/g, ' ');
      finalData.title = autoTitle.toUpperCase();
    }

    try {
      if (onSave) {
        await onSave(finalData);
        setIsModalOpen(false);
      }
    } catch (err) {
      alert("ERRO AO SALVAR NO FIRESTORE.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (quickType: string, quickData: any) => {
    setLoading(true);
    try {
      let res;
      if (quickType === 'company' && companyService) {
        res = await companyService.create(quickData);
        if (res && res.id) {
           setFormData(prev => ({...prev, constructionCompanyId: res.id}));
        }
      } 
      else if (quickType === 'property' && propertyService) {
        const { type: pType, neighborhood, city, state } = quickData;
        const autoTitle = `${pType || ''} ${neighborhood || ''} ${city || ''} ${state || ''}`.trim().replace(/\s+/g, ' ');
        quickData.title = autoTitle.toUpperCase();
        res = await propertyService.create(quickData);
        if (res && res.id) {
           setFormData(prev => ({...prev, propertyId: res.id}));
        }
      }
      else if (quickType === 'broker' && brokerService) {
        res = await brokerService.create(quickData);
        if (res && res.id) {
           setFormData(prev => ({...prev, brokerId: res.id}));
        }
      }
      else if (quickType === 'bank' && bankService) {
        res = await bankService.create(quickData);
        if (res && res.id) {
           setFormData(prev => ({...prev, bankId: res.id}));
        }
      }
      setIsQuickAddOpen(null);
    } catch (e) {
      alert("ERRO NO CADASTRO RÁPIDO.");
    } finally {
      setLoading(false);
    }
  };

  const calculateBrokerStats = (brokerId: string) => {
    let brokerLeads = leads.filter(l => l.brokerId === brokerId);
    if (brokerDateStart) brokerLeads = brokerLeads.filter(l => new Date(l.createdAt) >= new Date(brokerDateStart));
    if (brokerDateEnd) brokerLeads = brokerLeads.filter(l => new Date(l.createdAt) <= new Date(brokerDateEnd));

    const brokerObj = brokers.find(b => b.id === brokerId) || data.find(b => b.id === brokerId);
    const commissionRate = brokerObj?.commissionRate || 0;
    let aReceber = 0; let recebido = 0;

    const aReceberPhases = [
      LeadPhase.SIMULACAO_COLETA, LeadPhase.APROVACAO_CREDITO, LeadPhase.VISITA_IMOVEL,
      LeadPhase.ENGENHARIA, LeadPhase.EMISSAO_CONTRATO
    ];

    brokerLeads.forEach(lead => {
      const property = properties.find(p => p.id === lead.propertyId);
      if (!property) return;
      const commissionValue = (Number(property.value) * commissionRate) / 100;
      if (lead.currentPhase === LeadPhase.ASSINATURA_CONTRATO) recebido += commissionValue;
      else if (aReceberPhases.includes(lead.currentPhase)) aReceber += commissionValue;
    });

    return { aReceber, recebido, filteredLeads: brokerLeads };
  };

  const filteredData = data.filter(item => {
    const values = Object.values(item).filter(v => typeof v === 'string' || typeof v === 'number').join(' ').toLowerCase();
    return values.includes(searchTerm.toLowerCase());
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const CitySelector = ({ value, onChange, label }: { value: string, onChange: (city: string, uf: string) => void, label: string }) => (
    <div className="space-y-1.5 relative">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      <input 
        type="text" 
        placeholder={`BUSCAR ${label.toUpperCase()}...`}
        value={citySearch} 
        onChange={e => {
          const val = e.target.value.toUpperCase();
          setCitySearch(val);
          setShowCityResults(true);
        }} 
        onFocus={() => setShowCityResults(true)}
        className="w-full border border-gray-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900 font-bold placeholder:font-normal placeholder:text-gray-300 shadow-sm"
      />
      {showCityResults && filteredMunicipios.length > 0 && (
        <ul className="absolute z-[110] w-full bg-white border border-gray-100 rounded-2xl shadow-2xl mt-1 max-h-60 overflow-y-auto divide-y divide-gray-50 overflow-hidden">
          {filteredMunicipios.map((item, idx) => (
            <li 
              key={idx} 
              onClick={() => {
                onChange(item.municipio, item.uf);
                setCitySearch(item.municipio);
                setShowCityResults(false);
              }}
              className="px-5 py-3 hover:bg-red-50 cursor-pointer transition-colors text-[10px] font-black text-slate-700 uppercase"
            >
              {item.municipio} - {item.estado} ({item.uf})
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderFormFields = () => {
    switch(type) {
      case 'broker': return (
        <div className="space-y-6">
          <InputField label="NOME DO CORRETOR" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="CRECI" value={formData.creci} onChange={v => setFormData({...formData, creci: v})} />
            <InputField label="COMISSÃO (%)" type="number" step="0.1" value={formData.commissionRate} onChange={v => setFormData({...formData, commissionRate: Number(v)})} />
          </div>
          <InputField label="TELEFONE" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
          <InputField label="EMAIL PROFISSIONAL" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
        </div>
      );
      case 'client': return (
        <>
          <InputField label="NOME COMPLETO" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="CPF / CNPJ" value={formData.taxId} onChange={v => setFormData({...formData, taxId: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="TELEFONE" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
            <InputField label="EMAIL" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
          </div>
          <InputField label="RENDA (MENSUAL)" type="number" value={formData.income} onChange={v => setFormData({...formData, income: Number(v)})} />
          <div className="border-t border-gray-100 pt-6 mt-6 space-y-6">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.4em]">VÍNCULOS CLOUD</h4>
            <div className="grid grid-cols-1 gap-4">
               <SelectField label="IMÓVEL DE INTERESSE" value={formData.propertyId} options={properties.map(p => ({id: p.id, label: p.title}))} onChange={v => setFormData({...formData, propertyId: v})} onQuickAdd={() => setIsQuickAddOpen('property')} />
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="CONSTRUTORA" value={formData.constructionCompanyId} options={companies.map(c => ({id: c.id, label: c.name}))} onChange={v => setFormData({...formData, constructionCompanyId: v})} onQuickAdd={() => setIsQuickAddOpen('company')} />
                <SelectField label="CORRETOR" value={formData.brokerId} options={brokers.map(b => ({id: b.id, label: b.name}))} onChange={v => setFormData({...formData, brokerId: v})} onQuickAdd={() => setIsQuickAddOpen('broker')} />
              </div>
              <SelectField label="BANCO" value={formData.bankId} options={banks.map(b => ({id: b.id, label: b.name}))} onChange={v => setFormData({...formData, bankId: v})} onQuickAdd={() => setIsQuickAddOpen('bank')} />
            </div>
          </div>
        </>
      );
      case 'company': return (
        <>
          <InputField label="RAZÃO SOCIAL" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="CNPJ" value={formData.cnpj} onChange={v => setFormData({...formData, cnpj: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="TELEFONE" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
            <InputField label="EMAIL" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CitySelector label="MUNICÍPIO" value={formData.city} onChange={(city, uf) => setFormData({...formData, city, state: uf})} />
            <InputField label="UF" value={formData.state} onChange={v => setFormData({...formData, state: v})} />
          </div>
          <InputField label="ENDEREÇO SEDE" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
        </>
      );
      case 'property': return (
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.4em]">ESPECIFICAÇÃO TÉCNICA</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TIPO DE IMÓVEL</label>
                <select className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900 font-bold uppercase" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value.toUpperCase()})}>
                  {PROPERTY_TYPES.map(pt => <option key={pt} value={pt.toUpperCase()}>{pt.toUpperCase()}</option>)}
                </select>
              </div>
              <InputField label="VALOR VENDA (R$)" type="number" value={formData.value} onChange={v => setFormData({...formData, value: Number(v)})} />
            </div>
            <SelectField label="CONSTRUTORA / INCORPORADORA" value={formData.constructionCompanyId} options={companies.map(c => ({id: c.id, label: c.name}))} onChange={v => setFormData({...formData, constructionCompanyId: v})} onQuickAdd={() => setIsQuickAddOpen('company')} />
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.4em]">GEOLOCALIZAÇÃO</h4>
            <InputField label="ENDEREÇO" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
            <div className="grid grid-cols-3 gap-3">
              <InputField label="BAIRRO" value={formData.neighborhood} onChange={v => setFormData({...formData, neighborhood: v})} />
              <div className="col-span-1">
                <CitySelector label="CIDADE" value={formData.city} onChange={(city, uf) => setFormData({...formData, city, state: uf})} />
              </div>
              <InputField label="UF" value={formData.state} onChange={v => setFormData({...formData, state: v})} />
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.4em]">MÍDIA & CLOUD PHOTOS</h4>
            <PhotoUploader photos={formData.photos || []} onUpdate={photos => setFormData({...formData, photos})} />
          </div>
        </div>
      );
      case 'bank': return (
        <>
          <InputField label="RAZÃO DO BANCO" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="NÚMERO DA AGÊNCIA" value={formData.agency} onChange={v => setFormData({...formData, agency: v})} />
            <InputField label="URL LOGOTIPO" value={formData.logo} onChange={v => setFormData({...formData, logo: v})} />
          </div>
          <InputField label="CANAL DE ATENDIMENTO" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
          <InputField label="E-MAIL GERÊNCIA" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
        </>
      );
      default: return null;
    }
  };

  const getTableHeaders = () => {
    switch(type) {
      case 'client': return ['NOME', 'DOCUMENTO', 'TELEFONE', 'EMAIL', 'RENDA', 'STATUS'];
      case 'broker': return ['NOME', 'CRECI', 'COMISSÃO (%)', 'TELEFONE', 'A RECEBER', 'RECEBIDO'];
      case 'property': return ['DESCRIÇÃO', 'TIPO', 'VALOR VENDA', 'LOCALIZAÇÃO'];
      case 'bank': return ['LOGO', 'BANCO', 'AGÊNCIA', 'TELEFONE', 'EMAIL'];
      case 'company': return ['NOME', 'CNPJ', 'MUNICÍPIO', 'TELEFONE'];
      default: return [];
    }
  };

  const renderRow = (item: any) => {
    switch(type) {
      case 'client':
        return (
          <>
            <td className="px-8 py-6 font-bold text-gray-900 uppercase">{item.name}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.taxId}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.phone}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.email}</td>
            <td className="px-8 py-6 font-bold text-gray-900">{formatCurrency(item.income || 0)}</td>
            <td className="px-8 py-6">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {item.status}
              </span>
            </td>
          </>
        );
      case 'broker':
        const { aReceber, recebido } = calculateBrokerStats(item.id);
        return (
          <>
            <td className="px-8 py-6 font-bold text-gray-900 uppercase">{item.name}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.creci}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.commissionRate}%</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.phone}</td>
            <td className="px-8 py-6 font-bold text-blue-600">{formatCurrency(aReceber)}</td>
            <td className="px-8 py-6 font-bold text-green-600">{formatCurrency(recebido)}</td>
          </>
        );
      case 'property':
        return (
          <>
            <td className="px-8 py-6 font-bold text-gray-900 uppercase">{item.title}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.type}</td>
            <td className="px-8 py-6 font-bold text-[#8B0000]">{formatCurrency(item.value || 0)}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.neighborhood}, {item.city}/{item.state}</td>
          </>
        );
      case 'bank':
        return (
          <>
            <td className="px-8 py-6">
              {item.logo ? <img src={item.logo} alt="" className="w-8 h-8 object-contain" /> : <Landmark size={20} className="text-gray-300" />}
            </td>
            <td className="px-8 py-6 font-bold text-gray-900 uppercase">{item.name}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.agency}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.phone}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.email}</td>
          </>
        );
      case 'company':
        return (
          <>
            <td className="px-8 py-6 font-bold text-gray-900 uppercase">{item.name}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.cnpj}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.city} / {item.state}</td>
            <td className="px-8 py-6 text-gray-500 uppercase">{item.phone}</td>
          </>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1">MÓDULO DE GESTÃO SAP</h3>
           <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{title}</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input type="text" placeholder={`FILTRAR ${title.toUpperCase()}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} className="pl-12 pr-6 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8B0000] w-full md:w-80 bg-white text-gray-900 font-bold shadow-sm uppercase" />
          </div>
          <button onClick={() => handleOpenModal()} className="bg-[#8B0000] text-white px-8 py-3.5 rounded-2xl flex items-center justify-center space-x-3 font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#6b0000] hover:scale-105 transition-all"><Plus size={18} /><span>ADICIONAR {title.slice(0, -1).toUpperCase()}</span></button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {getTableHeaders().map((h, idx) => (
                  <th key={idx} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{h}</th>
                ))}
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors text-sm group">
                  {renderRow(item)}
                  <td className="px-8 py-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-[-10px]">
                      <button onClick={() => handleOpenViewModal(item)} className="p-2.5 text-gray-400 hover:text-[#8B0000] hover:bg-red-50 rounded-xl transition-all"><Eye size={18} /></button>
                      <button onClick={() => handleOpenModal(item)} className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"><Edit2 size={18} /></button>
                      {isAdmin ? (
                        <button onClick={() => handleDelete(item.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                      ) : (
                        <div className="p-2.5 text-gray-200 cursor-not-allowed" title="SOMENTE ADMIN"><Lock size={18} /></div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredData.length === 0 && (
          <div className="py-24 text-center">
             <div className="flex flex-col items-center justify-center opacity-20">
                <AlertCircle size={64} strokeWidth={1} className="mb-4" />
                <p className="text-gray-900 font-black uppercase tracking-[0.3em] text-xs">NENHUM REGISTRO ENCONTRADO NO SAPIEN DB</p>
             </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col my-8 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-[#8B0000] px-10 py-8 flex items-center justify-between text-white sticky top-0 z-10 shrink-0">
              <div>
                 <h3 className="font-black uppercase tracking-widest text-sm">{editingItem ? 'EDITAR' : 'CADASTRAR'} {title.slice(0,-1).toUpperCase()} CLOUD</h3>
                 <p className="text-[10px] text-red-200 uppercase font-bold tracking-[0.2em] mt-1">GARANTIA DE INTEGRIDADE SAPIEN ENGINE</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {renderFormFields()}
                <div className="flex justify-end space-x-4 mt-12 pt-8 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-400 font-black uppercase text-[10px] tracking-widest">CANCELAR OPERAÇÃO</button>
                  <button type="submit" disabled={loading} className="px-10 py-3 bg-[#8B0000] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl disabled:opacity-50 hover:scale-105 transition-all">
                    {loading ? 'PROCESSANDO DB...' : 'SALVAR NO FIRESTORE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isQuickAddOpen && (
        <QuickAddModal 
          type={isQuickAddOpen} 
          onClose={() => setIsQuickAddOpen(null)} 
          onSave={(d: any) => handleQuickAdd(isQuickAddOpen, d)} 
          companies={companies}
          PROPERTY_TYPES={PROPERTY_TYPES}
          onQuickAddCompany={() => setIsQuickAddOpen('company')}
          municipiosIBGE={municipiosIBGE}
        />
      )}

      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg overflow-y-auto">
          <div className={`bg-white rounded-[3rem] shadow-2xl w-full ${type === 'broker' ? 'max-w-6xl' : 'max-w-3xl'} max-h-[90vh] flex flex-col my-8 overflow-hidden animate-in fade-in zoom-in duration-400 relative`}>
             <div className="p-10 pb-4 flex justify-between items-start shrink-0 sticky top-0 bg-white z-10 border-b border-gray-50 uppercase">
                <div>
                   <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.5em] mb-2">RELATÓRIO EXECUTIVO SAPIEN</h4>
                   <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{viewingItem.name || viewingItem.title}</h2>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-full transition-all text-gray-300"><X size={36} /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-12 pt-6">
                {type === 'property' ? (
                  <div className="space-y-12">
                    <div className="w-full aspect-[16/9] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-gray-50">
                      {viewingItem.photos?.[0] ? (
                        <img src={viewingItem.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <ImageIcon size={100} strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                       <DetailBlock label="VALOR DE VENDA" value={formatCurrency(Number(viewingItem.value))} className="col-span-1" valueClass="text-3xl text-[#8B0000]" />
                       <DetailBlock label="TIPO DE ATIVO" value={viewingItem.type} />
                       <DetailBlock label="ESTADO (UF)" value={viewingItem.state} />
                       <DetailBlock label="BAIRRO" value={viewingItem.neighborhood} />
                       <DetailBlock label="CIDADE" value={viewingItem.city} />
                       <DetailBlock label="TÍTULO CLOUD" value={viewingItem.title} className="col-span-2" />
                       <DetailBlock label="ENDEREÇO TÉCNICO" value={viewingItem.address} className="col-span-3" />
                       {viewingItem.constructionCompanyId && (
                         <DetailBlock label="CONSTRUTORA ASSOCIADA" value={companies.find(c => c.id === viewingItem.constructionCompanyId)?.name || 'VÍNCULO REMOVIDO'} className="col-span-3" icon={<Building2 size={16} className="mr-3 text-[#8B0000]" />} />
                       )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    {Object.entries(viewingItem).map(([key, value]) => (
                      key !== 'id' && key !== 'photos' && key !== 'logo' && key !== 'createdAt' && key !== 'updatedAt' && value !== undefined && value !== '' && (
                        <div key={key} className="border-b border-gray-50 pb-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{key.toUpperCase()}</label>
                          <p className="text-gray-900 font-bold text-lg tracking-tight uppercase">{String(value)}</p>
                        </div>
                      )
                    ))}
                  </div>
                )}
             </div>
             <div className="mt-auto px-12 py-8 flex justify-between items-center border-t border-gray-100 bg-white shrink-0 uppercase">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">AUDITORIA SAPIEN CLOUD ATIVA</p>
                <button onClick={() => { setIsViewModalOpen(false); handleOpenModal(viewingItem); }} className="px-10 py-4 bg-[#1F1F1F] text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black hover:scale-105 transition-all flex items-center">
                   <Edit2 size={16} className="mr-3" /> ALTERAR DADOS DO REGISTRO
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PhotoUploader: React.FC<{ photos: string[]; onUpdate: (photos: string[]) => void }> = ({ photos, onUpdate }) => {
  const [imgUrlInput, setImgUrlInput] = useState('');
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate([...photos, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };
  const removePhoto = (idx: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(idx, 1);
    onUpdate(newPhotos);
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input type="text" placeholder="COLE A URL DA IMAGEM AQUI..." className="flex-1 border border-gray-200 rounded-xl p-3.5 text-sm outline-none bg-gray-50 font-bold uppercase" value={imgUrlInput} onChange={e => setImgUrlInput(e.target.value.toUpperCase())} />
        <button type="button" onClick={() => { if(imgUrlInput) { onUpdate([...photos, imgUrlInput]); setImgUrlInput(''); } }} className="bg-gray-800 text-white px-6 rounded-xl text-[10px] font-black uppercase">INCLUIR</button>
      </div>
      <label className="flex items-center justify-center space-x-3 w-full p-4 border-2 border-dashed border-gray-200 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors group">
        <Upload size={20} className="text-gray-300 group-hover:text-[#8B0000]" />
        <span className="text-[10px] font-black text-gray-400 uppercase">UPLOAD LOCAL</span>
        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
      </label>
      <div className="grid grid-cols-4 gap-3">
        {photos.map((photo, idx) => (
          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group shadow-sm">
            <img src={photo} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X size={10} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuickAddModal: React.FC<{
  type: string, onClose: () => void, onSave: (d: any) => void, companies?: ConstructionCompany[], PROPERTY_TYPES: string[], onQuickAddCompany: () => void, municipiosIBGE: IBGEMunicipio[]
}> = ({type, onClose, onSave, companies, PROPERTY_TYPES, onQuickAddCompany, municipiosIBGE}) => {
  const [data, setData] = useState<any>({ type: "APARTAMENTO", photos: [], commissionRate: 0, value: 0 });
  const [citySearch, setCitySearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filtered = useMemo(() => {
    if (citySearch.length < 2) return [];
    return municipiosIBGE.filter(i => i.municipio.includes(citySearch.toUpperCase())).slice(0, 15);
  }, [citySearch, municipiosIBGE]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-[#1F1F1F] px-8 py-6 flex items-center justify-between text-white shrink-0 sticky top-0 z-10">
          <div>
             <h3 className="font-black uppercase tracking-widest text-xs">ACESSO RÁPIDO CLOUD</h3>
             <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">INCLUSÃO EM {type.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          <form onSubmit={e => { e.preventDefault(); onSave(data); }} id="quickAddForm" className="space-y-8">
            {type === 'company' && (
              <div className="space-y-6">
                <InputField label="RAZÃO SOCIAL" value={data.name} onChange={v => setData({...data, name: v})} />
                <InputField label="CNPJ" value={data.cnpj} onChange={v => setData({...data, cnpj: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MUNICÍPIO</label>
                    <input type="text" value={citySearch} onChange={e => { setCitySearch(e.target.value.toUpperCase()); setShowResults(true); }} onFocus={() => setShowResults(true)} className="w-full border border-gray-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900 font-bold shadow-sm uppercase" />
                    {showResults && filtered.length > 0 && (
                      <ul className="absolute z-[130] w-full bg-white border border-gray-100 rounded-2xl shadow-2xl mt-1 max-h-40 overflow-y-auto overflow-hidden">
                        {filtered.map((item, idx) => (
                          <li key={idx} onClick={() => { setData({...data, city: item.municipio, state: item.uf}); setCitySearch(item.municipio); setShowResults(false); }} className="px-5 py-3 hover:bg-red-50 cursor-pointer text-[10px] font-black uppercase text-slate-700">
                            {item.municipio} ({item.uf})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <InputField label="UF" value={data.state} onChange={v => setData({...data, state: v})} />
                </div>
              </div>
            )}
            {type === 'property' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TIPO</label>
                    <select className="w-full border border-gray-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900 font-bold uppercase" value={data.type} onChange={e => setData({...data, type: e.target.value.toUpperCase()})}>
                      {PROPERTY_TYPES.map(pt => <option key={pt} value={pt.toUpperCase()}>{pt.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <InputField label="VALOR VENDA (R$)" type="number" value={data.value} onChange={v => setData({...data, value: Number(v)})} />
                </div>
                <InputField label="ENDEREÇO" value={data.address} onChange={v => setData({...data, address: v})} />
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CIDADE</label>
                    <input type="text" value={citySearch} onChange={e => { setCitySearch(e.target.value.toUpperCase()); setShowResults(true); }} onFocus={() => setShowResults(true)} className="w-full border border-gray-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900 font-bold shadow-sm uppercase" />
                    {showResults && filtered.length > 0 && (
                      <ul className="absolute z-[130] w-full bg-white border border-gray-100 rounded-2xl shadow-2xl mt-1 max-h-40 overflow-y-auto overflow-hidden">
                        {filtered.map((item, idx) => (
                          <li key={idx} onClick={() => { setData({...data, city: item.municipio, state: item.uf}); setCitySearch(item.municipio); setShowResults(false); }} className="px-5 py-3 hover:bg-red-50 cursor-pointer text-[10px] font-black uppercase text-slate-700">
                            {item.municipio} ({item.uf})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <InputField label="UF" value={data.state} onChange={v => setData({...data, state: v})} />
                </div>
              </div>
            )}
          </form>
        </div>
        <div className="p-8 border-t border-gray-100 bg-white shrink-0 uppercase">
           <button type="button" onClick={() => onSave(data)} className="w-full py-4 bg-[#8B0000] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-[#6b0000] transition-all">SALVAR CADASTRO RÁPIDO</button>
        </div>
      </div>
    </div>
  );
};

const DetailBlock: React.FC<{ label: string; value: string; className?: string; icon?: React.ReactNode; valueClass?: string }> = ({ label, value, className = "", icon, valueClass = "text-lg" }) => (
  <div className={`space-y-2 ${className} uppercase`}>
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">{label}</label>
    <div className="flex items-center">
      {icon}
      <p className={`text-gray-900 font-black tracking-tighter leading-none uppercase ${valueClass}`}>{value || '---'}</p>
    </div>
  </div>
);

const InputField: React.FC<{ label: string; value: any; onChange: (v: string) => void; type?: string; step?: string }> = ({ label, value, onChange, type = "text", step }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input 
      type={type} step={step} placeholder={`INFORME ${label.toUpperCase()}...`} value={value || ''} 
      onChange={e => onChange(e.target.value.toUpperCase())} 
      className="w-full border border-gray-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900 font-bold placeholder:font-normal placeholder:text-gray-300 shadow-sm uppercase" 
      required={type !== 'file' && type !== 'number'}
    />
  </div>
);

const SelectField: React.FC<{ label: string; value: any; options: {id: string, label: string}[], onChange: (v: string) => void; onQuickAdd: () => void }> = ({ label, value, options, onChange, onQuickAdd }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="flex gap-2">
      <select value={value || ''} onChange={e => onChange(e.target.value.toUpperCase())} className="flex-1 border border-gray-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#8B0000] bg-white font-bold text-gray-900 shadow-sm uppercase">
        <option value="">ESCOLHER {label.toUpperCase()}...</option>
        {options.map(opt => <option key={opt.id} value={opt.id.toUpperCase()}>{opt.label.toUpperCase()}</option>)}
      </select>
      <button type="button" onClick={onQuickAdd} className="p-3.5 bg-gray-50 text-[#8B0000] rounded-xl border border-gray-100 hover:bg-red-50 transition-all shadow-sm"><Plus size={22} /></button>
    </div>
  </div>
);

export default GenericCrud;
