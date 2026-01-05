
import React from 'react';
import { LayoutDashboard, Trello, List, Users, Briefcase, Home, Landmark, Building2 } from 'lucide-react';
// Added LeadStatus to imports and fixed LeadPhase references
import { Client, Broker, Property, Bank, ConstructionCompany, Lead, LeadPhase, LeadStatus } from './types';

export const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'João Silva', taxId: '123.456.789-00', phone: '(11) 98888-7777', email: 'joao@email.com', income: 8500, status: 'Ativo' },
  { id: 'c2', name: 'Maria Santos', taxId: '987.654.321-11', phone: '(11) 97777-6666', email: 'maria@email.com', income: 12000, status: 'Ativo' },
];

export const INITIAL_BROKERS: Broker[] = [
  { id: 'br1', name: 'Ricardo Corretor', creci: '12345-F', phone: '(11) 91234-5678', email: 'ricardo@sapien.com', commissionRate: 1.5 },
];

export const INITIAL_COMPANIES: ConstructionCompany[] = [
  { 
    id: 'co1', 
    name: 'Gafisa', 
    cnpj: '01.234.567/0001-99', 
    phone: '(11) 3000-0000', 
    email: 'contato@gafisa.com.br',
    address: 'Av. Nações Unidas, 12901',
    neighborhood: 'Brooklin',
    city: 'São Paulo',
    state: 'SP'
  },
];

export const INITIAL_PROPERTIES: Property[] = [
  { 
    id: 'p1', 
    title: 'Apartamento Jardim Paulista São Paulo SP', 
    type: 'Apartamento', 
    value: 450000, 
    address: 'Rua das Flores, 123', 
    neighborhood: 'Jardim Paulista',
    city: 'São Paulo',
    state: 'SP',
    photos: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=400'], 
    constructionCompanyId: 'co1' 
  },
];

export const INITIAL_BANKS: Bank[] = [
  { 
    id: 'b1', 
    name: 'Caixa Econômica', 
    agency: '1234',
    address: 'Av. Paulista, 100',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 4004-0104',
    email: 'agencia1234@caixa.gov.br',
    contact: 'Gerente João',
    logo: 'https://images.seeklogo.com/logo-png/2/1/caixa-economica-federal-logo-png_seeklogo-24768.png'
  },
  { 
    id: 'b2', 
    name: 'Itaú', 
    agency: '0567',
    address: 'Rua Faria Lima, 3500',
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 4004-4828',
    email: 'atendimento@itau.com.br',
    contact: 'Gerente Maria',
    logo: 'https://images.seeklogo.com/logo-png/51/1/itau-logo-png_seeklogo-512719.png'
  },
];

export const INITIAL_LEADS: Lead[] = [
  { 
    id: 'l1', 
    clientId: 'c1', 
    brokerId: 'br1', 
    propertyId: 'p1', 
    bankId: 'b1', 
    constructionCompanyId: 'co1', 
    // Fixed ABERTURA_CREDITO to SIMULACAO_COLETA
    currentPhase: LeadPhase.SIMULACAO_COLETA, 
    status: LeadStatus.EM_ANDAMENTO,
    createdAt: new Date().toISOString(),
    // Fixed history object property names and added missing status
    history: [{ phase: LeadPhase.SIMULACAO_COLETA, startDate: new Date().toISOString(), status: LeadStatus.EM_ANDAMENTO }]
  }
];

export const MENU_ITEMS = [
  { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'Kanban', label: 'Pipeline (Kanban)', icon: <Trello size={20} /> },
  { id: 'List', label: 'Lista de Leads', icon: <List size={20} /> },
  { type: 'divider' },
  { id: 'Clientes', label: 'Clientes', icon: <Users size={20} /> },
  { id: 'Corretores', label: 'Corretores', icon: <Briefcase size={20} /> },
  { id: 'Properties', label: 'Imóveis', icon: <Home size={20} /> },
  { id: 'Bancos', label: 'Bancos', icon: <Landmark size={20} /> },
  { id: 'Construtoras', label: 'Construtoras', icon: <Building2 size={20} /> },
];
