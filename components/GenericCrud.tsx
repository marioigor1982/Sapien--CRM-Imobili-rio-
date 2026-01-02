
import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Image as ImageIcon, 
  Eye, Landmark, Upload, Link as LinkIcon
} from 'lucide-react';
import { LeadPhase } from '../types';

interface GenericCrudProps {
  title: string;
  data: any[];
  type: 'client' | 'broker' | 'property' | 'bank' | 'company';
  onSave?: (data: any) => Promise<any>;
  onDelete?: (id: string) => Promise<any>;
}

const PROPERTY_TYPES = [
  "Apart-hotel / Flat", "Apartamento", "Bangalô", "Casa de condomínio", 
  "Casa Geminada", "Casa Sobreposta", "Casa Térrea", "Chácara", 
  "Cobertura", "Duplex / Triplex", "Edícula", "Fazenda", 
  "Galpão / Depósito", "Giardino / Garden", "Kitnet", "Laje Corporativa", 
  "Loft", "Loja de Rua", "Lote / Terreno", "Mansão", 
  "Sala Comercial", "Sítio", "Sobrado", "Studio"
];

const GenericCrud: React.FC<GenericCrudProps> = ({ title, data, type, onSave, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState('');

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
      if (type === 'bank') { defaults.avgRate = 0; }
      if (type === 'property') { defaults.value = 0; defaults.photos = []; defaults.type = "Apartamento"; }
      setFormData(defaults);
    }
    setImgUrlInput('');
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (item: any) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (onSave) {
        await onSave(formData);
        setIsModalOpen(false);
      }
    } catch (err) {
      alert("Erro ao salvar no Firestore. Verifique as regras de segurança.");
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

  const filteredData = data.filter(item => {
    const values = Object.values(item).filter(v => typeof v === 'string' || typeof v === 'number').join(' ').toLowerCase();
    return values.includes(searchTerm.toLowerCase());
  });

  const getTableHeaders = () => {
    switch(type) {
      case 'client': return ['Nome', 'Documento', 'Telefone', 'Email', 'Renda', 'Status'];
      case 'broker': return ['Nome', 'CRECI', 'Comissão (%)', 'Telefone', 'Email'];
      case 'property': return ['Título', 'Tipo', 'Valor', 'Localização'];
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
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.3em]">Informações Gerais</h4>
            <InputField label="Título do Imóvel" value={formData.title} onChange={v => setFormData({...formData, title: v})} />
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
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.3em]">Localização</h4>
            <InputField label="Endereço Completo" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
            <div className="grid grid-cols-3 gap-3">
              <InputField label="Bairro" value={formData.neighborhood} onChange={v => setFormData({...formData, neighborhood: v})} />
              <InputField label="Município" value={formData.city} onChange={v => setFormData({...formData, city: v})} />
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
            <InputField label="Taxa Média (%)" type="number" step="0.01" value={formData.avgRate} onChange={v => setFormData({...formData, avgRate: Number(v)})} />
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

      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-300">
             <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                   <h4 className="text-[10px] font-black text-[#8B0000] uppercase tracking-[0.3em]">Detalhes do Registro Cloud</h4>
                   <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
                </div>
                
                {type === 'property' && viewingItem.photos && viewingItem.photos.length > 0 && (
                  <div className="mb-8 h-64 rounded-2xl overflow-hidden shadow-lg">
                    <img src={viewingItem.photos[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-h-[60vh] overflow-y-auto pr-4">
                  {Object.entries(viewingItem).map(([key, value]) => (
                    key !== 'id' && key !== 'photos' && key !== 'logo' && key !== 'createdAt' && key !== 'updatedAt' && value !== undefined && value !== '' && (
                      <div key={key} className="border-b border-gray-50 pb-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{key}</label>
                        <p className="text-gray-900 font-bold text-sm">
                          {key === 'value' ? formatCurrency(Number(value)) : String(value)}
                        </p>
                      </div>
                    )
                  ))}
                </div>

                {type === 'property' && viewingItem.photos && viewingItem.photos.length > 1 && (
                  <div className="mt-8">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Galeria de Fotos</label>
                    <div className="grid grid-cols-4 gap-2">
                       {viewingItem.photos.slice(1).map((p: string, i: number) => (
                         <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-100">
                           <img src={p} alt="" className="w-full h-full object-cover" />
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-end space-x-4">
                   <button 
                    onClick={() => { setIsViewModalOpen(false); handleOpenModal(viewingItem); }} 
                    className="text-xs font-black uppercase tracking-widest text-[#8B0000] flex items-center hover:underline"
                   >
                      <Edit2 size={14} className="mr-2" /> Editar Registro
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
      required={type !== 'file'}
    />
  </div>
);

export default GenericCrud;
