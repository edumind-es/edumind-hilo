/** Modalidad D, recogida: los ficheros .hilo de la tarea, descifrados aquí con la clave privada del docente. */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { decodificarRespuestas } from '@edumind-hilo/nucleo'
import { obtenerOCrearClaves } from '@/db/claves'
import { useAlumnos, useParticipaciones, useToma } from '@/db/hooks'
import { registrarDesdeCodigos } from '@/db/recoger'
import { descifrarSobre, esSobre } from '@/lib/clavePublica'

interface Linea {
  nombre: string
  texto: string
  ok: boolean
}

export function Entregas() {
  const { id } = useParams()
  const toma = useToma(id)
  const alumnos = useAlumnos(toma?.grupo_id)
  const participaciones = useParticipaciones(id)
  const [lineas, setLineas] = useState<Linea[]>([])
  const [pegado, setPegado] = useState('')

  async function procesarTexto(nombre: string, texto: string) {
    if (!toma || !alumnos) return
    try {
      let bruto: unknown
      try {
        bruto = JSON.parse(texto)
      } catch {
        throw new Error('No es un fichero de entrega.')
      }
      if (!esSobre(bruto)) throw new Error('No es una entrega de Hilo.')
      if (bruto.toma !== toma.id) throw new Error('Es de otra toma.')
      const claves = await obtenerOCrearClaves()
      const claro = await descifrarSobre(bruto, claves.privada)
      const r = decodificarRespuestas(claro)
      const reg = await registrarDesdeCodigos({ toma, alumnos, de: r.de, elecciones: r.elecciones, origen: 'fichero' })
      setLineas(l => [{ nombre, texto: `${reg.alumno.nombre}: ${reg.elecciones} elecciones registradas`, ok: true }, ...l])
    } catch (e) {
      setLineas(l => [{ nombre, texto: e instanceof Error ? e.message : 'Error', ok: false }, ...l])
    }
  }

  async function procesarFicheros(lista: FileList | null) {
    if (!lista) return
    for (const f of Array.from(lista)) await procesarTexto(f.name, await f.text())
  }

  if (toma === undefined) return <p className="mono">Cargando…</p>
  if (!toma || !alumnos) return <p>Esta toma no existe.</p>

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow"><Link to={`/toma/${toma.id}`} style={{ textDecoration: 'none' }}>{toma.titulo}</Link> · entregas</p>
          <h1>Recoger<br /><span className="light">las entregas</span></h1>
          <p className="lede">Descarga las entregas de la tarea (ficheros .txt, o el texto pegado si la tarea era de texto en línea) y súbelas aquí de golpe. Se abren con la clave privada de este dispositivo y se registran. Los repetidos se descartan.</p>
        </div>
      </div>
      {toma.estado !== 'abierta' && <p className="error">La toma está cerrada: no se registrará nada.</p>}

      <dl className="cifras">
        <div><dt>Han respondido</dt><dd>{participaciones?.length ?? 0}<small>de {alumnos.length}</small></dd></div>
        <div><dt>Registradas ahora</dt><dd>{lineas.filter(l => l.ok).length}</dd></div>
      </dl>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">01</span><h2>Ficheros</h2></div>
        <label className="zona-soltar" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void procesarFicheros(e.dataTransfer.files) }}>
          <span>Arrastra aquí los ficheros de respuesta (<b>.txt</b>) o pulsa para elegirlos</span>
          <input type="file" multiple style={{ display: 'none' }} onChange={e => { void procesarFicheros(e.target.files); e.target.value = '' }} />
        </label>
        {lineas.length > 0 && (
          <ul className="rules">
            {lineas.map((l, i) => <li key={i}><span className="dash">{l.ok ? '✓' : '×'}</span><span className="crece">{l.texto}</span><span className="meta">{l.nombre}</span></li>)}
          </ul>
        )}
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">02</span><h2>Pegar</h2></div>
        <form onSubmit={e => { e.preventDefault(); void procesarTexto('pegado', pegado.trim()); setPegado('') }}>
          <label className="campo"><span>Texto de una entrega (empieza por {'{"formato":"hilo-respuesta"'})</span><textarea value={pegado} onChange={e => setPegado(e.target.value)} /></label>
          <button type="submit" className="btn pequeno">Registrar</button>
        </form>
      </section>
    </>
  )
}
