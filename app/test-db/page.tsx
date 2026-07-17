'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  // Check environment variables on mount
  useEffect(() => {
    const url = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setEnvStatus({ url, anonKey })
  }, [])

  const handleTest = async () => {
    setIsLoading(true)
    setQueryResult({ loading: true })

    try {
      const supabase = createClient()
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
          message: error.message || 'Unknown error occurred',
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
          <h1 className="text-4xl font-bold text-white">Supabase �곌껐 �뚯뒪��</h1>
          <p className="text-slate-400">�섍꼍蹂��� �곹깭 諛� �곗씠�곕쿋�댁뒪 �곌껐�깆쓣 �뺤씤�⑸땲��</p>
        </div>

        {/* Environment Status Card */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-lg font-semibold text-white">�섍꼍蹂��� �곹깭</h3>
            <p className="text-sm text-slate-400">�꾩닔 �섍꼍蹂��� �뺤씤</p>
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
                  {envStatus.url ? '�� �ㅼ젙��' : '�� 誘몄꽕��'}
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
                  {envStatus.anonKey ? '�� �ㅼ젙��' : '�� 誘몄꽕��'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Query Tester Card */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-lg font-semibold text-white">�곗씠�곕쿋�댁뒪 荑쇰━ �뚯뒪��</h3>
            <p className="text-sm text-slate-400">�뚯씠釉붿뿉�� 理쒕� 3媛� �됱쓣 議고쉶�⑸땲��</p>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="�뚯씠釉붾챸"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                onClick={handleTest}
                disabled={isLoading || !envStatus.url || !envStatus.anonKey}
                className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? '濡쒕뵫 以�...' : '�뚯뒪��'}
              </button>
            </div>

            {/* Results */}
            {queryResult.data !== undefined && (
              <div className="rounded-lg bg-slate-700/50 p-4">
                <p className="mb-2 text-sm font-semibold text-green-400">�� �깃났</p>
                <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-sm text-slate-200">
                  {JSON.stringify(queryResult.data, null, 2)}
                </pre>
              </div>
            )}

            {queryResult.error && (
              <div className="rounded-lg border-2 border-red-500/50 bg-red-900/20 p-4">
                <p className="mb-3 font-semibold text-red-400">�� �ㅻ쪟 諛쒖깮</p>
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
                <p className="text-slate-400">議고쉶 以�...</p>
              </div>
            )}
          </div>
        </div>

        {/* Help Card */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-lg font-semibold text-white">臾몄젣 �닿껐</h3>
          </div>
          <div className="p-6 pt-0 space-y-2 text-sm text-slate-400">
            <p>
              <span className="font-semibold text-slate-300">401 �먮윭:</span> Anon Key媛� 留뚮즺�섏뿀嫄곕굹 �섎せ�섏뿀�듬땲��.
            </p>
            <p>
              <span className="font-semibold text-slate-300">PGRST116:</span> �뚯씠釉붿씠 議댁옱�섏� �딄굅�� 沅뚰븳�� �놁뒿�덈떎.
            </p>
            <p>
              <span className="font-semibold text-slate-300">�섍꼍蹂��� 誘몄꽕��:</span> .env �뚯씪�� �섍꼍蹂��섍� �뺤긽�곸쑝濡� 二쇱엯�섏뿀�붿� �뺤씤�섏꽭��.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}