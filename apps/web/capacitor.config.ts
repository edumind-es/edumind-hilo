import type { CapacitorConfig } from '@capacitor/cli'

// La app nativa envuelve la PWA compilada. webDir es un directorio REAL
// (no el enlace simbólico dist, que Capacitor copiaría como enlace): lo
// genera `npm run nativo:sync`.
const config: CapacitorConfig = {
  appId: 'es.edumind.hilo',
  appName: 'Hilo',
  webDir: 'dist-nativo',
  server: { androidScheme: 'https' },
}

export default config
