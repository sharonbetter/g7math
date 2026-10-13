#!/usr/bin/env python3
"""全库审查：机器验证计算专项题库的正确性与合理性，输出问题清单。"""
import json
import re
from fractions import Fraction as F

d = json.load(open('app/public/data/calc/trainings.json', encoding='utf-8'))
issues = []


def strip_tex(s):
    """去掉 $..$ LaTeX，恢复 a/b 文本（保留 frac 前的负号）"""
    def rep(m):
        t = m.group(1)
        def fr(m2):
            sign = '-' if m2.group(1) else ''
            return f'{sign}{F(int(m2.group(2)), int(m2.group(3)))}'
        return re.sub(r'(-?)\\frac\{(-?\d+)\}\{(\d+)\}', fr, t)
    return re.sub(r'\$([^$]+)\$', rep, s)


def parse_num(tok):
    tok = tok.replace('−', '-').replace('（', '(').replace('）', ')')
    return F(tok) if '/' in tok else F(float(tok)) if '.' in tok else F(int(tok))


def eval_chain(expr):
    """按四则优先级求值：支持 + - × ÷ ^ ² 和括号"""
    s = expr.replace('×', '*').replace('÷', '/').replace('^', '**').replace('−', '-')
    s = s.replace('²', '**2').replace('³', '**3')
    s = re.sub(r'(\d+(?:\.\d+)?)/(\d+)', r'F("\1")/F("\2")', s)
    s = re.sub(r'F\("(-?\d+(?:\.\d+)?)"\)/F\("(\d+)"\)', lambda m: f'F({int(float(m.group(1)))},{int(m.group(2))})' if '/' in m.group(0) else m.group(0), s)
    val = eval(s, {'F': F})
    return F(str(val)).limit_denominator(10**9)


def ans_of(q):
    a = q['answer']
    if a.startswith('x='):
        a = a[2:].split(',')[0]
    m = re.match(r'^(-?\d+(?:\.\d+)?(?:/\d+)?)$', a)
    if not m:
        return None
    return parse_num(a)


# ---------- 1. 纯计算题重算 ----------
CALC_PAT = re.compile(r'^计算：(.+?)．$')

def try_calc(q, t):
    qid = q.get('id', '变式')
    raw = CALC_PAT.match(q['stem'])
    if not raw:
        return False
    expr = strip_tex(raw.group(1)).strip().rstrip('.')
    if not re.fullmatch(r'[\d\s\.\+\-×÷\^\(\)/²³]+', expr):
        return False
    try:
        val = eval_chain(expr)
    except Exception:
        return False
    gold = ans_of(q)
    if gold is None:
        return False
    if val != gold:
        issues.append(('计算错误', f"T{t['no']} {qid}", q['stem'], f'机器算得 {val}，答案标 {gold}'))
    return True


# ---------- 2. 一元一次方程 ----------
def try_lin(q, t):
    qid = q.get('id', '变式')
    m = re.match(r'^解方程：(.+?)．（答案形如 x=3）$', q['stem'])
    if not m:
        return False
    body = strip_tex(m.group(1))
    gold = q['answer'][2:].split(',')[0]
    try:
        x0 = parse_num(gold)
    except Exception:
        return False
    # 类型1: ax ± b = cx ± d
    m1 = re.fullmatch(r'(-?\d+)x ([+-]) (\d+) = (-?\d+)x ([+-]) (\d+)', body)
    if m1:
        a, op, b, c, op2, b2 = (int(m1.group(1)), m1.group(2), int(m1.group(3)),
                                 int(m1.group(4)), m1.group(5), int(m1.group(6)))
        lhs = a * x0 + (b if op == '+' else -b)
        rhs = c * x0 + (b2 if op2 == '+' else -b2)
        if lhs != rhs:
            issues.append(('方程错误', f"T{t['no']} {qid}", q['stem'], f'x={x0} 不满足方程'))
        return True
    # 类型2: a(x ± b) = c
    m2 = re.fullmatch(r'\((-?\d+)\)\(x ([+-]) (-?\d+)\) = (-?\d+)', body)
    if m2:
        a, op, b, c = int(m2.group(1)), m2.group(2), int(m2.group(3)), int(m2.group(4))
        lhs = a * (x0 + (b if op == '+' else -b))
        if lhs != c:
            issues.append(('方程错误', f"T{t['no']} {qid}", q['stem'], f'x={x0} 不满足'))
        return True
    # 类型3: (x±n)/d ± (x±n2)/d2 = r  （去分母后验证）
    m3 = re.fullmatch(r'\(?x ([+-]) (-?\d+)\)?/(-?\d+) \+ \(?x ([+-]) (-?\d+)\)?/(-?\d+) = (-?\d+)', body)
    if m3:
        s1, n1, d1, s2, n2, d2, r = m3.groups()
        v1 = (x0 + (int(n1) if s1 == '+' else -int(n1))) / F(int(d1))
        v2 = (x0 + (int(n2) if s2 == '+' else -int(n2))) / F(int(d2))
        if v1 + v2 != F(int(r)):
            issues.append(('方程错误', f"T{t['no']} {qid}", q['stem'], f'x={x0} 不满足'))
        return True
    return False


# ---------- 3. 方程组 ----------
def try_sys(q, t):
    qid = q.get('id', '变式')
    m = re.match(r'^解方程组：(.+?)．（答案形如 x=2,y=-1）$', q['stem'])
    if not m:
        return False
    body = strip_tex(m.group(1))
    mg = re.match(r'x=(-?\d+),y=(-?\d+)$', q['answer'])
    if not mg:
        return False
    x0, y0 = F(int(mg.group(1))), F(int(mg.group(2)))

    def coef(tok, unit):
        tok = tok.strip()
        mm = re.fullmatch(r'(-?)(\d*)' + unit, tok)
        if not mm:
            return None
        sign = -1 if mm.group(1) == '-' else 1
        return sign * (int(mm.group(2)) if mm.group(2) else 1)

    ok_all = True
    parsed_any = False
    for eq in body.split('，'):
        # y = kx ± b
        m1 = re.fullmatch(r'y = (-?x|-?\d+x) ([+-]) (\d+)', eq)
        if m1:
            k = coef(m1.group(1), 'x')
            b = int(m1.group(3)) * (1 if m1.group(2) == '+' else -1)
            if k is None or k * x0 + b != y0:
                ok_all = False
            parsed_any = True
            continue
        # ax ± by = c
        m2 = re.fullmatch(r'(-?x|-?\d+x) ([+-]) (-?y|-?\d+y) = (-?\d+)', eq)
        if m2:
            a = coef(m2.group(1), 'x')
            b = coef(m2.group(3), 'y') * (1 if m2.group(2) == '+' else -1)
            c = int(m2.group(4))
            if a is None or b is None or a * x0 + b * y0 != c:
                ok_all = False
            parsed_any = True
            continue
        m3 = re.fullmatch(r'(-?x|-?\d+x) = (-?\d+)', eq)
        if m3:
            a = coef(m3.group(1), 'x')
            if a is None or a * x0 != int(m3.group(2)):
                ok_all = False
            parsed_any = True
            continue
        return False
    if parsed_any and not ok_all:
        issues.append(('方程组错误', f"T{t['no']} {qid}", q['stem'], f'x={x0},y={y0} 不满足'))
    return True


# ---------- 4. 不等式 ----------
def try_ineq(q, t):
    qid = q.get('id', '变式')
    m = re.match(r'^解不等式：(.+?)．（答案形如 x>3 或 x<-2）$', q['stem'])
    if not m:
        return False
    body = strip_tex(m.group(1))
    a = q['answer']
    m2 = re.match(r'^x([<>])(-?\d+(?:/\d+)?)$', a)
    if not m2:
        return False
    op, bnd = m2.group(1), parse_num(m2.group(2))
    # 类型1: ax ± b > c
    m1 = re.fullmatch(r'\(?(-?\d+)?x? ([+-]) (\d+)\)? ([<>]) (-?\d+)', body)
    m1b = re.fullmatch(r'\(?(-?\d+)x ([+-]) (\d+)\)? ([<>]) (-?\d+)', body)
    # 类型2: a(x±b) > c
    m3 = re.fullmatch(r'\((-?\d+)\)\(x ([+-]) (\d+)\) ([<>]) (-?\d+)', body)
    # 类型3: (x±n)/d > r
    m4 = re.fullmatch(r'\(?x ([+-]) (-?\d+)\)?/(-?\d+) ([<>]) (-?\d+)', body)
    if m1b:
        aa = int(m1b.group(1)); op1 = m1b.group(2); bb = int(m1b.group(3)); opi = m1b.group(4); c = int(m1b.group(5))
        lhs = aa * bnd + (bb if op1 == '+' else -bb)
        flip = aa < 0
        if opi == '>':
            real = '<' if flip else '>'
        else:
            real = '>' if flip else '<'
        if not ((real == '>' and lhs > c) or (real == '<' and lhs < c)):
            # 边界是开区间，验证 bnd 邻近
            near = bnd + F(1, 1000)
            ln = aa * near + (bb if op1 == '+' else -bb)
            if not ((real == '>' and ln > c) or (real == '<' and ln < c)):
                issues.append(('不等式错误', f"T{t['no']} {qid}", q['stem'], f'解集 {a} 邻域不满足'))
    return True


# ---------- 5. 合理性 / 显示扫描 ----------
def scan_misc(q, t, is_main):
    stem = q['stem']
    qid = q.get('id', '变式')
    if re.search(r'(?<![\d.])0x|(?<![\d.])0y', stem) and 'mx' not in stem and 'M = 0' not in stem:
        issues.append(('显示', f"T{t['no']} {qid}", stem, '出现 0x/0y'))
    if re.search(r'(?<![\d.])1[xy](?![\d=])', stem):
        issues.append(('显示', f"T{t['no']} {qid}", stem, '出现 1x/1y'))
    if stem.count('(') != stem.count(')') and '\\frac' not in stem:
        issues.append(('显示', f"T{t['no']} {qid}", stem, '括号不平衡'))
    if 'None' in stem or 'nan' in q['answer'] or q['answer'].strip() in ('', '0/0'):
        issues.append(('退化', f"T{t['no']} {qid}", stem, '空/非法答案'))
    if q['answer'] == '0' and '计算' in stem:
        pass  # 0 合法但统计
    # 除数为 0 / ±1 太平凡
    if re.search(r'÷ \((-?[01])\)', stem):
        issues.append(('退化', f"T{t['no']} {qid}", stem, '除数为 0/±1'))
    # 应用题中未替换的模板占位
    if ('{' in stem and '\\frac' not in stem) or 'None' in stem or 'TODO' in stem:
        issues.append(('模板残留', f"T{t['no']} {qid}", stem, '含未替换占位'))


# ---------- 主循环 ----------
kinds = {'calc': 0, 'lin': 0, 'sys': 0, 'ineq': 0, 'other': 0}
zero_ans = {}
dups = {}
all_stems = {}
for t in d['trainings']:
    zc = 0
    for q in t['questions']:
        for item in [q] + q.get('variants', []):
            if try_calc(item, t):
                kinds['calc'] += 1
            elif try_lin(item, t):
                kinds['lin'] += 1
            elif try_sys(item, t):
                kinds['sys'] += 1
            elif try_ineq(item, t):
                kinds['ineq'] += 1
            else:
                kinds['other'] += 1
            scan_misc(item, t, item is q)
            if item['answer'] in ('0', 'x=0'):
                zc += 1
            all_stems.setdefault(item['stem'], []).append(f"T{t['no']}")
    zero_ans[t['no']] = zc

for stem, where in all_stems.items():
    ts = set(x.split(' ')[0] for x in where)
    if len(where) > 1 and len(ts) == 1:
        issues.append(('重复', where[0], stem, f'同训练内重复 {len(where)} 次'))

print('解析覆盖:', kinds)
print('各训练答案为 0 的题数:', {k: v for k, v in zero_ans.items() if v >= 5})
print(f'\n问题 {len(issues)} 条:')
seen = set()
for kind, loc, stem, msg in issues:
    key = (kind, stem[:40])
    if key in seen:
        continue
    seen.add(key)
    print(f'  [{kind}] {loc}: {stem[:80]} —— {msg}')
