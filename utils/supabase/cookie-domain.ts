/**
 * 통합 인증 시스템용 쿠키 도메인 결정 헬퍼
 *
 * - 운영 환경(*.1004.help 커스텀 도메인)에서는 루트 도메인 `.1004.help`로 쿠키를 발급하여
 *   payment.1004.help / bestdriver.1004.help 등 모든 서브도메인이 세션을 공유하도록 한다.
 * - 로컬 개발 환경(localhost)이나 1004.help 가 아닌 호스트에서는 domain 을 설정하지 않는다.
 *   (localhost 에 `.1004.help` 도메인을 지정하면 쿠키가 저장되지 않거나 에러가 발생함)
 */

export const SHARED_COOKIE_DOMAIN = ".1004.help"

/**
 * 주어진 hostname 기준으로 공유 쿠키 도메인을 반환한다.
 * 공유 도메인을 적용하지 않아야 하는 경우(undefined)에는 domain 옵션을 생략한다.
 */
export function getCookieDomain(hostname?: string | null): string | undefined {
  if (!hostname) return undefined

  // 로컬 개발 환경 (localhost, 127.0.0.1) 및 IP 접속은 도메인 미지정
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0"
  ) {
    return undefined
  }

  // *.1004.help 도메인에서만 루트 도메인 쿠키를 공유한다.
  if (hostname === "1004.help" || hostname.endsWith(".1004.help")) {
    return SHARED_COOKIE_DOMAIN
  }

  // 그 외 도메인(미리보기 배포 등)에서는 호스트 전용 쿠키를 사용한다.
  return undefined
}
