/** 统一的后端 API 访问：JSON、错误消息提取、网络异常归一 */
export class ApiError extends Error {
  status: number
  /** 非预期响应体（如 409 冲突时携带的云端数据） */
  body: Record<string, unknown> | null

  constructor(status: number, message: string, body: Record<string, unknown> | null = null) {
    super(message)
    this.status = status
    this.body = body
  }

  /** 后端不可达（网络断开 / 代理失败） */
  get unreachable(): boolean {
    return this.status === 0 || this.status >= 500
  }
}

export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method: opts.method ?? 'GET',
      headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new ApiError(0, '无法连接服务器')
  }
  const text = await res.text()
  let json: Record<string, unknown> | null = null
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : null
  } catch {
    json = null
  }
  if (!res.ok) {
    // 5xx 且无 JSON 错误体 = vite 代理连不上后端（后端未启动），给出可操作的提示
    const unreachable = res.status >= 500 && !json?.error
    throw new ApiError(
      res.status,
      unreachable ? '无法连接服务器，请确认后端已启动（cd server && npm run dev）' : typeof json?.error === 'string' ? json.error : `请求失败（${res.status}）`,
      json,
    )
  }
  return json as T
}
