import { analizarCsv, matrizDeCsv, nombresDeCsv } from './csv'
import { esExportacionMiClase, leerExportacionMiClase } from './miclase'

describe('CSV', () => {
  it('detecta el separador y respeta comillas', () => {
    expect(analizarCsv('a;b;c\n"x;y";2;3\r\n')).toEqual([['a', 'b', 'c'], ['x;y', '2', '3']])
    expect(analizarCsv('a,b\n"di ""hola""",1')).toEqual([['a', 'b'], ['di "hola"', '1']])
    expect(analizarCsv('\uFEFFa\tb\n1\t2')).toEqual([['a', 'b'], ['1', '2']])
  })
  it('saca nombres con o sin cabecera', () => {
    expect(nombresDeCsv(analizarCsv('Nombre;Apellidos;Curso\nSabela;Pérez;4B\nIker;López;4B'))).toEqual(['Sabela Pérez', 'Iker López'])
    expect(nombresDeCsv(analizarCsv('Sabela\nIker\n\nAntía'))).toEqual(['Sabela', 'Iker', 'Antía'])
    expect(nombresDeCsv(analizarCsv('Curso;Alumno\n4B;Noa'))).toEqual(['Noa'])
  })
  it('lee una matriz de otra herramienta', () => {
    const m = matrizDeCsv(analizarCsv(';Ana;Bea;Cai\nAna;;1;x\nBea;1;;\nCai;;;'))
    expect(m.nombres).toEqual(['Ana', 'Bea', 'Cai'])
    expect(m.elecciones).toEqual([{ de: 'Ana', a: 'Bea' }, { de: 'Ana', a: 'Cai' }, { de: 'Bea', a: 'Ana' }])
    expect(() => matrizDeCsv([['a']])).toThrow()
  })
})

describe('exportación de MiClase', () => {
  const exp = {
    version: 5,
    exported_at: '2026-09-05T10:00:00.000Z',
    grupos: [{ id: 1, nombre: '4.º B', etapa: 'Primaria', curso: '4º', curso_escolar: '2026-2027' }, { id: 2, nombre: 'Borrado', deleted_at: 'x' }],
    alumnos: [
      { id: 10, nombre: 'Sabela', apellidos: 'Pérez', neae: 0, codigo_cifrado: 'AB3DE' },
      { id: 11, nombre: 'Iker', apellidos: 'López', neae: 1, codigo_cifrado: 'zz' },
      { id: 12, nombre: 'Fuera', apellidos: '', neae: 0 },
    ],
    grupo_alumnos: [{ id: 1, grupo_id: 1, alumno_id: 10, activo: 1 }, { id: 2, grupo_id: 1, alumno_id: 11, activo: 1 }, { id: 3, grupo_id: 1, alumno_id: 12, activo: 0 }],
    calificaciones: [{ secreto: 'no se lee' }],
  }
  it('lee grupos y alumnos activos, con código si vale', () => {
    expect(esExportacionMiClase(exp)).toBe(true)
    const g = leerExportacionMiClase(exp)
    expect(g).toHaveLength(1)
    expect(g[0]!.nombre).toBe('4.º B')
    expect(g[0]!.etapa).toBe('primaria')
    expect(g[0]!.alumnos).toEqual([
      { nombre: 'Sabela Pérez', codigo: 'AB3DE', neae: false },
      { nombre: 'Iker López', codigo: null, neae: true },
    ])
  })
  it('rechaza lo que no es de MiClase', () => {
    expect(esExportacionMiClase({ formato: 'edumind-hilo' })).toBe(false)
    expect(() => leerExportacionMiClase({})).toThrow()
  })
})
