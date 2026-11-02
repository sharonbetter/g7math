import { useEffect, useRef, useState } from 'react'
import { ApiError, } from '../lib/api'
import { isValidPhone, loginWithPassword, registerWithCode, resetPasswordWithCode, sendSmsCode } from '../lib/auth'

type Mode = 'login' | 'register' | 'reset'

const TABS: { key: Mode; label: string }[] = [
  { key: 'login', label: '登录' },
  { key: 'register', label: '注册' },
  { key: 'reset', label: '找回密码' },
]

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (countdown <= 0 && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [countdown])

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setInfo('')
  }

  const startCountdown = () => {
    setCountdown(60)
    timerRef.current = setInterval(() => setCountdown((n) => n - 1), 1000)
  }

  const sendCode = async () => {
    if (!isValidPhone(phone)) {
      setError('请先输入正确的 11 位手机号')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await sendSmsCode(phone, mode === 'reset' ? 'reset' : 'register')
      startCountdown()
      if (res.devCode) {
        setCode(res.devCode)
        setInfo(`开发模式：验证码 ${res.devCode} 已自动填入`)
      } else {
        setInfo('验证码已发送，请查收短信')
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '发送失败，请稍后重试')
    } finally {
      setSending(false)
    }
  }

  const submit = async () => {
    setError('')
    setInfo('')
    if (!isValidPhone(phone)) {
      setError('请输入正确的 11 位手机号')
      return
    }
    if (mode !== 'login' && !/^\d{6}$/.test(code)) {
      setError('请输入 6 位短信验证码')
      return
    }
    if (password.length < 8) {
      setError(mode === 'login' ? '请输入密码' : '密码至少 8 位')
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        await loginWithPassword(phone, password)
      } else if (mode === 'register') {
        await registerWithCode({ phone, code, password, name: name.trim() || undefined })
      } else {
        await resetPasswordWithCode(phone, code, password)
      }
      // 成功后 session 生效，App 会自动切换到主页
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '操作失败，请稍后重试')
    } finally {
      setBusy(false)
    }
  }

  const codeField = mode !== 'login'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-10">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-sm text-white">
            七
          </span>
          七年级数学学习工具
        </div>

        <div className="mt-5 flex gap-1 rounded-xl bg-gray-100 p-1 text-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => switchMode(t.key)}
              className={`flex-1 rounded-lg px-3 py-1.5 transition ${
                mode === t.key ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <label className="block text-sm text-gray-700">
            手机号
            <input
              className="mt-1"
              type="text"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="11 位手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
            />
          </label>

          {codeField && (
            <label className="block text-sm text-gray-700">
              短信验证码
              <span className="mt-1 flex gap-2">
                <input
                  className="flex-1 min-w-0"
                  type="text"
                  inputMode="numeric"
                  placeholder="6 位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                />
                <button
                  type="button"
                  className="btn shrink-0 whitespace-nowrap text-sm"
                  disabled={countdown > 0 || sending}
                  onClick={sendCode}
                >
                  {sending ? '发送中…' : countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                </button>
              </span>
            </label>
          )}

          <label className="block text-sm text-gray-700">
            {mode === 'reset' ? '新密码' : '密码'}
            <input
              className="mt-1"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? '登录密码' : '至少 8 位'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit()
              }}
            />
          </label>

          {mode === 'register' && (
            <label className="block text-sm text-gray-700">
              姓名（可选）
              <input
                className="mt-1"
                type="text"
                placeholder="不填则显示手机号"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          {info && !error && <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-600">{info}</div>}

          <button type="button" className="btn btn-primary w-full" disabled={busy} onClick={submit}>
            {busy ? '请稍候…' : mode === 'login' ? '登录' : mode === 'register' ? '注册并登录' : '重置密码并登录'}
          </button>

          <p className="text-xs leading-relaxed text-gray-400">
            每个手机号是一个独立账号，考评、课件进度和错题都保存在账号下，换设备登录自动同步。
            {mode === 'register' && ' 未成年人请由家长协助注册。'}
          </p>
        </div>
      </div>
    </div>
  )
}
