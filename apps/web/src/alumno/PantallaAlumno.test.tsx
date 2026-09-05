// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PantallaAlumno, construirPasos } from './PantallaAlumno'

const personas = [
  { id: 'yo', nombre: 'Sabela' },
  { id: 'b', nombre: 'Iker' },
  { id: 'c', nombre: 'Antía' },
  { id: 'd', nombre: 'Brais' },
  { id: 'e', nombre: 'Uxía' },
]

function montar(extra: Partial<Parameters<typeof PantallaAlumno>[0]> = {}) {
  const onTerminar = vi.fn()
  render(
    <PantallaAlumno
      idioma="es"
      etapa="primaria"
      situaciones={['equipo', 'espejo']}
      maxElecciones={2}
      negativas={false}
      yo={personas[0]!}
      companeros={personas}
      onTerminar={onTerminar}
      {...extra}
    />,
  )
  return onTerminar
}

afterEach(cleanup)

describe('pantalla del alumnado', () => {
  it('no muestra al propio alumno ni la palabra sociograma', () => {
    montar()
    expect(screen.queryByRole('button', { name: 'Sabela' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Iker' })).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/sociograma/i)
  })

  it('no deja pasar del máximo y recoge las elecciones al terminar', async () => {
    const usuario = userEvent.setup()
    const onTerminar = montar()
    await usuario.click(screen.getByRole('button', { name: 'Iker' }))
    await usuario.click(screen.getByRole('button', { name: 'Antía' }))
    expect(screen.getByRole('button', { name: 'Brais' })).toHaveProperty('disabled', true)
    expect(screen.getByText('Has elegido 2 de 2')).toBeTruthy()
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }))
    // Segunda pregunta (espejo): una elección y terminar.
    await usuario.click(screen.getByRole('button', { name: 'Uxía' }))
    await usuario.click(screen.getByRole('button', { name: 'Terminar' }))
    expect(onTerminar).toHaveBeenCalledTimes(1)
    const elecciones = onTerminar.mock.calls[0]![0]
    expect(elecciones).toEqual(
      expect.arrayContaining([
        { situacion: 'equipo', a_alumno: 'b', signo: 1 },
        { situacion: 'equipo', a_alumno: 'c', signo: 1 },
        { situacion: 'espejo', a_alumno: 'e', signo: 1 },
      ]),
    )
    expect(elecciones).toHaveLength(3)
  })

  it('pasar sin elegir exige confirmación', async () => {
    const usuario = userEvent.setup()
    const onTerminar = montar({ situaciones: ['equipo'] })
    await usuario.click(screen.getByRole('button', { name: 'Terminar' }))
    expect(onTerminar).not.toHaveBeenCalled()
    expect(screen.getByText('No has elegido a nadie.')).toBeTruthy()
    await usuario.click(screen.getByRole('button', { name: 'Pasar sin elegir' }))
    expect(onTerminar).toHaveBeenCalledWith([])
  })

  it('las negativas solo generan pasos en secundaria', () => {
    expect(construirPasos({ idioma: 'es', etapa: 'primaria', situaciones: ['equipo'], negativas: true })).toHaveLength(1)
    const sec = construirPasos({ idioma: 'es', etapa: 'secundaria', situaciones: ['equipo', 'ayuda'], negativas: true })
    expect(sec.map(p => p.signo)).toEqual([1, -1, 1])
  })
})
