import { useState } from 'react'
import { exportarCopia, importarCopia } from '@/db/copia'
import { borrarTodo } from '@/db/consultas'
import { cifrarTexto, descifrarTexto, esCifrado } from '@/lib/cifrado'
import { descargarTexto } from '@/lib/descargar'

export function Ajustes() {
  const [mensaje, setMensaje] = useState<string | null>(null)

  async function exportar() {
    const copia = await exportarCopia()
    const fecha = copia.exportado.slice(0, 10)
    const resumen = `${copia.grupos.length} grupos, ${copia.tomas.length} tomas, ${copia.respuestas.length} respuestas`
    const password = prompt('Contraseña para cifrar la copia (mínimo seis caracteres).\nDéjala vacía para exportar en claro, con nombres legibles.') ?? ''
    if (!password) {
      if (!confirm('Sin contraseña la copia lleva los nombres del alumnado en claro. ¿Exportar igualmente?')) return
      descargarTexto(`hilo-copia-${fecha}.json`, JSON.stringify(copia, null, 1))
      setMensaje(`Copia exportada en claro: ${resumen}.`)
      return
    }
    try {
      const cifrada = await cifrarTexto(JSON.stringify(copia), password)
      descargarTexto(`hilo-copia-${fecha}.cifrada.json`, JSON.stringify(cifrada))
      setMensaje(`Copia cifrada exportada: ${resumen}. Sin la contraseña no se puede abrir; no hay forma de recuperarla.`)
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'No se pudo cifrar.')
    }
  }

  async function importar(fichero: File) {
    try {
      let texto = await fichero.text()
      let bruto: unknown
      try {
        bruto = JSON.parse(texto)
      } catch {
        throw new Error('El fichero no es un JSON válido.')
      }
      if (esCifrado(bruto)) {
        const password = prompt('Esta copia está cifrada. Contraseña:') ?? ''
        if (!password) return
        texto = await descifrarTexto(bruto, password)
      }
      const contadores = await importarCopia(texto)
      const total = Object.values(contadores).reduce((a, b) => a + b, 0)
      setMensaje(total ? `Importados ${total} registros nuevos o más recientes.` : 'La copia no traía nada más reciente que lo que ya hay.')
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'No se pudo importar.')
    }
  }

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow">Este dispositivo</p>
          <h1>Ajustes</h1>
          <p className="lede">Todo lo que Hilo sabe está en este navegador. No hay cuenta, no hay servidor, no hay nube. Si pierdes el dispositivo sin copia, se pierde.</p>
        </div>
      </div>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">01</span><h2>Copia de seguridad</h2></div>
        <p>Un fichero JSON con todos los grupos, tomas y respuestas. Al importarlo en otro dispositivo se fusiona: gana el registro modificado más tarde, así que se puede importar la misma copia dos veces sin duplicar nada.</p>
        <div className="note" style={{ '--c': 'var(--m-mental)' } as React.CSSProperties}><span className="tag">Cifrado</span><p>Al exportar se pide una contraseña: la copia sale cifrada (AES-256) y sin ella no se puede abrir, tampoco por EDUmind. Si la dejas vacía, la copia sale en claro, con los nombres legibles.</p></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn" onClick={() => void exportar()}>Exportar copia</button>
          <label className="btn secundario" style={{ cursor: 'pointer' }}>
            Importar copia
            <input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) void importar(f); e.target.value = '' }} />
          </label>
        </div>
        {mensaje && <p className="aviso" role="status">{mensaje}</p>}
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">02</span><h2>Privacidad</h2></div>
        <ul className="rules">
          <li><span className="dash">—</span><span className="crece">Ningún dato sale de este dispositivo. La app no hace peticiones a ningún servidor salvo para descargarse a sí misma.</span></li>
          <li><span className="dash">—</span><span className="crece">El alumnado nunca ve resultados, ni su propio nombre en la lista, ni la palabra «sociograma».</span></li>
          <li><span className="dash">—</span><span className="crece">Las nominaciones negativas están bloqueadas fuera de Secundaria.</span></li>
          <li><span className="dash">—</span><span className="crece">Detalle completo en <a href="https://github.com/edumind-es/edumind-hilo/blob/main/PRIVACIDAD.md">PRIVACIDAD.md</a>.</span></li>
        </ul>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">03</span><h2>Zona de cuidado</h2></div>
        <button type="button" className="btn peligro" onClick={async () => {
          if (prompt('Para borrar TODOS los datos de Hilo en este dispositivo, escribe BORRAR:') === 'BORRAR') {
            await borrarTodo()
            setMensaje('Todo borrado.')
          }
        }}>Borrar todos los datos</button>
      </section>
    </>
  )
}
