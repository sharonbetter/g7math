import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'

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
  const html = useMemo(() => renderMixed(text ?? ''), [text])
  return <div className={`math-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
}

export function MathInline({ text }: { text: string | undefined | null }) {
  const html = useMemo(() => renderMixed(text ?? ''), [text])
  return <span className="math-content" dangerouslySetInnerHTML={{ __html: html }} />
}
