import { construir } from '../src/app.js'

const TOKEN_A = 'a'.repeat(43)
const TOKEN_B = 'b'.repeat(43)
const auth = t => ({ authorization: `Bearer ${t}` })

describe('relé en vivo', () => {
  let app
  beforeAll(() => { app = construir() })
  afterAll(() => app.close())

  it('abre sesión, acepta sobres, los sirve incrementalmente y cierra', async () => {
    const s = await app.inject({ method: 'POST', url: '/api/rele/sesiones' })
    expect(s.statusCode).toBe(201)
    const { codigo } = s.json()
    expect(codigo).toMatch(/^[A-Z2-9]{8}$/)
    for (const c of ['AAAA', 'BBBB', 'CCCC']) {
      const r = await app.inject({ method: 'POST', url: `/api/rele/${codigo}/sobres`, payload: { ciphertext: c } })
      expect(r.statusCode).toBe(201)
    }
    const g1 = await app.inject({ method: 'GET', url: `/api/rele/${codigo}/sobres` })
    expect(g1.json().sobres.map(x => x.ciphertext)).toEqual(['AAAA', 'BBBB', 'CCCC'])
    const g2 = await app.inject({ method: 'GET', url: `/api/rele/${codigo}/sobres?desde=2` })
    expect(g2.json().sobres.map(x => x.ciphertext)).toEqual(['CCCC'])
    const d = await app.inject({ method: 'DELETE', url: `/api/rele/${codigo}` })
    expect(d.statusCode).toBe(204)
    const g3 = await app.inject({ method: 'GET', url: `/api/rele/${codigo}/sobres` })
    expect(g3.json()).toMatchObject({ sobres: [], cerrada: true })
    const r = await app.inject({ method: 'POST', url: `/api/rele/${codigo}/sobres`, payload: { ciphertext: 'DDDD' } })
    expect(r.statusCode).toBe(404)
  })

  it('rechaza sobres que no parecen ciphertext', async () => {
    const { codigo } = (await app.inject({ method: 'POST', url: '/api/rele/sesiones' })).json()
    const r = await app.inject({ method: 'POST', url: `/api/rele/${codigo}/sobres`, payload: { ciphertext: 'Sabela eligió a Iker' } })
    expect(r.statusCode).toBe(400)
  })
})

describe('buzón de sincronización', () => {
  let app
  beforeAll(() => { app = construir() })
  afterAll(() => app.close())
  const reg = (id, updated_at, ciphertext = 'Q0lGUkFETw==') => ({ tabla: 'grupos', id, updated_at, ciphertext })

  it('exige token', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/buzon/registros' })
    expect(r.statusCode).toBe(401)
    const r2 = await app.inject({ method: 'GET', url: '/api/buzon/registros', headers: auth('corto') })
    expect(r2.statusCode).toBe(401)
  })

  it('último en escribir gana y los buzones están aislados', async () => {
    const p1 = await app.inject({ method: 'PUT', url: '/api/buzon/registros', headers: auth(TOKEN_A), payload: { dispositivo: 'tablet', registros: [reg('g1', '2026-09-06T10:00:00.000Z', 'AAAA'), reg('g2', '2026-09-06T10:00:00.000Z', 'BBBB')] } })
    expect(p1.json()).toMatchObject({ aceptados: 2, antiguos: 0 })
    const p2 = await app.inject({ method: 'PUT', url: '/api/buzon/registros', headers: auth(TOKEN_A), payload: { dispositivo: 'portatil', registros: [reg('g1', '2026-09-06T09:00:00.000Z', 'VIEJO'), reg('g2', '2026-09-06T11:00:00.000Z', 'NUEVO')] } })
    expect(p2.json()).toMatchObject({ aceptados: 1, antiguos: 1 })
    const g = await app.inject({ method: 'GET', url: '/api/buzon/registros', headers: auth(TOKEN_A) })
    const porId = Object.fromEntries(g.json().registros.map(r => [r.id, r.ciphertext]))
    expect(porId).toEqual({ g1: 'AAAA', g2: 'NUEVO' })
    const otro = await app.inject({ method: 'GET', url: '/api/buzon/registros', headers: auth(TOKEN_B) })
    expect(otro.json().registros).toEqual([])
  })

  it('sirve incrementos por seq y rechaza lo mal formado', async () => {
    const g = await app.inject({ method: 'GET', url: '/api/buzon/registros', headers: auth(TOKEN_A) })
    const hasta = g.json().hasta
    const p = await app.inject({ method: 'PUT', url: '/api/buzon/registros', headers: auth(TOKEN_A), payload: { dispositivo: 'tablet', registros: [reg('g3', '2026-09-06T12:00:00.000Z', 'CCCC'), { tabla: 'secretos', id: 'x', updated_at: '2026-09-06T12:00:00.000Z', ciphertext: 'DDDD' }, reg('g4', 'zzz')] } })
    expect(p.json().aceptados).toBe(1)
    expect(p.json().rechazados.map(r => r.motivo).sort()).toEqual(['fecha_invalida', 'tabla_desconocida'])
    const inc = await app.inject({ method: 'GET', url: `/api/buzon/registros?desde=${hasta}`, headers: auth(TOKEN_A) })
    expect(inc.json().registros.map(r => r.id)).toEqual(['g3'])
  })

  it('la purga deja el buzón vacío', async () => {
    const d = await app.inject({ method: 'DELETE', url: '/api/buzon', headers: auth(TOKEN_A) })
    expect(d.statusCode).toBe(204)
    const m = await app.inject({ method: 'GET', url: '/api/buzon', headers: auth(TOKEN_A) })
    expect(m.json()).toMatchObject({ existe: false, registros: 0 })
  })
})
