import { Button } from '@/components/ui/button'
import type { Deal } from '@/lib/types'

interface DealCardProps {
  deal: Deal
  onEdit: (deal: Deal) => void
  onDelete: (id: string) => void
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
  return (
    <div className="bg-white rounded-md border p-3 shadow-sm space-y-1 cursor-grab active:cursor-grabbing">
      <p className="font-medium text-sm leading-tight">{deal.title}</p>
      {deal.client && <p className="text-xs text-gray-500">{deal.client.name}</p>}
      <p className="text-sm font-semibold text-green-600">{fmt.format(deal.value)}</p>
      <div className="flex gap-1 pt-1">
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => onEdit(deal)}>
          Editar
        </Button>
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-red-500 hover:text-red-700" onClick={() => onDelete(deal.id)}>
          Remover
        </Button>
      </div>
    </div>
  )
}
