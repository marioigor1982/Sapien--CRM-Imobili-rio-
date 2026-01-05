
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Image as ImageIcon, 
  Eye, Landmark, Upload, Building2,
  Wallet, TrendingUp, Briefcase, MapPin, AlertCircle, Lock
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
  "APART-HOTEL / FLAT", "APARTAMENTO", "BANGALÔ", "CASA DE CONDOMÍNIO", 
  "CASA GEMINADA", "CASA SOBREPOSTA", "CASA TÉRREA", "CHÁCARA", 
  "COBERTURA", "DUPLEX / TRIPLEX", "EDÍCULA", "FAZENDA", 
  "GALPÃO / DEPÓSITO", "GIARDINO / GARDEN", "KITNET", "LAJE CORPORATIVA", 
  "LOFT", "LOJA DE RUA", "LOTE / TERRENO", "MANSÃO", 
  "SALA COMERCIAL", "SÍTIO", "SOBRADO", "STUDIO"
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

  // Carregamento da API do IBGE
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
        console.error("FALHA AO CONECTAR COM API IBGE", e);
      }
    };
    fetchMunicipios();
  }, []);

  // Fix: Added filteredData to allow searching within the CRUD list
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toUpperCase();
    return data.filter(item => {
      return (
        (item.name && item.name.toUpperCase().includes(term)) ||
        (item.title && item.title.toUpperCase().includes(term)) ||
        (item.taxId && item.taxId.toUpperCase().includes(term)) ||
        (item.creci && item.creci.toUpperCase().includes(term)) ||
        (item.city && item.city.toUpperCase().includes(term))
      );
    });
  }, [data, searchTerm]);

  // Fix: Implemented handleQuickAdd to handle rapid entity creation from the selection modal
  const handleQuickAdd = async (qType: string, qData: any) => {
    let service;
    let field = '';
    
    switch(qType) {
      case 'company': service = companyService; field = 'constructionCompanyId'; break;
      case 'property': service = propertyService; field = 'propertyId'; break;
      case 'broker': service = brokerService; field = 'brokerId'; break;
      case 'bank': service = bankService; field = 'bankId'; break;
    }

    if (service) {
      try {
        const result = await service.create(qData);
        setFormData(prev => ({ ...prev, [field]: result.id }));
        setIsQuickAddOpen(null);
      } catch (e) {
        console.error("Quick add failed", e);
        alert("FALHA AO CADASTRAR ITEM RAPIDAMENTE.");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert("AÇÃO RESTRITA: APENAS ADMINISTRADORES PODEM EXCLUIR REGISTROS.");
      return;
    }
    if (confirm(`DESEJA REALMENTE EXCLUIR ESTE ${title.slice(0,-1).toUpperCase()}?`)) {
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
      if (type === 'client') { defaults.status = 'ATIVO'; defaults.income = 0; }
      if (type === 'broker') { defaults.commissionRate = 0; }
      if (type === 'bank') { defaults.logo = ''; }
      if (type === 'property') { 
        defaults.value = 0; 
        defaults.photos = []; 
        defaults.type = "APARTAMENTO"; 
        defaults.state = "";
        defaults.city = "";
        defaults.neighborhood = "";
        defaults.constructionCompanyId = "";
      }
      setFormData(defaults);
    }
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (item: any) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
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
      alert("ERRO AO SALVAR DADOS.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Componente de Input Inteligente para Cidade/UF
  const SmartCityInput = ({ value, ufValue, onSelect, label }: { value: string, ufValue: string, onSelect: (city: string, uf: string) => void, label: string }) => {
    const [search, setSearch] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);

    const filtered = useMemo(() => {
      if (search.length < 2) return [];
      return municipiosIBGE.filter(m => m.municipio.includes(search.toUpperCase())).slice(0, 15);
    }, [search]);

    return (
      <div className="space-y-1.5 relative">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
        <div className="relative">
          <input 
            type="text" 
            placeholder={`BUSCAR ${label}...`}
            value={search} 
            onChange={e => { setSearch(e.target.value.toUpperCase()); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            className="w-full border border-gray-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900 font-bold uppercase shadow-sm"
          />
          {isOpen && filtered.length > 0 && (
            <div className="absolute z-[150] w-full bg-white border border-gray-100 rounded-2xl shadow-2xl mt-1 max-h-60 overflow-y-auto divide-y divide-gray-50">
              {filtered.map((item, idx) => (
                <div 
                  key={idx} 
                  className="px-5 py-3 hover:bg-red-50 cursor-pointer text-[10px] font-black text-slate-700 uppercase"
                  onClick={() => {
                    onSelect(item.municipio, item.uf);
                    setSearch(item.municipio);
                    setIsOpen(false);
                  }}
                >
                  {item.municipio} - {item.estado} ({item.uf})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

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
        <div className="space-y-6">
          <InputField label="NOME COMPLETO" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="CPF / CNPJ" value={formData.taxId} onChange={v => setFormData({...formData, taxId: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="TELEFONE" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
            <InputField label="EMAIL" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
          </div>
          <InputField label="RENDA MENSAL" type="number" value={formData.income} onChange={v => setFormData({...formData, income: Number(v)})} />
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.4em]">VÍNCULOS CLOUD</h4>
            <SelectField label="IMÓVEL" value={formData.propertyId} options={properties.map(p => ({id: p.id, label: p.title}))} onChange={v => setFormData({...formData, propertyId: v})} onQuickAdd={() => setIsQuickAddOpen('property')} />
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="CONSTRUTORA" value={formData.constructionCompanyId} options={companies.map(c => ({id: c.id, label: c.name}))} onChange={v => setFormData({...formData, constructionCompanyId: v})} onQuickAdd={() => setIsQuickAddOpen('company')} />
              <SelectField label="CORRETOR" value={formData.brokerId} options={brokers.map(b => ({id: b.id, label: b.name}))} onChange={v => setFormData({...formData, brokerId: v})} onQuickAdd={() => setIsQuickAddOpen('broker')} />
            </div>
          </div>
        </div>
      );
      case 'company': return (
        <div className="space-y-6">
          <InputField label="RAZÃO SOCIAL" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="CNPJ" value={formData.cnpj} onChange={v => setFormData({...formData, cnpj: v})} />
          <div className="grid grid-cols-2 gap-4">
            <SmartCityInput label="CIDADE" value={formData.city} ufValue={formData.state} onSelect={(c, u) => setFormData({...formData, city: c, state: u})} />
            <InputField label="UF" value={formData.state} onChange={v => setFormData({...formData, state: v})} />
          </div>
          <InputField label="ENDEREÇO" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
        </div>
      );
      case 'property': return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TIPO</label>
              <select className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold uppercase bg-white outline-none focus:ring-2 focus:ring-[#8B0000]" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value.toUpperCase()})}>
                {PROPERTY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>
            <InputField label="VALOR VENDA (R$)" type="number" value={formData.value} onChange={v => setFormData({...formData, value: Number(v)})} />
          </div>
          <SelectField label="CONSTRUTORA" value={formData.constructionCompanyId} options={companies.map(c => ({id: c.id, label: c.name}))} onChange={v => setFormData({...formData, constructionCompanyId: v})} onQuickAdd={() => setIsQuickAddOpen('company')} />
          <InputField label="ENDEREÇO" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
          <div className="grid grid-cols-3 gap-3">
            <InputField label="BAIRRO" value={formData.neighborhood} onChange={v => setFormData({...formData, neighborhood: v})} />
            <div className="col-span-1">
              <SmartCityInput label="CIDADE" value={formData.city} ufValue={formData.state} onSelect={(c, u) => setFormData({...formData, city: c, state: u})} />
            </div>
            <InputField label="UF" value={formData.state} onChange={v => setFormData({...formData, state: v})} />
          </div>
          <PhotoUploader photos={formData.photos || []} onUpdate={photos => setFormData({...formData, photos})} />
        </div>
      );
      case 'bank': return (
        <div className="space-y-6">
          <InputField label="NOME DO BANCO" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="AGÊNCIA" value={formData.agency} onChange={v => setFormData({...formData, agency: v})} />
          <InputField label="URL LOGO" value={formData.logo} onChange={v => setFormData({...formData, logo: v})} />
          <InputField label="EMAIL GERÊNCIA" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1">GESTÃO SAP CLOUD</h3>
           <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{title}</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              type="text" 
              placeholder={`FILTRAR...`} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} 
              className="pl-12 pr-6 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8B0000] w-full md:w-80 bg-white text-gray-900 font-bold uppercase shadow-sm" 
            />
          </div>
          <button onClick={() => handleOpenModal()} className="bg-[#8B0000] text-white px-8 py-3.5 rounded-2xl flex items-center justify-center space-x-3 font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
            <Plus size={18} /><span>NOVO {title.slice(0, -1).toUpperCase()}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {title === 'Clientes' && ['NOME', 'CPF/CNPJ', 'TELEFONE', 'RENDA', 'STATUS'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}
              {title === 'Imóveis' && ['DESCRIÇÃO', 'TIPO', 'VALOR', 'LOCALIZAÇÃO'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}
              {title === 'Corretores' && ['NOME', 'CRECI', 'COMISSÃO (%)', 'TELEFONE'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}
              {title === 'Bancos' && ['LOGO', 'BANCO', 'AGÊNCIA', 'TELEFONE'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}
              {title === 'Construtoras' && ['NOME', 'CNPJ', 'LOCALIDADE', 'CONTATO'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredData.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors text-sm group">
                {title === 'Clientes' && (
                  <>
                    <td className="px-8 py-5 font-bold uppercase">{item.name}</td>
                    <td className="px-8 py-5 uppercase text-gray-500">{item.taxId}</td>
                    <td className="px-8 py-5 uppercase text-gray-500">{item.phone}</td>
                    <td className="px-8 py-5 font-bold">{formatCurrency(item.income)}</td>
                    <td className="px-8 py-5"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{item.status}</span></td>
                  </>
                )}
                {title === 'Imóveis' && (
                  <>
                    <td className="px-8 py-5 font-bold uppercase">{item.title}</td>
                    <td className="px-8 py-5 uppercase text-gray-500">{item.type}</td>
                    <td className="px-8 py-5 font-bold text-[#8B0000]">{formatCurrency(item.value)}</td>
                    <td className="px-8 py-5 uppercase text-gray-500">{item.city}/{item.state}</td>
                  </>
                )}
                <td className="px-8 py-5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-2">
                    <button onClick={() => handleOpenViewModal(item)} className="p-2 text-gray-400 hover:text-[#8B0000]"><Eye size={18} /></button>
                    <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-black"><Edit2 size={18} /></button>
                    {isAdmin && <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col my-8 overflow-hidden">
            <div className="bg-[#8B0000] px-10 py-8 flex items-center justify-between text-white">
              <div>
                 <h3 className="font-black uppercase tracking-widest text-sm">{editingItem ? 'EDITAR' : 'CADASTRAR'} {title.slice(0,-1).toUpperCase()}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {renderFormFields()}
                <div className="flex justify-end space-x-4 mt-8 pt-8 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-400 font-black uppercase text-[10px] tracking-widest">CANCELAR</button>
                  <button type="submit" disabled={loading} className="px-10 py-3 bg-[#8B0000] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                    {loading ? 'SALVANDO...' : 'SALVAR NO FIRESTORE'}
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
          onSave={(d: any) => {
             const dataWithUpper = Object.keys(d).reduce((acc: any, key) => {
                acc[key] = typeof d[key] === 'string' ? d[key].toUpperCase() : d[key];
                return acc;
             }, {});
             handleQuickAdd(isQuickAddOpen, dataWithUpper);
          }}
          companies={companies}
          municipiosIBGE={municipiosIBGE}
          SmartCityInput={SmartCityInput}
        />
      )}
    </div>
  );
};

const QuickAddModal = ({ type, onClose, onSave, companies, municipiosIBGE, SmartCityInput }: any) => {
  const [data, setData] = useState<any>({ type: "APARTAMENTO", photos: [], value: 0 });
  
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#1F1F1F] px-8 py-6 flex items-center justify-between text-white">
          <h3 className="font-black uppercase tracking-widest text-xs">CADASTRO RÁPIDO: {type.toUpperCase()}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {type === 'company' && (
            <>
              <InputField label="RAZÃO SOCIAL" value={data.name} onChange={(v: string) => setData({...data, name: v})} />
              <InputField label="CNPJ" value={data.cnpj} onChange={(v: string) => setData({...data, cnpj: v})} />
              <div className="grid grid-cols-2 gap-4">
                <SmartCityInput label="CIDADE" value={data.city} ufValue={data.state} onSelect={(c:any, u:any) => setData({...data, city: c, state: u})} />
                <InputField label="UF" value={data.state} onChange={(v: string) => setData({...data, state: v})} />
              </div>
            </>
          )}
          {type === 'property' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TIPO</label>
                    <select className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-bold uppercase bg-white" value={data.type} onChange={e => setData({...data, type: e.target.value.toUpperCase()})}>
                      {PROPERTY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                    </select>
                 </div>
                 <InputField label="VALOR (R$)" type="number" value={data.value} onChange={(v: number) => setData({...data, value: Number(v)})} />
              </div>
              <InputField label="ENDEREÇO" value={data.address} onChange={(v: string) => setData({...data, address: v})} />
              <div className="grid grid-cols-2 gap-4">
                <SmartCityInput label="CIDADE" value={data.city} ufValue={data.state} onSelect={(c:any, u:any) => setData({...data, city: c, state: u})} />
                <InputField label="UF" value={data.state} onChange={(v: string) => setData({...data, state: v})} />
              </div>
              <SelectField label="CONSTRUTORA" value={data.constructionCompanyId} options={companies?.map((c:any) => ({id: c.id, label: c.name})) || []} onChange={(v: string) => setData({...data, constructionCompanyId: v})} onQuickAdd={() => {}} />
            </>
          )}
        </div>
        <div className="p-8 border-t border-gray-100">
           <button onClick={() => onSave(data)} className="w-full py-4 bg-[#8B0000] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">SALVAR NO CLOUD</button>
        </div>
      </div>
    </div>
  );
};

const PhotoUploader = ({ photos, onUpdate }: any) => {
  const [url, setUrl] = useState('');
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FOTOS DO ATIVO</label>
      <div className="flex gap-2">
        <input type="text" placeholder="URL DA IMAGEM..." className="flex-1 border border-gray-200 rounded-xl p-3 text-sm font-bold uppercase outline-none" value={url} onChange={e => setUrl(e.target.value.toUpperCase())} />
        <button type="button" onClick={() => { if(url) { onUpdate([...photos, url]); setUrl(''); } }} className="bg-black text-white px-4 rounded-xl text-[10px] font-black uppercase">ADD</button>
      </div>
    </div>
  );
};

const DetailBlock = ({ label, value, className = "", valueClass = "text-lg" }: any) => (
  <div className={`space-y-1 ${className} uppercase`}>
    <label className="text-[10px] font-black text-gray-400 tracking-widest block">{label}</label>
    <p className={`text-gray-900 font-black tracking-tighter uppercase ${valueClass}`}>{value || '---'}</p>
  </div>
);

const InputField = ({ label, value, onChange, type = "text", step }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input 
      type={type} step={step} placeholder={`INFORME ${label}...`} 
      value={value || ''} 
      onChange={e => onChange(type === 'number' ? e.target.value : e.target.value.toUpperCase())} 
      className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8B0000] bg-white text-gray-900 uppercase shadow-sm"
      required={type !== 'number'}
    />
  </div>
);

const SelectField = ({ label, value, options, onChange, onQuickAdd }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="flex gap-2">
      <select value={value || ''} onChange={e => onChange(e.target.value)} className="flex-1 border border-gray-200 rounded-xl p-3.5 text-sm font-bold bg-white uppercase outline-none focus:ring-2 focus:ring-[#8B0000]">
        <option value="">SELECIONAR {label}...</option>
        {options.map((opt:any) => <option key={opt.id} value={opt.id}>{opt.label.toUpperCase()}</option>)}
      </select>
      <button type="button" onClick={onQuickAdd} className="p-3.5 bg-gray-50 text-[#8B0000] rounded-xl border border-gray-100"><Plus size={22} /></button>
    </div>
  </div>
);

export default GenericCrud;
