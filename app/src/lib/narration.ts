/**
 * 课件讲解词构建 + 朗读文本规范化。
 *
 * 该模块同时被两处使用：
 * 1. app/scripts/gen-lesson-audio.ts —— 离线生成婷婷语音 m4a 文件；
 * 2. SlideDeck 组件 —— 无音频文件时用浏览器语音合成朗读相同文本。
 *
 * 因此这里必须保持纯函数、无 DOM / Node 依赖（Node 22 直接以 type-stripping 运行）。
 */
import type { Slide } from '../types'

/** 一步讲解：例题页拆成「题目」「解答」两步，其余页只有「讲解」一步 */
export interface NarrationStep {
  key: 'body' | 'problem' | 'solution'
  label: string
  /** 规范化后的朗读文本（纯中文口语，符号已转读法） */
  text: string
}

// ---------- 符号转读法 ----------

const UNIT_REPLACEMENTS: { re: RegExp; to: string | ((...m: string[]) => string) }[] = [
  // 温度 / 复合单位（无歧义，紧跟数字即可）
  { re: /(\d)\s?℃/g, to: '$1摄氏度' },
  { re: /\b(\d)\s?(m²|m2)/g, to: '$1平方米' },
  { re: /\b(\d)\s?(cm²|cm2)/g, to: '$1平方厘米' },
  { re: /\b(\d)\s?(km²|km2)/g, to: '$1平方千米' },
  { re: /\b(\d)\s?(m³|m3)/g, to: '$1立方米' },
  // 单字母单位有歧义（m 也可能是未知数），要求紧跟数字且后面不是字母数字才按单位读
  {
    re: /(\d)\s?(m|g|s|h|t|cm|mm|km|kg|min)(?![A-Za-z0-9])/g,
    to: (_m0: string, d: string, u: string) => d + (UNIT_NAMES[u] ?? u),
  },
]

const UNIT_NAMES: Record<string, string> = {
  m: '米',
  cm: '厘米',
  mm: '毫米',
  km: '千米',
  kg: '千克',
  g: '克',
  s: '秒',
  min: '分钟',
  h: '小时',
  t: '吨',
}

const OPERATORS: [RegExp, string][] = [
  [/×/g, '乘'],
  [/÷/g, '除以'],
  [/=/g, '等于'],
  [/≠/g, '不等于'],
  [/≈/g, '约等于'],
  [/≥/g, '大于等于'],
  [/≤/g, '小于等于'],
  [/>/g, '大于'],
  [/</g, '小于'],
  [/±/g, '正负'],
  [/√/g, '根号'],
  [/∛/g, '三次根号'],
  [/∠/g, '角'],
  [/△/g, '三角形'],
  [/∥/g, '平行于'],
  [/⊥/g, '垂直于'],
  [/π/g, '派'],
]

/** 数学读法词（加减号、单位等转换后混入文本的中文词），判断“纯数学式”时剔除 */
const STRIP_MATH_WORDS =
  /(加|减|负|正|分之|的平方|的立方|等于|不等于|约等于|大于|小于|根号|三次根号|派|乘|除以|的绝对值|以此类推|由此可得|所以|然后|反之|度|分|秒|撇|米|厘米|毫米|千米|千克|克|分钟|小时|吨|摄氏度|百分之)/g

/** 剔除数学读法词后是否还有中文（有 → 不是纯数学式） */
function hasRealChinese(s: string): boolean {
  return /[\u4e00-\u9fff]/.test(s.replace(STRIP_MATH_WORDS, ''))
}

/** 单个 / 一行文本 → 适合 TTS 的中文口语 */
export function speakable(raw: string): string {
  let t = (raw ?? '').replace(/\r/g, '').replace(/@@fig\s*\{[^@]*?\}\s*@@/g, ' ')

  // 1) 统一易混字符：Unicode 减号、全角加号、下标 / 上标
  t = t
    .replace(/−/g, '-')
    .replace(/＋/g, '+')
    .replace(/０/g, '0')
    .replace(/１/g, '1')
    .replace(/２/g, '2')
    .replace(/３/g, '3')
    .replace(/₍/g, '(')
    .replace(/₎/g, ')')
    .replace(/₀/g, '0')
    .replace(/₁/g, '1')
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/₅/g, '5')
    .replace(/₆/g, '6')
    .replace(/₇/g, '7')
    .replace(/₈/g, '8')
    .replace(/₉/g, '9')
    .replace(/_/g, '')
    // 带圈序号 ①②… → 第一、第二…
    .replace(/[①⑴]/g, '第一，')
    .replace(/[②⑵]/g, '第二，')
    .replace(/[③⑶]/g, '第三，')
    .replace(/[④⑷]/g, '第四，')
    .replace(/[⑤⑸]/g, '第五，')
    .replace(/[⑥⑹]/g, '第六，')

  // 2) 单位（摄氏度、米、千克……）
  for (const { re, to } of UNIT_REPLACEMENTS) t = t.replace(re, to as never)

  // 2b) 上标：80² → 80 的平方（须在单位 m² 之后）
  t = t
    .replace(/²/g, '的平方')
    .replace(/³/g, '的立方')
    .replace(/¹/g, '')

  // 3) 百分数：50% → 百分之50
  t = t.replace(/(\d+(?:\.\d+)?)\s?%/g, '百分之$1')

  // 3b) 编号列表：“1. 定义” → “第1点，定义”
  t = t.replace(/(^|[\s，；])(\d{1,2})\.\s*(?=[\u4e00-\u9fff])/g, '$1第$2点，')

  // 4) 分数线：2/3 → 3分之2；a/b → b分之a
  t = t.replace(/(\d+(?:\.\d+)?)\s?\/\s?(\d+(?:\.\d+)?)/g, '$2分之$1')
  t = t.replace(/([A-Za-z])\s?\/\s?([A-Za-z\d])/g, (_m, a: string, b: string) => `${b.slice(0, 1)}分之${a}${b.slice(1)}`)
  // 兜底：仍剩的 a…/b… 且两侧都含数字字母 → 后分之前（如 ab³/5）
  t = t.replace(/([^\s，。；：、/（）()]{1,16})\/([^\s，。；：、/（）()]{1,16})/g, (m, a: string, b: string) => {
    if (/[和或及]/.test(m)) return m
    if (!/[\dA-Za-z]/.test(a) || !/[\dA-Za-z]/.test(b)) return m
    return `${b}分之${a}`
  })

  // 5) 运算符 / 几何符 / 角度（先于加减号：等号等读法要参与加减号的语境判断）
  for (const [re, to] of OPERATORS) t = t.replace(re, to)
  t = t.replace(/(\d)\s?°/g, '$1度')
  t = t.replace(/([A-Za-z])′/g, '$1撇')
  t = t.replace(/(\d)′/g, '$1分')
  t = t.replace(/(\d)″/g, '$1秒')
  // 相邻隐含乘法：2(2x - 1) → 2乘(2x - 1)
  t = t.replace(/([\dA-Za-z])\s*\((?=[\dA-Za-z+-])/g, '$1乘(')

  // 6) 加减号读法：
  //    区间“第 1-3 讲”先保护为“到”
  t = t.replace(/(\d+)\s*-\s*(\d+)(?=\s*(页|讲|题|步|年|月|日|课|单元))/g, '$1到$2')
  //    等号后接符号：= +(5-3)/= +2 → 等于正…；= -(5+3)/= -8 → 等于负…
  t = t.replace(/等于\s*\+\s*(?=[\dA-Za-z（(])/g, '等于正')
  t = t.replace(/等于\s*-\s*(?=[\dA-Za-z（(])/g, '等于负')
  //    记述动词后的 ±：记作 +8 → 记作正8（是正负号，不是加法）
  t = t.replace(/(记作|记为|写作|读作|得|是|为)\s*\+\s*(?=[\dA-Za-z])/g, '$1正')
  t = t.replace(/(记作|记为|写作|读作|得|是|为)\s*-\s*(?=[\dA-Za-z])/g, '$1负')
  //    中缀（lookahead 不消耗右操作数，保证 5 + 7 + 9 连续转换）：
  //    3-5 → 3减5；] + 5 → ]加5；角1+角2 → 角1加角2
  //    （中文后接 + 视为加；中文后接 - 通常是负号，交给前缀规则）
  t = t.replace(/([\dA-Za-z）)\]])(\s*)-(\s*)(?=[\dA-Za-z（([])/g, '$1$2减$3')
  t = t.replace(/([\dA-Za-z）)\]\u4e00-\u9fff])(\s*)\+(\s*)(?=[\dA-Za-z（(\u4e00-\u9fff])/g, '$1$2加$3')
  //    加 / 减一个括号整体：… + (-99) → … 加(负99)
  t = t.replace(/([\s，。：；、|])\+\s*(?=[（(])/g, '$1加')
  t = t.replace(/([\s，。：；、|])-\s*(?=[（(])/g, '$1减')
  //    前缀：-3 → 负3；+8 → 正8（“之”后是 分之-3 这类分数负号）
  t = t.replace(/(^|[\s，。：；、（(|之])-\s*(?=[\dA-Za-z])/g, '$1负')
  t = t.replace(/(^|[\s，。：；、（(|之])\+\s*(?=[\dA-Za-z])/g, '$1正')

  // 8) 绝对值与竖线表格：
  //    紧凑竖线且内容是纯数学式（允许已转换的 加/减/负 等读法词）→ x减2的绝对值；
  //    其余竖线按表格处理，直接去掉
  t = t
    .split('\n')
    .map((line) => {
      if (!line.includes('|')) return line
      line = line.replace(/\|([^|\n]{1,24}?)\|/g, (_m, inner: string) => {
        const s = String(inner)
        if (s.startsWith(' ') || s.endsWith(' ')) return s
        if (hasRealChinese(s)) return s
        return `${s}的绝对值`
      })
      return line.replace(/\|/g, '')
    })
    .join('\n')

  // 9) 箭头 / 省略号 / 点乘 / 其它符号
  t = t
    .replace(/……/g, '等等')
    .replace(/…/g, '，以此类推，')
    .replace(/⟹/g, '，由此可得，')
    .replace(/⇒/g, '，所以，')
    .replace(/→/g, '，然后，')
    .replace(/←/g, '，反过来，')
    .replace(/([\dA-Za-z）)])\s?·\s?([\dA-Za-z(（])/g, '$1乘$2')
    .replace(/·/g, '，')
    .replace(/—/g, '，')
    .replace(/~/g, '到')
    .replace(/✓/g, '，正确，')
    .replace(/✗/g, '，错误，')

  // 10) 括号：
  //     （1）(2) 编号 → 第一、第二（先于数学括号剥离，避免 (1) 被当作数学式）
  t = t.replace(/(^|[\s。；：，、])[（(]\s*(\d{1,2})\s*[)）]/g, '$1第$2，')
  //     纯数学小括号直接去掉（(-1)+2 → 负1加2，老师就是这么念的）
  t = t.replace(/\(([^()（）\n]{1,16}?)\)/g, (_m, inner: string) =>
    hasRealChinese(inner) ? `（${inner}）` : inner,
  )
  //     剩余成对括号（含中文）→ 停顿
  t = t.replace(/[（(]/g, '，').replace(/[）)]/g, '，')
  //     方括号 / 花括号 / 【】标记
  t = t.replace(/【([^】]{1,12})】/g, '，$1，').replace(/[[{]/g, '，').replace(/[\]}]/g, '，')

  // 11) 标点统一与收尾清理
  t = t
    .replace(/,/g, '，')
    .replace(/;/g, '；')
    .replace(/!/g, '。')
    .replace(/\?/g, '？')
    .replace(/:/g, '，')
    .replace(/\t/g, '，')
    .replace(/ {2,}/g, ' ')
    .replace(/\s+([，。、；！？])/g, '$1')
    .replace(/([。！？；，]) +/g, '$1')
    .replace(/([。！？；，]){2,}/g, '$1')
    .replace(/([。！？；])，/g, '$1')
    // 残留在标点旁的加减号（如省略号两侧）去掉
    .replace(/([，。；\s])\s*[+-]\s*(?=[，。；\s])/g, '$1')
    .replace(/(?:^|[，。；\s])\s*[+-]\s*$/g, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/\n/g, '，')
    .trim()
  t = t.replace(/^[，。、；，]+/, '')
  if (t && !/[。！？；，]$/.test(t)) t += '。'
  // 自然停顿：问句后加"。"让 TTS 停一拍（"？。"= 句末双重标点 → 0.5 秒停顿）
  t = t
    .replace(/？(?=[^，。！？；\s])/g, '？。')          // 问句后直接跟内容 → 加停顿
    .replace(/！(?=[^，。！？；\s])/g, '！。')          // 感叹后同理
    .replace(/([。！？])我们来看/g, '$1。我们来看')     // 过渡语前停顿
    .replace(/([。！？])其实/g, '$1。其实')             // "其实"前停顿（思考感）
    .replace(/([。！？])所以/g, '$1。所以')             // "所以"前停顿
    .replace(/([。！？])注意/g, '$1。注意')             // "注意"前停顿
  return t
}

/** 把长文本切成适合语音合成的句子（每段不超过约 90 字） */
export function splitSentences(text: string): string[] {
  const parts = text
    .split(/(?<=[。！？；])/g)
    .flatMap((s) => (s.length > 90 ? s.split('，') : [s]))
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length ? parts : [text]
}

// ---------- 课件页 → 讲解步骤 ----------

function clean(s: string | undefined): string {
  return (s ?? '').replace(/[ \t]+/g, ' ').trim()
}

/** 一页课件 → 讲解步骤。例题页两步（题目 / 解答），其余页一步。 */
export function buildNarration(slide: Slide): NarrationStep[] {
  const steps: NarrationStep[] = []
  if (slide.kind === 'example') {
    const problem = clean(slide.problem) || clean(slide.body)
    const solution = clean(slide.solution)
    const notes = clean(slide.notes)
    if (problem) {
      steps.push({
        key: 'problem',
        label: '题目',
        text: speakable(`请看题。${problem} 请先自己想一想，再看解答。`),
      })
    }
    if (solution) {
      const tail = notes ? speakable(`注意，${notes}`) : ''
      steps.push({
        key: 'solution',
        label: '解答',
        text: speakable(`我们来看解答。${solution}`) + (tail ? ' ' + tail : ''),
      })
    }
    return steps
  }
  const title = clean(slide.title)
  const body = clean(slide.body)
  if (title || body) {
    steps.push({
      key: 'body',
      label: '讲解',
      text: speakable([title, body].filter(Boolean).join('。')),
    })
  }
  return steps
}
