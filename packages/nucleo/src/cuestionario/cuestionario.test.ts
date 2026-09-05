import { CUESTIONARIOS, TEXTOS_ALUMNO } from './textos'
import { MAX_ELECCIONES_POR_ETAPA, SITUACIONES_POR_ETAPA, negativasPermitidas, textoSituacion } from './index'
import { ETAPAS, IDIOMAS, SITUACIONES } from '../tipos'

// Palabras que convierten una preferencia en un juicio, o que le explican al
// alumno qué se está midiendo. Si aparecen, la pregunta está mal escrita.
const PROHIBIDAS = [/sociogram/i, /mejores? amig/i, /mellores? amig/i, /best friend/i, /por qu[eé]/i, /por que\b/i, /\bwhy\b/i, /odias/i, /\bhate\b/i, /cae[ns]? mal/i, /no te gusta/i, /non che gusta/i, /don.t like/i]

describe('banco de situaciones', () => {
  it('tiene texto para cada idioma, etapa y situación', () => {
    for (const idioma of IDIOMAS) for (const etapa of ETAPAS) for (const s of SITUACIONES) {
      const t = textoSituacion(idioma, etapa, s)
      expect(t.pregunta.length, `${idioma}/${etapa}/${s}`).toBeGreaterThan(10)
      expect(t.ayuda.length).toBeGreaterThan(3)
    }
  })

  it('no contiene palabras que señalen ni pidan motivo', () => {
    for (const idioma of IDIOMAS) for (const etapa of ETAPAS) for (const s of SITUACIONES) {
      const t = CUESTIONARIOS[idioma][etapa][s]
      for (const re of PROHIBIDAS) {
        expect(t.pregunta, `${idioma}/${etapa}/${s}`).not.toMatch(re)
        expect(t.ayuda).not.toMatch(re)
        if (t.negativa) expect(t.negativa).not.toMatch(re)
      }
    }
    for (const idioma of IDIOMAS) {
      expect(JSON.stringify(Object.values(TEXTOS_ALUMNO[idioma]).map(v => (typeof v === 'function' ? v(1, 2) : v)))).not.toMatch(/sociograma/i)
    }
  })

  it('las negativas solo existen en secundaria', () => {
    for (const idioma of IDIOMAS) {
      for (const s of SITUACIONES) {
        expect(CUESTIONARIOS[idioma].inicial[s].negativa).toBeUndefined()
        expect(CUESTIONARIOS[idioma].primaria[s].negativa).toBeUndefined()
      }
      expect(CUESTIONARIOS[idioma].secundaria.equipo.negativa).toBeDefined()
      // Nunca se pide «con quién no» en AYUDA ni en ESPEJO.
      expect(CUESTIONARIOS[idioma].secundaria.ayuda.negativa).toBeUndefined()
      expect(CUESTIONARIOS[idioma].secundaria.espejo.negativa).toBeUndefined()
    }
    expect(negativasPermitidas('inicial')).toBe(false)
    expect(negativasPermitidas('primaria')).toBe(false)
    expect(negativasPermitidas('secundaria')).toBe(true)
  })

  it('los conjuntos por etapa incluyen siempre ESPEJO y EQUIPO', () => {
    for (const etapa of ETAPAS) {
      expect(SITUACIONES_POR_ETAPA[etapa]).toContain('espejo')
      expect(SITUACIONES_POR_ETAPA[etapa]).toContain('equipo')
    }
    expect(MAX_ELECCIONES_POR_ETAPA).toEqual({ inicial: 2, primaria: 3, secundaria: 5 })
  })
})
