import { readFileSync } from 'node:fs'
import { leerXlsx, pareceXlsx } from './xlsx'
import { matrizDeCsv, nombresDeCsv } from './csv'

const fx = (n: string) => new Uint8Array(readFileSync(new URL(`./fixtures/${n}`, import.meta.url)))

describe('XLSX sin librerías', () => {
  it('lee una lista de clase con cabecera', async () => {
    const bytes = fx('lista.xlsx')
    expect(pareceXlsx(bytes)).toBe(true)
    const filas = await leerXlsx(bytes)
    expect(filas[0]).toEqual(['Nombre', 'Apellidos', 'Curso'])
    expect(nombresDeCsv(filas)).toEqual(['Sabela Pérez', 'Iker López', 'Antía Rey', 'Brais Souto'])
  })
  it('lee una matriz con números y marcas', async () => {
    const m = matrizDeCsv(await leerXlsx(fx('matriz.xlsx')))
    expect(m.nombres).toEqual(['Ana', 'Bea', 'Cai'])
    expect(m.elecciones).toEqual([{ de: 'Ana', a: 'Bea' }, { de: 'Ana', a: 'Cai' }, { de: 'Bea', a: 'Ana' }])
  })
  it('rechaza lo que no es un ZIP', async () => {
    expect(pareceXlsx(new TextEncoder().encode('hola'))).toBe(false)
    await expect(leerXlsx(new TextEncoder().encode('no es un zip, de verdad que no'))).rejects.toThrow(/ZIP/)
  })
})
