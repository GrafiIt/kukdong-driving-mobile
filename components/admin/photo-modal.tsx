'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface PhotoModalProps {
  images: string[]
  title?: string
  onClose: () => void
}

export function PhotoModal({ images, title, onClose }: PhotoModalProps) {
  // ESC 키로 닫기 + 스크롤 잠금
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="사진 미리보기"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {title ?? '점검 사진'} ({images.length}장)
          </h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {images.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url || '/placeholder.svg'}
              alt={`점검 사진 ${i + 1}`}
              className="w-full rounded-xl border border-slate-200 object-contain"
              crossOrigin="anonymous"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
