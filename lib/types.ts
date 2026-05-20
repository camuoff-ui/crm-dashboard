export type DealStage = 'prospeccao' | 'qualificacao' | 'proposta' | 'negociacao' | 'fechado'

export const DEAL_STAGES: DealStage[] = [
  'prospeccao',
  'qualificacao',
  'proposta',
  'negociacao',
  'fechado',
]

export const STAGE_LABELS: Record<DealStage, string> = {
  prospeccao: 'Prospecção',
  qualificacao: 'Agendamento',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechado: 'Fechado',
}

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  created_at: string
}

export interface Deal {
  id: string
  client_id: string
  title: string
  value: number
  stage: DealStage
  created_at: string
  updated_at: string
  client?: Client
}
