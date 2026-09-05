export function fechaCorta(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
export function fechaHora(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
export function hoyIso(): string {
  return new Date().toISOString().slice(0, 10)
}
