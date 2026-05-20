'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Client, Deal, DealStage } from '@/lib/types'
import { DEAL_STAGES, STAGE_LABELS } from '@/lib/types'

type DealFormData = Pick<Deal, 'title' | 'value' | 'stage' | 'client_id'>

interface DealFormProps {
  clients: Client[]
  initial?: Partial<DealFormData>
  onSubmit: (data: DealFormData) => void
  onCancel: () => void
}

export function DealForm({ clients, initial = {}, onSubmit, onCancel }: DealFormProps) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    value: initial.value != null ? String(initial.value) : '',
    stage: initial.stage ?? 'prospeccao' as DealStage,
    client_id: initial.client_id ?? (clients[0]?.id ?? ''),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numValue = parseFloat(form.value.replace(/\./g, '').replace(',', '.')) || 0
    onSubmit({ ...form, value: numValue })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="df-title">Título *</Label>
        <Input
          id="df-title"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="df-value">Valor (R$)</Label>
        <Input
          id="df-value"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={form.value}
          onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="df-client">Cliente</Label>
        <select
          id="df-client"
          className="w-full border rounded-md px-3 py-2 text-sm bg-white"
          value={form.client_id}
          onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
        >
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="df-stage">Etapa</Label>
        <select
          id="df-stage"
          className="w-full border rounded-md px-3 py-2 text-sm bg-white"
          value={form.stage}
          onChange={e => setForm(p => ({ ...p, stage: e.target.value as DealStage }))}
        >
          {DEAL_STAGES.map(s => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  )
}
