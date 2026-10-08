import { useState } from 'react'
import { login } from '../lib/auth'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    const result = login(phone, name)
    if (!result.ok) setError(result.message)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-5">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm text-white">七</span>
          七年级数学学习工具
        </div>
        <p className="mt-2 text-sm text-gray-500">
          用手机号登录。每个手机号是一个独立用户，考评、课件进度和错题都只保存在这个用户下。
        </p>
        <div className="mt-5 space-y-3">
          <label className="block text-sm text-gray-700">
            手机号
            <input
              className="mt-1"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="11 位手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </label>
          <label className="block text-sm text-gray-700">
            姓名（可选）
            <input
              className="mt-1"
              placeholder="不填则显示手机号"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </label>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="button" className="btn btn-primary w-full" onClick={submit}>
            登录
          </button>
          <p className="text-xs text-gray-400">
            学习数据保存在本机浏览器中。同一台电脑上换手机号登录，会进入另一个用户的记录。
          </p>
        </div>
      </div>
    </div>
  )
}
