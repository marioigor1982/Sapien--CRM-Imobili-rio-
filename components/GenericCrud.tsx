
import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Image as ImageIcon, 
  Eye, Landmark, Upload, Link as LinkIcon, Building2,
  Wallet, TrendingUp, Calendar, Filter, Briefcase, MapPin, User, ChevronRight, CheckCircle2, AlertCircle
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
  // Services for quick-add modals
  companyService?: any;
  propertyService?: any;
  brokerService?: any;
  bankService?: any;
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
  companyService, propertyService, brokerService, bankService
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState('');
  
  // Broker Dashboard Filters
  const [brokerDateStart, setBrokerDateStart] = useState('');
  const [brokerDateEnd, setBrokerDateEnd] = useState('');

  const handleDelete = async (id: string) => {
    if (confirm(`Deseja realmente excluir este ${title.slice(0,-1).toLowerCase()} permanentemente?`)) {
      if (onDelete) await onDelete(id);
      if (viewingItem?.id === id) setIsViewModalOpen(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
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
    }
    setImgUrlInput('');
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
      finalData.title = autoTitle;
    }

    try {
      if (onSave) {
        await onSave(finalData);
        setIsModalOpen(false);
      }
    } catch (err) {
      alert("Erro ao salvar no Firestore.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (quickType: string, quickData: any) => {
    setLoading(true);
    try {
      let res;
      if (quickType === 'company') res = await companyService.create(quickData);
      else if (quickType === 'property') res = await propertyService.create(quickData);
      else if (quickType === 'broker') res = await brokerService.create(quickData);
      else if (quickType === 'bank') res = await bankService.create(quickData);
      
      if (res && res.id) {
        if (quickType === 'company') setFormData({...formData, constructionCompanyId: res.id});
        if (quickType === 'property') setFormData({...formData, propertyId: res.id});
        if (quickType === 'broker') setFormData({...formData, brokerId: res.id});
        if (quickType === 'bank') setFormData({...formData, bankId: res.id});
      }
      setIsQuickAddOpen(null);
    } catch (e) {
      alert("Erro no cadastro rápido.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddImgUrl = () => {
    if (!imgUrlInput) return;
    const currentPhotos = formData.photos || [];
    setFormData({ ...formData, photos: [...currentPhotos, imgUrlInput] });
    setImgUrlInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const currentPhotos = formData.photos || [];
        setFormData({ ...formData, photos: [...currentPhotos, base64String] });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    const currentPhotos = [...(formData.photos || [])];
    currentPhotos.splice(index, 1);
    setFormData({ ...formData, photos: currentPhotos });
  };

  const calculateBrokerStats = (brokerId: string) => {
    let brokerLeads = leads.filter(l => l.brokerId === brokerId);
    
    if (brokerDateStart) {
      brokerLeads = brokerLeads.filter(l => new Date(l.createdAt) >= new Date(brokerDateStart));
    }
    if (brokerDateEnd) {
      brokerLeads = brokerLeads.filter(l => new Date(l.createdAt) <= new Date(brokerDateEnd));
    }

    const brokerObj = brokers.find(b => b.id === brokerId) || data.find(b => b.id === brokerId);
    const commissionRate = brokerObj?.commissionRate || 0;

    let aReceber = 0;
    let recebido = 0;

    const aReceberPhases = [
      LeadPhase.ABERTURA_CREDITO,
      LeadPhase.APROVACAO_CREDITO,
      LeadPhase.VISITA_IMOVEL,
      LeadPhase.ENGENHARIA,
      LeadPhase.EMISSAO_CONTRATO
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

  const getTableHeaders = () => {
    switch(type) {
      case 'client': return ['Nome', 'Documento', 'Telefone', 'Email', 'Renda', 'Status'];
      case 'broker': return ['Nome', 'CRECI', 'Comissão (%)', 'Telefone', 'A Receber', 'Recebido'];
      case 'property': return ['Descrição', 'Tipo', 'Valor de Venda', 'Localização'];
      case 'bank': return ['Logo', 'Banco', 'Agência', 'Telefone', 'Email'];
      case 'company': return ['Nome', 'CNPJ', 'Município', 'Telefone'];
      default: return [];
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const renderRow = (item: any) => {
    switch(type) {
      case 'client': return (
        <>
          <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap hover:text-[#8B0000] cursor-pointer" onClick={() => handleOpenViewModal(item)}>{item.name}</td>
          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.taxId}</td>
          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.phone}</td>
          <td className="px-6 py-4 text-gray-500">{item.email}</td>
          <td className="px-6 py-4 text-gray-900 font-bold whitespace-nowrap">{formatCurrency(Number(item.income))}</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {item.status}
            </span>
          </td>
        </>
      );
      case 'broker': 
        const { aReceber, recebido } = calculateBrokerStats(item.id);
        return (
          <>
            <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap hover:text-[#8B0000] cursor-pointer" onClick={() => handleOpenViewModal(item)}>{item.name}</td>
            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.creci}</td>
            <td className="px-6 py-4 text-gray-900 font-bold text-center whitespace-nowrap">{item.commissionRate}%</td>
            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.phone}</td>
            <td className="px-6 py-4 font-bold text-blue-600 whitespace-nowrap">{formatCurrency(aReceber)}</td>
            <td className="px-6 py-4 font-bold text-green-600 whitespace-nowrap">{formatCurrency(recebido)}</td>
          </>
        );
      case 'property': return (
        <>
          <td className="px-6 py-4 font-bold whitespace-nowrap">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => handleOpenViewModal(item)}>
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                {item.photos?.[0] ? <img src={item.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={16} /></div>}
              </div>
              <span className="group-hover:text-[#8B0000] transition-colors truncate max-w-[200px]">{item.title}</span>
            </div>
          </td>
          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.type}</td>
          <td className="px-6 py-4 font-bold text-[#8B0000] whitespace-nowrap">{formatCurrency(Number(item.value))}</td>
          <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{item.city} / {item.state}</td>
        </>
      );
      case 'bank': return (
        <>
          <td className="px-6 py-4">
            <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 p-1 flex items-center justify-center">
              {item.logo ? <img src={item.logo} alt="" className="max-w-full max-h-full object-contain" /> : <Landmark size={18} className="text-gray-300" />}
            </div>
          </td>
          <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap hover:text-[#8B0000] cursor-pointer" onClick={() => handleOpenViewModal(item)}>{item.name}</td>
          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.agency}</td>
          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.phone}</td>
          <td className="px-6 py-4 text-gray-900 font-bold whitespace-nowrap">{item.email}</td>
        </>
      );
      case 'company': return (
        <>
          <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap hover:text-[#8B0000] cursor-pointer" onClick={() => handleOpenViewModal(item)}>{item.name}</td>
          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.cnpj}</td>
          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.city} / {item.state}</td>
          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.phone}</td>
        </>
      );
      default: return null;
    }
  };

  const renderFormFields = () => {
    switch(type) {
      case 'broker': return (
        <>
          <InputField label="Nome do Corretor" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="CRECI" value={formData.creci} onChange={v => setFormData({...formData, creci: v})} />
            <InputField label="Comissão (%)" type="number" step="0.1" value={formData.commissionRate} onChange={v => setFormData({...formData, commissionRate: Number(v)})} />
          </div>
          <InputField label="Telefone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
          <InputField label="Email Profissional" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
        </>
      );
      case 'client': return (
        <>
          <InputField label="Nome Completo" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="CPF / CNPJ" value={formData.taxId} onChange={v => setFormData({...formData, taxId: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Telefone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
            <InputField label="Email" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
          </div>
          <InputField label="Renda (Mensal)" type="number" value={formData.income} onChange={v => setFormData({...formData, income: Number(v)})} />
          
          <div className="border-t border-gray-100 pt-6 mt-6 space-y-6">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.4em]">Vínculos Preferenciais Cloud</h4>
            <div className="grid grid-cols-1 gap-4">
               <SelectField 
                label="Imóvel de Interesse" 
                value={formData.propertyId} 
                options={properties.map(p => ({id: p.id, label: p.title}))} 
                onChange={v => setFormData({...formData, propertyId: v})}
                onQuickAdd={() => setIsQuickAddOpen('property')}
              />
              <div className="grid grid-cols-2 gap-4">
                <SelectField 
                  label="Corretor" 
                  value={formData.brokerId} 
                  options={brokers.map(b => ({id: b.id, label: b.name}))} 
                  onChange={v => setFormData({...formData, brokerId: v})}
                  onQuickAdd={() => setIsQuickAddOpen('broker')}
                />
                <SelectField 
                  label="Banco" 
                  value={formData.bankId} 
                  options={banks.map(b => ({id: b.id, label: b.name}))} 
                  onChange={v => setFormData({...formData, bankId: v})}
                  onQuickAdd={() => setIsQuickAddOpen('bank')}
                />
              </div>
            </div>
          </div>
        </>
      );
      case 'company': return (
        <>
          <InputField label="Razão Social" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="CNPJ" value={formData.cnpj} onChange={v => setFormData({...formData, cnpj: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Telefone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
            <InputField label="Email" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Município" value={formData.city} onChange={v => setFormData({...formData, city: v})} />
            <InputField label="UF" value={formData.state} onChange={v => setFormData({...formData, state: v})} />
          </div>
          <InputField label="Endereço Sede" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
        </>
      );
      case 'property': return (
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.4em]">Especificação Técnica</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Imóvel</label>
                <select 
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900 font-bold" 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  {PROPERTY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
              </div>
              <InputField label="Valor Venda (R$)" type="number" value={formData.value} onChange={v => setFormData({...formData, value: Number(v)})} />
            </div>

            <SelectField 
              label="Construtora / Incorporadora" 
              value={formData.constructionCompanyId} 
              options={companies.map(c => ({id: c.id, label: c.name}))} 
              onChange={v => setFormData({...formData, constructionCompanyId: v})}
              onQuickAdd={() => setIsQuickAddOpen('company')}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.4em]">Geolocalização</h4>
            <InputField label="Endereço" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
            <div className="grid grid-cols-3 gap-3">
              <InputField label="Bairro" value={formData.neighborhood} onChange={v => setFormData({...formData, neighborhood: v})} />
              <InputField label="Cidade" value={formData.city} onChange={v => setFormData({...formData, city: v})} />
              <InputField label="UF" value={formData.state} onChange={v => setFormData({...formData, state: v})} />
            </div>
            
            <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Título Gerado:</p>
               <p className="text-xs font-black text-[#8B0000]">
                  {`${formData.type || ''} ${formData.neighborhood || ''} ${formData.city || ''} ${formData.state || ''}`.trim() || 'Aguardando dados de localização...'}
               </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.4em]">Mídia & Cloud Photos</h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Cole a URL da imagem aqui..."
                className="flex-1 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-[#8B0000] bg-gray-50 font-bold"
                value={imgUrlInput}
                onChange={e => setImgUrlInput(e.target.value)}
               />
              <button 
                type="button" 
                onClick={handleAddImgUrl}
                className="bg-[#1F1F1F] text-white px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
              >
                Incluir
              </button>
            </div>
            
            <label className="flex items-center justify-center space-x-3 w-full p-6 border-2 border-dashed border-gray-200 rounded-[2rem] hover:bg-gray-50 cursor-pointer transition-colors group">
              <Upload size={20} className="text-gray-300 group-hover:text-[#8B0000]" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-600">Fazer Upload de Foto Local</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>

            {formData.photos && formData.photos.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {formData.photos.map((photo: string, idx: number) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group shadow-sm">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
      case 'bank': return (
        <>
          <InputField label="Razão do Banco" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Número da Agência" value={formData.agency} onChange={v => setFormData({...formData, agency: v})} />
            <InputField label="URL Logotipo" value={formData.logo} onChange={v => setFormData({...formData, logo: v})} />
          </div>
          <InputField label="Canal de Atendimento" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
          <InputField label="E-mail Gerência" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
        </>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1">Módulo de Gestão SAP</h3>
           <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{title}</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input type="text" placeholder={`Filtrar ${title.toLowerCase()}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8B0000] w-full md:w-80 bg-white text-gray-900 font-bold shadow-sm" />
          </div>
          <button onClick={() => handleOpenModal()} className="bg-[#8B0000] text-white px-8 py-3.5 rounded-2xl flex items-center justify-center space-x-3 font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#6b0000] hover:scale-105 transition-all"><Plus size={18} /><span>Adicionar {title.slice(0, -1)}</span></button>
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
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Ações</th>
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
                      <button onClick={() => handleDelete(item.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
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
                <p className="text-gray-900 font-black uppercase tracking-[0.3em] text-xs">Nenhum registro encontrado no Sapien DB</p>
             </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-[#8B0000] px-10 py-8 flex items-center justify-between text-white sticky top-0 z-10">
              <div>
                 <h3 className="font-black uppercase tracking-widest text-sm">{editingItem ? 'Editar' : 'Cadastrar'} {title.slice(0,-1)} Cloud</h3>
                 <p className="text-[10px] text-red-200 uppercase font-bold tracking-[0.2em] mt-1">Garantia de integridade Sapien Engine</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-10 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
              {renderFormFields()}
              <div className="flex justify-end space-x-4 mt-12 pt-8 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-400 font-black uppercase text-[10px] tracking-widest">Cancelar Operação</button>
                <button type="submit" disabled={loading} className="px-10 py-3 bg-[#8B0000] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl disabled:opacity-50 hover:scale-105 transition-all">
                  {loading ? 'Processando DB...' : 'Salvar no Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQuickAddOpen && (
        <QuickAddModal 
          type={isQuickAddOpen} 
          onClose={() => setIsQuickAddOpen(null)} 
          onSave={(d: any) => handleQuickAdd(isQuickAddOpen, d)} 
          companies={companies}
        />
      )}

      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg overflow-y-auto">
          <div className={`bg-white rounded-[3rem] shadow-2xl w-full ${type === 'broker' ? 'max-w-6xl' : 'max-w-3xl'} my-8 overflow-hidden animate-in fade-in zoom-in duration-400 relative`}>
             <div className="p-12">
                <div className="flex justify-between items-start mb-12">
                   <div>
                      <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.5em] mb-2">Relatório Executivo Sapien</h4>
                      <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{viewingItem.name || viewingItem.title}</h2>
                   </div>
                   <button onClick={() => setIsViewModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-full transition-all text-gray-300"><X size={36} /></button>
                </div>
                
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
                         <DetailBlock 
                           label="CONSTRUTORA ASSOCIADA" 
                           value={companies.find(c => c.id === viewingItem.constructionCompanyId)?.name || 'Vínculo removido'} 
                           className="col-span-3"
                           icon={<Building2 size={16} className="mr-3 text-[#8B0000]" />}
                         />
                       )}
                    </div>
                  </div>
                ) : type === 'broker' ? (
                  (() => {
                    const { aReceber, recebido, filteredLeads } = calculateBrokerStats(viewingItem.id);
                    return (
                      <div className="space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                          <div className="lg:col-span-4 flex flex-col justify-center items-center bg-[#1F1F1F] text-white p-12 rounded-[3rem] shadow-2xl border-b-8 border-[#8B0000]">
                            <div className="w-28 h-28 bg-[#8B0000] rounded-[2rem] flex items-center justify-center text-white font-black text-5xl shadow-2xl mb-8 transform hover:rotate-3 transition-transform">
                              {viewingItem.name?.charAt(0)}
                            </div>
                            <h2 className="text-3xl font-black text-center leading-none tracking-tighter mb-4">{viewingItem.name}</h2>
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] bg-red-500/10 px-4 py-2 rounded-full mb-10 border border-red-500/20">CRECI {viewingItem.creci}</span>
                            
                            <div className="w-full space-y-4 pt-8 border-t border-gray-800">
                               <div className="flex items-center space-x-4">
                                  <div className="p-2 bg-white/5 rounded-lg text-gray-500"><Search size={16} /></div>
                                  <p className="text-xs text-gray-300 font-bold truncate">{viewingItem.email}</p>
                               </div>
                               <div className="flex items-center space-x-4">
                                  <div className="p-2 bg-white/5 rounded-lg text-gray-500"><MapPin size={16} /></div>
                                  <p className="text-xs text-gray-300 font-bold">{viewingItem.phone}</p>
                               </div>
                            </div>
                          </div>

                          <div className="lg:col-span-8 space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="p-8 border border-blue-50 rounded-[2.5rem] bg-blue-50/30 flex flex-col justify-between">
                                  <div className="flex items-center justify-between mb-8">
                                     <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-lg shadow-blue-200"><TrendingUp size={28} /></div>
                                     <span className="text-[10px] font-black text-blue-700 uppercase bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 tracking-widest">A Receber</span>
                                  </div>
                                  <div>
                                     <p className="text-4xl font-black text-blue-900 tracking-tighter mb-2">{formatCurrency(aReceber)}</p>
                                     <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Carteira em processamento</p>
                                  </div>
                               </div>
                               
                               <div className="p-8 border border-green-50 rounded-[2.5rem] bg-green-50/30 flex flex-col justify-between">
                                  <div className="flex items-center justify-between mb-8">
                                     <div className="p-4 bg-green-600 text-white rounded-[1.5rem] shadow-lg shadow-green-200"><Wallet size={28} /></div>
                                     <span className="text-[10px] font-black text-green-700 uppercase bg-green-100 px-3 py-1.5 rounded-full border border-green-200 tracking-widest">Recebido</span>
                                  </div>
                                  <div>
                                     <p className="text-4xl font-black text-green-900 tracking-tighter mb-2">{formatCurrency(recebido)}</p>
                                     <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Ganhos liquidados cloud</p>
                                  </div>
                               </div>
                             </div>

                             <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                                <div className="flex items-center space-x-3 mb-6">
                                   <Filter size={18} className="text-[#8B0000]" />
                                   <span className="text-[11px] font-black uppercase text-gray-900 tracking-widest">Filtros Avançados de Performance</span>
                                </div>
                                <div className="flex flex-wrap gap-8 items-end">
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Data de Corte (Inicial)</label>
                                      <input type="date" className="w-48 p-3 text-xs border border-gray-200 rounded-xl bg-white font-bold outline-none focus:ring-2 focus:ring-[#8B0000]" value={brokerDateStart} onChange={e => setBrokerDateStart(e.target.value)} />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Data de Corte (Final)</label>
                                      <input type="date" className="w-48 p-3 text-xs border border-gray-200 rounded-xl bg-white font-bold outline-none focus:ring-2 focus:ring-[#8B0000]" value={brokerDateEnd} onChange={e => setBrokerDateEnd(e.target.value)} />
                                   </div>
                                   <button 
                                      onClick={() => { setBrokerDateStart(''); setBrokerDateEnd(''); }} 
                                      className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-red-600 transition-colors tracking-widest"
                                   >Limpar Filtros</button>
                                </div>
                             </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                           <div className="flex items-center justify-between px-6">
                              <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.3em]">Lista Detalhada de Leads e Conversões</h3>
                              <span className="text-[10px] font-black text-[#8B0000] bg-red-50 px-3 py-1 rounded-full">{filteredLeads.length} Ocorrências</span>
                           </div>
                           
                           <div className="grid grid-cols-1 gap-4 max-h-[450px] overflow-y-auto pr-4 scrollbar-hide pb-10">
                              {filteredLeads.map(lead => {
                                 const client = clients.find(c => c.id === lead.clientId);
                                 const property = properties.find(p => p.id === lead.propertyId);
                                 const isSuccess = lead.currentPhase === LeadPhase.ASSINATURA_CONTRATO;
                                 return (
                                    <div key={lead.id} className="bg-white border border-gray-100 p-8 rounded-[2rem] hover:shadow-2xl transition-all flex flex-col md:flex-row md:items-center justify-between group border-l-8 border-l-[#F4F6F8] hover:border-l-[#8B0000]">
                                       <div className="flex items-center space-x-6 mb-6 md:mb-0">
                                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-colors ${isSuccess ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                             {client?.name?.charAt(0)}
                                          </div>
                                          <div className="space-y-1">
                                             <p className="text-xl font-black text-gray-900 tracking-tight">{client?.name || 'Cliente Externo'}</p>
                                             <div className="flex items-center space-x-3">
                                                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${isSuccess ? 'bg-green-500 text-white border-green-600' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                   {lead.currentPhase}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Início: {new Date(lead.createdAt).toLocaleDateString()}</span>
                                             </div>
                                          </div>
                                       </div>
                                       
                                       <div className="flex flex-col md:items-end space-y-1 md:px-8 border-l border-gray-50 md:ml-8">
                                          <div className="flex items-center text-sm font-bold text-gray-700">
                                             <MapPin size={14} className="mr-2 text-red-500" />
                                             <span className="truncate max-w-[250px]">{property?.title}</span>
                                          </div>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatCurrency(property?.value || 0)} (VGV)</p>
                                       </div>

                                       <div className="md:w-48 text-right mt-6 md:mt-0 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 group-hover:bg-[#1F1F1F] group-hover:text-white transition-all">
                                          <p className={`text-xl font-black ${isSuccess ? 'text-green-600 group-hover:text-green-400' : 'text-[#8B0000] group-hover:text-red-400'}`}>
                                             {formatCurrency((Number(property?.value || 0) * Number(viewingItem.commissionRate || 0)) / 100)}
                                          </p>
                                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{isSuccess ? 'Comissão Liquidada' : 'Previsão Comissão'}</p>
                                       </div>
                                    </div>
                                 );
                              })}
                              {filteredLeads.length === 0 && (
                                 <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[3rem] opacity-20">
                                    <Briefcase size={48} className="mb-4" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em]">Histórico de Atividade Vazio</p>
                                 </div>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-h-[60vh] overflow-y-auto pr-6">
                    {Object.entries(viewingItem).map(([key, value]) => (
                      key !== 'id' && key !== 'photos' && key !== 'logo' && key !== 'createdAt' && key !== 'updatedAt' && value !== undefined && value !== '' && (
                        <div key={key} className="border-b border-gray-50 pb-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{key}</label>
                          <p className="text-gray-900 font-bold text-lg tracking-tight">{String(value)}</p>
                        </div>
                      )
                    ))}
                  </div>
                )}

                <div className="mt-16 flex justify-between items-center border-t border-gray-100 pt-10">
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Auditoria Sapien Cloud Ativa</p>
                   <button 
                    onClick={() => { setIsViewModalOpen(false); handleOpenModal(viewingItem); }} 
                    className="px-10 py-4 bg-[#1F1F1F] text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-black hover:scale-105 transition-all flex items-center"
                   >
                      <Edit2 size={16} className="mr-3" /> Alterar Dados do Registro
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickAddModal: React.FC<{type: string, onClose: () => void, onSave: (d: any) => void, companies?: ConstructionCompany[]}> = ({type, onClose, onSave, companies}) => {
  const [data, setData] = useState<any>({});
  
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-[#1F1F1F] px-8 py-6 flex items-center justify-between text-white">
          <div>
             <h3 className="font-black uppercase tracking-widest text-xs">Acesso Rápido Cloud</h3>
             <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Inclusão em {type}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(data); }} className="p-8 space-y-6">
          {type === 'company' && (
            <>
              <InputField label="Razão Social" value={data.name} onChange={v => setData({...data, name: v})} />
              <InputField label="Município de Operação" value={data.city} onChange={v => setData({...data, city: v})} />
            </>
          )}
          {type === 'property' && (
            <>
              <InputField label="Descrição/Nome" value={data.title} onChange={v => setData({...data, title: v})} />
              <InputField label="VGV (Valor Venda)" type="number" value={data.value} onChange={v => setData({...data, value: Number(v)})} />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Incorporadora Titular</label>
                <select className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-white font-bold outline-none" value={data.constructionCompanyId} onChange={e => setData({...data, constructionCompanyId: e.target.value})}>
                   <option value="">Selecione...</option>
                   {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </>
          )}
          {type === 'broker' && (
            <>
              <InputField label="Nome Corretor" value={data.name} onChange={v => setData({...data, name: v})} />
              <InputField label="CRECI Profissional" value={data.creci} onChange={v => setData({...data, creci: v})} />
            </>
          )}
          {type === 'bank' && (
            <>
              <InputField label="Nome Instituição" value={data.name} onChange={v => setData({...data, name: v})} />
              <InputField label="Código Agência" value={data.agency} onChange={v => setData({...data, agency: v})} />
            </>
          )}
          <div className="flex justify-end pt-6 border-t border-gray-50">
             <button type="submit" className="w-full py-4 bg-[#8B0000] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-[#6b0000] transition-all">
                Salvar e Sincronizar
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DetailBlock: React.FC<{ label: string; value: string; className?: string; icon?: React.ReactNode; valueClass?: string }> = ({ label, value, className = "", icon, valueClass = "text-lg" }) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">{label}</label>
    <div className="flex items-center">
      {icon}
      <p className={`text-gray-900 font-black tracking-tighter leading-none ${valueClass}`}>{value || '---'}</p>
    </div>
  </div>
);

const InputField: React.FC<{ label: string; value: any; onChange: (v: string) => void; type?: string; step?: string }> = ({ label, value, onChange, type = "text", step }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input 
      type={type} 
      step={step} 
      placeholder={`Informe ${label.toLowerCase()}...`}
      value={value || ''} 
      onChange={e => onChange(e.target.value)} 
      className="w-full border border-gray-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900 font-bold placeholder:font-normal placeholder:text-gray-300 shadow-sm" 
      required={type !== 'file' && type !== 'number'}
    />
  </div>
);

const SelectField: React.FC<{ label: string; value: any; options: {id: string, label: string}[], onChange: (v: string) => void; onQuickAdd: () => void }> = ({ label, value, options, onChange, onQuickAdd }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="flex gap-2">
      <select 
        value={value || ''} 
        onChange={e => onChange(e.target.value)}
        className="flex-1 border border-gray-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#8B0000] bg-white font-bold text-gray-900 shadow-sm"
      >
        <option value="">Escolher {label.toLowerCase()}...</option>
        {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
      </select>
      <button 
        type="button" 
        onClick={onQuickAdd}
        className="p-3.5 bg-gray-50 text-[#8B0000] rounded-xl border border-gray-100 hover:bg-red-50 transition-all shadow-sm"
        title={`Cadastrar Novo ${label}`}
      >
        <Plus size={22} />
      </button>
    </div>
  </div>
);

export default GenericCrud;
