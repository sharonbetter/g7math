/**
 * 神兽 · 山海经厚涂风：全身侧立、光影体积。
 * 画法：主体三层渐变（暗→中→亮）+ 底缘深色投影层 + 背线高光 + 地面阴影，
 * 每只独立的物种轮廓（兔/鸾/龟/泽/雁/骐/狻/貔/青/雀/凤/龙），绝不共用模板。
 */
import type { Beast } from '../lib/beasts'

/** 三段渐变（厚涂基座） */
function G({ id, dark, mid, light, dir = 'v' }: { id: string; dark: string; mid: string; light: string; dir?: 'v' | 'h' }) {
  return (
    <linearGradient id={id} x1="0" y1={dir === 'v' ? '0' : '0'} x2={dir === 'v' ? '0' : '1'} y2={dir === 'v' ? '1' : '0'}>
      <stop offset="0%" stopColor={light} />
      <stop offset="52%" stopColor={mid} />
      <stop offset="100%" stopColor={dark} />
    </linearGradient>
  )
}

/** 眼睛：高光瞳 */
function Eye({ x, y, c = '#1c1917' }: { x: number; y: number; c?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="2.1" fill={c} />
      <circle cx={x + 0.7} cy={y - 0.7} r="0.7" fill="#fff" />
    </g>
  )
}

/** 地面阴影 */
function Ground({ w = 34 }: { w?: number }) {
  return <ellipse cx="34" cy="58.5" rx={w / 2} ry="3.2" fill="#0f172a" opacity="0.22" />
}

export function BeastFigure({ beast, size = 28, locked = false }: { beast: Beast; size?: number; locked?: boolean }) {
  const k = beast.glyph
  const gid = `bf-${k}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      style={locked ? { filter: 'grayscale(1) opacity(.4)' } : { filter: `drop-shadow(0 0 5px ${beast.accent}66)` }}
    >
      <defs>
        {k === '兔' && <G id={`${gid}-b`} dark="#a5a3c4" mid="#e8e5f8" light="#ffffff" />}
        {k === '鸾' && <>
          <G id={`${gid}-b`} dark="#0f766e" mid="#14b8a6" light="#99f6e4" />
          <G id={`${gid}-t`} dark="#0e7490" mid="#22d3ee" light="#cffafe" />
        </>}
        {k === '玄' && <>
          <G id={`${gid}-s`} dark="#052e1c" mid="#14532d" light="#4ade80" />
          <G id={`${gid}-b`} dark="#1e293b" mid="#475569" light="#94a3b8" />
        </>}
        {k === '泽' && <G id={`${gid}-b`} dark="#b45309" mid="#fde68a" light="#fffbeb" />}
        {k === '雁' && <G id={`${gid}-b`} dark="#b45309" mid="#f59e0b" light="#fef3c7" />}
        {k === '骐' && <>
          <G id={`${gid}-b`} dark="#6d28d9" mid="#a78bfa" light="#ede9fe" />
          <G id={`${gid}-m`} dark="#4c1d95" mid="#8b5cf6" light="#e9d5ff" />
        </>}
        {k === '狻' && <>
          <G id={`${gid}-m`} dark="#7f1d1d" mid="#ef4444" light="#fca5a5" />
          <G id={`${gid}-b`} dark="#92400e" mid="#f59e0b" light="#fde68a" />
        </>}
        {k === '貔' && <>
          <G id={`${gid}-b`} dark="#065f46" mid="#10b981" light="#a7f3d0" />
          <G id={`${gid}-w`} dark="#b45309" mid="#fbbf24" light="#fef3c7" />
        </>}
        {k === '青' && <G id={`${gid}-b`} dark="#0e7490" mid="#0891b2" light="#a5f3fc" />}
        {k === '雀' && <G id={`${gid}-b`} dark="#991b1b" mid="#f97316" light="#fed7aa" />}
        {k === '凤' && <G id={`${gid}-b`} dark="#9d174d" mid="#ec4899" light="#fbcfe8" />}
        {k === '龙' && <G id={`${gid}-b`} dark="#92400e" mid="#f59e0b" light="#fef08a" />}
      </defs>

      {/* ==================== 玉兔 ==================== */}
      {k === '兔' && (
        <g>
          <Ground w={30} />
          {/* 尾 */}
          <circle cx="14" cy="42" r="5" fill={`url(#${gid}-b)`} stroke="#8b87b0" strokeWidth="1" />
          {/* 后腿坐姿 */}
          <ellipse cx="26" cy="45" rx="13" ry="12" fill={`url(#${gid}-b)`} stroke="#8b87b0" strokeWidth="1.2" />
          <path d="M22 52 Q26 58 34 56 L34 50 Q28 52 22 52 Z" fill="#d9d5f0" stroke="#8b87b0" strokeWidth="0.8" />
          {/* 背与胸 */}
          <path d="M20 42 Q22 26 36 24 Q46 22 48 30 Q49 36 46 42 Q40 50 30 50 Q22 50 20 42 Z" fill={`url(#${gid}-b)`} stroke="#8b87b0" strokeWidth="1.2" />
          {/* 头（右） */}
          <circle cx="48" cy="32" r="8.5" fill={`url(#${gid}-b)`} stroke="#8b87b0" strokeWidth="1.2" />
          {/* 耳（后掠） */}
          <path d="M46 26 Q42 8 35 4 Q40 6 43 12 Q46 18 48 24 Z" fill="#e8e5f8" stroke="#8b87b0" strokeWidth="1.1" />
          <path d="M49 26 Q49 8 44 2 Q50 6 52 14 Q53 20 52 25 Z" fill="#f5f3ff" stroke="#8b87b0" strokeWidth="1.1" />
          <path d="M47.6 22 Q47.5 10 44.5 5 Q49 9 50 16" fill="#f0abfc" opacity="0.5" stroke="none" />
          {/* 前爪 */}
          <path d="M42 44 L42 54 M46 44 L46 53" stroke="#e8e5f8" strokeWidth="3.4" strokeLinecap="round" />
          {/* 背光 */}
          <path d="M24 34 Q28 26 38 25" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity="0.7" strokeLinecap="round" />
          <Eye x={51} y={31} c="#be123c" />
          <circle cx="53.5" cy="36" r="1" fill="#f0abfc" opacity="0.8" />
        </g>
      )}

      {/* ==================== 青鸾 ==================== */}
      {k === '鸾' && (
        <g>
          <Ground w={36} />
          {/* 长尾三翎 */}
          <path d="M22 36 Q10 44 4 58 Q14 50 24 42 Z" fill={`url(#${gid}-t)`} stroke="#0f766e" strokeWidth="1" />
          <path d="M24 34 Q16 46 14 58 Q22 48 27 40 Z" fill={`url(#${gid}-t)`} stroke="#0f766e" strokeWidth="1" />
          <path d="M26 32 Q24 46 24 58 Q30 46 30 38 Z" fill={`url(#${gid}-t)`} stroke="#0f766e" strokeWidth="1" />
          {/* 身 */}
          <ellipse cx="32" cy="34" rx="13" ry="11" fill={`url(#${gid}-b)`} stroke="#0f766e" strokeWidth="1.2" />
          {/* 颈与头（右上） */}
          <path d="M40 30 Q46 22 48 14 Q52 16 52 24 Q52 30 48 34 Z" fill={`url(#${gid}-b)`} stroke="#0f766e" strokeWidth="1.2" />
          <circle cx="50" cy="14" r="6.5" fill={`url(#${gid}-b)`} stroke="#0f766e" strokeWidth="1.2" />
          {/* 冠羽 */}
          <path d="M48 8 L45 2 L49 6 L50 1 L52 6 L56 3 L53 9 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="0.9" />
          {/* 喙 */}
          <path d="M56 13 L62 15 L56 18 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="0.9" />
          {/* 翅（收拢覆羽） */}
          <path d="M26 28 Q34 26 40 32 Q34 40 26 40 Q22 36 26 28 Z" fill={`url(#${gid}-t)`} stroke="#0f766e" strokeWidth="1" />
          <path d="M27 31 Q33 30 38 34 M26 35 Q32 35 37 38" stroke="#0f766e" strokeWidth="0.8" fill="none" />
          {/* 腿爪 */}
          <path d="M30 44 L29 55 M36 44 L36 55" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M29 55 L26 58 M29 55 L31 58 M29 55 L32 57 M36 55 L34 58 M36 55 L38 58 M36 55 L39 57" stroke="#b45309" strokeWidth="1" />
          {/* 背光 */}
          <path d="M24 30 Q28 24 36 23" fill="none" stroke="#cffafe" strokeWidth="1.5" opacity="0.8" strokeLinecap="round" />
          <Eye x={51} y={13} />
        </g>
      )}

      {/* ==================== 玄武 ==================== */}
      {k === '玄' && (
        <g>
          <Ground w={44} />
          {/* 龟甲 */}
          <path d="M10 40 Q10 18 32 18 Q54 18 54 40 Q54 48 32 48 Q10 48 10 40 Z" fill={`url(#${gid}-s)`} stroke="#052e1c" strokeWidth="1.4" />
          {/* 甲纹 */}
          <path d="M16 26 L48 26 M14 34 L50 34 M24 19 L24 46 M40 19 L40 46 M32 18 L32 47" stroke="#86efac" strokeWidth="1" opacity="0.55" fill="none" />
          <path d="M18 22 Q32 14 46 22" fill="none" stroke="#bbf7d0" strokeWidth="1.4" opacity="0.7" />
          {/* 头（右伸） */}
          <path d="M52 36 Q58 34 60 38 Q61 42 58 44 L52 44 Z" fill={`url(#${gid}-b)`} stroke="#1e293b" strokeWidth="1.1" />
          <Eye x={57} y={38} c="#fbbf24" />
          {/* 前后鳍足 */}
          <path d="M18 46 Q12 52 14 56 Q20 54 24 48 Z" fill={`url(#${gid}-b)`} stroke="#1e293b" strokeWidth="1.1" />
          <path d="M44 46 Q50 52 48 56 Q42 54 38 48 Z" fill={`url(#${gid}-b)`} stroke="#1e293b" strokeWidth="1.1" />
          {/* 蛇尾 */}
          <path d="M12 42 Q4 44 3 50 Q6 55 10 52" fill="none" stroke={`url(#${gid}-b)`} strokeWidth="4" strokeLinecap="round" />
          {/* 甲缘高光 */}
          <path d="M13 24 Q20 17 34 17" fill="none" stroke="#ffffff" strokeWidth="1.4" opacity="0.35" strokeLinecap="round" />
        </g>
      )}

      {/* ==================== 白泽 ==================== */}
      {k === '泽' && (
        <g>
          <Ground w={40} />
          {/* 身躯（鹿形） */}
          <path d="M18 44 Q16 28 28 24 Q40 20 44 26 L48 24 Q52 22 53 27 Q54 32 50 34 L46 36 Q44 44 36 48 L20 48 Q16 48 18 44 Z" fill={`url(#${gid}-b)`} stroke="#b45309" strokeWidth="1.2" />
          {/* 四腿 */}
          <path d="M24 48 L22 56 M30 48 L29 56 M38 47 L40 56 M44 45 L46 56" stroke="#fde68a" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M22 56 L19 58 M29 56 L26 58 M40 56 L43 58 M46 56 L49 58" stroke="#b45309" strokeWidth="1.6" strokeLinecap="round" />
          {/* 头（右） */}
          <path d="M50 22 Q56 20 58 24 Q59 28 56 30 L50 30 Z" fill={`url(#${gid}-b)`} stroke="#b45309" strokeWidth="1.1" />
          {/* 鹿角（金色分枝） */}
          <path d="M52 20 L50 10 M51 15 L46 12 M52 20 L56 12 M54 16 L58 14" fill="none" stroke="#d4a017" strokeWidth="2" strokeLinecap="round" />
          {/* 鬃毛 */}
          <path d="M44 24 Q38 18 32 20 Q36 22 38 26 Z" fill="#fff7ed" stroke="#d4a017" strokeWidth="0.9" />
          {/* 背光 */}
          <path d="M22 40 Q24 28 34 25" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity="0.6" strokeLinecap="round" />
          <Eye x={55} y={25} />
          {/* 额间慧珠 */}
          <circle cx="54" cy="22" r="1.2" fill="#f43f5e" />
        </g>
      )}

      {/* ==================== 金雁 ==================== */}
      {k === '雁' && (
        <g>
          <Ground w={32} />
          {/* 长颈回首 */}
          <path d="M34 28 Q30 18 34 12 Q38 8 42 10 Q46 12 44 18 Q42 24 40 28 Z" fill={`url(#${gid}-b)`} stroke="#92400e" strokeWidth="1.1" />
          {/* 头 */}
          <ellipse cx="42" cy="10" rx="5.5" ry="4.6" fill={`url(#${gid}-b)`} stroke="#92400e" strokeWidth="1.1" />
          <path d="M46 9 L52 11 L46 13 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
          <path d="M38 6 L34 2 M42 5 L41 1" stroke="#92400e" strokeWidth="1.4" strokeLinecap="round" />
          {/* 身 */}
          <path d="M22 34 Q22 24 32 24 Q42 24 44 32 Q45 42 38 46 L26 46 Q20 42 22 34 Z" fill={`url(#${gid}-b)`} stroke="#92400e" strokeWidth="1.2" />
          {/* 收翅 */}
          <path d="M24 28 Q32 26 40 32 Q34 40 26 40 Q21 36 24 28 Z" fill="#d97706" stroke="#92400e" strokeWidth="1" />
          <path d="M26 31 Q32 30 38 34 M25 36 Q31 36 36 38" stroke="#fde68a" strokeWidth="0.9" fill="none" />
          {/* 尾羽 */}
          <path d="M22 34 Q14 32 10 36 Q16 40 24 40 Z" fill="#b45309" stroke="#78350f" strokeWidth="1" />
          {/* 腿 */}
          <path d="M30 46 L29 56 M36 46 L36 56" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M29 56 L26 59 M29 56 L31 59 M36 56 L34 59 M36 56 L38 59" stroke="#78350f" strokeWidth="1" />
          <path d="M26 30 Q30 24 38 23" fill="none" stroke="#fef3c7" strokeWidth="1.4" opacity="0.8" strokeLinecap="round" />
          <Eye x={43} y={9} />
        </g>
      )}

      {/* ==================== 天马·骐 ==================== */}
      {k === '骐' && (
        <g>
          <Ground w={42} />
          {/* 后躯 */}
          <ellipse cx="24" cy="36" rx="13" ry="11" fill={`url(#${gid}-b)`} stroke="#4c1d95" strokeWidth="1.2" />
          {/* 背腹 */}
          <path d="M20 32 Q26 22 38 22 Q46 22 48 26 L48 30 Q44 38 36 40 L24 42 Q18 40 20 32 Z" fill={`url(#${gid}-b)`} stroke="#4c1d95" strokeWidth="1.2" />
          {/* 颈与头（昂首右） */}
          <path d="M44 24 Q50 16 54 12 Q58 10 59 14 Q60 18 57 21 Q52 26 48 28 Z" fill={`url(#${gid}-b)`} stroke="#4c1d95" strokeWidth="1.2" />
          <path d="M56 12 Q61 10 63 13 Q62 17 58 17 Z" fill="#ede9fe" stroke="#4c1d95" strokeWidth="1.1" />
          {/* 鬃毛（飘逸） */}
          <path d="M46 22 Q40 12 32 10 Q38 16 40 22 Q42 26 46 28 Z" fill={`url(#${gid}-m)`} stroke="#4c1d95" strokeWidth="1" />
          <path d="M44 20 Q36 8 26 8 Q34 14 38 20" fill={`url(#${gid}-m)`} stroke="#4c1d95" strokeWidth="1" opacity="0.85" />
          {/* 尾（飘） */}
          <path d="M14 34 Q4 30 2 20 Q8 26 14 28 Q18 32 16 38 Z" fill={`url(#${gid}-m)`} stroke="#4c1d95" strokeWidth="1" />
          {/* 四腿（站立） */}
          <path d="M20 44 L18 56 M26 45 L25 56 M36 42 L38 56 M44 38 L46 56" stroke="#a78bfa" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M18 56 L15 58 M25 56 L22 58 M38 56 L41 58 M46 56 L49 58" stroke="#4c1d95" strokeWidth="1.6" strokeLinecap="round" />
          {/* 翅羽（小翼） */}
          <path d="M34 24 Q36 16 44 14 Q40 22 38 26 Z" fill={`url(#${gid}-m)`} stroke="#4c1d95" strokeWidth="1" opacity="0.9" />
          <path d="M24 30 Q28 22 36 22" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
          <Eye x={57} y={13} />
        </g>
      )}

      {/* ==================== 狻猊 ==================== */}
      {k === '狻' && (
        <g>
          <Ground w={40} />
          {/* 火焰鬃（后披） */}
          <path d="M22 30 Q14 22 12 12 Q20 18 24 22 Q20 12 22 4 Q28 14 30 20 Q32 12 36 8 Q36 18 34 24 Q40 18 44 16 Q40 24 36 30 Z" fill={`url(#${gid}-m)`} stroke="#7f1d1d" strokeWidth="1.1" />
          {/* 身（狮形坐） */}
          <path d="M20 34 Q20 24 32 24 Q44 24 46 32 Q48 40 44 46 L24 46 Q18 42 20 34 Z" fill={`url(#${gid}-b)`} stroke="#7c2d12" strokeWidth="1.2" />
          {/* 前腿 */}
          <path d="M40 40 L40 56 M34 42 L33 56" stroke="#f59e0b" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M40 56 L37 58 M40 56 L43 58 M33 56 L30 58 M33 56 L36 58" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
          {/* 头（右） */}
          <circle cx="46" cy="28" r="9" fill={`url(#${gid}-b)`} stroke="#7c2d12" strokeWidth="1.2" />
          {/* 面部鬃圈 */}
          <path d="M40 24 Q44 20 49 23 Q53 26 52 31 Q51 35 47 36 Q42 37 39 33 Q38 28 40 24 Z" fill={`url(#${gid}-m)`} stroke="#7f1d1d" strokeWidth="1" />
          {/* 吻 */}
          <path d="M52 28 Q56 28 57 31 Q56 34 52 34 Z" fill="#fde68a" stroke="#7c2d12" strokeWidth="1" />
          <circle cx="55" cy="30" r="1.1" fill="#7c2d12" />
          {/* 尾甩前 */}
          <path d="M22 42 Q12 44 10 50 Q14 55 20 52" fill="none" stroke={`url(#${gid}-m)`} strokeWidth="3.4" strokeLinecap="round" />
          <path d="M26 28 Q30 24 38 24" fill="none" stroke="#fde68a" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
          <Eye x={48} y={26} />
        </g>
      )}

      {/* ==================== 貔貅 ==================== */}
      {k === '貔' && (
        <g>
          <Ground w={40} />
          {/* 双小翼（后背） */}
          <path d="M20 28 Q10 22 6 14 Q16 18 22 24 Z" fill={`url(#${gid}-w)`} stroke="#78350f" strokeWidth="1" />
          <path d="M22 32 Q12 30 6 26 Q14 26 22 30 Z" fill={`url(#${gid}-w)`} stroke="#78350f" strokeWidth="1" opacity="0.85" />
          {/* 身（猛兽侧立） */}
          <path d="M18 36 Q18 26 30 24 Q42 22 46 28 Q50 34 48 40 Q46 46 40 48 L24 48 Q16 46 18 36 Z" fill={`url(#${gid}-b)`} stroke="#065f46" strokeWidth="1.2" />
          {/* 四腿 */}
          <path d="M22 48 L21 56 M28 48 L27 56 M38 46 L40 56 M44 42 L46 56" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M21 56 L18 58 M27 56 L24 58 M40 56 L43 58 M46 56 L49 58" stroke="#064e3b" strokeWidth="1.6" strokeLinecap="round" />
          {/* 头（右） */}
          <path d="M44 24 Q52 22 55 27 Q56 32 52 35 L46 34 Z" fill={`url(#${gid}-b)`} stroke="#065f46" strokeWidth="1.2" />
          {/* 独角 */}
          <path d="M50 22 L54 14" stroke="#fbbf24" strokeWidth="2.4" strokeLinecap="round" />
          {/* 吻与牙 */}
          <path d="M54 28 Q58 29 58 32 Q57 34 54 33 Z" fill="#d1fae5" stroke="#065f46" strokeWidth="0.9" />
          <path d="M56 33 L57 36 L54.5 34 Z" fill="#fff" stroke="#064e3b" strokeWidth="0.7" />
          {/* 胸金纹 */}
          <path d="M32 30 Q34 36 32 42 M36 30 Q38 36 36 42" fill="none" stroke="#fbbf24" strokeWidth="1.6" />
          <path d="M22 32 Q26 25 34 24" fill="none" stroke="#a7f3d0" strokeWidth="1.4" opacity="0.8" strokeLinecap="round" />
          <Eye x={50} y={28} />
        </g>
      )}

      {/* ==================== 青龙 ==================== */}
      {k === '青' && (
        <g>
          <Ground w={46} />
          {/* 蛇形躯体（S 游走） */}
          <path d="M8 46 Q4 38 12 32 Q22 26 30 30 Q40 34 46 28 Q52 22 50 14" fill="none" stroke={`url(#${gid}-b)`} strokeWidth="9" strokeLinecap="round" />
          <path d="M8 46 Q4 38 12 32 Q22 26 30 30 Q40 34 46 28" fill="none" stroke="#67e8f9" strokeWidth="2.4" strokeLinecap="round" opacity="0.4" />
          {/* 背鳍连脊 */}
          <path d="M10 36 L14 30 M18 28 L22 24 M26 27 L30 24 M34 30 L38 27 M42 27 L45 23" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" />
          {/* 腹鳞线 */}
          <path d="M12 40 Q22 34 30 38 Q40 42 48 34" fill="none" stroke="#e0f2fe" strokeWidth="1.6" opacity="0.5" />
          {/* 头（右上仰） */}
          <path d="M46 14 Q52 10 57 13 Q60 17 57 21 Q53 24 49 21 Z" fill={`url(#${gid}-b)`} stroke="#155e75" strokeWidth="1.2" />
          <path d="M57 15 Q61 15 62 18 Q61 20 58 19 Z" fill="#a5f3fc" stroke="#155e75" strokeWidth="0.9" />
          {/* 双角 */}
          <path d="M50 12 L47 4 M53 11 L52 3" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />
          {/* 龙须 */}
          <path d="M58 20 Q62 24 61 28 M56 21 Q58 26 56 30" fill="none" stroke="#fbbf24" strokeWidth="1.1" />
          {/* 爪（前探） */}
          <path d="M44 20 L39 24 M45 23 L40 27" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" />
          <path d="M39 24 L36 26 M40 27 L37 29" stroke="#155e75" strokeWidth="1.4" strokeLinecap="round" />
          <Eye x={54} y={16} c="#fde047" />
        </g>
      )}

      {/* ==================== 朱雀 ==================== */}
      {k === '雀' && (
        <g>
          <Ground w={36} />
          {/* 火焰双翼（上扬） */}
          <path d="M28 28 Q20 14 8 8 Q18 20 24 30 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.1" />
          <path d="M24 30 Q16 20 6 16 Q16 24 22 32 Z" fill="#f97316" stroke="#7f1d1d" strokeWidth="1" />
          {/* 身 */}
          <path d="M26 34 Q26 24 34 24 Q42 24 44 30 Q45 38 40 44 L30 44 Q24 40 26 34 Z" fill={`url(#${gid}-b)`} stroke="#7f1d1d" strokeWidth="1.2" />
          {/* 头（右冠） */}
          <circle cx="44" cy="26" r="6.5" fill="#f97316" stroke="#7f1d1d" strokeWidth="1.2" />
          <path d="M42 20 L40 14 L44 18 L45 12 L47 18 L50 14 L48 21 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="0.9" />
          <path d="M50 26 L55 28 L50 30 Z" fill="#fde047" stroke="#b45309" strokeWidth="0.8" />
          {/* 火尾（三焰下曳） */}
          <path d="M30 42 Q24 50 22 58 Q28 52 33 46 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
          <path d="M34 44 Q32 52 30 58 Q36 52 38 46 Z" fill="#f97316" stroke="#7f1d1d" strokeWidth="1" />
          {/* 腿爪 */}
          <path d="M34 44 L33 56 M38 44 L38 56" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
          <path d="M33 56 L30 58 M33 56 L35 58 M38 56 L36 58 M38 56 L40 58" stroke="#78350f" strokeWidth="1" />
          <path d="M28 30 Q32 24 38 24" fill="none" stroke="#fed7aa" strokeWidth="1.4" opacity="0.8" strokeLinecap="round" />
          <Eye x={46} y={25} c="#7f1d1d" />
        </g>
      )}

      {/* ==================== 凤凰 ==================== */}
      {k === '凤' && (
        <g>
          <Ground w={38} />
          {/* 三条飘尾翎 */}
          <path d="M28 34 Q14 40 6 54 Q16 46 30 40 Z" fill={`url(#${gid}-b)`} stroke="#9d174d" strokeWidth="1" />
          <path d="M30 32 Q20 44 16 56 Q24 46 33 38 Z" fill={`url(#${gid}-b)`} stroke="#9d174d" strokeWidth="1" />
          <path d="M32 30 Q28 44 28 56 Q34 44 36 34 Z" fill={`url(#${gid}-b)`} stroke="#9d174d" strokeWidth="1" />
          {/* 翎眼 */}
          <circle cx="10" cy="52" r="1.6" fill="#fbbf24" />
          <circle cx="18" cy="54" r="1.4" fill="#fbbf24" />
          {/* 身（优雅立姿） */}
          <path d="M28 32 Q28 24 36 24 Q44 24 46 29 Q47 36 42 42 L32 42 Q26 38 28 32 Z" fill={`url(#${gid}-b)`} stroke="#9d174d" strokeWidth="1.2" />
          {/* 颈头（右上） */}
          <path d="M44 26 Q48 20 50 14 Q54 15 54 20 Q54 26 50 30 Z" fill={`url(#${gid}-b)`} stroke="#9d174d" strokeWidth="1.1" />
          <circle cx="52" cy="14" r="5.5" fill="#f472b6" stroke="#9d174d" strokeWidth="1.1" />
          <path d="M50 9 Q48 4 50 2 Q52 4 53 8 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="0.8" />
          <path d="M56 13 L61 15 L56 17 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
          {/* 翅（合拢绢羽） */}
          <path d="M30 28 Q36 25 42 30 Q38 38 30 38 Q26 34 30 28 Z" fill="#f9a8d4" stroke="#9d174d" strokeWidth="1" />
          <path d="M31 31 Q36 30 40 33 M30 35 Q35 35 38 37" stroke="#be185d" strokeWidth="0.8" fill="none" />
          {/* 腿 */}
          <path d="M34 42 L33 56 M38 42 L38 56" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
          <path d="M33 56 L30 58 M33 56 L35 58 M38 56 L36 58 M38 56 L40 58" stroke="#9f1239" strokeWidth="1" />
          <path d="M28 28 Q32 23 38 23" fill="none" stroke="#fbcfe8" strokeWidth="1.4" opacity="0.8" strokeLinecap="round" />
          <Eye x={53} y={13} />
        </g>
      )}

      {/* ==================== 金龙 ==================== */}
      {k === '龙' && (
        <g>
          <Ground w={48} />
          {/* 盘绕躯体（粗壮） */}
          <path d="M8 44 Q2 34 12 28 Q24 22 32 26 Q42 30 46 24 Q50 18 47 10" fill="none" stroke={`url(#${gid}-b)`} strokeWidth="11" strokeLinecap="round" />
          <path d="M8 44 Q2 34 12 28 Q24 22 32 26 Q42 30 46 24" fill="none" stroke="#fef08a" strokeWidth="2.6" strokeLinecap="round" opacity="0.5" />
          {/* 背鳍 */}
          <path d="M12 32 L16 26 M20 25 L24 21 M28 23 L32 20 M36 25 L39 21 M42 22 L44 17" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
          {/* 腹甲纹 */}
          <path d="M14 40 Q24 34 32 38 Q42 42 48 34" fill="none" stroke="#fffbeb" strokeWidth="1.8" opacity="0.6" />
          {/* 龙爪 */}
          <path d="M40 28 L35 32 M42 31 L37 35" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M35 32 L32 34 M37 35 L34 37" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" />
          {/* 头（右上，威） */}
          <path d="M44 10 Q52 6 57 10 Q60 15 56 19 Q51 22 47 18 Z" fill={`url(#${gid}-b)`} stroke="#78350f" strokeWidth="1.3" />
          <path d="M56 12 Q61 12 62 15 Q61 18 57 17 Z" fill="#fef08a" stroke="#78350f" strokeWidth="1" />
          <circle cx="59" cy="15" r="0.9" fill="#78350f" />
          {/* 双角（枝状） */}
          <path d="M48 8 L44 0 M46 4 L42 2 M52 7 L51 -1" stroke="#d4a017" strokeWidth="2.2" strokeLinecap="round" />
          {/* 龙须 */}
          <path d="M58 18 Q62 22 61 27 M55 19 Q57 24 55 29" fill="none" stroke="#fbbf24" strokeWidth="1.2" />
          {/* 龙珠（吐于前方） */}
          <circle cx="8" cy="34" r="4" fill="#fff" stroke="#f59e0b" strokeWidth="1.6" />
          <circle cx="8" cy="34" r="1.5" fill="#fde047" />
          <Eye x={53} y={12} c="#7c2d12" />
        </g>
      )}
    </svg>
  )
}
