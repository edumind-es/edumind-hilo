import { esquemaToma } from '../esquemas'
import { INSTRUMENTOS } from './index'

const ahora = '2026-09-06T10:00:00.000Z'
describe('catálogo de instrumentos', () => {
  it('cada instrumento tiene referencia y produce una toma válida en sus etapas', () => {
    for (const ins of INSTRUMENTOS) {
      expect(ins.referencia.length, ins.id).toBeGreaterThan(20)
      expect(ins.etapas.length, ins.id).toBeGreaterThan(0)
      for (const etapa of ins.etapas) {
        const toma = { id: 't', created_at: ahora, updated_at: ahora, deleted_at: null, grupo_id: 'g', titulo: ins.nombre, etapa, idioma: 'es', situaciones: ins.situaciones, preguntas: ins.preguntas, max_elecciones: ins.max_elecciones, negativas: ins.negativas, estado: 'abierta', inicio: ahora, fin: null }
        const r = esquemaToma.safeParse(toma)
        expect(r.success, `${ins.id} / ${etapa}: ${r.success ? '' : JSON.stringify(r.error.issues)}`).toBe(true)
      }
    }
  })
  it('los que necesitan negativas solo se ofrecen en secundaria', () => {
    for (const ins of INSTRUMENTOS.filter(i => i.negativas)) expect(ins.etapas).toEqual(['secundaria'])
  })
  it('las preguntas propias no pisan a las canónicas y se referencian', () => {
    for (const ins of INSTRUMENTOS) {
      for (const p of ins.preguntas) {
        expect(['equipo', 'recreo', 'ayuda', 'espejo', 'viaje']).not.toContain(p.id)
        expect(ins.situaciones).toContain(p.id)
      }
    }
  })
})
