import type { CompressedImage } from './checklist-data'

/**
 * Canvas API를 활용해 이미지를 원본의 약 1/8 수준으로 압축·리사이징합니다.
 *
 * 전략:
 *  - 최대 해상도를 1280px × 960px 로 제한 (일반 휴대폰 사진은 보통 4000px 이상)
 *  - JPEG quality 0.50 으로 추가 압축 (해상도↓ × 품질↓ = 약 1/8 용량 달성)
 *  - crossOrigin="anonymous" 설정으로 CORS 오류 방지
 */
const MAX_WIDTH = 1280
const MAX_HEIGHT = 960
const QUALITY = 0.5

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

        // ── Canvas에 그리고 압축 ──
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context를 얻을 수 없습니다.'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        const compressedDataUrl = canvas.toDataURL('image/jpeg', QUALITY)

        // ── 용량 계산 (base64 → bytes 근사) ──
        const base64Length = compressedDataUrl.length - 'data:image/jpeg;base64,'.length
        const compressedSize = Math.round((base64Length * 3) / 4)

        resolve({
          dataUrl: compressedDataUrl,
          fileName: file.name,
          originalSize: file.size,
          compressedSize,
        })
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
