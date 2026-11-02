#!/usr/bin/env python3
"""第六章（几何图形初步）7a-6-09 ~ 15：角的世界。"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import animated_common as C

C.LESSON = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'lessons', '7a-c6.json'), encoding='utf-8'))

C.SPECS = [
# ============ 6-09 角的概念与表示 ============
{'pid': '7a-6-09', 'mind': [('角的本质', '一个顶点 + 两条射线'),
    ('旋转定义', '射线绕端点旋转而成'),
    ('四种表示', '∠AOB / ∠O / ∠1 / ∠α'),
    ('平角周角', '旋转 180° / 360°')],
 'concepts': [
  {'title': '🎡 射线转出来的角', 'sub': '动态定义', 'html': '''
<svg width="560" height="220" viewBox="0 0 560 220" style="display:block;margin:0 auto">
  <circle cx="180" cy="170" r="7" fill="#fbbf24"/>
  <text x="180" y="200" fill="#fbbf24" font-size="14" font-weight="800">O</text>
  <line x1="187" y1="170" x2="330" y2="170" stroke="#34d399" stroke-width="3.5" style="animation:mindmap-line .6s .3s forwards;opacity:0"/>
  <path d="M187 170 L300 80" stroke="#818cf8" stroke-width="3.5" style="opacity:0;animation:mindmap-line .8s 1.2s forwards"/>
  <path d="M250 170 A70 70 0 0 0 232 122" fill="none" stroke="#fb7185" stroke-width="3" marker-end="url(#ar)" style="opacity:0;animation:fade-in .6s 1.9s both"/>
  <defs><marker id="ar" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#fb7185"/></marker></defs>
  <text x="290" y="150" fill="#fb7185" font-size="13" font-weight="700">旋转</text>
  <text x="420" y="90" fill="#a5b4fc" font-size="14" font-weight="700">终边</text>
  <text x="330" y="195" fill="#6ee7b7" font-size="14" font-weight="700">始边</text>
</svg>''',
   'narr': '角有两种理解。静态看：一个顶点引出两条射线。动态看更有意思——一条射线绕着端点旋转，从始边转到终边，扫过的区域就是角。转的幅度越大角越大，跟两边画多长没有关系。'},
  {'title': '📛 四种称呼', 'sub': '角的表示法', 'html': '''
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);text-align:center;animation:pop-in .4s .3s both"><b style="color:#a5b4fc">三个字母</b>　∠AOB（顶点 O 放中间）</div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:pop-in .4s .8s both"><b class="hg">一个字母</b>　∠O（只有一个角时才可）</div>
  <div class="card" style="background:rgba(245,158,11,.08);border:2px solid rgba(245,158,11,.4);text-align:center;animation:pop-in .4s 1.3s both"><b class="hgold">数字</b>　∠1</div>
  <div class="card" style="background:rgba(6,182,212,.08);border:2px solid rgba(6,182,212,.4);text-align:center;animation:pop-in .4s 1.8s both"><b style="color:#67e8f9">希腊字母</b>　∠α</div>
</div>
<div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);margin-top:14px;text-align:center;animation:slide-up .5s 2.3s both">
  <span style="font-size:.95rem;color:#fecdd3">⚠️ 顶点处有好几个角时，<b>必须</b>用三字母或数字，单字母会指代不清</span>
</div>''',
   'narr': '角的四种称呼：三个字母，顶点放中间，角 AOB；单独一个字母，只有在顶点处只有这一个角时才能用；还可以标数字角 1，或希腊字母角阿尔法。顶点处挤着好几个角时千万别偷懒用单字母——到底指哪个，没人知道。'}]},

# ============ 6-10 角的度量与换算 ============
{'pid': '7a-6-10', 'mind': [('度量工具', '量角器：对中、对边、读数'),
    ('度分秒', '1° = 60′，1′ = 60″'),
    ('六十进制', '跟时间一样借一当六十'),
    ('换算方向', '度化分秒乘 60，反之除')],
 'concepts': [
  {'title': '⏰ 角的时间制', 'sub': '度分秒是 60 进制', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:18px;margin-top:14px">
  <div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.4);text-align:center;animation:pop-in .4s .3s both"><div style="font-size:2rem;font-weight:900;color:#a5b4fc">1°</div><div style="font-size:.8rem;color:#94a3b8">度</div></div>
  <div style="font-size:1.5rem;animation:fade-in .3s .8s both">= 60′</div>
  <div class="card" style="background:rgba(245,158,11,.1);border:2px solid rgba(245,158,11,.4);text-align:center;animation:pop-in .4s 1.1s both"><div style="font-size:2rem;font-weight:900;color:#fcd34d">1′</div><div style="font-size:.8rem;color:#94a3b8">分</div></div>
  <div style="font-size:1.5rem;animation:fade-in .3s 1.6s both">= 60″</div>
  <div class="card" style="background:rgba(52,211,129,.1);border:2px solid rgba(52,211,129,.4);text-align:center;animation:pop-in .4s 1.9s both"><div style="font-size:2rem;font-weight:900;color:#6ee7b7">1″</div><div style="font-size:.8rem;color:#94a3b8">秒</div></div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:16px;text-align:center;animation:slide-up .5s 2.4s both">
  <span style="font-size:1rem">跟时间一模一样：<b class="hgold">借一当六十</b>——0.5° = 30′；90′ = 1.5°</span>
</div>''',
   'narr': '角的度量用的是"时间制"：一度等于六十分，一分等于六十秒，借一当六十。零点五度就是三十分；九十分反过来是一点五度。跟钟表的时分秒一个脾气，会看时间就会换算角度。'},
  {'title': '📐 量角器三步曲', 'sub': '对中、对边、读数', 'html': '''
<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:460px;animation:slide-up .4s .3s both"><b class="hgold">① 对中</b>：量角器中心对准角的顶点</div>
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:460px;animation:slide-up .4s .9s both"><b class="hg">② 对边</b>：0° 刻度线与角的一条边重合</div>
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:460px;animation:slide-up .4s 1.5s both"><b style="color:#a5b4fc">③ 读数</b>：另一条边对着几，就是几度（分清内外圈）</div>
</div>''',
   'narr': '量角三步曲：对中，量角器的中心对准顶点；对边，零度刻度线贴住角的一条边；读数，看另一条边落在哪条刻度上。读数前先瞄一眼你用的是内圈还是外圈——从零那边顺着数，就不会读反。'}]},

# ============ 6-11 方向角 ============
{'pid': '7a-6-11', 'mind': [('基准', '从正北或正南起算'),
    ('偏转', '向东或向西偏多少度'),
    ('写法', '北偏东 30° 类'),
    ('特殊角', '东北 = 北偏东 45°')],
 'concepts': [
  {'title': '🧭 八方罗盘', 'sub': '方向角的语言', 'html': '''
<svg width="420" height="420" viewBox="0 0 420 420" style="display:block;margin:0 auto;max-height:52vh">
  <circle cx="210" cy="210" r="160" fill="none" stroke="#94a3b8" stroke-width="2"/>
  <line x1="210" y1="30" x2="210" y2="390" stroke="#94a3b8" stroke-width="2"/><line x1="30" y1="210" x2="390" y2="210" stroke="#94a3b8" stroke-width="2"/>
  <g font-size="16" font-weight="800">
    <text x="210" y="22" text-anchor="middle" fill="#fbbf24">北</text>
    <text x="210" y="412" text-anchor="middle" fill="#34d399">南</text>
    <text x="10" y="216" fill="#818cf8">西</text>
    <text x="404" y="216" fill="#fb7185">东</text>
    <text x="362" y="62" fill="#94a3b8" font-size="13">东北</text>
    <text x="40" y="62" fill="#94a3b8" font-size="13">西北</text>
    <text x="362" y="372" fill="#94a3b8" font-size="13">东南</text>
    <text x="40" y="372" fill="#94a3b8" font-size="13">西南</text>
  </g>
  <line x1="210" y1="210" x2="330" y2="90" stroke="#fbbf24" stroke-width="3" style="animation:pop-in .5s 1s both"/>
  <path d="M230 190 A48 48 0 0 1 248 172" fill="none" stroke="#fbbf24" stroke-width="2.5" style="animation:fade-in .5s 1.6s both"/>
  <text x="255" y="155" fill="#fbbf24" font-size="13.5" font-weight="800" style="animation:fade-in .5s 1.9s both">北偏东 45°</text>
</svg>''',
   'narr': '方向角是航海家的语言：永远从正北或正南出发说，再向东或向西偏多少度。比如北偏东四十五度，就是从正北往东转四十五度——正好落在东北方向。注意不能说"东偏北"：基准必须是南北，这是约定。'},
  {'title': '🎯 现场报方位', 'sub': '读图训练', 'html': '''
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);animation:slide-up .4s .3s both"><span style="font-size:.95rem">从正南往东 30° → <b class="hg">南偏东 30°</b></span></div>
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);animation:slide-up .4s .8s both"><span style="font-size:.95rem">从正西往北 25° → <b class="hr">✗ 应写成南偏西 65°</b> 或 <b class="hg">北偏西 65°</b>？基准须南北</span></div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:14px;text-align:center;animation:slide-up .5s 1.4s both">
  <span style="font-size:.95rem">口诀：<b class="hgold">南北打头，向东/西偏转</b>；东北=北偏东45°，西北=北偏西45°</span>
</div>''',
   'narr': '报方位的口诀：南北打头，向东或向西偏转。南偏东三十度，就是从正南往东转三十度，合法。但"西偏北二十五度"是违规的——基准必须是南北方向。四个特殊方位记牢：东北就是北偏东四十五度，西北就是北偏西四十五度。'}]},

# ============ 6-12 角的比较与和差 ============
{'pid': '7a-6-12', 'mind': [('叠合法', '顶点重合、一边对齐'),
    ('角的和差', '∠AOC = ∠AOB + ∠BOC'),
    ('角在角内', '大角 = 小角 + 余下'),
    ('数量思想', '把图翻译成等式')],
 'concepts': [
  {'title': '⚔️ 角的比武', 'sub': '叠合法', 'html': '''
<svg width="620" height="200" viewBox="0 0 620 200" style="display:block;margin:0 auto">
  <circle cx="160" cy="160" r="6" fill="#fbbf24"/><text x="160" y="186" fill="#fbbf24" font-size="14" font-weight="800">O</text>
  <line x1="166" y1="160" x2="380" y2="160" stroke="#34d399" stroke-width="3.5"/>
  <line x1="166" y1="160" x2="330" y2="50" stroke="#818cf8" stroke-width="3.5" style="opacity:0;animation:mindmap-line .7s .6s forwards"/>
  <path d="M220 160 A56 56 0 0 0 208 125" fill="none" stroke="#818cf8" stroke-width="2.5" style="opacity:0;animation:fade-in .5s 1.2s both"/>
  <line x1="166" y1="160" x2="540" y2="95" stroke="#fb7185" stroke-width="3.5" style="opacity:0;animation:mindmap-line .7s 1.8s forwards"/>
  <path d="M240 160 A76 76 0 0 0 244 118" fill="none" stroke="#fb7185" stroke-width="2.5" style="opacity:0;animation:fade-in .5s 2.3s both"/>
  <text x="390" y="80" fill="#fb7185" font-size="13.5" font-weight="700">角 2 开口更大 → ∠2 ＞ ∠1</text>
</svg>''',
   'narr': '比较角的大小也用叠合法：顶点 O 重合，一条边对齐，看另一条边张开的角度——张得越开，角越大。注意比的是张开的程度，跟两边画多长完全无关，把边延长十倍，角还是那个角。'},
  {'title': '➕ 角的和差', 'sub': '图变等式', 'html': '''
<div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:slide-up .5s .3s both">
  <div style="font-size:1.5rem;font-weight:900;line-height:2">OC 在 ∠AOB 内部：<br/>∠AOB = ∠AOC + ∠COB</div>
</div>
<div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);margin-top:14px;text-align:center;animation:slide-up .5s 1s both">
  <span style="font-size:.98rem;color:#c7d2fe">几何题核心动作：<b class="hgold">把图上的关系翻译成等式</b>，再用代数求解</span>
</div>''',
   'narr': '角的和差，本质是把图翻译成等式。射线 OC 在角 AOB 内部，那么角 AOB 就等于角 AOC 加角 COB——大角等于两小角之和。反过来，角 AOC 等于角 AOB 减角 COB。从这一刻起，几何和代数开始合流：图变等式，等式解图。'}]},

# ============ 6-13 角平分线 ============
{'pid': '7a-6-13', 'mind': [('定义', '把角分成相等的两半'),
    ('数量关系', '∠AOC = ∠BOC = ½∠AOB'),
    ('判定', '反过来成立'),
    ('双平分线', '相邻两角平分线夹 ½ 和')],
 'concepts': [
  {'title': '⚖️ 从正中间劈开', 'sub': '角平分线', 'html': '''
<svg width="620" height="210" viewBox="0 0 620 210" style="display:block;margin:0 auto">
  <circle cx="160" cy="180" r="6" fill="#fbbf24"/><text x="160" y="205" fill="#fbbf24" font-size="14" font-weight="800">O</text>
  <line x1="166" y1="180" x2="480" y2="180" stroke="#34d399" stroke-width="3.5"/>
  <text x="490" y="185" fill="#34d399" font-size="14" font-weight="800">B</text>
  <line x1="166" y1="180" x2="330" y2="35" stroke="#34d399" stroke-width="3.5"/>
  <text x="338" y="32" fill="#34d399" font-size="14" font-weight="800">A</text>
  <line x1="166" y1="180" x2="420" y2="100" stroke="#fbbf24" stroke-width="4" style="opacity:0;animation:mindmap-line .9s 1.2s forwards"/>
  <text x="428" y="98" fill="#fbbf24" font-size="14" font-weight="800">C</text>
  <path d="M230 180 A64 64 0 0 0 218 145" fill="none" stroke="#818cf8" stroke-width="2.5" style="opacity:0;animation:fade-in .5s 1.9s both"/>
  <path d="M262 180 A96 96 0 0 0 258 148" fill="none" stroke="#fb7185" stroke-width="2.5" style="opacity:0;animation:fade-in .5s 2.1s both"/>
  <text x="330" y="150" fill="#fbbf24" font-size="14" font-weight="800" style="opacity:0;animation:fade-in .6s 2.5s both">OC 平分 → ∠AOC = ∠COB = ½∠AOB</text>
</svg>''',
   'narr': '角平分线：从顶点出发的一条射线，把角从正中间劈成相等的两半。见到"OC 平分角 AOB"，立刻写出黄金三等式：角 AOC 等于角 COB，都等于角 AOB 的一半；角 AOB 等于两倍的角 AOC。和线段中点一样，平分线就是角世界的中点。'},
  {'title': '🪄 双平分线魔法', 'sub': '相邻两角的平分线', 'html': '''
<div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:slide-up .5s .3s both">
  <div style="font-size:1.25rem;font-weight:900;line-height:2.1">∠AOB 与 ∠BOC 相邻，OM、ON 分别平分它们<br/>∠MON = ½(∠AOB + ∠BOC) = ½∠AOC</div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:14px;text-align:center;animation:slide-up .5s 1s both">
  <span style="font-size:.95rem">两个角的具体大小<b class="hgold">不用知道</b>——整体一半的思想又来了</span>
</div>''',
   'narr': '双平分线模型是几何里的小魔法：角 AOB 和角 BOC 相邻，OM 平分左边，ON 平分右边，那么角 MON 恒等于两个角之和的一半，也就是角 AOC 的一半。两个角各自多大根本不用知道——又是整体代换的思想，跟线段双中点一脉相承。'}]},

# ============ 6-14 余角和补角 ============
{'pid': '7a-6-14', 'mind': [('余角', '和为 90°'),
    ('补角', '和为 180°'),
    ('同角性质', '同角/等角的余角相等'),
    ('余补共存', '一个角可同时有余有补')],
 'concepts': [
  {'title': '🧩 拼直角与拼平角', 'sub': '余角与补角', 'html': '''
<div style="display:flex;gap:24px;justify-content:center;margin-top:6px">
  <div style="text-align:center;animation:pop-in .5s .3s both">
    <svg width="230" height="150" viewBox="0 0 230 150">
      <line x1="30" y1="130" x2="200" y2="130" stroke="#94a3b8" stroke-width="3"/>
      <line x1="30" y1="130" x2="30" y2="20" stroke="#94a3b8" stroke-width="3"/>
      <rect x="42" y="118" width="12" height="12" fill="none" stroke="#94a3b8" stroke-width="2"/>
      <line x1="30" y1="130" x2="150" y2="52" stroke="#34d399" stroke-width="3.5"/>
      <path d="M55 130 A30 30 0 0 0 50 110" fill="none" stroke="#34d399" stroke-width="2"/>
      <path d="M45 118 A20 20 0 0 1 47 106" fill="none" stroke="#818cf8" stroke-width="2"/>
      <text x="95" y="80" fill="#34d399" font-size="13">∠1</text>
      <text x="40" y="98" fill="#818cf8" font-size="13">∠2</text>
      <text x="115" y="145" text-anchor="middle" fill="#fbbf24" font-size="13.5" font-weight="800">∠1 + ∠2 = 90° → 互余</text>
    </svg>
  </div>
  <div style="text-align:center;animation:pop-in .5s 1.1s both">
    <svg width="260" height="110" viewBox="0 0 260 110">
      <line x1="20" y1="70" x2="240" y2="70" stroke="#94a3b8" stroke-width="3"/>
      <line x1="130" y1="70" x2="220" y2="20" stroke="#fb7185" stroke-width="3.5"/>
      <line x1="130" y1="70" x2="40" y2="20" stroke="#22d3ee" stroke-width="3.5"/>
      <text x="175" y="50" fill="#fb7185" font-size="13">∠3</text>
      <text x="75" y="50" fill="#67e8f9" font-size="13">∠4</text>
      <text x="130" y="100" text-anchor="middle" fill="#fbbf24" font-size="13.5" font-weight="800">∠3 + ∠4 = 180° → 互补</text>
    </svg>
  </div>
</div>''',
   'narr': '两个角拼成直角，和是九十度，叫互余；拼成平角，和是一百八十度，叫互补。记忆窍门：余是剩下的余——九十补一半，补是一百八补全。注意互余、互补说的是数量关系，两个角不需要挨在一起。'},
  {'title': '🔁 同角的余角相等', 'sub': '隐形等量关系', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:500px;text-align:center;animation:slide-up .5s .3s both">
    <span style="font-size:1.15rem;font-weight:800">∠1 + ∠2 = 90°　且　∠1 + ∠3 = 90°<br/>→ <b class="hg">∠2 = ∠3</b>（同角的余角相等）</span>
  </div>
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);min-width:500px;text-align:center;animation:slide-up .5s 1s both">
    <span style="font-size:1.05rem;color:#c7d2fe">同理：<b style="color:#a5b4fc">同角（等角）的补角相等</b>——几何证明的常客</span>
  </div>
</div>''',
   'narr': '余角补角最值钱的性质：同角的余角相等。角 2 和角 3 都跟角 1 互余，那角 2 就等于角 3——它们都是九十度减角 1，当然一样。补角同理。很多证明题里看着毫不相干的两个角，靠这条性质立刻挂上钩。'}]},

# ============ 6-15 角的计算与钟面角 ============
{'pid': '7a-6-15', 'mind': [('分针速度', '6°/分钟'),
    ('时针速度', '0.5°/分钟'),
    ('追及差速', '分针每分钟追 5.5°'),
    ('整刻度', '3 点整 = 90°')],
 'concepts': [
  {'title': '🕰️ 钟面上的赛跑', 'sub': '时针分针的速度', 'html': '''
<svg width="230" height="230" viewBox="0 0 230 230" style="display:block;margin:0 auto;max-height:44vh">
  <circle cx="115" cy="115" r="100" fill="rgba(255,255,255,.03)" stroke="#94a3b8" stroke-width="3"/>
  <g font-size="14" fill="#94a3b8" font-weight="700">
    <text x="115" y="38" text-anchor="middle">12</text><text x="196" y="120" text-anchor="middle">3</text>
    <text x="115" y="205" text-anchor="middle">6</text><text x="34" y="120" text-anchor="middle">9</text>
  </g>
  <line x1="115" y1="115" x2="115" y2="45" stroke="#fbbf24" stroke-width="5" stroke-linecap="round" style="animation:pop-in .5s .3s both"/>
  <line x1="115" y1="115" x2="170" y2="115" stroke="#34d399" stroke-width="3" stroke-linecap="round" style="animation:pop-in .5s .8s both"/>
  <circle cx="115" cy="115" r="5" fill="#e2e8f0"/>
  <text x="255" y="90" fill="#fbbf24" font-size="13" font-weight="700" transform="translate(-130 130)">时针 0.5°/分</text>
</svg>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:10px;text-align:center;animation:slide-up .5s 1.4s both">
  <span style="font-size:1rem">分针：<b class="hg">6°/分</b>（60 分转 360°）　时针：<b class="hgold">0.5°/分</b><br/>每分钟分针多走 <b class="hr">5.5°</b>——一场追及赛</span>
</div>''',
   'narr': '钟面角是角计算里最有趣的模型。分针一小时转一整圈三百六十度，每分钟六度；时针十二小时才转一圈，每分钟只有零点五度。所以分针每分钟比时针多走五点五度——钟面上永远上演一场追及赛，用的正是行程问题的思路。'},
  {'title': '🧮 例：3 点 30 分的夹角', 'sub': '两步算出', 'html': '''
<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:520px;animation:slide-up .5s .3s both">
    <b class="hgold">时针</b>从 3 起：3 时 30 分 = 3.5 时 → 30°×3.5 = <b class="hgold">105°</b>
  </div>
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:520px;animation:slide-up .5s .9s both">
    <b class="hg">分针</b>指 6：6×30° = <b class="hg">180°</b>
  </div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:520px;text-align:center;animation:pop-in .5s 1.5s both">
    <span style="font-size:1.4rem;font-weight:900">夹角 = |180° − 105°| = <b class="hg">75°</b></span>
  </div>
</div>''',
   'narr': '算三点三十分的夹角，两步。第一步算时针位置：三点三十分就是三点五小时，每小时三十度，时针从十二转过了一百零五度。第二步算分针位置：指在六上，一百八十度。两针角度相减取绝对值，七十五度。口诀：各算各的，再相减，超过一百八十就用三百六十减回来。'}]},
]

if __name__ == '__main__':
    for spec in C.SPECS:
        C.build(spec)
    print('第六章 09-15 生成完毕')
