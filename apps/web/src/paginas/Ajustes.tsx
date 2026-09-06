import { useState } from 'react'
import { exportarCopia, importarCopia } from '@/db/copia'
import { borrarTodo } from '@/db/consultas'
import { cifrarTexto, descifrarTexto, esCifrado } from '@/lib/cifrado'
import { descargarTexto } from '@/lib/descargar'
import { activarBuzon, desactivarBuzon, purgarBuzon, sincronizar, tokenBuzon } from '@/db/sync'
import { tokenBuzonNuevo } from '@/lib/sobres'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import { qrSvg } from '@/lib/qr'
import { useEffect } from 'react'
import { IDIOMAS, type Idioma } from '@edumind-hilo/nucleo'
import { NOMBRE_IDIOMA, cambiarIdioma, useIdioma, useT } from '@/i18n'

export function Ajustes() {
  const tr = useT()
  const idioma = useIdioma()
  const [mensaje, setMensaje] = useState<string | null>(null)
  const token = useLiveQuery(() => tokenBuzon(), [])
  const [tokenEntrada, setTokenEntrada] = useState('')
  const [qrToken, setQrToken] = useState('')
  const [mostrarToken, setMostrarToken] = useState(false)
  useEffect(() => { if (token) void qrSvg(token, 'M').then(setQrToken); else setQrToken('') }, [token])
  const ultimaSync = useLiveQuery(() => db.ajustes.get('sync_push_desde'), [])

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
        <div className="sec-head"><span className="sec-num">02</span><h2>{tr('Sincronizar entre mis dispositivos')}</h2></div>
        <p>{tr('Opcional. Un buzón cifrado en el servidor de EDUmind reparte tus datos entre tus dispositivos. El servidor guarda sobres que no puede abrir: la clave sale de un token secreto que solo tienen tus dispositivos y que el servidor conoce únicamente por su hash.')}</p>
        {!token ? (
          <div className="fila">
            <div className="campo"><span>&nbsp;</span><button type="button" className="btn" onClick={async () => { await activarBuzon(tokenBuzonNuevo()); setMensaje(tr('Buzón creado. Enséñale el código al otro dispositivo o cópiale el token.')) }}>{tr('Crear un buzón nuevo')}</button></div>
            <label className="campo" style={{ flex: '1 1 320px' }}><span>{tr('O pega el token de otro dispositivo')}</span><input type="text" value={tokenEntrada} onChange={e => setTokenEntrada(e.target.value)} /></label>
            <div className="campo"><span>&nbsp;</span><button type="button" className="btn secundario" disabled={tokenEntrada.trim().length < 40} onClick={async () => { await activarBuzon(tokenEntrada); setTokenEntrada(''); setMensaje(tr('Buzón conectado. Sincroniza para traer lo que haya.')) }}>{tr('Conectar')}</button></div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="btn" onClick={async () => { try { const r = await sincronizar(); setMensaje(tr('Sincronizado: {e} enviados, {r} recibidos, {x} rechazados.', { e: r.enviados, r: r.recibidos, x: r.rechazados })) } catch (err) { setMensaje(err instanceof Error ? tr(err.message) : 'Error') } }}>{tr('Sincronizar ahora')}</button>
              <button type="button" className="btn secundario" onClick={() => setMostrarToken(v => !v)}>{mostrarToken ? tr('Ocultar el token') : tr('Mostrar el token para otro dispositivo')}</button>
              <button type="button" className="btn secundario" onClick={async () => { if (confirm(tr('Este dispositivo dejará de sincronizar. Los datos locales se conservan. ¿Seguir?'))) { await desactivarBuzon(); setMensaje(tr('Buzón desconectado en este dispositivo.')) } }}>{tr('Desconectar')}</button>
              <button type="button" className="btn peligro" onClick={async () => { if (confirm(tr('Se borrará el buzón del servidor para todos tus dispositivos. Los datos locales se conservan. ¿Seguir?'))) { await purgarBuzon(); setMensaje(tr('Buzón borrado del servidor.')) } }}>{tr('Borrar el buzón del servidor')}</button>
            </div>
            {ultimaSync?.idioma && <p className="aviso">{tr('Último envío')}: {new Date(ultimaSync.idioma).toLocaleString('es-ES')}</p>}
            {mostrarToken && (
              <div className="panel" style={{ marginTop: 14, maxWidth: 520 }}>
                <p className="blabel" style={{ marginTop: 0 }}>{tr('Token del buzón · trátalo como una contraseña')}</p>
                <div className="qr-grande" style={{ maxWidth: 260, margin: '0 0 12px' }} dangerouslySetInnerHTML={{ __html: qrToken }} />
                <textarea readOnly value={token} style={{ minHeight: 60, fontSize: 12 }} />
              </div>
            )}
          </>
        )}
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">03</span><h2>{tr('Idioma del portal')}</h2></div>
        <label className="campo" style={{ maxWidth: 320 }}><span>{tr('Idioma del portal')}</span>
          <select value={idioma} onChange={e => void cambiarIdioma(e.target.value as Idioma)}>
            {IDIOMAS.map(x => <option key={x} value={x}>{NOMBRE_IDIOMA[x]}</option>)}
          </select>
        </label>
        <p className="aviso">{tr('El idioma del cuestionario del alumnado se elige en cada grupo; este es el del portal del docente.')}</p>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">04</span><h2>{tr("Privacidad")}</h2></div>
        <ul className="rules">
          <li><span className="dash">—</span><span className="crece">{tr("Ningún dato sale de este dispositivo. La app no hace peticiones a ningún servidor salvo para descargarse a sí misma.")}</span></li>
          <li><span className="dash">—</span><span className="crece">{tr("El alumnado nunca ve resultados, ni su propio nombre en la lista, ni la palabra «sociograma».")}</span></li>
          <li><span className="dash">—</span><span className="crece">{tr("Las nominaciones negativas están bloqueadas fuera de Secundaria.")}</span></li>
          <li><span className="dash">—</span><span className="crece">Detalle completo en <a href="https://github.com/edumind-es/edumind-hilo/blob/main/PRIVACIDAD.md">PRIVACIDAD.md</a>.</span></li>
        </ul>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">05</span><h2>{tr("Zona de cuidado")}</h2></div>
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
