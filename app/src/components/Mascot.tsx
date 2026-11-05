/**
 * 学伴精灵：六种完全不同的可爱形态——不限于毛栗原型。
 *   毛栗：经典圆滚滚（去掉了胸前多余块）
 *   小狐：橙绒尖耳狐狸 + 大蓬尾
 *   猫又：圆脸猫 + 长卷尾 + 胡须
 *   云绵：云朵绵羊 + 小翅膀
 *   萤仔：发光精灵 + 尾部光粒
 *   阿宝：Q 版漫画小孩 + 呆毛
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAppData } from '../lib/store'
import { skinOf } from '../lib/outfits'
import { beastsOwned } from '../lib/beasts'
import { BeastFigure } from './BeastFigure'

// ---------- 各形态 ----------

function BodyMillet({ p, id }: { p: { body: string; edge: string; inner: string; feet: string }; id: string }) {
  return (
    <>
      <path d="M62 86 Q40 32 34 2 Q86 24 106 56 Z" fill={`url(#${id}-body)`} stroke={p.edge} strokeWidth="3" strokeLinejoin="round" />
      <path d="M158 86 Q180 32 186 2 Q134 24 114 56 Z" fill={`url(#${id}-body)`} stroke={p.edge} strokeWidth="3" strokeLinejoin="round" />
      <path d="M66 76 Q52 42 48 18 Q82 36 98 58 Z" fill={p.inner} />
      <path d="M154 76 Q168 42 172 18 Q138 36 122 58 Z" fill={p.inner} />
      <path d="M108 42 Q110 26 117 15" fill="none" stroke="#5c8a34" strokeWidth="3" strokeLinecap="round" />
      <path d="M117 15 Q133 0 151 7 Q137 22 117 20 Z" fill="#8bc34a" stroke="#4e7f2c" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="110" cy="145" rx="80" ry="65" fill={`url(#${id}-body)`} stroke={p.edge} strokeWidth="3" />
      <circle cx="82" cy="112" r="9" fill="#fff" stroke={p.edge} strokeWidth="2.5" />
      <circle cx="138" cy="112" r="9" fill="#fff" stroke={p.edge} strokeWidth="2.5" />
      <circle cx="83.5" cy="114" r="4.6" fill="#1c2233" />
      <circle cx="139.5" cy="114" r="4.6" fill="#1c2233" />
      <circle cx="86" cy="111" r="1.8" fill="#fff" />
      <circle cx="142" cy="111" r="1.8" fill="#fff" />
      <path d="M72 100 L90 103" stroke={p.edge} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M148 100 L130 103" stroke={p.edge} strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="62" cy="128" rx="7" ry="4.2" fill="#f4a9b0" opacity="0.55" />
      <ellipse cx="158" cy="128" rx="7" ry="4.2" fill="#f4a9b0" opacity="0.55" />
      <ellipse cx="110" cy="126" rx="4" ry="3" fill={p.edge} />
      <path d="M102 134 Q110 142 118 134" fill="none" stroke={p.edge} strokeWidth="2.5" strokeLinecap="round" />
      <g stroke={p.inner} strokeWidth="2.6" strokeLinecap="round">
        <line x1="24" y1="106" x2="48" y2="112" /><line x1="20" y1="122" x2="46" y2="122" /><line x1="24" y1="138" x2="48" y2="132" />
        <line x1="196" y1="106" x2="172" y2="112" /><line x1="200" y1="122" x2="174" y2="122" /><line x1="196" y1="138" x2="172" y2="132" />
      </g>
      <ellipse cx="42" cy="162" rx="17" ry="9" fill={p.feet} stroke={p.edge} strokeWidth="3" transform="rotate(24 42 162)" />
      <ellipse cx="178" cy="156" rx="17" ry="9" fill={p.feet} stroke={p.edge} strokeWidth="3" transform="rotate(-24 178 156)" />
      <ellipse cx="86" cy="205" rx="16" ry="8" fill={p.feet} stroke={p.edge} strokeWidth="3" />
      <ellipse cx="134" cy="205" rx="16" ry="8" fill={p.feet} stroke={p.edge} strokeWidth="3" />
    </>
  )
}

function BodyFox() {
  return (
    <>
      <path d="M186 130 Q210 140 204 116 Q198 136 178 138 Z" fill="#f97316" stroke="#c2410c" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M64 60 Q48 20 42 4 Q86 18 102 44 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="3" strokeLinejoin="round" />
      <path d="M156 60 Q172 20 178 4 Q134 18 118 44 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 26 Q46 14 43 7 Q60 16 68 26 Z" fill="#7c2d12" stroke="none" />
      <path d="M170 26 Q174 14 177 7 Q160 16 152 26 Z" fill="#7c2d12" stroke="none" />
      <path d="M110 50 Q162 60 160 122 Q158 180 110 192 Q62 180 60 122 Q58 60 110 50 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="82" cy="96" rx="9" ry="10" fill="#fff7ed" stroke="#7c2d12" strokeWidth="2" />
      <ellipse cx="138" cy="96" rx="9" ry="10" fill="#fff7ed" stroke="#7c2d12" strokeWidth="2" />
      <circle cx="83" cy="97" r="4.5" fill="#1c1917" />
      <circle cx="137" cy="97" r="4.5" fill="#1c1917" />
      <circle cx="85" cy="95" r="1.5" fill="#fff" />
      <circle cx="139" cy="95" r="1.5" fill="#fff" />
      <path d="M70 84 L92 88" stroke="#7c2d12" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M150 84 L128 88" stroke="#7c2d12" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M104 122 Q110 118 116 122 Q114 130 110 130 Q106 130 104 122 Z" fill="#1c1917" />
      <path d="M100 136 Q110 144 120 136" fill="none" stroke="#7c2d12" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="52" cy="160" rx="12" ry="14" fill="#c2410c" transform="rotate(18 52 160)" />
      <ellipse cx="86" cy="205" rx="16" ry="8" fill="#c2410c" />
      <ellipse cx="134" cy="205" rx="16" ry="8" fill="#c2410c" />
    </>
  )
}

function BodyCat() {
  return (
    <>
      <path d="M58 62 Q42 24 38 6 Q84 20 100 46 Z" fill="#f8fafc" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
      <path d="M162 62 Q178 24 182 6 Q136 20 120 46 Z" fill="#f8fafc" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
      <path d="M62 52 Q50 28 46 14 Q76 26 88 42 Z" fill="#fbc6d4" stroke="none" />
      <path d="M158 52 Q170 28 174 14 Q144 26 132 42 Z" fill="#fbc6d4" stroke="none" />
      <path d="M110 56 Q160 66 158 124 Q156 178 110 192 Q64 178 62 124 Q60 66 110 56 Z" fill="#f8fafc" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="82" cy="104" rx="10" ry="11" fill="#fff" stroke="#475569" strokeWidth="2.5" />
      <ellipse cx="138" cy="104" rx="10" ry="11" fill="#fff" stroke="#475569" strokeWidth="2.5" />
      <circle cx="83" cy="106" r="5" fill="#1e293b" />
      <circle cx="137" cy="106" r="5" fill="#1e293b" />
      <circle cx="85" cy="104" r="1.8" fill="#fff" />
      <circle cx="139" cy="104" r="1.8" fill="#fff" />
      <path d="M78 122 Q82 126 86 122" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <path d="M106 122 Q110 126 114 122" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <path d="M86 130 Q95 138 104 130" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="62" cy="118" rx="8" ry="5" fill="#fbb6ce" opacity="0.6" />
      <ellipse cx="158" cy="118" rx="8" ry="5" fill="#fbb6ce" opacity="0.6" />
      <g stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round">
        <line x1="22" y1="98" x2="48" y2="104" /><line x1="18" y1="114" x2="46" y2="114" /><line x1="22" y1="130" x2="48" y2="124" />
        <line x1="198" y1="98" x2="172" y2="104" /><line x1="202" y1="114" x2="174" y2="114" /><line x1="198" y1="130" x2="172" y2="124" />
      </g>
      <ellipse cx="86" cy="205" rx="16" ry="8" fill="#e2e8f0" stroke="#475569" strokeWidth="3" />
      <ellipse cx="134" cy="205" rx="16" ry="8" fill="#e2e8f0" stroke="#475569" strokeWidth="3" />
    </>
  )
}

function BodyCloudSheep() {
  return (
    <>
      <path d="M36 70 Q28 58 34 48 Q46 44 50 52 Q52 40 64 40 Q72 42 72 52 Q80 44 90 48 Q94 56 88 62 Q96 60 100 66 Q98 74 88 76 L40 76 Q30 76 36 70 Z" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M120 70 Q128 58 122 48 Q110 44 106 52 Q104 40 92 40 Q84 42 84 52 Q76 44 66 48 Q62 56 68 62 Q60 60 56 66 Q58 74 68 76 L116 76 Q126 76 120 70 Z" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M46 120 Q36 100 56 90 Q50 76 70 72 Q110 68 130 82 Q140 94 134 110 Q130 128 110 140 L60 140 Q44 136 46 120 Z" fill="#f0f9ff" stroke="#7dd3fc" strokeWidth="3" strokeLinejoin="round" />
      <path d="M46 120 Q36 100 56 90" fill="none" stroke="#bae6fd" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <path d="M134 110 Q140 94 130 82" fill="none" stroke="#bae6fd" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <circle cx="82" cy="98" r="9" fill="#fff" stroke="#7dd3fc" strokeWidth="2.5" />
      <circle cx="126" cy="96" r="9" fill="#fff" stroke="#7dd3fc" strokeWidth="2.5" />
      <circle cx="83.5" cy="100" r="4.5" fill="#0ea5e9" />
      <circle cx="127.5" cy="98" r="4.5" fill="#0ea5e9" />
      <circle cx="85" cy="98" r="1.6" fill="#fff" />
      <circle cx="129" cy="96" r="1.6" fill="#fff" />
      <ellipse cx="104" cy="112" rx="4" ry="3" fill="#7dd3fc" />
      <path d="M98 118 Q104 124 110 118" fill="none" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M64 140 L62 156 M84 142 L82 158 M124 140 L126 158 M142 138 L144 156" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="82" cy="204" rx="14" ry="8" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="3" />
      <ellipse cx="130" cy="204" rx="14" ry="8" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="3" />
    </>
  )
}

function BodyFirefly() {
  return (
    <>
      <circle cx="110" cy="110" r="52" fill="#fef9c3" opacity="0.15" />
      <circle cx="110" cy="110" r="38" fill="#fde047" opacity="0.15" />
      <ellipse cx="110" cy="130" rx="46" ry="50" fill="#fde68a" stroke="#eab308" strokeWidth="3" />
      <ellipse cx="110" cy="140" rx="32" ry="34" fill="#fef9c3" />
      <circle cx="82" cy="102" r="10" fill="#fff" stroke="#ca8a04" strokeWidth="2.5" />
      <circle cx="138" cy="102" r="10" fill="#fff" stroke="#ca8a04" strokeWidth="2.5" />
      <circle cx="83" cy="104" r="5" fill="#854d0e" />
      <circle cx="137" cy="104" r="5" fill="#854d0e" />
      <circle cx="85" cy="102" r="1.8" fill="#fff" />
      <circle cx="139" cy="102" r="1.8" fill="#fff" />
      <path d="M70 90 L92 94" stroke="#ca8a04" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M150 90 L128 94" stroke="#ca8a04" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="110" cy="122" rx="4" ry="3" fill="#ca8a04" />
      <path d="M102 130 Q110 138 118 130" fill="none" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
      <g fill="#fde047">
        <circle cx="52" cy="90" r="3" opacity="0.8" /><circle cx="172" cy="88" r="3.5" opacity="0.7" /><circle cx="48" cy="130" r="2.5" opacity="0.6" />
        <circle cx="176" cy="120" r="2" opacity="0.5" /><circle cx="70" cy="60" r="2" opacity="0.5" /><circle cx="156" cy="54" r="2.5" opacity="0.6" />
      </g>
      <ellipse cx="86" cy="205" rx="16" ry="8" fill="#eab308" stroke="#a16207" strokeWidth="3" />
      <ellipse cx="134" cy="205" rx="16" ry="8" fill="#eab308" stroke="#a16207" strokeWidth="3" />
    </>
  )
}

function BodyComicKid() {
  return (
    <>
      <path d="M104 48 Q106 34 112 26" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
      <path d="M112 26 Q116 18 122 22 Q126 26 122 32 Q118 36 114 34" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
      <path d="M58 92 Q48 60 70 50 Q84 44 96 50 L124 50 Q136 44 150 50 Q172 60 162 92 L162 120 Q162 140 140 150 L80 150 Q58 140 58 120 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="3" strokeLinejoin="round" />
      <path d="M74 68 Q74 56 86 54 Q98 52 106 56 L106 66 Q92 62 78 68 Z" fill="#d97706" stroke="none" opacity="0.3" />
      <circle cx="84" cy="86" r="10" fill="#fff" stroke="#1e293b" strokeWidth="2.5" />
      <circle cx="136" cy="86" r="10" fill="#fff" stroke="#1e293b" strokeWidth="2.5" />
      <circle cx="86" cy="88" r="4.5" fill="#1e293b" />
      <circle cx="134" cy="88" r="4.5" fill="#1e293b" />
      <circle cx="87.5" cy="86.5" r="1.6" fill="#fff" />
      <circle cx="135.5" cy="86.5" r="1.6" fill="#fff" />
      <ellipse cx="110" cy="102" rx="4" ry="3" fill="#1e293b" />
      <path d="M104 110 Q110 116 116 110" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="72" cy="102" rx="6" ry="4" fill="#fb7185" opacity="0.5" />
      <ellipse cx="148" cy="102" rx="6" ry="4" fill="#fb7185" opacity="0.5" />
      <path d="M80 150 L78 168 Q78 176 86 176 Q94 176 92 168 L92 150" fill="#d97706" stroke="#92400e" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M128 150 L126 168 Q126 176 134 176 Q142 176 140 168 L140 150" fill="#d97706" stroke="#92400e" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="88" cy="200" rx="18" ry="10" fill="#7c3aed" stroke="#5b21b6" strokeWidth="2.5" />
      <ellipse cx="132" cy="200" rx="18" ry="10" fill="#7c3aed" stroke="#5b21b6" strokeWidth="2.5" />
    </>
  )
}

/** 二次元角色组：用更清晰的发型、校服和道具区分，而不仅是换色。 */
function BodyAnimeMage() {
  return (
    <>
      <path d="M72 83 Q58 38 74 20 Q88 3 110 20 Q132 3 150 20 Q166 38 148 83 Z" fill="#312e81" stroke="#4c1d95" strokeWidth="3" strokeLinejoin="round" />
      <path d="M70 80 Q62 112 76 146 Q88 136 90 104 M150 80 Q158 112 144 146 Q132 136 130 104" fill="#4338ca" stroke="#4c1d95" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="110" cy="82" rx="38" ry="42" fill="#fde7db" stroke="#4c1d95" strokeWidth="3" />
      <path d="M75 62 Q88 30 110 44 Q132 30 145 62 Q130 54 110 58 Q90 54 75 62 Z" fill="#312e81" />
      <path d="M78 62 Q91 47 104 58 L103 70 M142 62 Q129 47 116 58 L117 70" fill="none" stroke="#312e81" strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="96" cy="82" rx="8" ry="10" fill="#fff" stroke="#4c1d95" strokeWidth="2" /><ellipse cx="124" cy="82" rx="8" ry="10" fill="#fff" stroke="#4c1d95" strokeWidth="2" />
      <circle cx="97" cy="84" r="4" fill="#7c3aed" /><circle cx="123" cy="84" r="4" fill="#7c3aed" /><circle cx="99" cy="82" r="1.5" fill="#fff" /><circle cx="125" cy="82" r="1.5" fill="#fff" />
      <path d="M103 102 Q110 108 117 102" fill="none" stroke="#be185d" strokeWidth="2.5" strokeLinecap="round" /><ellipse cx="84" cy="97" rx="7" ry="3.5" fill="#f9a8d4" opacity=".65" /><ellipse cx="136" cy="97" rx="7" ry="3.5" fill="#f9a8d4" opacity=".65" />
      <path d="M82 124 Q110 112 138 124 L144 174 Q110 190 76 174 Z" fill="#8b5cf6" stroke="#4c1d95" strokeWidth="3" strokeLinejoin="round" /><path d="M83 126 L110 144 L137 126" fill="none" stroke="#ddd6fe" strokeWidth="3" /><path d="M110 144 L110 177" stroke="#ddd6fe" strokeWidth="2" />
      <path d="M147 132 Q170 116 180 92" fill="none" stroke="#a78bfa" strokeWidth="6" strokeLinecap="round" /><circle cx="184" cy="86" r="10" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" /><path d="M184 78 L186 84 L192 86 L186 88 L184 94 L182 88 L176 86 L182 84 Z" fill="#fbbf24" />
      <ellipse cx="93" cy="194" rx="17" ry="9" fill="#312e81" stroke="#4c1d95" strokeWidth="3" /><ellipse cx="127" cy="194" rx="17" ry="9" fill="#312e81" stroke="#4c1d95" strokeWidth="3" />
    </>
  )
}

function BodyAnimeSakura() {
  return (
    <>
      <path d="M67 88 Q48 53 64 25 Q82 4 110 25 Q138 4 156 25 Q172 53 153 88 L145 148 L75 148 Z" fill="#ec4899" stroke="#9d174d" strokeWidth="3" strokeLinejoin="round" />
      <path d="M64 77 Q48 116 65 153 Q76 135 82 105 M156 77 Q172 116 155 153 Q144 135 138 105" fill="#f472b6" stroke="#9d174d" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="110" cy="82" rx="39" ry="43" fill="#ffeadf" stroke="#9d174d" strokeWidth="3" />
      <path d="M73 65 Q80 30 110 39 Q140 30 147 65 Q131 55 110 59 Q89 55 73 65 Z" fill="#be185d" /><path d="M87 51 Q105 58 110 76 Q115 58 133 51" fill="none" stroke="#be185d" strokeWidth="9" strokeLinecap="round" />
      <path d="M110 33 C100 18 80 20 83 35 C87 47 104 46 110 38 C116 46 133 47 137 35 C140 20 120 18 110 33" fill="#fbcfe8" stroke="#9d174d" strokeWidth="2" />
      <ellipse cx="95" cy="84" rx="8" ry="10" fill="#fff" stroke="#9d174d" strokeWidth="2" /><ellipse cx="125" cy="84" rx="8" ry="10" fill="#fff" stroke="#9d174d" strokeWidth="2" /><circle cx="96" cy="86" r="4" fill="#ec4899" /><circle cx="124" cy="86" r="4" fill="#ec4899" /><circle cx="98" cy="84" r="1.5" fill="#fff" /><circle cx="126" cy="84" r="1.5" fill="#fff" />
      <path d="M103 104 Q110 110 117 104" fill="none" stroke="#be185d" strokeWidth="2.5" strokeLinecap="round" /><ellipse cx="84" cy="99" rx="8" ry="4" fill="#fb7185" opacity=".65" /><ellipse cx="136" cy="99" rx="8" ry="4" fill="#fb7185" opacity=".65" />
      <path d="M79 126 Q110 112 141 126 L150 176 Q110 191 70 176 Z" fill="#f9a8d4" stroke="#9d174d" strokeWidth="3" /><path d="M82 127 L110 145 L138 127" fill="none" stroke="#fff" strokeWidth="3" /><path d="M110 145 L110 180" stroke="#fff" strokeWidth="2" />
      <path d="M62 140 Q45 130 36 116" fill="none" stroke="#f472b6" strokeWidth="7" strokeLinecap="round" /><path d="M32 108 C22 98 13 110 23 119 C29 124 34 121 36 116 C39 122 46 124 50 119 C60 110 51 98 41 108" fill="#fbcfe8" stroke="#9d174d" strokeWidth="2" />
      <ellipse cx="92" cy="194" rx="18" ry="9" fill="#be185d" stroke="#9d174d" strokeWidth="3" /><ellipse cx="128" cy="194" rx="18" ry="9" fill="#be185d" stroke="#9d174d" strokeWidth="3" />
    </>
  )
}

function BodyCyberStudent() {
  return (
    <>
      <path d="M66 88 Q54 40 76 21 L110 11 L144 21 Q166 40 154 88 L146 150 L74 150 Z" fill="#0f172a" stroke="#155e75" strokeWidth="3" strokeLinejoin="round" />
      <path d="M76 58 Q93 32 110 46 Q127 32 144 58 L138 73 Q110 58 82 73 Z" fill="#22d3ee" stroke="#155e75" strokeWidth="3" />
      <ellipse cx="110" cy="83" rx="38" ry="42" fill="#f5ded2" stroke="#155e75" strokeWidth="3" />
      <path d="M72 65 Q78 34 110 38 Q142 34 148 65 L137 59 L133 73 L119 58 L110 76 L99 58 L85 73 L83 59 Z" fill="#0f172a" />
      <path d="M82 65 L97 55 M138 65 L123 55" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="95" cy="84" rx="8" ry="10" fill="#ecfeff" stroke="#155e75" strokeWidth="2" /><ellipse cx="125" cy="84" rx="8" ry="10" fill="#ecfeff" stroke="#155e75" strokeWidth="2" /><circle cx="96" cy="86" r="4" fill="#0891b2" /><circle cx="124" cy="86" r="4" fill="#0891b2" /><circle cx="98" cy="84" r="1.5" fill="#fff" /><circle cx="126" cy="84" r="1.5" fill="#fff" />
      <path d="M102 104 Q110 109 118 104" fill="none" stroke="#0e7490" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M79 124 Q110 111 141 124 L146 176 Q110 190 74 176 Z" fill="#164e63" stroke="#155e75" strokeWidth="3" /><path d="M84 128 L136 128 M110 119 L110 177" stroke="#67e8f9" strokeWidth="2" /><circle cx="110" cy="143" r="8" fill="#22d3ee" stroke="#cffafe" strokeWidth="2" />
      <path d="M145 132 Q169 125 184 133 L184 157 Q164 161 148 151 Z" fill="#0e7490" stroke="#155e75" strokeWidth="3" /><path d="M153 140 L178 140 M153 147 L170 147" stroke="#a5f3fc" strokeWidth="2" /><circle cx="176" cy="151" r="2" fill="#fef08a" />
      <ellipse cx="92" cy="194" rx="18" ry="9" fill="#0f172a" stroke="#155e75" strokeWidth="3" /><ellipse cx="128" cy="194" rx="18" ry="9" fill="#0f172a" stroke="#155e75" strokeWidth="3" />
    </>
  )
}

// ---------- 披风 / 装备层 ----------
function CapeBack({ on }: { on?: boolean }) {
  if (!on) return null
  return <path d="M78 96 L58 176 Q84 186 110 178 L132 178 Q158 186 162 176 L142 96 Q110 110 78 96 Z" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="3" strokeLinejoin="round" opacity="0.95" />
}

function FrontLayers({ hat, shoes, clothes }: { hat?: string; shoes?: string; clothes?: string }) {
  return (
    <>
      {clothes === 'cloth-scarf' && (
        <g><path d="M92 124 Q110 134 128 124 L128 134 Q110 144 92 134 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" /></g>
      )}
      {clothes === 'cloth-armor' && (
        <g><path d="M88 116 Q110 108 132 116 L132 156 Q110 166 88 156 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2.5" /><path d="M88 132 L132 132" stroke="#94a3b8" strokeWidth="2" /><circle cx="110" cy="124" r="3.5" fill="#64748b" /></g>
      )}
      {hat === 'hat-straw' && <g><ellipse cx="110" cy="34" rx="30" ry="7" fill="#fbbf24" stroke="#b45309" strokeWidth="2" /><path d="M92 33 Q110 12 128 33 Z" fill="#fcd34d" stroke="#b45309" strokeWidth="2" /></g>}
      {hat === 'hat-beret' && <g><ellipse cx="112" cy="28" rx="22" ry="9" fill="#ef4444" stroke="#991b1b" strokeWidth="2" /><circle cx="112" cy="19" r="3" fill="#fca5a5" /></g>}
      {hat === 'hat-wizard' && <g><path d="M96 34 Q110 -2 124 34 Z" fill="#7c3aed" stroke="#5b21b6" strokeWidth="2" /><ellipse cx="110" cy="34" rx="26" ry="5.5" fill="#8b5cf6" stroke="#5b21b6" strokeWidth="2" /><path d="M110 6 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 Z" fill="#fde68a" /></g>}
      {hat === 'hat-crown' && <g><path d="M92 34 L96 16 L104 26 L110 10 L116 26 L124 16 L128 34 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" /><circle cx="110" cy="24" r="2.5" fill="#f43f5e" /></g>}
      {(shoes === 'shoes-cloth' || shoes === 'shoes-sport' || shoes === 'shoes-rocket') &&
        [86, 134].map((cx) =>
          shoes === 'shoes-cloth' ? <ellipse key={cx} cx={cx} cy={203} rx={17} ry={8.5} fill="#a16207" stroke="#713f12" strokeWidth="2" /> :
          shoes === 'shoes-sport' ? <g key={cx}><ellipse cx={cx} cy={203} rx={17} ry={8.5} fill="#f8fafc" stroke="#334155" strokeWidth="2" /><path d={`M${cx-12} 200 Q${cx} 206 ${cx+12} 200`} stroke="#ef4444" strokeWidth="2.5" fill="none" /></g> :
          <g key={cx}><ellipse cx={cx} cy={202} rx={18} ry={9} fill="#f97316" stroke="#c2410c" strokeWidth="2" /><path d={`M${cx-8} 209 Q${cx-4} 215 ${cx-9} 218 M${cx+2} 210 Q${cx+6} 216 ${cx+1} 219`} stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinecap="round" /></g>
        )}
    </>
  )
}

export function OutfitIcon({ id, size = 40 }: { id: string; size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      {id === 'hat-straw' && <g><ellipse cx="20" cy="30" rx="17" ry="5" fill="#fbbf24" stroke="#b45309" strokeWidth="2" /><path d="M10 29 Q20 8 30 29 Z" fill="#fcd34d" stroke="#b45309" strokeWidth="2" /></g>}
      {id === 'hat-beret' && <g><ellipse cx="20" cy="26" rx="16" ry="8" fill="#ef4444" stroke="#991b1b" strokeWidth="2" /><circle cx="20" cy="16" r="3" fill="#fca5a5" /></g>}
      {id === 'hat-wizard' && <g><path d="M10 32 Q20 -2 30 32 Z" fill="#7c3aed" stroke="#5b21b6" strokeWidth="2" /><ellipse cx="20" cy="32" rx="15" ry="4" fill="#8b5cf6" stroke="#5b21b6" strokeWidth="2" /><path d="M20 8 l1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6 Z" fill="#fde68a" /></g>}
      {id === 'hat-crown' && <g><path d="M7 32 L10 14 L15.5 23 L20 8 L24.5 23 L30 14 L33 32 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" /><circle cx="20" cy="24" r="2.4" fill="#f43f5e" /></g>}
      {id === 'shoes-cloth' && <g><ellipse cx="12" cy="28" rx="10" ry="5.5" fill="#a16207" stroke="#713f12" strokeWidth="2" /><ellipse cx="28" cy="28" rx="10" ry="5.5" fill="#a16207" stroke="#713f12" strokeWidth="2" /></g>}
      {id === 'shoes-sport' && <g><ellipse cx="12" cy="28" rx="10" ry="5.5" fill="#f8fafc" stroke="#334155" strokeWidth="2" /><ellipse cx="28" cy="28" rx="10" ry="5.5" fill="#f8fafc" stroke="#334155" strokeWidth="2" /><path d="M5 26 Q12 30 19 26 M21 26 Q28 30 35 26" stroke="#ef4444" strokeWidth="2.5" fill="none" /></g>}
      {id === 'shoes-rocket' && <g><ellipse cx="13" cy="24" rx="10" ry="5.5" fill="#f97316" stroke="#c2410c" strokeWidth="2" /><ellipse cx="27" cy="24" rx="10" ry="5.5" fill="#f97316" stroke="#c2410c" strokeWidth="2" /><path d="M8 30 Q4 34 7 37 M30 30 Q34 34 31 37" stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinecap="round" /></g>}
      {id === 'cloth-scarf' && <g><path d="M8 14 Q20 22 32 14 L32 22 Q20 30 8 22 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" /></g>}
      {id === 'cloth-cape' && <g><path d="M10 6 L6 34 Q20 38 34 34 L30 6 Q20 12 10 6 Z" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="2" /></g>}
      {id === 'cloth-armor' && <g><path d="M9 8 Q20 4 31 8 L31 28 Q20 34 9 28 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" /><path d="M9 18 L31 18" stroke="#94a3b8" strokeWidth="2" /></g>}
    </svg>
  )
}

// ---------- 纯展示 ----------
export function MascotBody({ skinId, hat, shoes, clothes, className = '' }: { skinId?: string; hat?: string; shoes?: string; clothes?: string; className?: string }) {
  const skin = skinOf(skinId)
  const id = `mb-${skin.id}`
  return (
    <svg viewBox="0 0 220 212" className={className} role="img" aria-label="学伴精灵">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skin.palette.body} />
          <stop offset="100%" stopColor={skin.palette.edge} />
        </linearGradient>
      </defs>
      <CapeBack on={clothes === 'cloth-cape'} />
      <g className="pet-breathe">
        {skin.id === 'skin-default' && <BodyMillet p={skin.palette} id={id} />}
        {skin.id === 'skin-flame' && <BodyFox />}
        {skin.id === 'skin-snow' && <BodyCat />}
        {skin.id === 'skin-bamboo' && <BodyCloudSheep />}
        {skin.id === 'skin-night' && <BodyFirefly />}
        {skin.id === 'skin-gold' && <BodyComicKid />}
        {skin.id === 'skin-astral' && <BodyAnimeMage />}
        {skin.id === 'skin-sakura' && <BodyAnimeSakura />}
        {skin.id === 'skin-cyber' && <BodyCyberStudent />}
        <FrontLayers hat={hat} shoes={shoes} clothes={clothes} />
      </g>
    </svg>
  )
}

// ---------- 完整毛栗（存档 + 神兽环绕） ----------
export default function Mascot({ className = '' }: { className?: string }) {
  const appData = useAppData()
  const o = appData.outfits
  const beasts = beastsOwned(appData)
  const wrapRef = useRef<HTMLSpanElement | null>(null)
  const [wrap, setWrap] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWrap({ w: el.offsetWidth, h: el.offsetHeight }))
    ro.observe(el); setWrap({ w: el.offsetWidth, h: el.offsetHeight })
    return () => ro.disconnect()
  }, [])
  const radius = Math.max(wrap.w, wrap.h) * 1.12
  const figSize = Math.max(18, Math.min(38, Math.round(wrap.w * 0.38)))
  return (
    <span ref={wrapRef} className="relative inline-flex">
      <MascotBody skinId={o?.skin} hat={o?.hat} shoes={o?.shoes} clothes={o?.clothes} className={className} />
      {beasts.length > 0 && wrap.w > 0 && (
        <span className="orbit-rot pointer-events-none absolute inset-0 z-10" aria-hidden>
          {beasts.map((b, i) => {
            const ang = (i / beasts.length) * Math.PI * 2 - Math.PI / 2
            const x = 50 + ((radius / wrap.w) * 100) * Math.cos(ang)
            const y = 50 + ((radius / wrap.h) * 100) * Math.sin(ang)
            return (
              <span key={b.name} className="orbit-rev absolute flex items-center justify-center" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }} title={`${b.name} · ${b.gateName}`}>
                <BeastFigure beast={b} size={figSize} />
              </span>
            )
          })}
        </span>
      )}
    </span>
  )
}

// ---------- 对话气泡 ----------
export function SpeechBubble({ messages = [], text, tail = 'none', dense = false, intervalMs = 5200 }: { messages?: string[]; text?: ReactNode; tail?: 'none' | 'top' | 'bottom'; dense?: boolean; intervalMs?: number }) {
  const [i, setI] = useState(0)
  const n = messages.length
  useEffect(() => {
    if (text != null || n === 0) return
    const t = setInterval(() => setI((v) => (v + 1) % n), intervalMs)
    return () => clearInterval(t)
  }, [n, intervalMs, text])
  const tailEl = tail === 'top' ? <span className="absolute -top-1.5 left-10 h-3.5 w-3.5 rotate-45 bg-white/95 ring-1 ring-gray-100" /> : tail === 'bottom' ? <span className="absolute -bottom-1.5 left-10 h-3.5 w-3.5 rotate-45 bg-white/95 ring-1 ring-gray-100" /> : null
  return (
    <div className={`relative w-fit max-w-full rounded-2xl bg-white/95 text-gray-700 shadow-md ring-1 ring-gray-100 transition hover:ring-indigo-200 ${dense ? 'px-3.5 py-2.5 text-[11px] leading-relaxed md:max-w-[16rem]' : 'cursor-pointer select-none px-4 py-3.5 text-sm leading-relaxed md:max-w-md'}`}>
      {tailEl}
      {text != null ? <div className="pet-bubble-in space-y-1">{text}</div> : (
        <>
          <div key={i} className="pet-bubble-in min-h-[3.2em]">{messages[i]}</div>
          {n > 1 && <div className="mt-2 flex items-center justify-end gap-1.5">{messages.map((_, j) => <span key={j} className={`h-1.5 w-1.5 rounded-full transition ${j === i ? 'bg-indigo-400' : 'bg-gray-200'}`} />)}<span className="ml-1 text-[10px] text-gray-300">点我翻页</span></div>}
        </>
      )}
    </div>
  )
}
