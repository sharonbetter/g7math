#!/usr/bin/env python3
"""
计算专项题库生成器（《一本·计算题满分训练》七年级 · 同构生成版）。

- 训练骨架（编号/标题/难度/模块）来自原书 OCR（data/calc-skeleton.json）
- 每个训练按原书题型模板生成同构题目，答案由 Fraction 精确计算
- 输出 data/calc/trainings.json，前端在 app 中直接加载

题面使用 Unicode 数学文本，分数可用 $-\\frac{a}{b}$（KaTeX）渲染。
"""
import json
import os
import random
from fractions import Fraction

ROOT = os.path.join(os.path.dirname(__file__), '..')
SKEL = json.load(open(os.path.join(ROOT, 'data', 'calc-skeleton.json'), encoding='utf-8'))

# ---------- 模块与章节映射 ----------
MODULES = [
    {'id': 'm1', 'name': '有理数的运算', 'range': (1, 32), 'chapterId': '7a-c2', 'chapterTitle': '第二章 有理数的运算'},
    {'id': 'm2', 'name': '整式的加减', 'range': (33, 41), 'chapterId': '7a-c4', 'chapterTitle': '第四章 整式的加减'},
    {'id': 'm3', 'name': '一元一次方程', 'range': (42, 57), 'chapterId': '7a-c5', 'chapterTitle': '第五章 一元一次方程'},
    {'id': 'm4', 'name': '实数', 'range': (58, 62), 'chapterId': '7b-c8', 'chapterTitle': '第八章 实数'},
    {'id': 'm5', 'name': '二元一次方程组', 'range': (63, 76), 'chapterId': '7b-c10', 'chapterTitle': '第十章 二元一次方程组'},
    {'id': 'm6', 'name': '不等式与不等式组', 'range': (77, 97), 'chapterId': '7b-c11', 'chapterTitle': '第十一章 不等式与不等式组'},
    {'id': 'm7', 'name': '幻方与幻圆（数学活动）', 'range': (98, 99), 'chapterId': '7a-c2', 'chapterTitle': '第二章 有理数的运算'},
]

def module_of(no):
    for m in MODULES:
        if m['range'][0] <= no <= m['range'][1]:
            return m
    return MODULES[-1]

# ---------- 工具 ----------
F = Fraction

def fmt(f, latex=False):
    """Fraction/int/float -> 展示字符串。latex 时用 \\frac。float 去尾零。"""
    if isinstance(f, float):
        s = f'{f:.6f}'.rstrip('0').rstrip('.')
        return s or '0'
    if isinstance(f, int):
        f = F(f)
    if latex:
        sign = '-' if f < 0 else ''
        v = abs(f)
        if v.denominator == 1:
            return f'{sign}{v.numerator}'
        return f'{sign}\\frac{{{v.numerator}}}{{{v.denominator}}}'
    if f.denominator == 1:
        return str(f.numerator)
    return f'{f.numerator}/{f.denominator}'

def fmt_term(f, first=False, latex=False):
    """项的展示：first 为真且正数不带 +。"""
    s = fmt(abs(f), latex)
    if f < 0:
        return f'-{s}'
    return f'+{s}' if not first else s

def dec(d, digits=1):
    """返回 (d*10^-digits) 的 Fraction，用于一位/两位小数。"""
    return F(d, 10 ** digits)

def coin(rng, p=0.5):
    return rng.random() < p

def nz_int(rng, a, b):
    """非零整数"""
    while True:
        v = rng.randint(a, b)
        if v != 0:
            return v

def nz_no1(rng, a, b):
    """非零且非 ±1 的整数（用于除数等）"""
    while True:
        v = rng.randint(a, b)
        if v not in (0, 1, -1):
            return v

def var_term(coef, var, first=False):
    """多项式项展示：系数为 ±1 时省略 1；中间项符号后带空格（5x - 6y）。"""
    s = str(var) if abs(coef) == 1 else f'{abs(coef)}{var}'
    if coef < 0:
        return f'- {s}' if not first else f'-{s}'
    return f'+ {s}' if not first else s

def term1(coef, suffix, first=False):
    """通用项展示（suffix 如 x² / x / xy）：系数 ±1 省略数字；中间项符号后带空格。"""
    s = suffix if abs(coef) == 1 else f'{abs(coef)}{suffix}'
    if coef < 0:
        return f'- {s}' if not first else f'-{s}'
    return f'+ {s}' if not first else s

def mixed_ints(rng, n, lo=10, hi=30, min_neg=1, min_pos=1, small_ratio=0.2):
    """n 个非零整数：保证正负混合（至少 min_neg 负 / min_pos 正），绝对值以两位数为主。"""
    for _ in range(60):
        nums = []
        for _ in range(n):
            v = rng.randint(2, 9) if rng.random() < small_ratio else rng.randint(lo, hi)
            nums.append(v * rng.choice([1, -1]))
        neg = sum(1 for v in nums if v < 0)
        if neg >= min_neg and (n - neg) >= min_pos:
            return nums
    nums = [rng.randint(lo, hi) for _ in range(n)]
    for i in range(min_neg):
        nums[i] = -abs(nums[i])
    for i in range(min_neg, min_neg + min_pos):
        nums[i] = abs(nums[i])
    rng.shuffle(nums)
    return nums

def snum(v):
    """原书风格：带符号括号 (+20) / (-27)"""
    t = fmt(v)
    return f'(+{t})' if v > 0 else f'({t})'

def sdec(v):
    """一位小数的带符号括号展示：(+3.4) / (-2.7)。输入应为 10 的倍数分之一（Fraction 会约分，用 float 定点输出）。"""
    t = f'{float(v):.1f}'
    return f'(+{t})' if v > 0 else f'({t})'

def fmt_frac_answer(ans):
    """答案字符串：分数优先 3/4；小数原样。"""
    return fmt(ans)

# ---------- 题目生成模板 ----------
# 每个模板: gen(rng, difficulty) -> {'stem','answer','accepted':['…'],'seconds'}

SKILL_NAMES = {
    'sign': '符号处理（正负判断）',
    'frac_add': '异分母通分',
    'mixed_num': '带分数处理',
    'muldiv_sign': '乘除符号（负负得正）',
    'power_sign': '乘方符号',
    'dist_law': '分配律运用',
    'combine': '合并同类项',
    'bracket': '去括号变号',
    'move': '移项变号',
    'clear_den': '去分母漏乘',
    'sys': '消元与代入',
    'ineq_dir': '不等号方向',
    'sqrt': '平方根与立方根',
    'param': '参数求解',
    'magic': '幻方与幻圆',
}

def q(stem, answer, accepted=None, seconds=60, skill=None, common=None):
    """common: [(错误答案, 错因key或文案)] —— 批改时反查用户错答诊断错因"""
    # accepted 允许传单个字符串（等价于一条可选答案），避免被逐字符展开
    if isinstance(accepted, str):
        accepted = [accepted]
    return {
        'stem': stem, 'answer': answer, 'accepted': accepted or [], 'seconds': seconds,
        'skill': skill,
        'commonWrong': [
            {'answer': str(w), 'reason': SKILL_NAMES.get(r, r) if r in SKILL_NAMES else r, 'skill': r if r in SKILL_NAMES else None}
            for w, r in (common or [])
        ],
    }

def signed_int(rng, a, b):
    v = nz_int(rng, a, b)
    return v

def par(v, latex=False):
    """给负数加括号的项展示。"""
    return f'({fmt(v, latex)})' if (isinstance(v, (int, F)) and v < 0) else fmt(v, latex)

# ===== 第一模块：有理数的运算 =====

def t_int_add(rng, diff):
    n = 3 + (diff >= 2) + (rng.random() < 0.4)
    nums = mixed_ints(rng, n)
    ans = sum(nums)
    wrongs = [(fmt(sum(abs(v) for v in nums)), 'sign')]
    stem = ' + '.join(snum(v) for v in nums) + '．'
    return q(f'计算：{stem}', fmt(ans), seconds=45, skill='sign', common=wrongs)

def t_dec_add(rng, diff):
    n = 4 if diff >= 2 else 3
    nums = [F(v, 10) for v in mixed_ints(rng, n, lo=12, hi=99)]
    ans = sum(nums)
    wrongs = [(fmt(sum(abs(v) for v in nums)), 'sign')]
    stem = ' + '.join(sdec(v) for v in nums) + '．'
    return q(f'计算：{stem}', fmt(ans), seconds=50, skill='sign', common=wrongs)

def t_frac_add(rng, diff):
    n = 3 if diff == 1 else 4
    def rand_frac():
        den = rng.randint(2, 9 if diff >= 2 else 6)
        num = rng.randint(1, den * 2 - 1)
        v = F(num, den)
        if coin(rng, 0.45):
            whole = rng.randint(1, 9) * (1 if coin(rng, 0.5) else -1)
            v = whole + (abs(v) if whole > 0 else -abs(v))
        else:
            v = v if coin(rng, 0.5) else -v
        return v
    nums = [rand_frac() for _ in range(n)]
    ans = sum(nums)
    if ans == 0:
        ans = F(1, 2)
        nums[0] = nums[0] + ans
    # 诊断：分子分母分别相加（未通分）
    fold = nums[0]
    for v in nums[1:]:
        fold = F(fold.numerator + v.numerator, fold.denominator + v.denominator)
    wrongs = [
        (fmt(fold), 'frac_add'),
        (fmt(sum(abs(v) for v in nums)), 'sign'),
    ]
    stem = ' + '.join(f'${fmt(v, latex=True)}$' for v in nums) + '．'
    return q(f'计算：{stem}', fmt(ans), fmt(ans.numerator / ans.denominator if ans.denominator != 1 else fmt(ans)), seconds=75, skill='frac_add', common=wrongs)

def t_add_smart(rng, diff):
    """凑整 / 相反数结合"""
    style = rng.choice(['int', 'dec', 'opposite'])
    if style == 'opposite':
        pairs = []
        for _ in range(2 + (diff >= 2)):
            v = nz_int(rng, 2, 20) * rng.choice([1, -1])
            pairs.extend([v, -v])
        # 必加一个额外项，避免答案恒为 0
        pairs.append(nz_int(rng, -9, 9) if rng.random() < 0.6 else nz_int(rng, 11, 29) * rng.choice([1, -1]))
        nums = pairs
        rng.shuffle(nums)
        ans = sum(nums)
        stem = ' + '.join(par(v) for v in nums) + '．'
        return q(f'用简便方法计算：{stem}', fmt(ans), seconds=45)
    if style == 'int':
        pairs = []
        for _ in range(2 + (diff >= 2)):
            a = rng.randint(11, 89)
            pairs.extend([a, 100 - a if coin(rng, 0.5) else -(100 + a)])
        # 保证凑整
        nums = []
        for i in range(0, len(pairs), 2):
            a = rng.randint(11, 89)
            sgn = 1 if coin(rng, 0.5) else -1
            nums.extend([sgn * a, sgn * (100 - a)])
        ans = sum(nums)
        stem = ' + '.join(par(v) for v in nums) + '．'
        return q(f'用简便方法计算：{stem}', fmt(ans), seconds=45)
    nums = []
    for i in range(2 + (diff >= 2)):
        a = rng.randint(11, 89)
        sgn = 1 if coin(rng, 0.6) else -1
        nums.extend([sgn * F(a, 10), sgn * F(100 - a, 10) if sgn > 0 else -F(100 - a, 10)])
    ans = sum(nums)
    stem = ' + '.join(par(v) for v in nums) + '．'
    return q(f'用简便方法计算：{stem}', fmt(ans), seconds=50)

def t_add_apply(rng, diff):
    kind = rng.choice(['temp', 'money', 'water', 'weight'])
    if kind == 'temp':
        a, b, c = nz_int(rng, -12, 12), nz_int(rng, -8, 8), nz_int(rng, -8, 8)
        stem = (f'某地早晨气温为 {a} ℃，中午上升 {b} ℃，夜间又下降 {c} ℃，'
                f'求夜间气温（单位：℃，用带符号的数表示）．')
        return q(stem, fmt(a + b - c), seconds=60)
    if kind == 'money':
        a, b, c = rng.randint(100, 900), rng.randint(100, 900), rng.randint(50, 600)
        stem = (f'商店进货支出 {a} 元，当天销售收入 {b} 元，第二天又支出 {c} 元．'
                f'若收入记为正，求两天结余（单位：元）．')
        return q(stem, fmt(-a + b - c), seconds=60)
    if kind == 'water':
        a, b = F(nz_int(rng, 1, 9), 10), F(nz_int(rng, 1, 9), 10)
        rise = F(rng.randint(5, 40), 100)
        stem = (f'水库水位超出警戒线 {fmt(a)} m，第二天水位下降 {fmt(rise)} m，第三天又上升 {fmt(b)} m．'
                f'求此时水位（超出记为正，单位：m）．')
        return q(stem, fmt(a - rise + b), seconds=65)
    b, c = rng.randint(2, 15), rng.randint(1, 12)
    d = rng.randint(1, 5)
    stem = f'仓库中的一批水果先运出 {b} kg，再运出 {c} kg，后又运入 {d} kg，这批水果的重量变化了多少 kg（运入记为正）？'
    return q(stem, fmt(-b - c + d), seconds=60)

def t_int_sub(rng, diff):
    n = 3 if diff == 1 else 4
    nums = mixed_ints(rng, n, lo=12, hi=40, min_neg=1)
    ans = nums[0] - sum(nums[1:])
    wrongs = [(fmt(sum(nums)), 'sign')]
    stem = ' - '.join(snum(v) for v in nums) + '．'
    return q(f'计算：{stem}', fmt(ans), seconds=50, skill='sign', common=wrongs)

def t_dec_frac_sub(rng, diff):
    if coin(rng, 0.5):
        nums = [F(v, 10) for v in mixed_ints(rng, 3, lo=12, hi=99)]
        ans = nums[0] - nums[1] - nums[2]
        wrongs = [(fmt(sum(nums)), 'sign')]
        stem = ' - '.join(sdec(v) for v in nums) + '．'
        return q(f'计算：{stem}', fmt(ans), seconds=55, skill='sign', common=wrongs)
    nums = []
    for _ in range(3):
        den = rng.randint(2, 9)
        v = F(rng.randint(1, den * 2 - 1), den) * rng.choice([1, -1])
        nums.append(v)
    ans = nums[0] - nums[1] - nums[2]
    fold = nums[0]
    for v in nums[1:]:
        fold = F(fold.numerator - v.numerator, fold.denominator - v.denominator) if (fold.denominator - v.denominator) else fold - v
    wrongs = [(fmt(sum(nums)), 'sign'), (fmt(fold), 'frac_add')]
    stem = ' - '.join(f'${fmt(v, latex=True)}$' for v in nums) + '．'
    return q(f'计算：{stem}', fmt(ans), seconds=65, skill='frac_add', common=wrongs)

def t_algebraic_sum(rng, diff):
    """代数和（省略加号的加减混合）"""
    n = 4 if diff == 1 else 5
    nums = mixed_ints(rng, n, lo=8, hi=25)
    ans = sum(nums)
    parts = [par(nums[0])] + [f'{"+" if v > 0 else "-"}{abs(v)}' for v in nums[1:]]
    return q(f'计算：{"".join(parts)}．', fmt(ans), seconds=55)

def t_mix_addsub(rng, diff):
    n = 5 if diff <= 2 else 6
    kind = rng.choice(['int', 'dec'])
    if kind == 'int':
        nums = mixed_ints(rng, n, lo=8, hi=50)
        ans = sum(nums)
        parts = [par(nums[0])] + [f'{"+" if v > 0 else "-"}{abs(v)}' for v in nums[1:]]
        return q(f'计算：{"".join(parts)}．', fmt(ans), seconds=60)
    nums = [F(v, 10) for v in mixed_ints(rng, n, lo=12, hi=99)]
    ans = sum(nums)
    parts = [par(nums[0])] + [f'{"+" if v > 0 else "-"}{abs(fmt(v))}' for v in nums[1:]]
    return q(f'计算：{"".join(parts)}．', fmt(ans), seconds=70)

def t_sign_of_product(rng, diff):
    n = rng.randint(4, 6) if diff >= 2 else 3
    nums = [signed_int(rng, -9, 9) for _ in range(n)]
    prod = 1
    for v in nums:
        prod *= v
    if rng.random() < 0.4:
        stem = ' × '.join(par(v) for v in nums) + '．'
        return q(f'计算（注意先定符号）：{stem}', fmt(prod), seconds=60)
    neg = sum(1 for v in nums if v < 0)
    stem = ' × '.join(par(v) for v in nums)
    return q(f'不计算结果，直接判断积的符号：{stem}＝____（填“正”或“负”）', '负' if neg % 2 else '正', ['正', '负'], seconds=40)

def t_mul_smart(rng, diff):
    style = rng.choice(['round', 'dist'])
    if style == 'dist':
        a = rng.choice([rng.randint(2, 12), -rng.randint(2, 12)])
        bs = [nz_int(rng, -19, 19) for _ in range(3)]
        ans = a * sum(bs)
        stem = f'{par(a)} × ({ " + ".join(par(b) for b in bs) })．'
        return q(f'用分配律计算：{stem}', fmt(ans), seconds=60)
    base = rng.choice([(2, 5), (4, 25), (8, 125), (5, 2)])
    n1, n2 = base
    extra = nz_int(rng, -9, 9)
    a, b, c = n1 * extra, n2, rng.randint(2, 9)
    ans = a * b * c
    stem = f'{a} × {c} × {b}．' if coin(rng, 0.5) else f'{a} × {b} × {c}．'
    return q(f'用简便方法计算：{stem}', fmt(ans), seconds=45)

def t_mul_gen(rng, diff):
    n = 3 if diff == 1 else 4
    nums = mixed_ints(rng, n, lo=3, hi=12, min_neg=1, min_pos=1, small_ratio=0.35)
    prod = 1
    for v in nums:
        prod *= v
    stem = ' × '.join(par(v) for v in nums) + '．'
    return q(f'计算：{stem}', fmt(prod), seconds=55, skill='muldiv_sign', common=[(fmt(-prod), 'muldiv_sign')])

def t_div_law(rng, diff):
    a = mixed_ints(rng, 1, lo=12, hi=60, min_neg=0, min_pos=0, small_ratio=0)[0]
    b = rng.randint(3, 15) * rng.choice([1, -1])
    ans = F(a, b)
    stem = f'{par(a)} ÷ {par(b)}．'
    return q(f'计算：{stem}', fmt(ans), fmt(float(ans)), seconds=50, skill='muldiv_sign', common=[(fmt(-ans), 'muldiv_sign')])

def t_div_gen(rng, diff):
    if coin(rng, 0.5):
        a = F(nz_int(rng, -99, 99), 10)
        b = F(rng.randint(2, 99) * rng.choice([1, -1]), 10)
        ans = a / b
        stem = f'${fmt(a, latex=True)}$ ÷ ${fmt(b, latex=True)}$．'
        return q(f'计算：{stem}', fmt(ans), fmt(float(ans)), seconds=70)
    a = F(rng.randint(1, 9), rng.randint(2, 9)) * rng.choice([1, -1])
    b = F(rng.randint(1, 9), rng.randint(2, 9)) * rng.choice([1, -1])
    ans = a / b
    stem = f'${fmt(a, latex=True)}$ ÷ ${fmt(b, latex=True)}$．'
    return q(f'计算：{stem}', fmt(ans), fmt(float(ans)), seconds=70)

def t_muldiv_mix(rng, diff):
    n = 4 if diff <= 2 else 5
    nums = mixed_ints(rng, n, lo=3, hi=15, min_neg=1, small_ratio=0.25)
    nums = [v if v not in (1, -1) else 2 for v in nums]
    # 保证整除
    for i in range(1, n):
        nums[i] = nums[i] if nums[i] != 0 else 2
    ans = nums[0]
    ops = []
    for v in nums[1:]:
        if rng.random() < 0.5:
            ans *= v
            ops.append(('×', v))
        else:
            if v == 0 or ans % v != 0:
                # 调整为可整除：换 v 为 ans 的因数或改乘
                if ans != 0 and abs(ans) <= 400:
                    divs = [d for d in range(2, 13) if ans % d == 0]
                    if divs:
                        v = rng.choice(divs + [-d for d in divs])
                        ans //= v
                        ops.append(('÷', v))
                        continue
                ans *= v
                ops.append(('×', v))
            else:
                ans //= v
                ops.append(('÷', v))
    stem = str(par(nums[0]))
    for op, v in ops:
        stem += f' {op} {par(v)}'
    return q(f'计算：{stem}．', fmt(int(ans)), seconds=75)

def t_power(rng, diff):
    # 负底为主（乘方的核心考点是符号判断），正底限少量
    base = rng.choice([-2, -3, -4, -5, -2, -3, -4, -5, -3, -5, -2, 10])
    n = rng.randint(2, 4 if diff >= 2 else 3)
    ans = base ** n
    if rng.random() < 0.3:
        other = rng.randint(2, 20) * rng.choice([1, -1])
        total = ans + other
        return q(f'计算：({fmt(base)})^{n} {fmt_term(other)}．', fmt(total), seconds=50, skill='power_sign', common=[(fmt(base ** n * -1 + other), 'power_sign')])
    return q(f'计算：({fmt(base)})^{n}．', fmt(ans), seconds=40, skill='power_sign', common=[(fmt(-ans), 'power_sign')])

def t_mixed(rng, diff):
    """有理数混合运算，难度递增"""
    # 结构：a^2 ± b×c ÷ d （保证整除）
    a = rng.choice([-3, -2, -4, 2, 3, -5, 4, -6])
    b, c = signed_int(rng, -9, 9), signed_int(rng, -9, 9)
    prod = b * c
    divisors = [d for d in range(2, 10) if prod != 0 and prod % d == 0] or [1]
    d = rng.choice(divisors)
    e = rng.randint(2, 30) * rng.choice([1, -1])
    a2 = a ** 2
    ans = a2 + F(prod, d) + e
    stem = f'({fmt(a)})² {fmt_term(F(prod, d) if prod % d == 0 else F(prod, d), first=False) if False else ""}'
    # 直接构造展示
    term1 = f'({fmt(a)})²'
    term2 = f'{par(b)} × {par(c)} ÷ {par(d)}'
    op = '+' if e >= 0 else '-'
    stem = f'{term1} + {term2} {op} {abs(e)}．'
    return q(f'计算：{stem}', fmt(ans), fmt(float(ans)), seconds=90)

def t_mixed2(rng, diff):
    """含括号的混合：a × (b + c) − d² 等"""
    a = rng.choice([-3, -2, 2, 3, 4, -4, 5, -5])
    b = nz_int(rng, -9, 9)
    c = rng.randint(1, 15) * rng.choice([1, -1])
    inner = b + c
    d = rng.choice([-2, 2, 3, -3, 4])
    n = 2 if diff <= 2 else rng.choice([2, 3])
    e = rng.randint(1, 30) * rng.choice([1, -1])
    ans = a * inner - d ** n + e
    stem = f'{par(a)} × ({fmt(b)} {"+" if c > 0 else "-"} {abs(c)}) − ({fmt(d)})^{n} {fmt_term(e)}．'
    return q(f'计算：{stem}', fmt(ans), seconds=95)

def t_new_op(rng, diff):
    """定义新运算"""
    name = rng.choice(['※', '☆', '⊗', '⊕'])
    a, b = signed_int(rng, -6, 6), signed_int(rng, -6, 6)
    style = rng.randint(1, 3)
    if style == 1:
        desc = f'a {name} b = a² − b²'
        ans = a * a - b * b
    elif style == 2:
        desc = f'a {name} b = 2a + 3b'
        ans = 2 * a + 3 * b
    else:
        desc = f'a {name} b = (a + b) × (a − b)'
        ans = (a + b) * (a - b)
    return q(f'定义新运算：{desc}．求 ({fmt(a)}) {name} ({fmt(b)}) 的值．', fmt(ans), seconds=70)

def t_m1_pool(rng, diff, force=None):
    pool = [t_int_add, t_dec_add, t_frac_add, t_add_smart, t_int_sub, t_dec_frac_sub,
            t_algebraic_sum, t_mix_addsub, t_sign_of_product, t_mul_smart, t_mul_gen,
            t_div_law, t_div_gen, t_muldiv_mix, t_power, t_mixed, t_mixed2, t_new_op]
    return rng.choice(pool)(rng, diff)

# ===== 第二模块：整式的加减 =====

def t_combine(rng, diff):
    """合并同类项（答案：先化简再求值，保证数值答案）"""
    # P(x) = ax² + bx + c，Q(x) = dx² - ex + f，求 2P - Q 代入 x=k
    a, b, c = nz_int(rng, -6, 6), nz_int(rng, -8, 8), nz_int(rng, -10, 10)
    d, e, f2 = nz_int(rng, -5, 5), nz_int(rng, -8, 8), nz_int(rng, -10, 10)
    A, B, C = 2 * a - d, 2 * b + e, 2 * c - f2
    k = rng.choice([-2, -1, 1, 2, 3])
    ans = A * k * k + B * k + C
    P = f'{term1(a, "x²", True)} {term1(b, "x")} {fmt_term(c)}'
    Q = f'{term1(d, "x²", True)} {term1(-e, "x")} {fmt_term(f2)}'
    buggy = (2 * a + d) * k * k + (2 * b + e) * k + (2 * c + f2)
    return q(f'先化简，再求值：2（{P}）−（{Q}），其中 x = {k}．', fmt(ans), seconds=100, skill='bracket',
             common=[(fmt(buggy), 'bracket')])

def t_bracket(rng, diff):
    """去括号合并：A - 2(B - C) 代入求值"""
    terms = 'xy'
    a1, a0 = nz_int(rng, -5, 5), nz_int(rng, -8, 8)
    b1, b0 = nz_int(rng, -5, 5), nz_int(rng, -8, 8)
    c1, c0 = nz_int(rng, -5, 5), nz_int(rng, -8, 8)
    A1, A0 = a1 - 2 * b1 + 2 * c1, a0 - 2 * b0 + 2 * c0
    x, y = rng.choice([-2, -1, 1, 2]), rng.choice([-2, -1, 1, 2, 3])
    ans = A1 * x * y + A0
    P = f'{term1(a1, terms, True)} {fmt_term(a0)}'
    B = f'{term1(b1, terms, True)} {fmt_term(b0)}'
    C = f'{term1(c1, terms, True)} {fmt_term(c0)}'
    return q(f'先化简，再求值：（{P}）−2（{B} − {C}），其中 x = {x}，y = {y}．', fmt(ans), seconds=110)

def t_text_poly(rng, diff):
    """文字叙述列式化简求值"""
    a = nz_int(rng, 2, 9)
    b = nz_int(rng, 3, 9)
    k = rng.choice([-2, -1, 1, 2])
    ans = (a + 2 * b) * k + (a - b)
    stem = (f'设一个多项式为“{fmt(a)}x + {fmt(b)}的{b}倍与x的{a}倍之差记为 A”，'
            f'即 A = {b}x − {a}x + {b}．先化简 A，再求 x = {k} 时 A 的值．')
    A1 = b - a
    ans = A1 * k + b
    return q(f'已知 A = {b}x − {a}x + {b}．先化简，再求 x = {k} 时 A 的值．', fmt(ans), seconds=80)

def t_no_term(rng, diff):
    """结果不含某项，求参数 m"""
    n = rng.choice([1, 2, 3])
    coefN = rng.choice([1, 2, 3, 4]) * rng.choice([1, -1])
    s = nz_int(rng, -6, 6)
    t = nz_int(rng, -9, 9)
    p = nz_int(rng, -7, 7)
    r = nz_int(rng, -10, 10)
    m = n * coefN
    M = f'mx² {term1(p, "x")} {fmt_term(r)}'
    N = f'{term1(coefN, "x²", True)} {term1(s, "x")} {fmt_term(t)}'
    return q(
        f'已知 M = {M}，N = {N}，且 M − {n}N 的结果不含 x² 项，求 m 的值．',
        fmt(m), [f'm={m}', f'm = {m}'], seconds=100,
    )

def t_whole_idea(rng, diff):
    """整体思想：已知 x²+xy=…, y²+xy=…, 求 x²+y² 或 x²+3xy+y²"""
    a = nz_int(rng, -10, 10)
    b = nz_int(rng, -10, 10)
    style = rng.choice([1, 2])
    if style == 1:
        ans = a + b
        return q(f'已知 x² + xy = {a}，y² + xy = {b}，求 x² + y² 的值．', fmt(ans), seconds=80)
    k = rng.randint(2, 4)
    ans = a + b + (k - 2 + 1) * 0  # x²+kxy+y² = (x²+xy)+(y²+xy)+(k-2)xy —— 需 xy 值
    xy = nz_int(rng, -6, 6)
    a = x2xy = nz_int(rng, -9, 9)
    b = y2xy = nz_int(rng, -9, 9)
    ans = (a + b) + (k - 2) * xy
    return q(f'已知 x² + xy = {a}，y² + xy = {b}，xy = {xy}，求 x² + {k}xy + y² 的值．', fmt(ans), seconds=90)

def t_m2_pool(rng, diff):
    return rng.choice([t_combine, t_bracket, t_text_poly, t_whole_idea])(rng, diff)

# ===== 第三模块：一元一次方程 =====

def t_solve_lin(rng, diff, style=None):
    """解一元一次方程。style: shift/bracket/denominator"""
    style = style or rng.choice(['shift', 'bracket', 'denominator'])
    if style == 'shift':
        a, b = nz_int(rng, 2, 9), nz_int(rng, 2, 9)
        c, d = nz_int(rng, -15, 15), nz_int(rng, -15, 15)
        x = F(d - c, a - b)
        buggy = F(d + c, a + b) if (a + b) else None
        wrongs = [(f'x={fmt(buggy)}', 'move'), (f'x={fmt(F(c - d, a - b))}', 'move')] if buggy is not None else []
        stem = f'{a}x {"+" if c >= 0 else "-"} {abs(c)} = {b}x {"+" if d >= 0 else "-"} {abs(d)}'
        return q(f'解方程：{stem}．（答案形如 x=3）', f'x={fmt(x)}', [f'x = {fmt(x)}', fmt(x)], seconds=80, skill='move', common=wrongs)
    elif style == 'bracket':
        a = rng.choice([-4, -3, -2, 2, 3, 4, 5, -5])
        b = nz_int(rng, -9, 9)
        rhs = nz_int(rng, -20, 20)
        x = F(rhs, a) - b
        bb = f'x {"+" if b >= 0 else "-"} {abs(b)}'
        stem = f'{par(a)}({bb}) = {rhs}'
    else:
        den1, den2 = rng.randint(2, 6), rng.randint(2, 6)
        x = rng.choice([i for i in range(-9, 10) if i]) 
        n1, n2 = nz_int(rng, -8, 8), nz_int(rng, -8, 8)
        # (x + n1)/den1 + (x + n2)/den2 = rhs
        rhs = F(x + n1, den1) + F(x + n2, den2)
        if rhs.denominator != 1:
            rhs_v = rhs
            k = rhs_v.denominator
            rhs = int(rhs_v)
            # 调整 n2 使右边为整数
            n2 = (rhs - F(x + n1, den1)) * den2 - x
            if n2.denominator != 1:
                return t_solve_lin(rng, diff, 'denominator')
            n2 = int(n2)
        stem = f'$\\frac{{x {"+" if n1 >= 0 else "-"} {abs(n1)}}}{{{den1}}}$ + $\\frac{{x {"+" if n2 >= 0 else "-"} {abs(n2)}}}{{{den2}}}$ = {rhs}'
    if style == 'bracket':
        wrongs = [(f'x={fmt(F(rhs, a) + b)}', 'move'), (f'x={fmt(F(rhs - b, a))}', 'dist_law')]
        return q(f'解方程：{stem}．（答案形如 x=3）', f'x={fmt(x)}', [f'x = {fmt(x)}', fmt(x)], seconds=80, skill='move', common=wrongs)
    wrongs = [(f'x={fmt(F(rhs - n1 - n2, 2))}', 'clear_den')]
    return q(f'解方程：{stem}．（答案形如 x=3）', f'x={fmt(x)}', [f'x = {fmt(x)}', fmt(x)], seconds=80, skill='clear_den', common=wrongs)

def t_solve_param(rng, diff):
    """已知方程的解，求字母系数"""
    x0 = rng.choice([i for i in range(-5, 6) if i])
    # m·x0 + b = k，构造整数 m
    b = nz_int(rng, -9, 9)
    m = nz_int(rng, 2, 8)
    k = m * x0 + b
    return q(
        f'已知 x = {x0} 是关于 x 的方程 mx {"+" if b >= 0 else "-"} {abs(b)} = {k} 的解，求 m 的值．（答案形如 m=3）',
        f'm={m}', [f'm = {m}', str(m)], seconds=75, skill='param',
        common=[(f'm={-m}', 'param')],
    )

def t_eq_apply(rng, diff):
    kind = rng.choice(['sum', 'motion', 'work', 'geometry'])
    if kind == 'sum':
        # 较小数 x、较大数 2x+d，和 = 3x+d
        x = rng.randint(3, 30)
        d = rng.randint(2, 30)
        total = 3 * x + d
        stem = f'两个数的和为 {total}，较大数比较小数的 2 倍大 {d}，求较小数．'
        return q(stem, fmt(x), seconds=90)
    if kind == 'motion':
        v1 = rng.randint(30, 80)
        v2 = rng.randint(20, v1 - 5)
        t = rng.randint(2, 6)
        dist = (v1 + v2) * t
        stem = (f'甲、乙两人从相距 {dist} km 的两地同时出发相向而行，'
                f'甲的速度为 {v1} km/h，经过 {t} 小时两人相遇，求乙的速度（km/h）．')
        return q(stem, fmt(v2), seconds=100)
    if kind == 'work':
        total = rng.choice([60, 90, 120, 180])
        t1 = rng.randint(3, 9)
        t2 = rng.randint(3, 12)
        x = total // (1 / t1 + 1 / t2) if (1 / t1 + 1 / t2) else 0
        # 简化：甲 t1 天完成，乙 t2 天完成，合作 x 天
        den = t1 * t2
        x = F(total * 1, 1) * F(den, t1 + t2) / total
        x = F(den, t1 + t2)
        stem = (f'一项工作甲单独做 {t1} 天完成，乙单独做 {t2} 天完成，'
                f'两人合作多少天可以完成？（答案为天数，分数用 a/b 表示）')
        return q(stem, fmt(x), fmt(float(x)), seconds=100)
    a = rng.randint(5, 30)
    b = rng.randint(2, 25)
    x = rng.randint(3, 20)
    perim = 2 * (a + b)
    stem = f'长方形的周长为 {perim} cm，长比宽大 {a - b} cm，求宽（cm）．'
    return q(stem, fmt(b), seconds=90)

def t_m3_pool(rng, diff):
    r = rng.random()
    if r < 0.55:
        return t_solve_lin(rng, diff)
    if r < 0.75:
        return t_solve_param(rng, diff)
    return t_eq_apply(rng, diff)

# ===== 第四模块：实数 =====

def t_sqrt_calc(rng, diff):
    squares = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 225]
    cubes = [8, 27, 64, 125, -8, -27, -64]
    style = rng.randint(1, 4)
    if style == 1:
        a = rng.choice(squares)
        b = rng.choice(squares)
        op = rng.choice(['+', '-'])
        ans = (F(int(a ** 0.5), 1) + F(int(b ** 0.5), 1)) if op == '+' else (F(int(a ** 0.5), 1) - F(int(b ** 0.5), 1))
        return q(f'计算：√{a} {op} √{b}．', fmt(ans), seconds=45)
    if style == 2:
        c = rng.choice(cubes)
        a = rng.choice(squares)
        ans = int(round(c ** (1 / 3))) + int(a ** 0.5)
        return q(f'计算：∛({fmt(c)}) + √{a}．', fmt(ans), seconds=50)
    if style == 3:
        a = rng.choice([i for i in range(2, 20)])
        return q(f'计算：（√{a * a}）²．（即 {a}² 的算术平方根的平方）', fmt(a), seconds=35)
    a = rng.choice(squares)
    b = rng.randint(2, 9)
    ans = int(a ** 0.5) * b
    return q(f'计算：√{a} × {b}．', fmt(ans), seconds=45)

def t_m4_pool(rng, diff):
    return t_sqrt_calc(rng, diff)

# ===== 第五模块：二元一次方程组 =====

def t_solve_system(rng, diff, style=None):
    """生成方程组，保证整数解。style: sub(代入)/add(加减)/any"""
    x0 = nz_int(rng, -9, 9)
    y0 = nz_int(rng, -9, 9)
    style = style or rng.choice(['sub', 'add', 'add'])
    if style == 'sub':
        k = nz_int(rng, 2, 6) * rng.choice([1, -1])
        b = nz_int(rng, -12, 12)
        # y = kx + b；a2x + c2y = d2
        a2 = nz_int(rng, -6, 6)
        c2 = nz_int(rng, -6, 6)
        d2 = a2 * x0 + c2 * y0
        eq1 = f'y = {var_term(k, "x", True)} {"+" if b >= 0 else "-"} {abs(b)}'
        eq2 = f'{var_term(a2, "x", True)} {var_term(c2, "y")} = {d2}'
        if k * x0 + b != y0:
            b = y0 - k * x0
            eq1 = f'y = {var_term(k, "x", True)} {"+" if b >= 0 else "-"} {abs(b)}'
    else:
        a1, b1 = nz_int(rng, -6, 6), nz_int(rng, -6, 6)
        a2, b2 = nz_int(rng, -6, 6), nz_int(rng, -6, 6)
        if a1 * b2 - a2 * b1 == 0:
            return t_solve_system(rng, diff, style)
        d1, d2 = a1 * x0 + b1 * y0, a2 * x0 + b2 * y0
        eq1 = f'{var_term(a1, "x", True)} {var_term(b1, "y")} = {d1}'
        eq2 = f'{var_term(a2, "x", True)} {var_term(b2, "y")} = {d2}'
    stem = f'{eq1}，{eq2}'
    ans = f'x={fmt(x0)},y={fmt(y0)}'
    accepted = [f'x={fmt(x0)}, y={fmt(y0)}', f'x = {fmt(x0)}, y = {fmt(y0)}']
    wrongs = [
        (f'x={fmt(y0)},y={fmt(x0)}', 'sys'),
        (f'x={fmt(-x0)},y={fmt(y0)}', 'sys'),
    ]
    return q(f'解方程组：{stem}．（答案形如 x=2,y=-1）', ans, accepted, seconds=110, skill='sys', common=wrongs)

def t_sys_apply(rng, diff):
    kind = rng.choice(['sumdiff', 'motion', 'work2', 'chicken'])
    if kind == 'sumdiff':
        a, b = rng.randint(3, 60), rng.randint(2, 40)
        x = rng.randint(3, 50)
        y = a - x
        while abs(x - y) != b:
            y = a - x
            b = abs(x - y)
        stem = f'两个数的和为 {a}，差为 {abs(x - y)}，求较大的数．'
        return q(stem, fmt(max(x, y)), seconds=90)
    if kind == 'chicken':
        heads = rng.randint(6, 30)
        legs = 2 * heads + rng.randint(2, 10) * 2
        rabbits = (legs - 2 * heads) // 2
        if rabbits > heads or rabbits < 0:
            return t_sys_apply(rng, diff)
        stem = f'笼中有鸡兔共 {heads} 只，脚共 {legs} 只，求兔的只数．'
        return q(stem, fmt(rabbits), seconds=100)
    if kind == 'work2':
        t1, t2 = rng.randint(3, 10), rng.randint(3, 12)
        x = F(t1 * t2, t1 + t2)
        stem = (f'一项工程甲单独做 {t1} 天完成，乙单独做 {t2} 天完成，'
                f'两人合作几天完成？（分数用 a/b 表示）')
        return q(stem, fmt(x), fmt(float(x)), seconds=100)
    v1 = rng.randint(30, 80)
    v2 = rng.randint(20, v1 - 5)
    t = rng.randint(2, 5)
    stem = (f'甲、乙从同一地点同时同向出发，甲的速度 {v1} km/h，乙的速度 {v2} km/h，'
            f'{t} 小时后两人相距多少 km？')
    return q(stem, fmt((v1 - v2) * t), seconds=90)

def t_m5_pool(rng, diff):
    if rng.random() < 0.7:
        return t_solve_system(rng, diff)
    return t_sys_apply(rng, diff)

# ===== 第六模块：不等式（组） =====

def t_solve_ineq(rng, diff, style=None):
    style = style or rng.choice(['shift', 'bracket', 'denominator'])
    if style == 'shift':
        a = rng.choice([i for i in range(2, 9) if i] + [-i for i in range(2, 9)])
        b = nz_int(rng, -12, 12)
        c = nz_int(rng, -15, 15)
        # ax + b > c
        bound = F(c - b, a)
        op = '>' if a > 0 else '<'
        stem = f'{fmt(a)}x {"+" if b >= 0 else "-"} {abs(b)} > {c}'
    elif style == 'bracket':
        a = rng.choice([-4, -3, -2, 2, 3, 4])
        b = nz_int(rng, -8, 8)
        c = nz_int(rng, -15, 15)
        bound = F(c - b, a)
        op = '>' if a > 0 else '<'
        stem = f'{par(a)}(x {"+" if b >= 0 else "-"} {abs(b)}) > {c}'
    else:
        den = rng.randint(2, 6)
        x0 = rng.choice([i for i in range(-8, 9)])
        n = nz_int(rng, -9, 9)
        rhs = F(x0 * den + n, den)
        if rhs.denominator != 1:
            rhs = int(rhs)
            n = rhs * den - x0 * den
        bound = F(x0 * den + n - n, den) if False else F(x0)
        # (x + n)/den > rhs  →  x > rhs*den - n
        bound = F(rhs * den - n, 1)
        op = '>'
        stem = f'$\\frac{{x {"+" if n >= 0 else "-"} {abs(n)}}}{{{den}}}$ > {rhs}'
    ans = f'x{op}{fmt(bound)}'
    flip = '<' if op == '>' else '>'
    accepted = [f'x {op} {fmt(bound)}', f'x{op} {fmt(bound)}']
    return q(f'解不等式：{stem}．（答案形如 x>3 或 x<-2）', ans, accepted, seconds=80, skill='ineq_dir',
             common=[(f'x{flip}{fmt(bound)}', 'ineq_dir')])

def t_solve_ineq_sys(rng, diff):
    lo = nz_int(rng, -6, 4)
    hi = lo + rng.randint(1, 7)
    style = rng.randint(1, 2)
    if style == 1:
        stem = f'x > {lo} 且 x < {hi}'
    else:
        stem = f'x {"+" if 0 else ""} ≥ {lo} 且 x ≤ {hi}'.replace(' + ', ' ')
        stem = f'x ≥ {lo} 且 x ≤ {hi}'
    ans = f'{lo}<x<{hi}'
    accepted = [f'{lo}<x<{hi}', f'{lo} <x< {hi}', f'{lo}< x <{hi}']
    if style == 2:
        ans = f'{lo}≤x≤{hi}'
        accepted = [f'{lo}≤x≤{hi}', f'{lo}<=x<={hi}']
    # 包装成不等式组形式
    a1 = rng.choice([1, 2])
    if a1 == 1:
        return q(f'解不等式组：{stem}．（答案形如 {lo}<x<{hi}，用 < 或 ≤ 连接）', ans, accepted, seconds=85)
    # 原始不等式组
    b1 = -lo
    eq1 = f'x {"+" if b1 >= 0 else "-"} {abs(b1)} > 0'
    eq2 = f'x < {hi}'
    ans2 = f'{lo}<x<{hi}'
    return q(f'解不等式组：{eq1}，{eq2}．（答案形如 {lo}<x<{hi}）', ans2, [f'{lo} <x< {hi}'], seconds=90)

def t_m6_pool(rng, diff):
    if rng.random() < 0.6:
        return t_solve_ineq(rng, diff)
    return t_solve_ineq_sys(rng, diff)

# ===== 第七模块：幻方与幻圆 =====

MAGIC_COMBOS = [(3, -4), (-2, 5), (4, -7), (1, -3), (-4, 1), (2, 7), (-1, 4), (3, -2)]

def magic_grid(m, a, b):
    return [
        [m + a, m - a - b, m + b],
        [m - a + b, m, m + a - b],
        [m - b, m + a + b, m - a],
    ]

def rand_magic(rng):
    for _ in range(60):
        a, b = rng.choice(MAGIC_COMBOS)
        m = rng.choice([-6, 7, -8, 4, 9, -3, 5, -5, 2, -4])
        g = magic_grid(m, a, b)
        vals = [x for r in g for x in r]
        if len(set(vals)) == 9 and all(abs(x) <= 25 for x in vals):
            return g
    return magic_grid(5, -1, -3)

def t_magic(rng, diff):
    """幻方：求中心数 / 求缺格 / 幻和，混合"""
    style = rng.randint(1, 3)
    g = rand_magic(rng)
    m = g[1][1]
    s_magic = 3 * m
    if style == 1:
        return q(f'三阶幻方每行、每列、每条对角线上的三数之和都相等（记为幻和 S）。某幻方的幻和 S = {s_magic}，'
                 f'则其中心格的数是 ______。（性质：S = 3 × 中心数）',
                 fmt(m), [fmt(m), str(m)], seconds=60, skill='magic',
                 common=[(fmt(-m), 'sign'), (fmt(s_magic), '计算失误（未除以 3）')])
    hide = (rng.randint(0, 2), rng.randint(0, 2))
    r0, c0 = hide
    ans = g[r0][c0]
    others = [g[r0][(c0 + 1) % 3], g[r0][(c0 + 2) % 3]]
    import json as _json
    cells = [[('x' if (r, c) == hide else fmt(g[r][c])) for c in range(3)] for r in range(3)]
    fig = '@@fig ' + _json.dumps({'type': 'grid', 'cells': cells, 'highlight': [list(hide)]}, ensure_ascii=False, separators=(',', ':')) + '@@'
    stem = (f'在 3×3 幻方中，每行、每列、每条对角线上的三数之和都相等。已知第一行为 {"、".join(fmt(g[0][j]) if (0, j) != hide else "x" for j in range(3))}，'
            f'第二行为 {"、".join(fmt(g[1][j]) if (1, j) != hide else "x" for j in range(3))}，'
            f'第三行为 {"、".join(fmt(g[2][j]) if (2, j) != hide else "x" for j in range(3))}，则 x = ______。\n{fig}')
    return q(stem, fmt(ans), seconds=75, skill='magic',
             common=[(fmt(s_magic - others[0]), '计算失误（漏减一个数）'), (fmt(-ans), 'sign')])

def t_magic_circle(rng, diff):
    """幻圆：圆心 + 直径两端，每条直径三数之和相等"""
    c = rng.choice([-4, -2, 3, 5, 6, -6])
    pairs = [(rng.randint(-9, 9), rng.randint(-9, 9)) for _ in range(3)]
    S = c + pairs[0][0] + pairs[0][1]
    import json as _json
    if rng.random() < 0.5:
        y_ans = S - c - pairs[1][0]
        fig = '@@fig ' + _json.dumps({'type': 'circle', 'center': c, 'pairs': [[pairs[0][0], pairs[0][1]], [pairs[1][0], 'y'], [pairs[2][0], pairs[2][1]]]}, ensure_ascii=False, separators=(',', ':')) + '@@'
        return q(f'幻圆中，圆心处的数是 {c}，三条直径的两端各放一个数，每条直径上三个数（两端与圆心）之和都相等。'
                 f'已知一条直径的两端为 {pairs[0][0]}、{pairs[0][1]}，另一条直径的一端为 {pairs[1][0]}，另一端为 y，'
                 f'则 y = ______。\n{fig}',
                 fmt(y_ans), seconds=80, skill='magic',
                 common=[(fmt(-y_ans), 'sign'), (fmt(S + pairs[1][0]), '计算失误（圆心重复相加）')])
    x_ans = S - c - pairs[2][1]
    fig2 = '@@fig ' + _json.dumps({'type': 'circle', 'center': c, 'pairs': [[pairs[0][0], pairs[0][1]], ['x', pairs[2][1]], [pairs[1][0], pairs[1][1]]]}, ensure_ascii=False, separators=(',', ':')) + '@@'
    return q(f'幻圆中圆心处的数是 {c}，每条直径上三个数之和都等于 {S}。某条直径的两端为 x 与 {pairs[2][1]}，'
             f'则 x = ______。\n{fig2}',
             fmt(x_ans), seconds=70, skill='magic',
             common=[(fmt(-x_ans), 'sign')])

# ---------- 每个训练的模板路由 ----------
TRAIN_KIND = {}

def register(no_or_range, kind):
    if isinstance(no_or_range, tuple):
        for n in range(no_or_range[0], no_or_range[1] + 1):
            TRAIN_KIND[n] = kind
    else:
        TRAIN_KIND[no_or_range] = kind

register(1, ('int_add', 1)); register(2, ('dec_add', 1)); register(3, ('frac_add', 1))
register(4, ('add_smart', 1)); register(5, ('add_apply', 1)); register(6, ('m1_mix', 1))
register(7, ('int_sub', 1)); register(8, ('dec_frac_sub', 1)); register(9, ('alg_sum', 1))
register(10, ('mix_addsub', 1)); register(11, ('mix_addsub', 2)); register(12, ('m1_mix', 1))
register(13, ('sign', 1)); register(14, ('mul_smart', 1)); register(15, ('mul_smart', 2))
register(16, ('mul_smart', 2)); register(17, ('mul_gen', 1)); register(18, ('m1_mix', 2))
register(19, ('div', 1)); register(20, ('div', 2)); register(21, ('muldiv', 1)); register(22, ('muldiv', 2))
register(23, ('m1_mix', 2)); register(24, ('power', 1)); register(25, ('power', 2))
register((26, 27), ('mixed', 1)); register((28, 30), ('mixed2', 2))
register(31, ('newop', 2)); register(32, ('m1_mix', 3))

register((33, 35), ('poly', 1)); register(36, ('poly_text', 1)); register(37, ('poly_noterm', 2))
register(38, ('poly_whole', 2)); register((39, 41), ('m2_mix', 1))

register(42, ('lin_shift', 1)); register(43, ('lin_bracket', 1)); register(44, ('lin_den', 2))
register(45, ('m3_mix', 1)); register((46, 47), ('lin_param', 2)); register((48, 49), ('m3_mix', 1))
register((50, 51), ('eq_apply', 2)); register((52, 57), ('m3_mix', 2))

register(58, ('sqrt', 1)); register(59, ('sqrt', 1)); register((60, 61), ('sqrt', 2)); register(62, ('sqrt', 2))

register(63, ('sys_sub', 1)); register(64, ('sys_add', 1)); register((65, 66), ('sys_any', 2))
register(67, ('m5_mix', 2)); register((68, 70), ('sys_any', 2)); register((71, 73), ('sys_apply', 2))
register((74, 75), ('sys_any', 3)); register(76, ('m5_mix', 3))

register(77, ('ineq_shift', 1)); register((78, 79), ('ineq_shift', 1)); register((80, 81), ('ineq_den', 2))
register(82, ('ineq_shift', 2)); register(83, ('m6_mix', 2)); register(84, ('ineq_den', 2))
register((85, 87), ('ineq_sys', 2)); register((88, 90), ('ineq_sys', 3)); register(91, ('m6_mix', 3))
register((92, 97), ('m6_mix', 3))

register(98, ('magic', 1)); register(99, ('magic_circle', 1))

GEN = {
    'int_add': lambda rng, d: t_int_add(rng, d),
    'dec_add': t_dec_add,
    'frac_add': t_frac_add,
    'add_smart': t_add_smart,
    'add_apply': t_add_apply,
    'm1_mix': lambda rng, d: t_m1_pool(rng, d),
    'int_sub': t_int_sub,
    'dec_frac_sub': t_dec_frac_sub,
    'alg_sum': t_algebraic_sum,
    'mix_addsub': t_mix_addsub,
    'sign': t_sign_of_product,
    'mul_smart': t_mul_smart,
    'mul_gen': t_mul_gen,
    'div': lambda rng, d: t_div_law(rng, d) if d == 1 else t_div_gen(rng, d),
    'muldiv': t_muldiv_mix,
    'power': t_power,
    'mixed': t_mixed,
    'mixed2': t_mixed2,
    'newop': t_new_op,
    'poly': t_combine,
    'poly_text': t_text_poly,
    'poly_noterm': t_no_term,
    'poly_whole': t_whole_idea,
    'm2_mix': lambda rng, d: t_m2_pool(rng, d),
    'lin_shift': lambda rng, d: t_solve_lin(rng, d, 'shift'),
    'lin_bracket': lambda rng, d: t_solve_lin(rng, d, 'bracket'),
    'lin_den': lambda rng, d: t_solve_lin(rng, d, 'denominator'),
    'lin_param': t_solve_param,
    'eq_apply': t_eq_apply,
    'm3_mix': lambda rng, d: t_m3_pool(rng, d),
    'sqrt': t_sqrt_calc,
    'sys_sub': lambda rng, d: t_solve_system(rng, d, 'sub'),
    'sys_add': lambda rng, d: t_solve_system(rng, d, 'add'),
    'sys_any': lambda rng, d: t_solve_system(rng, d),
    'sys_apply': t_sys_apply,
    'm5_mix': lambda rng, d: t_m5_pool(rng, d),
    'ineq_shift': lambda rng, d: t_solve_ineq(rng, d, 'shift'),
    'ineq_den': lambda rng, d: t_solve_ineq(rng, d, 'denominator'),
    'ineq_sys': t_solve_ineq_sys,
    'm6_mix': lambda rng, d: t_m6_pool(rng, d),
    'magic': t_magic,
    'magic_circle': t_magic_circle,
}

# 训练标题（规范化 + 补齐 OCR 缺失的编号）
TITLE_FIX = {
    1: '整数的加法', 5: '有理数加法的应用', 11: '有理数的加减混合运算（二）',
    25: '有理数的乘方的应用', 31: '【重难突破】定义新运算', 32: '月考集训',
    45: '周末集训', 49: '与一元一次方程的解有关的问题（二）', 55: '期末集训（四）',
    58: '平方根、算术平方根', 62: '周末集训', 63: '代入消元法解二元一次方程组',
    66: '用适当的方法解二元一次方程组（二）', 69: '方程组的解满足另一方程的问题',
    70: '解二元一次方程组的技巧', 74: '三元一次方程组的解法',
    75: '与解三元一次方程组相关的问题', 77: '不等式的性质与解集',
    80: '解一元一次不等式（综合练习）', 83: '周末集训', 85: '解一元一次不等式组（一）',
    88: '解一元一次不等式组（综合）', 89: '含字母系数的不等式（组）',
    90: '【重难突破】根据不等式组的整数解求参数范围', 95: '期末集训（四）',
    3: '分数的加法', 19: '有理数的除法法则', 20: '有理数的除法',
    98: '三阶幻方', 99: '幻圆与直径',
    26: '有理数的混合运算（一）', 27: '有理数的混合运算（二）',
}

def main():
    rng = random.Random(20261012)
    trainings = []
    skel = {t['no']: t for t in SKEL}
    for no in range(1, 100):
        if no not in TRAIN_KIND:
            continue
        t = skel.get(no, {'no': no, 'title': TITLE_FIX.get(no, ''), 'stars': 1, 'minutes': 15, 'bookPage': 0})
        kind, diff = TRAIN_KIND[no]
        gen = GEN[kind]
        title = TITLE_FIX.get(no) or t['title']
        title = (title.replace('*', '').replace('’', '').replace('“', '').replace('"', '')
                 .replace('易错突破', '【易错突破】').replace('重难突破', '【重难突破】').strip())
        m = module_of(no)
        n_questions = 10
        questions = []
        seen = set()
        for i in range(n_questions * 3):
            if len(questions) >= n_questions:
                break
            try:
                item = gen(rng, diff if i < n_questions * 2 else max(1, diff - 1))
            except Exception:
                continue
            if item['stem'] in seen:
                continue
            seen.add(item['stem'])
            # 同类型变式 ×3：用于错题/超时题的专项练习轮
            variants = []
            tries = 0
            while len(variants) < 3 and tries < 12:
                tries += 1
                try:
                    v = gen(rng, diff)
                except Exception:
                    continue
                if v['stem'] in seen:
                    continue
                seen.add(v['stem'])
                variants.append({
                    'stem': v['stem'],
                    'answer': v['answer'],
                    'acceptedAnswers': [a for a in v['accepted'] if a != v['answer']],
                    'estimatedSeconds': v['seconds'],
                    'skill': v.get('skill'),
                    'commonWrong': v.get('commonWrong') or [],
                })
            questions.append({
                'id': f'c{no:02d}-q{len(questions) + 1}',
                'stem': item['stem'],
                'answer': item['answer'],
                'acceptedAnswers': [a for a in item['accepted'] if a != item['answer']],
                'estimatedSeconds': item['seconds'],
                'skill': item.get('skill'),
                'commonWrong': item.get('commonWrong') or [],
                'variants': variants,
            })
        if len(questions) < 6:
            continue
        trainings.append({
            'id': f'c{no:02d}',
            'no': no,
            'title': title,
            'moduleId': m['id'],
            'chapterId': m['chapterId'],
            'difficulty': t.get('stars') or diff,
            'minutes': t.get('minutes') or 15,
            'sourcePage': t.get('bookPage') or 0,
            'questions': questions,
        })

    # 技能题池：供薄弱点定向专练（每技能取最多 12 题，跨训练）
    pools = {}
    for t in trainings:
        for qq in t['questions']:
            sk = qq.get('skill')
            if not sk:
                continue
            for item in [qq] + (qq.get('variants') or []):
                if len(pools.setdefault(sk, [])) >= 12 * 4:
                    continue
                pools[sk].append({
                    'stem': item['stem'],
                    'answer': item['answer'],
                    'acceptedAnswers': item.get('acceptedAnswers') or [],
                    'estimatedSeconds': item.get('estimatedSeconds') or 60,
                    'skill': sk,
                    'commonWrong': item.get('commonWrong') or [],
                })
    for sk in pools:
        pools[sk] = pools[sk][:24]

    data = {
        'modules': MODULES,
        'trainings': trainings,
        'skillNames': SKILL_NAMES,
        'skillPools': pools,
    }
    out_path = os.path.join(ROOT, 'data', 'calc')
    os.makedirs(out_path, exist_ok=True)
    json.dump(data, open(os.path.join(out_path, 'trainings.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    total = sum(len(t['questions']) for t in trainings)
    print(f'生成 {len(trainings)} 个训练 / {total} 题 → data/calc/trainings.json')

if __name__ == '__main__':
    main()
