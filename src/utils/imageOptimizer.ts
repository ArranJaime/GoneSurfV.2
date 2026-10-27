/**
 * Gone Surfing - Client-Side Image Optimizer
 * Resizes and compresses user-uploaded images via HTML5 Canvas to WebP/JPEG (max 800px).
 * Prevents exceeding the 5MB browser localStorage quota while generating binary Blobs
 * ready for direct Amazon S3 Presigned URL uploads.
 */

export interface OptimizedImageResult {
  dataUrl: string
  blob: Blob
  width: number
  height: number
  sizeKb: number
  format: "webp" | "jpeg" | "png"
}

/**
 * Resizes and compresses an image File using an offscreen canvas.
 *
 * @param file The original image File from an <input type="file">
 * @param maxDimension Maximum width or height (default 800px)
 * @param quality Compression quality from 0.1 to 1.0 (default 0.82)
 */
export async function optimizeImageFile(
  file: File,
  maxDimension = 800,
  quality = 0.82,
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    // Basic file validation
    if (!file || !file.type.startsWith("image/")) {
      return reject(
        new Error("El archivo proporcionado no es una imagen válida."),
      )
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      // Compute aspect ratio downscaling
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      // Create offscreen canvas
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, width)
      canvas.height = Math.max(1, height)

      const ctx = canvas.getContext("2d", { alpha: true })
      if (!ctx) {
        return reject(new Error("No se pudo obtener el contexto 2D de Canvas."))
      }

      // High-quality downsampling smoothing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, 0, 0, width, height)

      // Try WebP first; check if browser supports WebP canvas export
      const webpDataUrl = canvas.toDataURL("image/webp", quality)
      const supportsWebp = webpDataUrl.startsWith("data:image/webp")

      const finalFormat = supportsWebp ? "image/webp" : "image/jpeg"
      const finalDataUrl = supportsWebp
        ? webpDataUrl
        : canvas.toDataURL("image/jpeg", quality)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback blob creation from dataUrl
            const binary = atob(finalDataUrl.split(",")[1])
            const array = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
              array[i] = binary.charCodeAt(i)
            }
            const fallbackBlob = new Blob([array], { type: finalFormat })
            resolve({
              dataUrl: finalDataUrl,
              blob: fallbackBlob,
              width,
              height,
              sizeKb: Math.round(fallbackBlob.size / 1024),
              format: supportsWebp ? "webp" : "jpeg",
            })
            return
          }

          resolve({
            dataUrl: finalDataUrl,
            blob,
            width,
            height,
            sizeKb: Math.round(blob.size / 1024),
            format: supportsWebp ? "webp" : "jpeg",
          })
        },
        finalFormat,
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("No se pudo decodificar la imagen seleccionada."))
    }

    img.src = objectUrl
  })
}
