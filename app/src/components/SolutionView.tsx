import { MathText } from './MathText'

/**
 * 解答文本 → 结构化步骤行。
 * 规则：
 *  - 换行天然是步骤边界
 *  - 中文分号"；"总是视为步骤分隔
 *  - 句号"。"仅在段落是长计算链（含多个等号）时按步骤拆分，纯说理文字保持整段
 */
export function splitSolutionLines(text: string): string[] {
  const out: string[] = []
  for (const para of (text ?? '').split(/\n+/)) {
    for (const seg of para.trim().split('；')) {
      const s = seg.trim()
      if (!s) continue
      const eqCount = (s.match(/=/g) ?? []).length
      if (s.length > 45 && eqCount >= 2) {
        // 长计算链：句号后拆行；过短的碎片并回上一行
        const frags = s.split(/(?<=。)/).map((x) => x.trim()).filter(Boolean)
        const merged: string[] = []
        for (const f of frags) {
          if (merged.length && f.length < 12) merged[merged.length - 1] += f
          else merged.push(f)
        }
        out.push(...merged)
      } else {
        out.push(s)
      }
    }
  }
  return out
}

/** 完整解析的分步展示：多行时用 ①②③ 徽标逐行排布，单行保持原样 */
export function SolutionView({ text, className = '' }: { text: string; className?: string }) {
  const lines = splitSolutionLines(text)
  if (lines.length <= 1) {
    return <MathText className={className} text={text} />
  }
  return (
    <ol className={`mt-1 space-y-1.5 ${className}`}>
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
            {i + 1}
          </span>
          <MathText className="min-w-0 flex-1" text={line} />
        </li>
      ))}
    </ol>
  )
}
