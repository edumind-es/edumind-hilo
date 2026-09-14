import { eleccionesPorPaso } from './elecciones'

const pasos = [
  { situacion: 'trabajo', signo: 1 },
  { situacion: 'trabajo', signo: -1 },
  { situacion: 'juego', signo: 1 },
]

const respuestas = [
  { de_alumno: 'ana', a_alumno: 'luis', situacion: 'trabajo', signo: 1 },
  { de_alumno: 'ana', a_alumno: 'noa', situacion: 'trabajo', signo: 1 },
  { de_alumno: 'ana', a_alumno: 'iago', situacion: 'trabajo', signo: -1 },
  { de_alumno: 'ana', a_alumno: 'noa', situacion: 'juego', signo: 1 },
  { de_alumno: 'bea', a_alumno: 'ana', situacion: 'trabajo', signo: 1 },
]

describe('elecciones ya guardadas por paso', () => {
  it('reparte cada respuesta en su paso y deja fuera las de otros alumnos', () => {
    expect(eleccionesPorPaso(respuestas, pasos, 'ana')).toEqual([['luis', 'noa'], ['iago'], ['noa']])
  })
  it('separa el signo: una negativa no se cuela en la positiva de la misma situación', () => {
    const [positiva, negativa] = eleccionesPorPaso(respuestas, pasos, 'ana')
    expect(positiva).not.toContain('iago')
    expect(negativa).toEqual(['iago'])
  })
  it('un alumno sin respuestas da un paso vacío por cada pregunta', () => {
    expect(eleccionesPorPaso(respuestas, pasos, 'iago')).toEqual([[], [], []])
  })
  it('no repite un elegido duplicado en el mismo paso', () => {
    const dobles = [
      { de_alumno: 'ana', a_alumno: 'noa', situacion: 'juego', signo: 1 },
      { de_alumno: 'ana', a_alumno: 'noa', situacion: 'juego', signo: 1 },
    ]
    expect(eleccionesPorPaso(dobles, [{ situacion: 'juego', signo: 1 }], 'ana')).toEqual([['noa']])
  })
})
