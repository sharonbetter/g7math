#!/usr/bin/env node
/**
 * 离线生成课件讲解音频（macOS 婷婷语音）。
 *
 * 读取 data/lessons/*.json，用与网页端相同的讲解词逻辑（src/lib/narration.ts），
 * 逐页逐段调用 `say -v Tingting` 生成 m4a，输出到 app/public/audio/：
 *   audio/lessons/<chapterId>/<pointId>-<slideIdx>-<stepIdx>.m4a
 *   audio/manifest.json —— 每段音频的文本哈希与时长（ms），供前端判断是否有音频、
 *   是否需要回退浏览器语音合成。
 *
 * 用法：
 *   node scripts/gen-lesson-audio.ts                 # 全量（按哈希增量，未变不重生成）
 *   node scripts/gen-lesson-audio.ts --chapter 7a-c1 # 只生成某一章
 *   node scripts/gen-lesson-audio.ts --point 7a-1-01 # 只生成某个知识点
 *   node scripts/gen-lesson-audio.ts --force         # 忽略哈希，全部重生成
 *
 * 依赖：macOS 自带 say / afinfo，语音“婷婷 (Tingting, zh_CN)”。
 */
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
// Node 22 type-stripping 直接运行 .ts；讲解词逻辑与前端共用同一份文件
import { buildNarration } from '../src/lib/narration.ts'
import type { AudioManifest, AudioStepMeta, LessonFile, Slide } from '../src/types.ts'

const here = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(here, '..')
const repoRoot = resolve(appRoot, '..')
const lessonsDir = join(repoRoot, 'data', 'lessons')
const outRoot = join(appRoot, 'public', 'audio')
const manifestPath = join(outRoot, 'manifest.json')

const VOICE = 'Tingting'
const CONCURRENCY = 4

// ---------- CLI ----------
const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const onlyChapter = flag('chapter')
const onlyPoint = flag('point')
const force = args.includes('--force')

// ---------- 工具 ----------
function checkVoice(): boolean {
  const r = spawnSync('say', ['-v', '?'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  const ok = !!r.stdout && r.stdout.split('\n').some((l) => new RegExp(`^${VOICE}\\s`).test(l))
  if (!ok) {
    console.error(
      `× 未找到语音 ${VOICE}（zh_CN）。请在 系统设置 → 辅助功能 → 朗读内容 → 系统声音 中安装“婷婷”后重试。`,
    )
  }
  return ok
}

function audioDurationMs(file: string): number {
  const r = spawnSync('afinfo', [file], { encoding: 'utf8' })
  const m = r.stdout?.match(/estimated duration:\s*([\d.]+)\s*sec/)
  return m ? Math.round(parseFloat(m[1]) * 1000) : 0
}

interface StepText {
  slideIdx: number
  stepIdx: number
  hash: string
  text: string
}

function stepTextsOf(lesson: { slides: Slide[] }): StepText[] {
  const steps: StepText[] = []
  lesson.slides.forEach((slide, slideIdx) => {
    buildNarration(slide).forEach((step, stepIdx) => {
      steps.push({
        slideIdx,
        stepIdx,
        hash: createHash('sha1').update(step.text).digest('hex').slice(0, 12),
        text: step.text,
      })
    })
  })
  return steps
}

function relFile(chapterId: string, pointId: string, slideIdx: number, stepIdx: number): string {
  return join('lessons', chapterId, `${pointId}-${slideIdx}-${stepIdx}.m4a`)
}

// ---------- 生成 ----------
const tmp = mkdtempSync(join(tmpdir(), 'lesson-audio-'))
let generated = 0
let skipped = 0
let failed = 0

function synthesize(absPath: string, text: string): number {
  const txt = join(tmp, `t-${process.pid}-${Math.random().toString(36).slice(2, 8)}.txt`)
  writeFileSync(txt, text, 'utf8')
  try {
    execFileSync('say', ['-v', VOICE, '-f', txt, '-o', absPath, '--data-format=aac'], {
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    return audioDurationMs(absPath)
  } finally {
    rmSync(txt, { force: true })
  }
}

async function main() {
  if (!checkVoice()) process.exit(1)

  const prevManifest: AudioManifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : { generatedAt: '', voice: VOICE, chapters: {} }

  const files = readdirSync(lessonsDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
  const chapters = files
    .map((f) => JSON.parse(readFileSync(join(lessonsDir, f), 'utf8')) as LessonFile)
    .filter((c) => !onlyChapter || c.chapterId === onlyChapter)
  if (!chapters.length) {
    console.error(`× 没有匹配的章节数据（--chapter ${onlyChapter}）`)
    process.exit(1)
  }

  interface Job {
    chapterId: string
    pointId: string
    slideIdx: number
    stepIdx: number
    absPath: string
    text: string
  }

  const jobs: Job[] = []
  const manifest: AudioManifest = { generatedAt: '', voice: VOICE, chapters: {} }

  for (const chapter of chapters) {
    const prevPoints = prevManifest.chapters[chapter.chapterId] ?? {}
    const nextPoints: Record<string, { slides: AudioStepMeta[] }> = {}
    for (const lesson of chapter.lessons) {
      if (onlyPoint && lesson.pointId !== onlyPoint) continue
      const slides: AudioStepMeta[] = lesson.slides.map(() => ({ hs: [], d: [] }))
      for (const step of stepTextsOf(lesson)) {
        const abs = join(outRoot, relFile(chapter.chapterId, lesson.pointId, step.slideIdx, step.stepIdx))
        const prevSlide = prevPoints[lesson.pointId]?.slides[step.slideIdx]
        const unchanged =
          !force &&
          prevSlide?.hs?.[step.stepIdx] === step.hash &&
          (prevSlide?.d?.[step.stepIdx] ?? 0) > 0 &&
          existsSync(abs)
        if (unchanged) {
          slides[step.slideIdx].hs[step.stepIdx] = step.hash
          slides[step.slideIdx].d[step.stepIdx] = prevSlide.d[step.stepIdx]
          skipped++
        } else {
          jobs.push({
            chapterId: chapter.chapterId,
            pointId: lesson.pointId,
            slideIdx: step.slideIdx,
            stepIdx: step.stepIdx,
            absPath: abs,
            text: step.text,
          })
        }
      }
      nextPoints[lesson.pointId] = { slides }
    }
    manifest.chapters[chapter.chapterId] = nextPoints
  }

  console.log(`待生成 ${jobs.length} 段${skipped ? `，未变化跳过 ${skipped} 段` : ''}（并发 ${CONCURRENCY}，语音 ${VOICE}）`)

  let done = 0
  const queue = [...jobs]
  const worker = async () => {
    for (;;) {
      const job = queue.shift()
      if (!job) return
      const rel = relFile(job.chapterId, job.pointId, job.slideIdx, job.stepIdx)
      try {
        mkdirSync(dirname(job.absPath), { recursive: true })
        const ms = synthesize(job.absPath, job.text)
        if (ms <= 0) throw new Error('生成了空音频')
        const slide = manifest.chapters[job.chapterId][job.pointId].slides[job.slideIdx]
        slide.hs[job.stepIdx] = createHash('sha1').update(job.text).digest('hex').slice(0, 12)
        slide.d[job.stepIdx] = ms
        generated++
      } catch (err) {
        failed++
        console.error(`  ! 失败 ${rel}：${(err as Error).message}`)
      }
      done++
      if (done % 50 === 0 || done === jobs.length) console.log(`  进度 ${done}/${jobs.length}（失败 ${failed}）`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  // 清理数据中已不存在的音频
  const keep = new Set<string>()
  for (const [chapterId, points] of Object.entries(manifest.chapters)) {
    for (const [pointId, meta] of Object.entries(points)) {
      meta.slides.forEach((s, i) => {
        s.d.forEach((ms, j) => {
          if (ms > 0) keep.add(relFile(chapterId, pointId, i, j))
        })
      })
    }
  }
  const lessonsOutDir = join(outRoot, 'lessons')
  if (existsSync(lessonsOutDir)) {
    let removed = 0
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        if (statSync(p).isDirectory()) {
          walk(p)
          if (!readdirSync(p).length) rmSync(p, { recursive: true })
          continue
        }
        const rel = relative(outRoot, p)
        if (rel.endsWith('.m4a') && !keep.has(rel)) {
          rmSync(p, { force: true })
          removed++
        }
      }
    }
    walk(lessonsOutDir)
    if (removed) console.log(`清理失效音频 ${removed} 个`)
  }

  manifest.generatedAt = new Date().toISOString()
  mkdirSync(outRoot, { recursive: true })
  writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8')

  rmSync(tmp, { recursive: true, force: true })
  const totalSec = Math.round(
    Object.values(manifest.chapters)
      .flatMap((ps) => Object.values(ps))
      .flatMap((m) => m.slides.flatMap((s) => s.d))
      .reduce((a, b) => a + b, 0) / 1000,
  )
  console.log(
    `完成：本次生成 ${generated} 段，跳过 ${skipped} 段，失败 ${failed} 段；讲解音频共约 ${Math.round(totalSec / 60)} 分钟 → ${relative(repoRoot, outRoot)}`,
  )
  if (failed) process.exit(2)
}

main()
