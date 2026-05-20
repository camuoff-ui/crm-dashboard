import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DealCard } from '../pipeline/deal-card'
import type { Deal } from '@/lib/types'

const mockDeal: Deal = {
  id: '1',
  client_id: 'c1',
  title: 'Proposta Alpha',
  value: 15000,
  stage: 'proposta',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  client: {
    id: 'c1', name: 'Alpha Corp',
    email: null, phone: null, company: null, notes: null,
    created_at: '2026-01-01T00:00:00Z',
  },
}

describe('DealCard', () => {
  it('renders deal title and client name', () => {
    render(<DealCard deal={mockDeal} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Proposta Alpha')).toBeInTheDocument()
    expect(screen.getByText('Alpha Corp')).toBeInTheDocument()
  })

  it('renders formatted BRL value', () => {
    render(<DealCard deal={mockDeal} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/15\.000|15,000/)).toBeInTheDocument()
  })
})
