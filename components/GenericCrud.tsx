
import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Image as ImageIcon, 
  Eye, Landmark, Upload, Link as LinkIcon, Building2,
  Wallet, TrendingUp, Calendar, Filter, Briefcase, MapPin, User, ChevronRight
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
    if (confirm('Deseja realmente excluir este registro permanentemente do Firestore?')) {
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
    // Reset filters
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
      alert("Erro ao salvar no Firestore. Verifique as regras de segurança.");
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
      
      // Select the new item in the main form
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
    
    // Date Filtering
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
          
          <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.3em]">Vínculos Preferenciais (Lead Direto)</h4>
            <SelectField 
              label="Imóvel" 
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
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.3em]">Informações Gerais</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Imóvel</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900 font-bold" 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  {PROPERTY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
              </div>
              <InputField label="Valor Venda (R$)" type="number" value={formData.value} onChange={v => setFormData({...formData, value: Number(v)})} />
            </div>

            <SelectField 
              label="Construtora" 
              value={formData.constructionCompanyId} 
              options={companies.map(c => ({id: c.id, label: c.name}))} 
              onChange={v => setFormData({...formData, constructionCompanyId: v})}
              onQuickAdd={() => setIsQuickAddOpen('company')}
            />
            
            <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 italic">Descrição Gerada Automaticamente:</p>
               <p className="text-xs font-black text-[#8B0000]">
                  {`${formData.type || ''} ${formData.neighborhood || ''} ${formData.city || ''} ${formData.state || ''}`.trim() || 'Preencha os campos de localização'}
               </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.3em]">Localização</h4>
            <InputField label="Endereço Completo" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
            <div className="grid grid-cols-3 gap-3">
              <InputField label="Bairro" value={formData.neighborhood} onChange={v => setFormData({...formData, neighborhood: v})} />
              <InputField label="Cidade / Município" value={formData.city} onChange={v => setFormData({...formData, city: v})} />
              <InputField label="UF" value={formData.state} onChange={v => setFormData({...formData, state: v})} />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.3em]">Mídia e Fotos</h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                   <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                   <input 
                    type="text" 
                    placeholder="Cole a URL da imagem..."
                    className="w-full border border-gray-200 rounded-lg pl-9 p-2.5 text-sm outline-none focus:ring-1 focus:ring-[#8B0000] bg-gray-50"
                    value={imgUrlInput}
                    onChange={e => setImgUrlInput(e.target.value)}
                   />
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleAddImgUrl}
                className="bg-gray-900 text-white px-4 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
              >
                Adicionar
              </button>
            </div>
            
            <div className="relative">
              <label className="flex items-center justify-center space-x-2 w-full p-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                <Upload size={18} className="text-gray-400 group-hover:text-[#8B0000]" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-700">Upload de Arquivo</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>

            {formData.photos && formData.photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {formData.photos.map((photo: string, idx: number) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 group">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
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
          <InputField label="Nome do Banco" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Agência" value={formData.agency} onChange={v => setFormData({...formData, agency: v})} />
            <InputField label="URL da Logo" value={formData.logo} onChange={v => setFormData({...formData, logo: v})} />
          </div>
          <InputField label="Telefone Contato" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
          <InputField label="E-mail" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
        </>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder={`Buscar ${title}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000] w-full md:w-80 bg-white text-gray-900 font-bold placeholder:font-normal" />
        </div>
        <button onClick={() => handleOpenModal()} className="bg-[#8B0000] text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#6b0000] transition-all"><Plus size={18} /><span>Novo {title.slice(0, -1)}</span></button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {getTableHeaders().map((h, idx) => (
                  <th key={idx} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors text-sm group">
                  {renderRow(item)}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenViewModal(item)} className="p-1.5 text-gray-400 hover:text-[#8B0000] hover:bg-red-50 rounded transition-all"><Eye size={16} /></button>
                      <button onClick={() => handleOpenModal(item)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredData.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-[10px]">Nenhum registro encontrado no Firestore</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#8B0000] px-6 py-4 flex items-center justify-between text-white sticky top-0 z-10">
              <h3 className="font-bold uppercase tracking-widest text-sm">{editingItem ? 'Editar' : 'Cadastrar'} {title.slice(0,-1)} Cloud</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {renderFormFields()}
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-[#8B0000] text-white rounded-lg font-black uppercase text-[10px] tracking-widest shadow-md disabled:opacity-50">
                  {loading ? 'Salvando...' : 'Salvar no Firestore'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className={`bg-white rounded-[2rem] shadow-2xl w-full ${type === 'broker' ? 'max-w-5xl' : 'max-w-2xl'} my-8 overflow-hidden animate-in fade-in zoom-in duration-300 relative`}>
             <div className="p-10 pt-8">
                <div className="flex justify-between items-center mb-10">
                   <h4 className="text-[11px] font-black text-[#8B0000] uppercase tracking-[0.4em]">Detalhes do Registro Cloud</h4>
                   <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={28} className="text-gray-300" /></button>
                </div>
                
                {type === 'property' ? (
                  <div className="space-y-10">
                    <div className="w-full aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl bg-gray-100">
                      {viewingItem.photos?.[0] ? (
                        <img src={viewingItem.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImageIcon size={64} strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                       <DetailBlock label="UF" value={viewingItem.state} />
                       <DetailBlock label="TIPO" value={viewingItem.type} />
                       <DetailBlock label="VALOR DE VENDA" value={formatCurrency(Number(viewingItem.value))} />
                       <DetailBlock label="BAIRRO" value={viewingItem.neighborhood} />
                       <DetailBlock label="CIDADE" value={viewingItem.city} />
                       <DetailBlock label="DESCRIÇÃO" value={viewingItem.title} />
                       <DetailBlock label="ENDEREÇO" value={viewingItem.address} className="col-span-2" />
                       {viewingItem.constructionCompanyId && (
                         <DetailBlock 
                           label="CONSTRUTORA" 
                           value={companies.find(c => c.id === viewingItem.constructionCompanyId)?.name || 'Vínculo removido'} 
                           className="col-span-2"
                           icon={<Building2 size={14} className="mr-2 text-[#8B0000]" />}
                         />
                       )}
                    </div>
                  </div>
                ) : type === 'broker' ? (
                  (() => {
                    const { aReceber, recebido, filteredLeads } = calculateBrokerStats(viewingItem.id);
                    return (
                      <div className="space-y-8">
                        {/* Broker Top Dashboard */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-1 flex flex-col justify-center items-center bg-[#1F1F1F] text-white p-8 rounded-3xl shadow-xl">
                            <div className="w-20 h-20 bg-[#8B0000] rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg mb-4">
                              {viewingItem.name?.charAt(0)}
                            </div>
                            <h2 className="text-2xl font-black text-center leading-tight">{viewingItem.name}</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">CRECI: {viewingItem.creci}</p>
                            <div className="mt-6 w-full space-y-2">
                               <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 tracking-tighter border-b border-gray-800 pb-2">
                                  <span>Contatos</span>
                               </div>
                               <p className="text-xs text-gray-300 truncate">{viewingItem.email}</p>
                               <p className="text-xs text-gray-300">{viewingItem.phone}</p>
                            </div>
                          </div>

                          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                             {/* Stats Grid */}
                             <div className="p-6 border border-gray-100 rounded-3xl bg-blue-50/50 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                     <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><TrendingUp size={20} /></div>
                                     <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-100 px-2 py-1 rounded">Em Aberto</span>
                                  </div>
                                  <p className="text-3xl font-black text-blue-800 tracking-tighter">{formatCurrency(aReceber)}</p>
                                </div>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-4">Comissão a Receber</p>
                             </div>
                             
                             <div className="p-6 border border-gray-100 rounded-3xl bg-green-50/50 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                     <div className="p-2 bg-green-100 rounded-lg text-green-600"><Wallet size={20} /></div>
                                     <span className="text-[9px] font-black text-green-600 uppercase bg-green-100 px-2 py-1 rounded">Finalizado</span>
                                  </div>
                                  <p className="text-3xl font-black text-green-800 tracking-tighter">{formatCurrency(recebido)}</p>
                                </div>
                                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mt-4">Comissão Recebida</p>
                             </div>

                             {/* Filters Area */}
                             <div className="col-span-1 md:col-span-2 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <div className="flex items-center space-x-2 mb-4">
                                   <Filter size={14} className="text-gray-400" />
                                   <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Filtros de Período (Abertura Lead)</span>
                                </div>
                                <div className="flex flex-wrap gap-4 items-end">
                                   <div className="space-y-1">
                                      <label className="text-[9px] font-black text-gray-400 uppercase">Data Inicial</label>
                                      <input type="date" className="p-2 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-[#8B0000]" value={brokerDateStart} onChange={e => setBrokerDateStart(e.target.value)} />
                                   </div>
                                   <div className="space-y-1">
                                      <label className="text-[9px] font-black text-gray-400 uppercase">Data Final</label>
                                      <input type="date" className="p-2 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-[#8B0000]" value={brokerDateEnd} onChange={e => setBrokerDateEnd(e.target.value)} />
                                   </div>
                                   <button 
                                      onClick={() => { setBrokerDateStart(''); setBrokerDateEnd(''); }} 
                                      className="p-2.5 text-[10px] font-bold uppercase text-gray-400 hover:text-red-600 transition-colors"
                                   >Limpar</button>
                                </div>
                             </div>
                          </div>
                        </div>

                        {/* Leads Detail List */}
                        <div className="space-y-4">
                           <div className="flex items-center justify-between px-2">
                              <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Histórico de Performance do Corretor</h3>
                              <span className="text-[10px] font-bold text-gray-400">{filteredLeads.length} registros no período</span>
                           </div>
                           
                           <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                              {filteredLeads.map(lead => {
                                 const client = clients.find(c => c.id === lead.clientId);
                                 const property = properties.find(p => p.id === lead.propertyId);
                                 const company = companies.find(c => c.id === property?.constructionCompanyId);
                                 return (
                                    <div key={lead.id} className="bg-white border border-gray-100 p-5 rounded-2xl hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between group">
                                       <div className="flex items-center space-x-4 mb-4 md:mb-0">
                                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#8B0000] font-black text-sm group-hover:bg-[#8B0000] group-hover:text-white transition-colors">
                                             {client?.name?.charAt(0)}
                                          </div>
                                          <div>
                                             <p className="text-sm font-black text-gray-900 group-hover:text-[#8B0000] transition-colors">{client?.name}</p>
                                             <div className="flex items-center space-x-2 mt-0.5">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${lead.currentPhase === LeadPhase.ASSINATURA_CONTRATO ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                   {lead.currentPhase}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                                  Aberto em: {new Date(lead.createdAt).toLocaleDateString()}
                                                </span>
                                             </div>
                                          </div>
                                       </div>
                                       
                                       <div className="flex flex-col md:items-end space-y-1">
                                          <div className="flex items-center text-xs font-bold text-gray-600">
                                             <MapPin size={12} className="mr-1.5 text-red-500" />
                                             <span className="truncate max-w-[200px]">{property?.title}</span>
                                          </div>
                                          <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                             <Building2 size={10} className="mr-1.5" />
                                             <span>{company?.name || '---'}</span>
                                          </div>
                                       </div>

                                       <div className="md:w-32 text-right mt-4 md:mt-0">
                                          <p className="text-sm font-black text-[#8B0000]">
                                             {formatCurrency((Number(property?.value) * Number(viewingItem.commissionRate)) / 100)}
                                          </p>
                                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Estimativa</p>
                                       </div>
                                    </div>
                                 );
                              })}
                              {filteredLeads.length === 0 && (
                                 <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-50 rounded-3xl opacity-30">
                                    <Briefcase size={32} className="mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhum lead encontrado para este corretor</p>
                                 </div>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-h-[60vh] overflow-y-auto pr-4">
                    {Object.entries(viewingItem).map(([key, value]) => (
                      key !== 'id' && key !== 'photos' && key !== 'logo' && key !== 'createdAt' && key !== 'updatedAt' && value !== undefined && value !== '' && (
                        <div key={key} className="border-b border-gray-50 pb-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{key}</label>
                          <p className="text-gray-900 font-bold text-sm">{String(value)}</p>
                        </div>
                      )
                    ))}
                  </div>
                )}

                <div className="mt-12 flex justify-end">
                   <button 
                    onClick={() => { setIsViewModalOpen(false); handleOpenModal(viewingItem); }} 
                    className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8B0000] flex items-center hover:bg-red-50 px-4 py-2 rounded-lg transition-all"
                   >
                      <Edit2 size={14} className="mr-2" /> Editar Informações
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// UI Components
const QuickAddModal: React.FC<{type: string, onClose: () => void, onSave: (d: any) => void, companies?: ConstructionCompany[]}> = ({type, onClose, onSave, companies}) => {
  const [data, setData] = useState<any>({});
  
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-[#1F1F1F] px-6 py-4 flex items-center justify-between text-white">
          <h3 className="font-black uppercase tracking-widest text-[10px]">Cadastro Rápido: {type}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(data); }} className="p-6 space-y-4">
          {type === 'company' && (
            <>
              <InputField label="Razão Social" value={data.name} onChange={v => setData({...data, name: v})} />
              <InputField label="Município" value={data.city} onChange={v => setData({...data, city: v})} />
            </>
          )}
          {type === 'property' && (
            <>
              <InputField label="Título do Imóvel" value={data.title} onChange={v => setData({...data, title: v})} />
              <InputField label="Valor (R$)" type="number" value={data.value} onChange={v => setData({...data, value: Number(v)})} />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Construtora</label>
                <select className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white font-bold" value={data.constructionCompanyId} onChange={e => setData({...data, constructionCompanyId: e.target.value})}>
                   <option value="">Selecione...</option>
                   {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </>
          )}
          {type === 'broker' && (
            <>
              <InputField label="Nome Corretor" value={data.name} onChange={v => setData({...data, name: v})} />
              <InputField label="CRECI" value={data.creci} onChange={v => setData({...data, creci: v})} />
            </>
          )}
          {type === 'bank' && (
            <>
              <InputField label="Nome Banco" value={data.name} onChange={v => setData({...data, name: v})} />
              <InputField label="Agência" value={data.agency} onChange={v => setData({...data, agency: v})} />
            </>
          )}
          <div className="flex justify-end space-x-2 pt-4">
             <button type="button" onClick={onClose} className="px-4 py-2 text-[10px] font-bold uppercase text-gray-400">Cancelar</button>
             <button type="submit" className="px-6 py-2 bg-[#8B0000] text-white rounded-lg font-black uppercase text-[10px] shadow-lg">Cadastrar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DetailBlock: React.FC<{ label: string; value: string; className?: string; icon?: React.ReactNode }> = ({ label, value, className = "", icon }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{label}</label>
    <div className="flex items-center">
      {icon}
      <p className="text-gray-900 font-bold text-base tracking-tight leading-tight">{value || '---'}</p>
    </div>
  </div>
);

const InputField: React.FC<{ label: string; value: any; onChange: (v: string) => void; type?: string; step?: string }> = ({ label, value, onChange, type = "text", step }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input 
      type={type} 
      step={step} 
      placeholder={`Digite ${label.toLowerCase()}...`}
      value={value || ''} 
      onChange={e => onChange(e.target.value)} 
      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900 font-bold placeholder:font-normal placeholder:text-gray-300" 
      required={type !== 'file' && type !== 'number'}
    />
  </div>
);

const SelectField: React.FC<{ label: string; value: any; options: {id: string, label: string}[], onChange: (v: string) => void; onQuickAdd: () => void }> = ({ label, value, options, onChange, onQuickAdd }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="flex gap-2">
      <select 
        value={value || ''} 
        onChange={e => onChange(e.target.value)}
        className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-[#8B0000] bg-white font-bold text-gray-900"
      >
        <option value="">Selecione {label.toLowerCase()}...</option>
        {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
      </select>
      <button 
        type="button" 
        onClick={onQuickAdd}
        className="p-2.5 bg-gray-100 text-[#8B0000] rounded-lg hover:bg-gray-200 transition-colors"
        title={`Cadastrar Novo ${label}`}
      >
        <Plus size={18} />
      </button>
    </div>
  </div>
);

export default GenericCrud;
