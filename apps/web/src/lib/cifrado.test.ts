import { cifrarTexto, descifrarTexto, esCifrado } from './cifrado'

describe('copia cifrada', () => {
  it('ida y vuelta con la contraseña correcta', async () => {
    const c = await cifrarTexto('{"hola":"mundo"}', 'contraseña-larga')
    expect(esCifrado(c)).toBe(true)
    expect(c.datos).not.toContain('hola')
    expect(await descifrarTexto(c, 'contraseña-larga')).toBe('{"hola":"mundo"}')
  })
  it('con otra contraseña no abre, y no dice nada más', async () => {
    const c = await cifrarTexto('secreto', 'contraseña-larga')
    await expect(descifrarTexto(c, 'otra-contraseña')).rejects.toThrow(/Contraseña incorrecta/)
  })
  it('exige una contraseña mínima', async () => {
    await expect(cifrarTexto('x', '123')).rejects.toThrow()
  })
})
