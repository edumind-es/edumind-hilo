/** Etiquetas recortables con nombre y código, 24 por A4, para repartir en mano. */
import { Link, useParams } from 'react-router-dom'
import { useAlumnos, useGrupo, useToma } from '@/db/hooks'
import '@/estilos/hoja.css'

export function Etiquetas() {
  const { id } = useParams()
  const toma = useToma(id)
  const grupo = useGrupo(toma?.grupo_id)
  const alumnos = useAlumnos(toma?.grupo_id)
  if (toma === undefined) return <p className="mono">Cargando…</p>
  if (!toma || !grupo || !alumnos) return <p>Esta toma no existe.</p>
  return (
    <div className="hojas">
      <div className="hojas-barra no-imprimir">
        <Link to={`/toma/${toma.id}/prueba`} className="mono mono-ink">← {toma.titulo}</Link>
        <span className="mono">{alumnos.length} etiquetas · 24 por hoja</span>
        <button type="button" className="btn pequeno" onClick={() => print()}>Imprimir</button>
      </div>
      <div className="etiquetas">
        {alumnos.map(a => (
          <div className="etiqueta" key={a.id}>
            <span className="etiqueta-grupo">{grupo.nombre}</span>
            <span className="etiqueta-nombre">{a.nombre}</span>
            <span className="etiqueta-codigo">{a.codigo}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
