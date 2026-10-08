/**
 * 答案归一化与等价判定。
 *
 * 目标：让 "1/2"、"0.5"、"0.50"、" 1 / 2 "、"１/２" 都能判为同一个答案，
 * 同时让 "x=3" 与 "x = 3" 等价。
 */

const FULLWIDTH_MAP: Record<string, string> = {
  '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
  '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
  'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D',
  'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd',
  '＝': '=', '＋': '+', '－': '-', '×': '*', '÷': '/',
  '（': '(', '）': ')', '，': ',', '。': '.', '；': ';',
  '：': ':', '　': ' ', '—': '-', '–': '-', '−': '-',
}

export function toHalfWidth(s: string): string {
  return s.replace(/[\uFF01-\uFF5E\u3000]/g, (ch) => {
    if (FULLWIDTH_MAP[ch]) return FULLWIDTH_MAP[ch]
    const code = ch.charCodeAt(0)
    if (code >= 0xff01 && code <= 0xff5e) return String.fromCharCode(code - 0xfee0)
    return ch
  })
}

/** 归一化：去空白、统一标点、统一大小写与常见数学符号写法 */
export function normalizeAnswer(raw: string): string {
  if (raw == null) return ''
  let s = toHalfWidth(String(raw))
  s = s.replace(/[\s\u00a0]+/g, '')
  s = s.replace(/[，、]/g, ',')
  s = s.replace(/。/g, '.')
  s = s.replace(/；/g, ';')
  s = s.replace(/[－—–−]/g, '-')
  s = s.replace(/[×·⋅]/g, '*')
  s = s.replace(/÷/g, '/')
  s = s.replace(/[（]/g, '(').replace(/[）]/g, ')')
  s = s.replace(/[＜]/g, '<').replace(/[＞]/g, '>')
  s = s.replace(/≤/g, '<=').replace(/≥/g, '>=')
  s = s.replace(/≠/g, '!=')
  s = s.replace(/(\d),(\d{3})\b/g, '$1$2')
  s = s.toLowerCase()
  // 去掉最外层多余的括号，但 (-1,2) 这种区间或坐标要保留
  while (s.startsWith('(') && s.endsWith(')') && isBalanced(s.slice(1, -1)) && !/^[^()]+,[^()]+$/.test(s.slice(1, -1))) {
    s = s.slice(1, -1)
  }
  // 去掉小数点后多余的 0：3.50 -> 3.5，2.0 -> 2
  s = s.replace(/(\d+\.\d*?)0+(?![0-9])/g, '$1').replace(/(\d+)\.(?![0-9])/g, '$1')
  return s
}

function isBalanced(s: string): boolean {
  let depth = 0
  for (const ch of s) {
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth < 0) return false
    }
  }
  return depth === 0
}

const PART_MARK = /(?:^|[\n;；])\s*(?:[（(]\s*\d+\s*[)）]|[①②③④⑤⑥⑦⑧⑨⑩]|\d+\s*[.、](?!\d))\s*/g

/** 去掉段首题号，如 (1)、（2）、1.、①。题号不参与对错。 */
export function stripPartLabel(s: string): string {
  return s.replace(/^\s*(?:[（(]\s*\d+\s*[)）]|[①②③④⑤⑥⑦⑧⑨⑩]|\d+\s*[.、](?!\d))\s*/, '').trim()
}

/**
 * 按题号拆成各小问。没有两个及以上题号时，整段算一问。
 * 题号只在段首、换行或分号之后才算，避免把区间 (-1, 2) 拆开。
 */
export function splitNumberedParts(raw: string): string[] {
  const s = String(raw ?? '').trim()
  if (!s) return []
  const marks: { index: number; end: number }[] = []
  for (const m of s.matchAll(PART_MARK)) {
    if (m.index == null) continue
    marks.push({ index: m.index, end: m.index + m[0].length })
  }
  if (marks.length < 2) return [s]
  const parts: string[] = []
  for (let i = 0; i < marks.length; i++) {
    const stop = i + 1 < marks.length ? marks[i + 1].index : s.length
    const body = s.slice(marks[i].end, stop).trim().replace(/[;；,，]\s*$/, '')
    if (body) parts.push(body)
  }
  return parts.length >= 2 ? parts : [s]
}

/** 括号深度为 0 时才按分号、换行或“或”切开。逗号留给区间和坐标。 */
function splitTopLevel(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let buf = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(' || ch === '[' || ch === '{' || ch === '（') depth++
    else if (ch === ')' || ch === ']' || ch === '}' || ch === '）') depth = Math.max(0, depth - 1)
    if (depth === 0 && (ch === ';' || ch === '；' || ch === '\n' || s.startsWith('或', i))) {
      if (buf.trim()) parts.push(buf.trim())
      buf = ''
      if (s.startsWith('或', i)) i += '或'.length - 1
      continue
    }
    buf += ch
  }
  if (buf.trim()) parts.push(buf.trim())
  return parts.filter(Boolean)
}

/** 把变式/多解答案拆成若干候选。优先按题号拆小问，逗号只在括号外才分开。 */
function splitCandidates(s: string): string[] {
  const numbered = splitNumberedParts(s)
  if (numbered.length > 1) return numbered.map(stripPartLabel)
  return splitTopLevel(s).map(stripPartLabel).filter(Boolean)
}

/**
 * 数值等价判断：把纯数值表达式（含 + - * / ^ () √ π 与 Unicode 上标）求值后比较。
 * 只用于"整段都是数值表达式"的情况，含字母的一律走字符串比较。
 */
export function evalNumeric(expr: string): number | null {
  const s = normalizeAnswer(expr)
  if (!s) return null
  if (/[a-df-z]/i.test(s.replace(/[eE]/g, ''))) return null
  if (!/^[-+*/^().\d√π]+$/.test(s)) return null

  let i = 0
  const src = s

  function parseExpr(): number | null {
    let v = parseTerm()
    if (v === null) return null
    while (i < src.length && (src[i] === '+' || src[i] === '-')) {
      const op = src[i++]
      const r = parseTerm()
      if (r === null) return null
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  function parseTerm(): number | null {
    let v = parseFactor()
    if (v === null) return null
    while (i < src.length && (src[i] === '*' || src[i] === '/')) {
      const op = src[i++]
      const r = parseFactor()
      if (r === null) return null
      if (op === '/' && r === 0) return null
      v = op === '*' ? v * r : v / r
    }
    return v
  }
  function parseFactor(): number | null {
    const base = parseUnary()
    if (base === null) return null
    if (i < src.length && src[i] === '^') {
      i++
      const exp = parseFactor()
      if (exp === null) return null
      return Math.pow(base, exp)
    }
    return base
  }
  function parseUnary(): number | null {
    if (i >= src.length) return null
    if (src[i] === '+') {
      i++
      return parseUnary()
    }
    if (src[i] === '-') {
      i++
      const v = parseUnary()
      return v === null ? null : -v
    }
    return parseAtom()
  }
  function parseAtom(): number | null {
    if (i >= src.length) return null
    const ch = src[i]
    if (ch === '(') {
      i++
      const v = parseExpr()
      if (v === null) return null
      if (src[i] !== ')') return null
      i++
      return v
    }
    if (ch === '√') {
      i++
      const v = parseUnary()
      return v === null || v < 0 ? null : Math.sqrt(v)
    }
    if (ch === 'π') {
      i++
      return Math.PI
    }
    const m = /^\d*\.?\d+/.exec(src.slice(i))
    if (!m) return null
    i += m[0].length
    return parseFloat(m[0])
  }

  const value = parseExpr()
  if (value === null || i !== src.length) return null
  return value
}

const EPS = 1e-9

export function numericEqual(a: string, b: string): boolean {
  const va = evalNumeric(a)
  const vb = evalNumeric(b)
  if (va === null || vb === null) return false
  return Math.abs(va - vb) <= EPS * Math.max(1, Math.abs(va), Math.abs(vb))
}

/** 单段答案等价：字符串归一化相等、数值等价，或区间与不等式写法等价 */
export function segmentEqual(user: string, expected: string): boolean {
  const u = normalizeAnswer(stripPartLabel(user))
  const e = normalizeAnswer(stripPartLabel(expected))
  if (!u) return false
  if (u === e) return true
  if (numericEqual(u, e)) return true
  if (numericEqual(u.replace(/\*/g, ''), e.replace(/\*/g, ''))) return true
  if (intervalKeys(u).some((k) => intervalKeys(e).includes(k))) return true
  // 允许学生省略等号左边的变量名，如期望 "x=3"，学生填 "3"
  const uEq = u.split('=')
  const eEq = e.split('=')
  if (eEq.length === 2 && uEq.length === 1 && segmentEqual(u, eEq[1])) return true
  if (uEq.length === 2 && eEq.length === 1 && segmentEqual(uEq[1], e)) return true
  return false
}

/** 把区间、不等式链收成同一种写法，便于 (-1,2) 与 -1<x<2 互认 */
function intervalKeys(s: string): string[] {
  const src = s.replace(/^[a-z](?:∈|属于)/, '')
  const keys = new Set<string>()
  const iv = src.match(/^(\[|\()(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(\]|\))$/)
  if (iv) {
    const left = iv[1] === '(' ? '<' : '<='
    const right = iv[4] === ')' ? '<' : '<='
    keys.add(`${iv[2]}${left}x${right}${iv[3]}`)
  }
  const chain = src.match(/^(-?\d+(?:\.\d+)?)(<=|<)([a-z])(<=|<)(-?\d+(?:\.\d+)?)$/)
  if (chain) {
    const L = chain[2] === '<' ? '(' : '['
    const R = chain[4] === '<' ? ')' : ']'
    keys.add(`${L}${chain[1]},${chain[5]}${R}`)
    keys.add(`${chain[1]}${chain[2]}x${chain[4]}${chain[5]}`)
  }
  const rev = src.match(/^(-?\d+(?:\.\d+)?)(>=|>)([a-z])(>=|>)(-?\d+(?:\.\d+)?)$/)
  if (rev) {
    const left = rev[4] === '>' ? '<' : '<='
    const right = rev[2] === '>' ? '<' : '<='
    keys.add(`${rev[5]}${left}x${right}${rev[1]}`)
  }
  return [...keys]
}

/**
 * 判断学生答案是否与标准答案（或可接受答案列表）等价。
 * 多空答案按 `;` 拆分后逐空比较（顺序一致）。
 */
export function answersMatch(user: string, expected: string, accepted?: string[]): boolean {
  const candidates = [expected, ...(accepted ?? [])].filter((x) => x != null && x !== '')
  const userNumbered = splitNumberedParts(toHalfWidth(user).replace(/；/g, ';'))
  const uParts = splitCandidates(toHalfWidth(user).replace(/；/g, ';'))
  for (const cand of candidates) {
    const candNumbered = splitNumberedParts(toHalfWidth(cand).replace(/；/g, ';'))
    const cParts = splitCandidates(toHalfWidth(cand).replace(/；/g, ';'))
    if (cParts.length > 1) {
      if (uParts.length === cParts.length && uParts.every((p, idx) => segmentEqual(p, cParts[idx]))) return true
      // 各小问都写了题号时，按题号对齐，忽略题号本身
      if (
        userNumbered.length > 1 &&
        userNumbered.length === candNumbered.length &&
        userNumbered.every((p, idx) => segmentEqual(p, candNumbered[idx]))
      ) {
        return true
      }
      continue
    }
    if (uParts.length <= 1) {
      if (segmentEqual(user, cand)) return true
    } else if (uParts.some((p) => segmentEqual(p, cand))) {
      // 学生写了多段但标准答案是一段：任一段匹配即可（如求值题写了过程）
      return true
    }
  }
  return false
}

/** 归一化选项字母 */
export function normalizeChoice(raw: string): string {
  const m = /[A-Da-d]/.exec(toHalfWidth(raw ?? ''))
  return m ? m[0].toUpperCase() : ''
}
