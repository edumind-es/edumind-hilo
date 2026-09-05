import QRCode from 'qrcode'

/** SVG del QR como cadena, para incrustar en pantalla o en la hoja impresa. */
export function qrSvg(texto: string, nivel: 'L' | 'M' | 'Q' | 'H' = 'M'): Promise<string> {
  return QRCode.toString(texto, { type: 'svg', errorCorrectionLevel: nivel, margin: 1 })
}
