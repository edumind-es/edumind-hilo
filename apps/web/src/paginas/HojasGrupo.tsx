/** Hojas de grupo para imprimir: una por situación, la matriz completa. Filas: quién elige. Columnas: a quién. */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { etiquetaSituacion, MAX_ALUMNOS_HOJA_GRUPO, esPreferencia, codificarIdentidadHojaGrupo, disenoHojaGrupo, nombresParaAlumnado, textoSituacion } from '@edumind-hilo/nucleo'
import { useAlumnos, useGrupo, useToma } from '@/db/hooks'
import { qrSvg } from '@/lib/qr'
import { useT } from '@/i18n'
import '@/estilos/hoja.css'

export function HojasGrupo() {
  const tr = useT()
  const { id } = useParams()
  const toma = useToma(id)
  const grupo = useGrupo(toma?.grupo_id)
  const alumnos = useAlumnos(toma?.grupo_id)
  const [qrs, setQrs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!toma || !alumnos?.length) return
    void (async () => {
      const salida: Record<string, string> = {}
      for (const s of toma.situaciones) salida[s] = await qrSvg(codificarIdentidadHojaGrupo(toma.id, s, alumnos.map(a => a.codigo)), 'M')
      setQrs(salida)
    })()
  }, [toma, alumnos])

  if (toma === undefined) return <p className="mono">{tr("Cargando…")}</p>
  if (!toma || !grupo || !alumnos) return <p>{tr("Esta toma no existe.")}</p>
  if (alumnos.length > MAX_ALUMNOS_HOJA_GRUPO || alumnos.length < 2) return <p className="error">La hoja de grupo admite entre 2 y {MAX_ALUMNOS_HOJA_GRUPO} alumnos.</p>

  const cortos = nombresParaAlumnado(alumnos.map(a => a.nombre))
  const d = disenoHojaGrupo(alumnos.length)
  const mm = (v: number) => `${v}mm`
  const situaciones = toma.situaciones

  return (
    <div className="hojas">
      <div className="hojas-barra no-imprimir">
        <Link to={`/toma/${toma.id}`} className="mono mono-ink">← {toma.titulo}</Link>
        <span className="mono">{situaciones.length} hojas, una por situación · {alumnos.length} × {alumnos.length}</span>
        <button type="button" className="btn pequeno" onClick={() => print()}>{tr("Imprimir")}</button>
      </div>
      {situaciones.map(s => (
        <div className="hoja" key={s} style={{ width: mm(d.ancho), height: mm(d.alto) }}>
          {d.marcadores.map((m, i) => <div key={i} className="marcador" style={{ left: mm(m.x - d.ladoMarcador / 2), top: mm(m.y - d.ladoMarcador / 2), width: mm(d.ladoMarcador), height: mm(d.ladoMarcador) }} />)}
          <div className="qr" style={{ left: mm(d.qr.x), top: mm(d.qr.y), width: mm(d.qr.lado), height: mm(d.qr.lado) }} dangerouslySetInnerHTML={{ __html: qrs[s] ?? '' }} />
          <div className="titulo" style={{ left: mm(d.tituloX), top: mm(d.tituloY - 6) }}><b>{tr(etiquetaSituacion(s, toma.preguntas))}</b> · {grupo.nombre} · {toma.titulo}</div>
          <div className="instrucciones" style={{ left: mm(d.tituloX), top: mm(d.tituloY + 2), width: mm(d.ancho - d.tituloX - 16) }}>
            <p>{textoSituacion(toma.idioma, toma.etapa, s, toma.preguntas).pregunta}</p>
            <p>Hoja de grupo: cada fila es quien elige; cada columna, a quién. Rellena del todo el círculo. La diagonal no se lee. Máximo {toma.max_elecciones} por fila.</p>
          </div>
          {alumnos.map((a, c) => (
            <div key={a.id} className="cabecera-col" style={{ left: mm(d.columnas[c]! - 3), top: mm(d.cabeceraY - 22), width: mm(6), height: mm(20), writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '6.5pt', textTransform: 'none', letterSpacing: 0, textAlign: 'left', overflow: 'hidden', whiteSpace: 'nowrap' }}>{cortos[c]}</div>
          ))}
          {alumnos.map((a, f) => (
            <div key={a.id}>
              <div className="nombre" style={{ left: mm(d.nombreX), top: mm(d.filas[f]! - d.paso / 2), width: mm(d.nombreAncho), height: mm(d.paso), lineHeight: mm(d.paso), fontSize: '8pt' }}>{cortos[f]}</div>
              {alumnos.map((_, c) => (
                f === c
                  ? <div key={c} style={{ position: 'absolute', left: mm(d.columnas[c]! - d.diametro / 2), top: mm(d.filas[f]! - d.diametro / 2), width: mm(d.diametro), height: mm(d.diametro), background: '#000' }} />
                  : <div key={c} className="burbuja" style={{ left: mm(d.columnas[c]! - d.diametro / 2), top: mm(d.filas[f]! - d.diametro / 2), width: mm(d.diametro), height: mm(d.diametro) }} />
              ))}
            </div>
          ))}
          <div className="pie-hoja" style={{ left: mm(d.nombreX + 12), top: mm(d.alto - 17) }}>{grupo.nombre} · {tr(etiquetaSituacion(s, toma.preguntas))} · una app de EDUmind, por Luis Vilela Acuña</div>
        </div>
      ))}
    </div>
  )
}
