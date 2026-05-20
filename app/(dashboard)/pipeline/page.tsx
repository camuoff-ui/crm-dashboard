'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { DealForm } from '@/components/pipeline/deal-form'
import { createClient } from '@/lib/supabase/client'
import type { Client, Deal, DealStage } from '@/lib/types'

type DealFormData = Pick<Deal, 'title' | 'value' | 'stage' | 'client_id'>

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Deal | null>(null)
  const supabase = createClient()

  async function load() {
    const [{ data: dealsData }, { data: clientsData }] = await Promise.all([
      supabase.from('deals').select('*, client:clients(*)').order('created_at'),
      supabase.from('clients').select('*').order('name'),
    ])
    setDeals((dealsData as Deal[]) ?? [])
    setClients(clientsData ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleStageChange(dealId: string, newStage: DealStage) {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d))
    await supabase.from('deals').update({ stage: newStage }).eq('id', dealId)
  }

  async function handleSubmit(data: DealFormData) {
    if (editing) {
      await supabase.from('deals').update(data).eq('id', editing.id)
    } else {
      await supabase.from('deals').insert(data)
    }
    setDialogOpen(false)
    setEditing(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este negócio?')) return
    await supabase.from('deals').delete().eq('id', id)
    load()
  }

  function openEdit(deal: Deal) {
    setEditing(deal)
    setDialogOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pipeline de Vendas</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>+ Novo Negócio</Button>
      </div>
      <KanbanBoard
        deals={deals}
        onStageChange={handleStageChange}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Negócio' : 'Novo Negócio'}</DialogTitle>
          </DialogHeader>
          <DealForm
            clients={clients}
            initial={editing ?? {}}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
