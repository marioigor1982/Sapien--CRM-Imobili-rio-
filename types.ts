
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

export enum MuralStatus {
  CRITICO = 'Crítico',
  IMPORTANTE = 'Importante',
  EXECUTAR = 'Executar',
  AGUARDANDO = 'Aguardando Retorno',
  FALAR_CORRETOR = 'Falar com o Corretor',
  FALAR_BANCO = 'Falar com o Banco',
  AVANCAR_FASE = 'Favor avançar a fase'
}

export interface MuralFile {
  nome: string;
  url: string;
  tipo: string;
}

export interface MuralReply {
  autor: string;
  texto: string;
  timestamp: string;
  arquivos?: MuralFile[];
}

export interface MuralMessage {
  id: string;
  titulo: string;
  content: string;
  status: MuralStatus;
  importante: boolean;
  criador_id: string; // Email do autor
  authorName: string;
  createdAt: string;
  timestamp_ultima_interacao: any; 
  isSeenGlobal?: boolean;
  arquivos?: MuralFile[];
  respostas: MuralReply[];
}

export interface Client {
  id: string;
  name: string;
  taxId: string;
  phone: string;
  email: string;
  income: number;
  status: 'Ativo' | 'Inativo';
  propertyId?: string;
  brokerId?: string;
  bankId?: string;
  createdAt?: string;
}

export interface Broker {
  id: string;
  name: string;
  creci: string;
  phone: string;
  email: string;
  commissionRate: number;
}

export interface Property {
  id: string;
  title: string;
  type: string;
  value: number;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  photos: string[];
  constructionCompanyId: string;
}

export interface Bank {
  id: string;
  name: string;
  agency: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  contact: string;
  logo?: string;
}

export interface ConstructionCompany {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
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
  internalMessage?: string;
  history: { phase: LeadPhase; date: string; message?: string }[];
}

export interface ApprovalRequest {
  id: string;
  type: 'delete' | 'regress';
  userId: string;
  userEmail: string;
  leadId: string;
  targetPhase?: LeadPhase;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  isSeen?: boolean;
}

export type ViewType = 'Dashboard' | 'Kanban' | 'List' | 'Clientes' | 'Corretores' | 'Properties' | 'Bancos' | 'Construtoras' | 'Mural' | 'Settings';
