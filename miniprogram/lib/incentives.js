/**
 * 游戏式激励（小程序版，规则与 app/src/lib/incentives.ts 一致）。
 * 经验、等级、连续天数、今日目标和徽章都从已有记录推算。
 */
var DAILY_GOAL = 40
var LEVELS = [
  { name: '初识数海', desc: '刚开始。看完前几课就能升上来。' },
  { name: '数轴行者', desc: '约学完 5～6 个知识点。' },
  { name: '运算学徒', desc: '约学完一整章并交过一次考评。' },
  { name: '方程猎人', desc: '约两章过关，会和未知数打交道。' },
  { name: '几何探路', desc: '约三到四章，图形题开始上手。' },
  { name: '应用闯关', desc: '约五到六章，应用题能独立列式。' },
  { name: '思维先锋', desc: '约七章，错题回炉成了习惯。' },
  { name: '新思维达人', desc: '约八到九章，多数考评卷能一次过。' },
  { name: '章节征服者', desc: '约十章，掌握章节过半。' },
  { name: '数学探险家', desc: '十二章基本推完，图鉴接近收齐。' }
]

/** 升到下一级所需经验，逐级递增：50、110、180、250…… */
var NEEDS = [50, 110, 180, 250, 300, 330, 360, 400, 420]

function needFor(level) {
  return NEEDS[level - 1] === undefined ? NEEDS[NEEDS.length - 1] : NEEDS[level - 1]
}

function dayKey(ts) {
  var d = new Date(ts)
  function pad(n) { return n < 10 ? '0' + n : String(n) }
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

function todayKey() {
  return dayKey(Date.now())
}

function finishedRounds(data) {
  return Object.keys(data.rounds || {}).map(function (k) { return data.rounds[k] }).filter(function (r) { return r.finishedAt })
}

function xpOfRound(r) {
  var correct = (r.answers || []).filter(function (a) { return a.correct }).length
  var base = 20 + correct * 2
  return r.kind === 'practice' ? base + 10 : base
}

/** 考评经验按「每章取最好的一轮」累计，专项练习每章最多补两轮，避免反复刷 */
function xpFromRounds(rounds) {
  var byChapter = {}
  rounds.forEach(function (r) {
    if (!byChapter[r.chapterId]) byChapter[r.chapterId] = []
    byChapter[r.chapterId].push(r)
  })
  var total = 0
  Object.keys(byChapter).forEach(function (cid) {
    var list = byChapter[cid]
    var best = 0
    list.forEach(function (r) {
      var v = xpOfRound(r)
      if (v > best) best = v
    })
    var practiceCount = list.filter(function (r) { return r.kind === 'practice' }).length
    total += best + Math.min(2, practiceCount) * 10
  })
  return total
}

function levelProgress(xp) {
  var level = 1
  var need = needFor(1)
  var remain = xp
  while (remain >= need && level < LEVELS.length) {
    remain -= need
    level += 1
    need = needFor(level)
  }
  return { level: level, xpIntoLevel: remain, xpForNext: need }
}

function levelTable(currentLevel) {
  var start = 0
  return LEVELS.map(function (lv, i) {
    var level = i + 1
    var step = {
      level: level,
      name: lv.name,
      desc: lv.desc,
      startXp: start,
      current: level === currentLevel,
      reached: level <= currentLevel
    }
    start += needFor(level)
    return step
  })
}

function streakOf(days) {
  var today = todayKey()
  var y = new Date()
  y.setDate(y.getDate() - 1)
  var yesterday = dayKey(y.getTime())
  var cursor = days[today] ? today : days[yesterday] ? yesterday : ''
  if (!cursor) return 0
  var n = 0
  var d = new Date(cursor + 'T12:00:00')
  while (days[dayKey(d.getTime())]) {
    n += 1
    d.setDate(d.getDate() - 1)
  }
  return n
}

function makeBadge(id, name, desc, icon, current, target, action, actionLabel) {
  var capped = Math.min(current, target)
  return {
    id: id,
    name: name,
    desc: desc,
    icon: icon,
    earned: current >= target,
    current: capped,
    target: target,
    pct: target > 0 ? Math.round((capped / target) * 100) : 0,
    remaining: Math.max(0, target - current),
    action: action,
    actionLabel: actionLabel
  }
}

function badgesOf(input) {
  var perfect = input.finished.some(function (r) {
    return (r.answers || []).length >= 8 && (r.wrongQuestionIds || []).length === 0 && (r.slowQuestionIds || []).length === 0
  })
  var steady = input.finished.some(function (r) {
    return (r.answers || []).length >= 8 && (r.slowQuestionIds || []).length === 0
  })
  var examCount = input.finished.filter(function (r) { return r.kind === 'exam' }).length
  return [
    makeBadge('first-lesson', '第一课', '学完 1 个知识点', '📘', input.studied, 1, 'curriculum', '去学课件'),
    makeBadge('ten-lessons', '十课连击', '学完 10 个知识点', '🔥', input.studied, 10, 'curriculum', '继续学课件'),
    makeBadge('half', '半程行者', '学完 57 个知识点', '🗺️', input.studied, 57, 'curriculum', '继续学课件'),
    makeBadge('all-lessons', '全图鉴', '114 个知识点都学过', '🏆', input.studied, 114, 'curriculum', '继续学课件'),
    makeBadge('first-exam', '首考', '完成 1 次章节考评', '✏️', examCount, 1, 'exams', '去做考评'),
    makeBadge('perfect', '满分卷', '一整轮全对且没有超时', '⭐', perfect ? 1 : 0, 1, 'exams', '去挑战'),
    makeBadge('steady', '稳准', '一整轮（至少 8 题）没有耗时标记', '⏱️', steady ? 1 : 0, 1, 'exams', '去挑战'),
    makeBadge('streak-3', '三日连学', '连续学习 3 天', '📅', input.streak, 3, 'curriculum', '今天学一课'),
    makeBadge('streak-7', '一周不断', '连续学习 7 天', '🗓️', input.streak, 7, 'curriculum', '今天学一课'),
    makeBadge('master-1', '攻下一章', '掌握 1 个章节', '🚩', input.mastered, 1, 'exams', '去拿掌握'),
    makeBadge('master-all', '十二章通关', '12 个章节全部掌握', '👑', input.mastered, 12, 'exams', '去拿掌握'),
    makeBadge('practice', '专项战士', '完成 1 次专项练习', '🎯', input.practice, 1, 'remedial', '去专项提升'),
    makeBadge('hundred', '百分旅人', '累计答对 100 题', '💯', input.correct, 100, 'exams', '继续答题')
  ]
}

function computeIncentives(data) {
  var studiedEntries = Object.keys(data.studied || {}).map(function (k) { return [k, data.studied[k]] })
  var rounds = finishedRounds(data)
  var mastered = Object.keys(data.loops || {}).filter(function (k) { return data.loops[k].status === 'mastered' }).length
  var correct = rounds.reduce(function (s, r) {
    return s + (r.answers || []).filter(function (a) { return a.correct }).length
  }, 0)
  var practice = rounds.filter(function (r) { return r.kind === 'practice' }).length
  var xp = studiedEntries.length * 10 + xpFromRounds(rounds) + mastered * 50

  var today = todayKey()
  var todayXp = studiedEntries.filter(function (e) { return dayKey(e[1]) === today }).length * 10
    + xpFromRounds(rounds.filter(function (r) { return r.finishedAt && dayKey(r.finishedAt) === today }))

  var days = {}
  studiedEntries.forEach(function (e) { days[dayKey(e[1])] = true })
  rounds.forEach(function (r) { if (r.finishedAt) days[dayKey(r.finishedAt)] = true })
  var streak = streakOf(days)
  var progress = levelProgress(xp)
  var levels = levelTable(progress.level)
  var badges = badgesOf({
    studied: studiedEntries.length,
    finished: rounds,
    mastered: mastered,
    streak: streak,
    correct: correct,
    practice: practice
  })
  var nameIndex = Math.min(progress.level, LEVELS.length) - 1
  return {
    xp: xp,
    level: progress.level,
    levelName: (LEVELS[nameIndex] || LEVELS[LEVELS.length - 1]).name,
    levelMax: LEVELS.length,
    xpIntoLevel: progress.xpIntoLevel,
    xpForNext: progress.xpForNext,
    xpToNext: Math.max(0, progress.xpForNext - progress.xpIntoLevel),
    nextLevelName: progress.level < LEVELS.length ? LEVELS[progress.level].name : '已满级',
    levels: levels,
    streak: streak,
    studiedToday: !!days[today],
    todayXp: todayXp,
    dailyGoal: DAILY_GOAL,
    badges: badges,
    earnedCount: badges.filter(function (b) { return b.earned }).length,
    nextBadges: badges
      .filter(function (b) { return !b.earned })
      .sort(function (a, b) { return b.pct - a.pct || a.remaining - b.remaining })
      .slice(0, 3)
  }
}

module.exports = { computeIncentives: computeIncentives, DAILY_GOAL: DAILY_GOAL }
