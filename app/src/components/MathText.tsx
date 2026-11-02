import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'
import { Figure } from './Figure'
import type { FigureSpec } from './Figure'

/** 拆出 @@fig {json}@@ 图形标记 */
export function splitFigures(text: string): { text: string; figures: FigureSpec[] } {
  const figures: FigureSpec[] = []
  const t = text.replace(/@@fig\s*(\{[^@]*?\})\s*@@/g, (_m, json: string) => {
    try {
      figures.push(JSON.parse(json) as FigureSpec)
    } catch {
      /* 非法 JSON 忽略 */
    }
    return '\n'
  })
  return { text: t, figures }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 内容默认使用 Unicode 纯文本数学书写；若使用 $...$ 包裹 LaTeX，则用 KaTeX 渲染。
 */
function renderMixed(text: string): string {
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$\n]+\$)/g)
  return parts
    .map((part) => {
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
        try {
          return katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false })
        } catch {
          return escapeHtml(part)
        }
      }
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        try {
          return katex.renderToString(part.slice(1, -1), { displayMode: false, throwOnError: false })
        } catch {
          return escapeHtml(part)
        }
      }
      return escapeHtml(part)
    })
    .join('')
}

export function MathText({
  text,
  className = '',
}: {
  text: string | undefined | null
  className?: string
}) {
  const { body, figures } = useMemo(() => {
    const { text: t, figures } = splitFigures(text ?? '')
    return { body: renderMixed(t), figures }
  }, [text])
  if (!figures.length) {
    return <div className={`math-content ${className}`} dangerouslySetInnerHTML={{ __html: body }} />
  }
  return (
    <div className={className}>
      <div className="math-content" dangerouslySetInnerHTML={{ __html: body }} />
      {figures.map((f, i) => (
        <Figure key={i} spec={f} />
      ))}
    </div>
  )
}

export function MathInline({ text }: { text: string | undefined | null }) {
  const html = useMemo(() => renderMixed(text ?? ''), [text])
  return <span className="math-content" dangerouslySetInnerHTML={{ __html: html }} />
}
