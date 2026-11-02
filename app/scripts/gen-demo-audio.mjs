import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = dirname(fileURLToPath(import.meta.url))
const DEMO = join(APP, '..', 'public', 'demo')

const env = {}
for (const line of readFileSync(join(APP, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/)
  if (m && !line.startsWith('#')) env[m[1]] = m[2]
}

const PIDS = process.argv[2] ? [process.argv[2]] : ['7a-1-02', '7a-1-03', '7a-1-04', '7a-1-05']
let total = 0, done = 0

for (const pid of PIDS) {
  const narrFile = join(DEMO, `${pid}-narrations.json`)
  if (!existsSync(narrFile)) { console.log(`  ✗ ${pid} 无讲解稿`); continue }
  const narrations = JSON.parse(readFileSync(narrFile, 'utf8'))
  for (let i = 0; i < narrations.length; i++) {
    const audioFile = join(DEMO, pid, `${i + 1}.mp3`)
    if (existsSync(audioFile)) continue
    total++
    try {
      const res = await fetch(`${env.TTS_BASE_URL}/v1/t2a_v2`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.TTS_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: env.TTS_MODEL,
          text: narrations[i].slice(0, 800),
          stream: false,
          voice_setting: { voice_id: env.TTS_VOICE, speed: Number(env.TTS_SPEED), vol: 1.0, pitch: Number(env.TTS_PITCH) },
          audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3', channel: 1 },
        }),
        signal: AbortSignal.timeout(120_000),
      })
      const data = await res.json()
      if (data.data?.audio) {
        writeFileSync(audioFile, Buffer.from(data.data.audio, 'hex'))
        done++
        console.log(`  ${pid}/${i + 1} ✓`)
      } else {
        console.log(`  ${pid}/${i + 1} ✗`)
      }
    } catch (e) {
      console.log(`  ${pid}/${i + 1} ✗ ${e.message.slice(0, 50)}`)
    }
  }
}
console.log(`配音完成：${done}/${total}`)
