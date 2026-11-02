#!/usr/bin/env python3
"""第二章（有理数的运算）全部 13 讲。"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import animated_common as C

C.LESSON = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'lessons', '7a-c2.json'), encoding='utf-8'))

C.SPECS = [
# ---- 2-01 加法法则 ----
{'pid': '7a-2-01', 'mind': [('同号', '符号不变，绝对值相加'),
    ('异号', '取绝对值大的符号，绝对值相减'),
    ('与 0', '一个数加 0 仍得它'),
    ('互反两数', '相加得 0')],
 'concepts': [
  {'title': '➕ 同号：齐心协力', 'sub': '符号一样，直接加', 'html': '''
<div style="display:flex;gap:16px;justify-content:center;margin-top:10px">
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:.9rem;color:#94a3b8">两个正数</div>
    <div style="font-size:1.8rem;font-weight:900;color:#34d399">(+5)+(+3)=+8</div>
  </div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);text-align:center;animation:pop-in .5s 1s both">
    <div style="font-size:.9rem;color:#94a3b8">两个负数</div>
    <div style="font-size:1.8rem;font-weight:900;color:#fb7185">(−5)+(−3)=−8</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:16px;text-align:center;animation:slide-up .6s 1.7s both">
  <span style="font-size:1rem">同号相加：<b class="hgold">符号照抄，绝对值相加</b></span>
</div>''',
   'narr': '加法第一式：同号相加。两个正数，五加三得八，正八；两个负数，负五加负三，符号照抄负，绝对值五加三得八，负八。口诀：同号相加，符号照抄，绝对值相加——像同方向的力，劲儿往一处使。'},
  {'title': '⚔️ 异号：拔河定胜负', 'sub': '谁绝对值大听谁的', 'html': '''
<svg width="640" height="170" viewBox="0 0 640 170" style="display:block;margin:0 auto">
  <line x1="80" y1="85" x2="560" y2="85" stroke="#94a3b8" stroke-width="3"/>
  <rect x="290" y="72" width="18" height="26" rx="4" fill="#fbbf24"/>
  <rect x="180" y="75" width="90" height="20" rx="8" fill="rgba(244,63,94,.55)" stroke="#fb7185" stroke-width="2" style="animation:slide-up .5s .4s both"/>
  <text x="225" y="62" text-anchor="middle" fill="#fb7185" font-size="14" font-weight="800">−9 的力</text>
  <rect x="330" y="75" width="55" height="20" rx="8" fill="rgba(52,211,153,.55)" stroke="#34d399" stroke-width="2" style="animation:slide-up .5s 1s both"/>
  <text x="357" y="62" text-anchor="middle" fill="#34d399" font-size="14" font-weight="800">+6</text>
  <path d="M420 85 L490 85" stroke="#fbbf24" stroke-width="3.5" marker-end="url(#a2)" style="opacity:0;animation:fade-in .6s 1.7s both"/>
  <defs><marker id="a2" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#fbbf24"/></marker></defs>
  <text x="320" y="130" text-anchor="middle" fill="#fbbf24" font-size="15" font-weight="800" style="opacity:0;animation:fade-in .6s 1.9s both">(−9)+(+6)：绝对值 9−6=3，取大者符号 → −3</text>
</svg>''',
   'narr': '异号相加像拔河：负九往左拉，正六往右拉。绝对值相减，九减六得三；符号听绝对值大的——负九劲大，取负号，结果是负三。口诀：异号相加，取大符号，绝对值相减。互为相反数的两数相加就是平局，得零。'}]},

# ---- 2-02 加法运算律 ----
{'pid': '7a-2-02', 'mind': [('交换律', 'a+b = b+a'),
    ('结合律', '(a+b)+c = a+(b+c)'),
    ('凑整优先', '能凑整的先算'),
    ('同号分组', '同号先加少出错')],
 'concepts': [
  {'title': '🧲 简算三板斧', 'sub': '交换律与结合律的战场', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);animation:slide-up .5s .3s both">
    <b class="hg">凑整</b>：16+(−25)+24+(−35) → (16+24)+(−25−35) = 40+(−60) = <b class="hg">−20</b>
  </div>
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);animation:slide-up .5s .9s both">
    <b style="color:#a5b4fc">同号分组</b>：正数归正数、负数归负数，各自加完再碰面
  </div>
  <div class="card" style="background:rgba(245,158,11,.08);border:2px solid rgba(245,158,11,.4);animation:slide-up .5s 1.5s both">
    <b class="hgold">相反数配对</b>：见互为相反数的两个数，先捆一起（和为 0）
  </div>
</div>''',
   'narr': '加法算得快，靠交换律和结合律排兵布阵，三板斧：一凑整，16 加 24 正好 40，负 25 减 35 负 60，答案负 20；二同号分组，正数一伙负数一伙各自加完再碰面；三相反数配对，互为相反数的两个数捆一起，和为零直接消失。三板斧下去，长算式变短，准确率还高。'}]},

# ---- 2-03 减法法则 ----
{'pid': '7a-2-03', 'mind': [('法则', '减去一个数 = 加它的相反数'),
    ('转化', 'a−b = a+(−b)'),
    ('双变号', '减号变加号、减数变相反'),
    ('验证', '温差：5−(−3)=8')],
 'concepts': [
  {'title': '🔄 减法是加法的变身', 'sub': 'a − b = a + (−b)', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:480px;text-align:center;animation:pop-in .5s .3s both">
    <span style="font-size:1.9rem;font-weight:900">5 <span class="hr">−</span> <span class="hr">(−3)</span></span>
  </div>
  <div style="font-size:1.2rem;color:#fbbf24;animation:fade-in .4s 1s both">↓ 双变身：减号→加号，−3→+3</div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:480px;text-align:center;animation:slide-up .5s 1.5s both">
    <span style="font-size:1.9rem;font-weight:900">= 5 + (+3) = <b class="hg">8</b></span>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:14px;text-align:center;animation:slide-up .6s 2.1s both">
  <span style="font-size:.98rem">验算：5 度比零下 3 度高几度？5−(−3)=8 ✓　口诀：<b class="hgold">减负等于加正</b></span>
</div>''',
   'narr': '减法根本不用单独记——它是加法的变身。五减负三：减号变加号，负三变成它的相反数正三，双变身之后就是五加三等于八。验证一下：五度比零下三度高几度？高八度，没错。口诀：减去一个数，等于加上它的相反数，两个符号同时变。'}]},

# ---- 2-04 加减混合 ----
{'pid': '7a-2-04', 'mind': [('统一成加法', '减法全部转身'),
    ('省略加号', '和式记法更简洁'),
    ('同号结合', '凑整/相反数/同号'),
    ('顺序', '先统一，再简算')],
 'concepts': [
  {'title': '🌀 全员变成加法', 'sub': '混合运算第一步', 'html': '''
<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:520px;text-align:center;animation:pop-in .5s .3s both">
    <span style="font-size:1.5rem;font-weight:800">(−4) − (+7) + (−2) − (−9)</span>
  </div>
  <div style="font-size:1.1rem;color:#fbbf24;animation:fade-in .4s 1s both">↓ 减法变身：−(+7)→+(−7)　−(−9)→+(+9)</div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:520px;text-align:center;animation:slide-up .5s 1.5s both">
    <span style="font-size:1.5rem;font-weight:900">= −4 −7 −2 + 9 = <b class="hg">−4</b></span>
  </div>
</div>''',
   'narr': '加减混合，第一步把所有减法变身成加法：减正七变成加负七，减负九变成加正九。变身完成后式子变成一串加法，可以省略加号写成省略括号的形式：负四减七减二加九。然后老规矩——同号结合：负四减七减二等于负十三，加九等于负四。'}]},

# ---- 2-05 乘法法则 ----
{'pid': '7a-2-05', 'mind': [('符号规则', '同号得正，异号得负'),
    ('绝对值', '相乘（与加法区分）'),
    ('与 0', '任何数乘 0 得 0'),
    ('多个因数', '负号个数定符号')],
 'concepts': [
  {'title': '✖️ 符号裁判', 'sub': '同号正，异号负', 'html': '''
<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:6px">
  <div class="card" style="background:rgba(52,211,129,.1);border:3px solid rgba(52,211,129,.5);text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:1.1rem;color:#94a3b8">同号</div>
    <div style="font-size:1.7rem;font-weight:900;color:#34d399">(−4)×(−5) = +20</div>
  </div>
  <div class="card" style="background:rgba(244,63,94,.1);border:3px solid rgba(244,63,94,.5);text-align:center;animation:pop-in .5s 1s both">
    <div style="font-size:1.1rem;color:#94a3b8">异号</div>
    <div style="font-size:1.7rem;font-weight:900;color:#fb7185">(−4)×(+5) = −20</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:16px;text-align:center;animation:slide-up .6s 1.7s both">
  <span style="font-size:1rem">口诀：<b class="hgold">同号得正，异号得负，绝对值相乘</b>（符号归符号，数字归数字）</span>
</div>''',
   'narr': '乘法的符号规则比加法痛快：同号得正，异号得负。负四乘负五，同号，正二十；负四乘正五，异号，负二十。注意和加法分开记：乘法看的是同不同号，不比绝对值大小。多个因数连乘时数负号：负号偶数个积为正，奇数个积为负。'},
  {'title': '🎲 数负号', 'sub': '连乘的符号速判', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:500px;text-align:center;animation:pop-in .5s .3s both">
    <span style="font-size:1.6rem;font-weight:800">(−2)×(−3)×(−1)×(+4)</span>
  </div>
  <div style="font-size:1.1rem;color:#fbbf24;animation:fade-in .4s 1s both">↓ 负号有 3 个（奇数）→ 积为负</div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);min-width:500px;text-align:center;animation:slide-up .5s 1.5s both">
    <span style="font-size:1.6rem;font-weight:900;color:#fb7185">= −24</span>
  </div>
</div>''',
   'narr': '连乘的符号有速判法：数负号个数。负二、负三、负一、正四，负号三个，奇数个——积为负；绝对值二乘三乘一乘四得二十四，答案负二十四。负号偶数个积为正，奇数个积为负，一眼定符号再动笔。'}]},

# ---- 2-06 乘法运算律 ----
{'pid': '7a-2-06', 'mind': [('交换结合', '乘法同样适用'),
    ('分配律', 'a(b+c) = ab+ac'),
    ('逆用分配', 'ab+ac = a(b+c) 提公因数'),
    ('凑整', '×5、×25 的好朋友')],
 'concepts': [
  {'title': '🎯 分配律的正用与逆用', 'sub': '一把抓 or 拆开打', 'html': '''
<div style="display:flex;gap:16px;margin-top:6px">
  <div class="card" style="flex:1;background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);animation:slide-up .5s .3s both">
    <b class="hg">正用（拆开打）</b>
    <div style="font-size:1.25rem;font-weight:900;margin-top:8px">4 × (−25 + 18)</div>
    <div style="font-size:1.15rem;color:#a7f3d0;margin-top:4px">= −100 + 72 = −28</div>
  </div>
  <div class="card" style="flex:1;background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);animation:slide-up .5s 1s both">
    <b style="color:#a5b4fc">逆用（一把抓）</b>
    <div style="font-size:1.25rem;font-weight:900;margin-top:8px">−13×7 + 7×13</div>
    <div style="font-size:1.15rem;color:#c7d2fe;margin-top:4px">= 7×(−13+13) = 0</div>
  </div>
</div>''',
   'narr': '分配律两个方向都能用。正用是拆开打：4 乘括号负 25 加 18，四乘进去，负 100 加 72 等于负 28，比先算括号快。逆用是一把抓：负 13 乘 7 加 7 乘 13，公因数 7 提出来，7 乘括号负 13 加 13，括号归零，答案零。见到公因数就想到提，这是简算的第六感。'}]},

# ---- 2-07 倒数与除法 ----
{'pid': '7a-2-07', 'mind': [('倒数', '乘积为 1 的两数'),
    ('除法法则', '除以 = 乘倒数'),
    ('符号', '同号正异号负（同乘法）'),
    ('0 不可除', '除数不能为 0')],
 'concepts': [
  {'title': '🔄 除法转身成乘法', 'sub': '乘以倒数', 'html': '''
<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:500px;text-align:center;animation:pop-in .5s .3s both">
    <span style="font-size:1.7rem;font-weight:800">(−3/4) ÷ (−1/2)</span>
  </div>
  <div style="font-size:1.1rem;color:#fbbf24;animation:fade-in .4s 1s both">↓ 除以 −1/2 = 乘它的倒数 −2</div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:500px;text-align:center;animation:slide-up .5s 1.5s both">
    <span style="font-size:1.6rem;font-weight:900">= (−3/4)×(−2) = <b class="hg">3/2</b></span>
  </div>
</div>
<div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);margin-top:12px;text-align:center;animation:slide-up .5s 2s both">
  <span style="font-size:.95rem;color:#fecdd3">⚠️ 倒数：乘积为 1（−2 的倒数是 <b class="hr">−1/2</b>，负号留住）；<b class="hr">0 没有倒数、不能做除数</b></span>
</div>''',
   'narr': '除法的生存之道：转身变成乘法——除以一个数，等于乘它的倒数。负四分之三除以负二分之一，变成乘负二，同号得正，四分之三乘二等于二分之三。注意倒数的两个细节：负数的倒数带着负号；零没有倒数，也永远不能做除数。'}]},

# ---- 2-08 乘除混合 ----
{'pid': '7a-2-08', 'mind': [('统一乘法', '除法先全部转身'),
    ('从左到右', '同级运算的顺序'),
    ('先定符号', '数负号再算绝对值'),
    ('约分', '变乘后先约分')],
 'concepts': [
  {'title': '🚂 一路乘到底', 'sub': '乘除混合的纪律', 'html': '''
<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:520px;text-align:center;animation:pop-in .5s .3s both">
    <span style="font-size:1.5rem;font-weight:800">(−2)×(−3)÷(−6)×(+1/3)</span>
  </div>
  <div style="font-size:1.05rem;color:#fbbf24;animation:fade-in .4s 1s both">↓ 除以 −6 = 乘 −1/6 → 全是乘法</div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:520px;text-align:center;animation:slide-up .5s 1.5s both">
    <span style="font-size:1.5rem;font-weight:900">负号 3 个 → 负　2×3×1×1/6 = 1 → <b class="hr">−1</b></span>
  </div>
</div>''',
   'narr': '乘除混合的纪律三条：第一，除法全部转身成乘倒数；第二，从左到右顺序不能乱；第三，先数负号定符号，再算绝对值。负二乘负三除负六乘三分之一：负号三个，奇数，积为负；绝对值约分正好是一——负一。'}]},

# ---- 2-09 乘方 ----
{'pid': '7a-2-09', 'mind': [('定义', '相同因数的积'),
    ('符号规律', '负号奇次负、偶次正'),
    ('底数括号', '(−2)⁴ ≠ −2⁴'),
    ('顺序', '先乘方再乘除')],
 'concepts': [
  {'title': '🏗️ 乘方：叠罗汉', 'sub': '相同因数的快捷记法', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-top:14px">
  <div style="text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:2.4rem;font-weight:900"><span style="color:#a5b4fc">2×2×2×2</span></div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:4px">四个 2 相乘</div>
  </div>
  <div style="font-size:2rem;animation:fade-in .4s 1s both">=</div>
  <div style="text-align:center;animation:pop-in .5s 1.4s both">
    <div style="font-size:2.8rem;font-weight:900;color:#34d399">2<span style="font-size:1.4rem;vertical-align:super">4</span></div>
    <div style="font-size:.85rem;color:#94a3b8">底数⁴ 指数 = 16</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:16px;text-align:center;animation:slide-up .6s 2s both">
  <span style="font-size:.98rem">符号规律：(−2)³=−8（奇负）；(−2)⁴=<b class="hg">+16</b>（偶正）——负号奇次负、偶次正</span>
</div>''',
   'narr': '乘方是叠罗汉：四个 2 相乘，记作 2 的四次方，2 是底数，4 是指数，结果 16。符号规律一句话：负底数的奇次幂是负，偶次幂是正——负二的三次方负八，负二的四次方正十六。还有那对老陷阱：括号负二的四次方是正十六，不加括号的负二四次方是负十六，括号决定负号参不参加乘方。'}]},

# ---- 2-10 混合运算顺序 ----
{'pid': '7a-2-10', 'mind': [('三级顺序', '乘方 → 乘除 → 加减'),
    ('括号优先', '小→中→大'),
    ('同级从左到右', '乘除同级、加减同级'),
    ('先定符号', '每步先判符号')],
 'concepts': [
  {'title': '🪜 运算的三级台阶', 'sub': '谁先谁后，铁律', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:16px;flex-wrap:wrap">
  <div style="padding:14px 18px;border-radius:12px;background:rgba(244,63,94,.12);border:2px solid #fb7185;font-weight:800;color:#fda4af;animation:pop-in .4s .3s both">③ 加减</div>
  <div style="font-size:1.4rem;animation:fade-in .3s .8s both">←</div>
  <div style="padding:14px 18px;border-radius:12px;background:rgba(245,158,11,.12);border:2px solid #fbbf24;font-weight:800;color:#fcd34d;animation:pop-in .4s 1.1s both">② 乘除</div>
  <div style="font-size:1.4rem;animation:fade-in .3s 1.6s both">←</div>
  <div style="padding:14px 18px;border-radius:12px;background:rgba(52,211,129,.12);border:2px solid #34d399;font-weight:800;color:#6ee7b7;animation:pop-in .4s 1.9s both">① 乘方</div>
</div>
<div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);margin-top:16px;text-align:center;animation:slide-up .6s 2.5s both">
  <span style="font-size:.98rem;color:#c7d2fe">括号插队：<b style="color:#a5b4fc">小括号 → 中括号 → 大括号</b>，括号内同样按三级走</span>
</div>''',
   'narr': '混合运算的铁律：三级台阶——先乘方，再乘除，后加减。括号是插队凭证，先小括号、再中括号、后大括号，括号里面也按三级走。同级的从左到右。每一步落笔前先判符号，符号对了答案才对。这套顺序，初中三年天天用。'}]},

# ---- 2-11 科学记数法 ----
{'pid': '7a-2-11', 'mind': [('形式', 'a×10ⁿ（1≤a<10）'),
    ('n 的确定', '小数点移动位数'),
    ('大数', 'n = 位数 − 1'),
    ('单位换算', '万=10⁴，亿=10⁸')],
 'concepts': [
  {'title': '🔬 给大数瘦身', 'sub': 'a × 10ⁿ', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:500px;text-align:center;animation:pop-in .5s .3s both">
    <span style="font-size:2rem;font-weight:900">567 000 000</span>
  </div>
  <div style="font-size:1.1rem;color:#fbbf24;animation:fade-in .4s 1s both">↓ 小数点向左挪 8 位</div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:500px;text-align:center;animation:slide-up .5s 1.5s both">
    <span style="font-size:2rem;font-weight:900">5.67 × 10<span style="vertical-align:super;font-size:1.2rem">8</span></span>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:14px;text-align:center;animation:slide-up .6s 2.1s both">
  <span style="font-size:.98rem">a 是一位整数（1≤a＜10）；<b class="hgold">n = 原数位数 − 1</b>（9 位数 → 10⁸）</span>
</div>''',
   'narr': '科学记数法给大数瘦身：写成 a 乘 10 的 n 次方，a 必须是一位整数。五亿六千七百万是九位数，小数点向左挪八位得 5.67，所以是 5.67 乘 10 的八次方。n 怎么定？原数位数减一——九位数就是八次方。单位也别忘了：一万是 10 的四次方，一亿是 10 的八次方。'}]},

# ---- 2-12 近似数 ----
{'pid': '7a-2-12', 'mind': [('准确 vs 近似', '测量的数都是近似'),
    ('精确度', '精确到哪一位'),
    ('四舍五入', '看下一位定去留'),
    ('有效数字', '从首个非零起数')],
 'concepts': [
  {'title': '✂️ 四舍五入到哪位', 'sub': '近似数与精确度', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:520px;text-align:center;animation:pop-in .5s .3s both">
    <span style="font-size:1.7rem;font-weight:900">3.141 59…</span>
  </div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:520px;animation:slide-up .5s 1s both">
    精确到百分位（看千分位 1，舍）→ <b class="hg">3.14</b>
  </div>
  <div class="card" style="background:rgba(245,158,11,.08);border:2px solid rgba(245,158,11,.4);min-width:520px;animation:slide-up .5s 1.6s both">
    精确到十分位（看百分位 4，舍）→ <b class="hgold">3.1</b>
  </div>
</div>''',
   'narr': '近似数的规矩是四舍五入，关键是看精确位的下一位。3.14159 精确到百分位，看千分位是一，舍去，得 3.14；精确到十分位，看百分位是四，也舍，得 3.1。注意 3.1 和 3.10 含义不同：3.10 精确到百分位，末尾的零是有意义的，不能随手划掉。'}]},

# ---- 2-13 进位制 ----
{'pid': '7a-2-13', 'mind': [('十进制', '满十进一，日常用的'),
    ('二进制', '满二进一，计算机语言'),
    ('转换', '二进制→按位值展开'),
    ('规律', '2ⁿ 位值逐位翻倍')],
 'concepts': [
  {'title': '💡 满几进一', 'sub': '进位制的灵魂', 'html': '''
<div style="display:flex;gap:18px;justify-content:center;margin-top:10px">
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:pop-in .5s .3s both">
    <b class="hg">十进制</b><div style="font-size:.9rem;color:#94a3b8;margin-top:4px">满十进一</div>
    <div style="font-size:1.4rem;font-weight:900;margin-top:6px">9 + 1 = 10</div>
  </div>
  <div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.4);text-align:center;animation:pop-in .5s 1s both">
    <b style="color:#a5b4fc">二进制</b><div style="font-size:.9rem;color:#94a3b8;margin-top:4px">满二进一</div>
    <div style="font-size:1.4rem;font-weight:900;margin-top:6px">1 + 1 = 10</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:16px;text-align:center;animation:slide-up .6s 1.7s both">
  <span style="font-size:.98rem">灵魂拷问：二进制的"10"读作<b class="hgold">一零</b>，不是"十"！它代表 2</span>
</div>''',
   'narr': '我们天天用的十进制是满十进一；计算机用的二进制是满二进一。二进制里一加一不是二，而是进位变成一零——注意读作一零，它代表的数量是二。灵魂就一句：满几进一。'},
  {'title': '🔁 二进制 ↔ 十进制', 'sub': '按位值展开', 'html': '''
<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:520px;text-align:center;animation:pop-in .5s .3s both">
    <span style="font-size:1.7rem;font-weight:900">1011<span style="font-size:1rem;color:#94a3b8">（二进制）</span></span>
  </div>
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);min-width:520px;text-align:center;animation:slide-up .5s 1s both">
    <span style="font-size:1.35rem;font-weight:900;color:#c7d2fe">= 1×2³ + 0×2² + 1×2¹ + 1×2⁰</span>
  </div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:520px;text-align:center;animation:slide-up .5s 1.6s both">
    <span style="font-size:1.7rem;font-weight:900">= 8 + 0 + 2 + 1 = <b class="hg">11</b></span>
  </div>
</div>''',
   'narr': '二进制换算成十进制，按位值展开：一一零一，从右往左位值是一、二、四、八，一的地方加起来：八加二加一等于十一。反过来，十进制化二进制就用短除法连续除二取余数。记住这个模型，二进制题就是乘方加法的小练习。'}]},
]

if __name__ == '__main__':
    for spec in C.SPECS:
        C.build(spec)
    print('第二章 13 讲生成完毕')
