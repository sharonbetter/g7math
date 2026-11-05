#!/usr/bin/env python3
"""给每章核心课件追加一个"探究场景"（数轴动点/程序框图/规律探究等），配音走 MiniMax。"""
import json, os, re, sys

DEMO = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'demo')

# ---------- 探究场景规格 ----------
EXPLORE = {
  '7a-1-05': {
    'title': '🔬 探究：数轴上的跳动点',
    'sub': '规律从哪里来？从小的算起！',
    'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(251,191,36,.08);border:2px solid rgba(251,191,36,.35);min-width:520px;animation:slide-up .5s .3s both">
    <b class="hgold">问题</b>：一个点从原点出发，第1次向右跳1格，第2次向左跳2格，第3次向右跳3格……交替跳动，第 2024 次后落在数轴的哪个位置？
  </div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;animation:slide-up .5s .9s both">
    <div style="padding:6px 14px;border-radius:999px;background:rgba(52,211,153,.12);border:1px solid #34d399;font-size:.9rem">第1次 → 1</div>
    <div style="padding:6px 14px;border-radius:999px;background:rgba(244,63,94,.12);border:1px solid #fb7185;font-size:.9rem">第2次 → −1</div>
    <div style="padding:6px 14px;border-radius:999px;background:rgba(52,211,153,.12);border:1px solid #34d399;font-size:.9rem">第3次 → 2</div>
    <div style="padding:6px 14px;border-radius:999px;background:rgba(244,63,94,.12);border:1px solid #fb7185;font-size:.9rem">第4次 → −2</div>
  </div>
  <div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.4);min-width:520px;animation:slide-up .5s 1.5s both">
    <b style="color:#a5b4fc">规律</b>：奇数次落正数，偶数次落负数；第 2n 次落 −n，第 2n−1 次落 n<br/>
    <b class="hg">2024 是偶数，2n=2024 → n=1012 → 落在 −1012</b>
  </div>
</div>''',
    'narr': '来做一道探究题。一个点从原点出发，第一跳向右一格，第二跳向左两格，第三跳向右三格……交替跳动。第2024次后落在哪？别慌，先算前四次：落点依次是1、负1、2、负2。规律出来了：奇数次落正数，偶数次落负数。第2n次落负n，2024是偶数，2n等于2024，n等于1012，所以落在负1012。这就是从特殊到一般的思想——算小的，找规律，套到大的。',
  },
  '7a-2-10': {
    'title': '🔬 探究：程序框图',
    'sub': '数学 + 算法 = 程序思维',
    'html': '''
<div style="display:flex;gap:24px;margin-top:6px;align-items:flex-start">
  <div style="flex:1;animation:pop-in .5s .3s both">
    <div style="padding:12px 16px;border-radius:12px;background:rgba(99,102,241,.12);border:2px solid #818cf8;text-align:center;font-weight:800;color:#a5b4fc">输入 x</div>
    <div style="text-align:center;font-size:1.3rem;margin:4px 0">↓</div>
    <div style="padding:12px 16px;border-radius:12px;background:rgba(52,211,129,.12);border:2px solid #34d399;text-align:center;font-weight:800;color:#6ee7b7">x²−3</div>
    <div style="text-align:center;font-size:1.3rem;margin:4px 0">↓</div>
    <div style="padding:12px 16px;border-radius:12px;background:rgba(251,191,36,.12);border:2px solid #fbbf24;text-align:center;font-weight:800;color:#fcd34d">结果 > 0 ？</div>
    <div style="display:flex;justify-content:space-around;margin-top:4px">
      <span style="font-size:.85rem;color:#34d399">是 → 输出</span>
      <span style="font-size:.85rem;color:#fb7185">否 → 输入 x²</span>
    </div>
  </div>
  <div class="card" style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);animation:slide-up .5s 1s both">
    <b class="hgold">输入 x = −2</b>
    <div style="margin-top:8px;font-size:1.05rem;line-height:2.2">
      第1轮：(−2)² − 3 = 1 > 0 ✓<br/>
      <b class="hg">输出 1</b>
    </div>
    <div style="margin-top:8px;font-size:.9rem;color:#94a3b8;border-top:1px solid rgba(255,255,255,.1);padding-top:8px">
      如果第1轮不大于0，就把结果作为新的 x 再走一遍——循环！
    </div>
  </div>
</div>''',
    'narr': '来看一种新题型：程序框图。左边是流程：输入x，算x方减3，如果结果大于零就输出，否则把结果作为新输入再走一遍。输入负2：负2的平方是4，4减3等于1，大于零，直接输出。要是结果不大于零呢？循环！把结果再代进去。程序框图考的是：读流程、按步骤走、发现循环周期。这跟计算机的思维一模一样。',
  },
  '7a-3-05': {
    'title': '🔬 探究：不用求出 a 和 b',
    'sub': '整体代入的威力',
    'html': '''
<div style="display:flex;flex-direction:column;gap:14px;margin-top:6px;align-items:center">
  <div class="card" style="background:rgba(251,191,36,.08);border:2px solid rgba(251,191,36,.35);min-width:520px;animation:slide-up .5s .3s both">
    <b class="hgold">已知</b>：a + b = 5，ab = 3<br/>
    <b class="hgold">求</b>：a² + b² = ？　　(a+b)² = ？
  </div>
  <div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.4);min-width:520px;animation:slide-up .5s 1s both">
    <div style="font-size:1.25rem;font-weight:900;line-height:2">
      a² + b² = <span style="color:#fbbf24">(a+b)²</span> − 2ab = 5² − 2×3 = <b class="hg">19</b>
    </div>
  </div>
  <div class="card" style="background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);min-width:520px;animation:slide-up .5s 1.7s both">
    <span style="font-size:.95rem;color:#a7f3d0">全程<b class="hg">没有求出 a 和 b 各是多少</b>——把 a+b 和 ab 当作两块整体，直接拼装。</span>
  </div>
</div>''',
    'narr': '一道惊艳的探究题。已知a加b等于5，a乘b等于3，求a方加b方。多数人会想先解出a和b再代入——但根本不用！用完全平方公式：a方加b方等于括号a加b括号的平方减2ab，整体代入，25减6等于19。从头到尾没求出a和b各自是多少——这就是整体思想的威力：看到一块、代一块。',
  },
  '7a-4-06': {
    'title': '🔬 探究：图形中的数量规律',
    'sub': '第 n 个图案要几颗棋子？',
    'html': '''
<svg width="640" height="200" viewBox="0 0 640 200" style="display:block;margin:0 auto">
  <g style="animation:pop-in .4s .3s both">
    <circle cx="60" cy="50" r="7" fill="#34d399"/>
    <text x="60" y="90" text-anchor="middle" fill="#94a3b8" font-size="12">第1个：1 颗</text>
  </g>
  <g style="animation:pop-in .4s .8s both">
    <circle cx="160" cy="30" r="7" fill="#34d399"/><circle cx="160" cy="50" r="7" fill="#34d399"/><circle cx="160" cy="70" r="7" fill="#34d399"/><circle cx="140" cy="50" r="7" fill="#34d399"/><circle cx="180" cy="50" r="7" fill="#34d399"/>
    <text x="160" y="100" text-anchor="middle" fill="#94a3b8" font-size="12">第2个：5 颗</text>
  </g>
  <g style="animation:pop-in .4s 1.3s both">
    <circle cx="300" cy="50" r="7" fill="#34d399"/>
    <circle cx="270" cy="50" r="7" fill="#34d399"/><circle cx="330" cy="50" r="7" fill="#34d399"/>
    <circle cx="300" cy="20" r="7" fill="#34d399"/><circle cx="300" cy="80" r="7" fill="#34d399"/>
    <circle cx="270" cy="20" r="7" fill="#34d399"/><circle cx="330" cy="20" r="7" fill="#34d399"/>
    <circle cx="270" cy="80" r="7" fill="#34d399"/><circle cx="330" cy="80" r="7" fill="#34d399"/>
    <circle cx="300" cy="50" r="7" fill="#34d399"/>
    <text x="300" y="108" text-anchor="middle" fill="#94a3b8" font-size="12">第3个：9 颗</text>
  </g>
  <text x="520" y="60" text-anchor="middle" fill="#fbbf24" font-size="15" font-weight="800" style="opacity:0;animation:fade-in .5s 2s both">第 n 个：4n−3 颗</text>
  <text x="520" y="90" text-anchor="middle" fill="#94a3b8" font-size="12" style="opacity:0;animation:fade-in .5s 2.3s both">每多一层多 4 颗</text>
</svg>''',
    'narr': '图形规律探究：用棋子摆图案，第一个1颗，第二个5颗，第三个9颗。差是4、4——每次多4颗。所以第n个就是1加4乘n减1，化简得4n减3。验证：第1个4乘1减3等于1，对；第3个4乘3减3等于9，也对。从特殊到一般：算前几个、找差值规律、写通项、代入验证。这个套路适用于所有图形规律题。',
  },
  '7a-5-08': {
    'title': '🔬 探究：分类讨论',
    'sub': '一个条件，两种可能',
    'html': '''
<div style="display:flex;gap:18px;justify-content:center;margin-top:10px">
  <div class="card" style="flex:1;background:rgba(52,211,129,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:pop-in .5s .3s both">
    <b class="hg">情况一：a > 0，b < 0</b>
    <svg width="100%" height="60" viewBox="0 0 200 60"><line x1="20" y1="30" x2="180" y2="30" stroke="#94a3b8" stroke-width="2"/><circle cx="180" cy="30" r="5" fill="#34d399"/><text x="180" y="52" fill="#34d399" font-size="12">a=8</text><circle cx="60" cy="30" r="5" fill="#fb7185"/><text x="60" y="52" fill="#fb7185" font-size="12">b=−5</text><circle cx="100" cy="30" r="3" fill="#fbbf24"/><text x="100" y="52" fill="#fbbf24" font-size="12">0</text></svg>
    <div style="font-size:1.3rem;font-weight:900">a+b = 8+(−5) = 3</div>
  </div>
  <div class="card" style="flex:1;background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);text-align:center;animation:pop-in .5s 1s both">
    <b class="hr">情况二：a < 0，b > 0</b>
    <svg width="100%" height="60" viewBox="0 0 200 60"><line x1="20" y1="30" x2="180" y2="30" stroke="#94a3b8" stroke-width="2"/><circle cx="60" cy="30" r="5" fill="#fb7185"/><text x="60" y="52" fill="#fb7185" font-size="12">a=−8</text><circle cx="180" cy="30" r="5" fill="#34d399"/><text x="180" y="52" fill="#34d399" font-size="12">b=5</text><circle cx="100" cy="30" r="3" fill="#fbbf24"/><text x="100" y="52" fill="#fbbf24" font-size="12">0</text></svg>
    <div style="font-size:1.3rem;font-weight:900">a+b = −8+5 = −3</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:14px;text-align:center;animation:slide-up .6s 1.7s both">
  <span style="font-size:1rem">已知 |a|=8, |b|=5, <b class="hgold">ab < 0</b>（一正一负）→ 必须分两种情况，答案 <b class="hgold">两个：3 或 −3</b></span>
</div>''',
    'narr': '分类讨论是初中数学最重要的思想之一。已知a的绝对值是8，b的绝对值是5，ab小于零——说明一正一负。但谁正谁负？两种可能：a正b负，a加b等于3；a负b正，a加b等于负3。画两条数轴分别表示，一目了然。只答一个就丢一半的分。凡是条件里说"一正一负"或字母符号不确定，立刻想：分情况讨论。',
  },
  '7a-6-15': {
    'title': '🔬 探究：角的旋转',
    'sub': '旋转过程中角在变',
    'html': '''
<svg width="640" height="220" viewBox="0 0 640 220" style="display:block;margin:0 auto">
  <circle cx="200" cy="130" r="6" fill="#fbbf24"/>
  <line x1="200" y1="130" x2="320" y2="130" stroke="#94a3b8" stroke-width="3"/>
  <text x="330" y="135" fill="#94a3b8" font-size="13">OA</text>
  <line x1="206" y1="130" x2="306" y2="70" stroke="#34d399" stroke-width="3" style="animation:mindmap-line 1s .5s forwards;opacity:0"/>
  <text x="315" y="65" fill="#34d399" font-size="13" style="opacity:0;animation:fade-in .5s 1.2s both">OB</text>
  <path d="M240 130 A40 40 0 0 0 232 108" fill="none" stroke="#fb7185" stroke-width="3" style="opacity:0;animation:fade-in .5s 1.5s both"/>
  <text x="262" y="115" fill="#fb7185" font-size="13" font-weight="700" style="opacity:0;animation:fade-in .5s 1.8s both">α</text>
  <text x="200" y="175" text-anchor="middle" fill="#94a3b8" font-size="12" style="opacity:0;animation:fade-in .5s 2s both">OB 从 OA 出发逆时针旋转</text>
  <text x="480" y="60" fill="#a5b4fc" font-size="13.5" font-weight="700" style="opacity:0;animation:fade-in .5s 2.3s both">问：α = 30° 时</text>
  <text x="480" y="85" fill="#94a3b8" font-size="13" style="opacity:0;animation:fade-in .5s 2.5s both">∠AOB = 30°</text>
  <text x="480" y="110" fill="#94a3b8" font-size="13" style="opacity:0;animation:fade-in .5s 2.7s both">OB 的余角 = 60°</text>
  <text x="480" y="135" fill="#94a3b8" font-size="13" style="opacity:0;animation:fade-in .5s 2.9s both">OB 的补角 = 150°</text>
  <text x="480" y="165" fill="#fbbf24" font-size="13.5" font-weight="800" style="opacity:0;animation:fade-in .5s 3.2s both">旋转 90° 后 OB ⊥ OA</text>
</svg>''',
    'narr': '角的旋转探究：射线OB从OA出发逆时针旋转。旋转过程中，角AOB在变大，它的余角在变小，补角也在变小。旋转30度时，角AOB是30度，余角60度，补角150度。旋转到90度时，OB垂直于OA，余角变成零。旋转类题目画图分析最直观：画出旋转后的位置，标出各角度关系，答案就在图上。',
  },
}

def append_scene(pid):
    """在课件 HTML 末尾（场景容器收尾前）追加一个探究场景"""
    spec = EXPLORE.get(pid)
    if not spec:
        return False
    
    html_path = os.path.join(DEMO, f'{pid}.html')
    if not os.path.exists(html_path):
        print(f'  ✗ {pid}.html 不存在')
        return False
    
    s = open(html_path, encoding='utf-8').read()
    
    # 幂等：已有该场景则跳过
    if spec['title'][:6] in s:
        print(f'  {pid}: 已有探究场景，跳过')
        return False
    
    # 构造场景 HTML
    scene_html = f'\n  <div class="scene"><div class="scene-title">{spec["title"]}</div><div class="scene-sub">{spec["sub"]}</div>{spec["html"]}\n  </div>\n'
    
    # 在 hint div 前插入（场景容器内）
    hint_marker = '<div class="hint">'
    if hint_marker not in s:
        print(f'  ✗ {pid}.html 无 hint 标记')
        return False
    
    s = s.replace(hint_marker, scene_html + hint_marker, 1)
    
    # 更新讲解词 JSON
    narr_path = os.path.join(DEMO, f'{pid}-narrations.json')
    if os.path.exists(narr_path):
        narrs = json.load(open(narr_path))
        narrs.append(spec['narr'])
        json.dump(narrs, open(narr_path, 'w'), ensure_ascii=False, indent=1)
    
    open(html_path, 'w', encoding='utf-8').write(s)
    print(f'  ✅ {pid}: 追加「{spec["title"][:12]}…」')
    return True

if __name__ == '__main__':
    print('追加探究场景：')
    for pid in EXPLORE:
        append_scene(pid)
    print('\n配音请运行：cd app && for pid in ' + ' '.join(EXPLORE) + '; do node scripts/gen-demo-audio.mjs $pid; done')
