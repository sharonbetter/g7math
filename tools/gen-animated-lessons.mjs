#!/usr/bin/env node
/**
 * 批量生成动画课件：课件文本 → GLM 生成 HTML + 讲解稿 → MiniMax 配音
 *
 * 用法：
 *   node tools/gen-animated-lessons.mjs --chapter 7a-c1
 *   node tools/gen-animated-lessons.mjs --chapter 7a-c1 --point 7a-1-02
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const APP = join(ROOT, 'app')
const OUT = join(APP, 'public', 'demo')

const env = {}
for (const line of readFileSync(join(APP, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/)
  if (m && !line.startsWith('#')) env[m[1]] = m[2]
}

const args = process.argv.slice(2)
const flag = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const onlyChapter = flag('chapter')
const onlyPoint = flag('point')

const DEMO_HTML = readFileSync(join(OUT, 'lesson-demo.html'), 'utf8')
const STYLE_REF = `场景结构: <div class="scene" id="sN"><div class="scene-title">标题</div><div class="scene-sub">副标题</div>...内容...</div>
卡片: <div class="dir-card plus">...</div> (绿色正数) | <div class="dir-card minus">...</div> (红色负数) | 金色概念卡
气泡: <div class="bubble a">...</div> | <div class="bubble b">...</div> | <div class="vs-badge">VS</div>
对比卡: <div class="thermo-card"><div class="temp">+5°C</div><div class="desc">说明</div></div>
图标行: <div class="money-item"><div class="money-icon">💵</div><div class="amount">+8000</div></div>
数轴: SVG viewBox="0 0 700 120" 横线+刻度+色块标注`

// ===== CSS 模板（从 Demo 提取，共用） =====
const CSS = DEMO_HTML.match(/<style>[\s\S]*?<\/style>/)?.[0] ?? ''

// ===== JS 模板（音频播放 + 场景切换） =====
const JS = `<script>
const scenes = document.querySelectorAll('.scene');
const dotsEl = document.getElementById('dots');
let cur = -1;
let playing = false;
const audio = new Audio();
audio.preload = 'auto';
const pid = location.pathname.split('/').pop().replace('.html', '');\nconst sceneAudio = Array.from(scenes).map((_, i) => \`\${pid}/\${i + 1}.mp3\`);

scenes.forEach((_, i) => {
  const d = document.createElement('div');
  d.className = 'dot';
  d.onclick = (e) => { e.stopPropagation(); go(i); };
  dotsEl.appendChild(d);
});

const ctrl = document.createElement('div');
ctrl.style.cssText = 'position:fixed;bottom:20px;right:20px;display:flex;align-items:center;gap:12px;z-index:100';
ctrl.innerHTML = \`<div id="progress-bar" style="width:120px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden"><div id="progress-fill" style="height:100%;width:0%;background:#6366f1;border-radius:2px;transition:width .3s"></div></div><button id="btn-play" style="width:48px;height:48px;border-radius:50%;background:#6366f1;border:none;color:#fff;font-size:1.4rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(99,102,241,.4)">▶</button>\`;
document.body.appendChild(ctrl);
const btnPlay = document.getElementById('btn-play');
const progressFill = document.getElementById('progress-fill');

function go(n) {
  if (n === cur) return;
  if (cur >= 0) { scenes[cur].classList.remove('active'); dotsEl.children[cur].classList.remove('active'); }
  cur = Math.max(0, Math.min(scenes.length - 1, n));
  scenes[cur].classList.add('active');
  dotsEl.children[cur].classList.add('active');
  scenes[cur].querySelectorAll('[style*="animation"]').forEach(el => { el.style.animation = 'none'; el.offsetHeight; el.style.animation = ''; });
  audio.src = sceneAudio[cur];
  play();
}
function play() {
  audio.play().then(() => { playing = true; btnPlay.textContent = '⏸'; }).catch(() => { playing = false; btnPlay.textContent = '▶'; });
}
function pause() { audio.pause(); playing = false; btnPlay.textContent = '▶'; }
btnPlay.onclick = (e) => { e.stopPropagation(); playing ? pause() : play(); };
audio.onended = () => { if (cur < scenes.length - 1) setTimeout(() => go(cur + 1), 500); else pause(); };
audio.ontimeupdate = () => { if (audio.duration > 0) progressFill.style.width = Math.round(audio.currentTime / audio.duration * 100) + '%'; };
document.addEventListener('click', (e) => {
  if (e.target.closest('#btn-play') || e.target.closest('.dot')) return;
  if (cur < scenes.length - 1) go(cur + 1); else pause();
});
document.addEventListener('keydown', e => {
  if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); }
  if (e.key === 'ArrowRight') go(cur + 1);
  if (e.key === 'ArrowLeft') go(cur - 1);
});
let started = false;
const startHint = document.createElement('div');
startHint.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1.5rem;color:#6366f1;cursor:pointer;z-index:200;text-align:center';
startHint.innerHTML = '🎬<br><span style="font-size:1rem;color:#94a3b8">点击开始</span>';
startHint.onclick = () => { started = true; go(0); startHint.remove(); };
document.body.appendChild(startHint);
</script>`

async function chat(prompt) {
  const res = await fetch(`${env.DIAGNOSE_BASE_URL || env.GRADE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.DIAGNOSE_API_KEY || env.GRADE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'glm-5.3',
      temperature: 0.4,
      max_tokens: 12000,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(300_000),
  })
  if (!res.ok) throw new Error(`GLM ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function minimaxTTS(text) {
  const res = await fetch(`${env.TTS_BASE_URL}/v1/t2a_v2`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.TTS_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.TTS_MODEL,
      text,
      stream: false,
      voice_setting: { voice_id: env.TTS_VOICE, speed: Number(env.TTS_SPEED), vol: 1.0, pitch: Number(env.TTS_PITCH) },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3', channel: 1 },
    }),
    signal: AbortSignal.timeout(120_000),
  })
  const data = await res.json()
  if (!data.data?.audio) throw new Error('TTS failed')
  return Buffer.from(data.data.audio, 'hex')
}

const PROMPT_TEMPLATE = `你是一位制作初中数学动画课件的专家。根据下面的课件内容，生成一份动画 HTML 页面。

【要求】
1. 生成 3~5 个场景（scene），每个场景用一个 <div class="scene"> 包裹
2. 深色渐变背景 + 玻璃卡片 + 弹跳/淡入动画
3. 数学概念用颜色区分：正数绿色(#10b981)、负数红色(#f43f5e)、关键概念金色(#f59e0b)
4. 每个场景的文字不超过 4 行，一行一个要点，不折行
5. 适当使用 emoji 增加视觉吸引力
6. 讲解词要对着画面讲（"你看这张卡片""看左边绿色"），场景之间有衔接过渡
7. 讲解词中问句后用"？。"标记停顿（TTS 停 0.5 秒）
8. 讲解词不念数学符号，把 +5 读作"正 5"，−5 读作"负 5"

【输出格式】
只输出一个 JSON 对象：
{
  "scenes": [
    {
      "html": "<div class=\\"scene\\">...场景内容...</div>",
      "narration": "这个场景的讲解词...？。停顿标记..."
    }
  ]
}

【可用的 CSS 类名和组件】（直接使用，不要自己写 CSS）：
${STYLE_REF}

【课件内容】
标题：{TITLE}
内容：
{CONTENT}

只输出 JSON，不要其他文字。`

async function processPoint(lesson, chapterTitle) {
  const pid = lesson.pointId
  const htmlPath = join(OUT, `${pid}.html`)
  const audioDir = join(OUT, `${pid}`)

  if (existsSync(htmlPath)) {
    console.log(`  跳过（已存在）：${pid}`)
    return
  }

  console.log(`\n[${pid}] ${lesson.title}`)

  // 1. 提取课件核心内容
  const content = lesson.slides
    .filter(s => s.kind === 'concept' || s.kind === 'method')
    .map(s => `${s.title}\n${s.body ?? ''}`)
    .join('\n---\n')
    .slice(0, 2500)

  // 2. GLM 生成场景 HTML + 讲解稿
  console.log('  生成场景 HTML + 讲解稿…')
  const prompt = PROMPT_TEMPLATE
    .replace('{TITLE}', lesson.title)
    .replace('{CONTENT}', content)

  let scenes
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await chat(prompt)
      // 提取 JSON（处理 markdown 代码块包裹）
      let jsonStr = raw.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`/g, '')
      jsonStr = jsonStr.slice(jsonStr.indexOf('{'), jsonStr.lastIndexOf('}') + 1)
      scenes = JSON.parse(jsonStr).scenes
      break
    } catch (e) {
      if (attempt === 0) { console.log('  重试…'); continue }
      console.log(`  ✗ GLM 生成失败：${e.message.slice(0, 80)}`)
      return
    }
  }

  if (!scenes || scenes.length < 2) {
    console.log(`  ✗ 场景数不足`)
    return
  }

  console.log(`  ✓ ${scenes.length} 个场景`)

  // 3. 拼装完整 HTML
  const scenesHtml = scenes.map(s => s.html).join('\n')
  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${lesson.title}</title>
${CSS}
</head>
<body>
<div class="stage">
  <!-- 装饰粒子 -->
  <div class="particle" style="width:6px;height:6px;background:#6366f1;top:15%;left:10%;opacity:.3"></div>
  <div class="particle" style="width:4px;height:4px;background:#0ea5e9;top:25%;left:85%;animation-delay:1s;opacity:.2"></div>
  <div class="particle" style="width:8px;height:8px;background:#f59e0b;bottom:20%;left:15%;animation-delay:2s;opacity:.15"></div>

  <div class="dots" id="dots"></div>

${scenesHtml}

  <div class="hint">点击画面或按空格键 →</div>
</div>
${JS}
</body>
</html>`

  writeFileSync(htmlPath, fullHtml)

  // 4. 生成音频
  mkdirSync(audioDir, { recursive: true })
  for (let i = 0; i < scenes.length; i++) {
    console.log(`  配音 ${i + 1}/${scenes.length}…`)
    try {
      const buf = await minimaxTTS(scenes[i].narration)
      writeFileSync(join(audioDir, `${i + 1}.mp3`), buf)
    } catch (e) {
      console.log(`    ✗ 音频 ${i + 1} 失败：${e.message.slice(0, 50)}`)
    }
  }

  console.log(`  ✓ 完成 → ${htmlPath}`)
}

async function main() {
  const files = readdirSafe()
  for (const f of files) {
    const ch = f.replace('.json', '')
    if (onlyChapter && ch !== onlyChapter) continue
    const d = JSON.parse(readFileSync(join(ROOT, 'data', 'lessons', f), 'utf8'))
    console.log(`\n===== ${d.chapterTitle} =====`)
    for (const les of d.lessons) {
      if (onlyPoint && les.pointId !== onlyPoint) continue
      if (les.pointId === '7a-1-01') { console.log('  跳过（Demo 已完成）'); continue }
      await processPoint(les, d.chapterTitle)
    }
  }
  console.log('\n全部完成')
}

import { readdirSync } from 'node:fs'
function readdirSafe() {
  return readdirSync(join(ROOT, 'data', 'lessons')).filter(f => f.endsWith('.json')).sort()
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
