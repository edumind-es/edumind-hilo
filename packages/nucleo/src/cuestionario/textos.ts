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

const en: Cuestionario = {
  inicial: {
    equipo: { pregunta: 'We are going to do something in teams. Who do you want to be with?', ayuda: 'Tap anyone you like.' },
    recreo: { pregunta: 'At playtime, who do you play with?', ayuda: 'Tap anyone you like.' },
    ayuda: { pregunta: 'If you feel sad, who do you tell?', ayuda: 'Tap anyone you like.' },
    espejo: { pregunta: 'Who do you think wants you on their team?', ayuda: 'Tap anyone you like.' },
    viaje: { pregunta: 'If we go on a trip, who do you want to go with?', ayuda: 'Tap anyone you like.' },
  },
  primaria: {
    equipo: { pregunta: 'Tomorrow we start a team project. Who would you like to be in a team with?', ayuda: 'There are no right or wrong answers.' },
    recreo: { pregunta: 'A long break, nothing organised. Who would you like to spend it with?', ayuda: 'There are no right or wrong answers.' },
    ayuda: { pregunta: 'If you had a problem in class, who in the class would you tell?', ayuda: 'There are no right or wrong answers.' },
    espejo: { pregunta: 'If the others chose the teams, who do you think would choose you?', ayuda: 'Think about who would choose you.' },
    viaje: { pregunta: 'On a two-day trip, who would you share a room with?', ayuda: 'There are no right or wrong answers.' },
  },
  secundaria: {
    equipo: { pregunta: 'A team project starts tomorrow. Who would you like to work with?', ayuda: 'Only your teachers will see your answers.', negativa: 'And if you could choose, who would you rather not be in that team with?' },
    recreo: { pregunta: 'Some free time, nothing organised. Who would you like to spend it with?', ayuda: 'Only your teachers will see your answers.', negativa: 'Who would you rather not spend it with?' },
    ayuda: { pregunta: 'If you had a problem, who in the class would you tell?', ayuda: 'Only your teachers will see your answers.' },
    espejo: { pregunta: 'If the others chose the teams, who do you think would choose you?', ayuda: 'Think about who would choose you.' },
    viaje: { pregunta: 'On a two-day trip, who would you share a room with?', ayuda: 'Only your teachers will see your answers.', negativa: 'Who would you rather not share it with?' },
  },
}

export const CUESTIONARIOS: Record<Idioma, Cuestionario> = { es, gl, en }

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
  codigo: string
  codigoMal: string
  subir: (fichero: string) => string
  descargarOtraVez: string
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
    codigo: 'Escribe tu código',
    codigoMal: 'Ese código no es de esta clase. Míralo bien.',
    subir: f => `Se ha descargado el fichero ${f}. Súbelo a la tarea para entregar.`,
    descargarOtraVez: 'Descargar otra vez',
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
    codigo: 'Escribe o teu código',
    codigoMal: 'Ese código non é desta clase. Mírao ben.',
    subir: f => `Descargouse o ficheiro ${f}. Súbeo á tarefa para entregar.`,
    descargarOtraVez: 'Descargar outra vez',
  },
  en: {
    titulo: 'My team',
    paso: (n, t) => `Question ${n} of ${t}`,
    limite: n => (n === 1 ? 'You can choose one person.' : `You can choose up to ${n}.`),
    contador: (n, max) => `You chose ${n} of ${max}`,
    siguiente: 'Next',
    terminar: 'Finish',
    escuchar: 'Listen to the question',
    sinEleccion: 'You have not chosen anyone.',
    confirmarSinEleccion: 'Skip without choosing',
    seguirEligiendo: 'Go back and choose',
    graciasTitulo: 'Thank you. All done.',
    graciasTexto: 'You can hand the device back.',
    quienEres: 'Who are you?',
    entregar: 'Show this code to your teacher to hand in.',
    siguientePersona: 'Handed in',
    codigo: 'Type your code',
    codigoMal: 'That code is not from this class. Check it again.',
    subir: f => `The file ${f} has been downloaded. Upload it to the assignment to hand in.`,
    descargarOtraVez: 'Download again',
  },
}
