import { fusionar } from './copia'

describe('fusión de copias', () => {
  it('gana el más reciente y lo nuevo entra', () => {
    const existentes = [
      { id: 'a', updated_at: '2026-09-05T10:00:00.000Z', v: 1 },
      { id: 'b', updated_at: '2026-09-05T12:00:00.000Z', v: 1 },
    ]
    const entrantes = [
      { id: 'a', updated_at: '2026-09-05T11:00:00.000Z', v: 2 }, // más nuevo: entra
      { id: 'b', updated_at: '2026-09-05T11:00:00.000Z', v: 2 }, // más viejo: no
      { id: 'c', updated_at: '2026-09-05T09:00:00.000Z', v: 2 }, // nuevo: entra
    ]
    expect(fusionar(existentes, entrantes).map(x => x.id)).toEqual(['a', 'c'])
  })
  it('una copia idéntica no escribe nada', () => {
    const x = [{ id: 'a', updated_at: '2026-09-05T10:00:00.000Z' }]
    expect(fusionar(x, x)).toEqual([])
  })
})
