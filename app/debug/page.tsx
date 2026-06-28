import { cookies, headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export const dynamic = "force-dynamic"

interface Section {
  title: string
  data: unknown
}

function DebugSection({ title, data }: Section) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="bg-slate-800 px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {title}
        </h2>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-700 bg-slate-50">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

export default async function DebugPage() {
  const cookieStore = await cookies()
  const headersList = await headers()

  // ── 모든 쿠키 수집 ──────────────────────────────────────
  const allCookies = cookieStore.getAll().map((c) => ({
    name: c.name,
    value: c.value.length > 80 ? `${c.value.slice(0, 80)}…(${c.value.length}자)` : c.value,
  }))

  // ── 주요 요청 헤더 수집 ──────────────────────────────────
  const importantHeaders = [
    "host",
    "x-forwarded-host",
    "x-forwarded-proto",
    "x-forwarded-for",
    "x-real-ip",
    "referer",
    "user-agent",
    "cookie",
  ]
  const headersMap: Record<string, string> = {}
  importantHeaders.forEach((key) => {
    const val = headersList.get(key)
    if (val) {
      // cookie 헤더는 길어서 앞부분만 표시
      headersMap[key] = key === "cookie" && val.length > 120 ? `${val.slice(0, 120)}…` : val
    }
  })

  // 위에 없는 나머지 헤더도 모두 수집
  const allHeadersMap: Record<string, string> = { ...headersMap }
  for (const [key, value] of headersList.entries()) {
    if (!allHeadersMap[key]) {
      allHeadersMap[key] = value.length > 120 ? `${value.slice(0, 120)}…` : value
    }
  }

  // ── Supabase getUser() 호출 ───────────────────────────────
  let authResult: Record<string, unknown>
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    authResult = {
      user_id: data.user?.id ?? null,
      email: data.user?.email ?? null,
      role: data.user?.role ?? null,
      aud: data.user?.aud ?? null,
      last_sign_in_at: data.user?.last_sign_in_at ?? null,
      error: error?.message ?? null,
    }
  } catch (e) {
    authResult = { error: String(e) }
  }

  // ── 호스트 / 도메인 분석 ─────────────────────────────────
  const host = headersList.get("host") ?? "unknown"
  const proto = headersList.get("x-forwarded-proto") ?? "http"
  const currentUrl = `${proto}://${host}`
  const is1004Domain = host.endsWith(".1004.help")
  const cookieDomainWouldBe = is1004Domain ? ".1004.help" : "(없음 — localhost/기타)"

  const domainAnalysis = {
    host,
    proto,
    currentUrl,
    is1004Domain,
    cookieDomainWouldBe,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(env 없음)",
    supabaseAnonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 20)}…`
      : "(env 없음)",
  }

  const sections: Section[] = [
    { title: "도메인 / 환경 분석", data: domainAnalysis },
    { title: "Supabase auth.getUser() 결과", data: authResult },
    { title: `쿠키 목록 (${allCookies.length}개)`, data: allCookies },
    { title: `요청 헤더 전체 (${Object.keys(allHeadersMap).length}개)`, data: allHeadersMap },
  ]

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* 헤더 */}
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800">
            DEBUG MODE — 이 페이지는 미들웨어를 통과하지 않습니다. 운영 배포 전 반드시 제거하세요.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            생성 시각: {new Date().toISOString()}
          </p>
        </div>

        <h1 className="text-xl font-bold text-slate-800">
          쿠키 &amp; 세션 디버그
        </h1>

        {sections.map((s) => (
          <DebugSection key={s.title} title={s.title} data={s.data} />
        ))}
      </div>
    </main>
  )
}
