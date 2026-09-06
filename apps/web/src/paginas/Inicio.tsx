import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ETAPAS, ETIQUETA_ETAPA, IDIOMAS, analizarLista, type Etapa, type Idioma } from '@edumind-hilo/nucleo'
import { crearGrupoDesdeLista } from '@/db/consultas'
import { abrirMiClaseCifrado, crearGrupoDesdeMiClase, detectarFichero } from '@/db/importar'
import type { GrupoMiClase } from '@edumind-hilo/nucleo'
import { useGrupos } from '@/db/hooks'
import { fechaCorta } from '@/lib/fechas'
import { NOMBRE_IDIOMA, useT } from '@/i18n'


function cursoActual(): string {
  const hoy = new Date()
  const inicio = hoy.getMonth() >= 8 ? hoy.getFullYear() : hoy.getFullYear() - 1
  return `${inicio}-${inicio + 1}`
}

export function Inicio() {
  const tr = useT()
  const grupos = useGrupos()
  const navegar = useNavigate()
  const [nombre, setNombre] = useState('')
  const [etapa, setEtapa] = useState<Etapa>('primaria')
  const [idioma, setIdioma] = useState<Idioma>('es')
  const [curso, setCurso] = useState(cursoActual())
  const [lista, setLista] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [deMiClase, setDeMiClase] = useState<GrupoMiClase[] | null>(null)
  const nombres = analizarLista(lista)

  async function importarFichero(f: File) {
    setError(null)
    try {
      let d = await detectarFichero(f)
      if (d.tipo === 'miclase-cifrado') {
        const password = prompt(tr("La copia de MiClase está cifrada. Contraseña:")) ?? ''
        if (!password) return
        d = { tipo: 'miclase', grupos: await abrirMiClaseCifrado(d.cifrado, password) }
      }
      if (d.tipo === 'hilo') throw new Error(tr("Es una copia de Hilo: se importa desde Ajustes."))
      if (d.tipo === 'lista') {
        setLista(d.nombres.join('\n'))
        setMostrarForm(true)
        return
      }
      setDeMiClase(d.grupos)
      setMostrarForm(true)
    } catch (err) {
      setError(err instanceof Error ? tr(err.message) : 'No se pudo leer el fichero.')
    }
  }

  async function crear(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const id = await crearGrupoDesdeLista({ nombre, etapa, idioma, curso, lista })
      navegar(`/grupo/${id}`)
    } catch (err) {
      setError(err instanceof Error ? tr(err.message) : 'No se pudo crear el grupo.')
    }
  }

  const hayGrupos = (grupos?.length ?? 0) > 0
  const formVisible = mostrarForm || !hayGrupos

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow">{tr("Social · Emocional")}</p>
          <h1>Hilo<br /><span className="light">{tr("grupos")}</span></h1>
          <p className="lede">{tr("El sociograma vive en este dispositivo. Crea un grupo pegando la lista de nombres, lanza una toma y lee la trama del aula.")}</p>
        </div>
        {hayGrupos && !mostrarForm && (
          <div className="acciones no-imprimir">
            <button type="button" className="btn" onClick={() => setMostrarForm(true)}>{tr("Nuevo grupo")}</button>
          </div>
        )}
      </div>

      {hayGrupos && (
        <section className="sec">
          <div className="sec-head"><span className="sec-num">01</span><h2>{tr("Grupos")}</h2></div>
          <ul className="rules">
            {grupos!.map(g => (
              <li key={g.id}>
                <span className="dash">—</span>
                <span className="crece">
                  <Link className="titulo" to={`/grupo/${g.id}`}>{g.nombre}</Link>
                  <br />
                  <span className="meta">{tr(ETIQUETA_ETAPA[g.etapa])} · {g.curso} · {NOMBRE_IDIOMA[g.idioma]}</span>
                </span>
                <span className="meta">actualizado {fechaCorta(g.updated_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {formVisible && (
        <section className="sec">
          <div className="sec-head"><span className="sec-num">{hayGrupos ? '02' : '01'}</span><h2>{tr("Nuevo grupo")}</h2></div>
          <form onSubmit={crear}>
            <div className="fila">
              <label className="campo"><span>{tr("Nombre del grupo")}</span><input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="4.º B" /></label>
              <label className="campo"><span>{tr("Curso escolar")}</span><input type="text" value={curso} onChange={e => setCurso(e.target.value)} /></label>
            </div>
            <div className="fila">
              <label className="campo"><span>{tr("Registro del cuestionario")}</span>
                <select value={etapa} onChange={e => setEtapa(e.target.value as Etapa)}>
                  {ETAPAS.map(x => <option key={x} value={x}>{tr(ETIQUETA_ETAPA[x])}</option>)}
                </select>
              </label>
              <label className="campo"><span>{tr("Idioma para el alumnado")}</span>
                <select value={idioma} onChange={e => setIdioma(e.target.value as Idioma)}>
                  {IDIOMAS.map(x => <option key={x} value={x}>{NOMBRE_IDIOMA[x]}</option>)}
                </select>
              </label>
            </div>
            <label className="campo"><span>{tr("Lista de nombres · uno por línea o separados por comas")}</span>
              <textarea required value={lista} onChange={e => setLista(e.target.value)} placeholder={'Sabela\nIker\nAntía\nBrais'} />
              <span className="aviso">{nombres.length} nombres. Mejor solo el nombre de pila: es lo que verá el alumnado. Los nombres de pila repetidos se distinguen con la inicial del apellido.</span>
            </label>
            {error && <p className="error">{error}</p>}
            <div className="acciones" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" className="btn" disabled={nombres.length < 2}>{tr("Crear el grupo")}</button>
              <label className="btn secundario" style={{ cursor: 'pointer' }}>
                Importar fichero
                <input type="file" accept=".csv,.tsv,.txt,.json,.miclase,.xlsx" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) void importarFichero(f); e.target.value = '' }} />
              </label>
              {hayGrupos && <button type="button" className="btn secundario" onClick={() => setMostrarForm(false)}>{tr("Cancelar")}</button>}
            </div>
            <p className="aviso">{tr("Importar admite una hoja de cálculo (XLSX o CSV) con la lista (columna «nombre», o la primera) y la exportación de MiClase, en claro o cifrada: de ella solo se leen grupos y alumnos, y se conservan sus códigos.")}</p>
          </form>
          {deMiClase && (
            <div className="panel" style={{ marginTop: 18 }}>
              <p className="blabel" style={{ marginTop: 0 }}>{tr("Grupos en la exportación de MiClase")}</p>
              <ul className="rules">
                {deMiClase.map((g, i) => (
                  <li key={i}><span className="dash">—</span><span className="crece"><b>{g.nombre}</b> · {g.alumnos.length} alumnos · {tr(ETIQUETA_ETAPA[g.etapa])}</span>
                    <button type="button" className="btn pequeno" onClick={async () => { try { const gid = await crearGrupoDesdeMiClase(g, idioma); navegar(`/grupo/${gid}`) } catch (err) { setError(err instanceof Error ? tr(err.message) : 'No se pudo importar.') } }}>{tr("Importar")}</button>
                  </li>
                ))}
              </ul>
              <p className="aviso">{tr("Los nombres se reducen al nombre de pila, con la inicial del apellido solo cuando se repite.")}</p>
            </div>
          )}
        </section>
      )}
    </>
  )
}
