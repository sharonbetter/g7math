import { useEffect, useState } from 'react'
import type {
  AudioManifest,
  BookIndex,
  CalcBook,
  Chapter,
  Curriculum,
  Exam,
  LessonFile,
  Point,
  Section,
  Volume,
} from '../types'

const BASE = `${import.meta.env.BASE_URL}data`

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/${path}`)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

// ---------- 大纲 ----------
export function useCurriculum() {
  const [data, setData] = useState<Curriculum | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    getJson<Curriculum>('curriculum.json').then((c) => {
      if (c) setData(c)
      else setError('未能加载课程大纲数据')
    })
  }, [])
  return { curriculum: data, error }
}

export function allChapters(curriculum: Curriculum | null): { volume: Volume; chapter: Chapter }[] {
  if (!curriculum) return []
  return curriculum.volumes.flatMap((v) => v.chapters.map((c) => ({ volume: v, chapter: c })))
}

export function allPoints(curriculum: Curriculum | null): Map<string, Point> {
  const map = new Map<string, Point>()
  if (!curriculum) return map
  for (const v of curriculum.volumes)
    for (const c of v.chapters)
      for (const s of c.sections) for (const p of s.points) map.set(p.id, p)
  return map
}

export function pointMapOf(chapter: Chapter): Map<string, Point> {
  const map = new Map<string, Point>()
  for (const s of chapter.sections) for (const p of s.points) map.set(p.id, p)
  return map
}

// ---------- 课件 ----------
export async function loadLessonFile(chapterId: string): Promise<LessonFile | null> {
  return getJson<LessonFile>(`lessons/${chapterId}.json`)
}

export function useLessonFile(chapterId: string | undefined) {
  const [data, setData] = useState<LessonFile | null>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    setData(null)
    setMissing(false)
    if (!chapterId) return
    let alive = true
    loadLessonFile(chapterId).then((f) => {
      if (!alive) return
      if (f) setData(f)
      else setMissing(true)
    })
    return () => {
      alive = false
    }
  }, [chapterId])
  return { lessonFile: data, missing }
}

// ---------- 题库 ----------
export async function loadExam(chapterId: string): Promise<Exam | null> {
  return getJson<Exam>(`exams/${chapterId}.json`)
}

interface Manifest {
  chaptersWithLessons: string[]
  chaptersWithExams: string[]
}

/** 载入全部已生成的考评卷（用于跨章专项强化） */
/** 思路引导实时索引：轮次快照可能早于引导批量生成，渲染时按 id/题干回填最新引导 */
export interface GuidanceIndex {
  byId: Map<string, string>
  byStem: Map<string, string>
}

let guidanceIndexPromise: Promise<GuidanceIndex> | null = null

export function loadGuidanceIndex(): Promise<GuidanceIndex> {
  guidanceIndexPromise ??= loadAllExams().then((all) => {
    const byId = new Map<string, string>()
    const byStem = new Map<string, string>()
    for (const ex of all.values()) {
      for (const q of ex.questions) {
        if (q.guidance) {
          byId.set(q.id, q.guidance)
          byStem.set(q.stem, q.guidance)
        }
        for (const v of q.variants ?? []) {
          if (v.guidance) byStem.set(v.stem, v.guidance)
        }
      }
    }
    return { byId, byStem }
  })
  return guidanceIndexPromise
}

export async function loadAllExams(): Promise<Map<string, Exam>> {
  const map = new Map<string, Exam>()
  const manifest = await getJson<Manifest>('manifest.json')
  const ids = manifest?.chaptersWithExams ?? []
  await Promise.all(
    ids.map(async (id) => {
      const e = await loadExam(id)
      if (e) map.set(e.id, e)
    }),
  )
  return map
}

export async function loadManifest(): Promise<Manifest | null> {
  return getJson<Manifest>('manifest.json')
}

export function useExam(chapterId: string | undefined) {
  const [data, setData] = useState<Exam | null>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    setData(null)
    setMissing(false)
    if (!chapterId) return
    let alive = true
    loadExam(chapterId).then((e) => {
      if (!alive) return
      if (e) setData(e)
      else setMissing(true)
    })
    return () => {
      alive = false
    }
  }, [chapterId])
  return { exam: data, missing }
}

// ---------- 计算专项 ----------
export function useCalcBook() {
  const [data, setData] = useState<CalcBook | null>(null)
  useEffect(() => {
    let alive = true
    getJson<CalcBook>('calc/trainings.json').then((b) => {
      if (alive && b) setData(b)
    })
    return () => {
      alive = false
    }
  }, [])
  return data
}

// ---------- 课件讲解音频 ----------
const AUDIO_BASE = `${import.meta.env.BASE_URL}audio`
let audioManifestPromise: Promise<AudioManifest | null> | null = null

export function loadAudioManifest(): Promise<AudioManifest | null> {
  if (!audioManifestPromise) {
    audioManifestPromise = fetch(`${AUDIO_BASE}/manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<AudioManifest>) : null))
      .catch(() => null)
  }
  return audioManifestPromise
}

/** 某个知识点每个课件页、每个讲解步的音频时长（ms）；null 表示未生成（回退浏览器语音） */
export function useLessonAudio(chapterId: string | undefined, pointId: string | undefined) {
  const [audio, setAudio] = useState<number[][] | null>(null)
  useEffect(() => {
    setAudio(null)
    if (!chapterId || !pointId) return
    let alive = true
    loadAudioManifest().then((m) => {
      if (!alive) return
      const slides = m?.chapters[chapterId]?.[pointId]?.slides
      if (!slides) return
      setAudio(slides.map((s) => s.d.map((ms) => ms)))
    })
    return () => {
      alive = false
    }
  }, [chapterId, pointId])
  return audio
}

export function lessonAudioUrl(chapterId: string, pointId: string, slideIdx: number, stepIdx: number): string {
  return `${AUDIO_BASE}/lessons/${chapterId}/${pointId}-${slideIdx}-${stepIdx}.mp3`
}

// ---------- 动画课件（public/demo/*.html，嵌入式播放） ----------
let animatedLessonsPromise: Promise<string[]> | null = null

/** 已生成动画课件的知识点 id 列表（demo/manifest.json，由 sync-data 维护）；null = 加载中 */
export function useAnimatedLessons(): string[] | null {
  const [list, setList] = useState<string[] | null>(null)
  useEffect(() => {
    animatedLessonsPromise ??= fetch(`${import.meta.env.BASE_URL}demo/manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<{ animatedLessons: string[] }>) : { animatedLessons: [] }))
      .then((m) => m.animatedLessons ?? [])
      .catch(() => [] as string[])
    animatedLessonsPromise.then(setList)
  }, [])
  return list
}

// ---------- 书籍索引 ----------
export function useBookIndex() {
  const [data, setData] = useState<BookIndex | null>(null)
  useEffect(() => {
    getJson<BookIndex>('book-index.json').then(setData)
  }, [])
  return data
}

export function useTextFile(path: string | undefined) {
  const [text, setText] = useState<string>('')
  useEffect(() => {
    setText('')
    if (!path) return
    let alive = true
    fetch(`${BASE}/${path}`)
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => {
        if (alive) setText(t)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [path])
  return text
}

export function bookPageImage(pdfPage: number): string {
  const name = `page_${String(pdfPage).padStart(4, '0')}.jpg`
  return `${BASE}/book-pages/${name}`
}

/** 汇总某章的全部知识点 */
export function chapterPointIds(chapter: Chapter): string[] {
  return chapter.sections.flatMap((s: Section) => s.points.map((p) => p.id))
}
