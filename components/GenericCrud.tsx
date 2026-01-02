
import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Image as ImageIcon, 
  Upload, Link as LinkIcon, Eye, MapPin, Building2, 
  Tag, Landmark, Phone, Mail, Globe, Briefcase, DollarSign, CheckCircle, Clock
} from 'lucide-react';
import { LeadPhase } from '../types';

interface GenericCrudProps {
  title: string;
  data: any[];
  setData: React.Dispatch<React.SetStateAction<any[]>>;
  type: 'client' | 'broker' | 'property' | 'bank' | 'company';
  companies?: any[];
}

const GenericCrud: React.FC<GenericCrudProps> = ({ title, data, setData, type, companies }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulation of leads for commission calculation
  const leads = useMemo(() => {
    const saved = localStorage.getItem('sapien_leads');
    return saved ? JSON.parse(saved) : [];
  }, [isViewModalOpen]);

  const properties = useMemo(() => {
    const saved = localStorage.getItem('sapien_properties');
    return saved ? JSON.parse(saved) : [];
  }, [isViewModalOpen]);

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro permanentemente?')) {
      setData(prev => prev.filter(item => item.id !== id));
      if (viewingItem?.id === id) setIsViewModalOpen(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      const defaults: any = { id: Math.random().toString(36).substr(2, 9) };
      if (type === 'client') { defaults.status = 'Ativo'; defaults.income = 0; }
      if (type === 'broker') { defaults.commissionRate = 0; }
      if (type === 'bank') { 
        defaults.avgRate = 0; 
        defaults.logo = ''; 
        defaults.agency = '';
        defaults.address = '';
        defaults.neighborhood = '';
        defaults.city = '';
        defaults.state = '';
        defaults.phone = '';
        defaults.email = '';
      }
      if (type === 'property') { defaults.value = 0; defaults.photos = []; }
      setFormData(defaults);
    }
    setNewPhotoUrl('');
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (item: any) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setData(prev => prev.map(item => item.id === editingItem.id ? formData : item));
    } else {
      setData(prev => [...prev, formData]);
    }
    setIsModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'bank') {
          setFormData({ ...formData, logo: base64String });
        } else {
          const currentPhotos = formData.photos || [];
          setFormData({ ...formData, photos: [...currentPhotos, base64String] });
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          <td className="px-6 py-4 font-semibold hover:text-[#8B0000] cursor-pointer" onClick={() => handleOpenViewModal(item)}>{item.name}</td>
          <td className="px-6 py-4 text-gray-500">{item.taxId}</td>
          <td className="px-6 py-4 text-gray-500">{item.phone}</td>
          <td className="px-6 py-4 text-gray-500">{item.email}</td>
          <td className="px-6 py-4 text-gray-900 font-bold">{formatCurrency(Number(item.income))}</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {item.status}
            </span>
          </td>
        </>
      );
      case 'broker': return (
        <>
          <td className="px-6 py-4 font-semibold hover:text-[#8B0000] cursor-pointer" onClick={() => handleOpenViewModal(item)}>{item.name}</td>
          <td className="px-6 py-4 text-gray-500">{item.creci}</td>
          <td className="px-6 py-4 text-gray-900 font-bold">{item.commissionRate}%</td>
          <td className="px-6 py-4 text-gray-500">{item.phone}</td>
          <td className="px-6 py-4 text-gray-500">{item.email}</td>
        </>
      );
      case 'property': return (
        <>
          <td className="px-6 py-4 font-semibold">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => handleOpenViewModal(item)}>
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                {item.photos?.[0] ? (
                  <img src={item.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={16} /></div>
                )}
              </div>
              <span className="group-hover:text-[#8B0000] transition-colors">{item.title}</span>
            </div>
          </td>
          <td className="px-6 py-4 text-gray-500">{item.type}</td>
          <td className="px-6 py-4 font-bold text-[#8B0000]">{formatCurrency(Number(item.value))}</td>
          <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{item.address}</td>
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
      default: return null;
    }
  };

  const renderViewDetails = () => {
    if (!viewingItem) return null;

    if (type === 'broker') {
      const brokerLeads = leads.filter((l: any) => l.brokerId === viewingItem.id);
      
      const aReceberLeads = brokerLeads.filter((l: any) => 
        l.currentPhase !== LeadPhase.ABERTURA_CREDITO && l.currentPhase !== LeadPhase.ASSINATURA_CONTRATO
      );
      
      const recebidosLeads = brokerLeads.filter((l: any) => 
        l.currentPhase === LeadPhase.ASSINATURA_CONTRATO
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
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">CRECI: {viewingItem.creci} • {viewingItem.commissionRate}% Comissionamento</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
              <div className="flex items-center text-green-600 mb-2">
                <CheckCircle size={16} className="mr-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">Recebidos (Finalizados)</span>
              </div>
              <p className="text-xl font-black text-green-900">{formatCurrency(valRecebidos)}</p>
              <p className="text-[10px] text-green-700 font-bold">{recebidosLeads.length} contratos assinados</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <div className="flex items-center text-blue-600 mb-2">
                <Clock size={16} className="mr-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">A Receber (Em Fluxo)</span>
              </div>
              <p className="text-xl font-black text-blue-900">{formatCurrency(valAReceber)}</p>
              <p className="text-[10px] text-blue-700 font-bold">{aReceberLeads.length} leads em aprovação</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Pipeline Ativo</h5>
            <div className="space-y-2">
              {brokerLeads.length > 0 ? brokerLeads.map((l: any) => {
                const prop = properties.find((p: any) => p.id === l.propertyId);
                return (
                  <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-900">{prop?.title || 'Lead s/ imóvel'}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-medium">{l.currentPhase}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-[#8B0000]">{formatCurrency((prop?.value || 0) * (viewingItem.commissionRate / 100))}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Comissão</p>
                    </div>
                  </div>
                );
              }) : <p className="text-xs text-gray-400 italic">Nenhum lead vinculado a este corretor.</p>}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#8B0000] px-6 py-4 flex items-center justify-between text-white sticky top-0 z-10">
              <h3 className="font-bold uppercase tracking-widest text-sm">{editingItem ? 'Editar' : 'Cadastrar'} {title.slice(0, -1)}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {renderFormFields()}
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-[#8B0000] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#6b0000] transition-colors">Salvar Registro</button>
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
             <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Sapien Intelligence OS</span>
                <button onClick={() => { setIsViewModalOpen(false); handleOpenModal(viewingItem); }} className="text-sm font-bold text-[#8B0000] hover:underline flex items-center"><Edit2 size={14} className="mr-2" />Editar</button>
             </div>
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
      placeholder="Digite aqui..."
      value={value || ''} 
      onChange={e => onChange(e.target.value)} 
      className="w-full border border-gray-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-[#1F1F1F] text-white placeholder:text-gray-500" 
    />
  </div>
);

const DetailCard: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
    <div className="text-[#8B0000] mb-2 opacity-80">{icon}</div>
    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</div>
    <div className="text-sm font-bold text-gray-900 truncate">{value || 'N/A'}</div>
  </div>
);

export default GenericCrud;
