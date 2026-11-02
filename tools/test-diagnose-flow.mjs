/**
 * 端到端测试：错因诊断闭环（规则 → 模型兜底 → 薄弱点聚合 → 定向专练组卷）
 * 运行：node tools/test-diagnose-flow.mjs
 * 依赖：dev server 已启动（/api/diagnose），data/calc/trainings.json 已生成
 */
import { readFileSync } from 'node:fs'
import { answersMatch } from '../app/src/lib/answers.ts'

const book = JSON.parse(readFileSync('app/public/data/calc/trainings.json', 'utf8'))
const skills = book.skillNames

const findT = (no) => book.trainings.find((t) => t.no === no)

// ---------- 模拟前端批改单题（CalcRun 的真实逻辑） ----------
function gradeOne(q, userAnswer) {
  const user = userAnswer ?? ''
  const wrong = !user.trim() || !answersMatch(user, q.answer, q.acceptedAnswers)
  if (!wrong) return { wrong: false, hit: 'none' }
  const hit = (q.commonWrong ?? []).find((c) => answersMatch(user, c.answer))
  if (hit) return { wrong: true, hit: 'rule', reason: hit.reason, skill: hit.skill }
  return { wrong: true, hit: 'model' }
}

async function diagnose(q, userAnswer) {
  const res = await fetch('http://127.0.0.1:5273/api/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stem: q.stem, standardAnswer: q.answer, userAnswer, skills }),
  })
  if (!res.ok) return null
  return res.json()
}

/** 把 -2<x<3 反转为 -2>x>3（方向答错的典型形态） */
function flipDir(ans) {
  return ans.replace(/[<>]/g, (m) => (m === '<' ? '>' : '<'))
}

// ---------- 测试用例 ----------
const t3 = findT(3), t1 = findT(1), t43 = findT(43), t63 = findT(63), t86 = findT(86)
const cases = [
  { label: 'A 分数加法·答出未通分的结果', q: t3.questions[0], user: t3.questions[0].commonWrong[0].answer, expect: '规则' },
  { label: 'B 分数加法·答无关值', q: t3.questions[0], user: '7', expect: '模型' },
  { label: 'C 整数加法·答相反数', q: t1.questions[0], user: '-' + t1.questions[0].answer, expect: '模型' },
  { label: 'D 去括号方程·答括号内的值', q: t43.questions[0], user: 'x=2', expect: '模型' },
  { label: 'E 方程组·两解都差符号', q: t63.questions[0], user: 'x=9,y=-1', expect: '模型' },
  { label: 'F 不等式组·方向答反', q: t86.questions[0], user: flipDir(t86.questions[0].answer), expect: '规则' },
  { label: 'G 答对（对照组）', q: t1.questions[0], user: t1.questions[0].answer, expect: '无诊断' },
]

console.log('════════ 第一步：批改分流与诊断 ════════')
const attemptItems = [] // 模拟写入 calcAttempts 的 items
for (const c of cases) {
  const g = gradeOne(c.q, c.user)
  const line = `${c.label}\n  题：${c.q.stem.slice(0, 52)}…\n  正确：${c.q.answer}｜学生答：${c.user}`
  if (!g.wrong) {
    console.log(`${line}\n  → 判定：正确（无诊断）`)
    attemptItems.push({ no: 1, stem: c.q.stem, userAnswer: c.user, answer: c.q.answer, correct: true, slow: false, ms: 0, est: 60 })
    continue
  }
  if (g.hit === 'rule') {
    console.log(`${line}\n  → 走【固定规则】（毫秒）：错因「${g.reason}」｜技能 ${g.skill}`)
    attemptItems.push({ no: 1, stem: c.q.stem, userAnswer: c.user, answer: c.q.answer, correct: false, slow: false, ms: 0, est: 60, errorTag: g.reason, skill: g.skill })
  } else {
    const t0 = Date.now()
    const d = await diagnose(c.q, c.user)
    const dt = ((Date.now() - t0) / 1000).toFixed(1)
    if (d) {
      console.log(`${line}\n  → 走【GLM 模型】（${dt}s）：错因「${d.reason}」｜技能 ${d.skill}`)
      attemptItems.push({ no: 1, stem: c.q.stem, userAnswer: c.user, answer: c.q.answer, correct: false, slow: false, ms: 0, est: 60, errorTag: d.reason, skill: d.skill === 'other' ? null : d.skill })
    } else {
      console.log(`${line}\n  → 模型不可用，兜底文案`)
    }
  }
  console.log()
}

// ---------- 模拟薄弱点聚合（CalcList.useWeakSkills 的真实逻辑） ----------
console.log('════════ 第二步：薄弱点聚合 ════════')
const agg = new Map()
for (const it of attemptItems) {
  if (it.correct || !it.skill) continue
  agg.set(it.skill, (agg.get(it.skill) ?? 0) + 1)
}
const weak = [...agg.entries()].sort((a, b) => b[1] - a[1])
for (const [k, n] of weak) console.log(`  ${skills[k] ?? k} ×${n}`)
if (!weak.length) console.log('  （无）')

// ---------- 第四步：错题的同类型变式（CalcRun.buildRound 的真实轮换逻辑） ----------
console.log('\n════════ 第四步：错题 → 训练内变式专项练习 ════════')
const problemIdxs = [] // 模拟批改后收集的错题下标（第一轮主卷）
for (const c of cases) {
  const g = gradeOne(c.q, c.user)
  if (!g.wrong) continue
  const t = book.trainings.find((x) => x.questions.includes(c.q))
  if (!t) continue
  problemIdxs.push(t.questions.indexOf(c.q))
  const variants = c.q.variants ?? []
  console.log(`\n▶ 错题（第${t.no}练 ${t.title}）：${c.q.stem.slice(0, 50)}…  [${c.q.answer}]`)
  variants.forEach((v, i) =>
    console.log(`   专项第${i + 1}轮变式：${v.stem.slice(0, 50)}…  [${v.answer}]`),
  )
}
// 模拟轮换：第1轮取 variant[0]、第2轮 variant[1]……
const round1 = problemIdxs.map((qi, k) => {
  const q = t3.questions[qi >= 0 && qi < t3.questions.length ? qi : 0]
  return q
})
console.log(`\n（若第1轮仍有错，第2轮自动换用 variant[1]，第3轮 variant[2]，之后循环复用）`)

// ---------- 模拟定向专练组卷（CalcWeak 的选题逻辑） ----------
console.log('\n════════ 第三步：定向专练组卷 ════════')
for (const [skill, n] of weak.slice(0, 2)) {
  const pool = book.skillPools[skill] ?? []
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, 8)
  console.log(`\n▶ 薄弱点「${skills[skill]}」（错 ${n} 次）→ 专练卷 ${picked.length} 题（题池 ${pool.length}）：`)
  for (const [i, q] of picked.entries()) console.log(`  ${i + 1}. ${q.stem.slice(0, 56)}  [${q.answer}]`)
}
