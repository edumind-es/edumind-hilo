// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { empaquetarSesion } from '@edumind-hilo/nucleo'
import { SesionAlumno } from './SesionAlumno'

afterEach(cleanup)

describe('página de la tablet (/s)', () => {
  it('lee la sesión del fragmento, lo borra del historial y no toca la red', async () => {
    const paquete = await empaquetarSesion({ toma: 't1', titulo: 'Toma', idioma: 'es', etapa: 'primaria', situaciones: ['equipo'], preguntas: [], maxElecciones: 2, negativas: false, alumnos: [['AB3DE', 'Sabela'], ['F2GH7', 'Iker'], ['K9M2N', 'Antía']] })
    history.replaceState(null, '', `/s#g=${paquete}`)
    const fetchEspia = vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('la tablet no debe hacer peticiones') })
    render(<SesionAlumno />)
    expect(await screen.findByText('¿Quién eres?')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sabela' })).toBeTruthy()
    expect(location.hash).toBe('')
    expect(location.pathname).toBe('/s')
    expect(fetchEspia).not.toHaveBeenCalled()
    expect(document.body.textContent).not.toMatch(/sociograma/i)
    fetchEspia.mockRestore()
  })
  it('sin fragmento no hay sesión', async () => {
    history.replaceState(null, '', '/s')
    render(<SesionAlumno />)
    expect(await screen.findByText('Sin sesión')).toBeTruthy()
  })
})
