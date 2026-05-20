'use client'

import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { KanbanColumn } from './kanban-column'
import type { Deal, DealStage } from '@/lib/types'
import { DEAL_STAGES } from '@/lib/types'

interface KanbanBoardProps {
  deals: Deal[]
  onStageChange: (dealId: string, newStage: DealStage) => void
  onEdit: (deal: Deal) => void
  onDelete: (id: string) => void
}

export function KanbanBoard({ deals, onStageChange, onEdit, onDelete }: KanbanBoardProps) {
  function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const newStage = result.destination.droppableId as DealStage
    const deal = deals.find(d => d.id === result.draggableId)
    if (!deal || deal.stage === newStage) return
    onStageChange(deal.id, newStage)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            deals={deals.filter(d => d.stage === stage)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
