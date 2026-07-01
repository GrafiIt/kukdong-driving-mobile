'use client'

import { useState, useCallback } from 'react'
import { createInitialResults, type InspectionResult, type CompressedImage } from '@/lib/checklist-data'
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
  // 수정 모드일 때 재사용할 기존 마스터 레코드 id (신규 작성 시 null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)

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

  // ── 신규 점검 시작 ──
  const handleStart = useCallback(() => {
    setEditingId(null)
    setResults(createInitialResults())
    setStep('inspection')
  }, [])

  // ── 오늘 작성한 기록 불러와 수정 모드 진입 ──
  const handleEdit = useCallback(async (inspectionId: string) => {
    setIsLoadingEdit(true)
    try {
      const supabase = createClient()

      // 기존 마스터에 엮인 디테일 항목 전체 조회
      const { data: items, error: itemsError } = await supabase
        .schema('driver-checklist')
        .from('kukdong_driver_inspection_items')
        .select('item_id, status, number_value, note, image_urls')
        .eq('inspection_id', inspectionId)

      if (itemsError) {
        throw new Error(itemsError.message)
      }

      // 초기 맵을 만든 뒤 저장된 값으로 덮어쓰기
      const loaded = createInitialResults()
      for (const row of items ?? []) {
        const itemId: string = row.item_id
        if (!loaded[itemId]) continue
        // 기존 이미지 URL → CompressedImage 형태로 매핑 (dataUrl 자리에 원격 URL 보관)
        const images: CompressedImage[] = Array.isArray(row.image_urls)
          ? row.image_urls.map((url: string, idx: number) => ({
              dataUrl: url,
              fileName: `existing_${idx + 1}.jpg`,
              originalSize: 0,
              compressedSize: 0,
            }))
          : []

        loaded[itemId] = {
          itemId,
          status: (row.status as InspectionResult['status']) ?? 'pending',
          numberValue: row.number_value ?? undefined,
          note: row.note ?? undefined,
          images: images.length > 0 ? images : undefined,
        }
      }

      setResults(loaded)
      setEditingId(inspectionId)
      setStep('inspection')
    } catch (err) {
      console.error('[v0] 수정 데이터 불러오기 오류:', err)
      alert('기존 점검 데이터를 불러오지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setIsLoadingEdit(false)
    }
  }, [])

  // ── Supabase 제출 (신규 INSERT / 수정 UPDATE 분기) ──
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const isEditing = editingId !== null
      let inspectionId: string

      if (isEditing) {
        // [수정 모드] 기존 마스터 id 재사용 + 디테일 전체 삭제 후 재삽입
        inspectionId = editingId as string

        const { error: updateError } = await supabase
          .schema('driver-checklist')
          .from('kukdong_driver_inspections')
          .update({
            driver_name: DRIVER_NAME,
            vehicle_number: VEHICLE_NUMBER,
            inspected_at: new Date().toISOString(),
          })
          .eq('id', inspectionId)

        if (updateError) {
          throw new Error('점검 마스터 수정 실패: ' + updateError.message)
        }

        // 기존 디테일 레코드 모두 삭제
        const { error: deleteError } = await supabase
          .schema('driver-checklist')
          .from('kukdong_driver_inspection_items')
          .delete()
          .eq('inspection_id', inspectionId)

        if (deleteError) {
          throw new Error('기존 점검 항목 삭제 실패: ' + deleteError.message)
        }
      } else {
        // [신규 모드] 마스터 레코드 INSERT
        const { data: inspection, error: inspectionError } = await supabase
          .schema('driver-checklist')
          .from('kukdong_driver_inspections')
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

        inspectionId = inspection.id
      }

      // 항목별 결과 INSERT + 이미지 업로드
      const itemRows: object[] = []

      for (const [itemId, result] of Object.entries(results)) {
        const imageUrls: string[] = []

        if (result.images && result.images.length > 0) {
          for (let i = 0; i < result.images.length; i++) {
            const img = result.images[i]

            // 기존 원격 URL(http...)은 재업로드 없이 그대로 재사용
            if (!img.dataUrl.startsWith('data:')) {
              imageUrls.push(img.dataUrl)
              continue
            }

            // 신규 이미지(base64)는 압축본을 Storage에 업로드 (덮어쓰기 유지)
            const blob = dataUrlToBlob(img.dataUrl)
            const filePath = `${inspectionId}/${itemId}_${i + 1}.jpg`

            const { error: uploadError } = await supabase.storage
              .from('kukdong-driver-inspection-images')
              .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true })

            // 업로드 실패 시: 로그 출력 후 즉시 중단 (텍스트 데이터 저장 방지)
            if (uploadError) {
              console.error('[v0] 이미지 업로드 실패:', filePath, uploadError)
              throw new Error('이미지 업로드에 실패했습니다: ' + uploadError.message)
            }

            const { data: publicUrl } = supabase.storage
              .from('kukdong-driver-inspection-images')
              .getPublicUrl(filePath)
            imageUrls.push(publicUrl.publicUrl)
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
        .from('kukdong_driver_inspection_items')
        .insert(itemRows)

      if (itemsError) {
        throw new Error(itemsError.message)
      }

      alert(isEditing ? '점검일지가 수정되었습니다.' : '점검일지가 저��되었습니다.')
      // 시작 화면으로 복귀 + 상태 초기화
      setResults(createInitialResults())
      setEditingId(null)
      setStep('start')
    } catch (err) {
      console.error('[v0] 제출 오류:', err)
      const message = err instanceof Error ? err.message : '제출 중 오류가 발생했습니다.'
      alert(message + '\n다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── 화면 렌더링 ──
  if (step === 'start') {
    return (
      <StartScreen
        results={results}
        onStart={handleStart}
        onEdit={handleEdit}
        isLoadingEdit={isLoadingEdit}
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
    />
  )
}
