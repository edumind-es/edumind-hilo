import { abrirSobre, cerrarSobre, claveAleatoria, claveDeToken, importarClave, tokenBuzonNuevo } from './sobres'

describe('sobres cifrados', () => {
  it('relé: ida y vuelta con la clave del QR, y otra clave no abre', async () => {
    const k = await importarClave(claveAleatoria())
    const otra = await importarClave(claveAleatoria())
    const sobre = await cerrarSobre(k, 'H1|t|AB3DE|equipo:+F2GH7')
    expect(sobre).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(sobre).not.toContain('AB3DE')
    expect(await abrirSobre(k, sobre)).toBe('H1|t|AB3DE|equipo:+F2GH7')
    await expect(abrirSobre(otra, sobre)).rejects.toThrow()
  })
  it('buzón: el mismo token da la misma clave en dos dispositivos', async () => {
    const token = tokenBuzonNuevo()
    expect(token.length).toBeGreaterThanOrEqual(40)
    const k1 = await claveDeToken(token)
    const k2 = await claveDeToken(token)
    const sobre = await cerrarSobre(k1, '{"id":"g1"}')
    expect(await abrirSobre(k2, sobre)).toBe('{"id":"g1"}')
  })
})
