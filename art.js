/* art.js：只做转出
   —— 牌库与 78 张牌面场景的实现都在 deck.js（小阿卡纳数据在 minors.js）。
      其它模块（app.js / history.js / reading.js / _faces.html）的 import 路径保持不变。 */
export { CARDS, ROMAN, cardFrontSVG, cardBackSVG, cardBackDefs, cardArtURL } from './deck.js?v=82';
