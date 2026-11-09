export async function compressImage(
  file: File,
  options: { maxWidth?: number; quality?: number } = {},
) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (PNG, JPG, WebP).')
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('Image is larger than 12 MB. Please choose a smaller file.')
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.readAsDataURL(file)
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Could not decode that image.'))
    element.src = dataUrl
  })

  const maxWidth = options.maxWidth ?? 1600
  const scale = Math.min(1, maxWidth / image.width)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return dataUrl

  context.fillStyle = '#0b0f17'
  context.fillRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', options.quality ?? 0.78)
}
