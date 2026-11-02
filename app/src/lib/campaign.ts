/**
 * 关卡（章节）的视觉资产：每关一个专属图形，像地图上的游戏岛。
 * 仅展示用常量；通关与否等状态一律由 quests.ts 推算。
 */

export const CHAPTER_COLORS = [
  'from-indigo-500 to-blue-500',
  'from-sky-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
]

export function colorOf(chapterId: string) {
  const n = parseInt(chapterId.replace(/[^0-9]/g, ''), 10) || 1
  return CHAPTER_COLORS[(n - 1) % CHAPTER_COLORS.length]
}

/** 每章的岛屿图形 */
export const CHAPTER_ICONS: Record<string, string> = {
  '7a-c1': '🔢', // 有理数
  '7a-c2': '➗', // 有理数的运算
  '7a-c3': '🧩', // 代数式
  '7a-c4': '➕', // 整式的加减
  '7a-c5': '🧮', // 一元一次方程
  '7a-c6': '📐', // 几何图形初步
  '7b-c7': '📏', // 相交线与平行线
  '7b-c8': '√', // 实数
  '7b-c9': '🎯', // 平面直角坐标系
  '7b-c10': '⚖️', // 二元一次方程组
  '7b-c11': '⛔', // 不等式与不等式组
  '7b-c12': '📊', // 数据的收集、整理与描述
}

export function iconOf(chapterId: string) {
  return CHAPTER_ICONS[chapterId] ?? '🏝️'
}
