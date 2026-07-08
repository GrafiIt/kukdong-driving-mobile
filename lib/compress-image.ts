import type { CompressedImage } from './checklist-data'

/**
 * Canvas API를 활용해 이미지를 최대 0.5MB(500KB) 이하로 압축·리사이징합니다.
 *
 * 전략:
 *  - 최대 해상도를 1024px × 768px 로 제한 (일반 휴대폰 사진은 보통 4000px 이상)
 *  - JPEG quality를 0.45부터 시작해 0.5MB 이하가 될 때까지 단계적으로 낮춤
 *  - 품질을 최소치까지 낮춰도 초과하면 해상도를 추가로 축소
 *  - crossOrigin="anonymous" 설정으로 CORS 오류 방지
 */
const MAX_WIDTH = 1024
const MAX_HEIGHT = 768
const QUALITY = 0.45
const TARGET_SIZE = 0.5 * 1024 * 1024 // 0.5MB = 512000 bytes
const MIN_QUALITY = 0.25

/** dataURL(base64)의 실제 바이트 용량을 근사 계산 */
function estimateSize(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',')
  const base64Length = dataUrl.length - (commaIndex + 1)
  return Math.round((base64Length * 3) / 4)
}

export function compressImage(file: File): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string

      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        // ── 비율 유지 리사이징 계산 ──
        let { width, height } = img

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const renderToDataUrl = (w: number, h: number, quality: number): string => {
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas context를 얻을 수 없습니다.')
          ctx.drawImage(img, 0, 0, w, h)
          return canvas.toDataURL('image/jpeg', quality)
        }

        try {
          // ── 1) 품질을 낮춰가며 0.5MB 이하 목표 ──
          let quality = QUALITY
          let compressedDataUrl = renderToDataUrl(width, height, quality)
          while (estimateSize(compressedDataUrl) > TARGET_SIZE && quality > MIN_QUALITY) {
            quality = Math.max(MIN_QUALITY, quality - 0.1)
            compressedDataUrl = renderToDataUrl(width, height, quality)
          }

          // ── 2) 그래도 초과하면 해상도를 단계적으로 축소 ──
          while (estimateSize(compressedDataUrl) > TARGET_SIZE && width > 320 && height > 240) {
            width = Math.round(width * 0.85)
            height = Math.round(height * 0.85)
            compressedDataUrl = renderToDataUrl(width, height, quality)
          }

          resolve({
            dataUrl: compressedDataUrl,
            fileName: file.name,
            originalSize: file.size,
            compressedSize: estimateSize(compressedDataUrl),
          })
        } catch (err) {
          reject(err instanceof Error ? err : new Error('이미지 압축에 실패했습니다.'))
        }
      }

      img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'))
      img.src = dataUrl
    }

    reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'))
    reader.readAsDataURL(file)
  })
}

/** 용량을 사람이 읽기 쉬운 형식으로 변환 (예: "245 KB") */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * CompressedImage의 dataUrl을 Supabase Storage 업로드용 Blob으로 변환합니다.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}
