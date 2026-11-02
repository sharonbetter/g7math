#!/usr/bin/env python3
"""第六章（几何图形初步）7a-6-01 ~ 08：图形世界与线段。"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import animated_common as C

C.LESSON = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'lessons', '7a-c6.json'), encoding='utf-8'))

C.SPECS = [
# ============ 6-01 立体图形与平面图形 ============
{'pid': '7a-6-01', 'mind': [('立体图形', '各部分不都在同一平面'),
    ('平面图形', '都在同一平面内'),
    ('柱与锥', '棱柱、圆柱、棱锥、圆锥'),
    ('球', '从任何方向看都是圆')],
 'concepts': [
  {'title': '🧊 立体图形陈列馆', 'sub': '摸得着厚度的图形', 'html': '''
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:6px">
  <div style="text-align:center;animation:pop-in .4s .3s both">
    <svg width="100%" height="100" viewBox="0 0 100 100"><rect x="20" y="35" width="55" height="45" fill="rgba(99,102,241,.25)" stroke="#818cf8" stroke-width="2.5"/><rect x="32" y="20" width="55" height="45" fill="none" stroke="#818cf8" stroke-width="2" stroke-dasharray="4 3"/><line x1="20" y1="35" x2="32" y2="20" stroke="#818cf8" stroke-width="2"/><line x1="75" y1="35" x2="87" y2="20" stroke="#818cf8" stroke-width="2"/><line x1="75" y1="80" x2="87" y2="65" stroke="#818cf8" stroke-width="2"/><rect x="32" y="20" width="55" height="45" fill="rgba(99,102,241,.12)"/></svg>
    <div style="font-size:.85rem;color:#a5b4fc">正方体</div>
  </div>
  <div style="text-align:center;animation:pop-in .4s .8s both">
    <svg width="100%" height="100" viewBox="0 0 100 100"><ellipse cx="50" cy="75" rx="30" ry="10" fill="rgba(52,211,153,.3)" stroke="#34d399" stroke-width="2.5"/><rect x="20" y="30" width="60" height="45" fill="rgba(52,211,153,.12)" stroke="#34d399" stroke-width="2"/><ellipse cx="50" cy="30" rx="30" ry="10" fill="rgba(52,211,153,.35)" stroke="#34d399" stroke-width="2.5"/></svg>
    <div style="font-size:.85rem;color:#6ee7b7">圆柱</div>
  </div>
  <div style="text-align:center;animation:pop-in .4s 1.3s both">
    <svg width="100%" height="100" viewBox="0 0 100 100"><circle cx="50" cy="55" r="34" fill="rgba(245,158,11,.25)" stroke="#fbbf24" stroke-width="2.5"/></svg>
    <div style="font-size:.85rem;color:#fcd34d">球</div>
  </div>
  <div style="text-align:center;animation:pop-in .4s 1.8s both">
    <svg width="100%" height="100" viewBox="0 0 100 100"><polygon points="50,18 22,80 78,80" fill="rgba(244,63,94,.2)" stroke="#fb7185" stroke-width="2.5"/><ellipse cx="50" cy="80" rx="28" ry="8" fill="rgba(244,63,94,.25)" stroke="#fb7185" stroke-width="2"/></svg>
    <div style="font-size:.85rem;color:#fda4af">圆锥</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:14px;text-align:center;animation:slide-up .6s 2.3s both">
  <span style="font-size:1rem">立体图形：<b class="hgold">各部分不都在同一个平面里</b>——有厚度、占空间</span>
</div>''',
   'narr': '几何世界的第一批展品：正方体、圆柱、球、圆锥。它们的共同点是各部分不都在同一个平面里——有厚度、占空间，这叫立体图形。长方体、棱柱、棱锥都是这个家族的。接下来认识它们的另一面。'},
  {'title': '📄 平面图形', 'sub': '一张纸上躺平的图形', 'html': '''
<div style="display:flex;gap:16px;justify-content:center;margin-top:10px">
  <div style="text-align:center;animation:pop-in .4s .3s both"><svg width="110" height="90" viewBox="0 0 110 90"><polygon points="55,10 15,78 95,78" fill="rgba(52,211,153,.2)" stroke="#34d399" stroke-width="2.5"/></svg><div style="font-size:.85rem;color:#6ee7b7">三角形</div></div>
  <div style="text-align:center;animation:pop-in .4s .8s both"><svg width="110" height="90" viewBox="0 0 110 90"><circle cx="55" cy="45" r="33" fill="rgba(99,102,241,.2)" stroke="#818cf8" stroke-width="2.5"/></svg><div style="font-size:.85rem;color:#a5b4fc">圆</div></div>
  <div style="text-align:center;animation:pop-in .4s 1.3s both"><svg width="110" height="90" viewBox="0 0 110 90"><rect x="25" y="18" width="60" height="55" rx="4" fill="rgba(245,158,11,.18)" stroke="#fbbf24" stroke-width="2.5"/></svg><div style="font-size:.85rem;color:#fcd34d">长方形</div></div>
</div>
<div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);margin-top:14px;text-align:center;animation:slide-up .6s 1.8s both">
  <span style="font-size:1rem">平面图形：<b class="hg">所有部分都在同一平面内</b>——一张纸就能画下、躺得平平的</span>
</div>''',
   'narr': '另一类是平面图形：三角形、圆、长方形——所有部分都在同一个平面里，一张纸就能画下。区分立体和平面的口诀：躺得平的是平面图形，占空间的是立体图形。立体图形的表面，其实是由平面图形围成的。'}]},

# ============ 6-02 视图与展开图 ============
{'pid': '7a-6-02', 'mind': [('三视图', '正面/左面/上面看'),
    ('圆柱视图', '矩形 + 矩形 + 圆'),
    ('展开图', '沿棱剪开摊平'),
    ('对面不相邻', '展开图中找对面')],
 'concepts': [
  {'title': '👁️ 换个方向看世界', 'sub': '同一物体的三张照片', 'html': '''
<div style="display:flex;gap:14px;justify-content:center;margin-top:6px;align-items:flex-end">
  <div style="text-align:center;animation:pop-in .4s .3s both">
    <svg width="120" height="120" viewBox="0 0 120 120"><ellipse cx="60" cy="88" rx="34" ry="11" fill="rgba(52,211,153,.3)" stroke="#34d399" stroke-width="2"/><rect x="26" y="42" width="68" height="46" fill="rgba(52,211,153,.1)" stroke="#34d399" stroke-width="2"/><ellipse cx="60" cy="42" rx="34" ry="11" fill="rgba(52,211,153,.3)" stroke="#34d399" stroke-width="2"/></svg>
    <div style="font-size:.85rem;color:#94a3b8">圆柱本体</div>
  </div>
  <div style="text-align:center;animation:pop-in .4s .9s both">
    <svg width="90" height="120" viewBox="0 0 90 120"><rect x="12" y="30" width="66" height="60" fill="rgba(99,102,241,.15)" stroke="#818cf8" stroke-width="2.5"/></svg>
    <div style="font-size:.85rem;color:#a5b4fc">从正面：矩形</div>
  </div>
  <div style="text-align:center;animation:pop-in .4s 1.4s both">
    <svg width="90" height="120" viewBox="0 0 90 120"><circle cx="45" cy="60" r="30" fill="rgba(245,158,11,.18)" stroke="#fbbf24" stroke-width="2.5"/></svg>
    <div style="font-size:.85rem;color:#fcd34d">从上面：圆</div>
  </div>
</div>''',
   'narr': '同一件物体，从不同方向看，照片大不相同。圆柱从正面看是矩形，从上面看是圆，从左面看又是矩形。三视图就是给物体拍三张"正脸照"：正面、左面、上面。看图先想物体，是这一节的基本功。'},
  {'title': '📦 剪开摊平', 'sub': '正方体的展开图', 'html': '''
<div style="display:flex;gap:20px;justify-content:center;align-items:center;margin-top:10px">
  <div style="animation:pop-in .5s .3s both">
    <svg width="120" height="120" viewBox="0 0 120 120"><rect x="30" y="30" width="55" height="55" fill="rgba(99,102,241,.2)" stroke="#818cf8" stroke-width="2.5"/></svg>
    <div style="text-align:center;font-size:.85rem;color:#94a3b8">正方体</div>
  </div>
  <div style="font-size:2rem;animation:fade-in .4s 1s both">✂️ →</div>
  <div style="animation:pop-in .6s 1.5s both">
    <svg width="220" height="150" viewBox="0 0 220 150">
      <g stroke="#34d399" stroke-width="2" fill="rgba(52,211,153,.12)">
        <rect x="80" y="20" width="36" height="36"/><rect x="116" y="20" width="36" height="36"/>
        <rect x="80" y="56" width="36" height="36"/><rect x="44" y="56" width="36" height="36"/><rect x="8" y="56" width="36" height="36"/><rect x="80" y="92" width="36" height="36"/>
      </g>
    </svg>
    <div style="text-align:center;font-size:.85rem;color:#94a3b8">展开图（1-4-1 型）</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:12px;text-align:center;animation:slide-up .6s 2.2s both">
  <span style="font-size:.98rem">找对面技巧：<b class="hgold">展开图里不相邻（隔一格或最远）的两个正方形</b>，折起来正好相对</span>
</div>''',
   'narr': '把正方体沿着棱剪开、摊平，就得到展开图——常见的有一四一型、二三一型等十一种。做折叠判断题有个万能技巧：展开图里不相邻的两个面，折起来正好相对。比如一四一型里，上下那两个单独的面，折完就是对面。'}]},

# ============ 6-03 点线面体 ============
{'pid': '7a-6-03', 'mind': [('点动成线', '笔尖划过留痕迹'),
    ('线动成面', '直线扫出平面'),
    ('面动成体', '矩形旋转出圆柱'),
    ('组成关系', '体由面围，面由线组成')],
 'concepts': [
  {'title': '✒️ 点动成线', 'sub': '流星划过夜空', 'html': '''
<svg width="640" height="140" viewBox="0 0 640 140" style="display:block;margin:0 auto">
  <circle cx="60" cy="70" r="7" fill="#fbbf24" style="animation:pulse 1.5s infinite"/>
  <line x1="70" y1="70" x2="560" y2="70" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" opacity="0" style="animation:mindmap-line 1.2s .8s forwards"/>
  <text x="320" y="40" text-anchor="middle" fill="#94a3b8" font-size="14" style="animation:fade-in .5s 1.8s both">笔尖（一个点）划过 → 留下一条线</text>
</svg>''',
   'narr': '几何世界由低到高搭起来。最底层是点：笔尖就是一个点。点动起来，划过纸面留下一条线——流星划过夜空拉出的那道光，就是点动成线。'},
  {'title': '🌀 面动成体', 'sub': '矩形转出圆柱', 'html': '''
<div style="display:flex;gap:16px;justify-content:center;align-items:center;margin-top:6px">
  <div style="text-align:center;animation:pop-in .5s .3s both">
    <svg width="90" height="120" viewBox="0 0 90 120"><rect x="15" y="25" width="60" height="70" fill="rgba(52,211,153,.15)" stroke="#34d399" stroke-width="2.5"/></svg>
    <div style="font-size:.85rem;color:#94a3b8">一个矩形面</div>
  </div>
  <div style="font-size:1.8rem;animation:fade-in .4s 1s both">→ 绕边旋转一周 →</div>
  <div style="text-align:center;animation:pop-in .6s 1.6s both">
    <svg width="100" height="120" viewBox="0 0 100 120"><ellipse cx="50" cy="92" rx="32" ry="10" fill="rgba(52,211,153,.3)" stroke="#34d399" stroke-width="2"/><rect x="18" y="30" width="64" height="62" fill="rgba(52,211,153,.1)" stroke="#34d399" stroke-width="2"/><ellipse cx="50" cy="30" rx="32" ry="10" fill="rgba(52,211,153,.35)" stroke="#34d399" stroke-width="2"/></svg>
    <div style="font-size:.85rem;color:#6ee7b7">圆柱（体）</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:14px;text-align:center;animation:slide-up .6s 2.2s both">
  <span style="font-size:1rem">口诀：<b class="hgold">点动成线，线动成面，面动成体</b>——几何大厦四层楼</span>
</div>''',
   'narr': '再往上一层：线动成面——雨刷扫出一片扇形；面动成体——矩形绕着一条边旋转一周，扫出圆柱。口诀四层楼：点动成线，线动成面，面动成体。反过来，体由面围成，面由线组成，线由点组成。'}]},

# ============ 6-04 直线射线线段 ============
{'pid': '7a-6-04', 'mind': [('直线', '无端点，向两方无限延伸'),
    ('射线', '一个端点，一方延伸'),
    ('线段', '两个端点，可度量'),
    ('表示', '两个大写字母或小写字母')],
 'concepts': [
  {'title': '👬 三兄弟比延伸', 'sub': '端点数量决定脾气', 'html': '''
<div style="display:flex;flex-direction:column;gap:18px;margin-top:6px">
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);animation:slide-up .5s .3s both">
    <b style="color:#a5b4fc">直线</b>（0 个端点）
    <svg width="100%" height="26" viewBox="0 0 560 26"><line x1="20" y1="13" x2="540" y2="13" stroke="#818cf8" stroke-width="3"/><polygon points="540,13 528,7 528,19" fill="#818cf8"/><polygon points="20,13 32,7 32,19" fill="#818cf8" transform="rotate(180 26 13)"/></svg>
    <span style="font-size:.88rem;color:#94a3b8">两端都无限延伸，不可度量</span>
  </div>
  <div class="card" style="background:rgba(245,158,11,.08);border:2px solid rgba(245,158,11,.4);animation:slide-up .5s 1s both">
    <b class="hgold">射线</b>（1 个端点）
    <svg width="100%" height="26" viewBox="0 0 560 26"><circle cx="40" cy="13" r="6" fill="#fbbf24"/><line x1="46" y1="13" x2="540" y2="13" stroke="#fbbf24" stroke-width="3"/><polygon points="540,13 528,7 528,19" fill="#fbbf24"/></svg>
    <span style="font-size:.88rem;color:#94a3b8">一端固定，另一端无限延伸（手电筒光）</span>
  </div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);animation:slide-up .5s 1.7s both">
    <b class="hg">线段</b>（2 个端点）
    <svg width="100%" height="26" viewBox="0 0 560 26"><circle cx="40" cy="13" r="6" fill="#34d399"/><circle cx="520" cy="13" r="6" fill="#34d399"/><line x1="46" y1="13" x2="514" y2="13" stroke="#34d399" stroke-width="3"/></svg>
    <span style="font-size:.88rem;color:#94a3b8">两头封死，有长度、可度量</span>
  </div>
</div>''',
   'narr': '直线、射线、线段三兄弟，脾气由端点数量决定。直线没有端点，两端无限延伸，量不出长度。射线一个端点，像手电筒的光，一头固定一头射向远方。线段两个端点，两头封死，有长度能量——三兄弟里只有它能上尺子。'},
  {'title': '✍️ 怎么称呼它们', 'sub': '表示法有讲究', 'html': '''
<div style="display:flex;flex-direction:column;gap:14px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(99,102,241,.08);border:2px solid rgba(99,102,241,.4);min-width:480px;animation:slide-up .5s .3s both">
    直线：直线 AB（<b class="hr">无序</b>）或直线 l　——延伸方向随便叫
  </div>
  <div class="card" style="background:rgba(245,158,11,.08);border:2px solid rgba(245,158,11,.4);min-width:480px;animation:slide-up .5s .9s both">
    射线：射线 AB —— <b class="hgold">端点 A 必须写在前</b>（方向从 A 到 B）
  </div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:480px;animation:slide-up .5s 1.5s both">
    线段：线段 AB 或线段 BA（<b class="hg">无序</b>）
  </div>
</div>''',
   'narr': '称呼它们有讲究。直线 AB，两个字母谁前谁后都行，也可以叫直线小写 l。线段同理，AB、BA 随便。唯独射线最挑：端点必须写在前面——射线 AB，是从 A 出发射向 B；写成射线 BA，方向就反了，是另一条射线。这是考试里的经典细节题。'}]},

# ============ 6-05 直线基本事实 ============
{'pid': '7a-6-05', 'mind': [('基本事实', '两点确定一条直线'),
    ('过一点', '能画无数条直线'),
    ('过两点', '有且只有一条'),
    ('两线交点', '两条直线最多一个交点')],
 'concepts': [
  {'title': '📌 一点任性，两点定死', 'sub': '直线的基本事实', 'html': '''
<div style="display:flex;gap:24px;justify-content:center;margin-top:10px">
  <div style="text-align:center;animation:pop-in .5s .3s both">
    <svg width="240" height="150" viewBox="0 0 240 150">
      <circle cx="120" cy="75" r="6" fill="#fb7185"/>
      <line x1="20" y1="20" x2="220" y2="130" stroke="#818cf8" stroke-width="2.5" opacity="0" style="animation:fade-in .4s .8s both"/>
      <line x1="20" y1="75" x2="220" y2="75" stroke="#34d399" stroke-width="2.5" opacity="0" style="animation:fade-in .4s 1.2s both"/>
      <line x1="20" y1="130" x2="220" y2="20" stroke="#fbbf24" stroke-width="2.5" opacity="0" style="animation:fade-in .4s 1.6s both"/>
      <text x="120" y="145" text-anchor="middle" fill="#94a3b8" font-size="13">过 1 点：无数条直线</text>
    </svg>
  </div>
  <div style="text-align:center;animation:pop-in .5s 2s both">
    <svg width="240" height="150" viewBox="0 0 240 150">
      <circle cx="60" cy="75" r="6" fill="#fb7185"/><circle cx="180" cy="75" r="6" fill="#fb7185"/>
      <line x1="40" y1="75" x2="200" y2="75" stroke="#34d399" stroke-width="3" opacity="0" style="animation:fade-in .5s 2.5s both"/>
      <text x="120" y="145" text-anchor="middle" fill="#fbbf24" font-size="13" font-weight="700">过 2 点：有且只有一条</text>
    </svg>
  </div>
</div>''',
   'narr': '直线世界有条铁律。过一个点画直线？随便转，能画无数条。但过两个点呢？试来试去，有且只有一条——这条钉死的规律叫直线的基本事实：两点确定一条直线。砌墙拉线、植树定行，用的都是它。'},
  {'title': '✖️ 两条直线最多一个交点', 'sub': '相交的几何逻辑', 'html': '''
<div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:slide-up .6s .3s both">
  <svg width="360" height="120" viewBox="0 0 360 120"><line x1="40" y1="100" x2="320" y2="20" stroke="#34d399" stroke-width="3"/><line x1="40" y1="20" x2="320" y2="100" stroke="#818cf8" stroke-width="3"/><circle cx="180" cy="60" r="7" fill="#fbbf24" style="animation:pop-in .5s 1s both"/><text x="180" y="95" text-anchor="middle" fill="#94a3b8" font-size="12">唯一交点</text></svg>
  <span style="font-size:.95rem">两条不同直线：要么<b class="hg">平行无交点</b>，要么<b class="hgold">相交恰有一个交点</b></span>
</div>''',
   'narr': '两条不同直线的关系只有两种：平行，没有交点；相交，恰好一个交点。为什么不可能有两个交点？因为两点确定一条直线——要是能交两次，那它们就是同一条直线了。逻辑严丝合缝。'}]},

# ============ 6-06 线段比较与尺规作图 ============
{'pid': '7a-6-06', 'mind': [('叠合法', '一端对齐，看另一端'),
    ('度量法', '刻度尺量长度'),
    ('尺规作图', '圆规截取等长'),
    ('作图语言', '以…为圆心，长为半径')],
 'concepts': [
  {'title': '⚔️ 比武：一端对齐', 'sub': '叠合法比较线段', 'html': '''
<svg width="640" height="150" viewBox="0 0 640 150" style="display:block;margin:0 auto">
  <circle cx="80" cy="50" r="6" fill="#34d399"/><circle cx="380" cy="50" r="6" fill="#34d399"/>
  <line x1="86" y1="50" x2="374" y2="50" stroke="#34d399" stroke-width="4" style="animation:mindmap-line .8s .3s forwards;opacity:0"/>
  <text x="230" y="38" text-anchor="middle" fill="#34d399" font-size="14">线段 a</text>
  <circle cx="80" cy="100" r="6" fill="#818cf8"/><circle cx="470" cy="100" r="6" fill="#818cf8"/>
  <line x1="86" y1="100" x2="464" y2="100" stroke="#818cf8" stroke-width="4" style="animation:mindmap-line .8s .9s forwards;opacity:0"/>
  <text x="270" y="90" text-anchor="middle" fill="#818cf8" font-size="14">线段 b</text>
  <line x1="80" y1="30" x2="80" y2="120" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5 4" style="animation:fade-in .5s 1.5s both"/>
  <text x="555" y="80" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="800" style="animation:fade-in .6s 1.9s both">左端对齐：b 的右端更远 → b ＞ a</text>
</svg>''',
   'narr': '比较两条线段的长短，最直观的是叠合法：左端点对齐放在一条线上，看右端谁伸得远——b 的右端在 a 的外面，所以 b 比 a 长。另一种办法是度量法：直接用刻度尺量出数字来比。叠合看形，度量看数。'},
  {'title': '🧭 圆规当搬运工', 'sub': '尺规作等长线段', 'html': '''
<div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:520px;animation:slide-up .5s .3s both">
    ① 用圆规两脚对准已知线段 a 的两端 —— <b class="hgold">量下这段长</b>
  </div>
  <div class="card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);min-width:520px;animation:slide-up .5s .9s both">
    ② 画一条射线，以端点 O 为圆心、刚才的长为<b class="hgold">半径画弧</b>，交射线于 A
  </div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:520px;animation:slide-up .5s 1.5s both">
    ③ OA 就是所求 —— <b class="hg">与 a 相等</b>　作图语言：以 O 为圆心、a 为半径画弧
  </div>
</div>''',
   'narr': '尺规作图里，圆规就是个搬运工：把已知线段的长度原封不动搬过来。第一步，圆规两脚卡住已知线段的两端，量下这段长；第二步，画射线，以端点为圆心、刚才的长为半径画弧，交出一个点；第三步，新线段与原来的相等。作图题的叙述语言要背下来：以 O 为圆心、a 为半径画弧。'}]},

# ============ 6-07 线段和差与中点 ============
{'pid': '7a-6-07', 'mind': [('中点定义', '分成相等的两段'),
    ('数量关系', 'AC = CB = AB/2'),
    ('和差关系', 'AB = AC + CB'),
    ('双中点模型', 'MN = AB/2 与全长无关')],
 'concepts': [
  {'title': '🎭 对折重合', 'sub': '中点是怎么来的', 'html': '''
<svg width="680" height="150" viewBox="0 0 680 150" style="display:block;margin:0 auto">
  <circle cx="100" cy="60" r="7" fill="#fbbf24"/><circle cx="390" cy="60" r="7" fill="#34d399"/><circle cx="680" cy="60" r="0"/>
  <circle cx="580" cy="60" r="7" fill="#fbbf24"/>
  <line x1="107" y1="60" x2="383" y2="60" stroke="#34d399" stroke-width="4" style="opacity:0;animation:mindmap-line .7s .3s forwards"/>
  <line x1="397" y1="60" x2="573" y2="60" stroke="#34d399" stroke-width="4" style="opacity:0;animation:mindmap-line .7s .9s forwards"/>
  <text x="110" y="40" fill="#fbbf24" font-size="15" font-weight="800">A</text>
  <text x="380" y="36" fill="#34d399" font-size="15" font-weight="800">C（中点）</text>
  <text x="572" y="40" fill="#fbbf24" font-size="15" font-weight="800">B</text>
  <path d="M240 90 Q245 100 240 105 M240 105 Q235 100 240 90" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
  <text x="240" y="130" text-anchor="middle" fill="#94a3b8" font-size="12">AC</text>
  <text x="490" y="130" text-anchor="middle" fill="#94a3b8" font-size="12">CB</text>
  <path d="M490 90 Q495 100 490 105 M490 105 Q485 100 490 90" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
  <text x="340" y="35" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="700" style="opacity:0;animation:fade-in .5s 1.6s both">对折重合 → AC = CB = ½AB</text>
</svg>''',
   'narr': '把线段 AB 从中间对折，折痕落的那个点 C 叫中点。中点带来一组黄金关系：AC 等于 CB，都等于 AB 的一半；反过来 AB 等于两倍 AC。见到"中点"两个字，立刻写出这三条等式，题目的入口就打开了。'},
  {'title': '🪄 双中点魔法', 'sub': '不必求出全长', 'html': '''
<svg width="700" height="140" viewBox="0 0 700 140" style="display:block;margin:0 auto">
  <circle cx="80" cy="70" r="7" fill="#fbbf24"/><circle cx="260" cy="70" r="7" fill="#34d399"/><circle cx="420" cy="70" r="7" fill="#22d3ee"/><circle cx="620" cy="70" r="7" fill="#fbbf24"/>
  <line x1="87" y1="70" x2="613" y2="70" stroke="#94a3b8" stroke-width="3"/>
  <rect x="87" y="52" width="173" height="36" rx="8" fill="rgba(52,211,153,.2)" stroke="#34d399" stroke-width="2" style="opacity:0;animation:fade-in .5s .6s both"/>
  <rect x="427" y="52" width="193" height="36" rx="8" fill="rgba(34,211,238,.2)" stroke="#22d3ee" stroke-width="2" style="opacity:0;animation:fade-in .5s 1.1s both"/>
  <text x="170" y="45" fill="#34d399" font-size="13" font-weight="700">AM（一半）</text>
  <text x="520" y="45" fill="#67e8f9" font-size="13" font-weight="700">NB（一半）</text>
  <text x="350" y="115" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="800" style="opacity:0;animation:fade-in .6s 1.7s both">MN = AB − ½AB − ½AB = ½AB（跟 M、N 具体在哪无关）</text>
</svg>''',
   'narr': '来一个惊艳的模型：M 是 AB 中点，N 也是 AB 中点。MN 等于多少？用全长减去左边一半、再减去右边一半，正好剩一半——MN 等于 AB 的一半，而且不管 M 和 N 具体在哪，只要都是中点，这个结论雷打不动。几何里这类"不必求出每段"的整体思想，越早习惯越强大。'}]},

# ============ 6-08 两点间距离与基本事实 ============
{'pid': '7a-6-08', 'mind': [('距离定义', '两点间线段的长度'),
    ('基本事实', '两点之间线段最短'),
    ('距离是数', '不是那条线段本身'),
    ('应用', '爬最短、拉直河道')],
 'concepts': [
  {'title': '🏃 抄近道的数学依据', 'sub': '两点之间线段最短', 'html': '''
<svg width="640" height="190" viewBox="0 0 640 190" style="display:block;margin:0 auto">
  <circle cx="80" cy="150" r="7" fill="#fbbf24"/><circle cx="560" cy="150" r="7" fill="#fbbf24"/>
  <text x="80" y="180" fill="#fbbf24" font-size="14" font-weight="800">A</text><text x="560" y="180" fill="#fbbf24" font-size="14" font-weight="800">B</text>
  <path d="M87 150 C 160 40, 480 40, 553 150" fill="none" stroke="#fb7185" stroke-width="3.5" stroke-dasharray="8 6" style="opacity:0;animation:fade-in .5s .5s both"/>
  <text x="320" y="60" text-anchor="middle" fill="#fb7185" font-size="13">弯路（曲线）</text>
  <line x1="87" y1="150" x2="553" y2="150" stroke="#34d399" stroke-width="4" style="opacity:0;animation:mindmap-line .9s 1.2s forwards"/>
  <text x="320" y="140" text-anchor="middle" fill="#34d399" font-size="14" font-weight="800" style="opacity:0;animation:fade-in .5s 2s both">线段 AB：最短</text>
</svg>''',
   'narr': '为什么大家走路都爱抄近道？数学依据就一句话：两点之间，线段最短。从 A 到 B，不管你绕出多花哨的曲线，都长于笔直的线段 AB。这条基本事实，是"距离"概念的靠山。'},
  {'title': '📏 距离是个数', 'sub': '别把线段当距离', 'html': '''
<div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:slide-up .5s .3s both">
  <div style="font-size:1.25rem;font-weight:800;line-height:2">两点间的距离 = 连接两点的<b class="hg">线段的长度</b></div>
</div>
<div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);margin-top:14px;text-align:center;animation:slide-up .5s .9s both">
  <span style="font-size:.95rem;color:#fecdd3">⚠️ 常见表述病句："A、B 的距离是线段 AB" ✗<br/>应为："A、B 的距离是线段 AB 的<b class="hg">长度</b>"（距离是数，带单位）</span>
</div>''',
   'narr': '一个高频扣分点：距离是个数，不是那条线段本身。要说"A、B 两点间的距离是线段 AB 的长度"，比如 5 厘米。写成"距离是线段 AB"就成了图形，不是数量——一字之差，分就没了。'}]},
]

if __name__ == '__main__':
    for spec in C.SPECS:
        C.build(spec)
    print('第六章 01-08 生成完毕')
