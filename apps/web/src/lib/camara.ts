/** Cámara trasera si la hay, a la mayor resolución razonable. */
export async function abrirCamara(video: HTMLVideoElement): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador no puede usar la cámara.')
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
  })
  video.srcObject = stream
  video.setAttribute('playsinline', 'true')
  await video.play()
  return stream
}

export function cerrarCamara(stream: MediaStream | null) {
  stream?.getTracks().forEach(t => t.stop())
}

/** Copia el fotograma actual a un canvas y devuelve sus píxeles. */
export function capturar(video: HTMLVideoElement, canvas: HTMLCanvasElement, maxAncho = 1920): ImageData | null {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) return null
  const f = Math.min(1, maxAncho / vw)
  canvas.width = Math.round(vw * f)
  canvas.height = Math.round(vh * f)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}
