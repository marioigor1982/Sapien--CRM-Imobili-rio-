
import React, { useState, useRef } from 'react';
/* Added Briefcase to imports from lucide-react */
import { Plus, Edit2, Trash2, Search, X, Image as ImageIcon, Upload, Link as LinkIcon, Eye, MapPin, Building2, Tag, Landmark, Phone, Mail, Globe, Briefcase } from 'lucide-react';

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
      if (type === 'company') {
        defaults.name = '';
        defaults.cnpj = '';
        defaults.phone = '';
        defaults.email = '';
        defaults.address = '';
        defaults.neighborhood = '';
        defaults.city = '';
        defaults.state = '';
      }
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

  const handleAddPhotoUrl = () => {
    if (newPhotoUrl.trim()) {
      if (type === 'bank') {
        setFormData({ ...formData, logo: newPhotoUrl.trim() });
      } else {
        const currentPhotos = formData.photos || [];
        setFormData({ ...formData, photos: [...currentPhotos, newPhotoUrl.trim()] });
      }
      setNewPhotoUrl('');
    }
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

  const removePhoto = (index: number) => {
    const currentPhotos = [...(formData.photos || [])];
    currentPhotos.splice(index, 1);
    setFormData({ ...formData, photos: currentPhotos });
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
      case 'bank': return ['Logo', 'Banco', 'Agência', 'Telefone', 'Taxa Média'];
      case 'company': return ['Nome', 'CNPJ', 'Município', 'Telefone'];
      default: return [];
    }
  };

  const renderRow = (item: any) => {
    switch(type) {
      case 'client': return (
        <>
          <td className="px-6 py-4 font-semibold hover:text-[#8B0000] cursor-pointer" onClick={() => handleOpenViewModal(item)}>{item.name}</td>
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
          <td className="px-6 py-4 font-semibold hover:text-[#8B0000] cursor-pointer" onClick={() => handleOpenViewModal(item)}>{item.name}</td>
          <td className="px-6 py-4 text-gray-500">{item.creci}</td>
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
          <td className="px-6 py-4 font-bold text-[#8B0000]">R$ {Number(item.value).toLocaleString()}</td>
          <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{item.address}</td>
        </>
      );
      case 'bank': return (
        <>
          <td className="px-6 py-4">
            <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 p-1 flex items-center justify-center shadow-sm">
              {item.logo ? (
                <img src={item.logo} alt="" className="max-w-full max-h-full object-contain" />
              ) : (
                <Landmark size={18} className="text-gray-300" />
              )}
            </div>
          </td>
          <td className="px-6 py-4 font-semibold hover:text-[#8B0000] cursor-pointer" onClick={() => handleOpenViewModal(item)}>{item.name}</td>
          <td className="px-6 py-4 text-gray-500">{item.agency}</td>
          <td className="px-6 py-4 text-gray-500">{item.phone}</td>
          <td className="px-6 py-4 text-gray-900 font-bold">{item.avgRate}%</td>
        </>
      );
      case 'company': return (
        <>
          <td className="px-6 py-4 font-semibold hover:text-[#8B0000] cursor-pointer" onClick={() => handleOpenViewModal(item)}>{item.name}</td>
          <td className="px-6 py-4 text-gray-500">{item.cnpj}</td>
          <td className="px-6 py-4 text-gray-500">{item.city} / {item.state}</td>
          <td className="px-6 py-4 text-gray-500">{item.phone}</td>
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
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
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
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
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
            <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#8B0000] outline-none bg-white text-gray-900" value={formData.constructionCompanyId} onChange={e => setFormData({...formData, constructionCompanyId: e.target.value})}>
              <option value="">Selecione...</option>
              {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center"><ImageIcon size={14} className="mr-2" />Gestão de Fotos</label>
            <div className="flex flex-col space-y-3">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" placeholder="Colar URL..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#8B0000] bg-white text-gray-900" value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} />
                </div>
                <button type="button" onClick={handleAddPhotoUrl} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">Add</button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-[#8B0000]/10 text-[#8B0000] rounded-lg text-sm font-bold hover:bg-[#8B0000]/20 transition-colors flex items-center space-x-2"><Upload size={14} /><span>Upload</span></button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
              {formData.photos && formData.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {formData.photos.map((url: string, idx: number) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      );
      case 'bank': return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Nome do Banco" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
            <InputField label="Nº da Agência" value={formData.agency} onChange={v => setFormData({...formData, agency: v})} />
          </div>
          <InputField label="Endereço da Agência" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
          <div className="grid grid-cols-3 gap-4">
            <InputField label="Bairro" value={formData.neighborhood} onChange={v => setFormData({...formData, neighborhood: v})} />
            <InputField label="Município" value={formData.city} onChange={v => setFormData({...formData, city: v})} />
            <InputField label="UF" value={formData.state} onChange={v => setFormData({...formData, state: v})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Telefone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
            <InputField label="E-mail" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Taxa Média (%)" type="number" step="0.01" value={formData.avgRate} onChange={v => setFormData({...formData, avgRate: v})} />
            <InputField label="Nome do Contato" value={formData.contact} onChange={v => setFormData({...formData, contact: v})} />
          </div>
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center"><LinkIcon size={14} className="mr-2" />Logomarca</label>
            <div className="flex space-x-2">
              <input type="text" placeholder="URL da logo..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8B0000] outline-none" value={formData.logo || ''} onChange={e => setFormData({...formData, logo: e.target.value})} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold"><Upload size={14} /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
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
            <InputField label="E-mail" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
          </div>
          <InputField label="Endereço" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
          <div className="grid grid-cols-3 gap-4">
            <InputField label="Bairro" value={formData.neighborhood} onChange={v => setFormData({...formData, neighborhood: v})} />
            <InputField label="Município" value={formData.city} onChange={v => setFormData({...formData, city: v})} />
            <InputField label="UF" value={formData.state} onChange={v => setFormData({...formData, state: v})} />
          </div>
        </>
      );
    }
  };

  const renderViewDetails = () => {
    if (!viewingItem) return null;

    if (type === 'bank') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white border border-gray-100 rounded-2xl p-2 flex items-center justify-center shadow-md shrink-0">
              {viewingItem.logo ? <img src={viewingItem.logo} alt="" className="max-w-full max-h-full object-contain" /> : <Landmark size={40} className="text-gray-200" />}
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900">{viewingItem.name}</h4>
              <p className="text-sm text-gray-500">Agência: {viewingItem.agency}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailCard icon={<Phone size={18} />} label="Telefone" value={viewingItem.phone} />
            <DetailCard icon={<Mail size={18} />} label="E-mail" value={viewingItem.email} />
            <div className="col-span-2">
               <DetailCard icon={<MapPin size={18} />} label="Endereço Completo" value={`${viewingItem.address}, ${viewingItem.neighborhood}, ${viewingItem.city}/${viewingItem.state}`} />
            </div>
            <DetailCard icon={<Tag size={18} />} label="Taxa Média" value={`${viewingItem.avgRate}%`} />
            <DetailCard icon={<Briefcase size={18} />} label="Contato Responsável" value={viewingItem.contact} />
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
                      <button onClick={() => handleOpenModal(item)} className="p-1.5 text-gray-400 hover:text-gray-600