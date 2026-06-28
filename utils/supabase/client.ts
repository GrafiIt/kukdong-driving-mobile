import { createBrowserClient } from "@supabase/ssr"
import { getCookieDomain } from "./cookie-domain"

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 *
 * 현재 접속한 hostname 을 기준으로 쿠키 도메인을 분기 처리한다.
 * - *.1004.help  → `.1004.help` (서브도메인 간 세션 공유)
 * - localhost 등 → domain 미지정
 */
export function createClient() {
  const hostname = typeof window !== "undefined" ? window.location.hostname : undefined
  const cookieDomain = getCookieDomain(hostname)

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // domain 이 undefined 면 옵션이 무시되어 호스트 전용 쿠키로 동작한다.
        domain: cookieDomain,
        path: "/",
        sameSite: "lax",
        // 운영(https) 도메인에서만 secure 적용
        secure: cookieDomain !== undefined,
      },
    },
  )
}
