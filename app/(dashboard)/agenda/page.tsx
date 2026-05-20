'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Activity } from '@/lib/types'
import { ACTIVITY_TYPE_LABELS } from '@/lib/types'

type AgendaTask = Activity & { client: { id: string; name: string; phone: string | null } }

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatToday() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AgendaPage() {
  const supabase = useMemo(() => createClient(), [])
  const [tasks, setTasks] = useState<AgendaTask[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data, error } = await supabase
      .from('activities')
      .select('*, client:clients(id, name, phone)')
      .eq('due_date', getToday())
      .eq('status', 'pending')
      .order('due_time', { ascending: true, nullsFirst: false })
    if (error) { alert('Erro ao carregar agenda: ' + error.message); setLoading(false); return }
    setTasks((data as AgendaTask[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDone(id: string) {
    const { error } = await supabase.from('activities').update({
      status: 'done',
      completed_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) { alert('Erro ao concluir tarefa: ' + error.message); return }
    load()
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Agenda do Dia</h1>
      <p className="text-gray-500 text-sm mb-6 capitalize">{formatToday()}</p>

      {loading && <p className="text-gray-400">Carregando...</p>}

      {!loading && tasks.length === 0 && (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-gray-500">Nenhuma tarefa para hoje!</p>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded-lg border p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{fontSize:'12px',fontWeight:'600',backgroundColor:'#eff6ff',color:'#2563eb',padding:'2px 8px',borderRadius:'4px'}}>
                    {ACTIVITY_TYPE_LABELS[task.type]}
                  </span>
                  {task.due_time && (
                    <span className="text-xs text-gray-400">{task.due_time.slice(0,5)}</span>
                  )}
                </div>
                <Link href={`/clients/${task.client.id}`} className="font-medium text-sm hover:underline text-blue-600">
                  {task.client.name}
                </Link>
                {task.notes && <p className="text-xs text-gray-500 mt-0.5">{task.notes}</p>}
              </div>
              <button
                onClick={() => handleDone(task.id)}
                style={{backgroundColor:'#16a34a',color:'white',padding:'6px 14px',borderRadius:'6px',fontSize:'13px',border:'none',cursor:'pointer',whiteSpace:'nowrap'}}
              >
                ✓ Concluído
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
