import { MathText } from './MathText'
import { splitSolutionLines } from './SolutionView'
import type { Question } from '../types'

/**
 * 启发式错题讲解（纯文字流版）：
 * 判断考点 → 每步"引导问句 + 该步内容" → 收束这一类题的通法。
 * 思维过程写在文字里（先问后答的叙述式），不做点击交互。
 */

const TYPE_STRATEGY: Record<string, string> = {
  choice: '先自己算出结果，再去对选项；用排除法时，每排除一个选项都要能说出理由。',
  fill: '先想这道题在考哪个知识点，再动笔；算完把结果代回题目里检验一遍。',
  calc: '① 观察结构找特点（能凑整？可分组？符号成对出现？）② 选定法则再动笔 ③ 一步一查符号 ④ 算完回头验一遍。',
  applied: '① 圈出题目里所有的数量和关系 ② 设未知数 ③ 把文字翻译成等式 ④ 解方程 ⑤ 把答案代回原题检验合不合理。',
}

/** 每步的引导语：随步骤角色变化，问句在前 */
function stepLead(i: number, total: number): string {
  if (total === 1) return '关键一步：先别急着算——观察题目最显眼的特征，你打算怎么下手？'
  if (i === 0) return '入手：先别急着算——观察题目有什么特点，你打算从哪里下手？'
  if (i === total - 1) return '最后收尾：把结果算到底，再回头检验一遍。'
  return '很好，顺着这条思路——下一步：'
}

export function GuidedSolution({
  q,
  pointNames,
  actions,
}: {
  q: Question
  /** 该题挂靠的知识点名称 */
  pointNames: string[]
  /** 标题行右侧的操作区（如"生成讲解"按钮） */
  actions?: React.ReactNode
}) {
  const steps = splitSolutionLines(q.solution)

  // 逐题生成的思路引导（用户审定风格）：首句方向 → 编号步骤 → 收尾通法
  if (q.guidance) {
    const g = q.guidance.trim()
    const cut = g.search(/[。！？]\s|\n/)
    const intro = cut > 0 ? g.slice(0, cut + 1) : g
    const rest = cut > 0 ? g.slice(cut + 1).trim() : ''

    // 正文拆解：编号步骤（1. 2. 3.）→ 步骤行；不以编号开头的段落 → 收尾注记
    const norm = rest
      .replace(/([。；;])\s*(?=\d{1,2}[.、．]\s)/g, '$1\n')
      .replace(/\s*\n\s*/g, '\n')
    const stepItems: { n: number; text: string }[] = []
    const noteItems: string[] = []
    const CN_NUM: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }
    let autoNo = 0
    for (const line of norm.split('\n').map((x) => x.trim()).filter(Boolean)) {
      const m = line.match(/^(\d{1,2})[.、．]\s*([\s\S]+)$/)
      const m2 = line.match(/^第([一二三四五六七八九十]+)步[：:]?\s*([\s\S]+)$/)
      if (m) stepItems.push({ n: Number(m[1]), text: m[2].trim() })
      else if (m2) stepItems.push({ n: CN_NUM[m2[1]] ?? ++autoNo, text: m2[2].trim() })
      else noteItems.push(line)
    }

    return (
      <div className="mt-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-gray-500">🧭 思路引导</div>
          {actions}
        </div>

        {/* 首句：往哪个方向想 */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
          <div className="text-sm leading-relaxed text-gray-800">{intro}</div>
        </div>

        {/* 编号步骤：每步一行，配数字徽标 */}
        {stepItems.length > 0 && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-3.5">
            <ol className="space-y-3">
              {stepItems.map((s) => (
                <li key={s.n} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                    {s.n}
                  </span>
                  <MathText className="min-w-0 flex-1 text-sm leading-relaxed text-gray-800" text={s.text} />
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 收尾：一题多解 / 通法 */}
        {noteItems.length > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-4 py-3">
            <div className="text-xs font-medium text-emerald-700">💡 一题多解 · 通法收束</div>
            <div className="mt-1 space-y-1.5">
              {noteItems.map((t, i) => (
                <MathText key={i} className="text-sm leading-relaxed text-gray-700" text={t} />
              ))}
            </div>
          </div>
        )}

        {/* 兜底：没有任何编号段落时按整段展示 */}
        {stepItems.length === 0 && noteItems.length === 0 && rest && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-3">
            <MathText className="text-sm leading-relaxed text-gray-800" text={rest} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-gray-500">🧭 思路引导</div>
        {actions}
      </div>

      {/* ① 判断考点：先问后答 */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
        <div className="text-sm text-gray-800">
          <b>先想：这道题在考什么？</b>
          {pointNames.length ? (
            <>
              {' '}
              从题目特征看——<b className="text-amber-700">{pointNames.join('、')}</b>
              。想偏了就回这个知识点的课件扫一眼再回来。
            </>
          ) : (
            ' 回到课程中心找到对应知识点的课件，先确认概念再回来做题。'
          )}
        </div>
      </div>

      {/* ② 逐步引导：引导语 + 步骤内容 */}
      {steps.map((line, i) => (
        <div key={i} className="rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-3">
          <div className="text-sm font-medium text-gray-800">{stepLead(i, steps.length)}</div>
          <MathText className="mt-1.5 text-sm text-gray-800" text={line} />
        </div>
      ))}

      {/* ③ 收束通法 */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-4 py-3">
        <div className="text-sm font-medium text-gray-800">做完这道题，把它变成你的套路——这一类题的通用思路：</div>
        <div className="mt-1 text-sm leading-relaxed text-gray-700">{TYPE_STRATEGY[q.type] ?? TYPE_STRATEGY.fill}</div>
      </div>
    </div>
  )
}
