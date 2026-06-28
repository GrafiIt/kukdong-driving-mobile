'use client'

import { useState, useCallback } from 'react'
import { createInitialResults, type InspectionResult } from '@/lib/checklist-data'
import { dataUrlToBlob } from '@/lib/compress-image'
import { createClient } from '@/utils/supabase/client'
import StartScreen from '@/components/checklist/start-screen'
import InspectionScreen from '@/components/checklist/inspection-screen'
import SummaryScreen from '@/components/checklist/summary-screen'

type Step = 'start' | 'inspection' | 'summary'

const DRIVER_NAME = '이윤상'
const VEHICLE_NUMBER = '부산 99바 1234'

export default function ChecklistPage() {
  const [step, setStep] = useState<Step>('start')
  const [results, setResults] = useState<Record<string, InspectionResult>>(createInitialResults)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // ── 단일 항목 결과 업데이트 ──
  const handleUpdateResult = useCallback(
    (itemId: string, update: Partial<InspectionResult>) => {
      setResults((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], ...update },
      }))
    },
    []
  )

  // ── Supabase 제출 ──
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()

      // 1) 마스터 레코드 INSERT
      const { data: inspection, error: inspectionError } = await supabase
        .schema('driver-checklist')
        .from('bestdriver_inspections')
        .insert({
          driver_name: DRIVER_NAME,
          vehicle_number: VEHICLE_NUMBER,
          inspected_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (inspectionError || !inspection) {
        throw new Error(inspectionError?.message ?? '점검 마스터 저장 실패')
      }

      const inspectionId: string = inspection.id

      // 2) 항목별 결과 INSERT + 이미지 업로드
      const itemRows: object[] = []

      for (const [itemId, result] of Object.entries(results)) {
        const imageUrls: string[] = []

        // 이미지 압축 후 Storage 업로드
        if (result.images && result.images.length > 0) {
          for (let i = 0; i < result.images.length; i++) {
            const img = result.images[i]
            const blob = dataUrlToBlob(img.dataUrl)
            const filePath = `${inspectionId}/${itemId}_${i + 1}.jpg`

            const { error: uploadError } = await supabase.storage
              .from('bestdriver-inspection-images')
              .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true })

            if (!uploadError) {
              const { data: publicUrl } = supabase.storage
                .from('bestdriver-inspection-images')
                .getPublicUrl(filePath)
              imageUrls.push(publicUrl.publicUrl)
            }
          }
        }

        itemRows.push({
          inspection_id: inspectionId,
          item_id: itemId,
          status: result.status,
          number_value: result.numberValue ?? null,
          note: result.note ?? null,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
        })
      }

      const { error: itemsError } = await supabase
        .schema('driver-checklist')
        .from('bestdriver_inspection_items')
        .insert(itemRows)

      if (itemsError) {
        throw new Error(itemsError.message)
      }

      setIsSubmitted(true)
    } catch (err) {
      console.error('[v0] 제출 오류:', err)
      alert('제출 중 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── 화면 렌더링 ──
  if (step === 'start') {
    return (
      <StartScreen
        results={results}
        onStart={() => setStep('inspection')}
      />
    )
  }

  if (step === 'inspection') {
    return (
      <InspectionScreen
        results={results}
        onUpdateResult={handleUpdateResult}
        onFinish={() => setStep('summary')}
        onBack={() => setStep('start')}
      />
    )
  }

  return (
    <SummaryScreen
      results={results}
      onBack={() => setStep('inspection')}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isSubmitted={isSubmitted}
    />
  )
}
