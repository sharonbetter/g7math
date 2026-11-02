/**
 * 错题讲解场景模型：从考评 Round 数据拼装讲解场景（运行时生成，非预生成文件）。
 *
 * 场景语法（与知识点动画课件同一套视觉语言）：
 *   cover  总览：错了几题、超时几题、薄弱知识点标签
 *   wrong  每道错题一幕：题目 → 你的答案 vs 正确答案 → 错因 → 分步讲解 → 变式预告
 *   slow   做对但超时：题目 → 更快路径
 *   end    总结：薄弱点回顾 + 下一步（进专项练习）
 *
 * 讲解词为模板拼装（确定性、零延迟），错因注入已有的规则反演 / GLM 诊断结果。
 */
import type { Question } from '../types'

export interface WrongItem {
  q: Question
  userAnswer: string
  /** 错因（规则反演或 GLM 诊断；缺省用通用文案） */
  diag?: { skill: string; reason: string } | null
  spentSeconds?: number
  /** 口语化讲解词（/api/gen-narration 生成）：提供时场景揭示时机与讲解节奏对齐 */
  narration?: { intro: string; compare: string; reason: string; guide: string; closing: string } | null
}

export interface SlowItem {
  q: Question
  spentSeconds: number
  estimatedSeconds: number
}

export interface ExplainBlock {
  /** 揭示时机（音频进度 0~1）；0 = 立即显示 */
  at: number
  kind: 'stem' | 'answers' | 'reason' | 'steps' | 'comment' | 'custom'
  title?: string
  /** stem/自定义卡片的文本（LaTeX + @@fig 图形标记） */
  text?: string
  /** 对比卡内容 */
  userAnswer?: string
  correctAnswer?: string
  /** 分步内容 */
  steps?: string[]
  tone?: 'gold' | 'green' | 'red' | 'violet' | 'blue'
}

export interface ExplainScene {
  id: string
  kind: 'cover' | 'wrong' | 'slow' | 'end'
  title: string
  sub?: string
  blocks: ExplainBlock[]
  /** 该幕讲解词（送 /api/tts 合成） */
  narration: string
}

export interface ExplainInput {
  chapterTitle: string
  wrongs: WrongItem[]
  slows: SlowItem[]
  /** 薄弱知识点名（用于总览/总结） */
  weakPointNames: string[]
}

/** 把解答文本切成步骤（剥离原有编号——第X步：/（1）/1. 等，由播放器统一编号） */
function splitSteps(solution: string): string[] {
  return solution
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) =>
      l
        .replace(/^第\s*[一二三四五六七八九十百\d]+\s*步\s*[：:、.]?\s*/, '')
        .replace(/^[（(]\s*\d+\s*[)）]\s*[.、]?\s*/, '')
        .replace(/^\d+\s*[.、）:：]\s*/, '')
        .trim(),
    )
    .filter(Boolean)
}

const SUP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' }
const SUB: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' }

/** 分数 a/b → "b分之a"（支持负号与小数） */
function fracText(a: string, b: string): string {
  const neg = a.startsWith('-')
  const an = neg ? a.slice(1) : a
  return `${neg ? '负' : ''}${b}分之${an}`
}

/** 朗读友好化：分数/运算符/上标/图形标记 → 口语（讲解词不进 MathText，直接送 TTS） */
function speakableStem(raw: string): string {
  let t = (raw ?? '')
    .replace(/@@fig[\s\S]*?@@/g, '')
    .replace(/\$\$?([^$]*)\$\$?/g, '$1')
  // LaTeX 分数 \frac{a}{b}
  t = t.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (_m, a: string, b: string) => fracText(a, b))
  // 普通分数：括号包裹的 (-2/3) 与裸的 3/4、0.5/2
  t = t.replace(/\(\s*(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\)/g, (_m, a: string, b: string) => fracText(a, b))
  t = t.replace(/(^|[^.\d])(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g, (_m, pre: string, a: string, b: string) => pre + fracText(a, b))
  // 运算符与关系符
  t = t
    .replace(/÷/g, '除以')
    .replace(/×/g, '乘')
    .replace(/−/g, '负')
    .replace(/=/g, '等于')
    .replace(/≈/g, '约等于')
    .replace(/≠/g, '不等于')
  // 上标：单个² ³ 读平方/立方，其余（含多位）读 N 次方
  t = t.replace(/²/g, '的平方').replace(/³/g, '的立方')
  t = t.replace(/[⁰¹⁴⁵⁶⁷⁸⁹]+/g, (m: string) => `的${[...m].map((c) => SUP[c]).join('')}次方`)
  // 下标：数字串+下标 → 逐位读 + "下标N"（如 1111₂ → 1 1 1 1 下标2）
  t = t.replace(/(\d+)([₀-₉])/g, (_m, d: string, sub: string) => `${[...d].join(' ')} 下标${SUB[sub]}`)
  t = t.replace(/[₀-₉]/g, (c: string) => SUB[c] ?? c)
  // 填空、省略号、杂符号
  t = t
    .replace(/_{3,}/g, '（填空）')
    .replace(/…/g, '，以此类推，')
    .replace(/[{}\\]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/。{2,}/g, '。')
    .replace(/。\s*。/g, '。')
    .trim()
  return t.slice(0, 140).replace(/。+$/, '') || '（略）'
}

/** 句末兜底标点：拼接讲解词时保证不叠句号 */
function dot(s: string): string {
  const x = s.trim().replace(/。+$/, '')
  return x ? x + '。' : ''
}

const ORD = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

export function buildExplainScenes(input: ExplainInput, opts?: { compact?: boolean }): ExplainScene[] {
  const scenes: ExplainScene[] = []
  const { wrongs, slows, weakPointNames } = input
  const compact = opts?.compact === true

  // ---------- 封面：总览 ----------
  const wrongN = wrongs.length
  const slowN = slows.length
  const parts: string[] = []
  if (wrongN) parts.push(`${ORD[wrongN - 1] ?? wrongN}道错题`)
  if (slowN) parts.push(`${ORD[slowN - 1] ?? slowN}道超时`)
  if (!compact)
    scenes.push({
    id: 'cover',
    kind: 'cover',
    title: '🎬 错题讲解',
    sub: input.chapterTitle,
    blocks: [
      {
        at: 0,
        kind: 'custom',
        tone: 'gold',
        title: '本轮情况',
        text: [wrongN ? `错题 ${wrongN} 道` : '无错题', slowN ? `超时 ${slowN} 道` : '', weakPointNames.length ? `薄弱点：${weakPointNames.join('、')}` : ''].filter(Boolean).join('\n'),
      },
    ],
    narration: wrongN
      ? `这份卷子讲完了。本轮${parts.join('，')}。别慌，咱们一题一题把它吃透：先看错在哪，再听正确思路，最后我把你带进对应的变式练习。准备好了就点开始。`
      : `这份卷子讲完了，没有错题${slowN ? `，但有${slowN}道超时` : ''}。我们重点看看超时的题怎么提速。`,
  })

  // ---------- 每道错题 ----------
  wrongs.forEach((w, i) => {
    const no = i + 1
    const steps = splitSteps(w.q.solution)
    const knownReason =
      (w.diag?.reason ?? '').trim() !== '' &&
      !w.diag?.reason?.includes('看不出') &&
      !w.diag?.reason?.includes('错误原因未知')
    const spent = w.spentSeconds ? `（用时 ${w.spentSeconds} 秒）` : ''
    // 步骤讲解：多步逐步编号；单步直接说思路
    const stepsNarration =
      steps.length <= 1
        ? steps.length
          ? dot(speakableStem(steps[0]))
          : ''
        : steps.map((s, k) => `第${ORD[k] ?? k + 1}步，${dot(speakableStem(s))}`).join('')
    // 口语化讲解词版：揭示时机按五段长度对齐（讲到哪块、亮哪块）
    if (w.narration) {
      const N = w.narration
      const secs = [N.intro, N.compare, N.reason, N.guide, N.closing]
      const lens = secs.map((x) => Math.max(20, x.length))
      const total = lens.reduce((a, b) => a + b, 0)
      const at = (spoken: number) => Math.min(0.92, spoken / total)
      const a1 = at(lens[0]) // compare 开始 → 亮答案对比
      const a2 = at(lens[0] + lens[1]) // reason 开始 → 亮错因
      const a3 = at(lens[0] + lens[1] + lens[2]) // guide 开始 → 亮思路
      const a4 = at(lens[0] + lens[1] + lens[2] + lens[3]) // closing 开始 → 亮点评
      scenes.push({
        id: `wrong-${w.q.id}`,
        kind: 'wrong',
        title: `❌ 错题 ${no} / ${wrongN}`,
        sub: `${w.q.id}${spent}`,
        blocks: [
          { at: 0, kind: 'stem', title: '题目', text: w.q.stem },
          { at: a1, kind: 'answers', userAnswer: w.userAnswer || '（未作答）', correctAnswer: w.q.answer },
          {
            at: a2,
            kind: 'reason',
            title: knownReason && w.diag?.skill ? `错因 · ${w.diag.skill}` : '错因',
            text: knownReason ? w.diag!.reason.trim() : '错误原因未知——直接对照正确思路，看自己走岔在哪一步。',
            tone: 'gold',
          },
          { at: a3, kind: 'steps', title: steps.length <= 1 ? '正确思路' : '正确思路（逐步）', steps, tone: 'green' },
          {
            at: a4,
            kind: 'comment',
            title: '点评',
            text: w.q.variants?.length || true ? '听懂了趁热打铁，一会儿换数字再练一道。' : '',
            tone: 'violet',
          },
        ],
        narration: [N.intro, N.compare, N.reason, N.guide, N.closing].map((x) => x.trim()).join(' '),
      })
      return
    }
    scenes.push({
      id: `wrong-${w.q.id}`,
      kind: 'wrong',
      title: `❌ 错题 ${no} / ${wrongN}`,
      sub: `${w.q.id}${spent}`,
      blocks: [
        { at: 0, kind: 'stem', title: '题目', text: w.q.stem },
        {
          at: 0.18,
          kind: 'answers',
          userAnswer: w.userAnswer || '（未作答）',
          correctAnswer: w.q.answer,
        },
        knownReason
          ? {
              at: 0.38,
              kind: 'reason',
              title: w.diag?.skill ? `错因 · ${w.diag.skill}` : '错因分析',
              text: w.diag!.reason.trim(),
              tone: 'gold',
            }
          : {
              at: 0.38,
              kind: 'reason',
              title: '错因 · 暂时看不出',
              text: '从你的答案还看不出具体错在哪一步。没关系——跟着下面的正确思路走一遍，对照每一步，看自己是在哪一步走岔的。',
              tone: 'gold',
            },
        { at: 0.58, kind: 'steps', title: steps.length <= 1 ? '正确思路' : '正确思路（逐步）', steps, tone: 'green' },
        {
          at: 0.86,
          kind: 'comment',
          title: '点评',
          text: knownReason
            ? '听懂了就趁热打铁：一会儿专项练习换数字再考同款，全对才算过。'
            : '对照刚才的每一步，把自己走岔的那一步找出来——变式练习里重点盯住它。',
          tone: 'violet',
        },
      ],
      narration:
        `第${ORD[no - 1]}道错题。先读题：${dot(speakableStem(w.q.stem))}` +
        `你答的是${dot(speakableStem(w.userAnswer || '空白'))}正确答案是${dot(speakableStem(w.q.answer))}` +
        (knownReason
          ? `错在哪？${dot(speakableStem(w.diag!.reason.trim()))}`
          : `这道题错在哪，从你的答案暂时看不出来——没关系，咱们直接从正确思路讲，你对照每一步，看自己是在哪一步走岔的。`) +
        (steps.length <= 1
          ? `正确思路是：${stepsNarration}`
          : `正确思路是这样，跟着一步步来：${stepsNarration}`) +
        (knownReason
          ? '听懂了就趁热打铁，一会儿专项练习换数字再考你。'
          : '找到自己走岔的那一步了吗？变式练习里重点盯住它。'),
    })
  })

  // ---------- 超时题（做对但慢） ----------
  slows.forEach((s, i) => {
    const steps = splitSteps(s.q.solution)
    scenes.push({
      id: `slow-${s.q.id}`,
      kind: 'slow',
      title: `⏱️ 超时题 ${i + 1} / ${slows.length}`,
      sub: `${s.q.id}（用时 ${s.spentSeconds}s / 预计 ${s.estimatedSeconds}s）`,
      blocks: [
        { at: 0, kind: 'stem', title: '题目（做对了，但超时）', text: s.q.stem },
        { at: 0.3, kind: 'steps', title: '更快的路径', steps: steps.slice(0, 4), tone: 'blue' },
        { at: 0.75, kind: 'comment', title: '提速要点', text: `预计用时 ${s.estimatedSeconds} 秒，你用了 ${s.spentSeconds} 秒。卡壳的地方通常是第一步的转化，练变式把它变成本能。`, tone: 'violet' },
      ],
      narration:
        `这道题你做对了，但用了${s.spentSeconds}秒，超过预计的${s.estimatedSeconds}秒，说明思路还不够顺。看一遍更快的路径：` +
        `${steps.slice(0, 4).map((x, k) => `第${ORD[k] ?? k + 1}步，${dot(speakableStem(x))}`).join('')}` +
        `变式练习里再过两遍，把它变成本能反应。`,
    })
  })

  // ---------- 总结 ----------
  if (!compact)
    scenes.push({
      id: 'end',
    kind: 'end',
    title: '🏁 讲解完毕',
    sub: '下一步：专项练习',
    blocks: [
      {
        at: 0,
        kind: 'custom',
        tone: 'gold',
        title: '本轮薄弱点',
        text: weakPointNames.length ? weakPointNames.map((n, i) => `${i + 1}. ${n}`).join('\n') : '表现不错，保持节奏',
      },
      {
        at: 0.4,
        kind: 'comment',
        title: '怎么练',
        text: '进入专项练习：每道错题配 2 个同款变式，换数字再来一遍，全对且不超时才算过关。',
        tone: 'violet',
      },
    ],
    narration: weakPointNames.length
      ? `讲解完毕。这轮暴露的薄弱点是：${weakPointNames.join('、')}。现在进专项练习，每道错题都配了换数字的同款变式，全对而且不超时才算过关。去把它们拿下。`
      : '讲解完毕。这轮整体不错，保持节奏，继续下一章。',
  })

  return scenes
}
