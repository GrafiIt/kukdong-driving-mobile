import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"
import { getCookieDomain } from "./cookie-domain"

/**
 * 서버(서버 컴포넌트 / Route Handler / Server Action)용 Supabase 클라이언트.
 *
 * Fluid compute 환경에서 클라이언트를 전역 변수에 저장하지 말고,
 * 매 요청마다 새로 생성해야 한다.
 *
 * 쿠키 도메인은 현재 요청의 host 헤더를 기준으로 분기 처리한다.
 * - *.1004.help  → `.1004.help` (서브도메인 간 세션 공유)
 * - localhost 등 → domain 미지정
 */
export async function createClient() {
  const cookieStore = await cookies()
  const headerStore = await headers()

  // host 헤더에서 포트를 제거한 순수 hostname 추출
  const hostname = headerStore.get("host")?.split(":")[0] ?? null
  const cookieDomain = getCookieDomain(hostname)

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: cookieDomain,
        path: "/",
        sameSite: "lax",
        secure: cookieDomain !== undefined,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // Supabase 가 넘기는 options 에는 domain 이 없으므로 강제 병합한다.
              cookieStore.set(name, value, {
                ...options,
                domain: cookieDomain,
                path: "/",
                sameSite: "lax",
                secure: cookieDomain !== undefined,
              }),
            )
          } catch {
            // "setAll" 이 서버 컴포넌트에서 호출된 경우 무시 가능.
            // 미들웨어에서 세션을 갱신하고 있다면 문제되지 않는다.
          }
        },
      },
    },
  )
}
