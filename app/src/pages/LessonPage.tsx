import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MathText } from '../components/MathText'
import { Badge, Card, Empty, ProgressBar } from '../components/ui'
import { pointMapOf, useCurriculum, useLessonFile } from '../lib/data'
import { markStudied, useAppData } from '../lib/store'
import type { Lesson, Slide } from '../types'

const SLIDE_STYLE: Record<Slide['kind'], { label: string; tone: string; bar: string }> = {
  concept: { label: '概念讲解', tone: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'border-l-blue-400' },
  example: { label: '例题精讲', tone: 'bg-indigo-50 text-indigo-700 border-indigo-200', bar: 'border-l-indigo-400' },
  method: { label: '方法提炼', tone: 'bg-green-50 text-green-700 border-green-200', bar: 'border-l-green-400' },
  pitfall: { label: '易错提醒', tone: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'border-l-amber-400' },
  book: { label: '新思维拓展', tone: 'bg-violet-50 text-violet-700 border-violet-200', bar: 'border-l-violet-400' },
}

function SlideView({ slide }: { slide: Slide }) {
  const [showSolution, setShowSolution] = useState(slide.kind !== 'example')
  const style = SLIDE_STYLE[slide.kind] ?? SLIDE_STYLE.concept
  return (
    <div className={`rounded-r-xl border border-l-4 border-gray-100 bg-white px-5 py-4 ${style.bar}`}>
      <div className="flex items-center gap-2">
        <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${style.tone}`}>{style.label}</span>
        <span className="text-sm font-semibold text-gray-800">{slide.title}</span>
        {slide.bookRef && <span className="text-xs text-violet-500">《{slide.bookRef}》</span>}
      </div>
      {slide.body && <MathText className="mt-3 text-[15px] text-gray-700" text={slide.body} />}
      {slide.problem && (
        <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3">
          <div className="mb-1 text-xs font-medium text-gray-500">题目</div>
          <MathText className="text-[15px] text-gray-800" text={slide.problem} />
        </div>
      )}
      {slide.solution && (
        <div className="mt-3">
          {!showSolution ? (
            <button className="btn !py-1.5 !text-[13px]" onClick={() => setShowSolution(true)}>
              显示解答
            </button>
          ) : (
            <div className="rounded-lg border border-green-100 bg-green-50/50 px-4 py-3">
              <div className="mb-1 text-xs font-medium text-green-700">解答</div>
              <MathText className="text-[15px] text-gray-800" text={slide.solution} />
            </div>
          )}
        </div>
      )}
      {slide.notes && showSolution && (
        <div className="mt-3 text-xs leading-relaxed text-gray-500">
          <span className="font-medium text-gray-600">点评：</span>
          <MathText className="inline text-xs text-gray-500" text={slide.notes} />
        </div>
      )}
    </div>
  )
}

function CheckQuestions({ lesson }: { lesson: Lesson }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-800">随堂检测</h3>
      <div className="mt-3 space-y-2">
        {lesson.checkQuestions.map((cq, i) => (
          <div key={i} className="rounded-lg border border-gray-100 px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <MathText className="text-sm text-gray-800" text={cq.question} />
                {open === i && (
                  <div className="mt-2 rounded-md bg-green-50 px-3 py-2">
                    <MathText className="text-sm text-gray-700" text={cq.answer} />
                  </div>
                )}
              </div>
              <button className="btn !py-1 !text-xs" onClick={() => setOpen(open === i ? null : i)}>
                {open === i ? '收起' : '查看答案'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function LessonPage() {
  const { pointId } = useParams()
  const { curriculum } = useCurriculum()
  const navigate = useNavigate()
  const data = useAppData()

  const found = useMemo(() => {
    if (!curriculum || !pointId) return null
    for (const v of curriculum.volumes)
      for (const c of v.chapters) {
        const pm = pointMapOf(c)
        const p = pm.get(pointId)
        if (p) {
          const ordered = c.sections.flatMap((s) => s.points)
          const idx = ordered.findIndex((x) => x.id === pointId)
          return { chapter: c, point: p, ordered, idx }
        }
      }
    return null
  }, [curriculum, pointId])

  const { lessonFile, missing } = useLessonFile(found?.chapter.id)

  useEffect(() => {
    window.scrollTo(0, 0)
    setSlideIdx(0)
  }, [pointId])

  const [slideIdx, setSlideIdx] = useState(0)

  if (!found) return <Empty title="未找到该知识点" hint="请返回课程中心重新选择。" />
  if (missing)
    return (
      <Empty
        title="该章课件正在生成中"
        hint={
          <>
            课件数据文件（data/lessons/{found.chapter.id}.json）尚未生成。
            可以先观看下方的知识点要点，或返回 <Link to="/curriculum" className="text-blue-600">课程中心</Link>。
            <div className="mt-3 text-left">
              <div className="text-sm font-medium text-gray-700">{found.point.name}</div>
              <div className="mt-1 text-sm text-gray-600">{found.point.summary}</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                {found.point.keyPoints.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </div>
          </>
        }
      />
    )

  const lesson = lessonFile?.lessons.find((l) => l.pointId === pointId)
  if (!lesson)
    return (
      <Empty
        title="该知识点的课件尚未生成"
        hint={<span className="text-sm text-gray-600">{found.point.summary}</span>}
      />
    )

  const { chapter, point, ordered, idx } = found
  const prev = idx > 0 ? ordered[idx - 1] : null
  const next = idx < ordered.length - 1 ? ordered[idx + 1] : null
  const completed = !!data.studied[point.id]

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-gray-400">
              <Link to="/curriculum" className="hover:text-blue-600">
                课程中心
              </Link>{' '}
              /{' '}
              <Link to={`/curriculum/${chapter.id}`} className="hover:text-blue-600">
                {chapter.no} {chapter.title}
              </Link>
            </div>
            <h1 className="mt-1 text-lg font-semibold">{lesson.title}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <Badge tone="blue">约 {lesson.durationMinutes} 分钟</Badge>
              <Badge>难度 {'★'.repeat(Math.max(1, Math.min(3, point.difficulty)))}</Badge>
              {point.bookRefs?.map((r) => (
                <Badge key={r} tone="violet">
                  《{r}》
                </Badge>
              ))}
              {completed && <Badge tone="green">已学完</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/exam/${chapter.id}`} className="btn">
              去做本章考评
            </Link>
            <button
              className="btn btn-primary"
              onClick={() => {
                markStudied(point.id)
                if (next) navigate(`/lesson/${next.id}`)
                else navigate(`/curriculum/${chapter.id}`)
              }}
            >
              {completed ? '下一知识点' : '标记已学完并继续'}
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-800">学习目标</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {lesson.objectives.map((o, i) => (
            <li key={i}>
              <MathText className="inline text-sm" text={o} />
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3">
          <div className="text-xs font-medium text-gray-500">知识要点</div>
          <div className="mt-1">
            <MathText className="text-sm text-gray-700" text={point.summary} />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <span className="shrink-0 text-xs text-gray-400">
          课件进度 {slideIdx + 1}/{lesson.slides.length}
        </span>
        <ProgressBar value={slideIdx + 1} max={lesson.slides.length} />
      </div>

      <div className="space-y-3">
        {lesson.slides.map((s, i) => (
          <div key={i} className={i <= slideIdx ? '' : 'hidden'}>
            <SlideView slide={s} />
          </div>
        ))}
      </div>

      {slideIdx < lesson.slides.length - 1 ? (
        <button className="btn btn-primary w-full" onClick={() => setSlideIdx(slideIdx + 1)}>
          下一页（{slideIdx + 2}/{lesson.slides.length}）
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => setSlideIdx(0)}>
            回顾课件
          </button>
          {!completed && (
            <button className="btn btn-primary" onClick={() => markStudied(point.id)}>
              标记本知识点已学完
            </button>
          )}
        </div>
      )}

      <CheckQuestions lesson={lesson} />

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          {prev ? (
            <Link to={`/lesson/${prev.id}`} className="btn !text-[13px]">
              ← {prev.name}
            </Link>
          ) : (
            <span />
          )}
          <Link to={`/curriculum/${chapter.id}`} className="btn-ghost btn !text-[13px]">
            返回章节
          </Link>
          {next ? (
            <Link to={`/lesson/${next.id}`} className="btn !text-[13px]">
              {next.name} →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </Card>
    </div>
  )
}
