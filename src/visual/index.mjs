// 게임별 그림 설명 모음
// 게임마다 [{ k: 단계 이름, t: 제목, d: 설명, art: SVG 내용 }, ...] 순서대로 보여 줘요.
import family from './family.mjs';
import party from './party.mjs';
import strategy from './strategy.mjs';
import traditional from './traditional.mjs';

export const VISUALS = { ...family, ...party, ...strategy, ...traditional };
export { frameSVG } from './kit.mjs';
