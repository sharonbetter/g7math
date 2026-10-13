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

export function gradeApiPlugin(): Plugin {
  return {
    name: 'g7math-grade-api',
    configureServer(server: ViteDevServer) {
      const env = loadEnv(server.config.mode, server.config.root, '')

      // ---------- 错因诊断：规则未命中时的模型兜底 ----------
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/diagnose' || req.method !== 'POST') return next()
        const apiKey = env.GRADE_API_KEY || env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY
        const base = (env.GRADE_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, '')
        const textModel = env.GRADE_MODEL || 'deepseek-chat'
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
            '3. 只输出 JSON：{"skill":"标签key","reason":"一句话"}',
          ].join('\n')
          const upstream = await fetch(`${base}/chat/completions`, {
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
          })
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
                '5. 只输出 JSON：{"correct":true或false,"unreadable":true或false,"reason":"不超过80字"}。',
              ]
            : [
                '你是七年级数学阅卷老师。只判断这道非客观题的最终答案是否正确，并给出一句简短理由。',
                '规则：',
                '1. 对照标准答案和标准解析，接受等价写法，例如 1/2 与 0.5、(-1,2) 与 -1<x<2、带或不带题号。',
                '2. 学生的解题过程用来判断是否真的做出了该结果；最终答案正确且过程没有明显矛盾则判对。',
                '3. 最终答案错误则判错，即使过程里有部分步骤对。',
                '4. 只输出 JSON：{"correct":true或false,"unreadable":false,"reason":"不超过80字"}。',
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

          const upstream = await fetch(`${base}/chat/completions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: images.length ? visionModel : textModel,
              temperature: 0,
              messages: [
                { role: 'system', content: '你只输出 JSON。' },
                { role: 'user', content },
              ],
            }),
          })
          const raw = await upstream.text()
          if (!upstream.ok) {
            send(res, 502, { error: `批改模型返回 ${upstream.status}：${raw.slice(0, 240)}` })
            return
          }
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
