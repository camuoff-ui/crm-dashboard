import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClientsTable } from '../clients/clients-table'
import type { Client } from '@/lib/types'

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Empresa Alpha',
    email: 'alpha@alpha.com',
    phone: '11999999999',
    company: 'Alpha Ltda',
    notes: null,
    created_at: '2026-01-01T00:00:00Z',
  },
]

describe('ClientsTable', () => {
  it('renders client rows with all columns', () => {
    render(<ClientsTable clients={mockClients} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    expect(screen.getByText('Alpha Ltda')).toBeInTheDocument()
    expect(screen.getByText('alpha@alpha.com')).toBeInTheDocument()
  })

  it('renders empty state message when no clients', () => {
    render(<ClientsTable clients={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/nenhum cliente/i)).toBeInTheDocument()
  })
})
