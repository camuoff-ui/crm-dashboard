'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ClientsTable } from '@/components/clients/clients-table'
import { ClientForm } from '@/components/clients/client-form'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types'

type ClientFormData = Pick<Client, 'name' | 'email' | 'phone' | 'company' | 'notes'>

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    setClients(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(data: ClientFormData) {
    if (editing) {
      await supabase.from('clients').update(data).eq('id', editing.id)
    } else {
      await supabase.from('clients').insert(data)
    }
    setDialogOpen(false)
    setEditing(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este cliente? Os negócios vinculados também serão removidos.')) return
    await supabase.from('clients').delete().eq('id', id)
    load()
  }

  function openEdit(client: Client) {
    setEditing(client)
    setDialogOpen(true)
  }

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={openNew}>+ Novo Cliente</Button>
      </div>
      <div className="bg-white rounded-lg border">
        <ClientsTable clients={clients} onEdit={openEdit} onDelete={handleDelete} />
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <ClientForm
            initial={editing ?? {}}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
