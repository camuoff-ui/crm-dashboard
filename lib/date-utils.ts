export function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDate(iso: string): string {
  const [y, m, day] = iso.split('-')
  return new Date(Number(y), Number(m) - 1, Number(day))
    .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
