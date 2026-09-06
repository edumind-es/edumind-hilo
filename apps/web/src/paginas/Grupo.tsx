import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ETAPAS,
  ETIQUETA_ETAPA,
  ETIQUETA_SITUACION,
  INSTRUMENTOS,
  MAX_ELECCIONES_POR_ETAPA,
  SITUACIONES,
  SITUACIONES_POR_ETAPA,
  etiquetaSituacion,
  idPreguntaNuevo,
  instrumento,
  negativasPermitidas,
  type Etapa,
  type Idioma,
  type PreguntaToma,
  type Situacion,
  type SituacionCanonica,
} from '@edumind-hilo/nucleo'
import { actualizarAlumno, anadirAlumnos, anadirEvento, borrarAlumno, borrarGrupo, crearToma, guardarCuestionario, tituloPorDefecto } from '@/db/consultas'
import { filasDeFichero, importarMatriz } from '@/db/importar'
import { useAlumnos, useCuestionarios, useEventos, useGrupo, useTomas } from '@/db/hooks'
import { fechaCorta, hoyIso } from '@/lib/fechas'
import { useT } from '@/i18n'

export function Grupo() {
  const tr = useT()
  const { id } = useParams()
  const grupo = useGrupo(id)
  const alumnos = useAlumnos(id)
  const tomas = useTomas(id)
  const eventos = useEventos(id)
  const navegar = useNavigate()

  if (grupo === undefined) return <p className="mono">{tr("Cargando…")}</p>
  if (!grupo || grupo.deleted_at) return <p>{tr("Este grupo no existe.")} <Link to="/">{tr("Volver a los grupos")}</Link>.</p>

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow"><Link to="/" style={{ textDecoration: 'none' }}>{tr("Grupos")}</Link> · {grupo.curso}</p>
          <h1>{grupo.nombre}</h1>
          <p className="lede">{tr(ETIQUETA_ETAPA[grupo.etapa])} · {alumnos?.length ?? 0} alumnos · {tomas?.length ?? 0} tomas</p>
        </div>
      </div>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">01</span><h2>{tr("Tomas")}</h2></div>
        {tomas && tomas.length > 0 && (
          <ul className="rules">
            {tomas.map(t => (
              <li key={t.id}>
                <span className="dash">—</span>
                <span className="crece">
                  <Link className="titulo" to={`/toma/${t.id}`}>{t.titulo}</Link><br />
                  <span className="meta">{fechaCorta(t.inicio)} · {t.situaciones.map(s => tr(etiquetaSituacion(s, t.preguntas))).join(' · ')} · máx. {t.max_elecciones}{t.negativas ? ' · con negativas' : ''}</span>
                </span>
                <span className={t.estado === 'abierta' ? 'stamp pendiente' : 'stamp cerrada'}>{tr(t.estado)}</span>
              </li>
            ))}
          </ul>
        )}
        <NuevaToma grupoEtapa={grupo.etapa} grupoIdioma={grupo.idioma} onCrear={async datos => {
          const tid = await crearToma(grupo, datos)
          navegar(`/toma/${tid}`)
        }} />
        <p className="no-imprimir" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {(tomas?.length ?? 0) >= 2 && <Link className="btn secundario pequeno" to={`/grupo/${grupo.id}/comparar`}>{tr("Comparar tomas")}</Link>}
          <label className="btn secundario pequeno" style={{ cursor: 'pointer' }}>
            Importar matriz (XLSX o CSV) como toma
            <input type="file" accept=".csv,.tsv,.txt,.xlsx" style={{ display: 'none' }} onChange={async e => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f || !alumnos) return
              try {
                const tid = await importarMatriz(grupo, alumnos, await filasDeFichero(f), `Importada: ${f.name}`)
                navegar(`/toma/${tid}`)
              } catch (err) {
                alert(err instanceof Error ? tr(err.message) : 'No se pudo importar la matriz.')
              }
            }} />
          </label>
        </p>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">02</span><h2>{tr("Alumnado")}</h2></div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>{tr("Nombre")}</th><th>{tr("Código")}</th><th>{tr("NEAE")}</th><th className="no-imprimir"></th></tr></thead>
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
                    <button type="button" className="enlace" onClick={() => { if (confirm(tr('¿Quitar a {nombre} del grupo?', { nombre: a.nombre }))) void borrarAlumno(a.id) }}>{tr("quitar")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AnadirAlumnos grupoId={grupo.id} />
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">03</span><h2>{tr("Eventos del grupo")}</h2></div>
        <p className="lede" style={{ marginTop: 0 }}>{tr("Cambios de sitio, llegadas, intervenciones. Se leen junto a las tomas para entender por qué cambia la trama.")}</p>
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
        <div className="sec-head"><span className="sec-num">04</span><h2>{tr("Zona de cuidado")}</h2></div>
        <button type="button" className="btn peligro" onClick={async () => {
          if (prompt(tr('Para borrar el grupo «{nombre}» con sus tomas, escribe su nombre:', { nombre: grupo.nombre })) === grupo.nombre) {
            await borrarGrupo(grupo.id)
            navegar('/')
          }
        }}>{tr("Borrar este grupo")}</button>
      </section>
    </>
  )
}

function NuevaToma({ grupoEtapa, grupoIdioma, onCrear }: { grupoEtapa: Etapa; grupoIdioma: Idioma; onCrear: (d: { titulo: string; etapa: Etapa; situaciones: Situacion[]; preguntas: PreguntaToma[]; max_elecciones: number; negativas: boolean }) => Promise<void> }) {
  const tr = useT()
  const cuestionarios = useCuestionarios()
  const [abierto, setAbierto] = useState(false)
  const [titulo, setTitulo] = useState(tituloPorDefecto())
  const [etapa, setEtapa] = useState<Etapa>(grupoEtapa)
  const [fuente, setFuente] = useState('defecto')
  const [canonicas, setCanonicas] = useState<SituacionCanonica[]>(SITUACIONES_POR_ETAPA[grupoEtapa])
  const [preguntas, setPreguntas] = useState<PreguntaToma[]>([])
  const [max, setMax] = useState(MAX_ELECCIONES_POR_ETAPA[grupoEtapa])
  const [negativas, setNegativas] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string[]>([])

  const situaciones: Situacion[] = [...SITUACIONES.filter(c => canonicas.includes(c)), ...preguntas.map(p => p.id)]

  function cambiarEtapa(e: Etapa) {
    setEtapa(e)
    if (fuente === 'defecto') {
      setCanonicas(SITUACIONES_POR_ETAPA[e])
      setMax(MAX_ELECCIONES_POR_ETAPA[e])
    }
    if (!negativasPermitidas(e)) setNegativas(false)
  }

  function cargar(datos: { situaciones: Situacion[]; preguntas: PreguntaToma[]; max_elecciones: number; negativas: boolean; advertencias?: string[] }) {
    setCanonicas(SITUACIONES.filter(c => datos.situaciones.includes(c)))
    setPreguntas(datos.preguntas.map(p => ({ ...p })))
    setMax(datos.max_elecciones)
    setNegativas(datos.negativas && negativasPermitidas(etapa))
    setAviso(datos.advertencias ?? [])
  }

  function cambiarFuente(v: string) {
    setFuente(v)
    if (v === 'defecto') {
      cargar({ situaciones: SITUACIONES_POR_ETAPA[etapa], preguntas: [], max_elecciones: MAX_ELECCIONES_POR_ETAPA[etapa], negativas: false })
      return
    }
    if (v.startsWith('cat:')) {
      const ins = instrumento(v.slice(4))
      if (ins) cargar(ins)
      return
    }
    const c = cuestionarios?.find(x => x.id === v.slice(4))
    if (c) cargar(c)
  }

  function editar(id: string, cambios: Partial<PreguntaToma>) {
    setPreguntas(prev => prev.map(p => (p.id === id ? { ...p, ...cambios } : p)))
  }

  async function guardarComoMio() {
    const nombre = prompt(tr('Nombre del cuestionario'))
    if (!nombre?.trim()) return
    try {
      await guardarCuestionario({ nombre: nombre.trim(), etapa, idioma: grupoIdioma, descripcion: '', situaciones, preguntas, max_elecciones: max, negativas, origen: fuente.startsWith('cat:') ? 'catalogo' : 'propio', referencia: fuente.startsWith('cat:') ? (instrumento(fuente.slice(4))?.referencia ?? '') : '' })
      setError(null)
      setAviso([tr('Cuestionario guardado en «Mis cuestionarios».')])
    } catch (err) {
      setError(err instanceof Error ? tr(err.message) : 'Error')
    }
  }

  async function enviar(ev: FormEvent) {
    ev.preventDefault()
    setError(null)
    try {
      await onCrear({ titulo, etapa, situaciones, preguntas, max_elecciones: max, negativas })
    } catch (err) {
      setError(err instanceof Error ? tr(err.message) : tr('No se pudo crear la toma.'))
    }
  }

  if (!abierto) return <p className="no-imprimir"><button type="button" className="btn" onClick={() => setAbierto(true)}>{tr("Nueva toma")}</button></p>

  const instrumentosEtapa = INSTRUMENTOS.filter(i => i.etapas.includes(etapa))

  return (
    <form onSubmit={enviar} className="panel no-imprimir" style={{ marginTop: 10 }}>
      <div className="fila">
        <label className="campo"><span>{tr("Título")}</span><input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} /></label>
        <label className="campo"><span>{tr("Registro")}</span>
          <select value={etapa} onChange={e => cambiarEtapa(e.target.value as Etapa)}>
            {ETAPAS.map(x => <option key={x} value={x}>{tr(ETIQUETA_ETAPA[x])}</option>)}
          </select>
        </label>
        <label className="campo"><span>{tr("Máximo de elecciones")}</span><input type="number" min={1} max={10} value={max} onChange={e => setMax(Number(e.target.value))} /></label>
      </div>
      <label className="campo"><span>{tr('Punto de partida')}</span>
        <select value={fuente} onChange={e => cambiarFuente(e.target.value)}>
          <option value="defecto">{tr('Situaciones por defecto del registro')}</option>
          <optgroup label={tr('Catálogo de instrumentos')}>
            {instrumentosEtapa.map(i => <option key={i.id} value={`cat:${i.id}`}>{i.nombre} · {i.autores.split(',')[0]} ({i.anio})</option>)}
          </optgroup>
          {(cuestionarios?.length ?? 0) > 0 && (
            <optgroup label={tr('Mis cuestionarios')}>
              {cuestionarios!.map(c => <option key={c.id} value={`mio:${c.id}`}>{c.nombre} · {tr(ETIQUETA_ETAPA[c.etapa])}</option>)}
            </optgroup>
          )}
        </select>
        <span className="aviso">{tr('El catálogo y las referencias completas están en')} <Link to="/catalogo">{tr('Catálogo')}</Link>.</span>
      </label>
      {aviso.map((a, i) => <div key={i} className="note alert"><span className="tag">{tr('Aviso del instrumento')}</span><p>{a}</p></div>)}

      <div className="campo"><span>{tr("Situaciones")}</span>
        <div className="opciones">
          {SITUACIONES.map(s => {
            const on = canonicas.includes(s)
            return (
              <label key={s} className={on ? 'opcion on' : 'opcion'}>
                <input type="checkbox" checked={on} onChange={() => setCanonicas(on ? canonicas.filter(x => x !== s) : [...canonicas, s])} />
                {tr(ETIQUETA_SITUACION[s])}
              </label>
            )
          })}
        </div>
        <span className="aviso">{tr("Espejo mide percepción («¿quién crees que te elegiría?») y da el ajuste perceptivo. No cuenta como elección recibida.")}</span>
      </div>

      <div className="campo"><span>{tr('Preguntas propias')}</span>
        {preguntas.map(p => (
          <div key={p.id} className="pregunta-propia">
            <input type="text" value={p.etiqueta} maxLength={24} onChange={e => editar(p.id, { etiqueta: e.target.value })} placeholder={tr('Etiqueta corta')} style={{ maxWidth: 160 }} aria-label={tr('Etiqueta corta')} />
            <select value={p.tipo} onChange={e => editar(p.id, { tipo: e.target.value as PreguntaToma['tipo'] })} style={{ maxWidth: 170 }} aria-label={tr('Tipo')}>
              <option value="preferencia">{tr('Preferencia (cuenta como elección)')}</option>
              <option value="percepcion">{tr('Percepción (quién crees que te elige)')}</option>
            </select>
            <input type="text" value={p.pregunta} maxLength={240} onChange={e => editar(p.id, { pregunta: e.target.value })} placeholder={tr('La pregunta tal como la verá el alumnado')} aria-label={tr('Pregunta')} />
            <input type="text" value={p.ayuda ?? ''} maxLength={160} onChange={e => editar(p.id, { ayuda: e.target.value || undefined })} placeholder={tr('Ayuda breve (opcional)')} aria-label={tr('Ayuda')} />
            {negativasPermitidas(etapa) && p.tipo === 'preferencia' && <input type="text" value={p.negativa ?? ''} maxLength={240} onChange={e => editar(p.id, { negativa: e.target.value || undefined })} placeholder={tr('Formulación negativa (solo con negativas activadas)')} aria-label={tr('Negativa')} />}
            <button type="button" className="enlace" onClick={() => setPreguntas(prev => prev.filter(x => x.id !== p.id))}>{tr('quitar')}</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          <button type="button" className="btn secundario pequeno" onClick={() => setPreguntas(prev => [...prev, { id: idPreguntaNuevo(prev.map(x => x.id)), etiqueta: '', pregunta: '', tipo: 'preferencia' }])}>{tr('Añadir pregunta propia')}</button>
          <button type="button" className="btn secundario pequeno" disabled={situaciones.length === 0} onClick={() => void guardarComoMio()}>{tr('Guardar como cuestionario mío')}</button>
        </div>
        <span className="aviso">{tr('Pregunta por una situación concreta, con verbo de futuro y sin adjetivos sobre las personas. Nunca pidas el motivo.')}</span>
      </div>

      {negativasPermitidas(etapa) && (
        <div className="campo">
          <label className="opcion" style={{ maxWidth: 'fit-content' }}>
            <input type="checkbox" checked={negativas} onChange={e => setNegativas(e.target.checked)} />
            {tr("Activar nominaciones negativas («¿con quién preferirías no…?»)")}
          </label>
          {negativas && (
            <div className="note alert"><span className="tag">{tr("Decisión expresa")}</span>
              <p>{tr("Las negativas dan los tipos de Coie y Dodge (popular, rechazado, ignorado, controvertido, promedio). Son una foto, no un diagnóstico, y conviene acordarlo con el equipo antes de pasar la toma.")}</p>
            </div>
          )}
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn" disabled={situaciones.length === 0 || preguntas.some(p => !p.etiqueta.trim() || p.pregunta.trim().length < 4)}>{tr("Abrir la toma")}</button>
        <button type="button" className="btn secundario" onClick={() => setAbierto(false)}>{tr("Cancelar")}</button>
      </div>
    </form>
  )
}

function AnadirAlumnos({ grupoId }: { grupoId: string }) {
  const tr = useT()
  const [lista, setLista] = useState('')
  const [abierto, setAbierto] = useState(false)
  if (!abierto) return <p className="no-imprimir"><button type="button" className="btn secundario pequeno" onClick={() => setAbierto(true)}>{tr("Añadir alumnos")}</button></p>
  return (
    <form className="no-imprimir" onSubmit={async e => { e.preventDefault(); await anadirAlumnos(grupoId, lista); setLista(''); setAbierto(false) }}>
      <label className="campo"><span>{tr("Nombres nuevos")}</span><textarea value={lista} onChange={e => setLista(e.target.value)} /></label>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn pequeno">{tr("Añadir")}</button>
        <button type="button" className="btn secundario pequeno" onClick={() => setAbierto(false)}>{tr("Cancelar")}</button>
      </div>
    </form>
  )
}

function NuevoEvento({ grupoId }: { grupoId: string }) {
  const tr = useT()
  const [fecha, setFecha] = useState(hoyIso())
  const [texto, setTexto] = useState('')
  return (
    <form className="fila no-imprimir" onSubmit={async e => { e.preventDefault(); if (!texto.trim()) return; await anadirEvento(grupoId, fecha, texto); setTexto('') }}>
      <label className="campo" style={{ flex: '0 0 170px' }}><span>{tr("Fecha")}</span><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></label>
      <label className="campo" style={{ flex: '1 1 300px' }}><span>{tr("Qué ha pasado")}</span><input type="text" value={texto} onChange={e => setTexto(e.target.value)} placeholder="Cambio de sitios por parejas" /></label>
      <div className="campo"><span>&nbsp;</span><button type="submit" className="btn pequeno">{tr("Anotar")}</button></div>
    </form>
  )
}
