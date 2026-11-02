import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'
import { loadEnv } from 'vite'

interface GradeBody {
  stem?: string
  standardAnswer?: string
  standardSolution?: string
  rubric?: string[]
  studentAnswer?: string
  studentWork?: string
  images?: string[]
  /** /api/tts 的合成文本 */
  text?: string
  /** /api/gen-variant：题型（choice/fill/calc/applied） */
  type?: string
  /** /api/gen-variant：选项（选择题） */
  options?: string[]
  /** /api/gen-variant：考点知识点名 */
  pointNames?: string
  /** /api/gen-narration：题库思路引导素材 */
  guidance?: string
  /** /api/gen-narration：错因（可能为空/未知） */
  standardErrorReason?: string
}

function readJson(req: IncomingMessage): Promise<GradeBody> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as GradeBody)
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 调 chat 接口：429/5xx 自动重试（指数退避），仍失败则换回退模型 */
async function callChat(
  base: string,
  apiKey: string,
  model: string,
  body: Record<string, unknown>,
  fallbackModel: string,
): Promise<{ ok: true; text: string } | { ok: false; status: number; raw: string }> {
  const attempt = async (m: string) =>
    fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: AbortSignal.timeout(150_000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, model: m }),
    })
  const delays = [0, 1500, 3500]
  let last: { status: number; raw: string } | null = null
  for (const d of delays) {
    if (d) await sleep(d)
    try {
      const r = await attempt(model)
      if (r.ok) return { ok: true, text: await r.text() }
      last = { status: r.status, raw: await r.text() }
      // 限流 / 网关错误 → 重试；其他错误（如鉴权）重试无意义
      if (![429, 500, 502, 503, 504].includes(r.status)) break
    } catch {
      last = { status: 0, raw: 'network error' }
    }
  }
  // 主模型仍失败 → 回退模型
  if (fallbackModel && fallbackModel !== model) {
    try {
      const r = await attempt(fallbackModel)
      if (r.ok) return { ok: true, text: await r.text() }
      last = { status: r.status, raw: await r.text() }
    } catch {
      /* 回退也失败则返回 last */
    }
  }
  return { ok: false, status: last?.status ?? 500, raw: last?.raw ?? 'unknown' }
}

export function gradeApiPlugin(): Plugin {
  return {
    name: 'g7math-grade-api',
    configureServer(server: ViteDevServer) {
      const env = loadEnv(server.config.mode, server.config.root, '')

      // ---------- 讲解语音：按需 TTS 合成（错题讲解等运行时内容，按文本哈希缓存） ----------
      const ttsCache = new Map<string, Buffer>()
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/tts' || req.method !== 'POST') return next()
        const apiKey = env.TTS_API_KEY
        if (!apiKey) {
          send(res, 503, { error: '未配置 TTS。请在 app/.env 填写 TTS_API_KEY 后重启开发服务。' })
          return
        }
        try {
          const { text } = await readJson(req)
          if (!text || typeof text !== 'string') {
            send(res, 400, { error: '缺少 text' })
            return
          }
          const clipped = text.slice(0, 800)
          let buf = ttsCache.get(clipped)
          if (!buf) {
            const r = await fetch(`${env.TTS_BASE_URL || 'https://api.minimax.chat'} /v1/t2a_v2`.replace(' /', '/'), {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: env.TTS_MODEL || 'speech-02-hd',
                text: clipped,
                stream: false,
                voice_setting: {
                  voice_id: env.TTS_VOICE || 'male-qn-jingying',
                  speed: Number(env.TTS_SPEED || 1.15),
                  vol: 1.0,
                  pitch: Number(env.TTS_PITCH || 0),
                },
                audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3', channel: 1 },
              }),
              signal: AbortSignal.timeout(120_000),
            })
            const data = (await r.json()) as { data?: { audio?: string } }
            if (!data.data?.audio) {
              send(res, 502, { error: 'TTS 合成失败' })
              return
            }
            buf = Buffer.from(data.data.audio, 'hex')
            ttsCache.set(clipped, buf)
          }
          res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Content-Length': buf.length,
            'Cache-Control': 'no-store',
          })
          res.end(buf)
        } catch (e) {
          send(res, 500, { error: `TTS 出错：${(e as Error).message}` })
        }
      })

      // ---------- 讲解词生成：把题库思路引导改写成口语化讲授（点题眼、抛问题、有衔接） ----------
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/gen-narration' || req.method !== 'POST') return next()
        const apiKey = env.DIAGNOSE_API_KEY || env.GRADE_API_KEY
        const base = (env.DIAGNOSE_BASE_URL || env.GRADE_BASE_URL || '').replace(/\/$/, '')
        const model = env.DIAGNOSE_MODEL || env.GRADE_MODEL || 'glm-5.3'
        if (!apiKey) {
          send(res, 503, { error: '未配置模型。' })
          return
        }
        try {
          const b = await readJson(req)
          const unknownReason = !b.standardErrorReason || String(b.standardErrorReason).includes('看不出') || String(b.standardErrorReason).includes('错误原因未知')
          const prompt = [
            '你是经验丰富的初一数学老师，正在给一个做错题的学生一对一讲题（讲解会被转成语音播放）。请把下面的题和思路引导，改写成【口语化的讲授词】。',
            '',
            '写法要求（最重要）：',
            '1. 禁止逐字读题！题目就在学生屏幕上，开场只需一两句点出"这是什么类型的题、关键条件是什么"，然后抛个问题让他先自己想（如"先暂停十秒，你自己打算从哪儿下手？"）。',
            '2. 像老师一样抛问题推进："你发现了吗？""下一步该干什么？""为什么不能直接加？"——每段至少一个引导问句，问完稍作停顿（用？结尾即可）。',
            '3. 段与段之间要有衔接："好，我们接着看""注意了""最后一步，别掉链子"。',
            '4. 口语化：多用"咱们""你看""是不是"，句子短，读起来像说话。全部用初一学生听得懂的话，禁止超纲术语。',
            '5. 学生答错的地方要点到，但语气鼓励不打击。',
            '6. 解答里的关键数字要保留，不得改动。',
            '',
            '输出五个部分（JSON），按讲课顺序：',
            'intro：开场点题型和关键条件 + 抛"先自己想"的问题。（60~100字）',
            'compare：公布他的答案和正确答案，制造"差在哪"的悬念。（40~80字）',
            'reason：错在哪里。' + (unknownReason ? '学生的错误原因未知（诚实说明看不出，别瞎猜），一句话带过，直接引出"我们顺着正确思路走一遍"。' : '结合下面的错因说明，用口语讲清楚，并顺势引出正确思路。') + '（40~90字）',
            'guide：讲解主体——把思路引导改成带抛问题的口语讲授，一步步带着走，每步讲"为什么这么做"。（180~300字）',
            'closing：收尾——这类题的通用思路 + 鼓励 + "一会儿换数字再练一道"。（50~90字）',
            '',
            '只输出 JSON：{"intro":"…","compare":"…","reason":"…","guide":"…","closing":"…"}',
            '',
            `题目：${b.stem}`,
            `正确答案：${b.standardAnswer}`,
            `标准解答：${b.standardSolution}`,
            b.guidance ? `思路引导素材（改写成口语，别照抄）：${b.guidance}` : '',
            `学生当时的答案：${b.studentAnswer || '（未作答）'}`,
            unknownReason ? '' : `错因分析：${b.standardErrorReason}`,
          ]
            .filter(Boolean)
            .join('\n')

          const ask = () =>
            fetch(`${base}/chat/completions`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.4 }),
              signal: AbortSignal.timeout(300_000),
            })
          let r
          try {
            r = await ask()
          } catch {
            r = await ask()
          }
          if (!r.ok) throw new Error(`模型返回 ${r.status}`)
          const data = (await r.json()) as { choices?: { message?: { content?: string } }[] }
          const text = data.choices?.[0]?.message?.content ?? ''
          const jsonText = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
          const narr = JSON.parse(jsonText) as Record<string, string>
          for (const k of ['intro', 'compare', 'reason', 'guide', 'closing']) {
            if (!narr[k] || typeof narr[k] !== 'string') throw new Error(`字段缺失：${k}`)
          }
          send(res, 200, { narration: narr })
        } catch (e) {
          send(res, 500, { error: `讲解词生成失败：${(e as Error).message}` })
        }
      })

      // ---------- 动态变式生成：静态变式枯竭时现场出题（glm-5.3 生成 + flash 审查） ----------
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/gen-variant' || req.method !== 'POST') return next()
        const apiKey = env.DIAGNOSE_API_KEY || env.GRADE_API_KEY
        const base = (env.DIAGNOSE_BASE_URL || env.GRADE_BASE_URL || '').replace(/\/$/, '')
        const genModel = env.DIAGNOSE_MODEL || env.GRADE_MODEL || 'glm-5.3'
        const auditModel = env.GRADE_MODEL || genModel
        if (!apiKey) {
          send(res, 503, { error: '未配置模型。请在 app/.env 填写后重启开发服务。' })
          return
        }
        try {
          const b = await readJson(req)
          const ask = (model: string, content: string, temperature = 0.7) =>
            fetch(`${base}/chat/completions`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model,
                messages: [{ role: 'user', content }],
                temperature,
              }),
              signal: AbortSignal.timeout(300_000),
            })

          const genPrompt = [
            '你是初一数学出题老师。参照原题出一道同构变式题：考点、题型、难度、解法结构完全一致，只换数字或情境。',
            '',
            `原题（题型 ${b.type}）：${b.stem}`,
            b.options?.length ? `原选项：${(b.options as string[]).join('  ')}` : '',
            `原答案：${b.standardAnswer}`,
            `原解答：${b.standardSolution}`,
            b.pointNames ? `考点知识点：${b.pointNames}` : '',
            '',
            '要求：',
            '1. 新题数字合理（运算干净、结果不怪），条件自洽，答案唯一且正确。',
            '2. 解答分步写清楚（每步一行，用 1. 2. 3. 编号）。',
            '3. 同时写"思路引导"：首句总说考什么和往哪想；然后分步讲"为什么这么想"（策略口诀+观察+原理，数字用新题的）；最后一句收尾（别解法或通法）。120~220字，初一学生能懂，禁止超纲术语。',
            '4. 选择题给 4 个选项，正确答案写字母。',
            `5. 只输出 JSON：{"stem":"题干","options":${b.type === 'choice' ? '["A...","B...","C...","D..."]' : 'null'},"answer":"答案","solution":"分步解答","guidance":"思路引导"}`,
          ]
            .filter(Boolean)
            .join('\n')

          const genOnce = async () => {
            const r = await ask(genModel, genPrompt)
            if (!r.ok) throw new Error(`生成模型返回 ${r.status}`)
            const data = (await r.json()) as { choices?: { message?: { content?: string } }[] }
            const text = data.choices?.[0]?.message?.content ?? ''
            const jsonText = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
            const v = JSON.parse(jsonText) as {
              stem?: string
              options?: (string | null)[] | null
              answer?: string
              solution?: string
              guidance?: string
            }
            if (!v.stem || !v.answer || !v.solution) throw new Error('生成结果字段缺失')
            if (b.type === 'choice') {
              const opts = (v.options ?? []).filter((x): x is string => !!x)
              if (opts.length !== 4) throw new Error('选择题选项不足 4 个')
              if (!/^[A-D]$/.test(String(v.answer).trim())) throw new Error('选择题答案不是 A-D')
              v.options = opts
            } else {
              v.options = undefined
            }
            return v
          }

          let variant: Awaited<ReturnType<typeof genOnce>> | null = null
          let auditFail = ''
          for (let attempt = 0; attempt < 2; attempt++) {
            variant = await genOnce()
            // 审查：答案正确性 + 同构 + 初一范围（用快模型）
            const auditPrompt = [
              '你是初一数学审题老师，审查这道新出的变式题，只输出 JSON。',
              `原题：${b.stem}`,
              `原答案：${b.standardAnswer}`,
              '',
              `新题：${variant.stem}`,
              variant.options?.length ? `新选项：${variant.options.join('  ')}` : '',
              `新答案：${variant.answer}`,
              `新解答：${variant.solution}`,
              '',
              '审查三条，任一不过即 ok=false：',
              '1. 新题条件自洽、答案正确（自己算一遍）。',
              '2. 与原题同构：考点、解法结构一致，只是数字/情境不同。',
              '3. 初一学生能做：无超纲知识。',
              '只输出 {"ok":true} 或 {"ok":false,"reason":"一句话"}',
            ]
              .filter(Boolean)
              .join('\n')
            const auditOnce = async () => {
              const ar = await ask(auditModel, auditPrompt, 0.1)
              if (!ar.ok) throw new Error(`审查模型返回 ${ar.status}`)
              const ad = (await ar.json()) as { choices?: { message?: { content?: string } }[] }
              const at = ad.choices?.[0]?.message?.content ?? ''
              return JSON.parse(at.slice(at.indexOf('{'), at.lastIndexOf('}') + 1)) as { ok?: boolean; reason?: string }
            }
            try {
              const aj = await auditOnce()
              if (aj.ok) {
                auditFail = ''
                break
              }
              auditFail = aj.reason || '审查未通过'
            } catch (ae) {
              // 审查模型限流/网络故障：重试一次，仍失败则放行（结构校验已过，不作拦阻）
              try {
                const aj = await auditOnce()
                if (aj.ok) {
                  auditFail = ''
                  break
                }
                auditFail = aj.reason || '审查未通过'
              } catch {
                auditFail = ''
                break
              }
            }
          }
          if (auditFail || !variant) {
            send(res, 502, { error: `变式审查未通过：${auditFail || '未知错误'}` })
            return
          }
          send(res, 200, { variant })
        } catch (e) {
          send(res, 500, { error: `生成失败：${(e as Error).message}` })
        }
      })

      // ---------- 错因诊断：规则未命中时的模型兜底（可独立配置 DIAGNOSE_*，回退 GRADE_*） ----------
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/diagnose' || req.method !== 'POST') return next()
        const apiKey = env.DIAGNOSE_API_KEY || env.GRADE_API_KEY || env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY
        const base = (env.DIAGNOSE_BASE_URL || env.GRADE_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, '')
        const textModel = env.DIAGNOSE_MODEL || env.GRADE_MODEL || 'deepseek-chat'
        if (!apiKey) {
          send(res, 503, { error: '未配置模型。请在 app/.env 填写 GRADE_API_KEY 后重启开发服务。' })
          return
        }
        try {
          const body = await readJson(req) as {
            stem?: string
            standardAnswer?: string
            userAnswer?: string
            skills?: Record<string, string>
          }
          if (!body.stem || !body.standardAnswer || !body.userAnswer) {
            send(res, 400, { error: '缺少参数' })
            return
          }
          const skills = body.skills ?? {}
          const skillList = Object.entries(skills)
            .map(([k, v]) => `- ${k}：${v}`)
            .join('\n')
          const prompt = [
            '你是经验丰富的初中数学老师。下面是一道计算题，学生给出了错误答案。',
            '请推断学生**最可能**犯的错误，并归类到给定的技能标签中。',
            '',
            `题目：${body.stem}`,
            `正确答案：${body.standardAnswer}`,
            `学生答案：${body.userAnswer}`,
            '',
            '可选技能标签：',
            skillList || '（无）',
            '- other：以上都不是（如纯粹粗心、抄错数字）',
            '',
            '要求：',
            '1. skill 字段从上面的标签 key 中选一个；拿不准选 other。',
            '2. reason 用一句话（40 字以内）说明学生可能错在哪，语气友善，给初中生看。',
            '3. 只用初一学生已经学过的说法，不要使用任何超纲术语（如"数论""同余""模运算"等）。',
            '4. 如果从学生答案看不出可靠的错误原因，就诚实地说无法确定（reason 写"从你的答案暂时看不出错在哪一步。"），不要硬猜。',
            '5. 只输出 JSON：{"skill":"标签key","reason":"一句话"}',
          ].join('\n')
          const ask = () =>
            fetch(`${base}/chat/completions`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: textModel,
                temperature: 0,
                messages: [
                  { role: 'system', content: '你只输出 JSON。' },
                  { role: 'user', content: prompt },
                ],
              }),
              signal: AbortSignal.timeout(120_000),
            })
          let upstream: Response
          try {
            upstream = await ask()
          } catch {
            // 网络抖动重试一次
            upstream = await ask()
          }
          const raw = await upstream.text()
          if (!upstream.ok) {
            send(res, 502, { error: `诊断模型返回 ${upstream.status}：${raw.slice(0, 200)}` })
            return
          }
          const data = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] }
          const text = data.choices?.[0]?.message?.content ?? ''
          const jsonText = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
          const judged = JSON.parse(jsonText) as { skill?: string; reason?: string }
          const skillKey = judged.skill && (skills[judged.skill] || judged.skill === 'other') ? judged.skill : 'other'
          send(res, 200, {
            skill: skillKey,
            reason: String(judged.reason || '').slice(0, 120) || '未能确定具体错因，请对照解析检查。',
          })
        } catch (e) {
          send(res, 500, { error: e instanceof Error ? e.message : '诊断失败' })
        }
      })

      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/grade' || req.method !== 'POST') return next()
        const apiKey = env.GRADE_API_KEY || env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY
        const base = (env.GRADE_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, '')
        const textModel = env.GRADE_MODEL || 'deepseek-chat'
        const visionModel = env.GRADE_VISION_MODEL || 'deepseek-v4-flash-vision-exp'
        if (!apiKey) {
          send(res, 503, { error: '未配置批改模型。请在 app/.env 填写 GRADE_API_KEY 后重启开发服务。' })
          return
        }
        try {
          const body = await readJson(req)
          const images = (body.images ?? []).filter((s) => typeof s === 'string' && s.startsWith('data:image/')).slice(0, 4)
          const rules = images.length
            ? [
                '你是七年级数学阅卷老师。学生交了手写照片，照片是批改依据，文字框只是学生自己整理的摘要。',
                '规则：',
                '1. 先读照片里的最终答案和解题过程，再对照标准答案和标准解析。',
                '2. 照片和文字框不一致时，以照片为准。',
                '3. 接受等价写法，例如 1/2 与 0.5、(-1,2) 与 -1<x<2。',
                '4. 照片模糊、缺页或无法确认最终答案时，不要猜测，unreadable 设为 true，correct 设为 false。',
                '5. reason 用初一学生能听懂的大白话，不用任何超纲术语。',
                '6. 判错时，如果看不出学生具体错在哪一步，reason 就直说"错误原因未知，请对照解析从第一步检查"，不要猜。',
                '7. 只输出 JSON：{"correct":true或false,"unreadable":true或false,"reason":"不超过80字"}。',
              ]
            : [
                '你是七年级数学阅卷老师。只判断这道非客观题的最终答案是否正确，并给出一句简短理由。',
                '规则：',
                '1. 对照标准答案和标准解析，接受等价写法，例如 1/2 与 0.5、(-1,2) 与 -1<x<2、带或不带题号。',
                '2. 学生的解题过程用来判断是否真的做出了该结果；最终答案正确且过程没有明显矛盾则判对。',
                '3. 最终答案错误则判错，即使过程里有部分步骤对。',
                '4. reason 用初一学生能听懂的大白话，不用任何超纲术语。',
                '5. 判错时，如果看不出学生具体错在哪一步，reason 就直说"错误原因未知，请对照解析从第一步检查"，不要猜。',
                '6. 只输出 JSON：{"correct":true或false,"unreadable":false,"reason":"不超过80字"}。',
              ]
          const prompt = [
            ...rules,
            '',
            `题目：\n${body.stem || ''}`,
            `标准答案：\n${body.standardAnswer || ''}`,
            `标准解析：\n${body.standardSolution || ''}`,
            body.rubric?.length ? `评分要点：\n${body.rubric.join('\n')}` : '',
            `学生文字框中的最终答案（不是批改依据）：\n${body.studentAnswer || '（未填）'}`,
            `学生文字框中的解题过程（不是批改依据）：\n${body.studentWork || '（未写）'}`,
            images.length ? '手写照片在后面，请以照片为准。' : '',
          ].filter(Boolean).join('\n\n')

          const content = images.length
            ? [
                { type: 'text', text: prompt },
                ...images.map((url) => ({ type: 'image_url', image_url: { url } })),
              ]
            : prompt

          const result = await callChat(base, apiKey, images.length ? visionModel : textModel, {
            temperature: 0,
            messages: [
              { role: 'system', content: '你只输出 JSON。' },
              { role: 'user', content },
            ],
          }, env.GRADE_FALLBACK_MODEL || 'glm-5.3')
          if (!result.ok) {
            send(res, 502, { error: `批改模型返回 ${result.status}：${result.raw.slice(0, 240)}` })
            return
          }
          const raw = result.text
          const data = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] }
          const text = data.choices?.[0]?.message?.content ?? ''
          const jsonText = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
          const judged = JSON.parse(jsonText) as { correct?: boolean; unreadable?: boolean; reason?: string }
          send(res, 200, {
            correct: judged.unreadable ? false : judged.correct === true,
            unreadable: judged.unreadable === true,
            reason: String(judged.reason || '').slice(0, 200),
          })
        } catch (e) {
          send(res, 500, { error: e instanceof Error ? e.message : '批改失败' })
        }
      })
    },
  }
}
