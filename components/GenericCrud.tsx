
import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Image as ImageIcon, 
  Eye, MapPin, Landmark, Briefcase, CheckCircle, Clock
} from 'lucide-react';
import { LeadPhase } from '../types';

interface GenericCrudProps {
  title: string;
  data: any[];
  setData: (data: any[]) => void; // Standardized for Firestore sync
  type: 'client' | 'broker' | 'property' | 'bank' | 'company';
  onSave?: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const GenericCrud: React.FC<GenericCrudProps> = ({ title, data, type, onSave, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const leads = useMemo(() => {
    const saved = localStorage.getItem('sapien_leads');
    return saved ? JSON.parse(saved) : [];
  }, [isViewModalOpen, isModalOpen]);

  const properties = useMemo(() => {
    const saved = localStorage.getItem('sapien_properties');
    return saved ? JSON.parse(saved) : [];
  }, [isViewModalOpen, isModalOpen]);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
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
      if (type === 'bank') { defaults.avgRate = 0; }
      if (type === 'property') { defaults.value = 0; defaults.photos = []; }
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
    if (onSave) {
      await onSave(formData);
      setIsModalOpen(false);
    }
  };

  const filteredData = data.filter(item => {
    const values = Object.values(item).join(' ').toLowerCase();
    return values.includes(searchTerm.toLowerCase());
  });

  const getTableHeaders = () => {
    switch(type) {
      case 'client': return ['Nome', 'Documento', 'Telefone', 'Email', 'Renda', 'Status'];
      case 'broker': return ['Nome', 'CRECI', 'Comissão (%)', 'Telefone', 'Email'];
      case 'property': return ['Título', 'Tipo', 'Valor', 'Endereço'];
      case 'bank': return ['Logo', 'Banco', 'Agência', 'Telefone', 'Taxa Média'];
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
      case 'broker': return (
        <>
          <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap hover:text-[#8B0000] cursor-pointer" onClick={() => handleOpenViewModal(item)}>{item.name}</td>
          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.creci}</td>
          <td className="px-6 py-4 text-gray-900 font-bold text-center whitespace-nowrap">{item.commissionRate}%</td>
          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.phone}</td>
          <td className="px-6 py-4 text-gray-500">{item.email}</td>
        </>
      );
      case 'property': return (
        <>
          <td className="px-6 py-4 font-bold whitespace-nowrap">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => handleOpenViewModal(item)}>
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                {item.photos?.[0] ? <img src={item.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={16} /></div>}
              </div>
              <span className="group-hover:text-[#8B0000] transition-colors">{item.title}</span>
            </div>
          </td>
          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{item.type}</td>
          <td className="px-6 py-4 font-bold text-[#8B0000] whitespace-nowrap">{formatCurrency(Number(item.value))}</td>
          <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{item.address}</td>
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
          <td className="px-6 py-4 text-gray-900 font-bold whitespace-nowrap">{item.avgRate}%</td>
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
        <>
          <InputField label="Título do Imóvel" value={formData.title} onChange={v => setFormData({...formData, title: v})} />
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase">Tipo</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Terreno">Terreno</option>
              </select>
            </div>
            <InputField label="Valor Venda (R$)" type="number" value={formData.value} onChange={v => setFormData({...formData, value: Number(v)})} />
          </div>
          <InputField label="Endereço" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
        </>
      );
      case 'bank': return (
        <>
          <InputField label="Nome do Banco" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Agência" value={formData.agency} onChange={v => setFormData({...formData, agency: v})} />
            <InputField label="Taxa Média (%)" type="number" step="0.01" value={formData.avgRate} onChange={v => setFormData({...formData, avgRate: Number(v)})} />
          </div>
          <InputField label="Telefone Contato" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
          <InputField label="E-mail" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
        </>
      );
      default: return null;
    }
  };

  const renderViewDetails = () => {
    if (!viewingItem) return null;

    if (type === 'broker') {
      const brokerLeads = leads.filter((l: any) => l.brokerId === viewingItem.id);
      const recebidosLeads = brokerLeads.filter((l: any) => l.currentPhase === LeadPhase.ASSINATURA_CONTRATO);
      const aReceberLeads = brokerLeads.filter((l: any) => 
        l.currentPhase !== LeadPhase.ABERTURA_CREDITO && l.currentPhase !== LeadPhase.ASSINATURA_CONTRATO
      );

      const calculateComission = (leadsList: any[]) => leadsList.reduce((acc, l) => {
        const prop = properties.find((p: any) => p.id === l.propertyId);
        return acc + ((prop?.value || 0) * (viewingItem.commissionRate / 100));
      }, 0);

      const valAReceber = calculateComission(aReceberLeads);
      const valRecebidos = calculateComission(recebidosLeads);

      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-[#8B0000] rounded-full flex items-center justify-center text-white text-xl font-bold">
              {viewingItem.name.substring(0,2).toUpperCase()}
            </div>
            <div>
              <h4 className="text-2xl font-black text-gray-900">{viewingItem.name}</h4>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">CRECI: {viewingItem.creci} • {viewingItem.commissionRate}% Com.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-green-600 block mb-1">Recebidos</span>
              <p className="text-xl font-black text-green-900">{formatCurrency(valRecebidos)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block mb-1">A Receber</span>
              <p className="text-xl font-black text-blue-900">{formatCurrency(valAReceber)}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {Object.entries(viewingItem).map(([key, value]) => (
          key !== 'id' && key !== 'photos' && key !== 'logo' && (
            <div key={key} className="border-b border-gray-50 pb-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{key}</label>
              <p className="text-gray-900 font-medium">{String(value)}</p>
            </div>
          )
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder={`Buscar...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000] w-full md:w-80 bg-white text-gray-900" />
        </div>
        <button onClick={() => handleOpenModal()} className="bg-[#8B0000] text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 font-bold shadow-md hover:bg-[#6b0000] transition-colors"><Plus size={18} /><span>Novo Cadastro</span></button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {getTableHeaders().map((h, idx) => (
                  <th key={idx} className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">{h}</th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Ações</th>
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden">
            <div className="bg-[#8B0000] px-6 py-4 flex items-center justify-between text-white sticky top-0 z-10">
              <h3 className="font-bold uppercase tracking-widest text-sm">{editingItem ? 'Editar' : 'Cadastrar'} {title}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {renderFormFields()}
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-500 font-bold">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-[#8B0000] text-white rounded-lg font-bold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-300">
             <div className="p-6">
                <div className="flex justify-end mb-2">
                   <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
                </div>
                {renderViewDetails()}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InputField: React.FC<{ label: string; value: any; onChange: (v: string) => void; type?: string; step?: string }> = ({ label, value, onChange, type = "text", step }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-gray-700 uppercase">{label}</label>
    <input 
      type={type} 
      step={step} 
      placeholder="Digite aqui..."
      value={value || ''} 
      onChange={e => onChange(e.target.value)} 
      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900 placeholder:text-gray-400" 
    />
  </div>
);

export default GenericCrud;
