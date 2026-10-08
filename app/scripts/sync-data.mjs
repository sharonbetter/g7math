#!/usr/bin/env node
/**
 * 把 /data 下的学习内容同步到 app/public/data，供 Vite 静态服务读取。
 * 运行： node scripts/sync-data.mjs
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(here, '..')
const repoRoot = resolve(appRoot, '..')
const src = join(repoRoot, 'data')
const out = join(appRoot, 'public', 'data')

function copyDir(from, to, filter) {
  if (!existsSync(from)) {
    console.warn(`  ! 缺少目录：${from}`)
    return 0
  }
  mkdirSync(to, { recursive: true })
  let n = 0
  for (const name of readdirSync(from)) {
    const s = join(from, name)
    if (statSync(s).isDirectory()) continue
    if (filter && !filter(name)) continue
    cpSync(s, join(to, name))
    n++
  }
  return n
}

function copyFile(from, to) {
  if (!existsSync(from)) {
    console.warn(`  ! 缺少文件：${from}`)
    return false
  }
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to)
  return true
}

console.log('同步内容数据 ->', out)
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

copyFile(join(src, 'curriculum.json'), join(out, 'curriculum.json'))
copyFile(join(src, 'book', 'index.json'), join(out, 'book-index.json'))

const nLessons = copyDir(join(src, 'lessons'), join(out, 'lessons'), (f) => f.endsWith('.json'))
const nExams = copyDir(join(src, 'exams'), join(out, 'exams'), (f) => f.endsWith('.json'))
const nUnits = copyDir(join(src, 'book', 'units'), join(out, 'book-units'), (f) => f.endsWith('.txt'))
const nPages = copyDir(join(src, 'book', 'pages_jpg'), join(out, 'book-pages'), (f) => f.endsWith('.jpg'))

const chaptersWithLessons = readdirSync(join(out, 'lessons'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''))
const chaptersWithExams = readdirSync(join(out, 'exams'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''))

writeFileSync(
  join(out, 'manifest.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      chaptersWithLessons: chaptersWithLessons.sort(),
      chaptersWithExams: chaptersWithExams.sort(),
      bookUnits: nUnits,
      bookPages: nPages,
    },
    null,
    2,
  ),
)

console.log(`  课件文件 ${nLessons} 个，考评卷 ${nExams} 个，书籍文本 ${nUnits} 篇，书籍页面 ${nPages} 张`)
console.log('完成。')
