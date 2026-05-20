'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Deal } from '@/lib/types'

interface DealCardProps {
  deal: Deal
  onEdit: (deal: Deal) => void
  onDelete: (id: string) => void
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
  const [showWa, setShowWa] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  function sendWhatsApp() {
    const phone = deal.client?.phone?.replace(/\D/g, '')
    if (!phone) {
      alert('Este cliente não tem telefone cadastrado. Adicione o telefone no cadastro do cliente.')
      return
    }
    const [year, month, day] = date.split('-')
    const dateFormatted = new Date(Number(year), Number(month) - 1, Number(day))
      .toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    const msg = `Sua consulta no Instituto Perdiza & Carvalho foi agendada para o dia ${dateFormatted} às ${time}. Pedimos que chegue com 20 minutos de antecedência. Aguardamos você! Um excelente dia!`
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    setShowWa(false)
  }

  return (
    <div className="bg-white rounded-md border p-3 shadow-sm space-y-1 cursor-grab active:cursor-grabbing">
      <p className="font-medium text-sm leading-tight">{deal.title}</p>
      {deal.client && <p className="text-xs text-gray-500">{deal.client.name}</p>}
      <p className="text-sm font-semibold text-green-600">{fmt.format(deal.value)}</p>
      <div className="flex gap-1 pt-1 flex-wrap">
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => onEdit(deal)}>
          Editar
        </Button>
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-red-500 hover:text-red-700" onClick={() => onDelete(deal.id)}>
          Remover
        </Button>
        <button
          onClick={() => setShowWa(v => !v)}
          style={{fontSize:'11px',padding:'2px 8px',borderRadius:'4px',border:'1px solid #16a34a',color:'#16a34a',background:'white',cursor:'pointer'}}
        >
          📱 Confirmar
        </button>
      </div>
      {showWa && (
        <div className="border-t pt-2 space-y-2 mt-1">
          <p className="text-xs font-semibold text-gray-700">Enviar confirmação via WhatsApp</p>
          <div>
            <p className="text-xs text-gray-500 mb-1">Data da consulta</p>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border rounded px-2 py-1 text-xs"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Horário</p>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full border rounded px-2 py-1 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={sendWhatsApp}
              disabled={!date || !time}
              style={{backgroundColor: date && time ? '#16a34a' : '#9ca3af', color:'white', padding:'4px 12px', borderRadius:'4px', fontSize:'12px', border:'none', cursor: date && time ? 'pointer' : 'not-allowed'}}
            >
              Enviar
            </button>
            <button
              onClick={() => setShowWa(false)}
              style={{backgroundColor:'#f3f4f6', color:'#374151', padding:'4px 12px', borderRadius:'4px', fontSize:'12px', border:'none', cursor:'pointer'}}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
