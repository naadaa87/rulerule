// 네이버 서치어드바이저 사이트 소유 확인 파일
// Cloudflare Pages는 .html 주소를 확장자 없는 주소로 옮기는데, 네이버 확인 도구가 그대로 읽을 수 있게 함수로 바로 답해요.
export function onRequest() {
  return new Response('naver-site-verification: naver166f723b5ee950517c79af0092638755.html', {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
