import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getCookieDomain } from "@/utils/supabase/cookie-domain"

// ── 통합 인증/구독 시스템 상수 ──────────────────────────────
/** 현재 SaaS 프로그램의 고유 서비스명 (DB 저장 키값) */
const PROGRAM_ID = "drivermgmt"
/** 통합 결제 사이트 로그인 주소 */
const LOGIN_URL = "https://payment.1004.help/auth/login"
/** 통합 결제 사이트 구독 관리 주소 */
const SUBSCRIPTION_URL = "https://payment.1004.help/dashboard/subscriptions"
// ────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  // 현재 접속 도메인 기반 쿠키 도메인 분기 (.1004.help 또는 localhost 등)
  const hostname = request.headers.get("host")?.split(":")[0] ?? null
  const cookieDomain = getCookieDomain(hostname)

  let supabaseResponse = NextResponse.next({ request })

  // Fluid compute 환경: 매 요청마다 새 클라이언트 생성 (전역 변수 금지)
  const supabase = createServerClient(
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
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            // Supabase가 넘기는 options 에는 domain 이 없으므로 강제 병합한다.
            supabaseResponse.cookies.set(name, value, {
              ...options,
              domain: cookieDomain,
              path: "/",
              sameSite: "lax",
              secure: cookieDomain !== undefined,
            }),
          )
        },
      },
    },
  )

  // createServerClient 와 getUser() 사이에 다른 코드를 넣지 말 것.
  // 작은 실수로도 사용자가 무작위로 로그아웃되는 디버깅이 어려운 문제가 발생할 수 있다.

  // ── 케이스 A: 미인증 → 로그인 페이지로 리다이렉트 ────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // 현재 접속한 도메인/경로를 동적으로 감지하여 next 파라미터 구성
    const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")
    const host = request.headers.get("host") ?? request.nextUrl.host
    const currentUrl = `${proto}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`

    const loginUrl = new URL(LOGIN_URL)
    loginUrl.searchParams.set("next", currentUrl)
    return NextResponse.redirect(loginUrl)
  }

  // ── 케이스 B: 인증됨, SaaS 권한 없음/만료 ────────────────
  // all_use_programs 스키마의 user_saas_permissions 테이블 단일 조회
  const { data: permission } = await supabase
    .schema("all_use_programs")
    .from("user_saas_permissions")
    .select("is_active, expires_at")
    .eq("user_id", user.id)
    .eq("program_id", PROGRAM_ID)
    .single()

  const isExpired = permission?.expires_at
    ? new Date(permission.expires_at).getTime() < Date.now()
    : true

  if (!permission || permission.is_active !== true || isExpired) {
    // next 파라미터를 절대로 붙이지 않는다.
    // next 를 붙이면 payment 사이트가 다시 이쪽으로 튕겨내어 무한 루프가 발생한다.
    return NextResponse.redirect(SUBSCRIPTION_URL)
  }

  // ── 케이스 C: 인증됨, SaaS 권한도 있음 → 정상 통과 ───────
  // 세션 쿠키 갱신 정보를 유지하기 위해 supabaseResponse 를 그대로 반환한다.
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 매칭:
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico, 정적 이미지 (svg, png, jpg 등)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
