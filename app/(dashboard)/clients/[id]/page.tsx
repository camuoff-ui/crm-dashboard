'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Client, Activity, ActivityType } from '@/lib/types'
import { ACTIVITY_TYPE_LABELS } from '@/lib/types'

const ACTIONS: { type: ActivityType; label: string; color: string }[] = [
  { type: 'ligar', label: '📞 Ligar', color: '#2563eb' },
  { type: 'agendar', label: '📅 Agendar', color: '#16a34a' },
  { type: 'whatsapp', label: '💬 WhatsApp', color: '#15803d' },
  { type: 'ligar_mais_tarde', label: '🕐 Ligar mais pra frente', color: '#9333ea' },
]

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [client, setClient] = useState<Client | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activeAction, setActiveAction] = useState<ActivityType | null>(null)
  const [form, setForm] = useState({ date: getToday(), time: '', notes: '' })

  async function load() {
    const [{ data: c, error: ce }, { data: a, error: ae }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('activities').select('*').eq('client_id', id).order('due_date', { ascending: false }).order('created_at', { ascending: false }),
    ])
    if (ce) {
      if (ce.code === 'PGRST116') { setNotFound(true); return }
      alert('Erro ao carregar cliente: ' + ce.message); setLoadError(true); return
    }
    if (ae) { alert('Erro ao carregar atividades: ' + ae.message); return }
    setClient(c)
    setActivities((a as Activity[]) ?? [])
  }

  useEffect(() => { load() }, [id])

  async function handleAddActivity() {
    if (!activeAction) return
    const { error } = await supabase.from('activities').insert({
      client_id: id,
      type: activeAction,
      notes: form.notes || null,
      due_date: form.date,
      due_time: form.time || null,
      status: 'pending',
    })
    if (error) { alert('Erro ao salvar tarefa: ' + error.message); return }
    setActiveAction(null)
    setForm({ date: getToday(), time: '', notes: '' })
    load()
  }

  async function handleDone(activityId: string) {
    const { error } = await supabase.from('activities').update({
      status: 'done',
      completed_at: new Date().toISOString(),
    }).eq('id', activityId)
    if (error) { alert('Erro ao concluir tarefa: ' + error.message); return }
    load()
  }

  if (notFound) return (
    <div className="text-center py-16">
      <p className="text-gray-500 mb-4">Cliente não encontrado.</p>
      <Link href="/clients" className="text-blue-600 hover:underline text-sm">← Voltar para Clientes</Link>
    </div>
  )

  if (loadError) return (
    <div className="text-center py-16">
      <p className="text-gray-500 mb-4">Erro ao carregar cliente.</p>
      <button onClick={() => { setLoadError(false); load() }} style={{color:'#2563eb',background:'none',border:'none',cursor:'pointer',fontSize:'14px'}}>Tentar novamente</button>
    </div>
  )

  if (!client) return <p className="text-gray-400">Carregando...</p>

  const pending = activities.filter(a => a.status === 'pending')
  const done = activities.filter(a => a.status === 'done')

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex gap-3">
        <button onClick={() => window.history.length > 1 ? router.back() : router.push('/clients')} style={{fontSize:'13px',color:'#6b7280',background:'none',border:'none',cursor:'pointer'}}>
          ← Voltar
        </button>
        <Link href="/clients" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>
          Clientes
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h1 className="text-2xl font-bold mb-1">{client.name}</h1>
        {client.company && <p className="text-gray-500 text-sm mb-3">{client.company}</p>}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {client.email && <p><span className="text-gray-400">Email:</span> {client.email}</p>}
          {client.phone && <p><span className="text-gray-400">Telefone:</span> {client.phone}</p>}
          {client.notes && <p className="col-span-2"><span className="text-gray-400">Obs:</span> {client.notes}</p>}
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">Ações</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {ACTIONS.map(a => (
            <button
              key={a.type}
              onClick={() => setActiveAction(activeAction === a.type ? null : a.type)}
              style={{
                backgroundColor: activeAction === a.type ? a.color : 'white',
                color: activeAction === a.type ? 'white' : a.color,
                border: `1px solid ${a.color}`,
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {a.label}
            </button>
          ))}
        </div>

        {activeAction && (
          <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
            <p className="text-sm font-medium">{ACTIVITY_TYPE_LABELS[activeAction]}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Data</p>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Horário (opcional)</p>
                <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm" />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Observação (opcional)</p>
              <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Ex: cliente pediu retorno após 15h" className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddActivity} style={{backgroundColor:'#2563eb',color:'white',padding:'6px 16px',borderRadius:'6px',fontSize:'13px',border:'none',cursor:'pointer'}}>
                Salvar tarefa
              </button>
              <button onClick={() => setActiveAction(null)} style={{backgroundColor:'#f3f4f6',color:'#374151',padding:'6px 16px',borderRadius:'6px',fontSize:'13px',border:'none',cursor:'pointer'}}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div className="bg-white rounded-lg border p-6 mb-4">
          <h2 className="font-semibold mb-4">Tarefas pendentes</h2>
          <div className="space-y-2">
            {pending.map(a => (
              <div key={a.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <p className="text-sm font-medium">{ACTIVITY_TYPE_LABELS[a.type]}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(a.due_date)}{a.due_time ? ` às ${a.due_time.slice(0,5)}` : ''}
                    {a.notes ? ` — ${a.notes}` : ''}
                  </p>
                </div>
                <button onClick={() => handleDone(a.id)} style={{backgroundColor:'#16a34a',color:'white',padding:'4px 12px',borderRadius:'4px',fontSize:'12px',border:'none',cursor:'pointer'}}>
                  Concluído
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-semibold mb-4 text-gray-400">Histórico</h2>
          <div className="space-y-2">
            {done.map(a => (
              <div key={a.id} className="flex items-center justify-between border rounded p-3 opacity-60">
                <div>
                  <p className="text-sm font-medium line-through">{ACTIVITY_TYPE_LABELS[a.type]}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(a.due_date)}{a.due_time ? ` às ${a.due_time.slice(0,5)}` : ''}
                    {a.notes ? ` — ${a.notes}` : ''}
                  </p>
                </div>
                <span style={{fontSize:'11px',color:'#16a34a',fontWeight:'600'}}>✓ Feito</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
