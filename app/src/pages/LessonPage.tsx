import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MathText } from '../components/MathText'
import { SlideDeck } from '../components/SlideDeck'
import { Card, Empty, ProgressBar } from '../components/ui'
import { pointMapOf, useAnimatedLessons, useCurriculum, useExam, useLessonAudio, useLessonFile } from '../lib/data'
import { markPerfected, markStudied, useAppData } from '../lib/store'
import { comboRunAt } from '../lib/incentives'
import { FogGuardBattle, MissionBriefing, WarReport } from '../components/LessonBattle'
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
      {slide.body && <MathText className="mt-3 text-sm text-gray-700" text={slide.body} />}
      {slide.problem && (
        <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3">
          <div className="mb-1 text-xs font-medium text-gray-500">题目</div>
          <MathText className="text-sm text-gray-800" text={slide.problem} />
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
              <MathText className="text-sm text-gray-800" text={slide.solution} />
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
    <Card className="p-4">
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

/** 有动画课件的知识点：嵌入式播放器（920×660 设计稿等比缩放；全屏时回到原生尺寸自适应） */
function AnimatedLessonPlayer({ pointId }: { pointId: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [full, setFull] = useState(false)
  const designW = 920
  const designH = 660

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / designW)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === wrapRef.current)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  return (
    <div
      ref={wrapRef}
      id="anim-lesson-wrap"
      className="w-full overflow-hidden rounded-xl bg-[#101a33]"
      style={full ? { height: '100vh' } : { height: Math.round(designH * (scale || 1)) }}
    >
      <iframe
        src={`${import.meta.env.BASE_URL}demo/${pointId}.html`}
        title="动画课件"
        allow="autoplay"
        style={
          full
            ? { width: '100%', height: '100%', border: 'none' }
            : {
                width: designW,
                height: designH,
                border: 'none',
                transform: `scale(${scale || 1})`,
                transformOrigin: 'top left',
              }
        }
      />
    </div>
  )
}

/** 战役的「幕」标题：给每个区块游戏章节感 */
function ActHeader({
  n,
  icon,
  title,
  hint,
  right,
}: {
  n: number
  icon: string
  title: string
  hint?: string
  right?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-950 text-xs font-bold text-white shadow-sm">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
          <span>{icon}</span>
          {title}
        </div>
        {hint && <div className="mt-0.5 text-[11px] text-gray-400">{hint}</div>}
      </div>
      {right}
    </div>
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
  const lessonAudio = useLessonAudio(found?.chapter.id, pointId)
  const { exam } = useExam(found?.chapter.id)
  const [deckOpen, setDeckOpen] = useState(false)
  /** 任务简报：未学完的课进场先弹简报，点「出发」进入 */
  const [briefed, setBriefed] = useState(false)
  /** 微战战报（perfect 是否完美；review 复习模式；gainedPerfect 复习中首次补拿闪耀） */
  const [report, setReport] = useState<{ perfect: boolean; review?: boolean; gainedPerfect?: boolean } | null>(null)
  const [rebattle, setRebattle] = useState(false)
  const animatedLessons = useAnimatedLessons()
  /** true = 有动画课件（替换文本课件）；false = 无；null = 清单加载中 */
  const hasAnim = animatedLessons === null ? null : animatedLessons.includes(pointId ?? '')

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
  const shining = !!data.perfected?.[point.id]
  /** 这门课对应本章 Boss 的题数（削血预告） */
  const bossQs = (exam?.questions ?? []).filter((q) => (q.pointIds ?? []).includes(point.id)).length
  const hasCheck = (lesson.checkQuestions?.length ?? 0) > 0

  /** 课末微战通关：点亮 +（完美则闪耀）→ 战报 */
  const handleWin = (perfect: boolean) => {
    markStudied(point.id)
    if (perfect) markPerfected(point.id)
    setReport({ perfect })
  }

  /** 复习再战：不重复给任务经验；此前未闪耀而这次全对，补发闪耀 +5 */
  const handleReviewWin = (perfect: boolean) => {
    let gained = false
    if (perfect && !shining) {
      markPerfected(point.id)
      gained = true
    }
    setReport({ perfect, review: true, gainedPerfect: gained })
  }

  return (
    <div className="space-y-4">
      {/* 任务简报：未学完的课进场先弹 */}
      {!completed && !briefed && (
        <MissionBriefing
          pointName={point.name}
          chapterTitle={`${chapter.no} ${chapter.title}`}
          bossQs={bossQs}
          minutes={point.estimatedMinutes}
          objectives={lesson.objectives}
          onStart={() => setBriefed(true)}
        />
      )}

      {/* 微战战报 */}
      {report && (
        <WarReport
          perfect={report.perfect}
          combo={report.review ? 1 : comboRunAt(data.studied, data.studied[point.id] ?? 0)}
          bossQs={report.review ? 0 : bossQs}
          review={report.review}
          gainedPerfect={report.gainedPerfect}
          nextName={next?.name}
          onContinue={() => navigate(next ? `/lesson/${next.id}` : `/curriculum/${chapter.id}`)}
          onBack={() => navigate(`/curriculum/${chapter.id}`)}
        />
      )}

      {/* 战役横幅 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-blue-900 to-indigo-800 px-5 py-5 text-white shadow-lg md:px-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link to={`/curriculum/${chapter.id}`} className="text-xs text-white/70 transition hover:text-white">
              ← 返回关卡
            </Link>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-medium ring-1 ring-white/15">
                第 {idx + 1}/{ordered.length} 站
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 ring-1 ring-white/15">
                {chapter.no} {chapter.title}
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 ring-1 ring-white/15">约 {lesson.durationMinutes} 分钟</span>
              {completed && (
                <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 font-medium text-emerald-200 ring-1 ring-emerald-300/30">
                  {shining ? '⭐ 闪耀点亮' : '已点亮'}
                </span>
              )}
            </div>
            <h1 className="mt-2.5 text-xl font-bold tracking-tight md:text-2xl">⚔️ {point.name}</h1>
            {/* 三幕战役进度 */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/15">📖 情报</span>
              <span className="text-white/40">──</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/15">🎬 课件</span>
              <span className="text-white/40">──</span>
              <span className={`rounded-full px-2.5 py-1 ring-1 ${completed ? 'bg-emerald-400/20 text-emerald-200 ring-emerald-300/30' : 'bg-amber-400/25 text-amber-100 ring-amber-300/40'}`}>
                🐜 微战{completed ? ' ✓ 已通关' : ''}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <div className="text-[11px] text-white/70">通关奖励</div>
              <div className="text-sm font-bold tabular-nums text-amber-300">
                +10 XP{bossQs > 0 ? ` · 削 Boss 血 ×${bossQs}` : ''}
              </div>
              <div className="mt-0.5 text-[11px] text-white/60">全对微战再 +5 ⭐</div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {hasAnim ? (
                <button
                  className="btn !rounded-xl !border-white/25 !bg-white/10 !px-4 !py-2 !text-[13px] !text-white hover:!bg-white/20"
                  onClick={() => {
                    document.getElementById('anim-lesson-wrap')?.requestFullscreen().catch(() => {})
                  }}
                >
                  ⛶ 全屏观看
                </button>
              ) : (
                <button
                  className="btn !rounded-xl !border-white/25 !bg-white/10 !px-4 !py-2 !text-[13px] !text-white hover:!bg-white/20"
                  onClick={() => setDeckOpen(true)}
                >
                  ▶ 幻灯片放映
                </button>
              )}
              <button
                className="btn btn-primary !rounded-xl !px-4 !py-2 !text-[13px]"
                disabled={!completed && hasCheck}
                title={!completed && hasCheck ? '通过第三幕微战即可点亮本课' : undefined}
                onClick={() => {
                  if (!completed && hasCheck) return
                  markStudied(point.id)
                  if (next) navigate(`/lesson/${next.id}`)
                  else navigate(`/curriculum/${chapter.id}`)
                }}
              >
                {completed ? '下一站 →' : hasCheck ? '⚔️ 通关微战点亮' : '标记已学完'}
              </button>
            </div>
            <Link to={`/exam/${chapter.id}`} className="text-[11px] text-white/50 underline-offset-2 hover:text-white/80 hover:underline">
              跳过任务，直接挑战本章 Boss →
            </Link>
          </div>
        </div>
      </section>

      {/* 第一幕 · 情报站 */}
      <section className="card p-4 md:p-5">
        <ActHeader n={1} icon="📖" title="情报站" hint="本课要拿下的目标——带着它们上战场" />
        <div className="grid gap-2 sm:grid-cols-2">
          {lesson.objectives.map((o, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl bg-gray-50 px-3.5 py-2.5">
              <span className="mt-0.5 text-xs">🎯</span>
              <MathText className="inline text-[13px] leading-relaxed text-gray-700" text={o} />
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
          <div className="text-[11px] font-medium text-amber-600">情报摘要</div>
          <div className="mt-1">
            <MathText className="text-sm text-gray-700" text={point.summary} />
          </div>
        </div>
      </section>

      {/* 第二幕 · 主舞台 */}
      <section>
        <ActHeader
          n={2}
          icon="🎬"
          title="主舞台"
          hint="看懂了，第三幕的守卫就拦不住你"
          right={
            hasAnim ? (
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() => {
                  document.getElementById('anim-lesson-wrap')?.requestFullscreen().catch(() => {})
                }}
              >
                ⛶ 全屏
              </button>
            ) : undefined
          }
        />
      {hasAnim === null ? (
        <Card className="p-10 text-center text-sm text-gray-400">课件加载中…</Card>
      ) : hasAnim ? (
        <div className="relative rounded-2xl bg-[#0b1226] p-2.5 shadow-lg ring-1 ring-white/10 sm:p-3">
          <span className="pointer-events-none absolute left-1.5 top-1.5 h-4 w-4 border-l-2 border-t-2 border-amber-400/70" />
          <span className="pointer-events-none absolute right-1.5 top-1.5 h-4 w-4 border-r-2 border-t-2 border-amber-400/70" />
          <span className="pointer-events-none absolute bottom-1.5 left-1.5 h-4 w-4 border-b-2 border-l-2 border-amber-400/70" />
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 h-4 w-4 border-b-2 border-r-2 border-amber-400/70" />
          <AnimatedLessonPlayer pointId={point.id} />
        </div>
      ) : (
        <>
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
              {!completed &&
                (hasCheck ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => document.getElementById('act3')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    ⚔️ 课件看完，去打微战 ↓
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => markStudied(point.id)}>
                    标记本知识点已学完
                  </button>
                ))}
            </div>
          )}
        </>
      )}
      </section>

      {/* 第三幕 · 迷雾守卫 */}
      {hasCheck && (
        <section id="act3">
          <ActHeader
            n={3}
            icon="🐜"
            title="迷雾守卫"
            hint={completed ? '复习再战 · 此前未闪耀而全对可补发 +5 XP' : '每题一滴血 · 全对首过闪耀点亮 ⭐（+5 XP）'}
          />
          {completed ? (
        rebattle ? (
          <FogGuardBattle lesson={lesson} pointName={point.name} onWin={handleReviewWin} />
        ) : (
          <div className="space-y-3">
            <div className="card flex flex-wrap items-center justify-between gap-3 !p-4">
              <div className="text-sm text-gray-600">
                🐜 这课你已经拿下{shining ? '（⭐ 闪耀点亮）' : ''}——想再打一遍迷雾守卫练手感吗？
                {!shining && ' 这次全对还能补发闪耀 +5 XP'}
              </div>
              <button className="btn !rounded-xl !py-2 !text-[13px]" onClick={() => setRebattle(true)}>
                🔁 再战迷雾守卫
              </button>
            </div>
            <CheckQuestions lesson={lesson} />
          </div>
        )
      ) : (
        <FogGuardBattle lesson={lesson} pointName={point.name} onWin={handleWin} />
      )}
        </section>
      )}

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

      {deckOpen && (
        <SlideDeck
          chapterId={chapter.id}
          lesson={lesson}
          audio={lessonAudio}
          completed={completed}
          onClose={() => setDeckOpen(false)}
          onMarkStudied={() => markStudied(point.id)}
        />
      )}
    </div>
  )
}
