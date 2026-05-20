export type ActivityType = 'ligar' | 'agendar' | 'whatsapp' | 'ligar_mais_tarde'
export type ActivityStatus = 'pending' | 'done'

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  ligar: 'Ligar',
  agendar: 'Agendar',
  whatsapp: 'WhatsApp',
  ligar_mais_tarde: 'Ligar mais pra frente',
}

export interface Activity {
  id: string
  client_id: string
  type: ActivityType
  notes: string | null
  due_date: string
  due_time: string | null
  status: ActivityStatus
  completed_at: string | null
  created_at: string
  client?: Client
}

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
