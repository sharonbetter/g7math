#!/usr/bin/env node
/**
 * 随堂检测自动生成：读课件全部关键内容，GLM 设计 3~5 道整体覆盖的检测题。
 *
 * 设计理念：一道题可以串多个概念（集合覆盖，不是逐条对齐）。
 * 校验：每道题标注 covers 数组，所有课件关键点至少被一道题覆盖。
 *
 * 用法：
 *   node tools/gen-check-questions.mjs 7a-c1          # 指定章
 *   node tools/gen-check-questions.mjs --all           # 全部七上
 *   node tools/gen-check-questions.mjs --validate      # 只校验覆盖率，不生成
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const line of readFileSync(join(ROOT, 'app/.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/)
  if (m && !line.startsWith('#')) env[m[1]] = m[2]
}
const BASE = env.DIAGNOSE_BASE_URL || env.GRADE_BASE_URL
const KEY = env.GRADE_API_KEY || env.DIAGNOSE_API_KEY
const MODEL = env.DIAGNOSE_MODEL || 'glm-5.3'

// ---------- 课件关键点提取 ----------
function extractKeyPoints(lesson) {
  const points = []
  for (const sl of lesson.slides) {
    if (sl.kind === 'concept') {
      // 取标题作为概念点
      const title = (sl.title || '').replace(/^情境引入：|^要点精讲：/, '').trim()
      if (title) points.push({ type: 'concept', label: title })
    }
    if (sl.kind === 'method') {
      const title = (sl.title || '').replace(/^方法提炼：/, '').trim()
      if (title) points.push({ type: 'method', label: title })
    }
    if (sl.kind === 'pitfall') {
      // 提取每个坑（按编号分行）
      const body = sl.body || sl.title || ''
      for (const line of body.split('\n')) {
        const m = line.match(/^\s*\d+[.、．]\s*(.{5,30})/)
        if (m) points.push({ type: 'pitfall', label: m.group ? m[1].trim() : m[1].trim() })
      }
    }
  }
  // 探究场景
  if (lesson.checkQuestions) {
    // 已有检测题中含探究主题的标记
    const hasExplore = lesson.checkQuestions.some(cq =>
      cq.question.includes('探究') || cq.question.includes('规律') || cq.question.includes('程序'))
    if (!hasExplore) points.push({ type: 'explore', label: '探究场景主题检测' })
  }
  return points
}

// ---------- GLM 生成 ----------
async function genCheckQuestions(lesson, keyPoints) {
  const chTitle = lesson.title || ''
  const pointList = keyPoints.map(p => `[${p.type}] ${p.label}`).join('\n')

  const prompt = [
    '你是初一数学老师，给刚学完这个知识点的学生设计随堂检测题。',
    '',
    `知识点：${lesson.title}`,
    '',
    '课件覆盖的关键内容如下：',
    pointList,
    '',
    '设计要求：',
    '1. 设计 3~5 道检测题，**整体覆盖**上述全部关键内容。',
    '2. 鼓励一道题串多个概念（如填空题"三要素是___、___、___"一题考三个概念）。',
    '3. 不要一个概念机械对应一道题——追求高效覆盖，像真正的老师出随堂检测一样。',
    '4. 题型可以混合：填空、选择、判断、简答。',
    '5. 每道题标注它检测了哪些关键点（covers 数组，引用上面 [type] label 中的 label）。',
    '6. 全部用初一学生能懂的话，数字合理，答案正确。',
    '7. 每道题附简短解析（explanation）。',
    '',
    '只输出 JSON 数组（不要 markdown 代码块）：',
    '[{"question":"题干","answer":"答案","explanation":"解析","covers":["概念1","概念2"]}]',
  ].join('\n')

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.4 }),
        signal: AbortSignal.timeout(300_000),
      })
      if (res.status === 429) {
        console.log(`    429，等 ${15 * (attempt + 1)}s…`)
        await new Promise(r => setTimeout(r, 15000 * (attempt + 1)))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const raw = (data.choices?.[0]?.message?.content || '').trim()

      // 剥掉 markdown
      let jsonText = raw.replace(/```[\w]*\n?/g, '').trim()
      const start = jsonText.indexOf('[')
      if (start < 0) throw new Error('无 JSON 数组')
      let depth = 0, end = -1
      for (let i = start; i < jsonText.length; i++) {
        if (jsonText[i] === '[') depth++
        else if (jsonText[i] === ']') { depth--; if (depth === 0) { end = i; break } }
      }
      if (end < 0) throw new Error('JSON 不完整')
      const questions = JSON.parse(jsonText.slice(start, end + 1))
      if (!Array.isArray(questions) || questions.length < 2) throw new Error('题目数不足')

      // 校验每道题有必要字段
      for (const q of questions) {
        if (!q.question || !q.answer) throw new Error('字段缺失')
      }
      return questions
    } catch (e) {
      if (attempt >= 2) throw e
      await new Promise(r => setTimeout(r, 8000))
    }
  }
}

// ---------- 覆盖率校验 ----------
function validateCoverage(questions, keyPoints) {
  const covered = new Set()
  for (const q of questions) {
    for (const c of (q.covers || [])) covered.add(c)
    // 也用 question 文本模糊匹配
    for (const kp of keyPoints) {
      if (q.question.includes(kp.label.slice(0, 5)) || (q.explanation || '').includes(kp.label.slice(0, 5))) {
        covered.add(kp.label)
      }
    }
  }
  const uncovered = keyPoints.filter(kp => !covered.has(kp.label))
  return { total: keyPoints.length, covered: keyPoints.length - uncovered.length, uncovered: uncovered.map(k => k.label) }
}

// ---------- 主流程 ----------
async function processChapter(chapterId) {
  const lessonFile = join(ROOT, 'data/lessons', `${chapterId}.json`)
  if (!existsSync(lessonFile)) { console.log(`✗ ${chapterId} 文件不存在`); return }

  const lessons = JSON.parse(readFileSync(lessonFile, 'utf8'))
  let generated = 0, skipped = 0, validated = 0

  for (const lesson of lessons.lessons) {
    const pid = lesson.pointId
    const keyPoints = extractKeyPoints(lesson)

    if (keyPoints.length === 0) { skipped++; continue }

    // --validate 模式：只校验现有题的覆盖率
    if (process.argv.includes('--validate')) {
      const existing = lesson.checkQuestions || []
      const result = validateCoverage(existing, keyPoints)
      if (result.uncovered.length > 0) {
        console.log(`  ⚠️ ${pid}: ${result.covered}/${result.total} 覆盖，缺: ${result.uncovered.slice(0, 3).join('、')}`)
      } else {
        validated++
      }
      continue
    }

    // 生成模式：追加新题（幂等：如果已有足够题且覆盖就跳过）
    const existing = lesson.checkQuestions || []
    const existingCoverage = validateCoverage(existing, keyPoints)
    if (existing.length >= 3 && existingCoverage.uncovered.length === 0) {
      skipped++
      continue
    }

    // 有未覆盖的概念 → 生成新题
    try {
      console.log(`  ${pid}: ${existingCoverage.covered}/${existingCoverage.total} 覆盖，生成中…`)
      const newQuestions = await genCheckQuestions(lesson, keyPoints)

      // 校验新题覆盖
      const coverage = validateCoverage(newQuestions, keyPoints)
      console.log(`    生成 ${newQuestions.length} 题，覆盖 ${coverage.covered}/${coverage.total}`)
      if (coverage.uncovered.length > 0) {
        console.log(`    未覆盖: ${coverage.uncovered.join('、')}`)
      }

      // 替换（不是追加——新题设计为整体覆盖，旧题可能冗余）
      lesson.checkQuestions = newQuestions.map(q => ({
        question: q.question,
        answer: q.answer,
        explanation: q.explanation || '',
        covers: q.covers || [],
      }))
      generated++
    } catch (e) {
      console.log(`    ✗ ${e.message.slice(0, 50)}`)
    }
  }

  if (!process.argv.includes('--validate')) {
    writeFileSync(lessonFile, JSON.stringify(lessons, null, 2))
  }
  console.log(`  ${chapterId}: 生成 ${generated} · 已覆盖跳过 ${skipped} · 校验通过 ${validated}`)
}

// ---------- 入口 ----------
const args = process.argv.slice(2)
const chapters = args.includes('--all')
  ? ['7a-c1', '7a-c2', '7a-c3', '7a-c4', '7a-c5', '7a-c6']
  : args.filter(a => a.startsWith('7'))

console.log(`随堂检测${args.includes('--validate') ? '覆盖校验' : '生成'}：${chapters.join(', ')}`)
for (const ch of chapters) {
  await processChapter(ch)
}
if (!args.includes('--validate')) {
  console.log('\n运行 cd app && node scripts/sync-data.mjs 同步前端')
}
