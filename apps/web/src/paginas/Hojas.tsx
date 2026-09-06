/**
 * Hojas de marcas para imprimir: una por alumno, A4. La geometría sale de
 * `disenoHoja`, la misma que usa la lectura. El QR lleva la identidad de la
 * hoja: toma, alumno y el orden exacto de las filas.
 */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ETIQUETA_SITUACION, MAX_FILAS_HOJA, codificarIdentidadHoja, disenoHoja, nombresParaAlumnado, textoSituacion } from '@edumind-hilo/nucleo'
import { useAlumnos, useGrupo, useToma } from '@/db/hooks'
import { qrSvg } from '@/lib/qr'
import { useT } from '@/i18n'
import '@/estilos/hoja.css'

export function Hojas() {
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
      for (const a of alumnos) {
        const filas = alumnos.filter(b => b.id !== a.id).map(b => b.codigo)
        salida[a.id] = await qrSvg(codificarIdentidadHoja(toma.id, a.codigo, filas), 'M')
      }
      setQrs(salida)
    })()
  }, [toma, alumnos])

  if (toma === undefined) return <p className="mono">{tr("Cargando…")}</p>
  if (!toma || !grupo || !alumnos) return <p>{tr("Esta toma no existe.")}</p>
  if (alumnos.length - 1 > MAX_FILAS_HOJA) return <p className="error">El grupo tiene más de {MAX_FILAS_HOJA + 1} alumnos: la hoja de una página no da para tantas filas. Usa las tablets o la transcripción.</p>

  const cortos = nombresParaAlumnado(alumnos.map(a => a.nombre))
  const corto = new Map(alumnos.map((a, i) => [a.id, cortos[i] ?? a.nombre]))
  const diseno = disenoHoja(alumnos.length - 1, toma.situaciones.length)
  const mm = (v: number) => `${v}mm`

  return (
    <div className="hojas">
      <div className="hojas-barra no-imprimir">
        <Link to={`/toma/${toma.id}`} className="mono mono-ink">← {toma.titulo}</Link>
        <span className="mono">{alumnos.length} hojas · {toma.situaciones.length} columnas · máximo {toma.max_elecciones} por columna</span>
        <button type="button" className="btn pequeno" onClick={() => print()}>{tr("Imprimir")}</button>
      </div>
      {alumnos.map(a => {
        const filas = alumnos.filter(b => b.id !== a.id)
        return (
          <div className="hoja" key={a.id} style={{ width: mm(diseno.ancho), height: mm(diseno.alto) }}>
            {diseno.marcadores.map((m, i) => (
              <div key={i} className="marcador" style={{ left: mm(m.x - diseno.ladoMarcador / 2), top: mm(m.y - diseno.ladoMarcador / 2), width: mm(diseno.ladoMarcador), height: mm(diseno.ladoMarcador) }} />
            ))}
            <div className="qr" style={{ left: mm(diseno.qr.x), top: mm(diseno.qr.y), width: mm(diseno.qr.lado), height: mm(diseno.qr.lado) }} dangerouslySetInnerHTML={{ __html: qrs[a.id] ?? '' }} />
            <div className="titulo" style={{ left: mm(diseno.tituloX), top: mm(diseno.tituloY - 6) }}>
              <b>{corto.get(a.id)}</b> · {toma.titulo}
            </div>
            <div className="instrucciones" style={{ left: mm(diseno.tituloX), top: mm(diseno.tituloY + 1), width: mm(diseno.ancho - diseno.tituloX - 16) }}>
              {toma.situaciones.map(s => (
                <p key={s}><b>{tr(ETIQUETA_SITUACION[s])}.</b> {textoSituacion(toma.idioma, toma.etapa, s).pregunta}</p>
              ))}
              <p>Rellena del todo el círculo de cada persona que elijas. Como mucho {toma.max_elecciones} por columna. Sin nombres, sin motivos.</p>
            </div>
            {toma.situaciones.map((s, c) => (
              <div key={s} className="cabecera-col" style={{ left: mm(diseno.columnas[c]! - 8), top: mm(diseno.cabeceraY - 4), width: mm(16) }}>{tr(ETIQUETA_SITUACION[s])}</div>
            ))}
            {filas.map((b, f) => (
              <div key={b.id}>
                <div className="nombre" style={{ left: mm(diseno.nombreX), top: mm(diseno.filas[f]! - diseno.paso / 2), width: mm(diseno.nombreAncho), height: mm(diseno.paso), lineHeight: mm(diseno.paso), fontSize: diseno.paso < 6.5 ? '9pt' : '10.5pt' }}>{corto.get(b.id)}</div>
                {toma.situaciones.map((_, c) => (
                  <div key={c} className="burbuja" style={{ left: mm(diseno.columnas[c]! - diseno.diametro / 2), top: mm(diseno.filas[f]! - diseno.diametro / 2), width: mm(diseno.diametro), height: mm(diseno.diametro) }} />
                ))}
              </div>
            ))}
            <div className="pie-hoja" style={{ left: mm(diseno.nombreX + 12), top: mm(diseno.alto - 17) }}>{grupo.nombre} · {a.codigo} · una app de EDUmind, por Luis Vilela Acuña</div>
          </div>
        )
      })}
    </div>
  )
}
