import { NavLink, Outlet } from 'react-router-dom'
import { Firma } from './Firma'
import { useT } from '@/i18n'

export function Marco() {
  const tr = useT()
  return (
    <>
      <div className="worlds-bar" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <header className="topbar">
        <div className="wrap">
          <NavLink to="/" className="mono mono-ink" style={{ textDecoration: 'none' }}>EDUMIND · HILO</NavLink>
          <nav aria-label="Principal">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'mono mono-ink activo' : 'mono mono-ink')}>{tr("Grupos")}</NavLink>
            <NavLink to="/ajustes" className={({ isActive }) => (isActive ? 'mono mono-ink activo' : 'mono mono-ink')}>{tr("Ajustes")}</NavLink>
          </nav>
        </div>
      </header>
      <main className="wrap">
        <Outlet />
      </main>
      <Firma />
    </>
  )
}
