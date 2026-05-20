export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/dashboard/metric-card'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: clientCount },
    { data: deals },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('deals').select('value, stage, created_at, updated_at'),
  ])

  const activeDeals = deals?.filter(d => d.stage !== 'fechado') ?? []
  const pipelineValue = activeDeals.reduce((sum, d) => sum + Number(d.value), 0)

  const BRT_OFFSET = -3 * 60
  const nowUtc = new Date()
  const nowBrt = new Date(nowUtc.getTime() + (BRT_OFFSET - nowUtc.getTimezoneOffset()) * 60000)
  const closedThisMonth = deals?.filter(d => {
    if (d.stage !== 'fechado') return false
    const updated = new Date(new Date(d.updated_at).getTime() + (BRT_OFFSET - nowUtc.getTimezoneOffset()) * 60000)
    return (
      updated.getMonth() === nowBrt.getMonth() &&
      updated.getFullYear() === nowBrt.getFullYear()
    )
  }).length ?? 0

  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total de Clientes" value={clientCount ?? 0} />
        <MetricCard title="Negócios Ativos" value={activeDeals.length} />
        <MetricCard title="Valor do Pipeline" value={fmt.format(pipelineValue)} />
        <MetricCard
          title="Fechados no Mês"
          value={closedThisMonth}
          description={nowBrt.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        />
      </div>
    </div>
  )
}
