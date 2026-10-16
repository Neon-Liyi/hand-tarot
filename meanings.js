/* 解读库：22 张大阿卡纳（上/下两批）+ 56 张小阿卡纳，索引 0–77 与 CARDS 一致 */
import { MEAN_A } from './meanings-a.js?v=82';
import { MEAN_B } from './meanings-b.js?v=82';
import { MINOR_MEANINGS } from './minors.js?v=82';
export const MEANINGS = { ...MEAN_A, ...MEAN_B, ...MINOR_MEANINGS };
