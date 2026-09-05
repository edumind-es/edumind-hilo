import { Route, Routes } from 'react-router-dom'
import { Marco } from './componentes/Marco'
import { Ajustes } from './paginas/Ajustes'
import { Escanear } from './paginas/Escanear'
import { Grupo } from './paginas/Grupo'
import { Hojas } from './paginas/Hojas'
import { Inicio } from './paginas/Inicio'
import { Responder } from './paginas/Responder'
import { SesionAlumno } from './paginas/SesionAlumno'
import { SesionQr } from './paginas/SesionQr'
import { Toma } from './paginas/Toma'
import { Transcribir } from './paginas/Transcribir'

export default function App() {
  return (
    <Routes>
      {/* Pantallas del alumnado y hojas para imprimir: sin marco, nada del portal a la vista. */}
      <Route path="/toma/:id/responder" element={<Responder />} />
      <Route path="/toma/:id/hojas" element={<Hojas />} />
      <Route path="/s" element={<SesionAlumno />} />
      <Route element={<Marco />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/grupo/:id" element={<Grupo />} />
        <Route path="/toma/:id" element={<Toma />} />
        <Route path="/toma/:id/sesion" element={<SesionQr />} />
        <Route path="/toma/:id/escanear" element={<Escanear />} />
        <Route path="/toma/:id/transcribir" element={<Transcribir />} />
        <Route path="/ajustes" element={<Ajustes />} />
      </Route>
    </Routes>
  )
}
