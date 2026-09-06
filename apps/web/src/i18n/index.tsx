/**
 * Idioma del portal del docente. Patrón gettext: la clave es el texto en
 * castellano; si el diccionario no lo tiene, sale el castellano. Así una
 * cadena nueva nunca rompe nada y se traduce cuando toque.
 *
 * El ajuste vive en la base local (tabla `ajustes`), no en localStorage.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { IDIOMAS, type Idioma } from '@edumind-hilo/nucleo'
import { db } from '@/db/localDb'
import { ahora } from '@/db/ids'
import { gl } from './gl'
import { en } from './en'

const DICCIONARIOS: Record<Idioma, Record<string, string>> = { es: {}, gl, en }

export type T = (clave: string, valores?: Record<string, string | number>) => string

function traducir(idioma: Idioma, clave: string, valores?: Record<string, string | number>): string {
  let texto = DICCIONARIOS[idioma][clave] ?? clave
  if (valores) for (const [k, v] of Object.entries(valores)) texto = texto.split(`{${k}}`).join(String(v))
  return texto
}

const Contexto = createContext<{ idioma: Idioma; t: T }>({ idioma: 'es', t: (c, v) => traducir('es', c, v) })

export function ProveedorIdioma({ children }: { children: ReactNode }) {
  const ajuste = useLiveQuery(() => db.ajustes.get('ui'), [])
  const idioma: Idioma = ajuste && IDIOMAS.includes(ajuste.idioma as Idioma) ? (ajuste.idioma as Idioma) : 'es'
  const valor = useMemo(() => ({ idioma, t: ((c, v) => traducir(idioma, c, v)) as T }), [idioma])
  if (typeof document !== 'undefined') document.documentElement.lang = idioma
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useT(): T {
  return useContext(Contexto).t
}
export function useIdioma(): Idioma {
  return useContext(Contexto).idioma
}

export async function cambiarIdioma(idioma: Idioma) {
  const t = ahora()
  await db.ajustes.put({ id: 'ui', idioma, created_at: t, updated_at: t, deleted_at: null })
}

export const NOMBRE_IDIOMA: Record<Idioma, string> = { es: 'Castellano', gl: 'Galego', en: 'English' }
