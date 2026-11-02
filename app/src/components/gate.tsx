/**
 * 关卡之门 · 中国名门系列：12 关对应 12 座真实的门，按「重要性 × 挑战度 × 知名度」
 * 从园林小门一路排到国门——玩家从一座雅致小门出发，最终打到天下最重要的门。
 *
 *   1  月洞门   园林之眼，一步一景
 *   2  棂星门   孔庙正门，求学之门
 *   3  平遥古城门 明清县城，世界遗产
 *   4  永宁门   西安正门，三重门户
 *   5  雁门关   天下九塞，雁门为首
 *   6  玉门关   春风不度，丝路咽喉
 *   7  嘉峪关   天下第一雄关
 *   8  山海关   天下第一关，长城入海
 *   9  中华门   三道瓮城，最大堡垒
 *  10  正阳门   京师九门之首
 *  11  午门     紫禁城正门，五凤楼
 *  12  天安门   国门至尊
 *
 * 状态：locked 整体灰阶 / active 金光环绕 / open 门洞透光。
 */
import { useId, type ReactNode } from 'react'

export type GateState = 'locked' | 'active' | 'open'

export interface GateDesign {
  name: string
  /** 名头 */
  title: string
  /** 悬停典故 */
  note: string
  /** open 状态下门洞透光的中心（viewBox 坐标） */
  glow: { cx: number; cy: number; rx: number; ry: number }
  draw: () => ReactNode
}

/** 门随关卡增大：96px → 140px */
export function gateWidth(level: number): number {
  return 92 + level * 4
}

export function gateDesign(level: number): GateDesign {
  return GATES[Math.min(GATES.length, Math.max(1, level)) - 1]
}

// ---------- 通用小构件 ----------

/** 中式曲线屋面：檐口两端上翘 */
function Roof({ x, y, w, color, edge }: { x: number; y: number; w: number; color: string; edge: string }) {
  const d = `M ${x - 6} ${y} Q ${x + w * 0.5} ${y - 6} ${x + w + 6} ${y} Q ${x + w * 0.72} ${y - 16} ${x + w * 0.5} ${y - 17} Q ${x + w * 0.28} ${y - 16} ${x - 6} ${y} Z`
  return <path d={d} fill={color} stroke={edge} strokeWidth="1.5" strokeLinejoin="round" />
}

/** 雉堞（城墙垛口） */
function Crenels({ x, y, n, w = 6, h = 6, gap = 6, color }: { x: number; y: number; n: number; w?: number; h?: number; gap?: number; color: string }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x + i * (w + gap)} y={y} width={w} height={h} rx={1} fill={color} />
      ))}
    </g>
  )
}

/** 砖墙横缝 */
function Bricks({ x, y, w, h, color, line, rows = 3 }: { x: number; y: number; w: number; h: number; color: string; line: string; rows?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={color} />
      {Array.from({ length: rows }, (_, i) => (
        <line key={i} x1={x} y1={y + ((i + 1) * h) / (rows + 1)} x2={x + w} y2={y + ((i + 1) * h) / (rows + 1)} stroke={line} strokeWidth="1" />
      ))}
    </g>
  )
}

/** 拱形门洞 */
function Arch({ cx, bottom, w, h, fill, edge }: { cx: number; bottom: number; w: number; h: number; fill: string; edge?: string }) {
  const r = w / 2
  const d = `M ${cx - r} ${bottom} V ${bottom - h + r} Q ${cx - r} ${bottom - h} ${cx} ${bottom - h} Q ${cx + r} ${bottom - h} ${cx + r} ${bottom - h + r} V ${bottom} Z`
  return <path d={d} fill={fill} stroke={edge} strokeWidth={edge ? 1.5 : 0} strokeLinejoin="round" />
}

/** 匾额（几笔示意字） */
function Plaque({ x, y, w, h, chars = 3 }: { x: number; y: number; w: number; h: number; chars?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="2" fill="#f6ead0" stroke="#9a7420" strokeWidth="1.5" />
      {Array.from({ length: chars }, (_, i) => (
        <line key={i} x1={x + (w / (chars + 1)) * (i + 1)} y1={y + 3} x2={x + (w / (chars + 1)) * (i + 1)} y2={y + h - 3} stroke="#5b4a26" strokeWidth="1.6" strokeLinecap="round" />
      ))}
    </g>
  )
}

/** 旌旗 */
function Flag({ x, y, h = 16, color = '#d64541' }: { x: number; y: number; h?: number; color?: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - h} stroke="#6d5a3f" strokeWidth="1.6" />
      <path d={`M ${x} ${y - h} L ${x + 12} ${y - h + 3} L ${x} ${y - h + 6} Z`} fill={color} />
    </g>
  )
}

const GATES: GateDesign[] = [
  // 1 月洞门
  {
    name: '月洞门', title: '园林之眼 · 一步一景',
    note: '苏州园林的圆形门洞，走过一扇门，就换一幅画。',
    glow: { cx: 85, cy: 104, rx: 42, ry: 42 },
    draw: () => (
      <g>
        <rect x="8" y="52" width="154" height="98" rx="3" fill="#efe8da" stroke="#d8cdb8" strokeWidth="2" />
        <path d="M4 52 L166 52 L158 41 L12 41 Z" fill="#5f6b78" stroke="#4a545f" strokeWidth="1.5" />
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx={14 + i * 13} cy="46" r="3" fill="#4a545f" />
        ))}
        <circle cx="85" cy="104" r="36" fill="#b9d4e6" stroke="#c9bda2" strokeWidth="6" />
        <path d="M60 88 Q80 68 108 74" fill="none" stroke="#7a8a5a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="74" cy="80" r="2.6" fill="#e8a7b0" />
        <circle cx="97" cy="74" r="2.6" fill="#e8a7b0" />
      </g>
    ),
  },
  // 2 棂星门
  {
    name: '棂星门', title: '孔庙正门 · 求知之门',
    note: '祭孔的第一道门，跨过它就算入了学问的门。',
    glow: { cx: 85, cy: 116, rx: 34, ry: 34 },
    draw: () => (
      <g>
        {[27, 81, 135].map((x) => (
          <g key={x}>
            <rect x={x - 7} y="141" width="14" height="9" rx="1.5" fill="#cbb890" stroke="#a5926a" strokeWidth="1" />
            <rect x={x - 4} y="42" width="8" height="100" fill="#a63b2c" stroke="#7d2b1f" strokeWidth="1.5" />
            <path d={`M ${x - 8} 42 Q ${x - 4} 26 ${x} 22 Q ${x + 4} 26 ${x + 8} 42 Z`} fill="#d9a441" stroke="#a8761f" strokeWidth="1.2" />
          </g>
        ))}
        <rect x="18" y="58" width="134" height="9" fill="#a63b2c" stroke="#7d2b1f" strokeWidth="1" />
        <rect x="18" y="72" width="134" height="7" fill="#8d2f22" />
        <rect x="18" y="68" width="134" height="2" fill="#d9a441" />
        <Plaque x={68} y={44} w={34} h={12} chars={3} />
      </g>
    ),
  },
  // 3 平遥古城门
  {
    name: '平遥古城门', title: '世界遗产 · 明清县城',
    note: '「乌龟城」六座城门，头尾四足，保存最完整的古城。',
    glow: { cx: 85, cy: 134, rx: 18, ry: 24 },
    draw: () => (
      <g>
        <Bricks x={16} y={96} w={138} h={54} color="#b3ac9b" line="#948c78" />
        <Crenels x={20} y={88} n={11} color="#a49c8a" />
        <rect x="52" y="56" width="66" height="40" fill="#8a5a33" stroke="#6d4526" strokeWidth="1.5" />
        {[62, 82, 102].map((x) => (
          <g key={x}>
            <rect x={x} y="64" width="12" height="16" fill="#5b3a1e" />
            <line x1={x + 6} y1="64" x2={x + 6} y2="80" stroke="#8a5a33" strokeWidth="1" />
          </g>
        ))}
        <Plaque x={76} y={82} w={18} h={9} chars={2} />
        <Roof x={44} y={56} w={82} color="#5b6570" edge="#454e58" />
        <Arch cx={85} bottom={150} w={26} h={34} fill="#4a3f30" edge="#8d8674" />
      </g>
    ),
  },
  // 4 永宁门
  {
    name: '永宁门', title: '西安城墙正门 · 三重门户',
    note: '闸楼、箭楼、正楼三重门户，吊桥一拉，万夫莫开。',
    glow: { cx: 85, cy: 132, rx: 18, ry: 24 },
    draw: () => (
      <g>
        {/* 后：正楼 */}
        <rect x="58" y="38" width="54" height="28" fill="#9c4a38" stroke="#7a3628" strokeWidth="1.5" />
        {[66, 78, 90, 102].map((x) => (
          <line key={x} x1={x} y1="40" x2={x} y2="64" stroke="#7a3628" strokeWidth="1.4" />
        ))}
        <Roof x={48} y={38} w={74} color="#4a5b6b" edge="#37454f" />
        {/* 中：箭楼 */}
        <Bricks x={50} y={64} w={70} h={36} color="#b3ac9b" line="#948c78" rows={2} />
        {[58, 70, 82, 94, 106].map((x) => (
          <g key={x}>
            <rect x={x} y="70" width="5" height="7" fill="#4a3f30" />
            <rect x={x} y="84" width="5" height="7" fill="#4a3f30" />
          </g>
        ))}
        <Roof x={44} y={64} w={82} color="#4a5b6b" edge="#37454f" />
        {/* 城墙与门 */}
        <Bricks x={12} y={100} w={146} h={50} color="#b3ac9b" line="#948c78" />
        <Crenels x={16} y={92} n={12} color="#a49c8a" />
        <Arch cx={85} bottom={150} w={28} h={34} fill="#4a3f30" edge="#8d8674" />
        {/* 吊桥铁链 */}
        <path d="M72 150 Q58 162 42 168" fill="none" stroke="#6d6252" strokeWidth="1.8" />
        <path d="M98 150 Q112 162 128 168" fill="none" stroke="#6d6252" strokeWidth="1.8" />
        <line x1="60" y1="156" x2="110" y2="156" stroke="#8a7c66" strokeWidth="1.6" />
        <line x1="54" y1="161" x2="116" y2="161" stroke="#8a7c66" strokeWidth="1.6" />
      </g>
    ),
  },
  // 5 雁门关
  {
    name: '雁门关', title: '天下九塞 · 雁门为首',
    note: '「黑云压城城欲摧」——李贺笔下的战场，杨家将镇守之地。',
    glow: { cx: 85, cy: 138, rx: 13, ry: 18 },
    draw: () => (
      <g>
        {/* 群山 */}
        <path d="M0 150 L0 82 L38 36 L74 88 L84 100 L76 150 Z" fill="#8a97a8" />
        <path d="M170 150 L170 86 L132 38 L96 96 L86 104 L94 150 Z" fill="#77869a" />
        {/* 长城沿山脊 */}
        <path d="M0 90 L36 44" stroke="#c1bbaa" strokeWidth="5" strokeLinecap="round" />
        <path d="M170 94 L136 46" stroke="#c1bbaa" strokeWidth="5" strokeLinecap="round" />
        {[
          [2, 86], [14, 72], [26, 58],
          [168, 90], [156, 76], [144, 62],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="5" height="5" fill="#c1bbaa" />
        ))}
        {/* 关城与城楼 */}
        <Bricks x={70} y={100} w={30} h={50} color="#c1bbaa" line="#a29c8b" rows={3} />
        <Crenels x={71} y={93} n={3} w={6} gap={4} color="#b3ad9c" />
        <rect x="70" y="66" width="30" height="30" fill="#9c4a38" stroke="#7a3628" strokeWidth="1.5" />
        <rect x="76" y="72" width="18" height="10" fill="#5b3a1e" />
        <Roof x={62} y={66} w={46} color="#4f5b68" edge="#3c4650" />
        <Flag x={85} y={50} h={16} />
        <Arch cx={85} bottom={150} w={18} h={26} fill="#3f3529" />
      </g>
    ),
  },
  // 6 玉门关
  {
    name: '玉门关', title: '春风不度 · 丝路咽喉',
    note: '王之涣《凉州词》：「羌笛何须怨杨柳，春风不度玉门关。」',
    glow: { cx: 85, cy: 138, rx: 13, ry: 17 },
    draw: () => (
      <g>
        <circle cx="34" cy="42" r="14" fill="#f5b86b" opacity="0.85" />
        {/* 沙丘 */}
        <path d="M0 150 Q42 130 84 144 T170 136 L170 150 Z" fill="#e3c08d" />
        <path d="M96 150 Q130 138 170 146 L170 150 Z" fill="#d4ac72" />
        {/* 小方盘城 */}
        <rect x="58" y="80" width="54" height="70" fill="#d9b380" stroke="#b98f58" strokeWidth="2" />
        {[94, 108, 122, 136].map((y) => (
          <line key={y} x1="58" y1={y} x2="112" y2={y} stroke="#c49f66" strokeWidth="1.2" />
        ))}
        <rect x="58" y="74" width="54" height="7" fill="#cfa76d" />
        <Crenels x={61} y={68} n={5} w={7} gap={3} color="#c49f66" />
        <Arch cx={85} bottom={150} w={20} h={26} fill="#6b5335" />
        {/* 烽燧与狼烟 */}
        <rect x="124" y="54" width="18" height="96" fill="#d3ac74" stroke="#b98f58" strokeWidth="1.5" />
        {[70, 90, 110, 130].map((y) => (
          <line key={y} x1="124" y1={y} x2="142" y2={y} stroke="#c49f66" strokeWidth="1.2" />
        ))}
        <rect x="121" y="49" width="24" height="6" rx="1" fill="#c49f66" />
        <path d="M133 48 Q128 38 133 30 Q138 24 134 16" fill="none" stroke="#cfc9bd" strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />
        {/* 驼队剪影 */}
        <g fill="#8a6f4d">
          <path d="M14 142 q3 -8 6 0 q3 -8 6 0 v5 h-3 v-2 h-6 v2 h-3 Z" />
          <path d="M34 145 q2.4 -7 5 0 q2.4 -7 5 0 v4 h-2.5 v-2 h-5 v2 h-2.5 Z" />
        </g>
      </g>
    ),
  },
  // 7 嘉峪关
  {
    name: '嘉峪关', title: '天下第一雄关',
    note: '万里长城西端起点，传说竣工时只多出一块「定城砖」。',
    glow: { cx: 85, cy: 132, rx: 16, ry: 22 },
    draw: () => (
      <g>
        {/* 内城正楼（重檐） */}
        <rect x="64" y="40" width="42" height="26" fill="#9c4a38" stroke="#7a3628" strokeWidth="1.5" />
        {[72, 82, 92, 100].map((x) => (
          <line key={x} x1={x} y1="42" x2={x} y2="64" stroke="#7a3628" strokeWidth="1.2" />
        ))}
        <Roof x={58} y={40} w={54} color="#3f6e5f" edge="#2f564a" />
        <Plaque x={74} y={48} w={22} h={9} chars={2} />
        {/* 下层楼体与腰檐 */}
        <Bricks x={56} y={66} w={58} h={38} color="#b3ac9b" line="#948c78" rows={2} />
        {[64, 76, 88, 100].map((x) => (
          <rect key={x} x={x} y="74" width="6" height="9" fill="#4a3f30" />
        ))}
        <Roof x={48} y={66} w={74} color="#3f6e5f" edge="#2f564a" />
        {/* 主城墙与门洞 */}
        <Bricks x={54} y={104} w={62} h={46} color="#b3ac9b" line="#948c78" />
        <Crenels x={56} y={96} n={5} w={7} gap={5} color="#a49c8a" />
        <Arch cx={85} bottom={150} w={24} h={30} fill="#4a3f30" edge="#8d8674" />
        {/* 左：瓮城与闸楼 */}
        <Bricks x={14} y={110} w={42} h={40} color="#a8a192" line="#8d8674" rows={2} />
        <Crenels x={16} y={103} n={3} w={7} gap={5} color="#9a9282" />
        <rect x="22" y="94" width="26" height="16" fill="#9c4a38" stroke="#7a3628" strokeWidth="1.2" />
        <Roof x={18} y={94} w={34} color="#3f6e5f" edge="#2f564a" />
        {/* 右：角楼 */}
        <rect x="136" y="96" width="22" height="14" fill="#9c4a38" stroke="#7a3628" strokeWidth="1.2" />
        <Roof x={132} y={96} w={30} color="#3f6e5f" edge="#2f564a" />
        <Bricks x={120} y={112} w={40} h={38} color="#a8a192" line="#8d8674" rows={2} />
      </g>
    ),
  },
  // 8 山海关
  {
    name: '山海关', title: '天下第一关 · 长城入海',
    note: '关宁咽喉，长城在这里伸进大海，城楼上悬着明代巨匾。',
    glow: { cx: 85, cy: 134, rx: 16, ry: 22 },
    draw: () => (
      <g>
        {/* 长城入海 */}
        <path d="M138 122 L170 108" stroke="#b3ac9b" strokeWidth="6" strokeLinecap="round" />
        <path d="M144 116 q5 -4 8 -6 M154 111 q4 -2 8 -4" fill="none" stroke="#8fb8d4" strokeWidth="2" strokeLinecap="round" />
        <path d="M0 150 H170 V168 H0 Z" fill="#a5cbe4" opacity="0.75" />
        {/* 上层楼体 */}
        <rect x="58" y="42" width="54" height="22" fill="#9c4a38" stroke="#7a3628" strokeWidth="1.5" />
        {[66, 76, 86, 96, 104].map((x) => (
          <rect key={x} x={x} y="47" width="6" height="10" fill="#5b3a1e" />
        ))}
        <Roof x={48} y={42} w={74} color="#4a5b6b" edge="#37454f" />
        <Flag x={85} y={26} h={16} />
        {/* 下层楼体与巨匾 */}
        <Bricks x={52} y={64} w={66} h={31} color="#b3ac9b" line="#948c78" rows={2} />
        <Plaque x={60} y={70} w={50} h={15} chars={5} />
        <Roof x={46} y={64} w={78} color="#4a5b6b" edge="#37454f" />
        {/* 城墙与门 */}
        <Bricks x={20} y={95} w={118} h={55} color="#b3ac9b" line="#948c78" />
        <Crenels x={24} y={87} n={9} color="#a49c8a" />
        <Arch cx={85} bottom={150} w={24} h={30} fill="#4a3f30" edge="#8d8674" />
      </g>
    ),
  },
  // 9 中华门
  {
    name: '中华门', title: '三道瓮城 · 现存最大堡垒城门',
    note: '南京聚宝门：敌人冲进第一道拱，头顶落闸就成了「瓮中之鳖」。',
    glow: { cx: 85, cy: 128, rx: 24, ry: 30 },
    draw: () => (
      <g>
        <Bricks x={10} y={66} w={150} h={84} color="#b3a194" line="#97877a" rows={4} />
        <Crenels x={14} y={58} n={12} color="#a59386" />
        {/* 一重瓮城（外拱） */}
        <Arch cx={85} bottom={150} w={52} h={62} fill="#6e6155" edge="#8d7d6f" />
        {/* 二重 */}
        <Arch cx={85} bottom={150} w={38} h={50} fill="#575046" edge="#7c7065" />
        {/* 三重（门洞） */}
        <Arch cx={85} bottom={150} w={26} h={40} fill="#3c342b" />
        {/* 藏兵洞 */}
        {[26, 40, 116, 130].map((x) => (
          <rect key={x} x={x} y={118} width="10" height="16" rx="4" fill="#4a3f34" />
        ))}
        <Plaque x={68} y={72} w={34} h={12} chars={3} />
      </g>
    ),
  },
  // 10 正阳门
  {
    name: '正阳门', title: '京师九门之首',
    note: '俗称「前门楼子」：箭楼与城楼两重，皇城的正门脸面。',
    glow: { cx: 85, cy: 136, rx: 16, ry: 20 },
    draw: () => (
      <g>
        {/* 后：城楼 */}
        <rect x="56" y="34" width="58" height="32" fill="#9c4a38" stroke="#7a3628" strokeWidth="1.5" />
        {[64, 76, 88, 100, 108].map((x) => (
          <line key={x} x1={x} y1="36" x2={x} y2="64" stroke="#7a3628" strokeWidth="1.2" />
        ))}
        <Roof x={46} y={34} w={78} color="#4a5b6b" edge="#37454f" />
        {/* 前：箭楼 */}
        <path d="M56 66 L114 66 L110 122 L60 122 Z" fill="#b3ac9b" stroke="#948c78" strokeWidth="1.5" />
        {[64, 76, 88, 100].map((x) => (
          <g key={x}>
            <rect x={x - 2} y="74" width="5" height="7" fill="#4a3f30" />
            <rect x={x + 6} y="74" width="5" height="7" fill="#4a3f30" />
            <rect x={x - 2} y="90" width="5" height="7" fill="#4a3f30" />
            <rect x={x + 6} y="90" width="5" height="7" fill="#4a3f30" />
          </g>
        ))}
        <Crenels x={58} y={58} n={7} w={6} gap={3} color="#a49c8a" />
        <Roof x={48} y={58} w={74} color="#4a5b6b" edge="#37454f" />
        {/* 城墙与门 */}
        <Bricks x={34} y={122} w={102} h={28} color="#b3ac9b" line="#948c78" rows={2} />
        <Crenels x={38} y={114} n={8} color="#a49c8a" />
        <Arch cx={85} bottom={150} w={24} h={26} fill="#4a3f30" edge="#8d8674" />
      </g>
    ),
  },
  // 11 午门
  {
    name: '午门', title: '紫禁城正门 · 五凤楼',
    note: '凹形城台上五座楼阁，颁诏书、打胜仗献俘都在这里。',
    glow: { cx: 85, cy: 126, rx: 20, ry: 28 },
    draw: () => (
      <g>
        {/* 城台 */}
        <Bricks x={15} y={92} w={140} h={58} color="#c9b7a0" line="#a8947c" rows={3} />
        <Crenels x={19} y={84} n={11} color="#b5a28a" />
        <Arch cx={85} bottom={150} w={30} h={44} fill="#4a3527" edge="#8f7a63" />
        <Arch cx={34} bottom={150} w={14} h={22} fill="#5c4432" />
        <Arch cx={136} bottom={150} w={14} h={22} fill="#5c4432" />
        {/* 正楼（重檐） */}
        <rect x="66" y="52" width="38" height="32" fill="#9c3a2c" stroke="#7a2b20" strokeWidth="1.5" />
        {[74, 82, 90, 96].map((x) => (
          <line key={x} x1={x} y1="54" x2={x} y2="82" stroke="#7a2b20" strokeWidth="1.2" />
        ))}
        <Roof x={56} y={52} w={58} color="#d9a441" edge="#a8761f" />
        <rect x="74" y="34" width="22" height="18" fill="#9c3a2c" stroke="#7a2b20" strokeWidth="1.2" />
        <Roof x={66} y={34} w={38} color="#d9a441" edge="#a8761f" />
        {/* 左右阙亭 */}
        <rect x="30" y="76" width="24" height="14" fill="#9c3a2c" stroke="#7a2b20" strokeWidth="1.2" />
        <Roof x={25} y={76} w={34} color="#d9a441" edge="#a8761f" />
        <rect x="116" y="76" width="24" height="14" fill="#9c3a2c" stroke="#7a2b20" strokeWidth="1.2" />
        <Roof x={111} y={76} w={34} color="#d9a441" edge="#a8761f" />
        {/* 角亭 */}
        <rect x="13" y="80" width="14" height="10" fill="#9c3a2c" stroke="#7a2b20" strokeWidth="1" />
        <Roof x={10} y={80} w={20} color="#d9a441" edge="#a8761f" />
        <rect x="143" y="80" width="14" height="10" fill="#9c3a2c" stroke="#7a2b20" strokeWidth="1" />
        <Roof x={140} y={80} w={20} color="#d9a441" edge="#a8761f" />
      </g>
    ),
  },
  // 12 天安门
  {
    name: '天安门', title: '国门 · 至尊',
    note: '明永乐年间建，初名承天门，后改天安门——金水桥前的开国之门。',
    glow: { cx: 85, cy: 130, rx: 18, ry: 26 },
    draw: () => (
      <g>
        {/* 金水河与桥 */}
        <rect x="0" y="152" width="170" height="16" fill="#9ec8e8" />
        {[30, 57, 85, 113, 140].map((cx) => (
          <path key={cx} d={`M ${cx - 9} 158 Q ${cx} 150 ${cx + 9} 158`} fill="none" stroke="#d8cfc0" strokeWidth="3.5" strokeLinecap="round" />
        ))}
        {/* 华表 */}
        {[6, 164].map((x) => (
          <g key={x}>
            <rect x={x - 2} y="62" width="4" height="86" fill="#e6dcc8" stroke="#c4b79c" strokeWidth="1" />
            <rect x={x - 5} y="84" width="10" height="4" rx="1" fill="#d9cbb0" />
            <circle cx={x} cy="58" r="3.4" fill="#d9a441" />
          </g>
        ))}
        {/* 城台与五个门洞 */}
        <Bricks x={10} y={88} w={150} h={64} color="#dcb98d" line="#c09a6b" rows={3} />
        <Arch cx={85} bottom={152} w={28} h={44} fill="#5a3d28" edge="#a8845c" />
        <Arch cx={45} bottom={152} w={18} h={30} fill="#6b4a30" />
        <Arch cx={125} bottom={152} w={18} h={30} fill="#6b4a30" />
        <Arch cx={22} bottom={152} w={14} h={24} fill="#755438" />
        <Arch cx={148} bottom={152} w={14} h={24} fill="#755438" />
        {/* 城楼大殿（重檐） */}
        <rect x="48" y="60" width="74" height="28" fill="#b03a2a" stroke="#8a2b1e" strokeWidth="1.5" />
        {[56, 68, 80, 92, 104, 114].map((x) => (
          <line key={x} x1={x} y1="62" x2={x} y2="86" stroke="#8a2b1e" strokeWidth="1.3" />
        ))}
        {[62, 74, 86, 98, 110].map((x) => (
          <rect key={x} x={x - 3} y="68" width="7" height="9" fill="#6e2418" />
        ))}
        <Roof x={40} y={60} w={90} color="#e0a63f" edge="#a8761f" />
        <rect x="60" y="38" width="50" height="22" fill="#b03a2a" stroke="#8a2b1e" strokeWidth="1.3" />
        {[68, 80, 92, 102].map((x) => (
          <line key={x} x1={x} y1="40" x2={x} y2="58" stroke="#8a2b1e" strokeWidth="1.1" />
        ))}
        <Roof x={50} y={38} w={70} color="#e0a63f" edge="#a8761f" />
        <Flag x={56} y={22} h={15} />
        <Flag x={114} y={22} h={15} />
      </g>
    ),
  },
]

export function LevelGate({
  level,
  state,
  className = '',
  size,
}: {
  level: number
  state: GateState
  className?: string
  /** 覆盖默认宽度（如转场大图） */
  size?: number
}) {
  const d = gateDesign(level)
  const gid = useId()
  const filter =
    state === 'locked'
      ? 'grayscale(1) opacity(0.92)'
      : state === 'active'
        ? 'drop-shadow(0 0 9px rgba(251, 191, 36, 0.6))'
        : 'drop-shadow(0 0 14px rgba(253, 224, 71, 0.75))'

  return (
    <svg
      viewBox="0 0 170 175"
      width={size ?? gateWidth(level)}
      className={className}
      data-gate={level}
      data-name={d.name}
      data-title={d.title}
      style={{ filter }}
      aria-hidden
    >
      <defs>
        <radialGradient id={gid}>
          <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#fde68a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {state === 'open' && (
        <ellipse className="gate-open-glow" cx={d.glow.cx} cy={d.glow.cy} rx={d.glow.rx} ry={d.glow.ry} fill={`url(#${gid})`} />
      )}
      {d.draw()}
    </svg>
  )
}

/** 关卡地图背景：一整条从左到右的旅程——晨昼（左）→ 黄昏 → 星夜（右）。
 *  div + CSS 渐变实现，任意尺寸自适应，无拉伸变形。 */
export function WorldScenery({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* 天空：横向晨昏渐变 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, #cfe5fb 0%, #e8f3fd 20%, #fdeacb 42%, #d8b4e0 54%, #6d4fa8 72%, #2e2158 100%)',
        }}
      />
      {/* 太阳（左） */}
      <div
        className="absolute rounded-full"
        style={{ left: '3%', top: '9%', width: 96, height: 96, background: 'radial-gradient(circle, #fcd34d 45%, rgba(253,230,138,0.35) 68%, transparent 75%)' }}
      />
      {/* 云（左半） */}
      {[
        { l: '12%', t: '12%', w: 120, o: 0.8 },
        { l: '20%', t: '22%', w: 84, o: 0.65 },
        { l: '31%', t: '8%', w: 96, o: 0.7 },
      ].map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: c.l, top: c.t, width: c.w, height: c.w * 0.36, opacity: c.o, filter: 'blur(1px)' }}
        />
      ))}
      {/* 月亮（右） */}
      <div className="absolute" style={{ left: '86%', top: '9%' }}>
        <div className="absolute h-14 w-14 rounded-full bg-[#fef9c3] shadow-[0_0_30px_rgba(254,249,195,.45)]" />
        <div className="absolute -left-3 -top-1 h-12 w-12 rounded-full" style={{ background: '#5b3f96' }} />
      </div>
      {/* 星星（右半） */}
      {[
        [60, 8], [64, 15], [69, 6], [73, 12], [78, 18], [82, 5], [87, 16],
        [91, 9], [95, 14], [62, 24], [70, 26], [80, 27], [90, 25], [96, 6],
      ].map(([l, t], i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${l}%`, top: `${t}%`, width: i % 3 === 0 ? 3.5 : 2.2, height: i % 3 === 0 ? 3.5 : 2.2, opacity: 0.9 }}
        />
      ))}
      {/* 远山（横向渐变：白日青 → 夜紫） */}
      <svg className="absolute inset-x-0 bottom-0 h-[40%] w-full" viewBox="0 0 1200 320" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="hill-far" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="55%" stopColor="#8b6fc0" />
            <stop offset="100%" stopColor="#3c2a6e" />
          </linearGradient>
          <linearGradient id="hill-near" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#dbe4ff" />
            <stop offset="55%" stopColor="#6d4fa8" />
            <stop offset="100%" stopColor="#241a4e" />
          </linearGradient>
        </defs>
        <path
          d="M0 320 L0 210 Q80 150 160 190 Q250 90 340 170 Q430 240 520 160 Q610 80 700 170 Q790 230 880 150 Q970 80 1060 180 Q1130 240 1200 190 L1200 320 Z"
          fill="url(#hill-far)"
          opacity="0.85"
        />
        <path
          d="M0 320 L0 260 Q120 210 240 250 Q360 285 480 235 Q600 190 720 245 Q840 285 960 235 Q1080 195 1200 255 L1200 320 Z"
          fill="url(#hill-near)"
        />
      </svg>
    </div>
  )
}

/** 章节任务路径的背景风景（晨昼） */
export function Scenery({ variant = 'day', className = '' }: { variant?: 'day' | 'dusk'; className?: string }) {
  const day = variant === 'day'
  const skyA = day ? '#dbeafe' : '#1e1b4b'
  const skyB = day ? '#f0f9ff' : '#7c3aed'
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 800 520"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={`sky-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyA} />
          <stop offset="100%" stopColor={skyB} />
        </linearGradient>
      </defs>
      <rect width="800" height="520" fill={`url(#sky-${variant})`} />

      {day ? (
        <>
          <circle cx="150" cy="88" r="46" fill="#fde68a" opacity="0.35" />
          <circle cx="150" cy="88" r="26" fill="#fcd34d" />
          {[
            [120, 160, 26, 10],
            [520, 84, 30, 11],
            [640, 170, 20, 8],
          ].map(([x, y, rx, ry], i) => (
            <g key={i} fill="#ffffff" opacity="0.75">
              <ellipse cx={x} cy={y} rx={rx} ry={ry} />
              <ellipse cx={(x ?? 0) + (rx ?? 0) * 0.8} cy={(y ?? 0) + 3} rx={(rx ?? 0) * 0.7} ry={(ry ?? 0) * 0.8} />
              <ellipse cx={(x ?? 0) - (rx ?? 0) * 0.7} cy={(y ?? 0) + 4} rx={(rx ?? 0) * 0.6} ry={(ry ?? 0) * 0.75} />
            </g>
          ))}
        </>
      ) : (
        <>
          <circle cx="640" cy="88" r="30" fill="#fef9c3" />
          <circle cx="629" cy="79" r="26" fill="#7c3aed" opacity="0.9" />
          {[
            [90, 70], [210, 120], [330, 60], [420, 150], [500, 96],
            [720, 180], [760, 60], [160, 220], [600, 250], [70, 300],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.2 : 1.5} fill="#fff" opacity="0.85" />
          ))}
        </>
      )}

      {/* 远山 */}
      <polygon
        points="0,520 0,330 110,220 190,300 300,190 400,300 490,230 600,310 700,205 800,320 800,520"
        fill={day ? '#c7d2fe' : '#4c1d95'}
        opacity={day ? 0.85 : 0.95}
      />
      {/* 中丘 */}
      <path d="M0 520 L0 400 Q200 330 400 395 T800 385 L800 520 Z" fill={day ? '#a5b4fc' : '#5b21b6'} />
      {/* 近地 */}
      <path d="M0 520 L0 455 Q250 400 520 460 T800 445 L800 520 Z" fill={day ? '#e0e7ff' : '#6d28d9'} />
    </svg>
  )
}
