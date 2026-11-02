#!/usr/bin/env node
/**
 * 课件故事化批量改写管线。
 *
 * 用法：
 *   node tools/rewrite_lessons.mjs --chapter 7a-c1          # 改写一章
 *   node tools/rewrite_lessons.mjs --chapter 7a-c1 --point 7a-1-02   # 只改一个知识点
 *
 * 三道防线：
 *   1. 原文数字必须全部保留（程序校验，不过则回退）
 *   2. 新增数字进入人工复核清单（tools/rewrite-review-list.json）
 *   3. GLM 二次审校数学表述（不过则回退）
 *
 * 跳过：@@fig 行原样保留（数量校验）；例题页只改 body 的讲解文字，problem/solution 不动。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const line of readFileSync(join(ROOT, 'app/.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !line.startsWith('#')) env[m[1]] = m[2]
}
const BASE = env.DIAGNOSE_BASE_URL || env.GRADE_BASE_URL
const KEY = env.DIAGNOSE_API_KEY || env.GRADE_API_KEY
const MODEL = 'glm-5.3'

const args = process.argv.slice(2)
const flag = (n) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined)
const onlyChapter = flag('chapter')
const onlyPoint = flag('point')

const RULES = `【七条铁律】
1. 逻辑一步不跳：每个例子自解释，不依赖读者额外的常识；相邻两句之间不能有推理跳跃。
2. 不编人物对话、不堆比喻。认知冲突用"不同的人给出不同回答"呈现分歧，不替读者代言（不说"你答不上来"）。一页最多一个比喻，且要一句讲清、自然贴切。
3. 严禁引入原文没有的数值、计量或计算。故事与讲解只能复述原文已有的数字，绝对不要自己算出新数字（如原文有 5 和 12，不能自己写"相差 7"）。
4. 原文中出现的所有数字必须原样保留，一个都不能丢。
5. 与上一页自然承接（可引用"上一页"），像同一位老师在连续讲课，但每页也要能独立读懂。
6. 避免绝对化表述（"不能""必须""一定"）。数学规则的边界要说准：是"不可以"，还是"可以但有条件"，用准确的措辞。
7. 视角永远是学生：讲概念、讲规则本身、讲怎么用。不说出题人/阅卷人的元话语（如"读题的人会晕""要重新说明给读者"）。

【风格示例】（这是已定稿的标准风格）
原文：冬天，北京的气温是零下 5 ℃，广州的气温是零上 12 ℃。如果只写"5"和"12"，能分清哪里冷吗？再看几个场景：小明家这个月收入 8000 元，支出 5000 元……
改写后：
先做个小测试：明天气温 5 度，明天穿什么？
有人抢答："薄外套就够了。"另一个说："必须羽绒服！"
两边吵起来了吧？其实都没错——零上 5 度，薄外套正好；零下 5 度，必须羽绒服。数字一模一样，冷热天差地别，差别就藏在"零上""零下"这四个字里。天气预报要是只报一个"5"，这场架就永远吵不完。
（说明：认知冲突靠分歧呈现；句式放松，长短错落；结论落地到"方向丢了"。）

【其他要求】
- 保持初二学生能懂的语言，克制使用语气词。
- 正文的数学符号写法（如 +5、-5、2/3、√2）保持原样。
- 如果原文中有一行以 @@fig 开头的图形标记，必须原样完整保留，位置放在正文末尾。
- 标题可以改得更吸引人，但要准确反映内容，不夸张。`

function nums(s) {
  return new Set((s.match(/\d+(?:\.\d+)?/g) ?? []).map((x) => (x.includes('.') ? String(Number(x)) : x)))
}

async function chat(prompt, temperature = 0.3) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      messages: [
        { role: 'system', content: '你是一位给初中生写课件的资深数学老师，只输出要求的内容。' },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(300_000),
  })
  if (!res.ok) throw new Error(`GLM ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return (data.choices?.[0]?.message?.content ?? '').trim()
}

/** 防线3：数学审校 */
async function review(origText, newText) {
  const out = await chat(
    `你是数学审校员。对照原文检查改写稿：
A. 改写稿是否改变了任何数学内容（定义、规则、数字含义、运算关系）？
B. 是否引入了原文没有的数字或计算？
C. 是否有绝对化或边界不准的数学表述？
只输出 JSON：{"ok": true} 或 {"ok": false, "reason": "一句话"}

【原文】
${origText}

【改写稿】
${newText}`,
    0,
  )
  const j = out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)
  return JSON.parse(j)
}

async function rewriteSlide(ctx) {
  const { chapterTitle, lessonTitle, prevTail, title, body, kind } = ctx
  const prompt = `把下面这页初中数学课件改写成生动的讲课风格。

【上下文】
章节：${chapterTitle}
知识点：${lessonTitle}
${prevTail ? `上一页的结尾（请自然承接，但不要重复它的内容）：\n${prevTail}` : '（这是本知识点的第一页）'}

${RULES}

【原稿】
标题：${title}
${body || '（无正文）'}

【输出格式】
标题：新标题
正文（多段，用空行分隔）`

  const out = await chat(prompt)
  // 解析
  const mTitle = out.match(/^标题[：:]\s*(.+)$/m)
  const bodyStart = out.indexOf('\n', out.match(/^标题[：:]/m)?.index ?? 0)
  let newTitle = (mTitle?.[1] ?? title).trim()
  let newBody = bodyStart > 0 ? out.slice(bodyStart).trim() : out.trim()
  if (!mTitle) newBody = out.trim()
  return { newTitle, newBody }
}

function figLines(s) {
  return (s.match(/@@fig[^\n]*@@/g) ?? []).sort()
}

async function processFile(file) {
  const path = join(ROOT, 'data/lessons', file)
  const d = JSON.parse(readFileSync(path, 'utf8'))
  const reviewList = existsSync(join(ROOT, 'tools/rewrite-review-list.json'))
    ? JSON.parse(readFileSync(join(ROOT, 'tools/rewrite-review-list.json'), 'utf8'))
    : []
  let rewritten = 0, reverted = 0, skipped = 0
  let pending = 0

  for (const lesson of d.lessons) {
    if (onlyPoint && lesson.pointId !== onlyPoint) continue
    let prevTail = ''
    for (const slide of lesson.slides) {
      const origTitle = slide.title ?? ''
      const origBody = slide.body ?? ''
      if (!origBody.trim()) { prevTail = ''; continue }
      // 跳过试点定稿页
      if (d.chapterId === '7a-c1' && lesson.pointId === '7a-1-01' && lesson.slides.indexOf(slide) < 2) {
        prevTail = origBody.slice(-120)
        skipped++
        continue
      }
      pending++
      const attemptOnce = async () => {
        const { newTitle, newBody } = await rewriteSlide({
          chapterTitle: d.chapterTitle,
          lessonTitle: lesson.title,
          prevTail,
          title: origTitle,
          body: origBody,
          kind: slide.kind,
        })
        return { newTitle, newBody }
      }
      try {
        let newTitle, newBody
        try {
          ;({ newTitle, newBody } = await attemptOnce())
        } catch {
          await new Promise((r2) => setTimeout(r2, 2000))
          ;({ newTitle, newBody } = await attemptOnce())
        }
        // 防线1：数字保留
        const origNums = nums(origBody + ' ' + origTitle)
        const newNums = nums(newBody + ' ' + newTitle)
        const missing = [...origNums].filter((n) => !newNums.has(n))
        const figOk = JSON.stringify(figLines(origBody)) === JSON.stringify(figLines(newBody))
        // 防线2：新增数字
        const added = [...newNums].filter((n) => !origNums.has(n))
        if (added.length) {
          reviewList.push({ chapter: d.chapterId, point: lesson.pointId, slide: origTitle, added, newTitle })
        }
        if (missing.length || !figOk) {
          reverted++
          console.log(`  ↩ 回退（数字缺失 ${missing.join(',')} ${figOk ? '' : '/ fig丢失'}）：${lesson.pointId} ${origTitle.slice(0, 24)}`)
          prevTail = origBody.slice(-120)
          continue
        }
        // 防线3：审校
        const verdict = await review(origBody, newBody)
        if (!verdict.ok) {
          reverted++
          console.log(`  ↩ 回退（审校：${verdict.reason?.slice(0, 50)}）：${lesson.pointId} ${origTitle.slice(0, 24)}`)
          prevTail = origBody.slice(-120)
          continue
        }
        slide.title = newTitle
        slide.body = newBody
        rewritten++
        prevTail = newBody.slice(-120)
      } catch (e) {
        reverted++
        console.log(`  ✗ 失败（${e.message.slice(0, 80)}）：${lesson.pointId} ${origTitle.slice(0, 24)}`)
        prevTail = origBody.slice(-120)
      }
      if (pending % 10 === 0) console.log(`  … 已处理 ${pending} 页（改写 ${rewritten} 回退 ${reverted}）`)
    }
  }
  writeFileSync(path, JSON.stringify(d, null, 1))
  writeFileSync(join(ROOT, 'tools/rewrite-review-list.json'), JSON.stringify(reviewList, null, 1))
  console.log(`${file}: 改写 ${rewritten}｜回退 ${reverted}｜跳过 ${skipped}｜新增数字复核 ${reviewList.length} 条`)
}

import { readdirSync } from 'node:fs'
const files = readdirSync(join(ROOT, 'data/lessons')).filter((f) => f.endsWith('.json'))

for (const f of files) {
  const ch = f.replace('.json', '')
  if (onlyChapter && ch !== onlyChapter) continue
  console.log(`\n== ${ch}`)
  await processFile(f)
}
console.log('\n全部完成')
