#!/usr/bin/env python3
"""第五章（一元一次方程）7a-5-01 ~ 07：概念与解法七讲。"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import animated_common as C

C.LESSON = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'lessons', '7a-c5.json'), encoding='utf-8'))

C.SPECS = [
# ============ 5-01 方程与一元一次方程 ============
{'pid': '7a-5-01', 'mind': [('什么是方程', '含未知数的等式'),
    ('一元', '只含一个未知数'),
    ('一次', '未知数次数是 1'),
    ('整式方程', '分母不能含未知数')],
 'concepts': [
  {'title': '⚖️ 天平上站着 x', 'sub': '方程的起点是平衡', 'html': '''
<svg width="620" height="230" viewBox="0 0 620 230" style="display:block;margin:0 auto">
  <line x1="310" y1="30" x2="310" y2="90" stroke="#94a3b8" stroke-width="4"/>
  <line x1="130" y1="90" x2="490" y2="90" stroke="#94a3b8" stroke-width="5" stroke-linecap="round" style="animation:pop-in .5s .3s both"/>
  <line x1="160" y1="90" x2="140" y2="150" stroke="#94a3b8" stroke-width="3"/><line x1="160" y1="90" x2="180" y2="150" stroke="#94a3b8" stroke-width="3"/>
  <line x1="460" y1="90" x2="440" y2="150" stroke="#94a3b8" stroke-width="3"/><line x1="460" y1="90" x2="480" y2="150" stroke="#94a3b8" stroke-width="3"/>
  <rect x="118" y="150" width="85" height="55" rx="10" fill="rgba(99,102,241,.2)" stroke="#818cf8" stroke-width="2.5" style="animation:pop-in .5s .8s both"/>
  <text x="160" y="186" text-anchor="middle" fill="#a5b4fc" font-size="26" font-weight="800" style="animation:pop-in .5s .8s both">2x</text>
  <rect x="428" y="150" width="65" height="55" rx="10" fill="rgba(52,211,153,.2)" stroke="#34d399" stroke-width="2.5" style="animation:pop-in .5s 1.3s both"/>
  <text x="460" y="186" text-anchor="middle" fill="#34d399" font-size="26" font-weight="800" style="animation:pop-in .5s 1.3s both">6</text>
  <text x="310" y="220" text-anchor="middle" fill="#fbbf24" font-size="16" font-weight="700" style="animation:fade-in .6s 1.9s both">2x = 6　—— 含未知数的等式，叫方程</text>
</svg>''',
   'narr': '把方程想成一台天平：左边放着 2x，右边放着 6，两边一样重，天平平衡——2x 等于 6。这就是方程：含有未知数的等式。注意两个都要有：1 加 2 等于 3 是等式但没有未知数，不是方程；2x 大于 6 有未知数但不是等式，也不是。'},
  {'title': '🎯 "一元一次"的三个门槛', 'sub': '过三关才算数', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);animation:slide-up .5s .3s both"><b style="color:#a5b4fc">① 一元</b>：只含 <b class="hg">一个</b>未知数（x+y=3 有两个，出局）</div>
  <div class="card" style="background:rgba(251,191,36,.08);border:2px solid rgba(251,191,36,.4);animation:slide-up .5s .9s both"><b class="hgold">② 一次</b>：未知数的次数是 <b class="hg">1</b>（x²=4 出局）</div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);animation:slide-up .5s 1.5s both"><b class="hg">③ 整式</b>：分母里不许有字母（1/x = 3 出局）</div>
</div>''',
   'narr': '一元一次方程要过三关。第一关一元：只能有一个未知数，x 加 y 等于 3 两个，出局。第二关一次：未知数的次数是 1，x 方等于 4 出局。第三关整式：分母里不能有字母，x 分之一等于 3 出局。三关全过，才叫一元一次方程。'},
  {'title': '⚡ 现场过闸机', 'sub': '四个快判', 'html': '''
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);display:flex;justify-content:space-between;animation:pop-in .4s .3s both"><span style="font-size:1.3rem;font-weight:800">2x + 1 = 5</span><b class="hg">✓</b></div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);display:flex;justify-content:space-between;animation:pop-in .4s .8s both"><span style="font-size:1.3rem;font-weight:800">x² = 4</span><b class="hr">✗ 二次</b></div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);display:flex;justify-content:space-between;animation:pop-in .4s 1.3s both"><span style="font-size:1.3rem;font-weight:800">x + y = 3</span><b class="hr">✗ 二元</b></div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);display:flex;justify-content:space-between;animation:pop-in .4s 1.8s both"><span style="font-size:1.3rem;font-weight:800">3 − x = 0</span><b class="hg">✓</b></div>
</div>''',
   'narr': '现场过闸机。2x 加 1 等于 5，一元一次，通过。x 方等于 4，二次，拦下。x 加 y 等于 3，二元，拦下。3 减 x 等于 0？一个未知数、一次、整式——通过！别看它长得别扭，它可是标准的一元一次方程。'}]},

# ============ 5-02 方程的解与检验 ============
{'pid': '7a-5-02', 'mind': [('什么是解', '使方程成立的未知数的值'),
    ('检验三步', '代入左边、代入右边、比一比'),
    ('格式', '左边=… 右边=… 左边=右边'),
    ('易错', '只代一边就下结论')],
 'concepts': [
  {'title': '🔑 解是那把正确的钥匙', 'sub': '代进去，锁就开', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-top:14px">
  <div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.4);animation:pop-in .5s .3s both">
    <div style="font-size:1.7rem;font-weight:900">2x + 1 = 7</div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:4px">这把锁</div>
  </div>
  <div style="text-align:center;animation:pop-in .5s 1s both">
    <div style="font-size:2.4rem">🔑 x = 3</div>
    <div style="font-size:.85rem;color:#94a3b8">这把钥匙</div>
  </div>
  <div class="card" style="background:rgba(52,211,153,.1);border:2px solid rgba(52,211,129,.5);animation:pop-in .5s 1.7s both">
    <div style="font-size:1.2rem;font-weight:800;color:#34d399;line-height:1.9">左边 = 2×3 + 1 = 7<br/>右边 = 7　→ 相等 ✓</div>
  </div>
</div>''',
   'narr': '方程的解，就是那把正确的钥匙。2x 加 1 等于 7 这把锁，拿 x 等于 3 去试：左边 2 乘 3 加 1 等于 7，右边也是 7，两边相等——锁开了，x 等于 3 就是解。换 x 等于 2 呢？左边等于 5，对不上，钥匙不对。'},
  {'title': '📋 检验三步走', 'sub': '答题卡上的规范格式', 'html': '''
<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:480px;animation:slide-up .5s .3s both">
    <b style="color:#a5b4fc">第一步</b>　把 x=3 代入<b>左边</b>：左边 = 2×3+1 = 7
  </div>
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:480px;animation:slide-up .5s .9s both">
    <b class="hgold">第二步</b>　代入<b>右边</b>：右边 = 7
  </div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);min-width:480px;animation:slide-up .5s 1.5s both">
    <b class="hg">第三步</b>　左边 = 右边 → x=3 是方程的解 ✓
  </div>
</div>''',
   'narr': '检验要写三步，一步不能省。第一步，把候选值代入方程左边算出来；第二步，代入右边算出来；第三步，下结论：左边等于右边，所以是解。考试只代一边就下结论是要扣分的——两边都算，结论才有分量。'}]},

# ============ 5-03 等式的性质 ============
{'pid': '7a-5-03', 'mind': [('性质一', '两边同加减，仍平衡'),
    ('性质二', '两边同乘除（除数≠0）'),
    ('用途', '解方程的天平工具'),
    ('除数不为 0', '除法时的红线')],
 'concepts': [
  {'title': '⚖️ 天平两边一起动', 'sub': '等式性质一：同加减', 'html': '''
<svg width="700" height="180" viewBox="0 0 700 180" style="display:block;margin:0 auto">
  <line x1="120" y1="60" x2="580" y2="60" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>
  <rect x="60" y="60" width="80" height="48" rx="10" fill="rgba(99,102,241,.2)" stroke="#818cf8" stroke-width="2" style="animation:pop-in .4s .3s both"/>
  <text x="100" y="92" text-anchor="middle" fill="#a5b4fc" font-size="20" font-weight="800">x</text>
  <rect x="540" y="60" width="80" height="48" rx="10" fill="rgba(52,211,153,.2)" stroke="#34d399" stroke-width="2" style="animation:pop-in .4s .6s both"/>
  <text x="580" y="92" text-anchor="middle" fill="#34d399" font-size="20" font-weight="800">5</text>
  <text x="350" y="40" text-anchor="middle" fill="#94a3b8" font-size="14">平衡中：x = 5</text>
  <rect x="60" y="0" width="80" height="34" rx="8" fill="rgba(245,158,11,.25)" stroke="#fbbf24" stroke-width="2" style="animation:pop-in .5s 1.4s both"/>
  <text x="100" y="24" text-anchor="middle" fill="#fbbf24" font-size="15" font-weight="800">+3</text>
  <rect x="540" y="0" width="80" height="34" rx="8" fill="rgba(245,158,11,.25)" stroke="#fbbf24" stroke-width="2" style="animation:pop-in .5s 1.9s both"/>
  <text x="580" y="24" text-anchor="middle" fill="#fbbf24" font-size="15" font-weight="800">+3</text>
  <text x="350" y="150" text-anchor="middle" fill="#fbbf24" font-size="15" font-weight="700" style="animation:fade-in .6s 2.4s both">两边同时 +3 → 依然平衡：x + 3 = 5 + 3</text>
</svg>''',
   'narr': '解方程的全部依据，就是天平的两条性质。第一条：天平两边同时加（或减）同一个数，依然平衡。x 等于 5 平衡中，两边同时加 3，还是平衡，x 加 3 等于 5 加 3。天平的秘密：两边一起动，谁也不吃亏。'},
  {'title': '✖️ 两边一起乘除', 'sub': '等式性质二（除数≠0）', 'html': '''
<div style="display:flex;flex-direction:column;gap:14px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);min-width:480px;text-align:center;animation:slide-up .5s .3s both">
    <div style="font-size:1.5rem;font-weight:900">2x = 10　→　两边 ÷2　→　x = 5</div>
  </div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);min-width:480px;text-align:center;animation:slide-up .5s 1s both">
    <div style="font-size:1.1rem;color:#fecdd3">⚠️ 除数不能为 0 —— 天平上没有"除以零"这个操作</div>
  </div>
</div>''',
   'narr': '第二条：两边同时乘或除以同一个数（除数不为零），依然平衡。2x 等于 10，两边同除以 2，x 等于 5。特别提醒那道红线：除数不能是零——零做除数，天平直接报废。这两条性质，就是接下来移项、系数化一的祖师爷。'}]},

# ============ 5-04 移项 ============
{'pid': '7a-5-04', 'mind': [('本质', '两边同加减的快捷写法'),
    ('规则', '移项过等号，必须变号'),
    ('方向', '未知数归左，常数归右'),
    ('检查', '移完扫一眼：变号了吗')],
 'concepts': [
  {'title': '🌉 过桥变号', 'sub': '移项的核心规矩', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:10px;align-items:center">
  <div style="display:flex;align-items:center;gap:14px;animation:pop-in .5s .3s both">
    <span style="font-size:2.2rem;font-weight:900">x <span class="hg">+ 3</span> = 8</span>
  </div>
  <svg width="420" height="60" viewBox="0 0 420 60">
    <line x1="210" y1="5" x2="210" y2="55" stroke="#fbbf24" stroke-width="3" stroke-dasharray="6 5"/>
    <text x="210" y="20" text-anchor="middle" fill="#fbbf24" font-size="13">等号桥</text>
    <path d="M100 30 Q210 -10 320 30" fill="none" stroke="#fb7185" stroke-width="3" marker-end="url(#arw)" style="animation:fade-in .6s 1.1s both"/>
    <defs><marker id="arw" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#fb7185"/></marker></defs>
  </svg>
  <div style="display:flex;align-items:center;gap:14px;animation:pop-in .5s 1.8s both">
    <span style="font-size:2.2rem;font-weight:900">x = 8 <span class="hr">− 3</span></span>
  </div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);animation:slide-up .5s 2.4s both">
    <span style="color:#fecdd3;font-size:1rem">＋3 过了桥 → 变成 <b class="hr">−3</b>（不变号 = 全题报废）</span>
  </div>
</div>''',
   'narr': '解方程最常用的一招：移项。x 加 3 等于 8，把加 3 从左边移到右边——注意，它要过等号这座桥，过桥必须变号：加 3 变成减 3，得 x 等于 8 减 3，也就是 5。口诀：移项过桥，变号保命。忘了变号，整题报废。'},
  {'title': '🏠 各回各家', 'sub': '未知数归左，常数归右', 'html': '''
<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:460px;text-align:center;animation:slide-up .5s .3s both">
    <span style="font-size:1.5rem;font-weight:800">3x <span class="hr">+ 7</span> = <span class="hr">2x</span> <span class="hg">− 5</span></span>
  </div>
  <div style="font-size:1.2rem;animation:fade-in .4s 1s both">↓ 未知的去左边，数字的去右边（都变号）</div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);min-width:460px;text-align:center;animation:slide-up .5s 1.5s both">
    <span style="font-size:1.5rem;font-weight:900">3x − 2x = −5 − 7</span>
  </div>
  <div class="card" style="background:rgba(251,191,36,.08);border:2px solid rgba(251,191,36,.4);animation:slide-up .5s 2.1s both">
    <span class="hgold" style="font-size:1rem">口诀：移项变号，左边住 x，右边住数</span>
  </div>
</div>''',
   'narr': '多项混在一起的方程，移项的方向是：未知的都请到左边，数字都请到右边，搬家时全体变号。3x 加 7 等于 2x 减 5：2x 从右边搬来变负 2x，加 7 搬过去变减 7，得 3x 减 2x 等于负 5 减 7。移项变号，左边住 x，右边住数。'}]},

# ============ 5-05 合并与系数化1 ============
{'pid': '7a-5-05', 'mind': [('合并同类项', '3x+2x=5x，左边变短'),
    ('系数化为 1', '两边同除以系数'),
    ('符号跟着走', '−2x=6 → x=−3'),
    ('两步连招', '合并→化一')],
 'concepts': [
  {'title': '🗜️ 两步连招', 'sub': '先合并，再化一', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:420px;text-align:center;animation:pop-in .5s .3s both">
    <span style="font-size:1.7rem;font-weight:800">3x + 2x = 15</span>
  </div>
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);min-width:420px;text-align:center;animation:slide-up .5s 1s both">
    <b style="color:#a5b4fc">合并</b>　<span style="font-size:1.6rem;font-weight:900">5x = 15</span>
  </div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);min-width:420px;text-align:center;animation:slide-up .5s 1.6s both">
    <b class="hg">两边 ÷5</b>　<span style="font-size:1.7rem;font-weight:900;color:#34d399">x = 3</span>
  </div>
</div>''',
   'narr': '解方程的收尾两步连招。第一步合并：3x 加 2x 等于 5x，式子瞬间变短，5x 等于 15。第二步系数化为一：两边同除以 5，x 等于 3。合并是把同类项打包，化一是让 x 单独站——两步走完，解就出来了。'},
  {'title': '⚠️ 符号别丢', 'sub': '−2x = 6 怎么办', 'html': '''
<div style="display:flex;gap:18px;justify-content:center;margin-top:14px">
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:1.6rem;font-weight:900">−2x = 6</div>
    <div style="font-size:.9rem;color:#94a3b8;margin-top:6px">两边 ÷(−2)</div>
    <div style="font-size:1.5rem;font-weight:900;color:#34d399;margin-top:4px">x = −3</div>
  </div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);text-align:center;animation:pop-in .5s 1s both">
    <div style="font-size:.95rem;color:#fecdd3">常见错误</div>
    <div style="font-size:1.4rem;font-weight:900;margin-top:6px;color:#fb7185">x = 3 ✗</div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:4px">除以负数，结果的符号要跟着翻转</div>
  </div>
</div>''',
   'narr': '系数是负数时要格外小心。负 2x 等于 6，两边同除以负 2，x 等于负 3——除以负数，符号要翻转。多少人一步写成 x 等于 3，前面九步的努力全白费。记住：负号跟着除数一起进门。'}]},

# ============ 5-06 去括号解方程 ============
{'pid': '7a-5-06', 'mind': [('先分配', '系数乘进括号每一项'),
    ('或两边同除', '整体思想更快'),
    ('负号分配', '−( ) 每项变号'),
    ('去完括号', '回到移项合并老路')],
 'concepts': [
  {'title': '🚪 括号是扇旋转门', 'sub': '两种进法，任选其一', 'html': '''
<div style="display:flex;gap:16px;margin-top:6px">
  <div class="card" style="flex:1;background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);text-align:center;animation:slide-up .5s .3s both">
    <b style="color:#a5b4fc">路 A：分配律拆门</b>
    <div style="font-size:1.35rem;font-weight:900;margin-top:10px;line-height:1.9">2(x−3) = 8<br/>2x − 6 = 8</div>
  </div>
  <div class="card" style="flex:1;background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:slide-up .5s 1s both">
    <b class="hg">路 B：两边同 ÷2（更快）</b>
    <div style="font-size:1.35rem;font-weight:900;margin-top:10px;line-height:1.9">2(x−3) = 8<br/>x − 3 = 4</div>
  </div>
</div>''',
   'narr': '方程里带括号怎么办？两种进法。A 路：用分配律拆门，2 乘进括号每一项，2x 减 6 等于 8。B 路：把括号看成整体，两边同除以 2，括号前系数消失，x 减 3 等于 4——这题 B 路更快。两条路都通，哪个顺手走哪个。'},
  {'title': '😈 遇上负号看守的门', 'sub': '−( ) 与 −2( ) 的陷阱', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);min-width:460px;text-align:center;animation:pop-in .5s .3s both">
    <span style="font-size:1.5rem;font-weight:800">5x − <span class="hr">3(x − 1)</span> = 9</span>
  </div>
  <div style="font-size:1.2rem;animation:fade-in .4s 1s both">↓ −3 要乘到每一项（含符号）</div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);min-width:460px;text-align:center;animation:slide-up .5s 1.5s both">
    <span style="font-size:1.45rem;font-weight:900">5x − 3x <span class="hg">+ 3</span> = 9　（−3 × −1 = +3）</span>
  </div>
</div>''',
   'narr': '括号前站着负系数，是这类方程的头号陷阱。5x 减 3 倍括号 x 减 1 等于 9：负 3 要乘到每一项，负 3 乘 x 是负 3x，负 3 乘负 1 是正 3——这一步的加 3 最容易漏。去完括号，就走移项、合并的老路了。'}]},

# ============ 5-07 去分母 ============
{'pid': '7a-5-07', 'mind': [('找公分母', '各分母的最小公倍数'),
    ('两边同乘', '每一项都要乘到'),
    ('整数项别漏乘', '最常见丢分点'),
    ('分子加括号', '分数线的保护')],
 'concepts': [
  {'title': '🧹 一把扫掉分数线', 'sub': '两边同乘公分母', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:440px;text-align:center;animation:pop-in .5s .3s both">
    <span style="font-size:1.6rem;font-weight:800">x/2 + 1 = 3</span>
  </div>
  <div style="font-size:1.15rem;color:#fbbf24;animation:fade-in .4s 1s both">↓ 两边同 × 2（公分母）——每一项都乘！</div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);min-width:440px;text-align:center;animation:slide-up .5s 1.5s both">
    <span style="font-size:1.6rem;font-weight:900">2·(x/2) + <b class="hgold">2·1</b> = 2·3　→　x + 2 = 6</span>
  </div>
</div>''',
   'narr': '去分母的动作很爽：找各分母的最小公倍数，两边同乘它，分数线一把扫掉。x 除以 2 加 1 等于 3，公分母是 2，两边同乘 2。注意那个孤零零的 1——它也要乘 2！最容易的就是漏乘整数项，一步漏、全盘错。'},
  {'title': '🛡️ 分子要穿外套', 'sub': '分数线自带括号属性', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:480px;text-align:center;animation:pop-in .5s .3s both">
    <span style="font-size:1.5rem;font-weight:800">(x+1)/3 − 2 = (x−2)/6</span>
  </div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);min-width:480px;text-align:center;animation:slide-up .5s 1s both">
    <span style="font-size:1.4rem;font-weight:900">×6 →　<b class="hgold">2(x+1)</b> − 12 = <b class="hgold">(x−2)</b></span>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:6px">分子是多项式时，去分母后必须带括号</div>
  </div>
</div>''',
   'narr': '还有个隐蔽规矩：分数线自带括号属性。x 加 1 除以 3，去分母乘 6 之后，分子要写成 2 括号 x 加 1——先把 2 乘进去之前，括号替分子挡住符号混乱。去分母、加括号、再分配，稳稳当当往解走。'}]},
]

if __name__ == '__main__':
    for spec in C.SPECS:
        C.build(spec)
    print('第五章 01-07 生成完毕')
