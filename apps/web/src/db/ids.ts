export function nuevoId(): string {
  return crypto.randomUUID()
}
export function ahora(): string {
  return new Date().toISOString()
}
