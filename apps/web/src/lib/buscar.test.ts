import { coincidencias } from './buscar'

const p = [{ nombre: 'Antía' }, { nombre: 'Iker López' }, { nombre: 'Iker Souto' }, { nombre: 'Sabela' }, { nombre: 'Uxía Antelo' }]
describe('teclado de transcripción', () => {
  it('encuentra por prefijo sin acentos y prioriza el nombre de pila', () => {
    expect(coincidencias('ant', p).map(x => x.nombre)).toEqual(['Antía', 'Uxía Antelo'])
    expect(coincidencias('IKER S', p).map(x => x.nombre)).toEqual(['Iker Souto'])
    expect(coincidencias('', p)).toEqual([])
  })
})
