export function Firma() {
  return (
    <footer>
      <div className="wrap">
        <div>
          <p className="mono mono-ink" style={{ margin: 0 }}>Una app de EDUmind® · por Luis Vilela Acuña</p>
          <p className="tm">
            Software libre bajo AGPL-3.0-or-later o EUPL-1.2, a elección. EDUmind® es marca registrada; el
            código es libre, la marca no se cede con él. Los datos del alumnado no salen de este dispositivo.
          </p>
        </div>
        <p className="mono" style={{ margin: 0 }}>
          <a href="https://github.com/edumind-es/edumind-hilo">Código fuente</a> · <a href="https://edumind.es/es/legal">Legal</a>
        </p>
      </div>
      <div className="worlds-bar" aria-hidden="true"><i /><i /><i /><i /><i /></div>
    </footer>
  )
}
