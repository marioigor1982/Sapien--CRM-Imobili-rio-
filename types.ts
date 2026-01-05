
export enum LeadPhase {
  SIMULACAO_COLETA = 'Simulação e Coleta de Documentos',
  APROVACAO_CREDITO = 'Aprovação de Crédito',
  VISITA_IMOVEL = 'Visita ao Imóvel',
  ENGENHARIA = 'Engenharia/Vistoria',
  EMISSAO_CONTRATO = 'Emissão do Contrato',
  ASSINATURA_CONTRATO = 'Assinatura do Contrato',
  REGISTRO_CARTORIO = 'Registro em Cartório',
  LIBERACAO_RECURSOS = 'Liberação dos Recursos'
}

export const PHASES_ORDER = [
  LeadPhase.SIMULACAO_COLETA,
  LeadPhase.APROVACAO_CREDITO,
  LeadPhase.VISITA_IMOVEL,
  LeadPhase.ENGENHARIA,
  LeadPhase.EMISSAO_CONTRATO,
  LeadPhase.ASSINATURA_CONTRATO,
  LeadPhase.REGISTRO_CARTORIO,
  LeadPhase.LIBERACAO_RECURSOS
];

export enum LeadStatus {
  CONCLUIDO = 'Concluído',
  PENDENTE = 'Pendente',
  CANCELADO = 'Cancelado',
  EM_ANDAMENTO = 'Em andamento',
  URGENTE = 'Urgente',
  REPROVADO = 'Reprovado'
}

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
  id: string;
  autor: string;
  texto: string;
  timestamp: string;
  arquivo?: string;
  likes?: string[];
}

export interface MuralMessage {
  id: string;
  titulo: string;
  content: string;
  status: MuralStatus;
  importante: boolean;
  criador_id: string; 
  authorName: string;
  createdAt: string;
  timestamp_ultima_interacao: any; 
  isSeenGlobal?: boolean;
  lido_por?: string[];
  likes?: string[];
  arquivos?: MuralFile[];
  interacoes: MuralReply[];
}

export interface Lead {
  id: string;
  clientId: string;
  brokerId: string;
  propertyId: string;
  bankId: string;
  constructionCompanyId: string;
  currentPhase: LeadPhase;
  status: LeadStatus;
  createdAt: string;
  internalMessage?: string;
  
  // Dados específicos de fases
  motive?: string;
  appraisalValue?: number;
  visitDate?: string;
  inspectionDate?: string;
  registryDate?: string;
  
  history: { 
    phase: LeadPhase; 
    startDate: string; 
    endDate?: string; 
    status: LeadStatus;
    motive?: string;
    appraisalValue?: number;
  }[];
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
