/** 毛栗装备目录：能量石兑换，纯装饰（荣誉向能量回收池） */
export type OutfitSlot = 'hat' | 'shoes' | 'clothes'

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

export const SLOT_LABEL: Record<OutfitSlot, string> = { hat: '帽子', shoes: '鞋子', clothes: '衣服' }
