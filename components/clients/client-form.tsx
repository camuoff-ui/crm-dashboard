'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Client } from '@/lib/types'

type ClientFormData = Pick<Client, 'name' | 'email' | 'phone' | 'company' | 'notes'>

interface ClientFormProps {
  initial?: Partial<ClientFormData>
  onSubmit: (data: ClientFormData) => void
  onCancel: () => void
}

export function ClientForm({ initial = {}, onSubmit, onCancel }: ClientFormProps) {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    email: initial.email ?? '',
    phone: initial.phone ?? '',
    company: initial.company ?? '',
    notes: initial.notes ?? '',
  })

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      company: form.company || null,
      notes: form.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cf-name">Nome *</Label>
        <Input id="cf-name" value={form.name} onChange={field('name')} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf-company">Empresa</Label>
        <Input id="cf-company" value={form.company} onChange={field('company')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf-email">Email</Label>
        <Input id="cf-email" type="email" value={form.email} onChange={field('email')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf-phone">Telefone</Label>
        <Input id="cf-phone" value={form.phone} onChange={field('phone')} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  )
}
