'use client'

import React, { useState, useEffect } from 'react'
// 내부 프로젝트 경로(@/lib/...) 대신 공식 라이브러리를 직접 호출합니다.
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface EnvStatus {
  url: boolean
  anonKey: boolean
}

interface QueryResult {
  data?: unknown
  error?: {
    message: string
    code?: string
  }
  loading?: boolean
}

export default function TestDbPage() {
  const [envStatus, setEnvStatus] = useState<EnvStatus>({ url: false, anonKey: false })
  const [tableName, setTableName] = useState('partners')
  const [queryResult, setQueryResult] = useState<QueryResult>({})
  const [isLoading, setIsLoading] = useState(false)

  // 컴포넌트 마운트 시 환경 변수 체크
  useEffect(() => {
    const url = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setEnvStatus({ url, anonKey })
  }, [])

  const handleTest = async () => {
    setIsLoading(true)
    setQueryResult({ loading: true })

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        throw new Error('환경변수(URL 또는 ANON_KEY)가 설정되지 않았습니다.')
      }

      // 페이지 내부에서 클라이언트를 직접 생성하여 외부 파일 의존성을 완전히 없앱니다.
      const supabase = createClient(url, key)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(3)

      if (error) {
        setQueryResult({
          error: {
            message: error.message,
            code: error.code || 'UNKNOWN_ERROR',
          },
        })
      } else {
        setQueryResult({ data })
      }
    } catch (err) {
      const error = err as Error
      setQueryResult({
        error: {
          message: error.message || '알 수 없는 오류가 발생했습니다.',
          code: 'EXCEPTION',
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Supabase 연결 테스트</h1>
          <p className="text-slate-400">환경변수 상태 및 데이터베이스 연결성을 확인합니다</p>
        </div>

        {/* Environment Status Card */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-lg font-semibold text-white">환경변수 상태</h3>
            <p className="text-sm text-slate-400">필수 환경변수 확인</p>
          </div>
          <div className="p-6 pt-0 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-700/50 p-4">
              <span className="text-slate-300">NEXT_PUBLIC_SUPABASE_URL</span>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${envStatus.url ? 'bg-green-500' : 'bg-red-500'
                    }`}
                />
                <span className={envStatus.url ? 'text-green-400' : 'text-red-400'}>
                  {envStatus.url ? '✓ 설정됨' : '✗ 미설정'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-700/50 p-4">
              <span className="text-slate-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${envStatus.anonKey ? 'bg-green-500' : 'bg-red-500'
                    }`}
                />
                <span className={envStatus.anonKey ? 'text-green-400' : 'text-red-400'}>
                  {envStatus.anonKey ? '✓ 설정됨' : '✗ 미설정'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Query Tester Card */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-lg font-semibold text-white">데이터베이스 쿼리 테스트</h3>
            <p className="text-sm text-slate-400">테이블에서 최대 3개 행을 조회합니다</p>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="테이블명 입력 (예: users)"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                onClick={handleTest}
                disabled={isLoading || !envStatus.url || !envStatus.anonKey}
                className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? '로딩 중...' : '테스트'}
              </button>
            </div>

            {/* Results */}
            {queryResult.data !== undefined && (
              <div className="rounded-lg bg-slate-700/50 p-4">
                <p className="mb-2 text-sm font-semibold text-green-400">✓ 성공</p>
                <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-sm text-slate-200">
                  {JSON.stringify(queryResult.data, null, 2)}
                </pre>
              </div>
            )}

            {queryResult.error && (
              <div className="rounded-lg border-2 border-red-500/50 bg-red-900/20 p-4">
                <p className="mb-3 font-semibold text-red-400">✗ 오류 발생</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Message: </span>
                    <span className="text-red-300">{queryResult.error.message}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Code: </span>
                    <span className="font-mono text-red-300">{queryResult.error.code}</span>
                  </div>
                </div>
              </div>
            )}

            {queryResult.loading && !queryResult.data && !queryResult.error && (
              <div className="rounded-lg bg-slate-700/50 p-4 text-center">
                <p className="text-slate-400">조회 중...</p>
              </div>
            )}
          </div>
        </div>

        {/* Help Card */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-lg font-semibold text-white">문제 해결</h3>
          </div>
          <div className="p-6 pt-0 space-y-2 text-sm text-slate-400">
            <p>
              <span className="font-semibold text-slate-300">401 에러:</span> Anon Key가 만료되었거나 잘못되었습니다.
            </p>
            <p>
              <span className="font-semibold text-slate-300">PGRST116:</span> 테이블이 존재하지 않거나 권한이 없습니다. (RLS 정책 확인)
            </p>
            <p>
              <span className="font-semibold text-slate-300">환경변수 미설정:</span> Vercel 설정 또는 .env 파일에 환경변수가 정상적으로 주입되었는지 확인하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}