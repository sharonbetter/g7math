/** 毛栗装备目录：能量石兑换，纯装饰（荣誉向能量回收池） */
export type OutfitSlot = 'hat' | 'shoes' | 'clothes' | 'skin'

export interface Outfit {
  id: string
  slot: OutfitSlot
  name: string
  price: number
  desc: string
}

export const OUTFITS: Outfit[] = [
  // 帽子
  { id: 'hat-straw', slot: 'hat', name: '小草帽', price: 3, desc: '冒险者的第一顶帽子' },
  { id: 'hat-beret', slot: 'hat', name: '红色贝雷帽', price: 6, desc: '艺术家的从容' },
  { id: 'hat-wizard', slot: 'hat', name: '巫师帽', price: 10, desc: '据说能提升数学直觉' },
  { id: 'hat-crown', slot: 'hat', name: '黄金皇冠', price: 15, desc: '数学王国的至高荣耀' },
  // 鞋子
  { id: 'shoes-cloth', slot: 'shoes', name: '远行布鞋', price: 2, desc: '轻便耐磨，走图必备' },
  { id: 'shoes-sport', slot: 'shoes', name: '疾风运动鞋', price: 5, desc: '在任务间健步如飞' },
  { id: 'shoes-rocket', slot: 'shoes', name: '火箭靴', price: 9, desc: '喷气推进，尾焰拉风' },
  // 衣服
  { id: 'cloth-scarf', slot: 'clothes', name: '红色围巾', price: 3, desc: '风寒与难题都挡得住' },
  { id: 'cloth-cape', slot: 'clothes', name: '紫色披风', price: 7, desc: '转身时猎猎作响' },
  { id: 'cloth-armor', slot: 'clothes', name: '银色小铠甲', price: 12, desc: '面对 Boss 底气十足' },
]

export const SLOT_LABEL: Record<OutfitSlot, string> = { hat: '帽子', shoes: '鞋子', clothes: '衣服', skin: '形象' }


/** 精灵形象（皮肤）：能量石兑换，全身变色 */
export interface MascotSkin {
  id: string
  name: string
  price: number
  desc: string
  palette: { body: string; inner: string; belly: string; feet: string; edge: string }
}

const P_DEFAULT = { body: '#99a1ac', inner: '#c2c9d1', belly: '#ece7db', feet: '#8a929d', edge: '#6c7480' }

export const SKINS: MascotSkin[] = [
  { id: 'skin-default', name: '毛栗（原装）', price: 0, desc: '最初的毛栗', palette: P_DEFAULT },
  { id: 'skin-astral', name: '星璃', price: 36, desc: '执星盘的魔法学园少女', palette: { body: '#8b5cf6', inner: '#ddd6fe', belly: '#f5f3ff', feet: '#6d28d9', edge: '#4c1d95' } },
  { id: 'skin-sakura', name: '樱晴', price: 42, desc: '元气满满的樱粉学姐', palette: { body: '#f472b6', inner: '#fce7f3', belly: '#fff1f2', feet: '#db2777', edge: '#9d174d' } },
  { id: 'skin-cyber', name: '零', price: 50, desc: '来自未来的赛博解题员', palette: { body: '#22d3ee', inner: '#cffafe', belly: '#ecfeff', feet: '#0891b2', edge: '#155e75' } },
  { id: 'skin-snow', name: '猫又', price: 8, desc: '白绒圆脸小猫', palette: { body: '#e7f0f7', inner: '#ffffff', belly: '#ffffff', feet: '#cdd9e5', edge: '#94a3b8' } },
  { id: 'skin-flame', name: '小狐', price: 8, desc: '橙绒尖耳小狐狸', palette: { body: '#fb923c', inner: '#fed7aa', belly: '#ffedd5', feet: '#ea580c', edge: '#c2410c' } },
  { id: 'skin-bamboo', name: '云绵', price: 12, desc: '天上的云朵小绵羊', palette: { body: '#6cbf7d', inner: '#bbf7d0', belly: '#eafbef', feet: '#4d9e63', edge: '#2f6b45' } },
  { id: 'skin-night', name: '萤仔', price: 18, desc: '随身带光的萤火精灵', palette: { body: '#56548f', inner: '#8b89c9', belly: '#c7c5ee', feet: '#413f7e', edge: '#343266' } },
  { id: 'skin-gold', name: '阿宝', price: 30, desc: '金发Q版冒险家', palette: { body: '#f5c542', inner: '#fde68a', belly: '#fef3c7', feet: '#d4a017', edge: '#b45309' } },
]

export function skinOf(id?: string): MascotSkin {
  return SKINS.find((s) => s.id === id) ?? SKINS[0]
}
