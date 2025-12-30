
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

interface GenericCrudProps {
  title: string;
  data: any[];
  setData: (data: any[]) => void;
  type: 'client' | 'broker' | 'property' | 'bank' | 'company';
  companies?: any[];
}

const GenericCrud: React.FC<GenericCrudProps> = ({ title, data, setData, type, companies }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      setData(data.filter(item => item.id !== id));
    }
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      // Initialize with default values
      const defaults: any = { id: Math.random().toString(36).substr(2, 9) };
      if (type === 'client') { defaults.status = 'Ativo'; defaults.income = 0; }
      if (type === 'bank') { defaults.avgRate = 0; }
      if (type === 'property') { defaults.value = 0; defaults.photos = []; }
      setFormData(defaults);
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setData(data.map(item => item.id === editingItem.id ? formData : item));
    } else {
      setData([...data, formData]);
    }
    setIsModalOpen(false);
  };

  const filteredData = data.filter(item => {
    const values = Object.values(item).join(' ').toLowerCase();
    return values.includes(searchTerm.toLowerCase());
  });

  const getTableHeaders = () => {
    switch(type) {
      case 'client': return ['Nome', 'Documento', 'Telefone', 'Email', 'Renda', 'Status'];
      case 'broker': return ['Nome', 'CRECI', 'Telefone', 'Email'];
      case 'property': return ['Título', 'Tipo', 'Valor', 'Endereço'];
      case 'bank': return ['Banco', 'Taxa Média', 'Contato'];
      case 'company': return ['Nome', 'CNPJ', 'Contato'];
      default: return [];
    }
  };

  const renderRow = (item: any) => {
    switch(type) {
      case 'client': return (
        <>
          <td className="px-6 py-4 font-semibold">{item.name}</td>
          <td className="px-6 py-4 text-gray-500">{item.taxId}</td>
          <td className="px-6 py-4 text-gray-500">{item.phone}</td>
          <td className="px-6 py-4 text-gray-500">{item.email}</td>
          <td className="px-6 py-4 text-gray-900 font-bold">R$ {Number(item.income).toLocaleString()}</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {item.status}
            </span>
          </td>
        </>
      );
      case 'broker': return (
        <>
          <td className="px-6 py-4 font-semibold">{item.name}</td>
          <td className="px-6 py-4 text-gray-500">{item.creci}</td>
          <td className="px-6 py-4 text-gray-500">{item.phone}</td>
          <td className="px-6 py-4 text-gray-500">{item.email}</td>
        </>
      );
      case 'property': return (
        <>
          <td className="px-6 py-4 font-semibold">{item.title}</td>
          <td className="px-6 py-4 text-gray-500">{item.type}</td>
          <td className="px-6 py-4 font-bold text-[#8B0000]">R$ {Number(item.value).toLocaleString()}</td>
          <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{item.address}</td>
        </>
      );
      case 'bank': return (
        <>
          <td className="px-6 py-4 font-semibold">{item.name}</td>
          <td className="px-6 py-4 text-gray-900 font-bold">{item.avgRate}%</td>
          <td className="px-6 py-4 text-gray-500">{item.contact}</td>
        </>
      );
      case 'company': return (
        <>
          <td className="px-6 py-4 font-semibold">{item.name}</td>
          <td className="px-6 py-4 text-gray-500">{item.cnpj}</td>
          <td className="px-6 py-4 text-gray-500">{item.contact}</td>
        </>
      );
    }
  };

  const renderFormFields = () => {
    switch(type) {
      case 'client': return (
        <>
          <InputField label="Nome Completo" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="CPF / CNPJ" value={formData.taxId} onChange={v => setFormData({...formData, taxId: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Telefone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
            <InputField label="Email" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Renda (Mensal)" type="number" value={formData.income} onChange={v => setFormData({...formData, income: v})} />
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
        </>
      );
      case 'broker': return (
        <>
          <InputField label="Nome do Corretor" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="CRECI" value={formData.creci} onChange={v => setFormData({...formData, creci: v})} />
          <InputField label="Telefone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
          <InputField label="Email Profissional" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
        </>
      );
      case 'property': return (
        <>
          <InputField label="Título do Imóvel" value={formData.title} onChange={v => setFormData({...formData, title: v})} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Terreno">Terreno</option>
              </select>
            </div>
            <InputField label="Valor (R$)" type="number" value={formData.value} onChange={v => setFormData({...formData, value: v})} />
          </div>
          <InputField label="Endereço Completo" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Construtora</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none"
              value={formData.constructionCompanyId}
              onChange={e => setFormData({...formData, constructionCompanyId: e.target.value})}
            >
              <option value="">Selecione...</option>
              {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </>
      );
      case 'bank': return (
        <>
          <InputField label="Nome do Banco" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="Taxa Média (%)" type="number" step="0.01" value={formData.avgRate} onChange={v => setFormData({...formData, avgRate: v})} />
          <InputField label="Contato / Gerente" value={formData.contact} onChange={v => setFormData({...formData, contact: v})} />
        </>
      );
      case 'company': return (
        <>
          <InputField label="Razão Social / Nome" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <InputField label="CNPJ" value={formData.cnpj} onChange={v => setFormData({...formData, cnpj: v})} />
          <InputField label="Email / Telefone de Contato" value={formData.contact} onChange={v => setFormData({...formData, contact: v})} />
        </>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={`Buscar em ${title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000] w-full md:w-80"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#8B0000] text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 font-bold shadow-md hover:bg-[#6b0000] transition-colors"
        >
          <Plus size={18} />
          <span>Cadastrar {title.slice(0, -1)}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {getTableHeaders().map((h, idx) => (
                  <th key={idx} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                  {renderRow(item)}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredData.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-400">Nenhum registro encontrado.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#8B0000] px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold uppercase tracking-widest text-sm">{editingItem ? 'Editar' : 'Cadastrar'} {title.slice(0, -1)}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {renderFormFields()}
              <div className="flex justify-end space-x-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-[#8B0000] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#6b0000] transition-colors"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InputField: React.FC<{ label: string; value: any; onChange: (v: string) => void; type?: string; step?: string }> = ({ label, value, onChange, type = "text", step }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
    <input 
      type={type} 
      step={step}
      value={value || ''} 
      onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none"
    />
  </div>
);

export default GenericCrud;
