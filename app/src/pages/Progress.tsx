import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Badge2 } from '../components/icons'
import { Badge, Card, Stat } from '../components/ui'
import { allChapters, allPoints, useCurriculum } from '../lib/data'
import { formatDuration, isSlow } from '../lib/grading'
import { exportData, importData, resetAll, useAppData } from '../lib/store'

export default function ProgressPage() {
  const data = useAppData()
  const { curriculum } = useCurriculum()
  const points = allPoints(curriculum)
  const chapters = allChapters(curriculum)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const rounds = Object.values(data.rounds).sort((a, b) => b.startedAt - a.startedAt)
  const totalAnswered = rounds.reduce((s, r) => s + r.answers.length, 0)
  const totalWrong = rounds.reduce((s, r) => s + r.wrongQuestionIds.length, 0)
  const totalSlow = rounds.reduce((s, r) => s + r.slowQuestionIds.length, 0)
  const studied = Object.keys(data.studied).length
  const mastered = Object.values(data.loops).filter((l) => l.status === 'mastered').length
  const totalTime = rounds.reduce((s, r) => s + (r.totalMs || 0), 0)

  // 知识点视角：反复出错的知识点
  const pointStats = new Map<string, { wrong: number; slow: number; seen: number }>()
  for (const r of rounds) {
    for (const a of r.answers) {
      const q = r.exam.questions.find((x) => x.id === a.questionId)
      if (!q) continue
      for (const pid of q.pointIds) {
        const st = pointStats.get(pid) ?? { wrong: 0, slow: 0, seen: 0 }
        st.seen += 1
        if (!a.correct) st.wrong += 1
        if (isSlow(a.durationMs, q.estimatedSeconds)) st.slow += 1
        pointStats.set(pid, st)
      }
    }
  }
  const weakest = Array.from(pointStats.entries())
    .filter(([, v]) => v.wrong > 0 || v.slow > 0)
    .sort((a, b) => b[1].wrong * 2 + b[1].slow - (a[1].wrong * 2 + a[1].slow))
    .slice(0, 12)

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h1 className="text-lg font-semibold">学习报告</h1>
        <p className="mt-1 text-sm text-gray-500">
          汇总全部考评与专项练习数据，定位长期薄弱的知识点，并记录自适应循环的完成情况。
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="课件学习" value={`${studied} / ${points.size || '—'}`} hint="已学知识点" tone="blue" />
        <Stat label="考评总题数" value={totalAnswered} hint={`共 ${rounds.length} 轮`} />
        <Stat label="累计错题" value={totalWrong} tone={totalWrong ? 'red' : 'green'} hint="含专项练习" />
        <Stat label="累计耗时标记" value={totalSlow} tone={totalSlow ? 'amber' : 'green'} />
        <Stat label="已掌握章节" value={`${mastered} / ${chapters.length || '—'}`} tone="green" />
        <Stat label="累计作答用时" value={formatDuration(totalTime)} />
        <Stat label="平均每轮用时" value={rounds.length ? formatDuration(totalTime / rounds.length) : '—'} />
        <Stat label="待提升知识点" value={weakest.length} tone={weakest.length ? 'amber' : 'green'} />
      </div>

      {weakest.length > 0 && (
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <AlertTriangle /> 长期薄弱知识点（按出错与超时综合排序）
          </h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {weakest.map(([pid, st]) => {
              const p = points.get(pid)
              return (
                <Link
                  key={pid}
                  to={`/lesson/${pid}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2.5 hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-gray-800">{p?.name ?? pid}</span>
                    <span className="text-xs text-gray-400">
                      作答 {st.seen} 次 · 错 {st.wrong} 次 · 超时 {st.slow} 次
                    </span>
                  </span>
                  <span className="ml-2 shrink-0 text-xs text-blue-600">去复习 →</span>
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-800">考评历史</h2>
        {rounds.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">暂无记录。</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="py-2 text-left font-normal">时间</th>
                  <th className="py-2 text-left font-normal">章节 / 轮次</th>
                  <th className="py-2 text-left font-normal">类型</th>
                  <th className="py-2 text-right font-normal">正确</th>
                  <th className="py-2 text-right font-normal">错题</th>
                  <th className="py-2 text-right font-normal">超时</th>
                  <th className="py-2 text-right font-normal">用时</th>
                  <th className="py-2 text-right font-normal"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rounds.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 text-xs text-gray-500">
                      {new Date(r.startedAt).toLocaleString('zh-CN', { hour12: false })}
                    </td>
                    <td className="py-2 text-gray-700">
                      第 {r.round} 轮 · {r.chapterTitle}
                    </td>
                    <td className="py-2">
                      <Badge tone={r.kind === 'exam' ? 'blue' : 'violet'}>
                        {r.kind === 'exam' ? '考评' : '专项'}
                      </Badge>
                    </td>
                    <td className="py-2 text-right tabular-nums text-gray-700">
                      {r.answers.filter((a) => a.correct).length}/{r.answers.length}
                    </td>
                    <td className="py-2 text-right tabular-nums text-red-600">{r.wrongQuestionIds.length}</td>
                    <td className="py-2 text-right tabular-nums text-amber-600">{r.slowQuestionIds.length}</td>
                    <td className="py-2 text-right tabular-nums text-gray-500">
                      {formatDuration(r.totalMs || 0)}
                    </td>
                    <td className="py-2 text-right">
                      <Link to={`/report/${r.id}`} className="text-xs text-blue-600 hover:underline">
                        查看
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-800">数据管理</h2>
        <p className="mt-1 text-xs text-gray-500">
          学习数据保存在本机浏览器（localStorage）中，可导出为 JSON 备份或迁移。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="btn"
            onClick={() => {
              const blob = new Blob([exportData()], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `七年级数学学习数据-${new Date().toISOString().slice(0, 10)}.json`
              a.click()
            }}
          >
            导出学习数据
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            导入学习数据
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const ok = importData(await f.text())
              setMsg(ok ? '导入成功。' : '导入失败：文件格式不正确。')
              e.target.value = ''
            }}
          />
          <button
            className="btn !text-red-600"
            onClick={() => {
              if (confirm('确定要清空全部学习数据吗？此操作不可撤销。')) {
                resetAll()
                setMsg('已清空全部学习数据。')
              }
            }}
          >
            清空学习数据
          </button>
        </div>
        {msg && <div className="mt-2 text-xs text-gray-600">{msg}</div>}
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Badge2 /> 关于本工具
        </h2>
        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-gray-600">
          <li>· 课程大纲依据国家中小学智慧教育平台（basic.smartedu.cn）人教版（2024）七年级数学上、下册。</li>
          <li>· 题库与课件融合《探究应用新思维·七年级数学》（黄东坡）的探究与应用方法，部分题目取自该书并标注来源。</li>
          <li>· 计时口径：每题的起点为上一题的提交时刻（首题为考评开始时刻），终点为本人的提交并上传成功时刻。</li>
          <li>· 耗时标记规则：实际耗时 − 预计耗时 &gt; 1 分钟才标记，小于等于 1 分钟不标记。</li>
          <li>· 自适应循环：考评 → 错因分析 / 专项讲解 → 专项练习 → 再次分析，直到没有错题与耗时问题。</li>
        </ul>
      </Card>
    </div>
  )
}
