import { desempaquetarSesion, empaquetarSesion, paqueteDeFragmento, type Sesion } from './sesion'

const sesion: Sesion = {
  toma: '3d3f9d7e-1b7a-4a4e-9f4e-8b7d6c5a4f3e',
  titulo: 'Toma de septiembre',
  idioma: 'gl',
  etapa: 'primaria',
  situaciones: ['equipo', 'recreo', 'ayuda', 'espejo', 'pabc12'],
  preguntas: [{ id: 'pabc12', etiqueta: 'Trabajo', pregunta: '¿Con quién harías un trabajo largo?', ayuda: 'Piénsalo.', tipo: 'preferencia' }],
  maxElecciones: 3,
  negativas: false,
  alumnos: Array.from({ length: 30 }, (_, i) => [`A${String(i).padStart(2, '0')}BC`.replace(/[IO01]/g, 'X'), `Nombre${i}`] as [string, string]),
}

describe('paquete de sesión', () => {
  it('ida y vuelta', async () => {
    const p = await empaquetarSesion(sesion)
    expect(p).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(await desempaquetarSesion(p)).toEqual(sesion)
  })
  it('un grupo de 30 cabe en un QR proyectable', async () => {
    const p = await empaquetarSesion(sesion)
    expect(p.length).toBeLessThan(600)
  })
  it('las negativas no sobreviven fuera de secundaria aunque el paquete las traiga', async () => {
    const p = await empaquetarSesion({ ...sesion, negativas: true })
    expect((await desempaquetarSesion(p)).negativas).toBe(false)
    const q = await empaquetarSesion({ ...sesion, etapa: 'secundaria', negativas: true })
    expect((await desempaquetarSesion(q)).negativas).toBe(true)
  })
  it('rechaza basura', async () => {
    await expect(desempaquetarSesion('no-es-un-paquete')).rejects.toThrow()
    expect(paqueteDeFragmento('#g=abc_-9')).toBe('abc_-9')
    expect(paqueteDeFragmento('#otra=1')).toBeNull()
  })
})
