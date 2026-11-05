/**
 * 神兽：每击败一关的守关 Boss（通关一扇门）即收服该关的神兽。
 * 共 12 只，与 12 扇门一一对应；已收服的会围绕毛栗转圈伴行。
 * 收服状态由 loops（章节掌握）派生，不另存。
 */
import type { AppData } from '../types'

export interface Beast {
  levelNo: number
  name: string
  emoji: string
  /** 徽章兽文（单字） */
  glyph: string
  /** 徽章辉光色 */
  accent: string
  /** 守卫的门 */
  gateName: string
  desc: string
}

export const BEASTS: Beast[] = [
  { levelNo: 1, name: '玉兔', emoji: '🐰', glyph: '兔', accent: '#f9a8d4', gateName: '月洞门', desc: '月洞门前捣药的玉兔，安静温柔' },
  { levelNo: 2, name: '青鸾', emoji: '🕊️', glyph: '鸾', accent: '#7dd3fc', gateName: '棂星门', desc: '棂星门上的信使，衔来文运' },
  { levelNo: 3, name: '玄武', emoji: '🐢', glyph: '玄', accent: '#86efac', gateName: '平遥古城门', desc: '古城墙下驮碑千年，稳如泰山' },
  { levelNo: 4, name: '白泽', emoji: '🦌', glyph: '泽', accent: '#fde047', gateName: '永宁门', desc: '通晓万物的瑞兽，逢凶化吉' },
  { levelNo: 5, name: '金雁', emoji: '🦢', glyph: '雁', accent: '#fdba74', gateName: '雁门关', desc: '雁门关头的头雁，领航千里' },
  { levelNo: 6, name: '天马', emoji: '🦄', glyph: '骐', accent: '#c4b5fd', gateName: '玉门关', desc: '出玉门关西行的骏马，踏风而行' },
  { levelNo: 7, name: '狻猊', emoji: '🦁', glyph: '狻', accent: '#fca5a5', gateName: '嘉峪关', desc: '喜烟好坐的猛兽，镇守雄关' },
  { levelNo: 8, name: '貔貅', emoji: '🐻', glyph: '貔', accent: '#f5d0fe', gateName: '山海关', desc: '只进不出的守财神兽' },
  { levelNo: 9, name: '青龙', emoji: '🐉', glyph: '青', accent: '#67e8f9', gateName: '中华门', desc: '东方七宿之精，腾云驾雾' },
  { levelNo: 10, name: '朱雀', emoji: '🦚', glyph: '雀', accent: '#fb923c', gateName: '正阳门', desc: '南方正阳之门的神鸟，浴火翔天' },
  { levelNo: 11, name: '凤凰', emoji: '🦩', glyph: '凤', accent: '#f472b6', gateName: '午门', desc: '午门之上百鸟朝凤' },
  { levelNo: 12, name: '金龙', emoji: '🐲', glyph: '龙', accent: '#facc15', gateName: '天安门', desc: '至尊金鳞，与国门同辉' },
]

/** 已收服的神兽（通关的门派生） */
export function beastsOwned(data: AppData): Beast[] {
  const ids = new Set(
    Object.values(data.loops ?? {})
      .filter((l) => l.status === 'mastered')
      .map((l) => l.chapterId),
  )
  // chapterId 7a-cN → 关号 N；7b-cN → 关号 N（章号即全书关号）
  const levelOf = (cid: string) => parseInt((cid.split('c')[1] ?? '0').replace(/[^0-9]/g, ''), 10) || 0
  const owned = new Set([...ids].map(levelOf))
  return BEASTS.filter((b) => owned.has(b.levelNo))
}
