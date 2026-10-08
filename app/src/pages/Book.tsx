import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Card, Empty } from '../components/ui'
import { bookPageImage, useBookIndex, useTextFile } from '../lib/data'
import type { BookUnit } from '../types'

function UnitViewer({ unit }: { unit: BookUnit }) {
  const [tab, setTab] = useState<'pages' | 'text'>('pages')
  const [page, setPage] = useState(unit.pdfStart)
  const [showText, setShowText] = useState(false)
  const text = useTextFile(showText ? unit.textFile : undefined)

  useEffect(() => {
    setPage(unit.pdfStart)
  }, [unit])

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-gray-400">{unit.category}</div>
            <h2 className="text-[15px] font-semibold text-gray-900">
              {unit.no !== '探究' && unit.no !== '-' ? `${unit.no} ` : ''}
              {unit.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <Badge tone={unit.kind === 'explore' ? 'violet' : 'blue'}>
                {unit.kind === 'explore' ? '探究专题' : unit.kind === 'answers' ? '参考答案' : '讲次'}
              </Badge>
              <span>
                书内第 {unit.printedStart}–{unit.printedEnd} 页
              </span>
              <span className="text-gray-400">（PDF 第 {unit.pdfStart}–{unit.pdfEnd} 页）</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              className={`btn !py-1.5 !text-xs ${tab === 'pages' ? 'btn-primary' : ''}`}
              onClick={() => setTab('pages')}
            >
              原页图像
            </button>
            <button
              className={`btn !py-1.5 !text-xs ${tab === 'text' ? 'btn-primary' : ''}`}
              onClick={() => {
                setTab('text')
                setShowText(true)
              }}
            >
              OCR 文本
            </button>
          </div>
        </div>
      </Card>

      {tab === 'pages' ? (
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <button
              className="btn !py-1.5 !text-xs"
              disabled={page <= unit.pdfStart}
              onClick={() => setPage((p) => Math.max(unit.pdfStart, p - 1))}
            >
              ← 上一页
            </button>
            <span className="text-xs text-gray-500">
              书内第 {page - 7} 页 · PDF 第 {page} 页（共 {unit.pdfEnd - unit.pdfStart + 1} 页）
            </span>
            <button
              className="btn !py-1.5 !text-xs"
              disabled={page >= unit.pdfEnd}
              onClick={() => setPage((p) => Math.min(unit.pdfEnd, p + 1))}
            >
              下一页 →
            </button>
          </div>
          <div className="mt-3 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
            <img
              src={bookPageImage(page)}
              alt={`《探究应用新思维·七年级数学》书内第 ${page - 7} 页`}
              className="mx-auto max-w-full"
              loading="lazy"
            />
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            图像来自原书扫描页，可用于核对题库中「源自《探究应用新思维》」题目的原文与图形。
          </p>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="mb-2 text-xs text-gray-500">
            OCR 文本（数学公式识别有误差，仅作检索线索，准确内容请对照原页图像）
          </div>
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-[13px] leading-relaxed text-gray-700">
            {text || '正在加载…'}
          </pre>
        </Card>
      )}
    </div>
  )
}

export default function BookPage() {
  const index = useBookIndex()
  const { unitId } = useParams()
  const [selected, setSelected] = useState<string | null>(unitId ?? null)

  const groups = useMemo(() => {
    const m = new Map<string, BookUnit[]>()
    index?.units.forEach((u) => {
      const arr = m.get(u.category) ?? []
      arr.push(u)
      m.set(u.category, arr)
    })
    return Array.from(m.entries())
  }, [index])

  const current = index?.units.find((u) => u.id === selected) ?? null

  if (!index)
    return <Card className="p-6 text-sm text-gray-500">正在加载《探究应用新思维·七年级数学》索引…</Card>

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h1 className="text-lg font-semibold">《{index.book}》知识索引</h1>
        <p className="mt-1 text-sm text-gray-500">
          原书为 {index.pdfPages} 页扫描件，已用 macOS Vision 逐页 OCR 并按目录切分为 {index.units.length}{' '}
          个讲次。此处可浏览每一讲的<b>原页图像</b>与 OCR 文本；题库中标注「源自《探究应用新思维》」的题目
          均可在此核对原文与图形。
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <Card className="max-h-[75vh] overflow-auto p-3">
          {groups.map(([cat, units]) => (
            <div key={cat} className="mb-3">
              <div className="px-2 py-1 text-xs font-medium text-gray-400">{cat}</div>
              <div className="space-y-0.5">
                {units.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelected(u.id)}
                    className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] transition ${
                      selected === u.id
                        ? 'bg-blue-50 font-medium text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="line-clamp-1">
                      {u.no !== '探究' && u.no !== '-' ? `${u.no} ` : ''}
                      {u.title}
                    </span>
                    <span className="text-xs text-gray-400">第 {u.printedStart} 页起</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <div>
          {current ? (
            <UnitViewer unit={current} />
          ) : (
            <Empty
              title="请选择左侧的讲次"
              hint={
                <>
                  也可以直接去 <Link to="/exams" className="text-blue-600">章节考评</Link>{' '}
                  做题，题目页面会标注来源讲次与页码。
                </>
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
