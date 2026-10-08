import { useState } from 'react'
import { bookPageImage } from '../lib/data'
import type { QuestionSource } from '../types'

/**
 * 「源自《探究应用新思维》」题目的溯源入口：
 * 点击后弹出该书对应扫描页，便于人工核对题目原文与图形。
 */
export function BookSource({
  source,
  compact = false,
}: {
  source: QuestionSource | undefined
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  if (!source || source.kind !== 'book' || !source.pdfPage) return null
  const printed = source.pdfPage - 7
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          compact
            ? 'text-xs text-violet-600 hover:underline'
            : 'inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 hover:bg-violet-100'
        }
      >
        原书第 {printed} 页{compact ? '' : '（核对原文）'}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/60 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800">
                  《探究应用新思维·七年级数学》原页
                </div>
                <div className="mt-0.5 truncate text-xs text-gray-500">
                  {source.ref ? `${source.ref} · ` : ''}书内第 {printed} 页（PDF 第 {source.pdfPage} 页）
                </div>
              </div>
              <button className="btn !py-1.5 !text-xs" onClick={() => setOpen(false)}>
                关闭
              </button>
            </div>
            <img
              src={bookPageImage(source.pdfPage)}
              alt={`原书第 ${printed} 页`}
              className="max-h-[75vh] w-full rounded-lg border border-gray-200 object-contain"
            />
            <p className="mt-2 text-xs text-gray-400">
              扫描页为原书内容，可用于核对题库中本题的题干、图形与答案。
            </p>
          </div>
        </div>
      )}
    </>
  )
}
