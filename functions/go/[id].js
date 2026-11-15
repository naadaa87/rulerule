// /go/{상품 id} : 보드게임몰 구매 버튼. 쿠팡 파트너스 링크로 보내요.
import { go } from '../../server/shop.js';
import { ensureSchema } from '../../server/util.js';

export async function onRequest({ request, env, params }) {
  if (env.DB) { try { await ensureSchema(env.DB); } catch (e) { /* 넘어가요 */ } }
  return go(request, env, String(params.id || ''));
}
