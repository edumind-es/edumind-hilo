import { analizarLista, nombresParaAlumnado } from './lista'

describe('lista pegada', () => {
  it('acepta líneas, comas y numeración', () => {
    const texto = '1. Sabela Pérez\n2) Iker  López\nAntía; Brais, Uxía\n\n'
    expect(analizarLista(texto)).toEqual(['Sabela Pérez', 'Iker López', 'Antía', 'Brais', 'Uxía'])
  })
  it('quita duplicados sin distinguir mayúsculas', () => {
    expect(analizarLista('Noa\nnoa\nNOA\nRoi')).toEqual(['Noa', 'Roi'])
  })
  it('desambigua solo los nombres de pila repetidos', () => {
    expect(nombresParaAlumnado(['Iker López', 'Iker Souto', 'Noa Rey'])).toEqual(['Iker L.', 'Iker S.', 'Noa'])
  })
})
