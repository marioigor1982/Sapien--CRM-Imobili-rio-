
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Image as ImageIcon, 
  Eye, Landmark, Building2, Wallet, Briefcase, Zap, Clock, Lock
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
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [municipiosIBGE, setMunicipiosIBGE] = useState<IBGEMunicipio[]>([]);

  useEffect(() => {
    const carregarMunicipios = async () => {
      try {
        const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios");
        const dados = await response.json();
        const formatados = dados.map((item: any) => ({
          municipio: item.nome.toUpperCase(),
          uf: item.microrregiao.mesorregiao.UF.sigla.toUpperCase()
        }));
        setMunicipiosIBGE(formatados);
      } catch (e) {
        console.error("ERRO AO CARREGAR IBGE:", e);
      }
    };
    carregarMunicipios();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toUpperCase();
    return data.filter(item => {
      const values = Object.values(item).join(' ').toUpperCase();
      return values.includes(term);
    });
  }, [data, searchTerm]);

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      let defaults: any = {};
      if (type === 'client') { 
        defaults = { name: '', taxId: '', phone: '', email: '', income: 0, status: 'Ativo' }; 
      }
      else if (type === 'broker') { 
        defaults = { name: '', creci: '', phone: '', email: '', commissionRate: 0 }; 
      }
      else if (type === 'bank') { 
        defaults = { name: '', agency: '', city: '', state: '', logo: '' }; 
      }
      else if (type === 'company') { 
        defaults = { name: '', cnpj: '', city: '', state: '', address: '', neighborhood: '', phone: '', email: '' }; 
      }
      else if (type === 'property') { 
        defaults = { 
          title: '', value: 0, photos: [], type: "APARTAMENTO", 
          state: "", city: "", neighborhood: "", address: "", constructionCompanyId: "" 
        }; 
      }
      setFormData(defaults);
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Preparação e limpeza rigorosa dos dados
    let finalData: any = {};
    Object.keys(formData).forEach(key => {
      let val = formData[key];
      
      // Ignorar campos vazios ou indefinidos para evitar erro 400
      if (val === undefined || val === null) return;
      
      // Forçar Uppercase em strings (exceto e-mails)
      if (typeof val === 'string' && !key.toLowerCase().includes('email')) {
        finalData[key] = val.toUpperCase();
      } else {
        finalData[key] = val;
      }
    });

    // Se estiver editando, garantir que o ID está presente no objeto final para o serviço
    if (editingItem?.id) {
        finalData.id = editingItem.id;
    }

    try {
      if (onSave) {
        await onSave(finalData);
        setIsModalOpen(false);
      }
    } catch (err: any) {
      console.error("FALHA AO SALVAR NO CLOUD:", err);
      alert(`FALHA NA OPERAÇÃO CLOUD: ${err.message || 'Verifique sua conexão ou se o ID é válido.'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const SmartCityInput = ({ cityValue, ufValue, onSelect, label }: { cityValue: string, ufValue: string, onSelect: (city: string, uf: string) => void, label: string }) => {
    const [search, setSearch] = useState(cityValue || '');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setSearch(cityValue || '');
    }, [cityValue]);

    const filtered = useMemo(() => {
      if (search.length < 2) return [];
      const term = search.toUpperCase();
      return municipiosIBGE.filter(m => m.municipio.includes(term)).slice(0, 15);
    }, [search, municipiosIBGE]);

    return (
      <div className="space-y-1.5 relative col-span-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
        <div className="relative">
          <input 
            type="text" 
            placeholder={`DIGITE A ${label}...`}
            value={search} 
            onInput={e => {
              const val = (e.target as HTMLInputElement).value.toUpperCase();
              setSearch(val);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-[#ea2a33] bg-white text-gray-900 shadow-sm"
          />
          {isOpen && filtered.length > 0 && (
            <ul className="lista-municipios">
              {filtered.map((item, idx) => (
                <li 
                  key={idx} 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(item.municipio, item.uf);
                    setSearch(item.municipio);
                    setIsOpen(false);
                  }}
                >
                  {item.municipio} ({item.uf})
                </li>
              ))}
            </ul>
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
            <InputField label="COMISSÃO (%)" type="number" step="0.1" value={formData.commissionRate} onChange={v => setFormData({...formData, commissionRate: v})} />
          </div>
          <InputField label="TELEFONE" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
          <InputField label="EMAIL" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
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
          <InputField label="RENDA MENSAL" type="number" value={formData.income} onChange={v => setFormData({...formData, income: v})} />
        </div>
      );
      case 'company': return (
        <div className="space-y-6">
          <InputField label="RAZÃO SOCIAL" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="CNPJ" value={formData.cnpj} onChange={v => setFormData({...formData, cnpj: v})} />
          <div className="grid grid-cols-3 gap-4">
            <SmartCityInput cityValue={formData.city} ufValue={formData.state} onSelect={(c, u) => setFormData({...formData, city: c, state: u})} label="CIDADE" />
            <InputField label="UF" value={formData.state} onChange={v => setFormData({...formData, state: v})} />
          </div>
          <InputField label="ENDEREÇO" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
        </div>
      );
      case 'property': return (
        <div className="space-y-6">
          <InputField label="TÍTULO DO ANÚNCIO" value={formData.title} onChange={v => setFormData({...formData, title: v})} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TIPO</label>
              <select className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold uppercase bg-white outline-none focus:ring-2 focus:ring-[#ea2a33]" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value.toUpperCase()})}>
                {PROPERTY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>
            <InputField label="VALOR VENDA (R$)" type="number" value={formData.value} onChange={v => setFormData({...formData, value: v})} />
          </div>
          <InputField label="ENDEREÇO" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
          <div className="grid grid-cols-4 gap-3">
            <InputField label="BAIRRO" value={formData.neighborhood} onChange={v => setFormData({...formData, neighborhood: v})} />
            <SmartCityInput cityValue={formData.city} ufValue={formData.state} onSelect={(c, u) => setFormData({...formData, city: c, state: u})} label="CIDADE" />
            <InputField label="UF" value={formData.state} onChange={v => setFormData({...formData, state: v})} />
          </div>
        </div>
      );
      case 'bank': return (
        <div className="space-y-6">
          <InputField label="RAZÃO BANCÁRIA" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="AGÊNCIA" value={formData.agency} onChange={v => setFormData({...formData, agency: v})} />
          <div className="grid grid-cols-3 gap-4">
            <SmartCityInput cityValue={formData.city} ufValue={formData.state} onSelect={(c, u) => setFormData({...formData, city: c, state: u})} label="CIDADE" />
            <InputField label="UF" value={formData.state} onChange={v => setFormData({...formData, state: v})} />
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1">MÓDULO DE GESTÃO SAP CLOUD</h3>
           <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{title}</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              type="text" 
              placeholder={`FILTRAR ${title.toUpperCase()}...`} 
              value={searchTerm} 
              onInput={e => setSearchTerm((e.target as HTMLInputElement).value.toUpperCase())}
              className="pl-12 pr-6 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ea2a33] w-full md:w-80 bg-white text-gray-900 font-bold uppercase shadow-sm" 
            />
          </div>
          <button onClick={() => handleOpenModal()} className="bg-[#ea2a33] text-white px-8 py-3.5 rounded-2xl flex items-center justify-center space-x-3 font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
            <Plus size={18} /><span>NOVO {title.slice(0, -1).toUpperCase()}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {title === 'Clientes' && ['NOME', 'CPF/CNPJ', 'TELEFONE', 'RENDA'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}
              {title === 'Imóveis' && ['DESCRIÇÃO', 'TIPO', 'VALOR', 'LOCALIZAÇÃO'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}
              {title === 'Corretores' && ['NOME', 'CRECI', 'COMISSÃO (%)', 'TELEFONE'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}
              {title === 'Bancos' && ['BANCO', 'AGÊNCIA', 'CIDADE', 'UF'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}
              {title === 'Construtoras' && ['NOME', 'CNPJ', 'MUNICÍPIO', 'UF'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}
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
                  </>
                )}
                {title === 'Imóveis' && (
                  <>
                    <td className="px-8 py-5 font-bold uppercase">{item.title}</td>
                    <td className="px-8 py-5 uppercase text-gray-500">{item.type}</td>
                    <td className="px-8 py-5 font-bold text-[#ea2a33]">{formatCurrency(item.value)}</td>
                    <td className="px-8 py-5 uppercase text-gray-500">{item.city}/{item.state}</td>
                  </>
                )}
                {title === 'Bancos' && (
                  <>
                    <td className="px-8 py-5 font-bold uppercase">{item.name}</td>
                    <td className="px-8 py-5 uppercase text-gray-500">{item.agency}</td>
                    <td className="px-8 py-5 uppercase text-gray-500">{item.city}</td>
                    <td className="px-8 py-5 font-bold text-[#ea2a33]">{item.state}</td>
                  </>
                )}
                {title === 'Construtoras' && (
                  <>
                    <td className="px-8 py-5 font-bold uppercase">{item.name}</td>
                    <td className="px-8 py-5 uppercase text-gray-500">{item.cnpj}</td>
                    <td className="px-8 py-5 uppercase text-gray-500">{item.city}</td>
                    <td className="px-8 py-5 font-bold text-[#ea2a33]">{item.state}</td>
                  </>
                )}
                <td className="px-8 py-5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-2">
                    <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-black transition-colors"><Edit2 size={18} /></button>
                    {isAdmin && <button onClick={() => onDelete && onDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>}
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
            <div className="bg-[#ea2a33] px-10 py-8 flex items-center justify-between text-white">
              <h3 className="font-black uppercase tracking-widest text-sm">{editingItem ? 'EDITAR' : 'CADASTRAR'} {title.slice(0,-1).toUpperCase()}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {renderFormFields()}
                <div className="flex justify-end space-x-4 mt-8 pt-8 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-400 font-black uppercase text-[10px] tracking-widest">CANCELAR</button>
                  <button type="submit" disabled={loading} className="px-10 py-3 bg-[#ea2a33] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                    {loading ? 'PROCESSANDO...' : 'SALVAR NO FIRESTORE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InputField = ({ label, value, onChange, type = "text", step }: any) => (
  <div className="space-y-1.5 flex-1">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input 
      type={type} step={step} placeholder={`DIGITE ${label}...`} 
      value={value === 0 ? 0 : (value || '')} 
      onInput={e => {
        const el = e.target as HTMLInputElement;
        let val: string | number = el.value;
        if (type !== 'email') {
          val = val.toUpperCase();
          el.value = val;
        }
        onChange(type === 'number' ? (val === '' ? 0 : Number(val)) : val);
      }}
      className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#ea2a33] bg-white text-gray-900 uppercase shadow-sm"
      required={type !== 'number'}
    />
  </div>
);

export default GenericCrud;
