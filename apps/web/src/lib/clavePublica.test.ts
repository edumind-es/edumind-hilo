import { cifrarParaDocente, descifrarSobre, generarParDocente, publicaCompacta, publicaDesdeCompacta } from './clavePublica'

describe('entregas cifradas con clave pública', () => {
  it('solo el docente abre la entrega', async () => {
    const docente = await generarParDocente()
    const otro = await generarParDocente()
    const publica = publicaDesdeCompacta(publicaCompacta(docente.publica))
    const sobre = await cifrarParaDocente('H1|t|AB3DE|equipo:+F2GH7', publica, 't')
    expect(sobre.datos).not.toContain('AB3DE')
    expect(await descifrarSobre(sobre, docente.privada)).toBe('H1|t|AB3DE|equipo:+F2GH7')
    await expect(descifrarSobre(sobre, otro.privada)).rejects.toThrow(/no se puede abrir/)
  })
  it('la clave compacta cabe en un enlace', async () => {
    const docente = await generarParDocente()
    expect(publicaCompacta(docente.publica).length).toBeLessThan(140)
  })
})
