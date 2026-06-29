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
  // ── 개발/프리뷰 환경 예외 처리 ────────────────────────────
  // *.vercel.app 도메인(v0 테스트 도메인)은 쿠키 도메인이 달라
  // 검증 로직을 거치면 무한 리다이렉트가 발생하므로 바로 통과시킨다.
  const requestHostname = request.nextUrl.hostname
  if (requestHostname.endsWith(".vercel.app")) {
    return NextResponse.next()
  }
  // ─────────────────────────────────────────────────────────

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

  // ── 케이스 A: 미인증 처리 ─────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (!user) {
    // 메인 페이지(/)는 미인증이더라도 통과 — 클라이언트에서 팝업으로 안내
    if (pathname === "/") {
      console.log("[Middleware] 케이스 A: 미인증이지만 메인 페이지는 통과 (팝업으로 안내)")
      return supabaseResponse
    }

    // 내부 서비스/관리자 페이지는 기존처럼 미들웨어 단에서 강력 차단
    const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")
    const host = request.headers.get("host") ?? request.nextUrl.host
    const currentUrl = `${proto}://${host}${pathname}${request.nextUrl.search}`

    const loginUrl = new URL(LOGIN_URL)
    loginUrl.searchParams.set("next", currentUrl)
    console.log("[Middleware] 케이스 A: 미인증 - 로그인으로 이동", { cookieDomain, loginUrl: loginUrl.toString() })
    return NextResponse.redirect(loginUrl)
  }

  console.log("[Middleware] 세션 확인됨 - user.id:", user.id)

  // ── 케이스 B: 인증됨, SaaS 권한 없음/만료 ────────────────
  // all_use_programs 스키마의 user_saas_permissions 테이블 단일 조회
  const { data: permission, error: permError } = await supabase
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
    console.log("[Middleware] 케이스 B: 권한 없음/만료 - 구독 페이지로 이동", {
      permission,
      isExpired,
      permError: permError?.message,
    })
    // next 파라미터를 절대로 붙이지 않는다.
    // next 를 붙이면 payment 사이트가 다시 이쪽으로 튕겨내어 무한 루프가 발생한다.
    return NextResponse.redirect(SUBSCRIPTION_URL)
  }

  // ── 케이스 C: 인증됨, SaaS 권한도 있음 → 정상 통과 ───────
  console.log("[Middleware] 케이스 C: 인증 + 권한 확인 - 정상 통과", {
    is_active: permission.is_active,
    expires_at: permission.expires_at,
  })
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
     * - manifest.json, sw.js (PWA 관련 파일)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|debug|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
