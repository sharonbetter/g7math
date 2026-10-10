#!/usr/bin/env node
/**
 * 用几种真实的学习进度模拟等级推进，确认不会「只学一点就高级」。
 * 运行：node tools/test-miniprogram-progression.js
 */
const path = require('path')
const ROOT = path.join(__dirname, '..', 'miniprogram')
const inc = require(path.join(ROOT, 'lib', 'incentives'))

let pass = 0
let fail = 0
function ok(name, cond, extra) {
  if (cond) pass++
  else {
    fail++
    console.log('  ✗ ' + name + (extra ? ' — ' + extra : ''))
  }
}

const NOW = Date.now()
const DAY = 86400000

// 12 章的知识点数（来自课程大纲）
const POINTS = { '7a-c1': 11, '7a-c2': 13, '7a-c3': 5, '7a-c4': 6, '7a-c5': 14, '7a-c6': 15, '7b-c7': 14, '7b-c8': 8, '7b-c9': 7, '7b-c10': 9, '7b-c11': 6, '7b-c12': 6 }
const CHAPTERS = Object.keys(POINTS)

/** 造一份学习记录：study 为「学了几个知识点」，考试答对数按比例 */
function build({ studiedPoints, chaptersWithExam = 0, examCorrectRatio = 0.7, masteredChapters = 0, practicePerChapter = 0, repeatExams = 0 }) {
  const studied = {}
  let left = studiedPoints
  let i = 0
  for (const cid of CHAPTERS) {
    if (left <= 0) break
    const take = Math.min(left, POINTS[cid])
    for (let k = 0; k < take; k++) studied[cid + '-' + k] = NOW - i * DAY
    left -= take
    i++
  }
  const rounds = {}
  let n = 0
  for (let c = 0; c < chaptersWithExam; c++) {
    const cid = CHAPTERS[c]
    const total = 22
    const correct = Math.round(total * examCorrectRatio)
    for (let rep = 0; rep < 1 + repeatExams; rep++) {
      rounds['exam-' + cid + '-' + rep] = {
        id: 'exam-' + cid + '-' + rep, kind: 'exam', chapterId: cid, finishedAt: NOW - c * DAY,
        answers: Array.from({ length: total }, (_, k) => ({ correct: k < correct })),
        wrongQuestionIds: Array.from({ length: total - correct }, (_, k) => 'w' + k), slowQuestionIds: []
      }
      n++
    }
  }
  for (let c = 0; c < chaptersWithExam; c++) {
    for (let p = 0; p < practicePerChapter; p++) {
      const cid = CHAPTERS[c]
      rounds['prac-' + cid + '-' + p] = {
        id: 'prac-' + cid + '-' + p, kind: 'practice', chapterId: cid, finishedAt: NOW - c * DAY,
        answers: Array.from({ length: 8 }, () => ({ correct: true })), wrongQuestionIds: [], slowQuestionIds: []
      }
      n++
    }
  }
  const loops = {}
  for (let c = 0; c < masteredChapters; c++) loops[CHAPTERS[c]] = { status: 'mastered' }
  void n
  return { studied, rounds, loops }
}

// 期望值即设计目标：前半程升级快些，后半程大约一章一级
const cases = [
  ['只学第 1 章的 3 个知识点', build({ studiedPoints: 3 }), 1],
  ['学第 1 章的 6 个知识点', build({ studiedPoints: 6 }), 2],
  ['第 1 章学一半 + 交一次考评', build({ studiedPoints: 6, chaptersWithExam: 1, examCorrectRatio: 0.5 }), 2],
  ['第 1 章整章学完 + 考评 + 掌握', build({ studiedPoints: 11, chaptersWithExam: 1, examCorrectRatio: 0.8, masteredChapters: 1 }), 3],
  ['第 2 章也学完', build({ studiedPoints: 24, chaptersWithExam: 2, examCorrectRatio: 0.8, masteredChapters: 2 }), 4],
  ['前 4 章学完', build({ studiedPoints: 35, chaptersWithExam: 4, examCorrectRatio: 0.8, masteredChapters: 4 }), 5],
  ['前 6 章学完', build({ studiedPoints: 64, chaptersWithExam: 6, examCorrectRatio: 0.8, masteredChapters: 6 }), 7],
  ['前 8 章学完', build({ studiedPoints: 86, chaptersWithExam: 8, examCorrectRatio: 0.8, masteredChapters: 8 }), 8],
  ['前 10 章学完', build({ studiedPoints: 102, chaptersWithExam: 10, examCorrectRatio: 0.8, masteredChapters: 10 }), 9],
  ['12 章全学完 + 全考评 + 全掌握', build({ studiedPoints: 114, chaptersWithExam: 12, examCorrectRatio: 0.85, masteredChapters: 12 }), 10],
]

console.log('=== 进度与等级 ===')
for (const [label, data, expected] of cases) {
  const g = inc.computeIncentives(data)
  const mark = g.level === expected ? '✓' : '✗'
  console.log(`  ${mark} ${label.padEnd(28)} ${String(g.xp).padStart(5)} 经验 → Lv.${g.level} ${g.levelName}`)
  ok(label + ' 应为 Lv.' + expected, g.level === expected, '实际 Lv.' + g.level + '（' + g.xp + ' 经验）')
}

console.log('=== 反刷经验 ===')
{
  const once = inc.computeIncentives(build({ studiedPoints: 11, chaptersWithExam: 1, examCorrectRatio: 0.8, masteredChapters: 1 }))
  const repeated = inc.computeIncentives(build({ studiedPoints: 11, chaptersWithExam: 1, examCorrectRatio: 0.8, masteredChapters: 1, repeatExams: 10 }))
  ok('同一章重做 10 次考评不额外给经验', repeated.xp === once.xp, once.xp + ' → ' + repeated.xp)

  const noPractice = inc.computeIncentives(build({ studiedPoints: 11, chaptersWithExam: 1, examCorrectRatio: 0.8, masteredChapters: 1 }))
  const manyPractice = inc.computeIncentives(build({ studiedPoints: 11, chaptersWithExam: 1, examCorrectRatio: 0.8, masteredChapters: 1, practicePerChapter: 8 }))
  ok('专项练习每章最多补两轮经验', manyPractice.xp - noPractice.xp === 20, '多出 ' + (manyPractice.xp - noPractice.xp))
}

console.log('=== 等级上限 ===')
{
  const superUser = inc.computeIncentives({
    studied: Object.fromEntries(Array.from({ length: 114 }, (_, i) => ['p' + i, NOW])),
    loops: Object.fromEntries(CHAPTERS.map((c) => [c, { status: 'mastered' }])),
    rounds: Object.fromEntries(CHAPTERS.map((c, i) => ['r' + i, {
      kind: 'exam', chapterId: c, finishedAt: NOW,
      answers: Array.from({ length: 22 }, () => ({ correct: true })), wrongQuestionIds: [], slowQuestionIds: []
    }]))
  })
  ok('全部满分也只到 Lv.10', superUser.level === 10, '实际 Lv.' + superUser.level)
  ok('等级不超过名称表长度', superUser.level <= superUser.levels.length)
  ok('满级时下一级显示已满级', superUser.nextLevelName === '已满级', superUser.nextLevelName)
}

console.log('\n通过 ' + pass + ' 项，失败 ' + fail + ' 项')
process.exit(fail === 0 ? 0 : 1)
