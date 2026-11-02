#!/usr/bin/env python3
"""第五章（一元一次方程）7a-5-08 ~ 14：解法总结与应用题七讲。"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import animated_common as C

C.LESSON = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'lessons', '7a-c5.json'), encoding='utf-8'))

C.SPECS = [
# ============ 5-08 一般步骤 ============
{'pid': '7a-5-08', 'mind': [('去分母', '同乘公分母，别漏整数项'),
    ('去括号', '负号、系数乘到每项'),
    ('移项合并', '变号 → 合并同类项'),
    ('系数化为 1', '两边除以系数，验根')],
 'concepts': [
  {'title': '📌 每步的雷区', 'sub': '五步各有一个经典坑', 'html': '''
<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px">
  <div class="card" style="background:rgba(244,63,94,.06);border:2px solid rgba(244,63,94,.3);animation:slide-up .4s .3s both"><b class="hr">① 去分母</b><span style="font-size:.95rem;color:#cbd5e1">　雷区：整数项漏乘公分母</span></div>
  <div class="card" style="background:rgba(245,158,11,.06);border:2px solid rgba(245,158,11,.3);animation:slide-up .4s .8s both"><b class="hgold">② 去括号</b><span style="font-size:.95rem;color:#cbd5e1">　雷区：负号没乘到括号里每一项</span></div>
  <div class="card" style="background:rgba(99,102,241,.06);border:2px solid rgba(99,102,241,.3);animation:slide-up .4s 1.3s both"><b style="color:#a5b4fc">③ 移项</b><span style="font-size:.95rem;color:#cbd5e1">　雷区：过了等号忘变号</span></div>
  <div class="card" style="background:rgba(6,182,212,.06);border:2px solid rgba(6,182,212,.3);animation:slide-up .4s 1.8s both"><b style="color:#67e8f9">④ 合并</b><span style="font-size:.95rem;color:#cbd5e1">　雷区：漏掉散落的同类项</span></div>
  <div class="card" style="background:rgba(52,211,129,.06);border:2px solid rgba(52,211,129,.3);animation:slide-up .4s 2.3s both"><b class="hg">⑤ 系数化 1</b><span style="font-size:.95rem;color:#cbd5e1">　雷区：除以负数丢了符号</span></div>
</div>''',
   'narr': '五步流水线，每一步都埋着一颗雷。去分母的雷是漏乘整数项；去括号的雷是负号没发到每一项；移项的雷是过等号忘变号；合并的雷是漏掉散落的同类项；系数化一的雷是除以负数丢符号。做题时心里过一遍这五颗雷，等于给自己装了个排雷器。'},
  {'title': '🚂 五步流水线', 'sub': '所有一元一次方程通吃', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:18px;flex-wrap:wrap">
  <div style="padding:12px 16px;border-radius:12px;background:rgba(244,63,94,.12);border:2px solid #fb7185;font-weight:800;color:#fda4af;animation:pop-in .4s .3s both">① 去分母</div>
  <div style="animation:fade-in .3s .8s both">→</div>
  <div style="padding:12px 16px;border-radius:12px;background:rgba(245,158,11,.12);border:2px solid #fbbf24;font-weight:800;color:#fcd34d;animation:pop-in .4s 1.1s both">② 去括号</div>
  <div style="animation:fade-in .3s 1.6s both">→</div>
  <div style="padding:12px 16px;border-radius:12px;background:rgba(99,102,241,.12);border:2px solid #818cf8;font-weight:800;color:#a5b4fc;animation:pop-in .4s 1.9s both">③ 移项</div>
  <div style="animation:fade-in .3s 2.4s both">→</div>
  <div style="padding:12px 16px;border-radius:12px;background:rgba(6,182,212,.12);border:2px solid #22d3ee;font-weight:800;color:#67e8f9;animation:pop-in .4s 2.7s both">④ 合并</div>
  <div style="animation:fade-in .3s 3.2s both">→</div>
  <div style="padding:12px 16px;border-radius:12px;background:rgba(52,211,153,.12);border:2px solid #34d399;font-weight:800;color:#6ee7b7;animation:pop-in .4s 3.5s both">⑤ 系数化 1</div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:18px;text-align:center;animation:slide-up .6s 4.1s both">
  <span style="font-size:1rem">口诀：<b class="hgold">去分母、去括号，移项合并化系数</b>——没有分母跳过①，没有括号跳过②</span>
</div>''',
   'narr': '把前几节课串成一条流水线：去分母、去括号、移项、合并、系数化为一。五步顺序不能乱：分母不清没法去括号，括号不清没法移项。灵活点：题目没有分母就跳过第一步，没有括号就跳过第二步，但顺序永远不变。最后把解代回原方程验一下，万无一失。'}]},

# ============ 5-09 列方程五步 ============
{'pid': '7a-5-09', 'mind': [('审', '圈数量、找等量关系'),
    ('设', '设未知数（问谁设谁）'),
    ('列', '把等量关系翻成方程'),
    ('解与验', '解方程 + 代回实际检验')],
 'concepts': [
  {'title': '🗺️ 审设列解验', 'sub': '应用题作战地图', 'html': '''
<div style="display:flex;justify-content:center;gap:10px;margin-top:18px">
  <div style="text-align:center;animation:pop-in .4s .3s both"><div style="width:96px;height:96px;border-radius:50%;background:rgba(244,63,94,.15);border:3px solid #fb7185;display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:900;color:#fda4af">审</div><div style="font-size:.8rem;color:#94a3b8;margin-top:6px">圈数量</div></div>
  <div style="text-align:center;animation:pop-in .4s .9s both"><div style="width:96px;height:96px;border-radius:50%;background:rgba(245,158,11,.15);border:3px solid #fbbf24;display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:900;color:#fcd34d">设</div><div style="font-size:.8rem;color:#94a3b8;margin-top:6px">设未知数</div></div>
  <div style="text-align:center;animation:pop-in .4s 1.5s both"><div style="width:96px;height:96px;border-radius:50%;background:rgba(99,102,241,.15);border:3px solid #818cf8;display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:900;color:#a5b4fc">列</div><div style="font-size:.8rem;color:#94a3b8;margin-top:6px">翻成方程</div></div>
  <div style="text-align:center;animation:pop-in .4s 2.1s both"><div style="width:96px;height:96px;border-radius:50%;background:rgba(6,182,212,.15);border:3px solid #22d3ee;display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:900;color:#67e8f9">解</div><div style="font-size:.8rem;color:#94a3b8;margin-top:6px">五步流水线</div></div>
  <div style="text-align:center;animation:pop-in .4s 2.7s both"><div style="width:96px;height:96px;border-radius:50%;background:rgba(52,211,153,.15);border:3px solid #34d399;display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:900;color:#6ee7b7">验</div><div style="font-size:.8rem;color:#94a3b8;margin-top:6px">代回实际</div></div>
</div>''',
   'narr': '应用题有张固定作战地图，五个字：审、设、列、解、验。审——把题目里的数量都圈出来，找到等量关系；设——问谁设谁为 x；列——把等量关系翻译成方程；解——用五步流水线解出来；验——代回题目看合不合理。应用题的分数，一半在这张地图上。'},
  {'title': '🔎 等量关系藏在这些词里', 'sub': '翻译题眼', 'html': '''
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);animation:slide-up .5s .3s both"><span style="font-size:.98rem">"<b>共</b>计 80" → 甲 + 乙 = 80</span></div>
  <div class="card" style="background:rgba(245,158,11,.08);border:2px solid rgba(245,158,11,.4);animation:slide-up .5s .8s both"><span style="font-size:.98rem">"<b>比…多</b> 5" → 乙 = 甲 + 5</span></div>
  <div class="card" style="background:rgba(6,182,212,.08);border:2px solid rgba(6,182,212,.4);animation:slide-up .5s 1.3s both"><span style="font-size:.98rem">"<b>是</b>…的 3 倍" → 乙 = 3×甲</span></div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);animation:slide-up .5s 1.8s both"><span style="font-size:.98rem">"<b>剩下</b> 20" → 总 − 用掉 = 20</span></div>
</div>''',
   'narr': '等量关系都藏在题眼词里。看到"共"，就是两部分相加；看到"比谁多"，就是等于它加差；看到"是谁的几倍"，就是乘；看到"剩下"，就是总量减用掉的。把这些词圈出来，等式几乎是白送的。'}]},

# ============ 5-10 和差倍分与数字 ============
{'pid': '7a-5-10', 'mind': [('线段图', '把关系画出来'),
    ('设一倍量', '"是 3 倍"就设它为 x'),
    ('和差列式', '各段加起来 = 总'),
    ('数字问题', '两位数 = 10a + b')],
 'concepts': [
  {'title': '📏 线段图：一画就清楚', 'sub': '和倍问题可视化', 'html': '''
<svg width="700" height="190" viewBox="0 0 700 190" style="display:block;margin:0 auto">
  <text x="60" y="40" fill="#a5b4fc" font-size="15" font-weight="700">乙</text>
  <rect x="90" y="26" width="100" height="26" rx="6" fill="rgba(99,102,241,.3)" stroke="#818cf8" stroke-width="2" style="animation:pop-in .5s .4s both"/>
  <text x="140" y="45" text-anchor="middle" fill="#a5b4fc" font-size="14" font-weight="800">x</text>
  <text x="60" y="100" fill="#6ee7b7" font-size="15" font-weight="700">甲</text>
  <rect x="90" y="86" width="400" height="26" rx="6" fill="rgba(52,211,153,.25)" stroke="#34d399" stroke-width="2" style="animation:pop-in .5s .9s both"/>
  <text x="290" y="105" text-anchor="middle" fill="#6ee7b7" font-size="14" font-weight="800">3x（乙的 3 倍）</text>
  <path d="M90 140 L490 140" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="8 6" style="animation:fade-in .5s 1.6s both"/>
  <text x="290" y="165" text-anchor="middle" fill="#fbbf24" font-size="15" font-weight="800" style="animation:fade-in .5s 1.6s both">合起来 = 80　→　x + 3x = 80</text>
</svg>''',
   'narr': '和倍问题先画线段图。乙是一倍量，画一小段设为 x；甲是乙的三倍，就画三段那么长，标 3x。题目说合起来是 80，一条虚线括起全长——方程自己蹦出来了：x 加 3x 等于 80。线段图是把文字翻译成数学的翻译机。'},
  {'title': '🔢 两位数的秘密', 'sub': '10a + b', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-top:16px">
  <div style="text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:2.6rem;font-weight:900;letter-spacing:2px"><span style="color:#fbbf24">4</span><span style="color:#34d399">7</span></div>
    <div style="font-size:.8rem;color:#94a3b8">两位数</div>
  </div>
  <div style="font-size:2rem;animation:fade-in .4s 1s both">=</div>
  <div style="text-align:center;animation:pop-in .5s 1.4s both">
    <div style="font-size:1.6rem;font-weight:900;color:#fbbf24">10 × 4</div>
    <div style="font-size:.8rem;color:#94a3b8">十位×10</div>
  </div>
  <div style="font-size:2rem;animation:fade-in .4s 1.9s both">+</div>
  <div style="text-align:center;animation:pop-in .5s 2.2s both">
    <div style="font-size:1.6rem;font-weight:900;color:#34d399">7</div>
    <div style="font-size:.8rem;color:#94a3b8">个位</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:16px;text-align:center;animation:slide-up .6s 2.8s both">
  <span style="font-size:1rem">十位是 a、个位是 b 的两位数 = <b class="hgold">10a + b</b>；数字对调 = 10b + a</span>
</div>''',
   'narr': '数字问题有个固定公式：十位是 a、个位是 b 的两位数，等于 10a 加 b。47 等于 10 乘 4 加 7。要是把数字对调，就是 10b 加 a。题里说"对调后增大了"，两个一减，方程就来了。'}]},

# ============ 5-11 行程问题 ============
{'pid': '7a-5-11', 'mind': [('基本关系', '路程 = 速度 × 时间'),
    ('相遇', '甲走的 + 乙走的 = 全程'),
    ('追及', '快走的 − 慢走的 = 初始差'),
    ('画线段图', '行程题的第一步')],
 'concepts': [
  {'title': '🚗 相遇：一起铺完这条路', 'sub': '相向而行的等量关系', 'html': '''
<svg width="740" height="160" viewBox="0 0 740 160" style="display:block;margin:0 auto">
  <line x1="50" y1="80" x2="690" y2="80" stroke="#94a3b8" stroke-width="3"/>
  <circle cx="60" cy="80" r="7" fill="#34d399" style="animation:pop-in .4s .3s both"/><text x="60" y="55" text-anchor="middle" fill="#34d399" font-size="13" font-weight="700">甲</text>
  <circle cx="680" cy="80" r="7" fill="#a5b4fc" style="animation:pop-in .4s .3s both"/><text x="680" y="55" text-anchor="middle" fill="#a5b4fc" font-size="13" font-weight="700">乙</text>
  <path d="M70 80 L300 80" stroke="#34d399" stroke-width="8" stroke-linecap="round" opacity=".8" style="animation:mindmap-line .8s 1s forwards;opacity:0"/>
  <text x="185" y="115" text-anchor="middle" fill="#34d399" font-size="13" font-weight="700" style="opacity:0;animation:fade-in .5s 1.5s both">甲走的：v₁t</text>
  <path d="M670 80 L440 80" stroke="#a5b4fc" stroke-width="8" stroke-linecap="round" opacity=".8" style="animation:mindmap-line .8s 1.3s forwards;opacity:0"/>
  <text x="555" y="115" text-anchor="middle" fill="#a5b4fc" font-size="13" font-weight="700" style="opacity:0;animation:fade-in .5s 1.8s both">乙走的：v₂t</text>
  <text x="370" y="45" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="800" style="opacity:0;animation:fade-in .6s 2.3s both">v₁t + v₂t = 全程（甲铺的 + 乙铺的 = 全长）</text>
</svg>''',
   'narr': '行程问题第一步永远是画线段图。相遇问题：甲从这头、乙从那头，相向而行，最后碰面。把路想成一条要铺的轨道：甲铺了一段，乙铺了一段，两人铺的加起来正好是全程——v1t 加 v2t 等于全程。这就是相遇问题的等量关系。'},
  {'title': '🏃 追及：多追的那段路', 'sub': '同向而行', 'html': '''
<svg width="740" height="150" viewBox="0 0 740 150" style="display:block;margin:0 auto">
  <line x1="50" y1="90" x2="690" y2="90" stroke="#94a3b8" stroke-width="3"/>
  <circle cx="60" cy="90" r="7" fill="#fbbf24" style="animation:pop-in .4s .3s both"/><text x="60" y="65" text-anchor="middle" fill="#fbbf24" font-size="13" font-weight="700">快者</text>
  <circle cx="300" cy="90" r="7" fill="#fb7185" style="animation:pop-in .4s .6s both"/><text x="300" y="65" text-anchor="middle" fill="#fb7185" font-size="13" font-weight="700">慢者（先出发/在前）</text>
  <path d="M70 90 L620 90" stroke="#fbbf24" stroke-width="7" stroke-linecap="round" style="opacity:0;animation:mindmap-line .8s 1.2s forwards"/>
  <path d="M310 90 L530 90" stroke="#fb7185" stroke-width="7" stroke-linecap="round" style="opacity:0;animation:mindmap-line .8s 1.5s forwards"/>
  <path d="M70 120 L300 120" stroke="#34d399" stroke-width="3" stroke-dasharray="6 5" style="opacity:0;animation:fade-in .5s 2.1s both"/>
  <text x="370" y="140" text-anchor="middle" fill="#34d399" font-size="13.5" font-weight="800" style="opacity:0;animation:fade-in .5s 2.1s both">快走的 − 慢走的 = 开始时两人的差距</text>
</svg>''',
   'narr': '追及问题换一个关系：同向而行，快的在后面追慢的。追上时，快者走的总路，减去慢者走的路，正好等于出发时两人之间的差距。记住这句：快走的减慢走的等于初始距离。配上 v 等于 s 除以 t 的铁三角，行程题就是画图、套关系、解方程。'}]},

# ============ 5-12 工程问题 ============
{'pid': '7a-5-12', 'mind': [('总量设 1', '一件工程 = 1'),
    ('工作效率', '1 ÷ 天数 = 每天完成几分之几'),
    ('合作', '效率和 × 时间 = 1'),
    ('单位统一', '各自效率分母通分')],
 'concepts': [
  {'title': '🏗️ 看不见的工程，总量是 1', 'sub': '工程问题的魔法设定', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-top:14px">
  <div style="text-align:center;animation:pop-in .5s .3s both">
    <div style="width:130px;height:80px;border-radius:14px;background:rgba(251,191,36,.15);border:3px solid #fbbf24;display:flex;align-items:center;justify-content:center;font-size:2.4rem;font-weight:900;color:#fbbf24">1</div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:6px">整件工程</div>
  </div>
  <div style="font-size:1.8rem;animation:fade-in .4s 1s both">=</div>
  <div style="text-align:center;animation:pop-in .5s 1.4s both">
    <div style="display:flex;gap:6px">
      <div style="width:26px;height:80px;border-radius:6px;background:rgba(52,211,153,.4)"></div>
      <div style="width:26px;height:80px;border-radius:6px;background:rgba(52,211,153,.4)"></div>
      <div style="width:26px;height:80px;border-radius:6px;background:rgba(52,211,153,.4)"></div>
      <div style="width:26px;height:80px;border-radius:6px;background:rgba(52,211,153,.4)"></div>
      <div style="width:26px;height:80px;border-radius:6px;background:rgba(52,211,153,.4)"></div>
    </div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:6px">甲 5 天做完 → 每天 1/5</div>
  </div>
</div>''',
   'narr': '工程问题有个魔法设定：不知道工程具体多大，干脆把总量设为 1。甲 5 天做完，每天就完成五分之一——这叫工作效率。工程除以天数，等于每天干多少。有了 1 和效率，一切都好办了。'},
  {'title': '🤝 合作：效率相加', 'sub': '一起干，快得很', 'html': '''
<div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:slide-up .6s .3s both">
  <div style="font-size:1.5rem;font-weight:900;line-height:2">甲效率 1/6 + 乙效率 1/12 = 1/4（合作效率）</div>
  <div style="font-size:1.2rem;font-weight:800;color:#34d399">合作效率 × 天数 = 1　→　1/4 × x = 1 → x = 4 天</div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:14px;text-align:center;animation:slide-up .6s 1.2s both">
  <span style="font-size:.98rem">口诀：<b class="hgold">总量设 1，效率倒数，合作相加，乘时间 = 1</b></span>
</div>''',
   'narr': '两人合作怎么办？效率相加。甲六天做完效率六分之一，乙十二天做完效率十二分之一，合作效率四分之一。合作效率乘时间等于总量 1，四分之一乘 x 等于 1，x 等于 4 天。口诀：总量设一，效率倒数，合作相加，乘时间等于一。'}]},

# ============ 5-13 销售盈亏 ============
{'pid': '7a-5-13', 'mind': [('利润', '售价 − 进价'),
    ('利润率', '利润 ÷ 进价 × 100%'),
    ('打折', '售价 = 标价 × 折扣'),
    ('盈亏判断', '售价 vs 进价 定输赢')],
 'concepts': [
  {'title': '💰 三个价一台戏', 'sub': '进价 · 标价 · 售价', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-top:16px;flex-wrap:wrap">
  <div style="text-align:center;animation:pop-in .5s .3s both"><div style="padding:14px 18px;border-radius:14px;background:rgba(99,102,241,.12);border:2px solid #818cf8;font-size:1.2rem;font-weight:800;color:#a5b4fc">进价</div><div style="font-size:.8rem;color:#94a3b8;margin-top:4px">花钱进的货</div></div>
  <div style="animation:fade-in .3s .8s both">→</div>
  <div style="text-align:center;animation:pop-in .5s 1.1s both"><div style="padding:14px 18px;border-radius:14px;background:rgba(251,191,36,.12);border:2px solid #fbbf24;font-size:1.2rem;font-weight:800;color:#fcd34d">标价 × 折扣</div><div style="font-size:.8rem;color:#94a3b8;margin-top:4px">打折后</div></div>
  <div style="animation:fade-in .3s 1.6s both">→</div>
  <div style="text-align:center;animation:pop-in .5s 1.9s both"><div style="padding:14px 18px;border-radius:14px;background:rgba(52,211,153,.12);border:2px solid #34d399;font-size:1.2rem;font-weight:800;color:#6ee7b7">售价</div><div style="font-size:.8rem;color:#94a3b8;margin-top:4px">实际卖出</div></div>
</div>
<div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);margin-top:16px;text-align:center;animation:slide-up .6s 2.5s both">
  <span style="font-size:1.05rem;color:#fecdd3"><b class="hr">利润 = 售价 − 进价</b>　正数赚、负数亏、零是白忙</span>
</div>''',
   'narr': '销售问题就三个价：进价，花钱进的货；标价打折之后是售价，实际卖出去的钱；利润，售价减进价。这个差是正数就赚了，负数就亏了，零就白忙一场。所有盈亏题，最后都回到这一减。'},
  {'title': '🏷️ 打折与利润率', 'sub': '两个常用公式', 'html': '''
<div style="display:flex;gap:16px;margin-top:6px">
  <div class="card" style="flex:1;background:rgba(251,191,36,.08);border:2px solid rgba(251,191,36,.4);text-align:center;animation:slide-up .5s .3s both">
    <b class="hgold">打折</b>
    <div style="font-size:1.35rem;font-weight:900;margin-top:8px">售价 = 标价 × 折扣</div>
    <div style="font-size:.9rem;color:#94a3b8;margin-top:6px">"8 折"就是 × 0.8</div>
  </div>
  <div class="card" style="flex:1;background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:slide-up .5s 1s both">
    <b class="hg">利润率</b>
    <div style="font-size:1.35rem;font-weight:900;margin-top:8px">利润 ÷ 进价 × 100%</div>
    <div style="font-size:.9rem;color:#94a3b8;margin-top:6px">注意：除的是进价，不是售价</div>
  </div>
</div>''',
   'narr': '两个公式常伴左右。打折：售价等于标价乘折扣，八折就是乘 0.8。利润率：利润除以进价乘百分之百——注意分母是进价不是售价，这是最常见的坑。题目说"利润率百分之二十"，就是利润等于进价乘 0.2，等量关系立好了。'}]},

# ============ 5-14 分段计费与方案 ============
{'pid': '7a-5-14', 'mind': [('先判断段位', '用量落在哪一档'),
    ('分段计算', '各段单价 × 各段用量'),
    ('方案比较', '找两方案相等的临界点'),
    ('答完检验', '代回分界核对')],
 'concepts': [
  {'title': '🪜 台阶价目表', 'sub': '分段计费的样子', 'html': '''
<svg width="660" height="200" viewBox="0 0 660 200" style="display:block;margin:0 auto">
  <line x1="70" y1="160" x2="620" y2="160" stroke="#94a3b8" stroke-width="2.5"/>
  <line x1="70" y1="160" x2="70" y2="20" stroke="#94a3b8" stroke-width="2.5"/>
  <rect x="70" y="120" width="140" height="40" fill="rgba(52,211,153,.5)" style="animation:pop-in .4s .3s both"/>
  <rect x="210" y="80" width="140" height="80" fill="rgba(251,191,36,.45)" style="animation:pop-in .4s .9s both"/>
  <rect x="350" y="30" width="140" height="130" fill="rgba(244,63,94,.4)" style="animation:pop-in .4s 1.5s both"/>
  <g font-size="12.5" text-anchor="middle" fill="#94a3b8">
    <text x="140" y="180">0~10 度</text><text x="280" y="180">11~20 度</text><text x="420" y="180">20 度以上</text>
  </g>
  <text x="140" y="140" text-anchor="middle" fill="#0f172a" font-size="12" font-weight="800">便宜</text>
  <text x="280" y="105" text-anchor="middle" fill="#0f172a" font-size="12" font-weight="800">中档</text>
  <text x="420" y="60" text-anchor="middle" fill="#0f172a" font-size="12" font-weight="800">最贵</text>
</svg>''',
   'narr': '分段计费就像台阶价目表：用得越多，超出部分的单价越贵。第一档十度以内便宜，第二档十一到二十度贵一点，超过二十度最贵。关键认知：不是全部用量都按最高价算，而是各段按各段的单价——超出的部分才进下一档。'},
  {'title': '✂️ 分段算，再相加', 'sub': '例：用 26 度怎么算', 'html': '''
<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);min-width:520px;animation:slide-up .5s .3s both">
    第一档 10 度 × 0.5 元 = 5 元
  </div>
  <div class="card" style="background:rgba(251,191,36,.08);border:2px solid rgba(251,191,36,.4);min-width:520px;animation:slide-up .5s .9s both">
    第二档 10 度 × 0.8 元 = 8 元
  </div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);min-width:520px;animation:slide-up .5s 1.5s both">
    第三档 6 度 × 1.2 元 = 7.2 元
  </div>
  <div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.5);min-width:520px;text-align:center;animation:pop-in .5s 2.2s both">
    <b style="color:#a5b4fc">合计</b>　<span style="font-size:1.5rem;font-weight:900">5 + 8 + 7.2 = 20.2 元</span>
  </div>
</div>''',
   'narr': '用 26 度怎么算？剪成三段：第一档满打满算 10 度，乘单价 0.5 是 5 元；第二档又是 10 度，乘 0.8 是 8 元；剩下 6 度进第三档，乘 1.2 是 7.2 元。三段相加，20.2 元。方案选择题也一样：先找两个方案相等的临界点，再分便宜区间作答。'}]},
]

if __name__ == '__main__':
    for spec in C.SPECS:
        C.build(spec)
    print('第五章 08-14 生成完毕')
