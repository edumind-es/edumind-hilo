/**
 * Banco de situaciones. La calidad del sociograma se decide aquí: se
 * pregunta por situaciones concretas con verbo de futuro, nunca por
 * personas ni por adjetivos. Tres registros por edad, dos idiomas.
 *
 * La prueba `cuestionario.test.ts` vigila que ningún texto contenga las
 * palabras que convierten una preferencia en un juicio.
 */
import type { Etapa, Idioma, Situacion } from '../tipos'

export interface TextoSituacion {
  pregunta: string
  ayuda: string
  /** Solo se usa si la toma tiene negativas activadas (secundaria). */
  negativa?: string
}

export type Cuestionario = Record<Etapa, Record<Situacion, TextoSituacion>>

const es: Cuestionario = {
  inicial: {
    equipo: { pregunta: 'Vamos a hacer una cosa por equipos. ¿Con quién quieres estar?', ayuda: 'Toca a quien quieras.' },
    recreo: { pregunta: 'En el patio, ¿con quién juegas?', ayuda: 'Toca a quien quieras.' },
    ayuda: { pregunta: 'Si estás triste, ¿a quién se lo cuentas?', ayuda: 'Toca a quien quieras.' },
    espejo: { pregunta: '¿Quién crees que quiere estar contigo en su equipo?', ayuda: 'Toca a quien quieras.' },
    viaje: { pregunta: 'Si vamos de excursión, ¿con quién quieres ir?', ayuda: 'Toca a quien quieras.' },
  },
  primaria: {
    equipo: { pregunta: 'Mañana hacemos un proyecto por equipos. ¿Con quién te gustaría estar en el equipo?', ayuda: 'No hay respuestas buenas ni malas.' },
    recreo: { pregunta: 'Un recreo largo, sin nada organizado. ¿Con quién te apetece pasarlo?', ayuda: 'No hay respuestas buenas ni malas.' },
    ayuda: { pregunta: 'Si tuvieras un problema en clase, ¿a quién de la clase se lo contarías?', ayuda: 'No hay respuestas buenas ni malas.' },
    espejo: { pregunta: 'Si el equipo lo eligieran los demás, ¿quién crees que te elegiría a ti?', ayuda: 'Piensa en quién te elegiría.' },
    viaje: { pregunta: 'En una excursión de dos días, ¿con quién compartirías habitación?', ayuda: 'No hay respuestas buenas ni malas.' },
  },
  secundaria: {
    equipo: {
      pregunta: 'Mañana empieza un proyecto por equipos. ¿Con quién te gustaría estar?',
      ayuda: 'Nadie verá tus respuestas salvo el profesorado.',
      negativa: 'Y si pudieras elegir, ¿con quién preferirías no estar en ese equipo?',
    },
    recreo: {
      pregunta: 'Un rato libre, sin nada organizado. ¿Con quién te apetece pasarlo?',
      ayuda: 'Nadie verá tus respuestas salvo el profesorado.',
      negativa: '¿Con quién preferirías no pasarlo?',
    },
    ayuda: {
      pregunta: 'Si tuvieras un problema, ¿a quién de la clase se lo contarías?',
      ayuda: 'Nadie verá tus respuestas salvo el profesorado.',
    },
    espejo: { pregunta: 'Si el equipo lo eligieran los demás, ¿quién crees que te elegiría a ti?', ayuda: 'Piensa en quién te elegiría.' },
    viaje: {
      pregunta: 'En un viaje de dos días, ¿con quién compartirías habitación?',
      ayuda: 'Nadie verá tus respuestas salvo el profesorado.',
      negativa: '¿Con quién preferirías no compartirla?',
    },
  },
}

const gl: Cuestionario = {
  inicial: {
    equipo: { pregunta: 'Imos facer unha cousa por equipos. Con quen queres estar?', ayuda: 'Toca a quen queiras.' },
    recreo: { pregunta: 'No patio, con quen xogas?', ayuda: 'Toca a quen queiras.' },
    ayuda: { pregunta: 'Se estás triste, a quen llo contas?', ayuda: 'Toca a quen queiras.' },
    espejo: { pregunta: 'Quen cres que quere estar contigo no seu equipo?', ayuda: 'Toca a quen queiras.' },
    viaje: { pregunta: 'Se imos de excursión, con quen queres ir?', ayuda: 'Toca a quen queiras.' },
  },
  primaria: {
    equipo: { pregunta: 'Mañá facemos un proxecto por equipos. Con quen che gustaría estar no equipo?', ayuda: 'Non hai respostas boas nin malas.' },
    recreo: { pregunta: 'Un recreo longo, sen nada organizado. Con quen che apetece pasalo?', ayuda: 'Non hai respostas boas nin malas.' },
    ayuda: { pregunta: 'Se tiveses un problema na clase, a quen da clase llo contarías?', ayuda: 'Non hai respostas boas nin malas.' },
    espejo: { pregunta: 'Se o equipo o elixisen os demais, quen cres que te elixiría a ti?', ayuda: 'Pensa en quen te elixiría.' },
    viaje: { pregunta: 'Nunha excursión de dous días, con quen compartirías habitación?', ayuda: 'Non hai respostas boas nin malas.' },
  },
  secundaria: {
    equipo: {
      pregunta: 'Mañá empeza un proxecto por equipos. Con quen che gustaría estar?',
      ayuda: 'Ninguén verá as túas respostas agás o profesorado.',
      negativa: 'E se puideses elixir, con quen preferirías non estar nese equipo?',
    },
    recreo: {
      pregunta: 'Un anaco libre, sen nada organizado. Con quen che apetece pasalo?',
      ayuda: 'Ninguén verá as túas respostas agás o profesorado.',
      negativa: 'Con quen preferirías non pasalo?',
    },
    ayuda: {
      pregunta: 'Se tiveses un problema, a quen da clase llo contarías?',
      ayuda: 'Ninguén verá as túas respostas agás o profesorado.',
    },
    espejo: { pregunta: 'Se o equipo o elixisen os demais, quen cres que te elixiría a ti?', ayuda: 'Pensa en quen te elixiría.' },
    viaje: {
      pregunta: 'Nunha viaxe de dous días, con quen compartirías habitación?',
      ayuda: 'Ninguén verá as túas respostas agás o profesorado.',
      negativa: 'Con quen preferirías non compartila?',
    },
  },
}

export const CUESTIONARIOS: Record<Idioma, Cuestionario> = { es, gl }

/** Textos de la interfaz del alumnado. Sin la palabra «sociograma». */
export interface TextosAlumno {
  titulo: string
  paso: (n: number, total: number) => string
  limite: (n: number) => string
  contador: (n: number, max: number) => string
  siguiente: string
  terminar: string
  escuchar: string
  sinEleccion: string
  confirmarSinEleccion: string
  seguirEligiendo: string
  graciasTitulo: string
  graciasTexto: string
  quienEres: string
  entregar: string
  siguientePersona: string
}

export const TEXTOS_ALUMNO: Record<Idioma, TextosAlumno> = {
  es: {
    titulo: 'Mi equipo',
    paso: (n, t) => `Pregunta ${n} de ${t}`,
    limite: n => (n === 1 ? 'Puedes elegir a una persona.' : `Puedes elegir hasta ${n}.`),
    contador: (n, max) => `Has elegido ${n} de ${max}`,
    siguiente: 'Siguiente',
    terminar: 'Terminar',
    escuchar: 'Escuchar la pregunta',
    sinEleccion: 'No has elegido a nadie.',
    confirmarSinEleccion: 'Pasar sin elegir',
    seguirEligiendo: 'Volver a elegir',
    graciasTitulo: 'Gracias. Ya está.',
    graciasTexto: 'Puedes devolver el dispositivo.',
    quienEres: '¿Quién eres?',
    entregar: 'Enséñale este código a tu profe para entregar.',
    siguientePersona: 'Ya está entregado',
  },
  gl: {
    titulo: 'O meu equipo',
    paso: (n, t) => `Pregunta ${n} de ${t}`,
    limite: n => (n === 1 ? 'Podes elixir a unha persoa.' : `Podes elixir ata ${n}.`),
    contador: (n, max) => `Elixiches ${n} de ${max}`,
    siguiente: 'Seguinte',
    terminar: 'Rematar',
    escuchar: 'Escoitar a pregunta',
    sinEleccion: 'Non elixiches a ninguén.',
    confirmarSinEleccion: 'Pasar sen elixir',
    seguirEligiendo: 'Volver elixir',
    graciasTitulo: 'Grazas. Xa está.',
    graciasTexto: 'Podes devolver o dispositivo.',
    quienEres: 'Quen es?',
    entregar: 'Amósalle este código á túa profe para entregar.',
    siguientePersona: 'Xa está entregado',
  },
}
