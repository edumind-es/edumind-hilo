import { NavLink, Outlet } from 'react-router-dom'
import { Firma } from './Firma'

export function Marco() {
  return (
    <>
      <div className="worlds-bar" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <header className="topbar">
        <div className="wrap">
          <NavLink to="/" className="mono mono-ink" style={{ textDecoration: 'none' }}>EDUMIND · HILO</NavLink>
          <nav aria-label="Principal">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'mono mono-ink activo' : 'mono mono-ink')}>Grupos</NavLink>
            <NavLink to="/ajustes" className={({ isActive }) => (isActive ? 'mono mono-ink activo' : 'mono mono-ink')}>Ajustes</NavLink>
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
