// 운영 관리 로그인
// - POST /api/admin-login {pw, remember} → 서명한 토큰을 돌려줘요 (12시간, '이 기기 기억'은 7일)
// - 이후 요청은 x-admin-token 헤더로 확인해요. ADMIN_PASSWORD를 바꾸면 이전 토큰은 모두 쓸 수 없어요.
// - 비밀번호를 15분 안에 8번 틀리면 그 접속 위치에서는 잠시 막아요.
import { json, fail, readBody, sameSecret, ipHashOf, tooMany, logAction, randomToken } from './util.js';

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function makeToken(env, hours) {
  const payload = `${Math.floor(Date.now() / 1000) + hours * 3600}.${randomToken(9)}`;
  return `${payload}.${await hmac(env.ADMIN_PASSWORD, 'rr-admin:' + payload)}`;
}

async function checkToken(env, token) {
  const m = String(token || '').match(/^(\d{10})\.([A-Za-z0-9_-]{8,20})\.([0-9a-f]{64})$/);
  if (!m) return false;
  if (Number(m[1]) * 1000 < Date.now()) return false;
  return sameSecret(m[3], await hmac(env.ADMIN_PASSWORD, `rr-admin:${m[1]}.${m[2]}`));
}

export async function adminLogin(request, env) {
  if (!env.ADMIN_PASSWORD) return fail('Cloudflare에 ADMIN_PASSWORD가 아직 없어요. README의 설정 순서를 확인해 주세요.', 503);
  const ip = await ipHashOf(request);
  if (await tooMany(env.DB, ip, 'admin-fail', 8, 15)) return fail('비밀번호를 여러 번 틀렸어요. 15분 뒤에 다시 시도해 주세요.', 429);
  const b = await readBody(request, 1000) || {};
  if (!(await sameSecret(b.pw, env.ADMIN_PASSWORD))) {
    await logAction(env.DB, ip, 'admin-fail');
    return fail('비밀번호가 맞지 않아요.', 401);
  }
  const hours = b.remember ? 24 * 7 : 12;
  return json({ ok: true, token: await makeToken(env, hours), hours });
}

// 운영 관리 요청 확인. 예전 방식(x-admin-key에 비밀번호)도 받아요.
export async function adminAuthed(request, env) {
  const tok = request.headers.get('x-admin-token');
  if (tok) return (await checkToken(env, tok)) ? 'token' : '';
  const key = request.headers.get('x-admin-key');
  if (!key) return '';
  const ip = await ipHashOf(request);
  if (await tooMany(env.DB, ip, 'admin-fail', 8, 15)) return '';
  if (await sameSecret(key, env.ADMIN_PASSWORD)) return 'key';
  await logAction(env.DB, ip, 'admin-fail');
  return '';
}
