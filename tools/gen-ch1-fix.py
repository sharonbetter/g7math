#!/usr/bin/env python3
"""重建 7a-1-03/04/05（用公共层模板）+ 修复 7a-5-08 的 div 问题后重跑。"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import animated_common as C

C.LESSON = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'lessons', '7a-c1.json'), encoding='utf-8'))
s = C.s

C.SPECS = [
# ============ 7a-1-03 有理数的概念与分类 ============
{'pid': '7a-1-03', 'mind': [('按定义分', '整数 ∪ 分数 = 有理数'),
    ('按符号分', '正有理数 · 0 · 负有理数'),
    ('判断步骤', '先看是否整数→再看是否分数'),
    ('0 的归属', '是整数，既不正也不负')],
 'concepts': [
  {'title': '🌳 给学过的数"排排队"', 'sub': '它们统称有理数', 'html': '''
<div style="display:flex;justify-content:center;margin-top:10px">
  <svg width="700" height="260" viewBox="0 0 700 260">
    <rect x="270" y="10" width="160" height="44" rx="22" fill="#6366f1" style="animation:pop-in .5s .2s both"/>
    <text x="350" y="38" text-anchor="middle" fill="#fff" font-size="17" font-weight="800" style="animation:pop-in .5s .2s both">有理数</text>
    <path d="M300 54 C280 80, 180 80, 160 110" fill="none" stroke="#34d399" stroke-width="2.5" style="opacity:0;animation:mindmap-line .8s .7s forwards"/>
    <path d="M400 54 C420 80, 520 80, 540 110" fill="none" stroke="#fbbf24" stroke-width="2.5" style="opacity:0;animation:mindmap-line .8s 1s forwards"/>
    <rect x="90" y="112" width="140" height="38" rx="12" fill="rgba(52,211,153,.15)" stroke="#34d399" stroke-width="2" style="animation:mm-left .5s 1.2s both"/>
    <text x="160" y="137" text-anchor="middle" fill="#34d399" font-size="16" font-weight="800" style="animation:mm-left .5s 1.2s both">整数</text>
    <rect x="470" y="112" width="140" height="38" rx="12" fill="rgba(251,191,36,.12)" stroke="#fbbf24" stroke-width="2" style="animation:mm-left .5s 1.5s both"/>
    <text x="540" y="137" text-anchor="middle" fill="#fbbf24" font-size="16" font-weight="800" style="animation:mm-left .5s 1.5s both">分数</text>
    <g style="animation:mm-left .5s 1.8s both">
      <rect x="30" y="170" width="90" height="32" rx="10" fill="rgba(52,211,129,.08)" stroke="rgba(52,211,129,.3)" stroke-width="1.5"/>
      <text x="75" y="191" text-anchor="middle" fill="#6ee7b7" font-size="13">正整数</text>
      <rect x="128" y="170" width="60" height="32" rx="10" fill="rgba(52,211,129,.08)" stroke="rgba(52,211,129,.3)" stroke-width="1.5"/>
      <text x="158" y="191" text-anchor="middle" fill="#6ee7b7" font-size="13">0</text>
      <rect x="196" y="170" width="90" height="32" rx="10" fill="rgba(52,211,129,.08)" stroke="rgba(52,211,129,.3)" stroke-width="1.5"/>
      <text x="241" y="191" text-anchor="middle" fill="#6ee7b7" font-size="13">负整数</text>
    </g>
    <g style="animation:mm-left .5s 2.1s both">
      <rect x="420" y="170" width="90" height="32" rx="10" fill="rgba(251,191,36,.08)" stroke="rgba(251,191,36,.3)" stroke-width="1.5"/>
      <text x="465" y="191" text-anchor="middle" fill="#fcd34d" font-size="13">正分数</text>
      <rect x="518" y="170" width="90" height="32" rx="10" fill="rgba(251,191,36,.08)" stroke="rgba(251,191,36,.3)" stroke-width="1.5"/>
      <text x="563" y="191" text-anchor="middle" fill="#fcd34d" font-size="13">负分数</text>
    </g>
    <text x="350" y="240" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="700" style="opacity:0;animation:fade-in .5s 2.5s both">有理数 = 整数 ∪ 分数（不重不漏）</text>
  </svg>
</div>''',
   'narr': '数越攒越多，今天集中起来排个队。有理数这棵大树有两根枝：整数一枝，包括正整数、零和负整数；分数一枝，包括正分数和负分数。整数和分数合起来就是有理数——不重不漏。这棵树就是按定义分类的标准图谱。'},
  {'title': '⚡ 快速判断', 'sub': '给一个数，归哪一类？', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.35);display:flex;justify-content:space-between;align-items:center;animation:slide-up .5s .3s both">
    <span style="font-size:1.3rem;font-weight:800">−7</span>
    <span style="font-size:.95rem;color:#a5b4fc;animation:fade-in .4s 1s both">负整数 → 整数 → <b class="hg">有理数</b> ✓</span>
  </div>
  <div class="card" style="background:rgba(251,191,36,.08);border:2px solid rgba(251,191,36,.35);display:flex;justify-content:space-between;align-items:center;animation:slide-up .5s .9s both">
    <span style="font-size:1.3rem;font-weight:800">3.5</span>
    <span style="font-size:.95rem;color:#fcd34d;animation:fade-in .4s 1.6s both">= 7/2 → 正分数 → <b class="hg">有理数</b> ✓</span>
  </div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.35);display:flex;justify-content:space-between;align-items:center;animation:slide-up .5s 1.5s both">
    <span style="font-size:1.3rem;font-weight:800">0</span>
    <span style="font-size:.95rem;color:#6ee7b7;animation:fade-in .4s 2.2s both">是整数，既不是正数也不是负数 → <b class="hg">有理数</b> ✓</span>
  </div>
</div>''',
   'narr': '来快速判断几个数。负7，是负整数，属于整数，是有理数。3.5，等于二分之七，是正分数，是有理数。0 呢？它是整数，但既不是正数也不是负数——不过别忘了，它也是有理数。判断步骤：先看是不是整数，再看是不是分数，两者必居其一。'}]},

# ============ 7a-1-04 数轴的三要素与画法 ============
{'pid': '7a-1-04', 'mind': [('三要素', '原点 + 正方向 + 单位长度'),
    ('画法三步', '画直线→标原点→定方向和刻度'),
    ('温度计类比', '温度计躺倒就是一条数轴'),
    ('缺一不可', '少了任何一个就不是数轴')],
 'concepts': [
  {'title': '🌡️ 温度计里，藏着一条数轴', 'sub': '把温度计躺倒试试', 'html': '''
<div style="display:flex;justify-content:center;gap:30px;margin-top:10px;align-items:center">
  <div style="text-align:center;animation:pop-in .5s .3s both">
    <svg width="80" height="200" viewBox="0 0 80 200">
      <rect x="30" y="10" width="20" height="160" rx="10" fill="rgba(255,255,255,.1)" stroke="#94a3b8" stroke-width="2.5"/>
      <rect x="35" y="100" width="10" height="65" rx="5" fill="#f43f5e"/>
      <circle cx="40" cy="180" r="12" fill="#f43f5e"/>
      <g stroke="#94a3b8" stroke-width="1.5">
        <line x1="50" y1="40" x2="58" y2="40"/><line x1="50" y1="60" x2="58" y2="60"/>
        <line x1="50" y1="80" x2="58" y2="80"/><line x1="50" y1="100" x2="58" y2="100"/>
        <line x1="50" y1="120" x2="58" y2="120"/><line x1="50" y1="140" x2="58" y2="140"/>
      </g>
      <g fill="#94a3b8" font-size="11" text-anchor="start">
        <text x="62" y="44">50°</text><text x="62" y="84">0°</text><text x="62" y="124">-25°</text>
      </g>
    </svg>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:4px">竖着的温度计</div>
  </div>
  <div style="font-size:2rem;color:#fbbf24;animation:fade-in .4s 1.5s both">→ 躺倒 →</div>
  <div style="text-align:center;animation:pop-in .6s 2s both">
    <svg width="320" height="80" viewBox="0 0 320 80">
      <line x1="10" y1="40" x2="300" y2="40" stroke="#94a3b8" stroke-width="3"/>
      <polygon points="300,40 290,35 290,45" fill="#94a3b8"/>
      <g stroke="#94a3b8" stroke-width="2">
        <line x1="60" y1="35" x2="60" y2="45"/><line x1="110" y1="35" x2="110" y2="45"/>
        <line x1="160" y1="30" x2="160" y2="50" stroke="#fbbf24" stroke-width="3"/>
        <line x1="210" y1="35" x2="210" y2="45"/><line x1="260" y1="35" x2="260" y2="45"/>
      </g>
      <g fill="#94a3b8" font-size="13" text-anchor="middle">
        <text x="60" y="68">-2</text><text x="110" y="68">-1</text>
        <text x="160" y="68" fill="#fbbf24" font-weight="800">0</text>
        <text x="210" y="68">1</text><text x="260" y="68">2</text>
      </g>
      <text x="290" y="25" fill="#6ee7b7" font-size="12" font-weight="700">正方向→</text>
    </svg>
    <div style="font-size:.85rem;color:#6ee7b7;margin-top:4px">数轴！</div>
  </div>
</div>''',
   'narr': '把温度计躺倒过来，你发现了什么？它就是一条数轴！零度的位置对应原点，温度升高的方向就是正方向，每一度的间隔就是单位长度。温度计是数轴的生活原型——数轴不是凭空发明的，它就藏在你的体温计和温度计里。'},
  {'title': '📐 数轴三要素', 'sub': '画数轴的三步走', 'html': '''
<svg width="700" height="200" viewBox="0 0 700 200" style="display:block;margin:0 auto">
  <line x1="60" y1="100" x2="620" y2="100" stroke="#94a3b8" stroke-width="3" style="animation:mindmap-line 1s .3s forwards;opacity:0"/>
  <polygon points="620,100 610,95 610,105" fill="#94a3b8"/>
  <circle cx="200" cy="100" r="8" fill="#fbbf24" style="animation:pop-in .5s .8s both"/>
  <text x="200" y="80" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="800" style="animation:pop-in .5s .8s both">原点（0）</text>
  <path d="M530 100 L580 100" stroke="#34d399" stroke-width="4" marker-end="url(#ar3)" style="opacity:0;animation:fade-in .5s 1.4s both"/>
  <defs><marker id="ar3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#34d399"/></marker></defs>
  <text x="555" y="80" text-anchor="middle" fill="#34d399" font-size="14" font-weight="800" style="opacity:0;animation:fade-in .5s 1.4s both">正方向</text>
  <line x1="300" y1="92" x2="300" y2="108" stroke="#a5b4fc" stroke-width="2.5" style="opacity:0;animation:fade-in .5s 2s both"/>
  <line x1="400" y1="92" x2="400" y2="108" stroke="#a5b4fc" stroke-width="2.5" style="opacity:0;animation:fade-in .5s 2.2s both"/>
  <path d="M300 125 L400 125" stroke="#a5b4fc" stroke-width="2" stroke-dasharray="4 3" style="opacity:0;animation:fade-in .5s 2.4s both"/>
  <text x="350" y="148" text-anchor="middle" fill="#a5b4fc" font-size="14" font-weight="800" style="opacity:0;animation:fade-in .5s 2.6s both">单位长度</text>
  <g fill="#94a3b8" font-size="12" text-anchor="middle" style="opacity:0;animation:fade-in .5s 3s both">
    <text x="200" y="135">0</text><text x="300" y="135">1</text><text x="400" y="135">2</text><text x="500" y="135">3</text>
  </g>
  <text x="350" y="180" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="700" style="opacity:0;animation:fade-in .5s 3.4s both">三步画法：① 画直线 ② 标原点 ③ 定正方向和单位长度</text>
</svg>''',
   'narr': '画数轴三步走。第一步，画一条直线——水平的，右边画箭头表示正方向。第二步，在直线上取一个点表示零，这就是原点。第三步，定单位长度——从原点向右每隔相同距离取一个点，标上一二三，向左标负一负二负三。原点、正方向、单位长度，三要素缺一不可，少了任何一个就不是数轴。'}]},

# ============ 7a-1-05 用数轴上的点表示有理数 ============
{'pid': '7a-1-05', 'mind': [('对应关系', '每个有理数 ↔ 数轴上唯一的点'),
    ('位置规律', '正数在右，负数在左，0 在原点'),
    ('大小规律', '右边的点表示的数更大'),
    ('分数小数', '也能在数轴上找到位置')],
 'concepts': [
  {'title': '🏠 数轴建好了，请有理数们"入住"', 'sub': '每个数都有自己的位置', 'html': '''
<svg width="700" height="200" viewBox="0 0 700 200" style="display:block;margin:0 auto">
  <line x1="60" y1="100" x2="620" y2="100" stroke="#94a3b8" stroke-width="3"/>
  <polygon points="620,100 610,95 610,105" fill="#94a3b8"/>
  <g stroke="#94a3b8" stroke-width="2">
    <line x1="100" y1="94" x2="100" y2="106"/><line x1="170" y1="94" x2="170" y2="106"/>
    <line x1="240" y1="94" x2="240" y2="106"/><line x1="310" y1="88" x2="310" y2="112" stroke="#fbbf24" stroke-width="3"/>
    <line x1="380" y1="94" x2="380" y2="106"/><line x1="450" y1="94" x2="450" y2="106"/>
    <line x1="520" y1="94" x2="520" y2="106"/>
  </g>
  <g fill="#94a3b8" font-size="13" text-anchor="middle">
    <text x="100" y="130">-3</text><text x="170" y="130">-2</text><text x="240" y="130">-1</text>
    <text x="310" y="132" fill="#fbbf24" font-weight="800">0</text>
    <text x="380" y="130">1</text><text x="450" y="130">2</text><text x="520" y="130">3</text>
  </g>
  <circle cx="380" cy="100" r="9" fill="#34d399" style="animation:pop-in .4s .4s both"/>
  <text x="380" y="75" text-anchor="middle" fill="#34d399" font-size="14" font-weight="700" style="animation:pop-in .4s .4s both">+1 ✓</text>
  <circle cx="170" cy="100" r="9" fill="#fb7185" style="animation:pop-in .4s 1s both"/>
  <text x="170" y="75" text-anchor="middle" fill="#fb7185" font-size="14" font-weight="700" style="animation:pop-in .4s 1s both">−2 ✓</text>
  <circle cx="345" cy="100" r="9" fill="#22d3ee" style="animation:pop-in .4s 1.6s both"/>
  <text x="345" y="68" text-anchor="middle" fill="#67e8f9" font-size="13" font-weight="700" style="animation:pop-in .4s 1.6s both">1/2 ✓</text>
  <text x="350" y="175" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="700" style="opacity:0;animation:fade-in .5s 2.2s both">正数在原点右边，负数在左边——每个数都有唯一的家</text>
</svg>''',
   'narr': '数轴画好了，上面还空空的。现在请有理数们入住：正一住在原点右边一个单位的地方，负二住在原点左边两个单位的地方，二分之一住在原点和一的正中间。你看，正数都住在原点右边，负数都住在原点左边，零就住在原点——每个有理数都有唯一的家。'},
  {'title': '📏 右边的大，左边的小', 'sub': '数轴上看大小', 'html': '''
<div style="display:flex;flex-direction:column;gap:14px;margin-top:6px;align-items:center">
  <svg width="600" height="100" viewBox="0 0 600 100">
    <line x1="40" y1="50" x2="560" y2="50" stroke="#94a3b8" stroke-width="3"/>
    <polygon points="560,50 550,45 550,55" fill="#94a3b8"/>
    <circle cx="150" cy="50" r="9" fill="#fb7185"/>
    <circle cx="350" cy="50" r="9" fill="#34d399"/>
    <text x="150" y="30" text-anchor="middle" fill="#fb7185" font-size="15" font-weight="800">−2</text>
    <text x="350" y="30" text-anchor="middle" fill="#34d399" font-size="15" font-weight="800">+3</text>
    <path d="M170 80 Q250 60 330 80" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="6 4" marker-end="url(#ar4)" style="opacity:0;animation:fade-in .5s 1s both"/>
    <defs><marker id="ar4" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#fbbf24"/></marker></defs>
    <text x="250" y="95" text-anchor="middle" fill="#fbbf24" font-size="13" font-weight="700" style="opacity:0;animation:fade-in .5s 1.5s both">−2 ＜ +3（右边的更大）</text>
  </svg>
  <div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.35);min-width:480px;text-align:center;animation:slide-up .5s 2s both">
    <span style="font-size:1rem">数轴上<b class="hgold">右边的点表示的数，总比左边的大</b></span>
  </div>
</div>''',
   'narr': '数轴还能比大小！负二在左边，正三在右边——右边的数总比左边的大，所以负二小于正三。不用算，看位置就知道。这就是数形结合的威力：把数的大小比较，变成了点的位置比较，一眼就能看出来。'}]},
]

if __name__ == '__main__':
    for spec in C.SPECS:
        C.build(spec)
    print('重建 3 个课件完成')
