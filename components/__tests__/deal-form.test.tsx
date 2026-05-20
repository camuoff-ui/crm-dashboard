import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DealForm } from '../pipeline/deal-form'
import type { Client } from '@/lib/types'

const mockClients: Client[] = [
  { id: 'c1', name: 'Alpha Corp', email: null, phone: null, company: null, notes: null, created_at: '' },
]

describe('DealForm', () => {
  it('renders title and value fields', () => {
    render(<DealForm clients={mockClients} onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/valor/i)).toBeInTheDocument()
  })

  it('calls onSubmit with title and numeric value', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<DealForm clients={mockClients} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await user.type(screen.getByLabelText(/título/i), 'Novo Negócio')
    await user.clear(screen.getByLabelText(/valor/i))
    await user.type(screen.getByLabelText(/valor/i), '5000')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Novo Negócio', value: 5000 })
    )
  })
})
