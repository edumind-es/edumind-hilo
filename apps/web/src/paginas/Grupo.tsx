import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ETAPAS,
  ETIQUETA_ETAPA,
  ETIQUETA_SITUACION,
  MAX_ELECCIONES_POR_ETAPA,
  SITUACIONES,
  SITUACIONES_POR_ETAPA,
  negativasPermitidas,
  type Etapa,
  type Situacion,
} from '@edumind-hilo/nucleo'
import { actualizarAlumno, anadirAlumnos, anadirEvento, borrarAlumno, borrarGrupo, crearToma, tituloPorDefecto } from '@/db/consultas'
import { importarMatriz } from '@/db/importar'
import { useAlumnos, useEventos, useGrupo, useTomas } from '@/db/hooks'
import { fechaCorta, hoyIso } from '@/lib/fechas'

export function Grupo() {
  const { id } = useParams()
  const grupo = useGrupo(id)
  const alumnos = useAlumnos(id)
  const tomas = useTomas(id)
  const eventos = useEventos(id)
  const navegar = useNavigate()

  if (grupo === undefined) return <p className="mono">Cargando…</p>
  if (!grupo || grupo.deleted_at) return <p>Este grupo no existe. <Link to="/">Volver a los grupos</Link>.</p>

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow"><Link to="/" style={{ textDecoration: 'none' }}>Grupos</Link> · {grupo.curso}</p>
          <h1>{grupo.nombre}</h1>
          <p className="lede">{ETIQUETA_ETAPA[grupo.etapa]} · {alumnos?.length ?? 0} alumnos · {tomas?.length ?? 0} tomas</p>
        </div>
      </div>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">01</span><h2>Tomas</h2></div>
        {tomas && tomas.length > 0 && (
          <ul className="rules">
            {tomas.map(t => (
              <li key={t.id}>
                <span className="dash">—</span>
                <span className="crece">
                  <Link className="titulo" to={`/toma/${t.id}`}>{t.titulo}</Link><br />
                  <span className="meta">{fechaCorta(t.inicio)} · {t.situaciones.map(s => ETIQUETA_SITUACION[s]).join(' · ')} · máx. {t.max_elecciones}{t.negativas ? ' · con negativas' : ''}</span>
                </span>
                <span className={t.estado === 'abierta' ? 'stamp pendiente' : 'stamp cerrada'}>{t.estado}</span>
              </li>
            ))}
          </ul>
        )}
        <NuevaToma grupoEtapa={grupo.etapa} onCrear={async datos => {
          const tid = await crearToma(grupo, datos)
          navegar(`/toma/${tid}`)
        }} />
        <p className="no-imprimir" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {(tomas?.length ?? 0) >= 2 && <Link className="btn secundario pequeno" to={`/grupo/${grupo.id}/comparar`}>Comparar tomas</Link>}
          <label className="btn secundario pequeno" style={{ cursor: 'pointer' }}>
            Importar matriz CSV como toma
            <input type="file" accept=".csv,.tsv,.txt" style={{ display: 'none' }} onChange={async e => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f || !alumnos) return
              try {
                const tid = await importarMatriz(grupo, alumnos, await f.text(), `Importada: ${f.name}`)
                navegar(`/toma/${tid}`)
              } catch (err) {
                alert(err instanceof Error ? err.message : 'No se pudo importar la matriz.')
              }
            }} />
          </label>
        </p>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">02</span><h2>Alumnado</h2></div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Nombre</th><th>Código</th><th>NEAE</th><th className="no-imprimir"></th></tr></thead>
            <tbody>
              {alumnos?.map(a => (
                <tr key={a.id}>
                  <td>
                    <input type="text" defaultValue={a.nombre} aria-label={`Nombre de ${a.nombre}`} style={{ border: 0, background: 'transparent', padding: 0, maxWidth: 260 }}
                      onBlur={e => { const v = e.target.value.trim(); if (v && v !== a.nombre) void actualizarAlumno(a.id, { nombre: v }) }} />
                  </td>
                  <td className="k"><Link to={`/alumno/${a.id}`}>{a.codigo}</Link></td>
                  <td><input type="checkbox" checked={a.neae} aria-label={`NEAE de ${a.nombre}`} onChange={e => void actualizarAlumno(a.id, { neae: e.target.checked })} /></td>
                  <td className="no-imprimir" style={{ textAlign: 'right' }}>
                    <button type="button" className="enlace" onClick={() => { if (confirm(`¿Quitar a ${a.nombre} del grupo?`)) void borrarAlumno(a.id) }}>quitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AnadirAlumnos grupoId={grupo.id} />
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">03</span><h2>Eventos del grupo</h2></div>
        <p className="lede" style={{ marginTop: 0 }}>Cambios de sitio, llegadas, intervenciones. Se leen junto a las tomas para entender por qué cambia la trama.</p>
        {eventos && eventos.length > 0 && (
          <ul className="rules">
            {eventos.map(ev => (
              <li key={ev.id}><span className="dash">—</span><span className="crece">{ev.texto}</span><span className="meta">{ev.fecha}</span></li>
            ))}
          </ul>
        )}
        <NuevoEvento grupoId={grupo.id} />
      </section>

      <section className="sec no-imprimir">
        <div className="sec-head"><span className="sec-num">04</span><h2>Zona de cuidado</h2></div>
        <button type="button" className="btn peligro" onClick={async () => {
          if (prompt(`Para borrar el grupo «${grupo.nombre}» con sus tomas, escribe su nombre:`) === grupo.nombre) {
            await borrarGrupo(grupo.id)
            navegar('/')
          }
        }}>Borrar este grupo</button>
      </section>
    </>
  )
}

function NuevaToma({ grupoEtapa, onCrear }: { grupoEtapa: Etapa; onCrear: (d: { titulo: string; etapa: Etapa; situaciones: Situacion[]; max_elecciones: number; negativas: boolean }) => Promise<void> }) {
  const [abierto, setAbierto] = useState(false)
  const [titulo, setTitulo] = useState(tituloPorDefecto())
  const [etapa, setEtapa] = useState<Etapa>(grupoEtapa)
  const [situaciones, setSituaciones] = useState<Situacion[]>(SITUACIONES_POR_ETAPA[grupoEtapa])
  const [max, setMax] = useState(MAX_ELECCIONES_POR_ETAPA[grupoEtapa])
  const [negativas, setNegativas] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cambiarEtapa(e: Etapa) {
    setEtapa(e)
    setSituaciones(SITUACIONES_POR_ETAPA[e])
    setMax(MAX_ELECCIONES_POR_ETAPA[e])
    if (!negativasPermitidas(e)) setNegativas(false)
  }

  async function enviar(ev: FormEvent) {
    ev.preventDefault()
    setError(null)
    try {
      await onCrear({ titulo, etapa, situaciones: SITUACIONES.filter(s => situaciones.includes(s)), max_elecciones: max, negativas })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la toma.')
    }
  }

  if (!abierto) return <p className="no-imprimir"><button type="button" className="btn" onClick={() => setAbierto(true)}>Nueva toma</button></p>

  return (
    <form onSubmit={enviar} className="panel no-imprimir" style={{ marginTop: 10 }}>
      <div className="fila">
        <label className="campo"><span>Título</span><input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} /></label>
        <label className="campo"><span>Registro</span>
          <select value={etapa} onChange={e => cambiarEtapa(e.target.value as Etapa)}>
            {ETAPAS.map(x => <option key={x} value={x}>{ETIQUETA_ETAPA[x]}</option>)}
          </select>
        </label>
        <label className="campo"><span>Máximo de elecciones</span><input type="number" min={1} max={10} value={max} onChange={e => setMax(Number(e.target.value))} /></label>
      </div>
      <div className="campo"><span>Situaciones</span>
        <div className="opciones">
          {SITUACIONES.map(s => {
            const on = situaciones.includes(s)
            return (
              <label key={s} className={on ? 'opcion on' : 'opcion'}>
                <input type="checkbox" checked={on} onChange={() => setSituaciones(on ? situaciones.filter(x => x !== s) : [...situaciones, s])} />
                {ETIQUETA_SITUACION[s]}
              </label>
            )
          })}
        </div>
        <span className="aviso">Espejo mide percepción («¿quién crees que te elegiría?») y da el ajuste perceptivo. No cuenta como elección recibida.</span>
      </div>
      {negativasPermitidas(etapa) && (
        <div className="campo">
          <label className="opcion" style={{ maxWidth: 'fit-content' }}>
            <input type="checkbox" checked={negativas} onChange={e => setNegativas(e.target.checked)} />
            Activar nominaciones negativas («¿con quién preferirías no…?»)
          </label>
          {negativas && (
            <div className="note alert"><span className="tag">Decisión expresa</span>
              <p>Las negativas dan los tipos de Coie y Dodge (popular, rechazado, ignorado, controvertido, promedio). Son una foto, no un diagnóstico, y conviene acordarlo con el equipo antes de pasar la toma.</p>
            </div>
          )}
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn" disabled={situaciones.length === 0}>Abrir la toma</button>
        <button type="button" className="btn secundario" onClick={() => setAbierto(false)}>Cancelar</button>
      </div>
    </form>
  )
}

function AnadirAlumnos({ grupoId }: { grupoId: string }) {
  const [lista, setLista] = useState('')
  const [abierto, setAbierto] = useState(false)
  if (!abierto) return <p className="no-imprimir"><button type="button" className="btn secundario pequeno" onClick={() => setAbierto(true)}>Añadir alumnos</button></p>
  return (
    <form className="no-imprimir" onSubmit={async e => { e.preventDefault(); await anadirAlumnos(grupoId, lista); setLista(''); setAbierto(false) }}>
      <label className="campo"><span>Nombres nuevos</span><textarea value={lista} onChange={e => setLista(e.target.value)} /></label>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn pequeno">Añadir</button>
        <button type="button" className="btn secundario pequeno" onClick={() => setAbierto(false)}>Cancelar</button>
      </div>
    </form>
  )
}

function NuevoEvento({ grupoId }: { grupoId: string }) {
  const [fecha, setFecha] = useState(hoyIso())
  const [texto, setTexto] = useState('')
  return (
    <form className="fila no-imprimir" onSubmit={async e => { e.preventDefault(); if (!texto.trim()) return; await anadirEvento(grupoId, fecha, texto); setTexto('') }}>
      <label className="campo" style={{ flex: '0 0 170px' }}><span>Fecha</span><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></label>
      <label className="campo" style={{ flex: '1 1 300px' }}><span>Qué ha pasado</span><input type="text" value={texto} onChange={e => setTexto(e.target.value)} placeholder="Cambio de sitios por parejas" /></label>
      <div className="campo"><span>&nbsp;</span><button type="submit" className="btn pequeno">Anotar</button></div>
    </form>
  )
}
