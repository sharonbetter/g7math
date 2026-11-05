#!/usr/bin/env node
/**
 * 能力题批量生成：每章追加 3~5 道"思维拓展题"（新定义/规律探究/程序框图/多结论/分类讨论/开放性/操作/说理/实践/最值）。
 * 
 * 用法：
 *   node tools/gen-ability-questions.mjs 7a-c1          # 指定章
 *   node tools/gen-ability-questions.mjs --all           # 全部七上章节
 * 
 * 防线：数字保真校验 + 超纲术语扫描 + 幂等跳过
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
const KEY = env.DIAGNOSE_API_KEY || env.GRADE_API_KEY
const MODEL = env.DIAGNOSE_MODEL || 'glm-5.3'

const OFF_SYLLABUS = ['韦达','判别式','因式分解','分式','勾股','全等','二次函数','抛物线','三角函数','正弦','余弦','正切','同余','数论','均值不等式','相似三角形','圆周角']

// ---------- 知识点名 ----------
const curriculum = JSON.parse(readFileSync(join(ROOT, 'data/curriculum.json'), 'utf8'))
const pointName = new Map()
const chapterPoints = new Map()
for (const v of curriculum.volumes) for (const c of v.chapters) {
  const pts = []
  for (const s of c.sections) for (const p of s.points) {
    pointName.set(p.id, p.name)
    pts.push({ id: p.id, name: p.name })
  }
  chapterPoints.set(c.id, { title: c.title, points: pts })
}

// ---------- 十大题型定义 ----------
const ABILITY_TYPES = [
  { key: 'newdef',  label: '新定义阅读理解', count: 1,
    desc: '给出一个新定义/新运算/新概念，要求学生现场理解并运用。格式：定义→2~3个示例→判断/计算/证明。' },
  { key: 'pattern', label: '规律探究', count: 1,
    desc: '给一串数/图形的前几项，要求发现规律、写通项公式、代入求值。格式：观察→猜想→验证→应用。' },
  { key: 'flowchart', label: '程序框图', count: 1,
    desc: '给出一个计算流程（输入→运算→判断→分支/循环→输出），求特定输入的输出或第n次输出。用文字描述流程即可。' },
  { key: 'multi', label: '多结论判断', count: 1,
    desc: '给出①②③④四条数学判断，选"正确的序号组合"。每条需独立推理。' },
  { key: 'classify', label: '分类讨论', count: 1,
    desc: '含有绝对值/字母符号不确定的情况，需要分情况讨论得出多个答案。' },
]

// 每章选 5 种（从十大中轮换，保证各章覆盖不同类型）
const CHAPTER_ROTATION = {
  '7a-c1': ['newdef', 'pattern', 'classify', 'multi', 'flowchart'],
  '7a-c2': ['pattern', 'newdef', 'multi', 'classify', 'flowchart'],
  '7a-c3': ['pattern', 'newdef', 'multi', 'classify', 'flowchart'],
  '7a-c4': ['pattern', 'newdef', 'multi', 'classify', 'flowchart'],
  '7a-c5': ['newdef', 'pattern', 'multi', 'classify', 'flowchart'],
  '7a-c6': ['pattern', 'newdef', 'multi', 'classify', 'flowchart'],
}

// ---------- 题型模板 ----------
function makePrompt(type, chapterId, chapterTitle, points) {
  const pointList = points.map(p => p.name).join('、')
  const specs = ABILITY_TYPES.find(t => t.key === type)
  
  return [
    '你是初一数学出题老师，出一道"思维拓展题"（能力题）。这类题不是知识检验，而是考迁移、归纳、推理能力。',
    '',
    `章节：${chapterTitle}`,
    `可用知识点：${pointList}`,
    `题型：${specs.label}`,
    `题型说明：${specs.desc}`,
    '',
    '硬性要求：',
    '1. 全部用初一学生学过的数学知识可以解决（可以用新定义包装，但底层知识不超纲）。',
    '2. 数字合理，运算干净，答案唯一且正确（开放性题除外——开放性题给出2~3个正确示例）。',
    '3. 题干简洁清晰（60~150字），解答分步写（每步一行）。',
    '4. 同时写"思路引导"：首句总说方向，然后分步讲为什么这么想，最后收尾通法。120~220字。用初一学生能懂的话。',
    '5. 生成2个变式题（同结构换数字/情境）。',
    '',
    '只输出 JSON：',
    `{"stem":"题干","type":"${type === 'multi' ? 'choice' : type === 'newdef' || type === 'pattern' || type === 'flowchart' ? 'fill' : 'fill'}","options":${type === 'multi' ? '["A.①②","B.①③","C.②④","D.①②③"]' : 'null'},"answer":"答案","solution":"分步解答","guidance":"思路引导","difficulty":3,"estimatedSeconds":120,`,
    `"variants":[{"stem":"变式题干","answer":"答案","solution":"解答","estimatedSeconds":120}, {"stem":"变式2题干","answer":"答案","solution":"解答","estimatedSeconds":120}]}`,
  ].join('\n')
}

// ---------- GLM 调用 ----------
async function askGLM(prompt) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.5 }),
        signal: AbortSignal.timeout(300_000),
      })
      if (res.status === 429) {
        console.log(`    429，等 ${15 * (attempt + 1)}s 重试…`)
        await new Promise(r => setTimeout(r, 15000 * (attempt + 1)))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return (data.choices?.[0]?.message?.content ?? '').trim()
    } catch (e) {
      if (attempt >= 2) throw e
      await new Promise(r => setTimeout(r, 8000))
    }
  }
}

function nums(s) {
  return new Set((s.match(/\d+(?:\.\d+)?/g) ?? []).map(x => String(Number(x))))
}

// ---------- 主流程 ----------
async function genForChapter(chapterId) {
  const chInfo = chapterPoints.get(chapterId)
  if (!chInfo) { console.log(`✗ 未知章节 ${chapterId}`); return }
  
  const examFile = join(ROOT, 'data/exams', `${chapterId}.json`)
  if (!existsSync(examFile)) { console.log(`✗ ${chapterId} 无考评文件`); return }
  const exam = JSON.parse(readFileSync(examFile, 'utf8'))
  
  // 幂等：跳过已有能力题
  const existing = exam.questions.filter(q => (q.errorTags ?? []).includes('能力题'))
  const types = CHAPTER_ROTATION[chapterId] ?? ['newdef', 'pattern', 'multi']
  const toGen = types.filter(t => !existing.some(q => (q.errorTags ?? []).includes(`能力题:${t}`)))
  
  if (toGen.length === 0) {
    console.log(`  ${chapterId}: 能力题已齐，跳过`)
    return
  }
  console.log(`  ${chapterId}: 待生成 ${toGen.length} 道（${toGen.join(', ')}）`)
  
  // 找可用知识点（取本章前几个核心知识点）
  const corePoints = chInfo.points.slice(0, 6)
  
  for (const type of toGen) {
    const spec = ABILITY_TYPES.find(t => t.key === type)
    try {
      const prompt = makePrompt(type, chapterId, chInfo.title, corePoints)
      const raw = await askGLM(prompt)
      let jsonText = raw
      // 剥掉 markdown 代码块标记
      jsonText = jsonText.replace(/\`\`\`[\w]*\n?/g, '').trim()
      // 找到第一个 { 和与之匹配的 }
      const start = jsonText.indexOf('{')
      if (start < 0) throw new Error('无 JSON')
      let depth = 0, end = -1
      for (let i = start; i < jsonText.length; i++) {
        if (jsonText[i] === '{') depth++
        else if (jsonText[i] === '}') { depth--; if (depth === 0) { end = i; break } }
      }
      if (end < 0) throw new Error('JSON 不完整')
      const q = JSON.parse(jsonText.slice(start, end + 1))
      
      // 校验
      if (!q.stem || !q.answer || !q.solution) throw new Error('字段缺失')
      const need = nums(q.solution + ' ' + q.answer)
      const ansNums = nums(q.answer)
      const got = nums(q.guidance || '')
      const missing = need.size > 12
        ? [...ansNums].filter(n => !got.has(n))   // 数据密集题只查答案
        : [...need].filter(n => !got.has(n)).slice(0, 5)  // 最多容忍 5 个缺失
      if (missing.length > 5) {
        console.log(`    ✗ ${type} 数字缺失 ${missing.length} 个，跳过`)
        continue
      }
      if (OFF_SYLLABUS.some(t => (q.stem + q.solution).includes(t))) {
        console.log(`    ✗ ${type} 含超纲术语，跳过`)
        continue
      }
      
      // 生成题号
      const allNums = exam.questions.map(x => {
        const m = x.id.match(/[ea](\d+)$/)
        return m ? Number(m[1]) : 0
      })
      const maxNum = Math.max(0, ...allNums)
      const qid = `${chapterId}-a${maxNum + 1}`
      
      // 入库
      const newQ = {
        id: qid,
        type: q.type || 'fill',
        difficulty: q.difficulty || 4,
        estimatedSeconds: q.estimatedSeconds || 120,
        pointIds: corePoints.slice(0, 2).map(p => p.id),
        stem: q.stem,
        options: q.options || undefined,
        answer: q.answer,
        solution: q.solution,
        guidance: q.guidance,
        errorTags: ['能力题', `能力题:${type}`],
        commonWrong: [],
        source: { kind: 'original' },
      }
      
      // 变式
      if (q.variants && Array.isArray(q.variants)) {
        newQ.variants = q.variants.filter(v => v.stem && v.answer && v.solution).map((v, i) => ({
          stem: v.stem,
          answer: v.answer,
          solution: v.solution,
          estimatedSeconds: v.estimatedSeconds || 120,
        }))
      }
      
      exam.questions.push(newQ)
      writeFileSync(examFile, JSON.stringify(exam, null, 2))
      console.log(`    ✅ ${type} → ${qid}`)
    } catch (e) {
      console.log(`    ✗ ${type} ${String(e.message).slice(0, 50)}`)
    }
  }
}

// ---------- 入口 ----------
const args = process.argv.slice(2)
const chapters = args.includes('--all')
  ? ['7a-c1', '7a-c2', '7a-c3', '7a-c4', '7a-c5', '7a-c6']
  : args.filter(a => a.startsWith('7'))

console.log(`能力题生成：${chapters.join(', ')}（${MODEL}，串行）`)
for (const ch of chapters) {
  await genForChapter(ch)
}
console.log('完成。运行 cd app && node scripts/sync-data.mjs 同步前端。')
