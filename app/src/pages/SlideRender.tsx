import { useParams } from 'react-router-dom'
// eslint-disable-next-line
import { MathText } from '../components/MathText'
import { useCurriculum, useLessonFile, pointMapOf } from '../lib/data'
import type { Slide } from '../types'
import { useEffect, useMemo } from 'react'

const SLIDE_STYLE: Record<Slide['kind'], { label: string; tone: string; bar: string }> = {
  concept: { label: '概念讲解', tone: 'bg-blue-100 text-blue-800 border-blue-300', bar: 'border-l-blue-500' },
  example: { label: '例题精讲', tone: 'bg-indigo-100 text-indigo-800 border-indigo-300', bar: 'border-l-indigo-500' },
  method: { label: '方法提炼', tone: 'bg-green-100 text-green-800 border-green-300', bar: 'border-l-green-500' },
  pitfall: { label: '易错提醒', tone: 'bg-amber-100 text-amber-800 border-amber-300', bar: 'border-l-amber-500' },
  book: { label: '新思维拓展', tone: 'bg-violet-100 text-violet-800 border-violet-300', bar: 'border-l-violet-500' },
}

/**
 * 纯渲染页：无导航/无交互，用于 Playwright 截图 → 合成视频。
 * 1920×1080，大字号，自适应内容长度。
 */
export default function SlideRenderPage() {
  const { pointId, slideIdx } = useParams()
  const { curriculum } = useCurriculum()
  const idx = parseInt(slideIdx ?? '0', 10)

  const chapterId = useMemo(() => {
    if (!curriculum) return undefined
    for (const v of curriculum.volumes)
      for (const c of v.chapters) {
        if (pointMapOf(c).has(pointId ?? '')) return c.id
      }
    return undefined
  }, [curriculum, pointId])

  const { lessonFile } = useLessonFile(chapterId)
  const lesson = lessonFile?.lessons.find((l) => l.pointId === pointId)
  const slide = lesson?.slides[idx]

  useEffect(() => {
    // 通知 Playwright 页面就绪
    document.title = slide ? 'ready' : 'not-found'
  }, [slide])

  if (!slide) return <div style={{ ...pageStyle, justifyContent: 'center', alignItems: 'center' }}>加载中…</div>

  const style = SLIDE_STYLE[slide.kind] ?? SLIDE_STYLE.concept

  const bodyLen = (slide.body ?? slide.problem ?? '').length + (slide.solution?.length ?? 0)
  const fs = bodyLen > 500 ? 28 : bodyLen > 250 ? 32 : bodyLen > 120 ? 38 : 44
  const lh = bodyLen > 500 ? 1.5 : 1.65

  return (
    <div style={{ ...pageStyle, fontSize: fs, lineHeight: lh }}>
      <div style={slideCardStyle}>
        {/* 类型条 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, borderBottom: '2px solid #e2e8f0', paddingBottom: 20 }}>
          <span style={{
            ...badgeStyle,
            ...{ background: style.tone.split(' ')[0] + ' ' + style.tone.split(' ')[1], color: style.tone.split(' ')[2] },
            borderColor: style.tone.split(' ')[3]?.replace('border-', ''),
          }}>
            {style.label}
          </span>
          <span style={{ fontSize: Math.max(30, fs - 4), fontWeight: 700, color: '#1e293b', flex: 1 }}>{slide.title}</span>
          {slide.bookRef && <span style={{ fontSize: Math.max(20, fs - 8), color: '#8b5cf6' }}>《{slide.bookRef}》</span>}
        </div>

        {/* 正文 */}
        {slide.body && (
          <MathText
            text={slide.body}
            className=""
          />
        )}

        {/* 例题 */}
        {slide.problem && (
          <div style={{ ...boxStyle, background: '#fffbeb' }}>
            <div style={{ ...labelStyle, color: '#b45309' }}>题目</div>
            <MathText text={slide.problem} />
          </div>
        )}
        {slide.solution && (
          <div style={{ ...boxStyle, background: '#f0fdf4' }}>
            <div style={{ ...labelStyle, color: '#15803d' }}>解答</div>
            <MathText text={slide.solution} />
          </div>
        )}
        {slide.notes && (
          <div style={{ ...boxStyle, background: '#fefce8' }}>
            <div style={{ ...labelStyle, color: '#a16207' }}>点评</div>
            <MathText text={slide.notes} />
          </div>
        )}
      </div>
    </div>
  )
}

// 内联样式（避免 Tailwind CDN 依赖，确保 Playwright 截图时样式完整）
const pageStyle: React.CSSProperties = {
  width: '1920px',
  height: '1080px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  fontFamily: '-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  overflow: 'hidden',
  padding: '40px 60px',
  boxSizing: 'border-box',
}

const slideCardStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: '#ffffff',
  borderRadius: 24,
  padding: '48px 60px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxSizing: 'border-box',
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 16px',
  borderRadius: 10,
  fontSize: 22,
  fontWeight: 600,
  border: '2px solid transparent',
  whiteSpace: 'nowrap',
}

const boxStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: '20px 28px',
  marginTop: 16,
}

const labelStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 8,
}
