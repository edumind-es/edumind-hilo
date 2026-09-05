import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ETAPAS, ETIQUETA_ETAPA, IDIOMAS, analizarLista, type Etapa, type Idioma } from '@edumind-hilo/nucleo'
import { crearGrupoDesdeLista } from '@/db/consultas'
import { abrirMiClaseCifrado, crearGrupoDesdeMiClase, detectar } from '@/db/importar'
import type { GrupoMiClase } from '@edumind-hilo/nucleo'
import { useGrupos } from '@/db/hooks'
import { fechaCorta } from '@/lib/fechas'

const NOMBRE_IDIOMA: Record<Idioma, string> = { es: 'Castellano', gl: 'Galego', en: 'English' }

function cursoActual(): string {
  const hoy = new Date()
  const inicio = hoy.getMonth() >= 8 ? hoy.getFullYear() : hoy.getFullYear() - 1
  return `${inicio}-${inicio + 1}`
}

export function Inicio() {
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
      let d = detectar(await f.text())
      if (d.tipo === 'miclase-cifrado') {
        const password = prompt('La copia de MiClase está cifrada. Contraseña:') ?? ''
        if (!password) return
        d = { tipo: 'miclase', grupos: await abrirMiClaseCifrado(d.cifrado, password) }
      }
      if (d.tipo === 'hilo') throw new Error('Es una copia de Hilo: se importa desde Ajustes.')
      if (d.tipo === 'lista') {
        setLista(d.nombres.join('\n'))
        setMostrarForm(true)
        return
      }
      setDeMiClase(d.grupos)
      setMostrarForm(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el fichero.')
    }
  }

  async function crear(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const id = await crearGrupoDesdeLista({ nombre, etapa, idioma, curso, lista })
      navegar(`/grupo/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el grupo.')
    }
  }

  const hayGrupos = (grupos?.length ?? 0) > 0
  const formVisible = mostrarForm || !hayGrupos

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow">Social · Emocional</p>
          <h1>Hilo<br /><span className="light">grupos</span></h1>
          <p className="lede">El sociograma vive en este dispositivo. Crea un grupo pegando la lista de nombres, lanza una toma y lee la trama del aula.</p>
        </div>
        {hayGrupos && !mostrarForm && (
          <div className="acciones no-imprimir">
            <button type="button" className="btn" onClick={() => setMostrarForm(true)}>Nuevo grupo</button>
          </div>
        )}
      </div>

      {hayGrupos && (
        <section className="sec">
          <div className="sec-head"><span className="sec-num">01</span><h2>Grupos</h2></div>
          <ul className="rules">
            {grupos!.map(g => (
              <li key={g.id}>
                <span className="dash">—</span>
                <span className="crece">
                  <Link className="titulo" to={`/grupo/${g.id}`}>{g.nombre}</Link>
                  <br />
                  <span className="meta">{ETIQUETA_ETAPA[g.etapa]} · {g.curso} · {NOMBRE_IDIOMA[g.idioma]}</span>
                </span>
                <span className="meta">actualizado {fechaCorta(g.updated_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {formVisible && (
        <section className="sec">
          <div className="sec-head"><span className="sec-num">{hayGrupos ? '02' : '01'}</span><h2>Nuevo grupo</h2></div>
          <form onSubmit={crear}>
            <div className="fila">
              <label className="campo"><span>Nombre del grupo</span><input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="4.º B" /></label>
              <label className="campo"><span>Curso escolar</span><input type="text" value={curso} onChange={e => setCurso(e.target.value)} /></label>
            </div>
            <div className="fila">
              <label className="campo"><span>Registro del cuestionario</span>
                <select value={etapa} onChange={e => setEtapa(e.target.value as Etapa)}>
                  {ETAPAS.map(x => <option key={x} value={x}>{ETIQUETA_ETAPA[x]}</option>)}
                </select>
              </label>
              <label className="campo"><span>Idioma para el alumnado</span>
                <select value={idioma} onChange={e => setIdioma(e.target.value as Idioma)}>
                  {IDIOMAS.map(x => <option key={x} value={x}>{NOMBRE_IDIOMA[x]}</option>)}
                </select>
              </label>
            </div>
            <label className="campo"><span>Lista de nombres · uno por línea o separados por comas</span>
              <textarea required value={lista} onChange={e => setLista(e.target.value)} placeholder={'Sabela\nIker\nAntía\nBrais'} />
              <span className="aviso">{nombres.length} nombres. Mejor solo el nombre de pila: es lo que verá el alumnado. Los nombres de pila repetidos se distinguen con la inicial del apellido.</span>
            </label>
            {error && <p className="error">{error}</p>}
            <div className="acciones" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" className="btn" disabled={nombres.length < 2}>Crear el grupo</button>
              <label className="btn secundario" style={{ cursor: 'pointer' }}>
                Importar fichero
                <input type="file" accept=".csv,.tsv,.txt,.json,.miclase" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) void importarFichero(f); e.target.value = '' }} />
              </label>
              {hayGrupos && <button type="button" className="btn secundario" onClick={() => setMostrarForm(false)}>Cancelar</button>}
            </div>
            <p className="aviso">Importar admite un CSV con la lista (columna «nombre», o la primera) y la exportación de MiClase, en claro o cifrada: de ella solo se leen grupos y alumnos, y se conservan sus códigos.</p>
          </form>
          {deMiClase && (
            <div className="panel" style={{ marginTop: 18 }}>
              <p className="blabel" style={{ marginTop: 0 }}>Grupos en la exportación de MiClase</p>
              <ul className="rules">
                {deMiClase.map((g, i) => (
                  <li key={i}><span className="dash">—</span><span className="crece"><b>{g.nombre}</b> · {g.alumnos.length} alumnos · {ETIQUETA_ETAPA[g.etapa]}</span>
                    <button type="button" className="btn pequeno" onClick={async () => { try { const gid = await crearGrupoDesdeMiClase(g, idioma); navegar(`/grupo/${gid}`) } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo importar.') } }}>Importar</button>
                  </li>
                ))}
              </ul>
              <p className="aviso">Los nombres se reducen al nombre de pila, con la inicial del apellido solo cuando se repite.</p>
            </div>
          )}
        </section>
      )}
    </>
  )
}
