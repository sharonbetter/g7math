/**
 * 错因诊断的模型兜底：规则未命中时调用 /api/diagnose（服务端代理 GLM 等模型）。
 * 结果按「题目+错答」缓存到 localStorage，同一错答不重复调用。
 */

export interface DiagnoseResult {
  skill: string
  reason: string
}

const CACHE_KEY = 'g7math.diagnose.cache.v1'
const CACHE_LIMIT = 500

type Cache = Record<string, DiagnoseResult>

function readCache(): Cache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Cache
  } catch {
    return {}
  }
}

function writeCache(cache: Cache) {
  try {
    const keys = Object.keys(cache)
    if (keys.length > CACHE_LIMIT) {
      for (const k of keys.slice(0, keys.length - CACHE_LIMIT)) delete cache[k]
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* 存储满时忽略 */
  }
}

/** 诊断一个错答。返回 null 表示不可用（未配置模型/网络失败/无缓存）。 */
export async function diagnoseByModel(
  stem: string,
  standardAnswer: string,
  userAnswer: string,
  skills: Record<string, string>,
): Promise<DiagnoseResult | null> {
  const key = `${stem}||${userAnswer.trim()}`
  const cache = readCache()
  if (cache[key]) return cache[key]
  try {
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stem, standardAnswer, userAnswer, skills }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as DiagnoseResult
    if (!data?.skill || !data?.reason) return null
    cache[key] = data
    writeCache(cache)
    return data
  } catch {
    return null
  }
}
