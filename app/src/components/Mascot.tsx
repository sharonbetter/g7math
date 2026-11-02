/**
 * 学伴精灵「毛栗」：圆滚滚的森林精灵（龙猫风原创造型，胸前三道纹、头顶一片叶）。
 * 会呼吸、眨眼、扇耳朵、摆叶子、挥小手；旁边的对话气泡循环讲解玩法，
 * 点气泡可以手动翻句。
 */
import { useEffect, useState, type ReactNode } from 'react'
import { useAppData } from '../lib/store'

/** 装备图标：以装备自身为中心的独立小图（商店/档案展示用） */
export function OutfitIcon({ id, size = 40 }: { id: string; size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      {id === 'hat-straw' && (
        <g>
          <ellipse cx="20" cy="30" rx="17" ry="5" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
          <path d="M10 29 Q20 8 30 29 Z" fill="#fcd34d" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 26 Q20 19 28 26" stroke="#b45309" strokeWidth="2" fill="none" />
        </g>
      )}
      {id === 'hat-beret' && (
        <g>
          <ellipse cx="20" cy="26" rx="16" ry="8" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
          <circle cx="20" cy="16" r="3" fill="#fca5a5" />
        </g>
      )}
      {id === 'hat-wizard' && (
        <g>
          <path d="M10 32 Q20 -2 30 32 Z" fill="#7c3aed" stroke="#5b21b6" strokeWidth="2" strokeLinejoin="round" />
          <ellipse cx="20" cy="32" rx="15" ry="4" fill="#8b5cf6" stroke="#5b21b6" strokeWidth="2" />
          <path d="M20 8 l1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6 Z" fill="#fde68a" />
        </g>
      )}
      {id === 'hat-crown' && (
        <g>
          <path d="M7 32 L10 14 L15.5 23 L20 8 L24.5 23 L30 14 L33 32 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="20" cy="24" r="2.4" fill="#f43f5e" />
          <circle cx="13" cy="28" r="1.4" fill="#fde68a" />
          <circle cx="27" cy="28" r="1.4" fill="#fde68a" />
        </g>
      )}
      {id === 'shoes-cloth' && (
        <g>
          <ellipse cx="12" cy="28" rx="10" ry="5.5" fill="#a16207" stroke="#713f12" strokeWidth="2" />
          <ellipse cx="28" cy="28" rx="10" ry="5.5" fill="#a16207" stroke="#713f12" strokeWidth="2" />
          <path d="M6 28 Q12 24 18 28 M22 28 Q28 24 34 28" stroke="#713f12" strokeWidth="1.5" fill="none" />
        </g>
      )}
      {id === 'shoes-sport' && (
        <g>
          <ellipse cx="12" cy="28" rx="10" ry="5.5" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
          <ellipse cx="28" cy="28" rx="10" ry="5.5" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
          <path d="M5 26 Q12 30 19 26 M21 26 Q28 30 35 26" stroke="#ef4444" strokeWidth="2.5" fill="none" />
        </g>
      )}
      {id === 'shoes-rocket' && (
        <g>
          <ellipse cx="13" cy="24" rx="10" ry="5.5" fill="#f97316" stroke="#c2410c" strokeWidth="2" />
          <ellipse cx="27" cy="24" rx="10" ry="5.5" fill="#f97316" stroke="#c2410c" strokeWidth="2" />
          <path d="M8 30 Q4 34 7 37 M30 30 Q34 34 31 37" stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M11 30 Q13 33 12 36 M29 30 Q27 33 28 36" stroke="#f87171" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}
      {id === 'cloth-scarf' && (
        <g>
          <path d="M8 14 Q20 22 32 14 L32 22 Q20 30 8 22 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" strokeLinejoin="round" />
          <path d="M26 20 L32 34 L24 34 L21 22 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" strokeLinejoin="round" />
        </g>
      )}
      {id === 'cloth-cape' && (
        <g>
          <path d="M10 6 L6 34 Q20 38 34 34 L30 6 Q20 12 10 6 Z" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="2" strokeLinejoin="round" />
          <path d="M10 6 L30 6" stroke="#6d28d9" strokeWidth="2.5" />
        </g>
      )}
      {id === 'cloth-armor' && (
        <g>
          <path d="M9 8 Q20 4 31 8 L31 28 Q20 34 9 28 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 18 L31 18" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="20" cy="12" r="2.2" fill="#64748b" />
          <circle cx="13" cy="24" r="1.3" fill="#94a3b8" />
          <circle cx="27" cy="24" r="1.3" fill="#94a3b8" />
        </g>
      )}
    </svg>
  )
}

/** 披风（画在身体后面，须比身体更宽更长才能露出） */
export function CapeBack({ on }: { on?: boolean }) {
  if (!on) return null
  return (
    <g data-outfit="cloth-cape-back">
      <path
        d="M86 90 Q22 150 18 196 Q34 210 58 204 Q86 196 110 202 Q134 196 162 204 Q186 210 202 196 Q198 150 134 90 Q110 102 86 90 Z"
        fill="#8b5cf6"
        stroke="#6d28d9"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* 垂坠阴影，让布料有立体感 */}
      <path d="M42 188 Q36 148 72 104" stroke="#7c3aed" strokeWidth="6" fill="none" opacity="0.45" strokeLinecap="round" />
      <path d="M178 188 Q184 148 148 104" stroke="#7c3aed" strokeWidth="6" fill="none" opacity="0.45" strokeLinecap="round" />
    </g>
  )
}

/** 胸前装备（围巾/铠甲）与帽子、鞋子（画在身体前） */
function FrontLayers({ hat, shoes, clothes }: { hat?: string; shoes?: string; clothes?: string }) {
  return (
    <>
      {/* 围巾：绕颈一圈的宽带 + 垂下的尾巴（宽度贴合 160px 的身宽） */}
      {clothes === 'cloth-scarf' && (
        <g data-outfit="cloth-scarf">
          <path
            d="M42 136 Q110 164 178 136 L184 154 Q110 186 36 154 Z"
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M52 142 Q110 170 168 142" fill="none" stroke="#dc2626" strokeWidth="2" opacity="0.7" />
          <path d="M50 150 Q110 178 170 150" fill="none" stroke="#dc2626" strokeWidth="2" opacity="0.45" />
          <path d="M140 166 L156 196 L140 200 L130 172 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2.5" strokeLinejoin="round" />
          <g stroke="#b91c1c" strokeWidth="2" strokeLinecap="round">
            <line x1="142" y1="199" x2="141" y2="207" />
            <line x1="149" y1="198" x2="149" y2="206" />
            <line x1="155" y1="196" x2="157" y2="204" />
          </g>
        </g>
      )}
      {/* 铠甲：护住躯干的胸甲板 + 肩甲 + 腰带 */}
      {clothes === 'cloth-armor' && (
        <g data-outfit="cloth-armor">
          <path d="M40 138 Q28 160 48 168 Q62 160 60 142 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M180 138 Q192 160 172 168 Q158 160 160 142 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2.5" strokeLinejoin="round" />
          <path
            d="M58 142 Q110 132 162 142 L168 168 Q110 200 52 168 Z"
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M110 137 L110 184" stroke="#94a3b8" strokeWidth="2" />
          <path d="M78 146 Q96 140 112 143" fill="none" stroke="#fff" strokeWidth="3" opacity="0.55" strokeLinecap="round" />
          <path d="M54 170 Q110 192 166 170" fill="none" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
          <circle cx="110" cy="181" r="4.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="74" cy="152" r="2.6" fill="#64748b" />
          <circle cx="146" cy="152" r="2.6" fill="#64748b" />
          <circle cx="110" cy="146" r="2.6" fill="#64748b" />
        </g>
      )}
      {/* 披风领口（前面可见的搭扣，披风主体在身后） */}
      {clothes === 'cloth-cape' && (
        <g data-outfit="cloth-cape-front">
          <path
            d="M84 134 Q110 128 136 134 L122 154 Q110 160 98 154 Z"
            fill="#8b5cf6"
            stroke="#6d28d9"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="110" cy="140" r="4" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
        </g>
      )}
      {/* 帽子（叠在头顶叶子上） */}
      {hat === 'hat-straw' && (
        <g>
          <ellipse cx="110" cy="34" rx="30" ry="7" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
          <path d="M92 33 Q110 12 128 33 Z" fill="#fcd34d" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
          <path d="M94 30 Q110 22 126 30" stroke="#b45309" strokeWidth="2" fill="none" />
        </g>
      )}
      {hat === 'hat-beret' && (
        <g>
          <ellipse cx="112" cy="28" rx="22" ry="9" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
          <circle cx="112" cy="19" r="3" fill="#fca5a5" />
        </g>
      )}
      {hat === 'hat-wizard' && (
        <g>
          <path d="M96 34 Q110 -2 124 34 Z" fill="#7c3aed" stroke="#5b21b6" strokeWidth="2" strokeLinejoin="round" />
          <ellipse cx="110" cy="34" rx="26" ry="5.5" fill="#8b5cf6" stroke="#5b21b6" strokeWidth="2" />
          <path d="M110 6 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 Z" fill="#fde68a" />
        </g>
      )}
      {hat === 'hat-crown' && (
        <g>
          <path d="M92 34 L96 16 L104 26 L110 10 L116 26 L124 16 L128 34 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="110" cy="24" r="2.5" fill="#f43f5e" />
        </g>
      )}
      {/* 鞋子（覆盖脚部） */}
      {(shoes === 'shoes-cloth' || shoes === 'shoes-sport' || shoes === 'shoes-rocket') && (
        <g>
          {[86, 134].map((cx) =>
            shoes === 'shoes-cloth' ? (
              <ellipse key={cx} cx={cx} cy={203} rx={17} ry={8.5} fill="#a16207" stroke="#713f12" strokeWidth="2" />
            ) : shoes === 'shoes-sport' ? (
              <g key={cx}>
                <ellipse cx={cx} cy={203} rx={17} ry={8.5} fill="#f8fafc" stroke="#334155" strokeWidth="2" />
                <path d={`M${cx - 12} 200 Q${cx} 206 ${cx + 12} 200`} stroke="#ef4444" strokeWidth="2.5" fill="none" />
              </g>
            ) : (
              <g key={cx}>
                <ellipse cx={cx} cy={202} rx={18} ry={9} fill="#f97316" stroke="#c2410c" strokeWidth="2" />
                <path d={`M${cx - 8} 209 Q${cx - 4} 215 ${cx - 9} 218 M${cx + 2} 210 Q${cx + 6} 216 ${cx + 1} 219`} stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </g>
            ),
          )}
        </g>
      )}
    </>
  )
}

export default function Mascot({ className = '' }: { className?: string }) {
  const appData = useAppData()
  const o = appData.outfits
  return (
    <svg viewBox="0 0 220 212" className={className} role="img" aria-label="学伴精灵毛栗">
      <CapeBack on={o?.clothes === 'cloth-cape'} />
      <g className="pet-breathe">
        {/* 耳朵 */}
        <g className="pet-ear">
          <path d="M70 82 Q50 36 42 6 Q82 28 102 56 Z" fill="#99a1ac" stroke="#6c7480" strokeWidth="3" strokeLinejoin="round" />
          <path d="M72 76 Q58 44 52 22 Q78 40 92 58 Z" fill="#c2c9d1" />
        </g>
        <g className="pet-ear pet-ear-r">
          <path d="M150 82 Q170 36 178 6 Q138 28 118 56 Z" fill="#99a1ac" stroke="#6c7480" strokeWidth="3" strokeLinejoin="round" />
          <path d="M148 76 Q162 44 168 22 Q142 40 128 58 Z" fill="#c2c9d1" />
        </g>

        {/* 头顶的叶子 */}
        <g className="pet-leaf">
          <path d="M108 40 Q110 26 116 16" fill="none" stroke="#5c8a34" strokeWidth="3" strokeLinecap="round" />
          <path d="M116 16 Q132 0 152 6 Q138 22 116 20 Z" fill="#8bc34a" stroke="#5c8a34" strokeWidth="2.5" strokeLinejoin="round" />
        </g>

        {/* 身体与肚皮 */}
        <ellipse cx="110" cy="140" rx="80" ry="62" fill="#99a1ac" stroke="#6c7480" strokeWidth="3" />
        <ellipse cx="110" cy="154" rx="52" ry="40" fill="#ece7db" />
        {/* 胸前三道纹 */}
        <g fill="none" stroke="#6c7480" strokeWidth="6" strokeLinecap="round">
          <path d="M92 136 Q110 150 128 136" />
          <path d="M92 158 Q110 172 128 158" />
          <path d="M96 180 Q110 190 124 180" />
        </g>

        {/* 胡须 */}
        <g stroke="#c3cad2" strokeWidth="3" strokeLinecap="round">
          <line x1="26" y1="104" x2="50" y2="110" />
          <line x1="22" y1="120" x2="48" y2="120" />
          <line x1="26" y1="136" x2="50" y2="130" />
          <line x1="194" y1="104" x2="170" y2="110" />
          <line x1="198" y1="120" x2="172" y2="120" />
          <line x1="194" y1="136" x2="170" y2="130" />
        </g>

        {/* 眼睛（会眨） */}
        <g className="pet-blink">
          <circle cx="82" cy="108" r="9" fill="#fff" stroke="#6c7480" strokeWidth="2.5" />
          <circle cx="138" cy="108" r="9" fill="#fff" stroke="#6c7480" strokeWidth="2.5" />
          <circle cx="83" cy="110" r="4.5" fill="#3a3f47" />
          <circle cx="139" cy="110" r="4.5" fill="#3a3f47" />
          <circle cx="85" cy="107.5" r="1.6" fill="#fff" />
          <circle cx="141" cy="107.5" r="1.6" fill="#fff" />
        </g>

        {/* 腮红 */}
        <ellipse cx="62" cy="124" rx="7.5" ry="4.5" fill="#f4a9b0" opacity="0.65" />
        <ellipse cx="158" cy="124" rx="7.5" ry="4.5" fill="#f4a9b0" opacity="0.65" />

        {/* 鼻子和嘴 */}
        <ellipse cx="110" cy="120" rx="4" ry="3" fill="#6c7480" />
        <path d="M103 128 Q110 135 117 128" fill="none" stroke="#6c7480" strokeWidth="2.5" strokeLinecap="round" />

        {/* 手：左手搭着，右手挥 */}
        <ellipse cx="42" cy="158" rx="17" ry="9" fill="#99a1ac" stroke="#6c7480" strokeWidth="3" transform="rotate(24 42 158)" />
        <g className="pet-wave">
          <ellipse cx="178" cy="152" rx="17" ry="9" fill="#99a1ac" stroke="#6c7480" strokeWidth="3" transform="rotate(-24 178 152)" />
        </g>

        {/* 脚 */}
        <ellipse cx="86" cy="202" rx="16" ry="8" fill="#8a929d" stroke="#6c7480" strokeWidth="3" />
        <ellipse cx="134" cy="202" rx="16" ry="8" fill="#8a929d" stroke="#6c7480" strokeWidth="3" />
        {/* 装备：帽子 / 围巾 / 铠甲 / 鞋子 */}
        <FrontLayers hat={o?.hat} shoes={o?.shoes} clothes={o?.clothes} />
      </g>
    </svg>
  )
}

/** 对话气泡：默认轮播 messages；传入 text 时进入跟随模式（如悬停关卡时介绍该关） */
export function SpeechBubble({
  messages = [],
  text,
  tail = 'none',
  dense = false,
  intervalMs = 5200,
}: {
  messages?: string[]
  text?: ReactNode
  /** 气泡尾巴方向：top 指向上方 / bottom 指向下方 */
  tail?: 'none' | 'top' | 'bottom'
  dense?: boolean
  intervalMs?: number
}) {
  const [i, setI] = useState(0)
  const n = messages.length
  useEffect(() => {
    if (text != null || n === 0) return
    const t = setInterval(() => setI((v) => (v + 1) % n), intervalMs)
    return () => clearInterval(t)
  }, [n, intervalMs, text])

  const tailEl =
    tail === 'top' ? (
      <span className="absolute -top-1.5 left-10 h-3.5 w-3.5 rotate-45 bg-white/95 ring-1 ring-gray-100" />
    ) : tail === 'bottom' ? (
      <span className="absolute -bottom-1.5 left-10 h-3.5 w-3.5 rotate-45 bg-white/95 ring-1 ring-gray-100" />
    ) : null

  return (
    <div
      className={`relative w-fit max-w-full rounded-2xl bg-white/95 text-gray-700 shadow-md ring-1 ring-gray-100 transition hover:ring-indigo-200 ${
        dense ? 'px-3.5 py-2.5 text-[11px] leading-relaxed md:max-w-[16rem]' : 'cursor-pointer select-none px-4 py-3.5 text-sm leading-relaxed md:max-w-md'
      }`}
    >
      {tailEl}
      {text != null ? (
        <div className="pet-bubble-in space-y-1">{text}</div>
      ) : (
        <>
          <div key={i} className="pet-bubble-in min-h-[3.2em]">
            {messages[i]}
          </div>
          {n > 1 && (
            <div className="mt-2 flex items-center justify-end gap-1.5">
              {messages.map((_, j) => (
                <span
                  key={j}
                  className={`h-1.5 w-1.5 rounded-full transition ${j === i ? 'bg-indigo-400' : 'bg-gray-200'}`}
                />
              ))}
              <span className="ml-1 text-[10px] text-gray-300">点我翻页</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
