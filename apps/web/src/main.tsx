import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { ProveedorIdioma } from './i18n'
import './estilos/base.css'
import './estilos/alumno.css'

// La PWA se actualiza sola en segundo plano: la siguiente apertura ya trae
// la versión nueva. Sin preguntar, porque no hay estado en el servidor que
// pueda quedar incoherente.
registerSW({ immediate: true })

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorIdioma>
        <App />
      </ProveedorIdioma>
    </BrowserRouter>
  </StrictMode>,
)
