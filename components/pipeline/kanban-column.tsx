import { Droppable, Draggable } from '@hello-pangea/dnd'
import { DealCard } from './deal-card'
import type { Deal, DealStage } from '@/lib/types'
import { STAGE_LABELS } from '@/lib/types'

interface KanbanColumnProps {
  stage: DealStage
  deals: Deal[]
  onEdit: (deal: Deal) => void
  onDelete: (id: string) => void
}

export function KanbanColumn({ stage, deals, onEdit, onDelete }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-60 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{STAGE_LABELS[stage]}</h3>
        <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">
          {deals.length}
        </span>
      </div>
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-20 rounded-lg p-2 space-y-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'
            }`}
          >
            {deals.map((deal, index) => (
              <Draggable key={deal.id} draggableId={deal.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <DealCard deal={deal} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
