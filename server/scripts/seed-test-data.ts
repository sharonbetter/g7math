/**
 * 给测试账号灌一套丰富的学习数据（直接写 user_data，登录后自动拉到本机）：
 *
 *   - 第 1~6 关（7a-c1..c6）：已通关（loops=mastered，门开），知识点全部学完、大半闪耀
 *   - 第 7 关（7b-c7）：进行中——学了一半知识点、打了一轮考评（含错题与慢题）、采了 1 颗能量石
 *   - 第 8~12 关：未解锁
 *   - 能量石余额 328；第 2~6 关路径宝石已采集；全部装备已拥有并穿戴顶级三件
 *   - 计算专项：第 1~5 章训练全部通过，第 6 章过半
 *
 * 用法：npm run seed-test-data -- [手机号]（默认 13900000001 管理员测试账号）
 * 注意：会覆盖该账号云端学习数据。
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, findUserByPhone } from '../src/db'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const phone = process.argv[2] || '13900000001'
const user = findUserByPhone(phone)
if (!user) {
  console.error(`手机号 ${phone} 未注册，先 npm run create-admin -- 或走注册流程`)
  process.exit(1)
}

const curriculum = JSON.parse(readFileSync(join(ROOT, 'data', 'curriculum.json'), 'utf8'))
const trainings = JSON.parse(readFileSync(join(ROOT, 'data', 'calc', 'trainings.json'), 'utf8'))
const examC1 = JSON.parse(readFileSync(join(ROOT, 'data', 'exams', '7a-c1.json'), 'utf8'))
const examC7 = JSON.parse(readFileSync(join(ROOT, 'data', 'exams', '7b-c7.json'), 'utf8'))

const chapters = curriculum.volumes.flatMap((v) => v.chapters)
const pointsOf = (ch) => ch.sections.flatMap((s) => s.points)
const DAY = 86_400_000
const now = Date.now()
const studied = {}
const perfected = {}
const loops = {}
const gems = {}
const calcDone = {}
const rounds = {}
let t = now - 32 * DAY // 时间线从 32 天前推进

// ---------- 第 1~6 关：通关 ----------
const mastered = chapters.slice(0, 6)
mastered.forEach((ch, ci) => {
  const pts = pointsOf(ch)
  pts.forEach((p, pi) => {
    studied[p.id] = t
    if (pi % 2 === 0) perfected[p.id] = t // 约半数闪耀
    t += 40 * 60_000
  })
  loops[ch.id] = {
    chapterId: ch.id,
    chapterTitle: ch.title,
    round: 2,
    status: 'mastered',
    roundIds: [`r-seed-${ch.id}`],
    weakPointIds: [],
    updatedAt: t,
  }
  t += DAY
  // 路径宝石（第 1 章无计算题、无宝石）
  for (let g = 1; g <= 3; g++) gems[`gem-${ci + 1}-${g}`] = [11, 17, 14][g - 1]
})

// 第 1 关补一轮完美考评（报告历史 + 完美判定）
{
  const ch = mastered[0]
  const qs = examC1.questions
  let at = t - 26 * DAY
  const answers = qs.map((q, i) => {
    const dur = Math.round(q.estimatedSeconds * 1000 * (0.5 + (i % 5) * 0.08))
    const rec = {
      questionId: q.id,
      type: q.type,
      startedAt: at,
      submittedAt: at + dur,
      durationMs: dur,
      value: q.answer,
      revisitMs: 0,
      revisitCount: 0,
      correct: true,
      score: q.type === 'choice' || q.type === 'fill' ? 1 : 4,
      errorTags: [],
      errorReason: '',
      index: i,
    }
    at += dur + 3000
    return rec
  })
  rounds[`r-seed-${ch.id}`] = {
    id: `r-seed-${ch.id}`,
    kind: 'exam',
    round: 1,
    chapterId: ch.id,
    chapterTitle: examC1.chapterTitle ?? ch.title,
    title: examC1.title ?? ch.title,
    examId: examC1.id,
    startedAt: now - 26 * DAY,
    finishedAt: at,
    totalMs: at - (now - 26 * DAY),
    answers,
    wrongQuestionIds: [],
    slowQuestionIds: [],
    weakPointIds: [],
    exam: examC1,
  }
}

// ---------- 第 7 关：进行中 ----------
{
  const ch = chapters[6]
  const pts = pointsOf(ch)
  const half = Math.ceil(pts.length / 2)
  pts.slice(0, half).forEach((p) => {
    studied[p.id] = t
    t += 40 * 60_000
  })
  // 一轮有输有慢的考评：错 4 题（含两道计算）、慢 2 题
  const wrongIdx = new Set([3, 9, 14, 18])
  const slowIdx = new Set([6, 12])
  const qs = examC7.questions
  let at = now - 2 * DAY
  const answers = qs.map((q, i) => {
    const slow = slowIdx.has(i)
    const wrong = wrongIdx.has(i)
    const dur = Math.round(q.estimatedSeconds * 1000 * (slow ? 1.9 : wrong ? 1.3 : 0.55 + (i % 5) * 0.08))
    const rec = {
      questionId: q.id,
      type: q.type,
      startedAt: at,
      submittedAt: at + dur,
      durationMs: dur,
      value: wrong ? (q.type === 'choice' ? (q.answer === 'A' ? 'B' : 'A') : '-3') : q.answer,
      revisitMs: slow ? 45_000 : 0,
      revisitCount: slow ? 2 : 0,
      correct: !wrong,
      score: wrong ? (q.type === 'calc' || q.type === 'applied' ? 1 : 0) : q.type === 'choice' || q.type === 'fill' ? 1 : 4,
      errorTags: wrong ? (q.type === 'calc' ? ['符号处理'] : ['概念不清']) : [],
      errorReason: wrong ? (q.type === 'calc' ? '去括号时符号处理错误' : '概念理解偏差') : '',
      index: i,
    }
    at += dur + 3000
    return rec
  })
  const wrongQs = qs.filter((_, i) => wrongIdx.has(i))
  rounds['r-seed-7b-c7'] = {
    id: 'r-seed-7b-c7',
    kind: 'exam',
    round: 1,
    chapterId: ch.id,
    chapterTitle: examC7.chapterTitle ?? ch.title,
    title: examC7.title ?? ch.title,
    examId: examC7.id,
    startedAt: now - 2 * DAY,
    finishedAt: at,
    totalMs: at - (now - 2 * DAY),
    answers,
    wrongQuestionIds: wrongQs.map((q) => q.id),
    slowQuestionIds: qs.filter((_, i) => slowIdx.has(i)).map((q) => q.id),
    weakPointIds: [...new Set(wrongQs.flatMap((q) => q.pointIds ?? []))],
    exam: examC7,
  }
  loops[ch.id] = {
    chapterId: ch.id,
    chapterTitle: ch.title,
    round: 1,
    status: 'exam',
    roundIds: ['r-seed-7b-c7'],
    weakPointIds: [...new Set(wrongQs.flatMap((q) => q.pointIds ?? []))],
    updatedAt: now - 2 * DAY,
  }
  gems['gem-7-1'] = 9
}

// ---------- 计算专项：第 1~5 章全过，第 6 章过半 ----------
trainings.trainings.forEach((tr) => {
  const lv = parseInt((tr.chapterId.split('c')[1] ?? '0').replace(/\D/g, ''), 10) || 0
  if (lv <= 5) {
    calcDone[tr.id] = {
      best: tr.questions.length,
      total: tr.questions.length,
      doneAt: now - (13 - lv) * DAY,
      count: 1,
      passed: true,
      passRounds: 1,
    }
  } else if (lv === 6 && Math.abs(tr.id.length * 7 + tr.id.charCodeAt(3)) % 2 === 0) {
    calcDone[tr.id] = {
      best: tr.questions.length,
      total: tr.questions.length,
      doneAt: now - 7 * DAY,
      count: 2,
      passed: true,
      passRounds: 2,
    }
  }
})

const data = {
  rounds,
  loops,
  studied,
  perfected,
  energy: 328,
  gems,
  outfits: {
    owned: ['hat-straw', 'hat-beret', 'hat-wizard', 'hat-crown', 'shoes-cloth', 'shoes-sport', 'shoes-rocket', 'cloth-scarf', 'cloth-cape', 'cloth-armor'],
    hat: 'hat-crown',
    shoes: 'shoes-rocket',
    clothes: 'cloth-cape',
  },
  calcDone,
  calcAttempts: {},
  questionExplains: {},
}

db.prepare(
  'INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
).run(user.id, JSON.stringify(data), Date.now())

const gemCount = Object.keys(gems).length
const c7Studied = Math.ceil(pointsOf(chapters[6]).length / 2)
console.log(`已为 ${phone}（${user.name}）写入测试数据：`)
console.log(`  通关 6 关（门 1~6 开），第 7 关进行中（学 ${c7Studied} 知识点、1 轮考评 4 错 2 慢）`)
console.log(`  能量 ${data.energy} ⚡，宝石 ${gemCount} 颗已采集，装备全拥有（皇冠/火箭靴/披风已穿）`)
console.log(`  计算专项通过 ${Object.keys(calcDone).length} 个训练，考评历史 2 轮（c1 完美 / c7 带错）`)
console.log(`\n登录（或退出后重新登录）即可拉取：${phone}`)
