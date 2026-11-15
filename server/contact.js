// 제휴·문의 받기
import { json, fail, readBody, clip, oneLine, nowIso, ipHashOf, tooMany, logAction } from './util.js';

export const INQUIRY_KINDS = { partner: '제휴·협업 제안', ad: '광고·입점 문의', store: '매장(공간) 등록·QR', game: '게임 설명 추가 요청', bug: '오류·불편 신고', etc: '그 밖의 문의' };
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

export async function contact(request, env) {
  const b = await readBody(request, 12000);
  if (!b) return fail('보낸 내용을 읽지 못했어요.');
  if (b.website) return json({ ok: true });
  const kind = INQUIRY_KINDS[b.kind] ? b.kind : '';
  const name = oneLine(b.name, 40);
  const org = oneLine(b.org, 60);
  const email = oneLine(b.email, 120).toLowerCase();
  const phone = oneLine(b.phone, 30).replace(/[^0-9+\-\s()]/g, '');
  const title = oneLine(b.title, 80);
  const message = clip(b.message, 3000);
  if (!kind) return fail('문의 종류를 골라 주세요.');
  if (name.length < 2) return fail('이름(또는 담당자 이름)을 적어 주세요.');
  if (!EMAIL.test(email)) return fail('답을 받을 이메일 주소를 확인해 주세요.');
  if (message.length < 10) return fail('문의 내용을 10자 이상 적어 주세요.');
  if (!b.agree) return fail('개인정보 수집·이용에 동의해 주세요.');
  const ipk = await ipHashOf(request);
  if (await tooMany(env.DB, ipk, 'contact', 3, 10)) return fail('짧은 시간에 여러 번 보냈어요. 10분 뒤에 다시 보내 주세요.', 429);
  await logAction(env.DB, ipk, 'contact');
  const r = await env.DB.prepare('INSERT INTO inquiries (created_at, kind, name, org, email, phone, title, message, page, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(nowIso(), kind, name, org, email, phone, title, message, oneLine(b.page, 200), ipk).run();
  // 알림 주소(INQUIRY_WEBHOOK_URL)가 있으면 개인 정보 없이 ‘새 문의’만 알려요 (슬랙, 디스코드 웹훅 형식)
  if (env.INQUIRY_WEBHOOK_URL) {
    const text = `룰룰에 새 문의가 왔어요: [${INQUIRY_KINDS[kind]}] ${title || message.slice(0, 30)}… 관리 화면 문의함에서 확인하세요.`;
    try { await fetch(env.INQUIRY_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, content: text }) }); } catch (e) { /* 알림 실패는 넘어가요 */ }
  }
  return json({ ok: true, id: r.meta.last_row_id });
}
