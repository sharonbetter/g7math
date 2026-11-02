#!/usr/bin/env node
/**
 * 课件视频生成：Playwright 截图每页 → ffmpeg 合成（画面 + 语音）→ 拼接 MP4。
 *
 * 用法：
 *   node tools/gen-lesson-video.mjs --point 7a-1-01       # 一个知识点
 *   node tools/gen-lesson-video.mjs --chapter 7a-c1       # 一章
 *   node tools/gen-lesson-video.mjs                        # 全部
 *
 * 依赖：dev server 运行在 127.0.0.1:5273、app/public/audio/ 下的 m4a、ffmpeg-static
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const APP = join(ROOT, 'app')
const FFMPEG = join(APP, 'node_modules', 'ffmpeg-static', 'ffmpeg')
const AUDIO_DIR = join(APP, 'public', 'audio', 'lessons')
const OUT_DIR = join(ROOT, 'data', 'videos')
const TMP = join(ROOT, '.tmp', 'video-frames')

const BASE_URL = 'http://127.0.0.1:5273'
const WIDTH = 1920
const HEIGHT = 1080

const args = process.argv.slice(2)
const flag = (n) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 ? args[i + 1] : undefined
}
const onlyPoint = flag('point')
const onlyChapter = flag('chapter')

function audioDuration(file) {
  const r = spawnSync('afinfo', [file], { encoding: 'utf8' })
  const m = r.stdout?.match(/estimated duration:\s*([\d.]+)/)
  return m ? parseFloat(m[1]) : 0
}

function chapterOf(pointId) {
  // 从 curriculum.json 反查
  const c = JSON.parse(readFileSync(join(APP, 'public', 'data', 'curriculum.json'), 'utf8'))
  for (const v of c.volumes)
    for (const ch of v.chapters)
      for (const s of ch.sections)
        for (const p of s.points)
          if (p.id === pointId) return ch.id
  return null
}

async function main() {
  const { chromium } = await import(join(APP, 'node_modules', 'playwright', 'index.mjs'))

  // 加载课件
  const lessonFiles = readdirSync(join(ROOT, 'data', 'lessons'))
    .filter((f) => f.endsWith('.json'))
    .sort()

  // 确定要处理的 (chapterId, lesson) 列表
  const targets = []
  for (const f of lessonFiles) {
    const chId = f.replace('.json', '')
    if (onlyChapter && chId !== onlyChapter) continue
    const d = JSON.parse(readFileSync(join(ROOT, 'data', 'lessons', f), 'utf8'))
    for (const les of d.lessons) {
      if (onlyPoint && les.pointId !== onlyPoint) continue
      targets.push({ chapterId: chId, lesson: les })
    }
  }

  console.log(`目标：${targets.length} 个知识点的视频`)
  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(TMP, { recursive: true })

  // 启动浏览器
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  })

  let done = 0
  for (const { chapterId, lesson } of targets) {
    const outPath = join(OUT_DIR, `${lesson.pointId}.mp4`)
    if (existsSync(outPath)) {
      console.log(`  跳过（已存在）：${lesson.pointId}`)
      done++
      continue
    }

    console.log(`\n[${++done}/${targets.length}] ${lesson.pointId} ${lesson.title}（${lesson.slides.length} 页）`)

    const segFiles = []
    for (let i = 0; i < lesson.slides.length; i++) {
      const slide = lesson.slides[i]
      const audioFile = join(AUDIO_DIR, chapterId, `${lesson.pointId}-${i}-0.m4a`)
      const hasAudio = existsSync(audioFile)
      const duration = hasAudio ? audioDuration(audioFile) : 3 // 无语音时停 3s

      // 截图
      const url = `${BASE_URL}/#/render/${lesson.pointId}/${i}`
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      // 等待渲染完成（title 变为 'ready'）
      for (let w = 0; w < 30; w++) {
        const title = await page.title()
        if (title === 'ready') break
        await page.waitForTimeout(500)
      }
      await page.waitForTimeout(500) // 字体/公式稳定

      const pngPath = join(TMP, `${lesson.pointId}-s${i}.png`)
      await page.screenshot({ path: pngPath, type: 'png' })

      // ffmpeg：PNG + M4A → MP4 片段
      const segPath = join(TMP, `${lesson.pointId}-s${i}.mp4`)
      const dur = Math.max(duration, 1)
      try {
        execFileSync(FFMPEG, [
          '-y', '-loop', '1',
          '-i', pngPath,
          ...(hasAudio ? ['-i', audioFile] : []),
          '-t', String(dur + 0.5),
          '-r', '24',
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '20',
          '-vf', `scale=${WIDTH}:${HEIGHT}`,
          '-pix_fmt', 'yuv420p',
          ...(hasAudio ? ['-c:a', 'aac', '-b:a', '64k', '-shortest'] : []),
          '-s', `${WIDTH}x${HEIGHT}`,
          segPath,
        ], { stdio: ['ignore', 'ignore', 'ignore'] })
        segFiles.push(segPath)
        process.stdout.write(`  ${i + 1}/${lesson.slides.length} (${duration.toFixed(0)}s)`)
      } catch (e) {
        console.log(`  ! 第${i + 1}页合成失败：${e.message.slice(0, 80)}`)
      }
    }
    process.stdout.write('\n')

    // 拼接
    if (segFiles.length > 1) {
      const listFile = join(TMP, `${lesson.pointId}-list.txt`)
      writeFileSync(listFile, segFiles.map((f) => `file '${f}'`).join('\n'))
      execFileSync(FFMPEG, [
        '-y', '-f', 'concat', '-safe', '0',
        '-i', listFile,
        '-c', 'copy',
        outPath,
      ], { stdio: ['ignore', 'ignore', 'ignore'] })
      console.log(`  ✓ ${outPath}`)
    } else if (segFiles.length === 1) {
      execFileSync('cp', [segFiles[0], outPath])
      console.log(`  ✓ ${outPath}`)
    } else {
      console.log(`  ✗ 无有效片段`)
    }

    // 清理临时文件
    for (const f of segFiles) {
      try { rmSync(f) } catch {}
    }
  }

  await browser.close()
  rmSync(TMP, { recursive: true, force: true })
  console.log(`\n全部完成 → ${OUT_DIR}`)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
