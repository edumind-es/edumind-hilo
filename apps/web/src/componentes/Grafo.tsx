import { useMemo, useState } from 'react'
import { etiquetaSituacion, esPreferencia, type Analisis, type PreguntaToma, type Situacion } from '@edumind-hilo/nucleo'
import { dibujarGrafoSvg } from '@/informe/grafoSvg'
import { useT } from '@/i18n'

export function Grafo({ analisis, nombres, situaciones, preguntas = [] }: { analisis: Analisis; nombres: Map<string, string>; situaciones: Situacion[]; preguntas?: PreguntaToma[] }) {
  const tr = useT()
  const [situacion, setSituacion] = useState<Situacion | null>(null)
  const [semilla, setSemilla] = useState(7)
  const preferencia = situaciones.filter(s => esPreferencia(s, preguntas))
  const svg = useMemo(() => dibujarGrafoSvg({ analisis, nombres, situacion, semilla }), [analisis, nombres, situacion, semilla])
  return (
    <div>
      <div className="opciones no-imprimir" style={{ marginBottom: 12 }}>
        <button type="button" className={situacion === null ? 'opcion on' : 'opcion'} onClick={() => setSituacion(null)}>{tr("Todas")}</button>
        {preferencia.map(s => (
          <button key={s} type="button" className={situacion === s ? 'opcion on' : 'opcion'} onClick={() => setSituacion(s)}>{tr(etiquetaSituacion(s, preguntas))}</button>
        ))}
        <button type="button" className="opcion" onClick={() => setSemilla(x => x + 1)}>{tr("Recolocar")}</button>
      </div>
      <div className="grafo" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="aviso">{tr("Línea gruesa: elección recíproca. Flecha fina: elección en un sentido. Tamaño: elecciones recibidas. Color: subgrupo. Borde rojo: sin ninguna elección.")}</p>
    </div>
  )
}
