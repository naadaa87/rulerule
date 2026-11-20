// 게임별 그림 설명 모음
// 게임마다 [{ k: 단계 이름, t: 제목, d: 설명, art: SVG 내용 }, ...] 순서대로 보여 줘요.
import family from './family.mjs';
import party from './party.mjs';
import strategy from './strategy.mjs';
import traditional from './traditional.mjs';
import moreFamily from './more-family.mjs';
import morePartyA from './more-party-a.mjs';
import morePartyB from './more-party-b.mjs';
import moreStrategy from './more-strategy.mjs';
import moreTrad from './more-trad.mjs';
import newA from './new-a.mjs';
import newB from './new-b.mjs';
import newC from './new-c.mjs';
import newD from './new-d.mjs';

export const VISUALS = { ...family, ...party, ...strategy, ...traditional, ...moreFamily, ...morePartyA, ...morePartyB, ...moreStrategy, ...moreTrad, ...newA, ...newB, ...newC, ...newD };
export { frameSVG } from './kit.mjs';
