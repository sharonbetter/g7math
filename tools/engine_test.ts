/**
 * 计时/判分/自适应循环引擎的自检脚本。
 * 运行：bash tools/run_engine_test.sh
 */
import { answersMatch, evalNumeric, normalizeAnswer } from './answers.ts'
import { buildPracticeExam, isMastered } from './adaptive.ts'
import { gradeQuestion, isSlow, summarizeRecords } from './grading.ts'
import { nextStartedAt } from './timing.ts'
import type { AnswerRecord, Exam, Question, Round } from './types.ts'

let pass = 0
let fail = 0

function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name} ${extra}`)
  }
}

function group(t: string) {
  console.log(`\n${t}`)
}

// ---------- 1. 答案归一化与等价判定 ----------
group('1. 答案等价判定')
ok('1/2 == 0.5', answersMatch('0.5', '1/2'))
ok('1/2 == 0.50', answersMatch(' 0.50 ', '1/2'))
ok('全角数字', answersMatch('１２', '12'))
ok('负号变体 − vs -', answersMatch('−3', '-3'))
ok('x=3 与 3', answersMatch('3', 'x = 3'))
ok('x=3 与 x = 3', answersMatch('x=3', 'x = 3'))
ok('数值表达式 2+3 == 5', answersMatch('2+3', '5'))
ok('√8 == 2√2 数值等价', answersMatch('√8', '2*√2'))
ok('-1/2 == -0.5', answersMatch('-1/2', '-0.5'))
ok('π 近似不等价于 3.14', !answersMatch('3.14', 'π'))
ok('多空顺序一致', answersMatch('-3；2', '-3；2'))
ok('多空顺序颠倒不判对', !answersMatch('2；-3', '-3；2'))
ok('acceptedAnswers 备选', answersMatch('x=2', '2', ['x=2']))
ok('错误答案不判对', !answersMatch('1/3', '1/2'))
ok('空答案不判对', !answersMatch('', '5'))
ok('evalNumeric 优先级', evalNumeric('2+3*4') === 14)
ok('evalNumeric 括号', evalNumeric('(2+3)*4') === 20)
ok('evalNumeric 乘方', evalNumeric('2^10') === 1024)
ok('evalNumeric 拒绝含字母', evalNumeric('2x') === null)
ok('normalize 去空格', normalizeAnswer(' 1 / 2 ') === '1/2')
ok('区间 (-1,2) 等价于 -1<x<2', answersMatch('-1<x<2', '(-1, 2)'))
ok('区间 [1,3] 等价于 1≤x≤3', answersMatch('1≤x≤3', '[1,3]'))
ok('带题号仍判对', answersMatch('(1) 3', '3'))
ok('多小问题号不影响', answersMatch('(1) 书店 +3\n(2) 超市 -2', '(1) 书店 +3；(2) 超市 -2'))
ok('坐标逗号不被拆错', answersMatch('(3, 2)', '(3,2)'))

// ---------- 2. 批改与错因 ----------
group('2. 批改与错因')
const qChoice: Question = {
  id: 'q1',
  type: 'choice',
  difficulty: 1,
  estimatedSeconds: 60,
  pointIds: ['7a-1-01'],
  stem: '如果收入 100 元记作 +100 元，那么支出 60 元记作（  ）',
  options: ['A. +60 元', 'B. -60 元', 'C. +40 元', 'D. -40 元'],
  answer: 'B',
  solution: '收入记为正，支出记为负。',
  errorTags: ['概念不清', '符号理解错误' as string],
  commonWrong: [{ answer: 'A', reason: '直接把 60 当成正数' }],
}
const gRight = gradeQuestion(qChoice, 'B')
ok('选择题答对得分 1', gRight.correct && gRight.score === 1)
const gWrong = gradeQuestion(qChoice, 'A')
ok('选择题答错不得分', !gWrong.correct && gWrong.score === 0)
ok('命中典型错答时使用具体错因', gWrong.errorReason.includes('直接把 60 当成正数'))
ok('命中典型错答时附「典型错误」标签', gWrong.errorTags.includes('典型错误'))
const gBlank = gradeQuestion(qChoice, '   ')
ok('未作答单独提示', !gBlank.correct && gBlank.errorTags.includes('未作答'))

const qFill: Question = {
  id: 'q2',
  type: 'fill',
  difficulty: 2,
  estimatedSeconds: 120,
  pointIds: ['7a-1-08'],
  stem: '计算：|-3| = ______',
  answer: '3',
  solution: '负数的绝对值是它的相反数。',
  errorTags: ['符号错误'],
}
ok('填空题等价判定', gradeQuestion(qFill, '3').correct)
ok('填空题写错不得分', !gradeQuestion(qFill, '-3').correct)

// ---------- 3. 耗时标记规则 ----------
group('3. 耗时标记规则（>1 分钟才标记）')
ok('恰好超出 60 秒不标记', !isSlow(1000 * 100 + 60_000, 100))
ok('超出 60.001 秒才标记', isSlow(1000 * 100 + 60_001, 100))
ok('早于预计不标记', !isSlow(1000 * 50, 100))
ok('预计 60s 实际 130s 标记', isSlow(130_000, 60))

// ---------- 4. 计时链 ----------
group('4. 计时链（首尾相接）')
const sessionStart = 1_000_000
const mk = (id: string, submittedAt: number, startedAt: number): AnswerRecord => ({
  questionId: id,
  type: 'choice',
  startedAt,
  submittedAt,
  durationMs: submittedAt - startedAt,
  value: 'A',
  revisitMs: 0,
  revisitCount: 0,
  correct: true,
  score: 1,
  errorTags: [],
  errorReason: '',
  index: 1,
})
const chain = [mk('a', sessionStart + 30_000, sessionStart)]
ok('第一题起点 = 考评开始时间', nextStartedAt([], sessionStart) === sessionStart)
ok('第二题起点 = 第一题提交时刻', nextStartedAt(chain, sessionStart) === sessionStart + 30_000)
const chain2 = [...chain, mk('b', sessionStart + 80_000, sessionStart + 30_000)]
ok('第三题起点 = 第二题提交时刻', nextStartedAt(chain2, sessionStart) === sessionStart + 80_000)
ok('第二题耗时 = 50s', chain2[1].durationMs === 50_000)

// ---------- 5. 轮次汇总 ----------
group('5. 轮次汇总')
const qMap = new Map<string, Question>([
  ['q1', qChoice],
  ['q2', qFill],
])
const recs: AnswerRecord[] = [
  { ...mk('q1', sessionStart + 30_000, sessionStart), correct: false, score: 0 },
  // q2 预计 120s，实际 190s，差值 70s > 60s，应被标记
  { ...mk('q2', sessionStart + 220_000, sessionStart + 30_000), correct: true, score: 1 },
]
const sum = summarizeRecords(recs, qMap)
ok('错题被识别', sum.wrongQuestionIds.includes('q1'))
ok('超时题被识别（q2 用时 190s 预计 120s，差值 70s）', sum.slowQuestionIds.includes('q2'))
ok('耗时差值未超 1 分钟不标记（差值设为 50s）', !isSlow(170_000, 120))
ok('薄弱知识点汇总', sum.weakPointIds.includes('7a-1-08') && sum.weakPointIds.includes('7a-1-01'))

// ---------- 6. 专项练习组卷 ----------
group('6. 专项练习自动组卷')
const mkQ = (id: string, n: number): Question => ({
  id,
  type: 'choice',
  difficulty: 2,
  estimatedSeconds: 90,
  pointIds: ['7a-1-01'],
  stem: `原题 ${id}`,
  options: ['A. 1', 'B. 2', 'C. 3', 'D. 4'],
  answer: 'A',
  solution: '解析',
  variants: Array.from({ length: n }, (_, i) => ({
    stem: `${id} 的变式 ${i + 1}`,
    options: ['A. 1', 'B. 2', 'C. 3', 'D. 4'],
    answer: 'B',
    solution: '变式解析',
    estimatedSeconds: 90,
  })),
})
const srcExam: Exam = {
  id: 'e',
  chapterId: '7a-c1',
  chapterTitle: '第一章 有理数',
  title: 't',
  totalEstimatedSeconds: 180,
  sections: [{ id: 'A', title: '一、选择题', type: 'choice', questionIds: ['q1', 'qx'] }],
  questions: [mkQ('q1', 2), mkQ('qx', 2)],
}
const round: Round = {
  id: 'r1',
  kind: 'exam',
  round: 1,
  chapterId: '7a-c1',
  chapterTitle: '第一章 有理数',
  title: '第一章 有理数 · 章节考评',
  examId: 'e',
  startedAt: sessionStart,
  totalMs: 0,
  answers: recs,
  wrongQuestionIds: ['q1'],
  slowQuestionIds: [],
  weakPointIds: ['7a-1-01'],
  exam: srcExam,
}
const plan = buildPracticeExam(round, new Map([['e', srcExam]]))
ok('专项练习卷有题目', plan.exam.questions.length > 0)
ok('优先使用变式题', plan.exam.questions.some((q) => q.stem.includes('变式')))
ok('变式不足时回退重做原题（本题库变式仅 4 道 < 6 道门槛）', plan.exam.questions.some((q) => q.stem.includes('原题')))
ok(
  'origin 正确区分变式与原题重做',
  Object.values(plan.origin).some((v) => v.includes('变式')) &&
    Object.values(plan.origin).some((v) => v.includes('重做原题')),
)
ok('专项练习按题型分节', plan.exam.sections.length > 0)
ok('专项练习预计耗时有限', plan.exam.totalEstimatedSeconds <= 1500 + 300)
ok('变式答案独立保留', plan.exam.questions.every((q) => !!q.answer && !!q.solution))
ok('origin 标注了来源', Object.keys(plan.origin).length === plan.exam.questions.length)

// ---------- 7. 掌握判定 ----------
group('7. 掌握判定')
ok('无错题无超时 = 已掌握', isMastered({ ...round, wrongQuestionIds: [], slowQuestionIds: [] }))
ok('有错题 = 未掌握', !isMastered(round))
ok('有超时 = 未掌握', !isMastered({ ...round, wrongQuestionIds: [], slowQuestionIds: ['q1'] }))

console.log(`\n${'='.repeat(50)}`)
console.log(`通过 ${pass} 项，失败 ${fail} 项`)
process.exit(fail ? 1 : 0)
