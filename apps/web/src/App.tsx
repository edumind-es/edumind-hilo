import { Route, Routes } from 'react-router-dom'
import { Marco } from './componentes/Marco'
import { Ajustes } from './paginas/Ajustes'
import { Grupo } from './paginas/Grupo'
import { Inicio } from './paginas/Inicio'
import { Responder } from './paginas/Responder'
import { Toma } from './paginas/Toma'

export default function App() {
  return (
    <Routes>
      {/* La pantalla del alumnado va sin marco: nada del portal a la vista. */}
      <Route path="/toma/:id/responder" element={<Responder />} />
      <Route element={<Marco />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/grupo/:id" element={<Grupo />} />
        <Route path="/toma/:id" element={<Toma />} />
        <Route path="/ajustes" element={<Ajustes />} />
      </Route>
    </Routes>
  )
}
