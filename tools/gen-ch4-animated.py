#!/usr/bin/env python3
"""第四章（整式的加减）6 个知识点动画课件：概念场景手工设计，例题/脑图/易错自动装配。"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import animated_common as C

C.LESSON = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'lessons', '7a-c4.json'), encoding='utf-8'))
def s(pid):
    return [l for l in C.LESSON['lessons'] if l['pointId'] == pid][0]

C.SPECS = []

# ============ 7a-4-01 单项式及其系数与次数 ============
C.SPECS.append({'pid': '7a-4-01', 'mind': [('什么是单项式', '数与字母的乘积；单独的数/字母也算'),
    ('系数', '数字因数（含符号、含 π）'),
    ('次数', '所有字母的指数之和'),
    ('两个特例', 'x 系数 1；−x 系数 −1')],
 'concepts': [
  {'title': '📦 数与字母打个包', 'sub': '单项式：只有乘法的式子', 'html': '''
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:6px">
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:2rem;font-weight:900;color:#34d399">−5x²</div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:6px">−5 与 x² 的积</div>
  </div>
  <div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.4);text-align:center;animation:pop-in .5s .8s both">
    <div style="font-size:2rem;font-weight:900;color:#a5b4fc">3ab</div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:6px">3·a·b，全是乘法</div>
  </div>
  <div class="card" style="background:rgba(245,158,11,.1);border:2px solid rgba(245,158,11,.4);text-align:center;animation:pop-in .5s 1.3s both">
    <div style="font-size:2rem;font-weight:900;color:#fcd34d">πr²</div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:6px">π 是数，照样是乘积</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:16px;text-align:center;animation:slide-up .6s 2s both">
  <span style="font-size:1.05rem">数与字母的<b class="hgold">乘积</b>组成的式子叫<b class="hgold">单项式</b>；单独一个数或字母（如 5、x）也是。</span>
</div>''',
   'narr': '先看几个式子：负 5x 方、3ab、派 r 方——它们有个共同点：数和字母之间只有乘法。这样的式子叫单项式。注意两个容易漏的：单独一个数 5、单独一个字母 x，也算单项式。而派 r 方里的派是数，所以它也是干干净净的单项式。'},
  {'title': '🏷️ 拆开看：系数与次数', 'sub': '−5x²y³ 的两件外套', 'html': '''
<div style="display:flex;justify-content:center;margin-top:14px;animation:pop-in .5s .3s both">
  <div style="font-size:3.2rem;font-weight:900">
    <span style="color:#fbbf24">−5</span><span style="color:#a5b4fc">x²</span><span style="color:#34d399">y³</span>
  </div>
</div>
<div style="display:flex;gap:18px;justify-content:center;margin-top:20px">
  <div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);text-align:center;animation:slide-up .6s 1.1s both">
    <b class="hgold">系数 = 数字因数</b>
    <div style="font-size:1.6rem;font-weight:900;color:#fbbf24;margin-top:6px">−5</div>
    <div style="font-size:.85rem;color:#94a3b8">带上符号；πr² 的系数是 π</div>
  </div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);text-align:center;animation:slide-up .6s 1.7s both">
    <b class="hg">次数 = 字母指数之和</b>
    <div style="font-size:1.6rem;font-weight:900;color:#34d399;margin-top:6px">2 + 3 = 5</div>
    <div style="font-size:.85rem;color:#94a3b8">x²y³ 是五次单项式</div>
  </div>
</div>''',
   'narr': '把负 5x 方 y 三次拆开看，它有两件外套。黄外套是系数：数字因数负 5，符号要带上；派 r 方的系数是派，因为派本身是数。绿外套是次数：所有字母的指数加起来，x 方 y 三次就是 2 加 3 等于 5，五次单项式。系数管数字，次数管字母，各穿各的。'},
  {'title': '🧮 现场练：报系数和次数', 'sub': '三个快问快答', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.35);display:flex;align-items:center;justify-content:space-between;animation:slide-up .5s .3s both">
    <span style="font-size:1.5rem;font-weight:900">x</span>
    <span style="font-size:1rem;color:#c7d2fe;animation:fade-in .5s 1.1s both">系数 <b class="hgold">1</b>（省略不写）· 次数 <b class="hg">1</b></span>
  </div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.35);display:flex;align-items:center;justify-content:space-between;animation:slide-up .5s 1s both">
    <span style="font-size:1.5rem;font-weight:900">−x</span>
    <span style="font-size:1rem;color:#fecdd3;animation:fade-in .5s 1.8s both">系数 <b class="hr">−1</b> · 次数 <b class="hg">1</b></span>
  </div>
  <div class="card" style="background:rgba(245,158,11,.08);border:2px solid rgba(245,158,11,.35);display:flex;align-items:center;justify-content:space-between;animation:slide-up .5s 1.7s both">
    <span style="font-size:1.5rem;font-weight:900">2²ab</span>
    <span style="font-size:1rem;color:#fde68a;animation:fade-in .5s 2.5s both">系数 <b class="hgold">4</b> · 次数 <b class="hg">2</b>（只有字母的指数算次数）</span>
  </div>
</div>''',
   'narr': '快问快答。x——系数是 1，只是省略不写，次数 1。负 x——系数负 1，别把负号丢了。2 的平方 ab，有人喊四次，错！系数是 2 的平方等于 4，次数只数字母：a 一次 b 一次，共两次。记住：次数只看字母的指数，跟系数里的数字无关。'}],
})

# ============ 7a-4-02 多项式及其项与次数 ============
C.SPECS.append({'pid': '7a-4-02', 'mind': [('什么是多项式', '几个单项式的和'),
    ('项', '每个单项式（含常数项）'),
    ('次数', '最高次项的次数'),
    ('命名', '几次几项式')],
 'concepts': [
  {'title': '🧩 单项式搭积木', 'sub': '多项式 = 单项式相加', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:24px">
  <div style="text-align:center;animation:pop-in .4s .3s both">
    <div style="padding:14px 20px;border-radius:14px;background:rgba(99,102,241,.15);border:2px solid #818cf8;font-size:1.6rem;font-weight:900;color:#a5b4fc">x²</div>
    <div style="font-size:.8rem;color:#94a3b8;margin-top:6px">二次项</div>
  </div>
  <div style="font-size:1.6rem;font-weight:900;animation:pop-in .4s .8s both">+</div>
  <div style="text-align:center;animation:pop-in .4s 1.1s both">
    <div style="padding:14px 20px;border-radius:14px;background:rgba(52,211,153,.15);border:2px solid #34d399;font-size:1.6rem;font-weight:900;color:#34d399">3x</div>
    <div style="font-size:.8rem;color:#94a3b8;margin-top:6px">一次项</div>
  </div>
  <div style="font-size:1.6rem;font-weight:900;animation:pop-in .4s 1.6s both">−</div>
  <div style="text-align:center;animation:pop-in .4s 1.9s both">
    <div style="padding:14px 20px;border-radius:14px;background:rgba(245,158,11,.15);border:2px solid #fbbf24;font-size:1.6rem;font-weight:900;color:#fcd34d">5</div>
    <div style="font-size:.8rem;color:#94a3b8;margin-top:6px">常数项</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:20px;text-align:center;animation:slide-up .6s 2.5s both">
  <span style="font-size:1.05rem">几个单项式的<b class="hgold">和</b>叫<b class="hgold">多项式</b>，每个单项式是它的一项，不含字母的是<b class="hgold">常数项</b>。</span>
</div>''',
   'narr': '多项式就是积木：把几个单项式加起来。x 方加 3x 减 5，三块积木——x 方是二次项，3x 是一次项，负 5 不含字母，叫常数项。多项式的定义就一句话：几个单项式的和。'},
  {'title': '📐 谁最高，谁定次数', 'sub': '多项式的次数 = 最高次项的次数', 'html': '''
<div style="display:flex;align-items:flex-end;justify-content:center;gap:44px;margin-top:16px;height:210px">
  <div style="text-align:center">
    <div style="width:90px;height:150px;border-radius:12px 12px 0 0;background:linear-gradient(180deg,rgba(99,102,241,.7),rgba(99,102,241,.2));border:2px solid #818cf8;animation:slide-up .6s .4s both;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:900;color:#c7d2fe">x²</div>
    <div style="font-size:.9rem;color:#94a3b8;margin-top:8px">2 次（最高）</div>
  </div>
  <div style="text-align:center">
    <div style="width:90px;height:80px;border-radius:12px 12px 0 0;background:linear-gradient(180deg,rgba(52,211,153,.6),rgba(52,211,153,.15));border:2px solid #34d399;animation:slide-up .6s 1s both;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:900;color:#a7f3d0">3x</div>
    <div style="font-size:.9rem;color:#94a3b8;margin-top:8px">1 次</div>
  </div>
  <div style="text-align:center">
    <div style="width:90px;height:44px;border-radius:12px 12px 0 0;background:linear-gradient(180deg,rgba(245,158,11,.5),rgba(245,158,11,.12));border:2px solid #fbbf24;animation:slide-up .6s 1.6s both;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:900;color:#fde68a">−5</div>
    <div style="font-size:.9rem;color:#94a3b8;margin-top:8px">0 次</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:14px;text-align:center;animation:slide-up .6s 2.2s both">
  <span style="font-size:1.05rem">最高的柱子说了算：x² + 3x − 5 是<b class="hgold">二次三项式</b>（次数 2 · 共 3 项）</span>
</div>''',
   'narr': '多项式的次数怎么定？画成柱子一看就懂：x 方两次，最高；3x 一次；负 5 零次。最高的柱子说了算——所以这个多项式是二次的，一共三项，合起来叫二次三项式。命名规则：几次，看最高项；几项，数积木块。'},
  {'title': '⚡ 升降排列（选读）', 'sub': '把项排个队更清爽', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);text-align:center;animation:slide-up .5s .3s both">
    <span style="font-size:.9rem;color:#94a3b8">按 x 的次数从高到低（降幂）</span>
    <div style="font-size:1.5rem;font-weight:900;margin-top:6px">3x³ − x² + 5x − 7</div>
  </div>
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);text-align:center;animation:slide-up .5s 1s both">
    <span style="font-size:.9rem;color:#94a3b8">从低到高（升幂）</span>
    <div style="font-size:1.5rem;font-weight:900;margin-top:6px">−7 + 5x − x² + 3x³</div>
  </div>
</div>''',
   'narr': '顺手学个小习惯：把多项式的项按次数排队。从高到低叫降幂，3x 三次减 x 方加 5x 减 7；从低到高叫升幂。排队之后式子更清爽、错看更少，考试写答案也显得专业。'}],
})

# ============ 7a-4-03 整式的概念 ============
C.SPECS.append({'pid': '7a-4-03', 'mind': [('整式家族', '单项式 + 多项式'),
    ('门禁一', '分母里不许有字母'),
    ('π 是数', '含 π 仍是整式'),
    ('判断顺序', '先看分母，再看运算')],
 'concepts': [
  {'title': '🗂️ 整式家族图谱', 'sub': '一棵两枝的大树', 'html': '''
<div style="display:flex;justify-content:center;margin-top:10px">
  <svg width="700" height="270" viewBox="0 0 700 270">
    <rect x="270" y="16" width="160" height="52" rx="26" fill="#6366f1" style="animation:pop-in .5s .2s both"/>
    <text x="350" y="49" text-anchor="middle" fill="#fff" font-size="20" font-weight="800" style="animation:pop-in .5s .2s both">整 式</text>
    <path d="M310 68 C300 100, 180 100, 170 130" fill="none" stroke="#34d399" stroke-width="2.5" opacity=".6" style="opacity:0;animation:mindmap-line .8s .7s forwards"/>
    <path d="M390 68 C400 100, 520 100, 530 130" fill="none" stroke="#fbbf24" stroke-width="2.5" opacity=".6" style="opacity:0;animation:mindmap-line .8s 1s forwards"/>
    <rect x="90" y="132" width="160" height="46" rx="14" fill="rgba(52,211,153,.15)" stroke="#34d399" stroke-width="2" style="animation:mm-left .5s 1.2s both"/>
    <text x="170" y="161" text-anchor="middle" fill="#34d399" font-size="17" font-weight="800" style="animation:mm-left .5s 1.2s both">单项式</text>
    <text x="170" y="204" text-anchor="middle" fill="#94a3b8" font-size="13" style="animation:mm-left .5s 1.4s both">−5x²、3ab、πr²、5、x</text>
    <rect x="450" y="132" width="160" height="46" rx="14" fill="rgba(251,191,36,.12)" stroke="#fbbf24" stroke-width="2" style="animation:mm-left .5s 1.5s both"/>
    <text x="530" y="161" text-anchor="middle" fill="#fbbf24" font-size="17" font-weight="800" style="animation:mm-left .5s 1.5s both">多项式</text>
    <text x="530" y="204" text-anchor="middle" fill="#94a3b8" font-size="13" style="animation:mm-left .5s 1.7s both">x²+3x−5、a−b</text>
    <text x="350" y="248" text-anchor="middle" fill="#fb7185" font-size="14" font-weight="700" style="animation:fade-in .6s 2.2s both">❌ 分母含字母的（如 1/x）不属于这个家族</text>
  </svg>
</div>''',
   'narr': '把这两天学的拼成一张家族图谱：整式这棵大树有两根枝——单项式一枝，负 5x 方、3ab、派 r 方，还有单独的数和字母；多项式一枝，x 方加 3x 减 5、a 减 b。但有个铁门槛：分母里含字母的，比如 x 分之一，不属于这个家族。'},
  {'title': '🚪 门禁检查', 'sub': '过一遍安检', 'html': '''
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);display:flex;justify-content:space-between;align-items:center;animation:slide-up .5s .3s both"><span style="font-size:1.3rem;font-weight:800">x + 1</span><b class="hg">✓ 多项式</b></div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);display:flex;justify-content:space-between;align-items:center;animation:slide-up .5s .8s both"><span style="font-size:1.3rem;font-weight:800">π/2 · x</span><b class="hg">✓ 单项式</b></div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);display:flex;justify-content:space-between;align-items:center;animation:slide-up .5s 1.3s both"><span style="font-size:1.3rem;font-weight:800">2/x</span><b class="hr">✗ 分母有字母</b></div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);display:flex;justify-content:space-between;align-items:center;animation:slide-up .5s 1.8s both"><span style="font-size:1.3rem;font-weight:800">x/2</span><b class="hg">✓ 分母是数 2</b></div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:14px;text-align:center;animation:slide-up .6s 2.3s both">
  <span style="font-size:1rem">火眼金睛：<b class="hgold">π 是数不是字母</b>；x/2 分母是 2（数），2/x 分母是 x（字母）——差一个位置，天壤之别。</span>
</div>''',
   'narr': '来过一遍门禁。x 加 1，多项式，通过。二分之派 x——派是数不是字母，系数二分之派，单项式，通过。x 分之二，分母是数 2，通过。但 2 除以 x，分母是字母，红灯请回。最坑的就是最后这对：x 分之二和 2 除以 x，就差一个位置，一个进门一个出局。'}],
})

# ============ 7a-4-04 同类项与合并同类项 ============
C.SPECS.append({'pid': '7a-4-04', 'mind': [('两同', '字母相同、指数相同'),
    ('两无关', '与系数无关、与字母顺序无关'),
    ('合并法则', '系数相加，字母部分不变'),
    ('不是同类不能合', '3a+2b、3x+2x² 都不行')],
 'concepts': [
  {'title': '🧲 什么算"同类"', 'sub': '两同两无关', 'html': '''
<div style="display:flex;gap:16px;justify-content:center;margin-top:10px">
  <div style="text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:1.9rem;font-weight:900;color:#34d399">3x²y　与　−x²y</div>
    <div style="margin-top:8px;padding:6px 22px;border-radius:999px;background:rgba(52,211,153,.15);border:2px solid #34d399;color:#34d399;font-weight:800;animation:pop-in .5s 1s both">✓ 同类项</div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:6px">字母相同 x²y · 指数相同 2 和 1</div>
  </div>
</div>
<div style="display:flex;gap:16px;justify-content:center;margin-top:18px">
  <div style="text-align:center;animation:pop-in .5s 1.6s both">
    <div style="font-size:1.7rem;font-weight:900;color:#fb7185">3xy² ✗</div>
    <div style="font-size:.8rem;color:#94a3b8">指数换了位置（2 在 y 上）</div>
  </div>
  <div style="text-align:center;animation:pop-in .5s 2s both">
    <div style="font-size:1.7rem;font-weight:900;color:#34d399">3ab 与 2ba ✓</div>
    <div style="font-size:.8rem;color:#94a3b8">顺序不同没关系</div>
  </div>
</div>''',
   'narr': '同类项的判定口诀：两同两无关。两同——字母相同、相同字母的指数也相同：3x 方 y 和负 x 方 y，字母都是 x 方 y，同类。两无关——跟系数无关，跟字母顺序无关：3ab 和 2ba 是同类。但 3x y 方，指数挪了位置，就不是同类了。'},
  {'title': '➕ 怎么合并', 'sub': '系数相加，字母原样抄', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-top:22px">
  <div style="padding:16px 22px;border-radius:14px;background:rgba(52,211,153,.12);border:2px solid #34d399;font-size:2rem;font-weight:900;color:#6ee7b7;animation:pop-in .5s .3s both">3x²y</div>
  <div style="font-size:2rem;font-weight:900">+</div>
  <div style="padding:16px 22px;border-radius:14px;background:rgba(99,102,241,.12);border:2px solid #818cf8;font-size:2rem;font-weight:900;color:#a5b4fc;animation:pop-in .5s .8s both">5x²y</div>
  <div style="font-size:2rem;font-weight:900">=</div>
  <div style="padding:16px 26px;border-radius:14px;background:rgba(251,191,36,.15);border:3px solid #fbbf24;font-size:2.1rem;font-weight:900;color:#fbbf24;animation:pop-in .6s 1.6s both">8x²y</div>
</div>
<div style="display:flex;gap:14px;justify-content:center;margin-top:20px">
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);animation:slide-up .5s 2.2s both"><span class="hg">系数</span>：3 + 5 = 8</div>
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);animation:slide-up .5s 2.6s both"><span style="color:#a5b4fc;font-weight:800">字母部分</span>：x²y 原样抄</div>
</div>''',
   'narr': '合并的法则一句话：系数相加，字母部分原样抄。3x 方 y 加 5x 方 y，3 加 5 得 8，x 方 y 照抄，等于 8x 方 y。就像三个苹果加五个苹果等于八个苹果——数的是个数，苹果还是那个苹果。'},
  {'title': '🚫 不能硬合的', 'sub': '苹果别和橘子合并', 'html': '''
<div style="display:flex;gap:16px;justify-content:center;margin-top:14px">
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:1.7rem;font-weight:900">3a + 2b</div>
    <div style="font-size:.9rem;color:#fecdd3;margin-top:8px">🍎 + 🍊 = 没法合<br/>字母不同，各管各的</div>
  </div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);text-align:center;animation:pop-in .5s 1s both">
    <div style="font-size:1.7rem;font-weight:900">3x + 2x²</div>
    <div style="font-size:.9rem;color:#fecdd3;margin-top:8px">x 和 x² 不是同类<br/>指数不同，合并无效</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:16px;text-align:center;animation:slide-up .6s 1.7s both">
  <span style="font-size:1rem">先把同类项<b class="hgold">标记</b>（下划线/圈出），再分组合并——顺序对了就不乱</span>
</div>''',
   'narr': '两种情况不能硬合：3a 加 2b，字母不同，苹果加橘子，没门；3x 加 2x 方，字母一样但指数不同，也不是同类。合并前的小技巧：先把同类项做标记，圈出来或画下划线，再分组动手，顺序对了就不会漏。'}],
})

# ============ 7a-4-05 去括号法则 ============
C.SPECS.append({'pid': '7a-4-05', 'mind': [('括号前是 +', '去括号，各项照抄'),
    ('括号前是 −', '去掉括号，每项都变号'),
    ('括号前有系数', '用分配律，每项都乘到'),
    ('易漏点', '负号要发给每一项')],
 'concepts': [
  {'title': '➖ 减号是张火车票', 'sub': '发给括号里的每一位', 'html': '''
<div style="display:flex;justify-content:center;margin-top:16px">
  <div style="font-size:2.6rem;font-weight:900;animation:pop-in .5s .3s both">a <span class="hr">−</span> ( <span class="hg">b</span> <span class="hr">−</span> <span class="hg">c</span> )</div>
</div>
<div style="display:flex;justify-content:center;margin-top:22px;gap:14px">
  <div style="padding:12px 26px;border-radius:14px;background:rgba(52,211,153,.12);border:2px solid #34d399;font-size:1.7rem;font-weight:900;color:#6ee7b7;animation:pop-in .5s 1.2s both">a − b + c</div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:20px;text-align:center;animation:slide-up .6s 2s both">
  <span style="font-size:1.05rem">负号像火车票，<b class="hgold">括号里每一项都得拿到</b>：b 变 −b，−c 变 +c<br/>而括号前是"＋"时，直接拆开照抄：a + (b − c) = a + b − c</span>
</div>''',
   'narr': '去括号最容易翻车的地方：括号前是减号。把减号想成一张火车票，括号里每一项都必须拿到票才能下车——b 拿到负号变成负 b，负 c 拿到负号翻转成正 c。所以 a 减括号 b 减 c，等于 a 减 b 加 c。要是括号前是加号，没票也行，直接拆开照抄。'},
  {'title': '🔑 括号前站着系数', 'sub': '分配律每项都乘', 'html': '''
<div style="display:flex;flex-direction:column;gap:14px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);text-align:center;animation:slide-up .5s .3s both;min-width:420px">
    <div style="font-size:1.9rem;font-weight:900">−2 ( x − 3 )</div>
  </div>
  <div style="font-size:1.6rem;animation:fade-in .5s 1s both">↓ 每一项都要乘 −2</div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);text-align:center;animation:slide-up .5s 1.5s both;min-width:420px">
    <div style="font-size:1.6rem;font-weight:900;line-height:1.9">= <span class="hr">−2x</span> + <span class="hg">6</span></div>
    <div style="font-size:.85rem;color:#94a3b8">−2·x = −2x　　−2·(−3) = +6</div>
  </div>
</div>''',
   'narr': '括号前站着系数怎么办？分配律伺候，每一项都乘到。负 2 乘括号 x 减 3：负 2 乘 x 是负 2x，负 2 乘负 3 是正 6，所以等于负 2x 加 6。最容易漏的是第二项——乘号要发到每一个人手里，不能只乘第一项就收工。'},
  {'title': '🪜 台阶演练', 'sub': '两层括号也不怕', 'html': '''
<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);animation:slide-up .5s .3s both;min-width:460px;text-align:center">
    <span style="font-size:1.4rem;font-weight:800">3m − 2( m − n )</span>
  </div>
  <div style="font-size:1.3rem;animation:fade-in .4s .9s both">↓ 先去括号</div>
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);animation:slide-up .5s 1.3s both;min-width:460px;text-align:center">
    <span style="font-size:1.4rem;font-weight:800">= 3m − 2m + 2n</span>
  </div>
  <div style="font-size:1.3rem;animation:fade-in .4s 1.8s both">↓ 再合并同类项</div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);animation:slide-up .5s 2.2s both;min-width:460px;text-align:center">
    <span style="font-size:1.5rem;font-weight:900;color:#34d399">= m + 2n</span>
  </div>
</div>''',
   'narr': '串成完整台阶：3m 减 2 倍的括号 m 减 n。第一步去括号，负 2 发票，m 变负 2m，负 n 变正 2n，得 3m 减 2m 加 2n。第二步合并同类项，3m 减 2m 得 m，结果 m 加 2n。去括号、合并，这两板斧接下来整章都用。'}],
})

# ============ 7a-4-06 整式的加减与化简求值 ============
C.SPECS.append({'pid': '7a-4-06', 'mind': [('三步流程', '去括号 → 合并 → 代入'),
    ('先化简再求值', '式子变短，计算减半'),
    ('代入记得加括号', '负数、分数穿外套'),
    ('化简完自查', '括号净？同类合完？')],
 'concepts': [
  {'title': '🍜 三步流水线', 'sub': '整式加减的完整流程', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px">
  <div style="text-align:center;animation:pop-in .5s .3s both">
    <div style="width:150px;padding:16px 0;border-radius:14px;background:rgba(244,63,94,.12);border:2px solid #fb7185;font-size:1.15rem;font-weight:800;color:#fda4af">① 去括号</div>
  </div>
  <div style="font-size:1.6rem;animation:fade-in .4s 1s both">→</div>
  <div style="text-align:center;animation:pop-in .5s 1.3s both">
    <div style="width:170px;padding:16px 0;border-radius:14px;background:rgba(251,191,36,.12);border:2px solid #fbbf24;font-size:1.15rem;font-weight:800;color:#fcd34d">② 合并同类项</div>
  </div>
  <div style="font-size:1.6rem;animation:fade-in .4s 2s both">→</div>
  <div style="text-align:center;animation:pop-in .5s 2.3s both">
    <div style="width:150px;padding:16px 0;border-radius:14px;background:rgba(52,211,153,.12);border:2px solid #34d399;font-size:1.15rem;font-weight:800;color:#6ee7b7">③ 代入求值</div>
  </div>
</div>
<div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);margin-top:20px;text-align:center;animation:slide-up .6s 2.9s both">
  <span style="font-size:1rem;color:#c7d2fe">整式的加减，本质就是这两板斧：<b class="hgold">去括号 + 合并同类项</b></span>
</div>''',
   'narr': '整式加减的全部秘密就一条流水线：第一步去括号，第二步合并同类项，第三步——如果要求值——把数代入。前面学的两板斧在这里合体。记住这个顺序，什么题都这么走。'},
  {'title': '⚡ 先化简的威力', 'sub': '能变短就别硬算', 'html': '''
<div style="display:flex;gap:16px;margin-top:6px">
  <div class="card" style="flex:1;background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);animation:slide-up .5s .3s both">
    <b class="hr">硬算（不化简）</b>
    <div style="font-size:.92rem;color:#fecdd3;margin-top:8px;line-height:1.9">求 2(x²+x) − (x²+x)，x=17：<br/>先把 17 代进两个括号各算一遍，再相减——算了两遍大数乘法，又慢又容易错</div>
  </div>
  <div class="card" style="flex:1;background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);animation:slide-up .5s 1s both">
    <b class="hg">先化简</b>
    <div style="font-size:1.05rem;font-weight:800;margin-top:8px;line-height:1.9">2(x²+x) − (x²+x) = x² + x</div>
    <div style="font-size:.92rem;color:#a7f3d0">代入 x=17：17² + 17 = 306<br/>式子变短，只算一遍</div>
  </div>
</div>''',
   'narr': '为什么强调先化简再求值？看对比。求 2 倍的 x 方加 x，减去 x 方加 x，当 x 等于 17：硬算的话，17 要进两个括号各算一遍，两遍大数乘法。先化简：2 倍的一块减一块，剩一块，x 方加 x，代入 17，17 的平方加 17 等于 306，只算一遍。式子越短，错的机会越少。'},
  {'title': '✅ 交卷前三连查', 'sub': '化简求值检查清单', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);animation:slide-up .5s .3s both">
    <b style="color:#a5b4fc">① 括号去干净了吗？</b><span style="font-size:.92rem;color:#94a3b8">　负号发给每一项、系数乘到每一项</span>
  </div>
  <div class="card" style="background:rgba(251,191,36,.08);border:2px solid rgba(251,191,36,.4);animation:slide-up .5s .9s both">
    <b class="hgold">② 同类项合完了吗？</b><span style="font-size:.92rem;color:#94a3b8">　扫一遍结果，还有没有能合的</span>
  </div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);animation:slide-up .5s 1.5s both">
    <b class="hg">③ 代入加括号了吗？</b><span style="font-size:.92rem;color:#94a3b8">　负数、分数一律穿外套再进门</span>
  </div>
</div>''',
   'narr': '送你一份交卷前三连查。一查括号：去干净了吗，负号和系数发到每一项了吗。二查合并：结果里还有没有漏网的同类项。三查代入：负数、分数加括号了吗。三连查过一遍，这类题基本就拿下了。来，例题实战。'}],
})

if __name__ == '__main__':
    for spec in C.SPECS:
        C.build(spec)
    print('第四章 6 个知识点生成完毕')
