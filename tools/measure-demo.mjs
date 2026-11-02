/**
 * 在 920×660（嵌入 iframe 的设计尺寸）下逐场景测量课件页面的溢出情况。
 * 用法：node tools/measure-demo.mjs 7a-1-03 7a-1-04 7a-1-05 ...
 */
import { chromium } from '../app/node_modules/playwright/index.mjs'

const pids = process.argv.slice(2).length ? process.argv.slice(2) : ['7a-1-03', '7a-1-04', '7a-1-05']
const W = 920
const H = 660

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H } })

for (const pid of pids) {
  console.log(`\n===== ${pid} =====`)
  await page.goto(`http://127.0.0.1:5273/demo/${pid}.html`, { waitUntil: 'networkidle' })
  // 移除开始遮罩，避免干扰
  await page.evaluate(() => {
    const sh = document.querySelector('div[style*="z-index:200"]')
    if (sh) sh.remove()
  })
  const n = await page.evaluate(() => document.querySelectorAll('.scene').length)
  for (let i = 0; i < n; i++) {
    const r = await page.evaluate(([idx, VW, VH]) => {
      const scenes = document.querySelectorAll('.scene')
      scenes.forEach((s, k) => s.classList.toggle('active', k === idx))
      const sc = scenes[idx]
      // 跳过动画等待由外层处理；此处取几何
      const title = sc.querySelector('.scene-title')?.textContent?.trim() || `场景${idx + 1}`
      const rect = sc.getBoundingClientRect()
      // 找出超出视口的可见子元素
      const over = []
      sc.querySelectorAll('*').forEach((el) => {
        const st = getComputedStyle(el)
        if (st.display === 'none' || st.opacity === '0') return
        const b = el.getBoundingClientRect()
        if (b.width === 0 || b.height === 0) return
        if (b.bottom > VH + 2 || b.top < -2 || b.right > VW + 2 || b.left < -2) {
          over.push(
            `${el.tagName}.${(el.className && el.className.toString().slice(0, 20)) || ''} ` +
              `top=${Math.round(b.top)} bottom=${Math.round(b.bottom)} left=${Math.round(b.left)} right=${Math.round(b.right)}` +
              ` text=${(el.textContent || '').trim().slice(0, 14)}`,
          )
        }
      })
      // 场景互斥检查：非当前场景必须不可见（display:none 或 opacity:0）
      const leak = []
      scenes.forEach((s, k) => {
        if (k === idx) return
        const st = getComputedStyle(s)
        if (st.display !== 'none' && st.opacity !== '0') leak.push(`场景${k + 1}`)
      })
      return { title, top: Math.round(rect.top), bottom: Math.round(rect.bottom), over: over.slice(0, 6), leak }
    }, [i, W, H])
    await page.waitForTimeout(120)
    const flag = r.over.length ? ' ❌ 溢出' : ''
    const leakFlag = r.leak.length ? ` ❌ 场景未隐藏: ${r.leak.join(',')}` : ''
    console.log(`  场景${i + 1} [${r.title}] top=${r.top} bottom=${r.bottom}${flag}${leakFlag}`)
    r.over.forEach((o) => console.log(`      · ${o}`))
  }
}
await browser.close()
