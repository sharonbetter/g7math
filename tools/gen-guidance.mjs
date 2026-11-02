#!/usr/bin/env node
/**
 * 错题「思路引导」批量生成（写入 data/exams/*.json 的 guidance 字段）。
 *
 * 模式：
 *   node tools/gen-guidance.mjs --main               # ① 全部主卷题（264）
 *   node tools/gen-guidance.mjs --variants           # ② 全部静态变式（406）
 *   node tools/gen-guidance.mjs --all                # ①+②
 *   node tools/gen-guidance.mjs --chapter 7a-c2      # 指定章（主卷+变式）
 *   node tools/gen-guidance.mjs 7a-c2-e11 ...        # 指定题号（及其变式）
 *
 * 防线：
 *   1. 数字保留校验：题解里的全部数字必须出现在引导中（防编造/丢步）
 *   2. 超纲术语扫描（程序化，同考评清查清单）
 *   3. 失败重试（429/网络退避），仍失败跳过不写入（前端回退模板版）
 *   幂等：已有 guidance 的条目自动跳过，可安全重跑续传。
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const line of readFileSync(join(ROOT, 'app/.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/)
  if (m && !line.startsWith('#')) env[m[1]] = m[2]
}
const BASE = env.DIAGNOSE_BASE_URL || env.GRADE_BASE_URL
const KEY = env.DIAGNOSE_API_KEY || env.GRADE_API_KEY
const MODEL = env.DIAGNOSE_MODEL || 'glm-5.3'

const STYLE_SAMPLE = `这道题在考察有理数的加减混合运算和符号处理，同时也在考察计算过程中数学观察和基础能力的灵活运用。
1.看到这类大数运算先别慌，先尝试找规律，看是否能巧算。认真观察可以发现，78×(-321) - 78×679之间存在公因数78，322×321+679×322之间存在公因数322。
2.大数计算一次加减法的计算量要远小于乘除法，所以我们通过加法交换律，乘法提取公因式把计算式变成78×(-321-679)+322×(321+679)，这样乘法计算从4次降到了2次。
3.进一步计算结果 = -78000+322000=244000。
当然，这个题还有另一种计算方法，把321、679分别作为公因式提取出来，但基本的思路和数学原理应用没变。`

const OFF_SYLLABUS = ['韦达','判别式','因式分解','分式','勾股','全等','二次函数','抛物线','三角函数','正弦','余弦','正切','同余','数论','均值不等式','相似三角形','圆周角','乘法公式','平方差公式','完全平方公式']

const curriculum = JSON.parse(readFileSync(join(ROOT, 'data/curriculum.json'), 'utf8'))
const pointName = new Map()
for (const v of curriculum.volumes) for (const c of v.chapters) for (const s of c.sections) for (const p of s.points) pointName.set(p.id, p.name)

function nums(s) {
  return new Set((s.match(/\d+(?:\.\d+)?/g) ?? []).map((x) => String(Number(x))))
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function askGLM(prompt) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.3 }),
        signal: AbortSignal.timeout(300_000),
      })
      if (res.status === 429 && attempt < 4) {
        await sleep(20000 * (attempt + 1))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const text = (data.choices?.[0]?.message?.content ?? '').trim()
      if (!text) throw new Error('空回复')
      return text
    } catch (e) {
      if (attempt >= 2) throw e
      await sleep(8000)
    }
  }
}

async function genGuidance({ stem, answer, solution, pointNames, chapterTitle }) {
  const prompt = [
    '你是初一数学老师，给做错题的学生写"思路引导"——不是给解答，而是引导他怎么想这类题。',
    '',
    '写作结构（严格遵守）：',
    '第一句：总说这道题在考察什么（知识点 + 能力层面），以及遇到这类题往哪个方向思考。',
    '然后分步（1. 2. 3.）：每步先说"为什么这么想/策略是什么"，再给具体的观察和演算。策略口诀要前置，并讲清原理。',
    '最后一句收尾：指出别的解法或这一类题的通用思路。',
    '',
    '硬性要求：',
    '1. 全部用初一学生学过的说法，禁止超纲术语。',
    `2. 解答里的每一个数字都必须出现在你的文本里（可以新增中间结果），不得改动数字。`,
    '3. 语气像老师在旁边引导，多讲"为什么"。',
    '4. 长度 120~220 字，直接输出正文（不要标题、不要 markdown、不要"解："）。',
    '',
    '标准样例（另一种题），输出必须与它同一风格：',
    '---样例---',
    STYLE_SAMPLE,
    '---样例结束---',
    '',
    `现在写这道题（章节：${chapterTitle}）：`,
    `考点知识点：${pointNames || '（未挂知识点）'}`,
    `题目：${stem}`,
    `正确答案：${answer}`,
    `标准解答：${solution}`,
  ].join('\n')
  return askGLM(prompt)
}

// ---------- 目标收集 ----------
const args = process.argv.slice(2)
const tasks = [] // {file, qid, where: 'main'|'v{n}', stem, answer, solution, pointNames, chapterTitle, chapterId}

const examsDir = join(ROOT, 'data/exams')
const files = readdirSync(examsDir).filter((f) => f.endsWith('.json')).sort()
const wantMain = args.includes('--all') || args.includes('--main') || args.includes('--chapter') || (!args.length && false) || args.some((a) => /^7[ab]-.+e\d+$/.test(a))
const wantVariants = args.includes('--all') || args.includes('--variants') || args.includes('--chapter')

for (const f of files) {
  const chapterId = f.replace('.json', '')
  const filePath = join(examsDir, f)
  const d = JSON.parse(readFileSync(filePath, 'utf8'))
  const chapterTitle = d.chapterTitle || chapterId
  const chFilter = args.includes('--chapter') ? args[args.indexOf('--chapter') + 1] : null
  if (chFilter && chapterId !== chFilter) continue
  for (const q of d.questions) {
    const idHit = args.some((a) => a === q.id)
    const inScope = chFilter || args.includes('--all') || args.includes('--main') || idHit
    if (inScope && !q.guidance) {
      tasks.push({
        file: filePath, qid: q.id, where: 'main', field: null,
        stem: q.stem, answer: q.answer, solution: q.solution,
        pointNames: q.pointIds.map((id) => pointName.get(id)).filter(Boolean).join('、'),
        chapterTitle, chapterId,
      })
    }
    const vScope = chFilter || args.includes('--all') || args.includes('--variants') || idHit
    if (vScope) {
      ;(q.variants ?? []).forEach((v, i) => {
        if (!v.guidance) {
          tasks.push({
            file: filePath, qid: q.id, where: `v${i + 1}`, field: ['variants', i],
            stem: v.stem, answer: v.answer, solution: v.solution,
            pointNames: q.pointIds.map((id) => pointName.get(id)).filter(Boolean).join('、'),
            chapterTitle, chapterId,
          })
        }
      })
    }
  }
}

console.log(`待生成 ${tasks.length} 条（${MODEL}，并发 2）`)
if (!tasks.length) process.exit(0)

// ---------- 并发执行 ----------
const t0 = Date.now()
let done = 0, ok = 0, fail = 0
const queue = [...tasks]

async function writeBack(task, text) {
  const d = JSON.parse(readFileSync(task.file, 'utf8'))
  const q = d.questions.find((x) => x.id === task.qid)
  if (!q) return
  if (task.where === 'main') q.guidance = text
  else q.variants[task.field[1]].guidance = text
  writeFileSync(task.file, JSON.stringify(d, null, 2))
}

async function worker() {
  for (;;) {
    const task = queue.shift()
    if (!task) return
    const label = `${task.qid}${task.where === 'main' ? '' : '-' + task.where}`
    try {
      const text = await genGuidance(task)
      // 防线1：数字保留（数据密集题解答含大量数据点时，只要求答案数字出现）
      const need = nums(task.solution + ' ' + task.answer)
      const got = nums(text)
      const ansNums = nums(task.answer)
      const missing =
        need.size > 12
          ? [...ansNums].filter((n) => !got.has(n))
          : [...need].filter((n) => !got.has(n))
      if (missing.length) {
        console.log(`  ✗ ${label} 数字缺失 ${missing.join(',')}，跳过`)
        fail++
      } else if (OFF_SYLLABUS.some((t) => text.includes(t))) {
        console.log(`  ✗ ${label} 含超纲术语，跳过`)
        fail++
      } else {
        await writeBack(task, text)
        ok++
      }
    } catch (e) {
      console.log(`  ✗ ${label} ${String(e.message).slice(0, 50)}`)
      fail++
    }
    done++
    if (done % 10 === 0 || done === tasks.length) {
      const el = (Date.now() - t0) / 1000
      const eta = ((tasks.length - done) * (el / done) / 60).toFixed(1)
      console.log(`  进度 ${done}/${tasks.length}（成功 ${ok} 失败 ${fail}）· 已用 ${(el / 60).toFixed(1)} 分 · 预计剩余 ${eta} 分`)
    }
  }
}

await Promise.all([worker(), worker()])
console.log(`\n完成：成功 ${ok}，失败/跳过 ${fail}（重跑可续传）`)
console.log('提示：生成后需运行  cd app && node scripts/sync-data.mjs  同步到前端')
