/**
 * 毛栗档案：点击小精灵弹出。
 * - 战绩：通过了哪些门（关卡），每关采到多少块什么颜色的石头
 * - 装备铺：帽子/鞋子/衣服，用能量石（⚡）兑换，穿上即生效（所有页面的毛栗同步换装）
 */
import { useState } from 'react'
import Mascot, { MascotBody, OutfitIcon } from './Mascot'
import { BeastFigure } from './BeastFigure'
import { GemStoneView, gemColorOf } from './GemBattle'
import { useAppData } from '../lib/store'
import { buyOutfit, equipOutfit } from '../lib/store'
import { allChapters, useCurriculum } from '../lib/data'
import { OUTFITS, SKINS } from '../lib/outfits'
import { BEASTS, beastsOwned } from '../lib/beasts'
import type { OutfitSlot } from '../lib/outfits'
import { gateDesign } from './gate'

const GEM_LEVELS = ['青晶石', '紫晶石', '翡翠石', '琥珀石', '玫红石']

export function PetProfile({ onClose }: { onClose: () => void }) {
  const data = useAppData()
  const { curriculum } = useCurriculum()
    const [tab, setTab] = useState<OutfitSlot | 'stats' | 'beasts'>('stats')

  const chapters = allChapters(curriculum)
  const masteredLevelNos = chapters
    .filter((e) => data.loops[e.chapter.id]?.status === 'mastered')
    .map((e) => chapters.findIndex((c) => c.chapter.id === e.chapter.id) + 1)

  // 每关采石统计 + 颜色汇总（全派生）
  const perLevel: Record<number, number> = {}
  const byColor: Record<string, number> = {}
  for (const [id, count] of Object.entries(data.gems ?? {})) {
    const m = id.match(/^gem-(\d+)-(\d+)$/)
    if (!m) continue
    const lv = parseInt(m[1])
    const no = parseInt(m[2])
    perLevel[lv] = (perLevel[lv] ?? 0) + count
    const cname = gemColorOf({ levelNo: lv, no }).name
    byColor[cname] = (byColor[cname] ?? 0) + count
  }
  const totalGems = Object.values(perLevel).reduce((a, b) => a + b, 0)
  const beasts = beastsOwned(data)
  const owned = data.outfits?.owned ?? []
  const wearing = data.outfits
  const energy = data.energy ?? 0

  const colorOfName = (name: string) => {
    const i = GEM_LEVELS.indexOf(name)
    return gemColorOf({ levelNo: 0, no: i + 1 })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="lb-rise max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部：穿装的毛栗 */}
        <div className="flex items-center gap-4">
          <Mascot className="w-24 shrink-0 drop-shadow-md" />
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-gray-900">毛栗的冒险档案</div>
            <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600 tabular-nums">
                🏆 通关 {masteredLevelNos.length}/12
              </span>
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 font-medium text-cyan-700 tabular-nums">
                💎 累计 {totalGems} 块
              </span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-600 tabular-nums">
                ⚡ {energy}
              </span>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-600 tabular-nums">
                已收服神兽 {beasts.length}/12
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
              {(['hat', 'clothes', 'shoes'] as const).map((slot) => {
                const o = OUTFITS.find((x) => x.id === wearing?.[slot])
                return (
                  <span key={slot} className="flex items-center gap-1 rounded-lg bg-gray-50 px-1.5 py-1" title={o ? `${o.name}` : '未穿戴'}>
                    {o ? <OutfitIcon id={o.id} size={20} /> : <span className="text-[10px] text-gray-300">{slot === 'hat' ? '🎩' : slot === 'clothes' ? '👕' : '👟'}</span>}
                    <span className={`text-[10px] ${o ? 'text-gray-600' : 'text-gray-300'}`}>{o?.name ?? '未穿'}</span>
                  </span>
                )
              })}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {GEM_LEVELS.filter((n) => byColor[n]).map((n) => (
                <span key={n} className="flex items-center gap-1 text-[10px] text-gray-500">
                  <GemStoneView picked={false} size={16} color={colorOfName(n)} />×{byColor[n]}
                </span>
              ))}
              {totalGems === 0 && <span className="text-[10px] text-gray-300">还没采到石头，去关卡路径上找💎</span>}
            </div>
          </div>
          <button className="shrink-0 text-xs text-gray-400 hover:text-gray-600" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab */}
        <div className="mt-4 flex gap-1.5 border-b border-gray-100 pb-2 text-xs">
          {(
            [
              ['stats', '通关与宝石'],
              ['beasts', '🐉 神兽'],
              ['skin', '✨ 形象'],
              ['hat', '🎩 帽子'],
              ['shoes', '👟 鞋子'],
              ['clothes', '👕 衣服'],
            ] as [OutfitSlot | 'stats' | 'beasts', string][]
          ).map(([k, label]) => (
            <button
              key={k}
              className={`rounded-full px-3 py-1.5 font-medium transition ${tab === k ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              onClick={() => setTab(k)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'stats' ? (
          <div className="mt-3 space-y-2">
            {masteredLevelNos.length === 0 && (
              <p className="py-6 text-center text-xs text-gray-300">还没通关任何关卡——击败守关 Boss 即通关穿门</p>
            )}
            {masteredLevelNos.map((lv) => {
              const g = gateDesign(lv)
              return (
                <div key={lv} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3.5 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-950 text-[11px] font-bold text-white">
                    {lv}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-gray-800">「{g.name}」{g.title}</div>
                    <div className="text-[11px] text-gray-400">
                      {perLevel[lv] ? `此关采到 ${perLevel[lv]} 块能量石` : '此关尚未采石'}
                    </div>
                  </div>
                  <span className="text-lg">🏆</span>
                </div>
              )
            })}
                      </div>
        ) : tab === 'beasts' ? (
          <div className="mt-3">
            <p className="text-[11px] text-gray-400">每击败一关的守关 Boss（通关一扇门）即收服该关神兽，共 12 只。收服的神兽会绕着毛栗转圈伴行。</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BEASTS.map((b) => {
                const got = beasts.some((x) => x.levelNo === b.levelNo)
                return (
                  <div
                    key={b.name}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${got ? 'border-violet-200 bg-violet-50/50' : 'border-gray-100 bg-gray-50/40'}`}
                    title={got ? b.desc : `通关「${b.gateName}」后收服`}
                  >
                    <BeastFigure beast={b} size={46} locked={!got} />
                    <div className="min-w-0 flex-1">
                      <div className={`text-[13px] font-semibold ${got ? 'text-gray-800' : 'text-gray-300'}`}>
                        {b.name} {got ? '' : '🔒'}
                      </div>
                      <div className="truncate text-[10px] text-gray-400">{b.gateName}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : tab === 'skin' ? (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] text-gray-400">用能量石给毛栗换一身新毛色，全站同步生效。</p>
            {SKINS.map((sk) => {
              const isOwned = sk.price === 0 || owned.includes(sk.id)
              const isWearing = (wearing?.skin ?? 'skin-default') === sk.id
              return (
                <div
                  key={sk.id}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
                    isWearing ? 'border-indigo-300 bg-indigo-50/50' : isOwned ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'
                  }`}
                >
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                    <MascotBody skinId={sk.id} hat={wearing?.hat} shoes={wearing?.shoes} clothes={wearing?.clothes} className="h-14 w-14" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[13px] font-semibold text-gray-800">{sk.name}</span>
                      <span className="text-[10px] text-gray-400">{sk.desc}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium text-amber-600 tabular-nums">{sk.price === 0 ? '初始' : `💎 ${sk.price}`}</div>
                  </div>
                  {isWearing ? (
                    <button className="btn !rounded-lg !px-3 !py-1.5 !text-xs" onClick={() => equipOutfit('skin', undefined)}>
                      换回原装
                    </button>
                  ) : isOwned ? (
                    <button className="btn btn-primary !rounded-lg !px-3 !py-1.5 !text-xs" onClick={() => equipOutfit('skin', sk.id)}>
                      穿上
                    </button>
                  ) : (
                    <button
                      className="btn !rounded-lg !px-3 !py-1.5 !text-xs"
                      disabled={energy < sk.price}
                      onClick={() => buyOutfit(sk.id, sk.price)}
                    >
                      {energy < sk.price ? `差 ${sk.price - energy}⚡` : '兑换'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {OUTFITS.filter((o) => o.slot === tab).map((o) => {
              const isOwned = owned.includes(o.id)
              const isWearing = wearing?.[o.slot] === o.id
              return (
                <div
                  key={o.id}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
                    isWearing ? 'border-indigo-300 bg-indigo-50/50' : isOwned ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'
                  }`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                    <OutfitIcon id={o.id} size={38} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[13px] font-semibold text-gray-800">{o.name}</span>
                      <span className="text-[10px] text-gray-400">{o.desc}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium text-amber-600 tabular-nums">💎 {o.price}</div>
                  </div>
                  {isWearing ? (
                    <button className="btn !rounded-lg !px-3 !py-1.5 !text-xs" onClick={() => equipOutfit(o.slot, undefined)}>
                      脱下
                    </button>
                  ) : isOwned ? (
                    <button className="btn btn-primary !rounded-lg !px-3 !py-1.5 !text-xs" onClick={() => equipOutfit(o.slot, o.id)}>
                      穿上
                    </button>
                  ) : (
                    <button
                      className="btn !rounded-lg !px-3 !py-1.5 !text-xs"
                      disabled={energy < o.price}
                      onClick={() => buyOutfit(o.id, o.price)}
                    >
                      {energy < o.price ? `差 ${o.price - energy}⚡` : '兑换'}
                    </button>
                  )}
                </div>
              )
            })}
            <p className="pt-1 text-[11px] text-gray-300">
              能量石来源：路径采矿（答对得石）、计算副本首通 +2⚡。穿戴后所有页面的毛栗都会换装。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
