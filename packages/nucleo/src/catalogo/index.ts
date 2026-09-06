/**
 * Catálogo de instrumentos sociométricos con referencia científica, adaptados
 * al formato de Hilo (nominaciones por situación, sin motivo, sin ranking).
 *
 * Cada instrumento se carga en una toma como punto de partida y el docente
 * puede retocarlo. Los que rompen la asepsia por defecto (nombran la amistad,
 * o piden rechazos) lo dicen en `advertencias`, y las negativas siguen
 * bloqueadas fuera de secundaria por el esquema, venga de donde venga.
 *
 * Textos en castellano; en gallego e inglés se muestran tal cual hasta que se
 * traduzcan (el docente puede editarlos en la toma).
 *
 * Las referencias se comprobaron una a una contra fichas de editorial,
 * catálogo o base de datos bibliográfica el 6 de septiembre de 2026 (ver
 * docs/EVALUACION.md, «Referencias del catálogo»). Lo que no se pudo
 * confirmar no se cita.
 */
import type { Etapa, PreguntaToma, Situacion } from '../tipos'

export interface Instrumento {
  id: string
  nombre: string
  autores: string
  anio: string
  referencia: string
  resumen: string
  etapas: Etapa[]
  situaciones: Situacion[]
  preguntas: PreguntaToma[]
  max_elecciones: number
  negativas: boolean
  advertencias: string[]
}

export const INSTRUMENTOS: Instrumento[] = [
  {
    id: 'hilo-basico',
    nombre: 'Hilo · situaciones por defecto',
    autores: 'Luis Vilela Acuña (a partir de Moreno, 1934, y de la sociometría escolar española)',
    anio: '2026',
    referencia: 'Moreno, J. L. (1934). Who shall survive? A new approach to the problem of human interrelations. Nervous and Mental Disease Publishing Co. · Arruga i Valeri, A. (1974). Introducción al test sociométrico. Herder.',
    resumen: 'Nominaciones positivas por situación concreta (equipo, recreo, ayuda, viaje) más una pregunta de percepción (espejo). Redacción aséptica: verbo de futuro, situación, ningún adjetivo sobre las personas.',
    etapas: ['inicial', 'primaria', 'secundaria'],
    situaciones: ['equipo', 'recreo', 'ayuda', 'espejo'],
    preguntas: [],
    max_elecciones: 3,
    negativas: false,
    advertencias: [],
  },
  {
    id: 'moreno-criterios',
    nombre: 'Test sociométrico de Moreno · criterios de trabajo y ocio',
    autores: 'Moreno, J. L.',
    anio: '1934',
    referencia: 'Moreno, J. L. (1934). Who shall survive? A new approach to the problem of human interrelations. Nervous and Mental Disease Publishing Co.',
    resumen: 'El instrumento original: elecciones por criterio (con quién harías X), con posibilidad de rechazos. Aquí, dos criterios de trabajo y dos de ocio, más percepción de elección. Los rechazos solo en secundaria y con decisión expresa.',
    etapas: ['primaria', 'secundaria'],
    situaciones: ['equipo', 'pmesa', 'recreo', 'viaje', 'espejo'],
    preguntas: [{ id: 'pmesa', etiqueta: 'Mesa', pregunta: 'Si pudieras elegir con quién sentarte en clase, ¿a quién elegirías?', ayuda: 'No hay respuestas buenas ni malas.', negativa: '¿Con quién preferirías no sentarte?', tipo: 'preferencia' }],
    max_elecciones: 3,
    negativas: false,
    advertencias: ['El instrumento original incluye rechazos. Se cargan sin negativas; en secundaria puedes activarlas.'],
  },
  {
    id: 'coie-dodge',
    nombre: 'Nominaciones «con quién más / con quién menos» · tipos sociométricos',
    autores: 'Coie, J. D., Dodge, K. A. y Coppotelli, H.',
    anio: '1982',
    referencia: 'Coie, J. D., Dodge, K. A. y Coppotelli, H. (1982). Dimensions and types of social status: A cross-age perspective. Developmental Psychology, 18(4), 557-570. https://doi.org/10.1037/0012-1649.18.4.557',
    resumen: 'Tres nominaciones positivas y tres negativas sobre un criterio general de preferencia; de ahí salen preferencia e impacto social y los cinco tipos (popular, rechazado, ignorado, controvertido, promedio). Aquí el criterio se concreta en situaciones para no preguntar «con quién te gusta estar» en abstracto.',
    etapas: ['secundaria'],
    situaciones: ['equipo', 'recreo', 'espejo'],
    preguntas: [],
    max_elecciones: 3,
    negativas: true,
    advertencias: ['Requiere nominaciones negativas: solo en secundaria y adultos, con acuerdo del equipo. Los tipos son una foto, no un diagnóstico.'],
  },
  {
    id: 'percepcion-sociometrica',
    nombre: 'Percepción sociométrica · «adivina quién te elige»',
    autores: 'Arruga i Valeri, A.; González Álvarez, J.',
    anio: '1974 · 1990',
    referencia: 'Arruga i Valeri, A. (1974). Introducción al test sociométrico. Herder. · González Álvarez, J. (1990). Sociometria per ordinador: el test sociomètric. Generalitat Valenciana. ISBN 84-7890-081-0.',
    resumen: 'La tradición española del test sociométrico añade a las elecciones la percepción: quién crees que te elige. El ajuste entre lo percibido y lo real es un indicador de integración y de realismo social. Dos situaciones de preferencia y dos de percepción (una por cada preferencia).',
    etapas: ['primaria', 'secundaria'],
    situaciones: ['equipo', 'pespeq', 'recreo', 'pesprec'],
    preguntas: [
      { id: 'pespeq', etiqueta: 'Espejo equipo', pregunta: 'Si el equipo lo eligieran los demás, ¿quién crees que te elegiría a ti?', ayuda: 'Piensa en quién te elegiría.', tipo: 'percepcion' },
      { id: 'pesprec', etiqueta: 'Espejo recreo', pregunta: '¿Quién crees que te elegiría para pasar el recreo?', ayuda: 'Piensa en quién te elegiría.', tipo: 'percepcion' },
    ],
    max_elecciones: 3,
    negativas: false,
    advertencias: [],
  },
  {
    id: 'amistad-reciproca',
    nombre: 'Nominación de amistad recíproca',
    autores: 'Bukowski, W. M., Newcomb, A. F. y Hartup, W. W.; Cillessen, A. H. N.',
    anio: '1996 · 2009',
    referencia: 'Bukowski, W. M., Newcomb, A. F. y Hartup, W. W. (Eds.) (1996). The company they keep: Friendships in childhood and adolescence. Cambridge University Press. · Cillessen, A. H. N. (2009). Sociometric methods. En K. H. Rubin, W. M. Bukowski y B. Laursen (Eds.), Handbook of peer interactions, relationships, and groups (pp. 82-99). Guilford Press.',
    resumen: 'Pregunta directamente por los amigos; una amistad cuenta cuando es recíproca. Es el instrumento estándar de la investigación sobre amistad, pero nombra la relación de forma explícita.',
    etapas: ['primaria', 'secundaria'],
    situaciones: ['pamigos', 'espejo'],
    preguntas: [{ id: 'pamigos', etiqueta: 'Amistad', pregunta: '¿Quiénes son tus amigos o amigas de la clase?', ayuda: 'Puedes elegir a quien quieras.', tipo: 'preferencia' }],
    max_elecciones: 5,
    negativas: false,
    advertencias: ['Nombra la amistad de forma explícita: rompe la asepsia por defecto de Hilo. Úsalo cuando el objetivo sea justamente la red de amistad y el grupo esté preparado.'],
  },
  {
    id: 'bull-s-sociometrico',
    nombre: 'Bull-S · bloque sociométrico',
    autores: 'Cerezo Ramírez, F.',
    anio: '2012',
    referencia: 'Cerezo Ramírez, F. (2012). Bull-S. Test de evaluación sociométrica de la violencia entre escolares. Manual de referencia (versión 2.2). COHS, Consultores en Ciencias Humanas / Grupo Albor-Cohs. ISBN 978-84-95180-63-6.',
    resumen: 'Del test Bull-S se carga solo el bloque sociométrico: elección y rechazo para una situación de trabajo y de ocio, más expectativa de elección y de rechazo. El bloque de atribución de conductas agresivas (quién pega, quién es cobarde) no se incluye: pide a los niños juzgar a sus compañeros, y eso no encaja en Hilo.',
    etapas: ['secundaria'],
    situaciones: ['equipo', 'recreo', 'espejo', 'pesprech'],
    preguntas: [{ id: 'pesprech', etiqueta: 'Espejo rechazo', pregunta: '¿Quién crees que preferiría no estar contigo en el equipo?', ayuda: 'Piensa en quién lo diría.', tipo: 'percepcion' }],
    max_elecciones: 3,
    negativas: true,
    advertencias: ['Requiere negativas y una pregunta de percepción de rechazo: solo en secundaria y con decisión expresa del equipo. Si lo que se busca es detectar acoso, este bloque señala, pero no diagnostica.'],
  },
  {
    id: 'cooperacion-aula',
    nombre: 'Trabajo cooperativo · formación de equipos',
    autores: 'Johnson, D. W., Johnson, R. T. y Holubec, E. J. (marco); adaptación de Luis Vilela Acuña',
    anio: '1999',
    referencia: 'Johnson, D. W., Johnson, R. T. y Holubec, E. J. (1999). El aprendizaje cooperativo en el aula. Paidós.',
    resumen: 'Pensado para formar equipos cooperativos heterogéneos: con quién trabajas bien, quién te explica bien, con quién te repartes tareas. Sin percepción ni negativas. Útil antes de un proyecto largo.',
    etapas: ['primaria', 'secundaria'],
    situaciones: ['equipo', 'pexplica', 'preparto'],
    preguntas: [
      { id: 'pexplica', etiqueta: 'Explica', pregunta: 'Cuando no entiendes algo, ¿a quién de la clase le pedirías que te lo explicara?', ayuda: 'No hay respuestas buenas ni malas.', tipo: 'preferencia' },
      { id: 'preparto', etiqueta: 'Reparto', pregunta: 'Para repartir tareas de un proyecto y cumplir plazos, ¿con quién te organizarías?', ayuda: 'No hay respuestas buenas ni malas.', tipo: 'preferencia' },
    ],
    max_elecciones: 3,
    negativas: false,
    advertencias: [],
  },
]

export function instrumento(id: string): Instrumento | undefined {
  return INSTRUMENTOS.find(i => i.id === id)
}
