#!/usr/bin/env python3
"""第一章收尾：7a-1-08 ~ 11（绝对值与大小比较）。"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import animated_common as C

C.LESSON = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data',lessons := '/lessons', '7a-c1.json').replace(',lessons', '') if False else os.path.join(os.path.dirname(__file__), '..', 'data', 'lessons', '7a-c1.json'), encoding='utf-8'))

C.SPECS = [
# ============ 1-08 绝对值的意义与求法 ============
{'pid': '7a-1-08', 'mind': [('几何意义', '数轴上到原点的距离'),
    ('符号', '|a| ≥ 0 永远非负'),
    ('求法', '正数去符号，负数取相反，0 是 0'),
    ('绝对值是距离', '与符号无关的长度')],
 'concepts': [
  {'title': '📏 距离，不带方向', 'sub': '|−3| = 3 的几何真相', 'html': '''
<svg width="740" height="180" viewBox="0 0 740 180" style="display:block;margin:0 auto">
  <line x1="60" y1="110" x2="680" y2="110" stroke="#64748b" stroke-width="2.5"/><polygon points="680,110 670,105 670,115" fill="#64748b"/>
  <g font-size="14" fill="#94a3b8" text-anchor="middle">
    <line x1="120" y1="103" x2="120" y2="117" stroke="#64748b" stroke-width="2"/><text x="120" y="136">-3</text>
    <line x1="280" y1="103" x2="280" y2="117" stroke="#64748b" stroke-width="2"/><text x="280" y="136">-1</text>
    <line x1="370" y1="98" x2="370" y2="122" stroke="#fbbf24" stroke-width="3"/><text x="370" y="140" fill="#fbbf24" font-weight="800">0</text>
    <line x1="460" y1="103" x2="460" y2="117" stroke="#64748b" stroke-width="2"/><text x="460" y="136">1</text>
    <line x1="620" y1="103" x2="620" y2="117" stroke="#64748b" stroke-width="2"/><text x="620" y="136">3</text>
  </g>
  <circle cx="120" cy="110" r="9" fill="#fb7185" style="animation:pop-in .5s .4s both"/>
  <circle cx="620" cy="110" r="9" fill="#34d399" style="animation:pop-in .5s .8s both"/>
  <path d="M120 70 Q245 40 370 70" fill="none" stroke="#fb7185" stroke-width="2.5" stroke-dasharray="6 5" style="opacity:0;animation:fade-in .6s 1.4s both"/>
  <path d="M370 70 Q495 40 620 70" fill="none" stroke="#34d399" stroke-width="2.5" stroke-dasharray="6 5" style="opacity:0;animation:fade-in .6s 1.8s both"/>
  <text x="245" y="34" text-anchor="middle" fill="#fb7185" font-size="13.5" font-weight="700" style="opacity:0;animation:fade-in .6s 1.4s both">距离 3</text>
  <text x="495" y="34" text-anchor="middle" fill="#34d399" font-size="13.5" font-weight="700" style="opacity:0;animation:fade-in .6s 1.8s both">距离 3</text>
  <text x="370" y="168" text-anchor="middle" fill="#fbbf24" font-size="15" font-weight="800" style="opacity:0;animation:fade-in .6s 2.4s both">|−3| = 3　|3| = 3　—— 绝对值 = 到原点的距离</text>
</svg>''',
   'narr': '绝对值的几何真相：它就是数轴上的点到原点的距离。负 3 离原点三格，3 也离原点三格——距离不分左右，所以负 3 的绝对值是 3，3 的绝对值也是 3。距离永远是长度，不可能是负的。'},
  {'title': '🧮 求绝对值三句话', 'sub': '正数、负数、0 各一句', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);animation:slide-up .5s .3s both"><b class="hg">正数</b>的绝对值是它本身：|5| = 5</div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);animation:slide-up .5s .9s both"><b class="hr">负数</b>的绝对值是它的相反数：|−5| = 5</div>
  <div class="card" style="background:rgba(251,191,36,.08);border:2px solid rgba(251,191,36,.4);animation:slide-up .5s 1.5s both"><b class="hgold">0</b> 的绝对值是 0：|0| = 0</div>
</div>
<div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);margin-top:14px;text-align:center;animation:slide-up .6s 2.1s both">
  <span style="font-size:1rem;color:#c7d2fe">铁律：<b style="color:#a5b4fc">|a| ≥ 0</b>——绝对值永不_negative，非负性是它的身份证</span>
</div>''',
   'narr': '求绝对值三句话：正数的绝对值是它本身，5 的绝对值是 5；负数的绝对值是它的相反数，负 5 的绝对值是 5；0 的绝对值是 0。由这三句推出铁律：任何数的绝对值都大于等于零——非负性，是绝对值的身份证，后面解方程全靠它。'}]},

# ============ 1-09 绝对值的非负性与分类讨论 ============
{'pid': '7a-1-09', 'mind': [('非负性', '|a| ≥ 0 恒成立'),
    ('零和模型', '几个非负数之和为 0 → 各自为 0'),
    ('分类讨论', '字母正负未知，分情况'),
    ('绝对值方程', '|x| = 3 → x = ±3')],
 'concepts': [
  {'title': '🎯 非负数抱团归零', 'sub': '零和模型的威力', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-top:14px">
  <div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.4);animation:pop-in .5s .3s both"><div style="font-size:1.7rem;font-weight:900">|a| ≥ 0</div></div>
  <div style="font-size:1.5rem;animation:fade-in .3s .9s both">＋</div>
  <div class="card" style="background:rgba(52,211,129,.1);border:2px solid rgba(52,211,129,.4);animation:pop-in .5s 1.2s both"><div style="font-size:1.7rem;font-weight:900">|b| ≥ 0</div></div>
  <div style="font-size:1.5rem;animation:fade-in .3s 1.8s both">= 0</div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:18px;text-align:center;animation:slide-up .6s 2.3s both">
  <span style="font-size:1.05rem">两个都不小于 0，加起来却 = 0 → <b class="hgold">只能都等于 0</b>：<br/>|a| + |b| = 0　⇒　a = 0 且 b = 0</span>
</div>''',
   'narr': '绝对值最威风的性质来了：两个都不小于零的数，加起来却等于零——只有一种可能，它们都是零。所以遇到绝对值加绝对值等于零，直接让每个都等于零，字母的值白送。这个零和模型，考试里是送分题，就怕你不认识它。'},
  {'title': '⚔️ |x| = 3 有两个解', 'sub': '分类讨论入门', 'html': '''
<div style="display:flex;gap:20px;justify-content:center;margin-top:10px">
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:.9rem;color:#94a3b8">如果 x 是正数</div>
    <div style="font-size:1.9rem;font-weight:900;color:#34d399">x = 3</div>
  </div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);text-align:center;animation:pop-in .5s 1s both">
    <div style="font-size:.9rem;color:#94a3b8">如果 x 是负数</div>
    <div style="font-size:1.9rem;font-weight:900;color:#fb7185">x = −3</div>
  </div>
</div>
<div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);margin-top:16px;text-align:center;animation:slide-up .6s 1.7s both">
  <span style="font-size:1rem;color:#c7d2fe">到原点距离为 3 的点，左右各一个 —— <b style="color:#a5b4fc">别漏负数解！</b></span>
</div>''',
   'narr': '绝对值等于三，x 是几？到原点距离为三的点，右边一个正三，左边一个负三——两个解，一个都不能漏。这就是分类讨论的入门：字母正负未知时，正也讨论、负也讨论，最后答案常常成对出现。漏负数解，是最常见的失分点。'}]},

# ============ 1-10 利用数轴与法则比较有理数的大小 ============
{'pid': '7a-1-10', 'mind': [('数轴法则', '右边的总比左边的大'),
    ('负数比较', '绝对值大的反而小'),
    ('正负零', '正 > 0 > 负'),
    ('多个数比较', '先画数轴再排队')],
 'concepts': [
  {'title': '➡️ 右边为大', 'sub': '数轴上的秩序', 'html': '''
<svg width="740" height="190" viewBox="0 0 740 190" style="display:block;margin:0 auto">
  <line x1="50" y1="110" x2="690" y2="110" stroke="#64748b" stroke-width="2.5"/><polygon points="690,110 680,105 680,115" fill="#64748b"/>
  <g font-size="14" text-anchor="middle">
    <line x1="130" y1="103" x2="130" y2="117" stroke="#64748b" stroke-width="2"/><text x="130" y="136" fill="#94a3b8">-2</text>
    <line x1="255" y1="103" x2="255" y2="117" stroke="#64748b" stroke-width="2"/><text x="255" y="136" fill="#94a3b8">-0.5</text>
    <line x1="370" y1="98" x2="370" y2="122" stroke="#fbbf24" stroke-width="3"/><text x="370" y="140" fill="#fbbf24" font-weight="800">0</text>
    <line x1="485" y1="103" x2="485" y2="117" stroke="#64748b" stroke-width="2"/><text x="485" y="136" fill="#94a3b8">1</text>
    <line x1="610" y1="103" x2="610" y2="117" stroke="#64748b" stroke-width="2"/><text x="610" y="136" fill="#94a3b8">3</text>
  </g>
  <circle cx="130" cy="110" r="9" fill="#fb7185" style="animation:pop-in .4s .4s both"/>
  <circle cx="255" cy="110" r="9" fill="#fda4af" style="animation:pop-in .4s .9s both"/>
  <circle cx="485" cy="110" r="9" fill="#6ee7b7" style="animation:pop-in .4s 1.4s both"/>
  <circle cx="610" cy="110" r="9" fill="#34d399" style="animation:pop-in .4s 1.9s both"/>
  <text x="370" y="52" text-anchor="middle" fill="#fbbf24" font-size="16" font-weight="800" style="opacity:0;animation:fade-in .6s 2.4s both">越往右越大：−2 ＜ −0.5 ＜ 0 ＜ 1 ＜ 3</text>
</svg>''',
   'narr': '比较有理数大小，终极裁判是数轴：右边的点表示的数总比左边的大。把负二、负零点五、零、一、三都请上数轴，从左到右排队，大小关系一目了然。多个数比较，先画数轴再点点，永远不会乱。'},
  {'title': '🤔 负数的世界反着来', 'sub': '绝对值大反而小', 'html': '''
<div style="display:flex;gap:20px;justify-content:center;margin-top:10px;align-items:center">
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:2rem;font-weight:900;color="#fb7185">−8</div>
    <div style="font-size:.85rem;color:#94a3b8">绝对值 8（离原点远）</div>
  </div>
  <div style="font-size:2.2rem;font-weight:900;color:#fbbf24;animation:pop-in .5s 1s both">＜</div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);text-align:center;animation:pop-in .5s 1.4s both">
    <div style="font-size:2rem;font-weight:900;color="#fda4af">−2</div>
    <div style="font-size:.85rem;color:#94a3b8">绝对值 2（离原点近）</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:16px;text-align:center;animation:slide-up .6s 2s both">
  <span style="font-size:1rem">负数比较口诀：<b class="hgold">绝对值大的反而小</b>（跑得越远越冷）</span>
</div>''',
   'narr': '负数的世界规则反着来：负八和负二比，谁大？负八的绝对值是八，跑得远；负二的绝对值是二，离家近——但负八在数轴更左边，所以负八反而更小。口诀：两个负数比大小，绝对值大的反而小。就像温度，零下八度比零下二度更冷。'}]},

# ============ 1-11 含字母与绝对值的大小比较 ============
{'pid': '7a-1-11', 'mind': [('字母上数轴', '按条件定位置'),
    ('作差法', 'a−b ＞ 0 → a ＞ b'),
    ('分类讨论', '字母正负要分情况'),
    ('特殊值检验', '代几个数试试')],
 'concepts': [
  {'title': '🎯 先让字母站好位', 'sub': '条件翻译成数轴', 'html': '''
<svg width="740" height="170" viewBox="0 0 740 170" style="display:block;margin:0 auto">
  <line x1="50" y1="100" x2="690" y2="100" stroke="#64748b" stroke-width="2.5"/><polygon points="690,100 680,95 680,105" fill="#64748b"/>
  <line x1="370" y1="88" x2="370" y2="112" stroke="#fbbf24" stroke-width="3"/><text x="370" y="132" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="800">0</text>
  <circle cx="180" cy="100" r="9" fill="#fb7185" style="animation:pop-in .4s .4s both"/>
  <text x="180" y="76" text-anchor="middle" fill="#fb7185" font-size="16" font-weight="800" style="animation:pop-in .4s .4s both">a</text>
  <circle cx="560" cy="100" r="9" fill="#34d399" style="animation:pop-in .4s .9s both"/>
  <text x="560" y="76" text-anchor="middle" fill="#34d399" font-size="16" font-weight="800" style="animation:pop-in .4s .9s both">b</text>
  <text x="370" y="158" text-anchor="middle" fill="#94a3b8" font-size="13.5" style="opacity:0;animation:fade-in .5s 1.5s both">已知 a ＜ 0 ＜ b → 一眼看出：a ＜ 0 ＜ b，|a| 与 |b| 谁大还要看长度</text>
</svg>''',
   'narr': '含字母的比较，第一步永远是把条件翻译到数轴上。已知 a 小于零小于 b，那就让 a 站左边负半轴，b 站右边正半轴——a 小于零小于 b 立刻可见。但绝对值比的是距离，a 的绝对值是它到原点的长度，b 也一样，谁大还得看谁离原点远，光有正负还不够。'},
  {'title': '🧪 特殊值探路', 'sub': '拿具体数字做实验', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:520px;animation:slide-up .5s .3s both">
    问：a ＜ 0，比较 a 与 2a → <b class="hgold">代 a = −1 试试</b>
  </div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:520px;text-align:center;animation:slide-up .5s 1s both">
    <span style="font-size:1.4rem;font-weight:900">a = −1：2a = −2　→　−2 ＜ −1　→　<b class="hg">2a ＜ a</b></span>
  </div>
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);min-width:520px;animation:slide-up .5s 1.6s both">
    <span style="font-size:.92rem;color:#c7d2fe">技巧：拿一两个<b style="color:#a5b4fc">符合条件的特殊值</b>做实验，结论立刻现形，再用数轴验证一遍更稳</span>
  </div>
</div>''',
   'narr': '字母比较卡壳时，有个屡试不爽的实验法：代特殊值。比较 a 和 2a，a 小于零，就代 a 等于负一：2a 等于负二，负二小于负一，所以 2a 小于 a。再换 a 等于负三验证，结论不变。特殊值探路、数轴验证，字母比较题的两板斧。'}]},
]

if __name__ == '__main__':
    for spec in C.SPECS:
        C.build(spec)
    print('第一章 08-11 生成完毕')
