import { useState } from 'react'
import { exportarCopia, importarCopia } from '@/db/copia'
import { borrarTodo } from '@/db/consultas'
import { cifrarTexto, descifrarTexto, esCifrado } from '@/lib/cifrado'
import { descargarTexto } from '@/lib/descargar'
import { IDIOMAS, type Idioma } from '@edumind-hilo/nucleo'
import { NOMBRE_IDIOMA, cambiarIdioma, useIdioma, useT } from '@/i18n'

export function Ajustes() {
  const tr = useT()
  const idioma = useIdioma()
  const [mensaje, setMensaje] = useState<string | null>(null)

  async function exportar() {
    const copia = await exportarCopia()
    const fecha = copia.exportado.slice(0, 10)
    const resumen = tr('{n} grupos, {t} tomas, {r} respuestas', { n: copia.grupos.length, t: copia.tomas.length, r: copia.respuestas.length })
    const password = prompt(tr("Contraseña para cifrar la copia (mínimo seis caracteres).\\nDéjala vacía para exportar en claro, con nombres legibles.")) ?? ''
    if (!password) {
      if (!confirm(tr("Sin contraseña la copia lleva los nombres del alumnado en claro. ¿Exportar igualmente?"))) return
      descargarTexto(`hilo-copia-${fecha}.json`, JSON.stringify(copia, null, 1))
      setMensaje(tr('Copia exportada en claro: {resumen}.', { resumen }))
      return
    }
    try {
      const cifrada = await cifrarTexto(JSON.stringify(copia), password)
      descargarTexto(`hilo-copia-${fecha}.cifrada.json`, JSON.stringify(cifrada))
      setMensaje(tr('Copia cifrada exportada: {resumen}. Sin la contraseña no se puede abrir; no hay forma de recuperarla.', { resumen }))
    } catch (err) {
      setMensaje(err instanceof Error ? tr(err.message) : 'No se pudo cifrar.')
    }
  }

  async function importar(fichero: File) {
    try {
      let texto = await fichero.text()
      let bruto: unknown
      try {
        bruto = JSON.parse(texto)
      } catch {
        throw new Error(tr("El fichero no es un JSON válido."))
      }
      if (esCifrado(bruto)) {
        const password = prompt(tr("Esta copia está cifrada. Contraseña:")) ?? ''
        if (!password) return
        texto = await descifrarTexto(bruto, password)
      }
      const contadores = await importarCopia(texto)
      const total = Object.values(contadores).reduce((a, b) => a + b, 0)
      setMensaje(total ? tr('Importados {n} registros nuevos o más recientes.', { n: total }) : tr('La copia no traía nada más reciente que lo que ya hay.'))
    } catch (err) {
      setMensaje(err instanceof Error ? tr(err.message) : 'No se pudo importar.')
    }
  }

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow">{tr("Este dispositivo")}</p>
          <h1>{tr("Ajustes")}</h1>
          <p className="lede">{tr("Todo lo que Hilo sabe está en este navegador. No hay cuenta, no hay servidor, no hay nube. Si pierdes el dispositivo sin copia, se pierde.")}</p>
        </div>
      </div>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">01</span><h2>{tr("Copia de seguridad")}</h2></div>
        <p>{tr("Un fichero JSON con todos los grupos, tomas y respuestas. Al importarlo en otro dispositivo se fusiona: gana el registro modificado más tarde, así que se puede importar la misma copia dos veces sin duplicar nada.")}</p>
        <div className="note" style={{ '--c': 'var(--m-mental)' } as React.CSSProperties}><span className="tag">{tr("Cifrado")}</span><p>{tr("Al exportar se pide una contraseña: la copia sale cifrada (AES-256) y sin ella no se puede abrir, tampoco por EDUmind. Si la dejas vacía, la copia sale en claro, con los nombres legibles.")}</p></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn" onClick={() => void exportar()}>{tr("Exportar copia")}</button>
          <label className="btn secundario" style={{ cursor: 'pointer' }}>
            Importar copia
            <input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) void importar(f); e.target.value = '' }} />
          </label>
        </div>
        {mensaje && <p className="aviso" role="status">{mensaje}</p>}
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">02</span><h2>{tr('Idioma del portal')}</h2></div>
        <label className="campo" style={{ maxWidth: 320 }}><span>{tr('Idioma del portal')}</span>
          <select value={idioma} onChange={e => void cambiarIdioma(e.target.value as Idioma)}>
            {IDIOMAS.map(x => <option key={x} value={x}>{NOMBRE_IDIOMA[x]}</option>)}
          </select>
        </label>
        <p className="aviso">{tr('El idioma del cuestionario del alumnado se elige en cada grupo; este es el del portal del docente.')}</p>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">03</span><h2>{tr("Privacidad")}</h2></div>
        <ul className="rules">
          <li><span className="dash">—</span><span className="crece">{tr("Ningún dato sale de este dispositivo. La app no hace peticiones a ningún servidor salvo para descargarse a sí misma.")}</span></li>
          <li><span className="dash">—</span><span className="crece">{tr("El alumnado nunca ve resultados, ni su propio nombre en la lista, ni la palabra «sociograma».")}</span></li>
          <li><span className="dash">—</span><span className="crece">{tr("Las nominaciones negativas están bloqueadas fuera de Secundaria.")}</span></li>
          <li><span className="dash">—</span><span className="crece">Detalle completo en <a href="https://github.com/edumind-es/edumind-hilo/blob/main/PRIVACIDAD.md">PRIVACIDAD.md</a>.</span></li>
        </ul>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">04</span><h2>{tr("Zona de cuidado")}</h2></div>
        <button type="button" className="btn peligro" onClick={async () => {
          if (prompt(tr("Para borrar TODOS los datos de Hilo en este dispositivo, escribe BORRAR:")) === 'BORRAR') {
            await borrarTodo()
            setMensaje(tr("Todo borrado."))
          }
        }}>{tr("Borrar todos los datos")}</button>
      </section>
    </>
  )
}
