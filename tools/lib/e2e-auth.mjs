/**
 * e2e 测试登录 helper（2026-10 用户系统上线后使用）。
 *
 * 应用现在的登录态由后端会话（cookie）决定，直接注入 g7math.session.v1
 * 在「后端在线」时会被 /api/me 的 401 清掉。此 helper 统一处理两种情况：
 *
 * - 后端在线：用固定测试密码真实登录（首次自动注册，开发模式验证码直接返回），
 *   cookie 写入浏览器上下文；localStorage 会话也照写，保持与应用约定一致。
 * - 后端离线（本地只起了 vite 没起 server）：退回纯 localStorage 注入，
 *   应用走离线回退，测试照旧可跑。
 */
const E2E_PASSWORD = 'e2e-test-12345'

export async function e2eLogin(page, phone, name) {
  const mode = await page.evaluate(
    async ([phone, name, password]) => {
      const post = async (path, body) => {
        const r = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        let data = null
        try {
          data = await r.json()
        } catch {
          /* 代理错误返回的是文本 */
        }
        return { status: r.status, data }
      }

      let login
      try {
        login = await post('/api/auth/login', { phone, password })
      } catch {
        return 'offline'
      }
      // vite 代理连不上后端 → 本地离线开发，走 localStorage 回退
      if (login.status >= 500) return 'offline'
      if (login.status !== 200) {
        const send = await post('/api/auth/sms/send', { phone, purpose: 'register' })
        const code = send.data?.devCode
        if (!code) throw new Error(`拿不到验证码：${send.data?.error ?? send.status}`)
        const reg = await post('/api/auth/register', { phone, code, password, name })
        if (reg.status !== 200) throw new Error(`注册失败：${reg.data?.error ?? reg.status}`)
      }
      localStorage.setItem('g7math.session.v1', JSON.stringify({ phone, name }))
      return 'server'
    },
    [phone, name, E2E_PASSWORD],
  )
  return mode
}
