#!/usr/bin/env node
/**
 * 校验小程序版判分/计时/自适应逻辑与 H5 版行为一致。
 * 运行：node tools/test-miniprogram-lib.js
 */
const path = require('path')
const root = path.join(__dirname, '..', 'miniprogram', 'lib')
const answers = require(path.join(root, 'answers'))
const grading = require(path.join(root, 'grading'))
const adaptive = require(path.join(root, 'adaptive'))
const timing = require(path.join(root, 'timing'))

let pass = 0
let fail = 0
function ok(name, cond) {
  if (cond) {
    pass++
  } else {
    fail++
    console.log('  ✗ ' + name)
  }
}

// 1. 答案等价
ok('1/2 == 0.5', answers.answersMatch('0.5', '1/2'))
ok('1/2 == 0.50', answers.answersMatch(' 0.50 ', '1/2'))
ok('全角', answers.answersMatch('１２', '12'))
ok('负号变体', answers.answersMatch('−3', '-3'))
ok('x=3 与 3', answers.answersMatch('3', 'x = 3'))
ok('2+3 == 5', answers.answersMatch('2+3', '5'))
ok('√8 == 2√2', answers.answersMatch('√8', '2*√2'))
ok('多空顺序一致', answers.answersMatch('-3；2', '-3；2'))
ok('多空顺序颠倒不判对', !answers.answersMatch('2；-3', '-3；2'))
ok('acceptedAnswers', answers.answersMatch('x=2', '2', ['x=2']))
ok('错误答案不判对', !answers.answersMatch('1/3', '1/2'))
ok('空答案不判对', !answers.answersMatch('', '5'))
ok('区间 (-1,2) == -1<x<2', answers.answersMatch('-1<x<2', '(-1, 2)'))
ok('区间 [1,3] == 1≤x≤3', answers.answersMatch('1≤x≤3', '[1,3]'))
ok('带题号仍判对', answers.answersMatch('(1) 3', '3'))
ok('多小问题号不影响', answers.answersMatch('(1) 书店 +3\n(2) 超市 -2', '(1) 书店 +3；(2) 超市 -2'))
ok('坐标逗号不被拆错', answers.answersMatch('(3, 2)', '(3,2)'))
ok('normalize 去空格', answers.normalizeAnswer(' 1 / 2 ') === '1/2')
ok('evalNumeric 优先级', answers.evalNumeric('2+3*4') === 14)
ok('evalNumeric 乘方', answers.evalNumeric('2^10') === 1024)

// 2. 批改
const qChoice = {
  id: 'q1', type: 'choice', difficulty: 1, estimatedSeconds: 60, pointIds: ['7a-1-01'],
  stem: '收入 100 记作 +100，支出 60 记作（  ）',
  options: ['A. +60', 'B. -60', 'C. +40', 'D. -40'], answer: 'B',
  solution: '收入记为正。', errorTags: ['概念不清'],
  commonWrong: [{ answer: 'A', reason: '直接把 60 当成正数' }]
}
ok('选择题答对', grading.gradeQuestion(qChoice, 'B').correct)
ok('选择题答错', !grading.gradeQuestion(qChoice, 'A').correct)
ok('命中典型错答', grading.gradeQuestion(qChoice, 'A').errorReason.indexOf('直接把 60 当成正数') >= 0)
ok('未作答提示', grading.gradeQuestion(qChoice, '   ').errorTags.indexOf('未作答') >= 0)
ok('有照片时不判未作答', grading.gradeQuestion(qChoice, '   ', true).photoPending === true)

const qFill = { id: 'q2', type: 'fill', difficulty: 2, estimatedSeconds: 120, pointIds: ['7a-1-08'], stem: '|−3| = ___', answer: '3', solution: '绝对值' }
ok('填空题等价', grading.gradeQuestion(qFill, '3').correct)
ok('填空题写错', !grading.gradeQuestion(qFill, '-3').correct)

// 3. 耗时标记
ok('恰好超 60 秒不标记', !grading.isSlow(120000, 60))
ok('超 60.001 秒才标记', grading.isSlow(120001, 60))
ok('早于预计不标记', !grading.isSlow(30000, 60))

// 4. 计时链
const t = timing.buildTimings(
  [
    { questionId: 'a', type: 'choice', startedAt: 0, submittedAt: 30000, durationMs: 30000, revisitMs: 0, firstPickMs: 20000 },
    { questionId: 'b', type: 'fill', startedAt: 30000, submittedAt: 80000, durationMs: 50000, revisitMs: 0 }
  ],
  { a: { estimatedSeconds: 40 }, b: { estimatedSeconds: 60 } }
)
ok('计时条数', t.length === 2)
ok('第二题起点=第一题提交', t[1].startedAt === 30000)
ok('第二题耗时 50s', t[1].durationMs === 50000)
ok('首答用时保留', t[0].firstPickMs === 20000)

// 5. 汇总与自适应
const qs = { q1: qChoice, q2: qFill }
const records = [
  { questionId: 'q1', type: 'choice', startedAt: 0, submittedAt: 10000, durationMs: 10000, correct: false, errorTags: [], revisitMs: 0 },
  { questionId: 'q2', type: 'fill', startedAt: 10000, submittedAt: 200000, durationMs: 190000, correct: true, errorTags: [], revisitMs: 0 }
]
const sum = grading.summarizeRecords(records, qs)
ok('识别错题', sum.wrongQuestionIds.indexOf('q1') >= 0)
ok('识别超时题', sum.slowQuestionIds.indexOf('q2') >= 0)
ok('汇总薄弱知识点', sum.weakPointIds.length > 0)

const photoPending = [
  { questionId: 'q1', type: 'choice', startedAt: 0, submittedAt: 10000, durationMs: 10000, correct: false, photoReview: 'pending', errorTags: [], revisitMs: 0 }
]
ok('待确认照片不记错题', grading.summarizeRecords(photoPending, qs).wrongQuestionIds.length === 0)

const exam = {
  id: '7a-c1', chapterId: '7a-c1', chapterTitle: '第一章 有理数', totalEstimatedSeconds: 300,
  sections: [], questions: [
    Object.assign({}, qChoice, { variants: [
      { stem: '变式1', answer: 'B', solution: 's', estimatedSeconds: 60 },
      { stem: '变式2', answer: 'A', solution: 's', estimatedSeconds: 60 }
    ] })
  ]
}
const round = {
  id: 'r1', kind: 'exam', round: 1, chapterId: '7a-c1', chapterTitle: '第一章 有理数',
  exam, answers: records, startedAt: 0,
  wrongQuestionIds: ['q1'], slowQuestionIds: ['q2'], weakPointIds: ['7a-1-01', '7a-1-08']
}
const plan = adaptive.buildPracticeExam(round, { '7a-c1': exam }, {})
ok('专项练习有题目', plan.exam.questions.length > 0)
ok('专项练习有分节', plan.exam.sections.length > 0)
ok('专项练习预计耗时受限', plan.exam.totalEstimatedSeconds <= 1600)
ok('origin 标注来源', Object.keys(plan.origin).length > 0)
ok('无错题无超时=已掌握', adaptive.isMastered({ wrongQuestionIds: [], slowQuestionIds: [] }))
ok('有错题=未掌握', !adaptive.isMastered({ wrongQuestionIds: ['x'], slowQuestionIds: [] }))

// 8. 游戏式激励
const incentives = require(path.join(root, 'incentives'))
{
  const now = Date.now()
  const DAY = 86400000
  const game = incentives.computeIncentives({
    studied: { a: now, b: now - DAY, c: now - 2 * DAY },
    loops: { '7a-c1': { status: 'mastered' } },
    rounds: {
      r1: { kind: 'exam', chapterId: '7a-c1', finishedAt: now, answers: [{ correct: true }, { correct: false }], wrongQuestionIds: ['x'], slowQuestionIds: [] },
      r2: { kind: 'practice', chapterId: '7a-c2', finishedAt: now - DAY, answers: Array.from({ length: 8 }, () => ({ correct: true })), wrongQuestionIds: [], slowQuestionIds: [] }
    }
  })
  // 课件 3×10=30；7a-c1 最好一轮考评 22；7a-c2 专项 46+10=56；掌握 1 章 +50
  ok('经验按每章最好一轮累计', game.xp === 158, '实际 ' + game.xp)
  ok('连续学习 3 天', game.streak === 3, '实际 ' + game.streak)
  ok('今天已学习', game.studiedToday === true)
  ok('今日经验只算当天学的课与当天交的卷', game.todayXp === 10 + 22, '实际 ' + game.todayXp)
  ok('等级随经验提升', game.level === 2, '实际 ' + game.level)
  ok('等级名称正确', game.levelName === '数轴行者', game.levelName)
  ok('等级阶梯共 10 级', game.levels.length === 10)
  ok('阶梯只标记一个当前级', game.levels.filter((l) => l.current).length === 1)
  ok('阶梯标记已达成级数', game.levels.filter((l) => l.reached).length === game.level)
  ok('距下一级经验为正', game.xpToNext === game.xpForNext - game.xpIntoLevel && game.xpToNext > 0)
  ok('下一级名称指向后一级', game.nextLevelName === '运算学徒', game.nextLevelName)
  ok('拿到第一课徽章', game.badges.find((b) => b.id === 'first-lesson').earned)
  ok('拿到满分卷徽章', game.badges.find((b) => b.id === 'perfect').earned)
  ok('拿到稳准徽章', game.badges.find((b) => b.id === 'steady').earned)
  ok('拿到攻下一章徽章', game.badges.find((b) => b.id === 'master-1').earned)
  ok('未达成的徽章标记为未获得', !game.badges.find((b) => b.id === 'all-lessons').earned)
  ok('徽章计数与列表一致', game.earnedCount === game.badges.filter((b) => b.earned).length)

  const empty = incentives.computeIncentives({ studied: {}, loops: {}, rounds: {} })
  ok('徽章带进度与目标', game.badges.every((b) => typeof b.current === 'number' && typeof b.target === 'number'))
  ok('未达成徽章给出还差多少', game.badges.filter((b) => !b.earned).every((b) => b.remaining > 0))
  ok('已达成徽章剩余为 0', game.badges.filter((b) => b.earned).every((b) => b.remaining === 0))
  ok('徽章百分比在 0-100', game.badges.every((b) => b.pct >= 0 && b.pct <= 100))
  ok('每个徽章都有下一步动作', game.badges.every((b) => b.action && b.actionLabel))
  ok('引导最多三枚徽章', game.nextBadges.length <= 3 && game.nextBadges.length > 0)
  ok('引导只含未达成徽章', game.nextBadges.every((b) => !b.earned))
  ok('引导按完成度从高到低', game.nextBadges.every((b, i, arr) => i === 0 || arr[i - 1].pct >= b.pct))
  ok('最近三枚按完成度排序', game.nextBadges.map((b) => b.id).join(',') === 'streak-7,ten-lessons,hundred', game.nextBadges.map((b) => b.id).join(','))
  ok('「一周不断」还差 4 天', game.nextBadges[0].remaining === 4, String(game.nextBadges[0].remaining))
  ok('「十课连击」还差 7 个知识点', game.nextBadges[1].remaining === 7, String(game.nextBadges[1].remaining))
  ok('空数据为 1 级 0 经验', empty.level === 1 && empty.xp === 0 && empty.streak === 0)
  ok('空数据没有徽章', empty.earnedCount === 0)
}

console.log('\n通过 ' + pass + ' 项，失败 ' + fail + ' 项')
process.exit(fail === 0 ? 0 : 1)