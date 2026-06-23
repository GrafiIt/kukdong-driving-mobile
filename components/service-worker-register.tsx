'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] 서비스 워커 등록 성공:', registration.scope)
        })
        .catch((error) => {
          console.error('[SW] 서비스 워커 등록 실패:', error)
        })
    }
  }, [])

  return null
}
