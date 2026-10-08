/**
 * 答案归一化与等价判定（小程序版，与 app/src/lib/answers.ts 行为一致）。
 *
 * 目标：1/2、0.5、0.50 视为同一答案；(-1,2) 与 -1<x<2 视为同一答案；
 * 答案前写了题号 (1)、1.、① 不影响判对。
 */

var FULLWIDTH_MAP = {
  '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
  '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
  'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D',
  'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd',
  '＝': '=', '＋': '+', '－': '-', '×': '*', '÷': '/',
  '（': '(', '）': ')', '，': ',', '。': '.', '；': ';',
  '：': ':', '　': ' ', '—': '-', '–': '-', '−': '-'
}

function toHalfWidth(s) {
  return String(s == null ? '' : s).replace(/[\uFF01-\uFF5E\u3000]/g, function (ch) {
    if (FULLWIDTH_MAP[ch]) return FULLWIDTH_MAP[ch]
    var code = ch.charCodeAt(0)
    if (code >= 0xff01 && code <= 0xff5e) return String.fromCharCode(code - 0xfee0)
    return ch
  })
}

function isBalanced(s) {
  var depth = 0
  for (var i = 0; i < s.length; i++) {
    var ch = s[i]
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth < 0) return false
    }
  }
  return depth === 0
}

function normalizeAnswer(raw) {
  if (raw == null) return ''
  var s = toHalfWidth(String(raw))
  s = s.replace(/[\s\u00a0]+/g, '')
  s = s.replace(/[，、]/g, ',')
  s = s.replace(/。/g, '.')
  s = s.replace(/；/g, ';')
  s = s.replace(/[－—–−]/g, '-')
  s = s.replace(/[×·⋅]/g, '*')
  s = s.replace(/÷/g, '/')
  s = s.replace(/（/g, '(').replace(/）/g, ')')
  s = s.replace(/＜/g, '<').replace(/＞/g, '>')
  s = s.replace(/≤/g, '<=').replace(/≥/g, '>=')
  s = s.replace(/≠/g, '!=')
  s = s.replace(/(\d),(\d{3})\b/g, '$1$2')
  s = s.toLowerCase()
  // 去掉最外层多余的括号，但 (-1,2) 这种区间或坐标要保留
  while (s.charAt(0) === '(' && s.charAt(s.length - 1) === ')' && isBalanced(s.slice(1, -1)) && !/^[^()]+,[^()]+$/.test(s.slice(1, -1))) {
    s = s.slice(1, -1)
  }
  s = s.replace(/(\d+\.\d*?)0+(?![0-9])/g, '$1').replace(/(\d+)\.(?![0-9])/g, '$1')
  return s
}

var PART_MARK = /(?:^|[\n;；])\s*(?:[（(]\s*\d+\s*[)）]|[①②③④⑤⑥⑦⑧⑨⑩]|\d+\s*[.、](?!\d))\s*/g

/** 去掉段首题号，如 (1)、（2）、1.、①。题号不参与对错。 */
function stripPartLabel(s) {
  return String(s == null ? '' : s)
    .replace(/^\s*(?:[（(]\s*\d+\s*[)）]|[①②③④⑤⑥⑦⑧⑨⑩]|\d+\s*[.、](?!\d))\s*/, '')
    .trim()
}

/** 按题号拆成各小问。没有两个及以上题号时，整段算一问。 */
function splitNumberedParts(raw) {
  var s = String(raw == null ? '' : raw).trim()
  if (!s) return []
  var marks = []
  var re = new RegExp(PART_MARK.source, 'g')
  var m
  while ((m = re.exec(s)) !== null) {
    marks.push({ index: m.index, end: m.index + m[0].length })
    if (m[0].length === 0) re.lastIndex++
  }
  if (marks.length < 2) return [s]
  var parts = []
  for (var i = 0; i < marks.length; i++) {
    var stop = i + 1 < marks.length ? marks[i + 1].index : s.length
    var body = s.slice(marks[i].end, stop).trim().replace(/[;；,，]\s*$/, '')
    if (body) parts.push(body)
  }
  return parts.length >= 2 ? parts : [s]
}

/** 括号深度为 0 时才按分号、换行或“或”切开。逗号留给区间和坐标。 */
function splitTopLevel(s) {
  var parts = []
  var depth = 0
  var buf = ''
  for (var i = 0; i < s.length; i++) {
    var ch = s[i]
    if (ch === '(' || ch === '[' || ch === '{' || ch === '（') depth++
    else if (ch === ')' || ch === ']' || ch === '}' || ch === '）') depth = Math.max(0, depth - 1)
    if (depth === 0 && (ch === ';' || ch === '；' || ch === '\n' || s.indexOf('或', i) === i)) {
      if (buf.trim()) parts.push(buf.trim())
      buf = ''
      if (s.indexOf('或', i) === i) i += 0
      continue
    }
    buf += ch
  }
  if (buf.trim()) parts.push(buf.trim())
  return parts.filter(Boolean)
}

/** 把变式/多解答案拆成若干候选。优先按题号拆小问，逗号只在括号外才分开。 */
function splitCandidates(s) {
  var numbered = splitNumberedParts(s)
  if (numbered.length > 1) return numbered.map(stripPartLabel)
  return splitTopLevel(s).map(stripPartLabel).filter(Boolean)
}

/** 数值等价判断：纯数值表达式求值后比较，含字母的一律走字符串比较。 */
function evalNumeric(expr) {
  var s = normalizeAnswer(expr)
  if (!s) return null
  if (/[a-df-z]/i.test(s.replace(/[eE]/g, ''))) return null
  if (!/^[-+*/^().\d√π]+$/.test(s)) return null

  var i = 0
  var src = s

  function parseExpr() {
    var v = parseTerm()
    if (v === null) return null
    while (i < src.length && (src[i] === '+' || src[i] === '-')) {
      var op = src[i++]
      var r = parseTerm()
      if (r === null) return null
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  function parseTerm() {
    var v = parseFactor()
    if (v === null) return null
    while (i < src.length && (src[i] === '*' || src[i] === '/')) {
      var op = src[i++]
      var r = parseFactor()
      if (r === null) return null
      if (op === '/' && r === 0) return null
      v = op === '*' ? v * r : v / r
    }
    return v
  }
  function parseFactor() {
    var base = parseUnary()
    if (base === null) return null
    if (i < src.length && src[i] === '^') {
      i++
      var exp = parseFactor()
      if (exp === null) return null
      return Math.pow(base, exp)
    }
    return base
  }
  function parseUnary() {
    if (i >= src.length) return null
    if (src[i] === '+') {
      i++
      return parseUnary()
    }
    if (src[i] === '-') {
      i++
      var v = parseUnary()
      return v === null ? null : -v
    }
    return parseAtom()
  }
  function parseAtom() {
    if (i >= src.length) return null
    var ch = src[i]
    if (ch === '(') {
      i++
      var v = parseExpr()
      if (v === null) return null
      if (src[i] !== ')') return null
      i++
      return v
    }
    if (ch === '√') {
      i++
      var r = parseUnary()
      return r === null || r < 0 ? null : Math.sqrt(r)
    }
    if (ch === 'π') {
      i++
      return Math.PI
    }
    var m = /^\d*\.?\d+/.exec(src.slice(i))
    if (!m) return null
    i += m[0].length
    return parseFloat(m[0])
  }

  var value = parseExpr()
  if (value === null || i !== src.length) return null
  return value
}

var EPS = 1e-9

function numericEqual(a, b) {
  var va = evalNumeric(a)
  var vb = evalNumeric(b)
  if (va === null || vb === null) return false
  return Math.abs(va - vb) <= EPS * Math.max(1, Math.abs(va), Math.abs(vb))
}

/** 把区间、不等式链收成同一种写法，便于 (-1,2) 与 -1<x<2 互认 */
function intervalKeys(s) {
  var src = s.replace(/^[a-z](?:∈|属于)/, '')
  var keys = []
  var iv = /^(\[|\()(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(\]|\))$/.exec(src)
  if (iv) {
    keys.push(iv[2] + (iv[1] === '(' ? '<' : '<=') + 'x' + (iv[4] === ')' ? '<' : '<=') + iv[3])
  }
  var chain = /^(-?\d+(?:\.\d+)?)(<=|<)([a-z])(<=|<)(-?\d+(?:\.\d+)?)$/.exec(src)
  if (chain) {
    var L = chain[2] === '<' ? '(' : '['
    var R = chain[4] === '<' ? ')' : ']'
    keys.push(L + chain[1] + ',' + chain[5] + R)
    keys.push(chain[1] + chain[2] + 'x' + chain[4] + chain[5])
  }
  var rev = /^(-?\d+(?:\.\d+)?)(>=|>)([a-z])(>=|>)(-?\d+(?:\.\d+)?)$/.exec(src)
  if (rev) {
    keys.push(rev[5] + (rev[4] === '>' ? '<' : '<=') + 'x' + (rev[2] === '>' ? '<' : '<=') + rev[1])
  }
  return keys
}

/** 单段答案等价：归一化相等、数值等价，或区间与不等式写法等价 */
function segmentEqual(user, expected) {
  var u = normalizeAnswer(stripPartLabel(user))
  var e = normalizeAnswer(stripPartLabel(expected))
  if (!u) return false
  if (u === e) return true
  if (numericEqual(u, e)) return true
  if (numericEqual(u.replace(/\*/g, ''), e.replace(/\*/g, ''))) return true
  var uk = intervalKeys(u)
  var ek = intervalKeys(e)
  for (var i = 0; i < uk.length; i++) {
    if (ek.indexOf(uk[i]) >= 0) return true
  }
  // 允许学生省略等号左边的变量名，如期望 "x=3"，学生填 "3"
  var uEq = u.split('=')
  var eEq = e.split('=')
  if (eEq.length === 2 && uEq.length === 1 && segmentEqual(u, eEq[1])) return true
  if (uEq.length === 2 && eEq.length === 1 && segmentEqual(uEq[1], e)) return true
  return false
}

/** 判断学生答案是否与标准答案（或可接受答案列表）等价。 */
function answersMatch(user, expected, accepted) {
  var candidates = [expected].concat(accepted || []).filter(function (x) {
    return x != null && x !== ''
  })
  var userText = toHalfWidth(user).replace(/；/g, ';')
  var userNumbered = splitNumberedParts(userText)
  var uParts = splitCandidates(userText)
  for (var c = 0; c < candidates.length; c++) {
    var candText = toHalfWidth(candidates[c]).replace(/；/g, ';')
    var candNumbered = splitNumberedParts(candText)
    var cParts = splitCandidates(candText)
    if (cParts.length > 1) {
      var sameLen = uParts.length === cParts.length
      var allOk = sameLen
      if (sameLen) {
        for (var i = 0; i < uParts.length; i++) {
          if (!segmentEqual(uParts[i], cParts[i])) {
            allOk = false
            break
          }
        }
      }
      if (allOk) return true
      if (userNumbered.length > 1 && userNumbered.length === candNumbered.length) {
        var numberedOk = true
        for (var j = 0; j < userNumbered.length; j++) {
          if (!segmentEqual(userNumbered[j], candNumbered[j])) {
            numberedOk = false
            break
          }
        }
        if (numberedOk) return true
      }
      continue
    }
    if (uParts.length <= 1) {
      if (segmentEqual(user, candidates[c])) return true
    } else {
      var any = false
      for (var k = 0; k < uParts.length; k++) {
        if (segmentEqual(uParts[k], candidates[c])) {
          any = true
          break
        }
      }
      if (any) return true
    }
  }
  return false
}

/** 归一化选项字母 */
function normalizeChoice(raw) {
  var m = /[A-Da-d]/.exec(toHalfWidth(raw == null ? '' : raw))
  return m ? m[0].toUpperCase() : ''
}

module.exports = {
  toHalfWidth: toHalfWidth,
  normalizeAnswer: normalizeAnswer,
  stripPartLabel: stripPartLabel,
  splitNumberedParts: splitNumberedParts,
  evalNumeric: evalNumeric,
  numericEqual: numericEqual,
  segmentEqual: segmentEqual,
  answersMatch: answersMatch,
  normalizeChoice: normalizeChoice
}
