#!/usr/bin/env node
/**
 * 把 /data 的学习内容转成微信小程序可直接 require 的 JS 模块。
 *
 *   data/curriculum.json          -> miniprogram/data/curriculum.js        （主包）
 *   data/book/index.json          -> miniprogram/pkgContent/data/book.js   （内容分包）
 *   data/book/mapping.json        -> 合并进 book.js
 *   data/book/units/*.txt         -> miniprogram/pkgContent/data/units.js
 *   data/lessons/<cid>.json       -> miniprogram/pkgContent/data/lessons.js
 *   data/exams/<cid>.json         -> miniprogram/pkgContent/data/exams.js
 *
 * 全部合并成少数几个模块并压掉空白，避免分包超过 2M 上限。
 * 运行：node tools/sync-miniprogram-data.mjs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const src = join(root, 'data')
const out = join(root, 'miniprogram')
const mainData = join(out, 'data')
const pkgData = join(out, 'pkgContent', 'data')

function write(file, text) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text, 'utf8')
  return Buffer.byteLength(text, 'utf8')
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

let total = 0
function emit(name, value, header) {
  const body = JSON.stringify(value).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
  const text = `// 由 tools/sync-miniprogram-data.mjs 生成，请勿直接修改。\n${header}\nmodule.exports = ${body}\n`
  const size = write(join(out, name), text)
  total += size
  console.log(`  ${name.padEnd(34)} ${(size / 1024).toFixed(1)} KB`)
}

rmSync(mainData, { recursive: true, force: true })
rmSync(pkgData, { recursive: true, force: true })

if (!existsSync(src)) {
  console.error('缺少 data 目录：', src)
  process.exit(1)
}

console.log('生成小程序内容数据 ->', out)

// 主包：大纲
emit('data/curriculum.js', readJson(join(src, 'curriculum.json')), '// 课程大纲')

// 分包：课件
const lessons = {}
for (const f of readdirSync(join(src, 'lessons')).sort()) {
  if (!f.endsWith('.json')) continue
  lessons[f.replace('.json', '')] = readJson(join(src, 'lessons', f))
}
emit('pkgContent/data/lessons.js', lessons, '// 全部章节课件，按 chapterId 索引')

// 分包：考评卷
const exams = {}
for (const f of readdirSync(join(src, 'exams')).sort()) {
  if (!f.endsWith('.json')) continue
  exams[f.replace('.json', '')] = readJson(join(src, 'exams', f))
}
emit('pkgContent/data/exams.js', exams, '// 全部章节考评卷，按 chapterId 索引')

// 分包：书本索引与讲次映射
const bookIndex = readJson(join(src, 'book', 'index.json'))
const mapping = readJson(join(src, 'book', 'mapping.json'))
emit('pkgContent/data/book.js', { index: bookIndex, mapping }, '// 教辅索引与知识点映射')

// 分包：讲次正文
const units = {}
for (const f of readdirSync(join(src, 'book', 'units')).sort()) {
  if (!f.endsWith('.txt')) continue
  units[f.replace(/\.txt$/, '')] = readFileSync(join(src, 'book', 'units', f), 'utf8')
}
emit('pkgContent/data/units.js', units, '// 讲次正文')

console.log(`\n主包数据 + 分包数据合计 ${(total / 1024 / 1024).toFixed(2)} MB`)
console.log(`分包 pkgContent 上限 2 MB，请对照上面的合计确认。`)
