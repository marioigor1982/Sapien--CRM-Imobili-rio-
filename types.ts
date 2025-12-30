
export enum LeadPhase {
  ABERTURA_CREDITO = 'Abertura de Crédito',
  APROVACAO_CREDITO = 'Aprovação de Crédito',
  VISITA_IMOVEL = 'Visita ao Imóvel',
  ENGENHARIA = 'Engenharia',
  EMISSAO_CONTRATO = 'Emissão do Contrato',
  ASSINATURA_CONTRATO = 'Assinatura de Contrato'
}

export const PHASES_ORDER = [
  LeadPhase.ABERTURA_CREDITO,
  LeadPhase.APROVACAO_CREDITO,
  LeadPhase.VISITA_IMOVEL,
  LeadPhase.ENGENHARIA,
  LeadPhase.EMISSAO_CONTRATO,
  LeadPhase.ASSINATURA_CONTRATO
];

export interface Client {
  id: string;
  name: string;
  taxId: string; // CPF/CNPJ
  phone: string;
  email: string;
  income: number;
  status: 'Ativo' | 'Inativo';
}

export interface Broker {
  id: string;
  name: string;
  creci: string;
  phone: string;
  email: string;
}

export interface Property {
  id: string;
  title: string;
  type: 'Casa' | 'Apartamento' | 'Terreno';
  value: number;
  address: string;
  photos: string[];
  constructionCompanyId: string;
}

export interface Bank {
  id: string;
  name: string;
  avgRate: number;
  contact: string;
}

export interface ConstructionCompany {
  id: string;
  name: string;
  cnpj: string;
  contact: string;
}

export interface Lead {
  id: string;
  clientId: string;
  brokerId: string;
  propertyId: string;
  bankId: string;
  constructionCompanyId: string;
  currentPhase: LeadPhase;
  createdAt: string;
  history: { phase: LeadPhase; date: string }[];
}

export type ViewType = 'Dashboard' | 'Kanban' | 'List' | 'Clients' | 'Brokers' | 'Properties' | 'Banks' | 'Companies';
