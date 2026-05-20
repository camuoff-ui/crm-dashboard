import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from '../dashboard/metric-card'

describe('MetricCard', () => {
  it('renders title and numeric value', () => {
    render(<MetricCard title="Total de Clientes" value={42} />)
    expect(screen.getByText('Total de Clientes')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders string value (currency)', () => {
    render(<MetricCard title="Valor do Pipeline" value="R$ 150.000,00" />)
    expect(screen.getByText('R$ 150.000,00')).toBeInTheDocument()
  })

  it('renders optional description', () => {
    render(<MetricCard title="Fechados" value={3} description="no mês atual" />)
    expect(screen.getByText('no mês atual')).toBeInTheDocument()
  })
})
