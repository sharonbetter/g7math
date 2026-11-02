import { useMemo } from 'react'
import { ExplainPlayer } from '../components/ExplainPlayer'
import { buildExplainScenes } from '../lib/explain'
import { useExam } from '../lib/data'
import { Empty } from '../components/ui'

/**
 * 错题讲解样例（MVP 验证页）：
 * 真实考题（7a-c2）+ 模拟错答/诊断，走完整链路（场景拼装 → 按需 TTS → 播放）。
 * 验证通过后，正式入口接在考评报告页。
 */
export default function ExplainDemo() {
  const { exam } = useExam('7a-c2')

  const scenes = useMemo(() => {
    if (!exam) return null
    const byId = new Map(exam.questions.map((q) => [q.id, q]))
    const e14 = byId.get('7a-c2-e14')
    const e10 = byId.get('7a-c2-e10')
    const e12 = byId.get('7a-c2-e12')
    if (!e14 || !e10 || !e12) return null
    return buildExplainScenes({
      chapterTitle: '第二章 有理数的运算 · 第 1 轮考评',
      wrongs: [
        {
          q: e14,
          userAnswer: '-17',
          spentSeconds: 96,
          diag: {
            skill: '符号处理',
            reason: '减法统一成加法时，"减去 -12"应写成"+12"，你把它当成了"-12"，末项符号没有翻转。',
          },
        },
        {
          q: e10,
          userAnswer: '50',
          spentSeconds: 210,
          // 错因未知（诊断未命中）：演示"直接从正确思路讲解"的分支
          diag: null,
        },
      ],
      slows: [{ q: e12, spentSeconds: 246, estimatedSeconds: e12.estimatedSeconds }],
      weakPointNames: ['有理数的加减混合运算', '符号处理'],
    })
  }, [exam])

  if (!exam) return <Empty title="加载考题中…" />
  if (!scenes) return <Empty title="样例题缺失" />
  return <ExplainPlayer scenes={scenes} onClose={() => window.history.back()} />
}
