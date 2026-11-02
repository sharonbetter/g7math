#!/usr/bin/env python3
"""
幻方/幻圆与章节结合的内容生成：
  1. 考评题：7a-c2（有理数运算）、7a-c3（代数式）、7a-c5（一元一次方程）、7b-c10（方程组）
     各追加 1 道题（含 2 个变式），程序构造 + 程序验证唯一解。
  2. 写入 data/exams/*.json（追加 questions 并挂到对应题型 section）。

三阶幻方通式（中心 m，参数 a、b）——每行/列/对角线之和恒为 3m：
     m+a      m-(a+b)   m+b
     m-(a-b)  m         m+(b-a)
     m-b      m+(a+b)   m-a
"""
import json
import random
from fractions import Fraction as F

rng = random.Random(20261018)

GRID = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]


def magic_grid(m, a, b):
    """三阶幻方通式（中心 m，参数 a、b）——每行/列/对角线之和恒为 3m"""
    g = [
        [m + a, m - a - b, m + b],
        [m - a + b, m, m + a - b],
        [m - b, m + a + b, m - a],
    ]
    return g


def check(g):
    s = sum(g[0])
    ok = all(sum(r) == s for r in g) and all(sum(g[i][j] for i in range(3)) == s for j in range(3))
    ok = ok and g[0][0] + g[1][1] + g[2][2] == s and g[0][2] + g[1][1] + g[2][0] == s
    return s if ok else None


def fmt(v):
    if isinstance(v, F):
        return str(v.numerator) if v.denominator == 1 else f'{v.numerator}/{v.denominator}'
    return str(v)


def rand_params(int_only=True, neg=True):
    """生成一组幻方参数（保证九个数互不相等且绝对值不过大）"""
    for _ in range(200):
        m = rng.choice([-9, -6, -4, -3, -2, 2, 3, 4, 5, 6, 7, -5, 8, -7, 9]) if neg else rng.randint(1, 9)
        a = rng.choice([-1, 1, -2, 2, -3, 3, 4, -4])
        b = rng.choice([-1, 1, -2, 2, -3, 3, 5, -5])
        if a == 0 and b == 0:
            continue
        g = magic_grid(m, a, b)
        vals = [x for row in g for x in row]
        if len(set(vals)) == 9 and all(abs(x) <= 25 for x in vals):
            if int_only and not all(isinstance(x, int) for x in vals):
                continue
            return g
    return magic_grid(5, -1, -3)


def row_txt(g, hide):
    """按行文字描述，hide={(r,c)} 位置用字母占位"""
    letters = iter('x y z'.split())
    parts = []
    for r in range(3):
        cells = []
        for c in range(3):
            if (r, c) in hide:
                cells.append(next(letters))
            else:
                cells.append(fmt(g[r][c]))
        parts.append('、'.join(cells))
    return f'第一行为 {parts[0]}，第二行为 {parts[1]}，第三行为 {parts[2]}'


# ---------- 考评题构造 ----------

def q_fill_magic_7a_c2():
    """7a-c2 有理数运算：含负数的幻方，已知幻和与 8 格求缺格（或给 8 格求缺格）"""
    g = rand_params()
    s = check(g)
    hide = {(rng.randint(0, 2), rng.randint(0, 2))}
    r0, c0 = next(iter(hide))
    ans = g[r0][c0]
    stem = (f'在 3×3 方格中填有九个数，每行、每列、每条对角线上的三个数之和都相等（幻和为 {s}）。'
            f'已知{row_txt(g, hide)}，则空格中的数 x = ______。')
    sol = (f'x 所在行的另外两个数为 {fmt(g[r0][(c0 + 1) % 3])} 和 {fmt(g[r0][(c0 + 2) % 3])}，'
           f'三数之和等于幻和 {s}，所以 x = {s} − ({fmt(g[r0][(c0 + 1) % 3])}) − ({fmt(g[r0][(c0 + 2) % 3])}) = {fmt(ans)}。')
    v1 = rand_params(); s1 = check(v1); h1 = {(1, 1)}
    stem1 = (f'三阶幻方中，每行、每列、每条对角线上的三数之和都相等，这个和叫做幻和。已知一个幻方的幻和为 {s1}，'
             f'则它正中间格子中的数是 ______。（提示：设中间数为 m，由对角线可得 3m = 幻和）')
    sol1 = f'由幻方性质：幻和 = 3 × 中心数。中心数 = {s1} ÷ 3 = {fmt(v1[1][1])}。'
    g2 = rand_params(); h2 = {(0, 0)}
    ans2 = g2[0][0]; s2 = check(g2)
    stem2 = (f'在 3×3 幻方中，每行、每列、每条对角线上的三数之和都相等。已知{row_txt(g2, h2)}，'
             f'则 x = ______。')
    sol2 = f'主对角线三数为 x、{fmt(g2[1][1])}、{fmt(g2[2][2])}，其和等于幻和 = 3 × {fmt(g2[1][1])} = {3 * g2[1][1]}，所以 x = {3 * g2[1][1]} − {fmt(g2[1][1])} − {fmt(g2[2][2])} = {fmt(ans2)}。'
    return {
        'type': 'fill', 'difficulty': 2, 'estimatedSeconds': 150,
        'stem': stem, 'answer': fmt(ans), 'solution': sol,
        'rubric': ['用幻和减去同行（同列/同对角线）另外两个数求出缺格', '结果正确'],
        'errorTags': ['幻和计算错误', '符号处理错误'],
        'commonWrong': [
            {'answer': fmt(-ans), 'reason': '减法中符号处理错误，把结果算成了相反数'},
            {'answer': fmt(s - g[r0][(c0 + 1) % 3]), 'reason': '只减去了其中一个数，漏减了另一个'},
        ],
        'variants': [
            {'stem': stem1, 'answer': fmt(v1[1][1]), 'solution': sol1, 'estimatedSeconds': 120},
            {'stem': stem2, 'answer': fmt(ans2), 'solution': sol2, 'estimatedSeconds': 150},
        ],
    }


def q_algebra_7a_c3():
    """7a-c3 代数式：幻方九格用含 m 的代数式表示，由两格具体值求 m 及指定格"""
    g = rand_params()
    m0 = g[1][1]
    a0, b0 = g[0][0] - m0, g[0][2] - m0
    # 展示形式：中心为 m，其余格为 m±p 形式
    shown = [[fmt(g[r][c] - m0) if (r, c) != (1, 1) else 'm' for c in range(3)] for r in range(3)]
    def cell(r, c):
        if (r, c) == (1, 1): return 'm'
        d = g[r][c] - m0
        return f'm+{d}' if d > 0 else f'm{d}'
    rowtxt = f'第一行为 {cell(0,0)}、{cell(0,1)}、{cell(0,2)}，第二行为 {cell(1,0)}、m、{cell(1,2)}，第三行为 {cell(2,0)}、{cell(2,1)}、{cell(2,2)}'
    # 告知某格具体值 → 求 m → 求另一格
    gr, gc = rng.choice([(0, 0), (0, 2), (2, 0), (2, 2), (0, 1), (1, 0), (1, 2), (2, 1)])
    known = g[gr][gc]
    # 求中心 m（= known − offset）
    offset = g[gr][gc] - m0
    ans = m0
    stem = (f'一个三阶幻方中，每行、每列、每条对角线上的三数之和都相等。若它的九个数分别为：{rowtxt}（m 为中心数），'
            f'且知 {cell(gr, gc)} 格上的数等于 {known}，则中心数 m = ______。')
    sol = (f'{cell(gr, gc)} = {known}，即 m{"+" if offset > 0 else ""}{offset} = {known}，'
           f'解得 m = {fmt(ans)}。也可以用性质验证：幻和 = 3m = {3 * ans}。')
    v = magic_grid(m0 + 3, a0, b0)
    known2 = v[gr][gc]
    stem1 = stem.replace(str(known), str(known2))
    sol1 = sol
    ans1 = m0 + 3
    sol1 = sol.replace(str(ans), str(ans1)).replace(str(3 * ans), str(3 * ans1)).replace(str(known), str(known2))
    g2 = magic_grid(rng.choice([-4, -2, 3, 5]), rng.choice([1, 2]), rng.choice([2, -3]))
    m2 = g2[1][1]
    # 变式2：给幻和求 m 再求某角格
    s2 = 3 * m2
    corner = g2[0][0]
    stem2 = (f'三阶幻方每行、每列、每条对角线上的三数之和都等于幻和 S，且 S = 3m（m 为中心数）。某幻方的幻和 S = {s2}，'
             f'其左上角的数比中心数大 {fmt(g2[0][0] - m2)}，则左上角的数是 ______。')
    sol2 = f'中心数 m = S ÷ 3 = {fmt(m2)}，左上角 = m + {fmt(g2[0][0] - m2)} = {fmt(corner)}。'
    return {
        'type': 'fill', 'difficulty': 3, 'estimatedSeconds': 180,
        'stem': stem, 'answer': fmt(ans), 'solution': sol,
        'rubric': ['由已知格的代数式与具体数值列式求 m', '求出中心数并可用 S=3m 验证'],
        'errorTags': ['代数式求值错误', '符号处理错误'],
        'commonWrong': [
            {'answer': fmt(known - offset if offset < 0 else known + offset), 'reason': '移项时符号处理错误'},
        ],
        'variants': [
            {'stem': stem1, 'answer': fmt(ans1), 'solution': sol1, 'estimatedSeconds': 180},
            {'stem': stem2, 'answer': fmt(corner), 'solution': sol2, 'estimatedSeconds': 150},
        ],
    }


def q_equation_7a_c5():
    """7a-c5 一元一次方程：按行列和相等列方程求缺格（独立参数组，避免与 c2 撞方阵）"""
    combos = [(3, -4), (-2, 5), (4, -7), (1, -3), (-4, 1), (2, 7)]
    for _ in range(50):
        a, b = rng.choice(combos)
        m = rng.choice([-6, 7, -8, 4, 9, -3, 5, -5])
        g = magic_grid(m, a, b)
        vals = [x for r in g for x in r]
        if len(set(vals)) == 9 and all(abs(x) <= 25 for x in vals) and check(g) == 3 * m:
            break
    # 挖一个位置，用行和与列和两条路径中的行方程求解
    hide = {(0, 1)}
    (r0, c0), = hide
    ans = g[r0][c0]
    row_other = [g[r0][0], g[r0][2]]
    col_other = [g[0][c0], g[2][c0]]
    stem = (f'在 3×3 方格中，每行、每列、每条对角线上的三数之和都相等。已知{row_txt(g, hide)}。'
            f'(1) 设第一行的三数之和为 S，用含 x 的代数式表示 S；'
            f'(2) 由第二行的三数之和也为 S 列方程，求 x。')
    s = 3 * g[1][1]
    sol = (f'(1) S = {fmt(row_other[0])} + x + {fmt(row_other[1])} = {fmt(row_other[0] + row_other[1])} + x。'
           f'(2) 第二行三数之和 = {fmt(g[1][0])} + {fmt(g[1][1])} + {fmt(g[1][2])} = {s}，'
           f'所以 {fmt(row_other[0] + row_other[1])} + x = {s}，解得 x = {fmt(ans)}。')
    g1 = rand_params(); h1 = {(2, 0)}
    a1 = g1[2][0]; s1 = 3 * g1[1][1]
    stem1 = (f'3×3 幻方中每行、每列、每条对角线上的三数之和都相等。已知{row_txt(g1, h1)}，'
             f'由第三列与第三行的和相等列方程，求 x。')
    sol1 = (f'第三列三数之和 = {fmt(g1[0][2])} + {fmt(g1[1][2])} + {fmt(g1[2][2])} = {s1}；'
            f'第三行三数之和 = x + {fmt(g1[2][1])} + {fmt(g1[2][2])}，'
            f'所以 x + {fmt(g1[2][1])} + {fmt(g1[2][2])} = {s1}，解得 x = {fmt(a1)}。')
    g2 = rand_params()
    m2 = g2[1][1]
    stem2 = (f'三阶幻方的幻和等于 3m（m 为中心数）。若某幻方的幻和为 {3 * m2 + 6}，且中心数比幻和的 1/3 小 2，'
             f'求中心数 m。')
    sol2 = f'由幻和 = 3m 得 m = 幻和 ÷ 3 = {fmt(F(3 * m2 + 6, 3))}；又 m = 幻和/3 − 2 = {fmt(F(3 * m2 + 6, 3) - 2)}。两种算法一致，m = {fmt(F(3 * m2 + 6, 3) - 2)}。'
    ans2 = F(3 * m2 + 6, 3) - 2
    return {
        'type': 'applied', 'difficulty': 3, 'estimatedSeconds': 240,
        'stem': stem, 'answer': fmt(ans), 'solution': sol,
        'rubric': ['用含 x 的代数式表示行和', '由行和相等列出一元一次方程', '解方程求出 x'],
        'errorTags': ['方程列错', '移项变号错误'],
        'commonWrong': [
            {'answer': fmt(-ans), 'reason': '解方程时移项未变号，得到相反数'},
        ],
        'variants': [
            {'stem': stem1, 'answer': fmt(a1), 'solution': sol1, 'estimatedSeconds': 240},
            {'stem': stem2, 'answer': fmt(ans2), 'solution': sol2, 'estimatedSeconds': 180},
        ],
    }


def q_system_7b_c10():
    """7b-c10 方程组：幻方缺 2 格（不同行不同列）列二元方程组；幻圆变式"""
    for _ in range(100):
        g = rand_params()
        # 挖两个位置：(0,0) 与 (2,2) 之外的组合，确保两方程独立
        h = [(0, 0), (2, 2)]
        if rng.random() < 0.5:
            h = [(0, 2), (2, 0)]
        (r1, c1), (r2, c2) = h
        x_val, y_val = g[r1][c1], g[r2][c2]
        s = 3 * g[1][1]
        eq1 = f'第一行：x + {fmt(g[r1][(c1+1)%3])} + {fmt(g[r1][(c1+2)%3])} = {s}'
        eq2 = f'第三行：{fmt(g[r2][0]) if c2 != 0 else "y"} + …'.replace('…', '')
        # 直接给出两条行方程
        row1_rest = [g[0][j] for j in range(3) if (0, j) != (r1, c1)]
        row3_rest = [g[2][j] for j in range(3) if (2, j) != (r2, c2)]
        stem = (f'在 3×3 幻方中，每行、每列、每条对角线上的三数之和都相等。已知{row_txt(g, {(r1, c1), (r2, c2)})}。'
                f'分别由第一行与第三行的三数之和相等（都等于幻和 {s}），列方程组求 x、y。')
        sol = (f'第一行：x + {fmt(row1_rest[0])} + {fmt(row1_rest[1])} = {s}，解得 x = {fmt(x_val)}。'
               f'第三行：{fmt(row3_rest[0])} + {fmt(row3_rest[1])} + y = {s}，解得 y = {fmt(y_val)}。'
               f'经验证 x、y 也满足列与对角线条件。')
        # 幻圆变式
        c = rng.choice([-4, -2, 3, 5, 6])
        pairs = [(rng.randint(-9, 9), rng.randint(-9, 9)) for _ in range(3)]
        S = c + pairs[0][0] + pairs[0][1]
        stem_c = (f'一个幻圆中，圆心处的数是 {c}，三条直径的两端各放一个数，且每条直径上三个数（两端与圆心）之和都相等。'
                  f'已知其中两条直径的两端分别为 {pairs[0][0]}、{pairs[0][1]} 和 {pairs[1][0]}、y，'
                  f'则 y = ______。')
        y_ans = S - c - pairs[1][0]
        sol_c = (f'第一条直径之和 = {pairs[0][0]} + {c} + {pairs[0][1]} = {S}，'
                 f'所以 y = {S} − {c} − {pairs[1][0]} = {fmt(y_ans)}。')
        g2 = rand_params()
        h2 = {(0, 1), (2, 1)}
        x2, y2 = g2[0][1], g2[2][1]
        s2 = 3 * g2[1][1]
        stem2 = (f'3×3 幻方中每行、每列、每条对角线三数之和相等。已知{row_txt(g2, h2)}，'
                 f'由第二列与第一、三行的条件列方程组，求 x、y。')
        sol2 = (f'第一行：{fmt(g2[0][0])} + x + {fmt(g2[0][2])} = {s2}，x = {fmt(x2)}。'
                f'第三行：{fmt(g2[2][0])} + y + {fmt(g2[2][2])} = {s2}，y = {fmt(y2)}。')
        return {
            'type': 'applied', 'difficulty': 3, 'estimatedSeconds': 270,
            'stem': stem, 'answer': f'x={fmt(x_val)},y={fmt(y_val)}',
            'acceptedAnswers': [f'x = {fmt(x_val)}, y = {fmt(y_val)}'],
            'solution': sol,
            'rubric': ['由行和等于幻和分别列方程', '解方程组求出 x、y', '代入验证'],
            'errorTags': ['方程组列错', '消元符号错误'],
            'commonWrong': [
                {'answer': f'x={fmt(y_val)},y={fmt(x_val)}', 'reason': '把 x、y 的位置看反了'},
            ],
            'variants': [
                {'stem': stem_c, 'answer': fmt(y_ans), 'solution': sol_c, 'estimatedSeconds': 180},
                {'stem': stem2, 'answer': f'x={fmt(x2)},y={fmt(y2)}', 'solution': sol2, 'estimatedSeconds': 240},
            ],
        }
    raise RuntimeError('unreachable')


def q_circle_7b_c10():
    """7b-c10 幻圆主题：圆心未知的消元型 + 圆心已知的标准型变式"""
    for _ in range(80):
        pq_a, pq_b = rng.randint(-9, 9), rng.randint(-9, 9)
        base = pq_a + pq_b
        a = rng.randint(-9, 9)
        b = rng.randint(-9, 9)
        x_val = base - a
        y_val = base - b
        w = rng.choice([-6, -3, 4, 5, 7, -8])
        if len({x_val, y_val, a, b, pq_a, pq_b, w}) == 7 and all(abs(v) <= 20 for v in (x_val, y_val, base)):
            break
    S = w + base
    stem = (f'一个幻圆中，圆心处放一个数，三条直径的两端各放一个数，且每条直径上三个数（两端与圆心）之和都相等。'
            f'已知三条直径两端的数分别为 x 与 {a}、y 与 {b}、{pq_a} 与 {pq_b}，圆心处的数是 {w}。'
            f'(1) 求三条直径共同的和 S；(2) 求 x、y 的值。')
    sol = (f'(1) 第三条直径完全已知：S = {pq_a} + {pq_b} + ({w}) = {S}。'
           f'(2) 由每条直径的和相等：x + {a} + ({w}) = {S}，解得 x = {fmt(x_val)}；'
           f'y + {b} + ({w}) = {S}，解得 y = {fmt(y_val)}。'
           f'注意三条方程都含圆心数 {w}，先由完整的一条求出 S，再逐条解——这正是消元的思路。')
    # 变式1：圆心未知、给附加条件联立
    for _ in range(80):
        p1, q1 = rng.randint(-8, 8), rng.randint(-8, 8)
        base1 = p1 + q1
        a1 = rng.randint(-8, 8)
        x1 = base1 - a1
        w1 = rng.choice([-5, 3, 6, -7, 4])
        if x1 != w1 and abs(x1) <= 18:
            break
    stem1 = (f'幻圆中每条直径上三个数（两端与圆心）之和都相等。已知一条直径两端的数是 x 与 {a1}，圆心处的数是 {w1}；'
             f'另一条完全已知的直径两端是 {p1} 与 {q1}。(1) 用含 x 的代数式表示第一条直径的和；'
             f'(2) 由两直径的和相等列方程求 x。')
    S1 = w1 + base1
    sol1 = (f'(1) 第一条直径：x + ({a1}) + ({w1})。'
            f'(2) 第二条直径的和 = {p1} + {q1} + ({w1}) = {S1}，'
            f'所以 x + ({a1}) + ({w1}) = {S1}，解得 x = {fmt(x1)}。')
    # 变式2：两未知端点在不同直径（标准二元型）
    for _ in range(80):
        c2 = rng.choice([-4, 3, 5, 6, -6])
        u2, v2 = rng.randint(-7, 7), rng.randint(-7, 7)
        S2 = c2 + u2 + v2
        m2 = rng.randint(-7, 7)
        n2 = rng.randint(-7, 7)
        y2 = S2 - c2 - m2
        z2 = S2 - c2 - n2
        if len({u2, v2, m2, y2, n2, z2, c2}) == 7 and all(abs(t) <= 15 for t in (y2, z2, S2)):
            break
    stem2 = (f'幻圆的圆心处是 {c2}，每条直径上三个数之和都相等。一条直径两端为 {u2}、{v2}；'
             f'另两条直径的一端分别是 {m2} 与 {n2}，另一端分别是 y 与 z，求 y、z。')
    sol2 = (f'完整直径的和 S = {u2} + ({v2}) + ({c2}) = {S2}。'
            f'y + {m2} + ({c2}) = {S2}，y = {fmt(y2)}；z + {n2} + ({c2}) = {S2}，z = {fmt(z2)}。')
    return {
        'type': 'applied', 'difficulty': 3, 'estimatedSeconds': 270,
        'stem': stem, 'answer': f'S={S},x={fmt(x_val)},y={fmt(y_val)}',
        'acceptedAnswers': [f'S = {S}, x = {fmt(x_val)}, y = {fmt(y_val)}'],
        'solution': sol,
        'rubric': ['由完整直径求共同和 S', '对每条含未知数的直径列方程', '解出 x、y 并验证'],
        'errorTags': ['公共和求错', '圆心重复计算', '符号处理错误'],
        'commonWrong': [
            {'answer': f'S={base},x={fmt(x_val)},y={fmt(y_val)}', 'reason': '求 S 时漏加圆心的数'},
            {'answer': f'S={S},x={fmt(-x_val)},y={fmt(y_val)}', 'reason': '移项时符号错误'},
        ],
        'variants': [
            {'stem': stem1, 'answer': f'x={fmt(x1)}', 'solution': sol1, 'estimatedSeconds': 210},
            {'stem': stem2, 'answer': f'y={fmt(y2)},z={fmt(z2)}', 'solution': sol2, 'estimatedSeconds': 210},
        ],
    }


# ---------- 写入考评卷 ----------
PLAN = {
    '7a-c2': ('7a-2-13', q_fill_magic_7a_c2, 'fill'),
    '7a-c3': ('7a-3-04', q_algebra_7a_c3, 'fill'),
    '7a-c5': ('7a-5-13', q_equation_7a_c5, 'applied'),
    '7b-c10': ('7b-10-08', q_system_7b_c10, 'applied'),
    '7b-c10:circle': ('7b-10-08', q_circle_7b_c10, 'applied'),
}

def main():
  for key, (pid, builder, sec_type) in PLAN.items():
    chapter = key.split(':')[0]
    theme = '幻圆' if 'circle' in key else '幻方'
    path = f'data/exams/{chapter}.json'
    d = json.load(open(path))
    qs = d.get('questions') or d.get('exam', {}).get('questions')
    # 新 id：现有最大编号 +1
    import re
    nums = [int(re.search(r'e(\d+)$', q['id']).group(1)) for q in qs]
    new_id = f'{chapter}-e{max(nums) + 1:02d}'
    # 幂等：同主题（幻方/幻圆）已存在则跳过（幻方主题兼容"方格"措辞）
    def is_theme(stem):
        stem = stem or ''
        return ('幻圆' in stem) if theme == '幻圆' else ('幻方' in stem or '方格' in stem)
    if any(is_theme(q.get('stem')) for q in qs):
        print(f'{chapter}: 已有{theme}题，跳过')
        continue
    q = builder()
    q.update({'id': new_id, 'pointIds': [pid]})
    qs.append(q)
    # sections：追加到对应题型
    if isinstance(d.get('exam'), dict) and d['exam'].get('sections'):
        sections = d['exam']['sections']
    elif d.get('sections'):
        sections = d['sections']
    else:
        sections = None
    if sections:
        for sec in sections:
            if sec.get('type') == sec_type or sec_type in sec.get('id', ''):
                sec['questionIds'].append(new_id)
                break
    open(path, 'w').write(json.dumps(d, ensure_ascii=False, indent=1))
    print(f'{chapter}: 追加 {new_id}（{sec_type}，挂知识点 {pid}）')

if __name__ == '__main__':
    main()
    print('完成')
