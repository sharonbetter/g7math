#!/usr/bin/env python3
"""重做探究场景：从静态信息卡改为标准三段式（题目→分步解答→点评），带 data-reveal-at 渐进揭示。"""
import json, os, re

DEMO = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'demo')

def step_html(steps):
    rows = ''
    for i, s in enumerate(steps):
        rows += f'''<div style="display:flex;gap:10px;margin-top:8px">
<span style="flex:none;width:24px;height:24px;border-radius:50%;background:rgba(52,211,153,.25);color:#34d399;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800">{i+1}</span>
<span style="font-size:1rem;color:#e2e8f0;line-height:1.7">{s}</span></div>'''
    return rows

def make_scene(title, sub, prob, steps, comment):
    return f'''
  <div class="scene">
    <div class="scene-title">{title}</div>
    <div class="scene-sub">{sub}</div>
    <div class="card" style="background:rgba(251,191,36,.08);border:2px solid rgba(251,191,36,.35);animation:slide-up .6s .3s both">
      <b style="color:#fbbf24">探究问题</b>&nbsp;&nbsp;<span style="font-size:1.05rem;color:#e2e8f0">{prob}</span>
    </div>
    <div data-reveal-at="0.25" class="card" style="background:rgba(16,185,129,.08);border:2px solid rgba(16,185,129,.35);margin-top:12px">
      <b style="color:#34d399">我们一步步来</b>
      {step_html(steps)}
    </div>
    <div data-reveal-at="0.8" class="card" style="background:rgba(167,139,250,.1);border:2px solid rgba(167,139,250,.35);margin-top:12px;text-align:center">
      <span style="font-size:.98rem;color:#ddd6fe"><b>探究收束</b>：{comment}</span>
    </div>
  </div>
'''

EXPLORE = {
  '7a-1-05': {
    'title': '🔬 探究：数轴上的跳动点',
    'sub': '从特殊到一般：先算小的，再找规律',
    'prob': '一个点从原点出发，第 1 次向右跳 1 格，第 2 次向左跳 2 格，第 3 次向右跳 3 格……左右交替。第 2024 次跳动后，这个点落在数轴的什么位置？',
    'steps': [
      '先算前几次——别怕小数字，规律就藏在这里：<br/>第1次→落1，第2次→落−1，第3次→落2，第4次→落−2，第5次→落3，第6次→落−3',
      '发现规律：<b style="color:#34d399">奇数次落正数，偶数次落负数</b>。第 2n−1 次落 n，第 2n 次落 −n',
      '2024 是偶数，设 2n = 2024，得 n = 1012',
      '所以第 2024 次后，点落在 <b style="color:#fbbf24">−1012</b> 的位置',
    ],
    'comment': '从特殊到一般——先老实算前几个，发现周期规律，再用除法定位大数。2024 次不可能真的跳一遍，但前 6 次就够了。',
    'narr': '来做一道探究题。一个点从原点出发，第一跳向右一格，第二跳向左两格，第三跳向右三格，左右交替。第2024次后落在哪？你的第一反应可能是——2024次，怎么可能算得完？但先别慌，先算前几次试试。第1次落1，第2次落负1，第3次落2，第4次落负2，第5次落3，第6次落负3——规律跳出来了：奇数次落正数，偶数次落负数。第2n减1次落n，第2n次落负n。2024是偶数，2n等于2024，n等于1012，所以落在负1012。这就是从特殊到一般的思想——算小的，找规律，套到大的。',
  },
  '7a-2-10': {
    'title': '🔬 探究：程序框图',
    'sub': '数学与算法的交叉',
    'prob': '右边的程序框图：输入 x → 计算 x² − 3 → 如果结果 > 0 就输出；否则把结果作为新的 x 再算一遍（循环）。<br/><br/>问：输入 x = −2，最终输出什么？',
    'steps': [
      '按流程走第一轮：输入 x = −2，计算 (−2)² − 3 = 4 − 3 = <b style="color:#34d399">1</b>',
      '判断：1 > 0 ？是！ → 直接输出',
      '所以最终输出 <b style="color:#fbbf24">1</b><br/><br/>如果第一轮不大于 0 呢？比如输入 x = 1：<br/>第1轮：1² − 3 = −2，不大于 0 → 把 −2 作为新输入<br/>第2轮：(−2)² − 3 = 1，大于 0 → 输出 1',
    ],
    'comment': '程序框图考的是"读流程、按步骤走"。遇到循环，先老老实实算前几轮，发现周期后用除法定位，绝不逐次算到底。',
    'narr': '来看一种新题型：程序框图。流程是：输入x，算x方减3，如果结果大于零就输出，否则把结果作为新输入再走一遍。输入负2：负2的平方是4，4减3等于1，大于零，直接输出。要是结果不大于零呢？比如输入1：1的平方减3等于负2，不大于零，把负2再代进去：负2的平方减3等于1，大于零，输出。程序框图考的就是：读懂流程，按步骤走，遇到循环算前几轮找周期。',
  },
  '7a-3-05': {
    'title': '🔬 探究：不求出 a 和 b',
    'sub': '整体代入的威力',
    'prob': '已知 a + b = 5，ab = 3，求 a² + b² 的值。<br/><br/>提示：先别急着解出 a 和 b 各是多少——试试用"整体"的眼光看。',
    'steps': [
      '看到 a² + b²，想到完全平方公式：<br/>(a+b)² = a² + 2ab + b²',
      '变形：a² + b² = (a+b)² <b style="color:#fb7185">− 2ab</b>',
      '整体代入：a² + b² = 5² − 2×3 = 25 − 6 = <b style="color:#fbbf24">19</b>',
      '验证：解出 a≈4.3, b≈0.7 确实满足 a+b=5, ab=3<br/>4.3² + 0.7² ≈ 18.5 + 0.5 ≈ 19 ✓',
    ],
    'comment': '整体思想——不求出每个字母的值，把 a+b 和 ab 看成两块"积木"，直接拼装出目标。全程没解方程，答案就出来了。',
    'narr': '一道惊艳的探究题。已知a加b等于5，a乘b等于3，求a方加b方。多数人会想先解出a和b再代入——但根本不用！用完全平方公式：a方加b方等于括号a加b括号的平方减2ab。整体代入，25减6等于19。验证一下，解出a约等于4.3，b约等于0.7，4.3的方加0.7的方约等于19，对。从头到尾没求出a和b各自是多少——这就是整体思想的威力。',
  },
  '7a-4-06': {
    'title': '🔬 探究：图形中的数量规律',
    'sub': '从特殊到一般：第 n 个图案要几颗棋子？',
    'prob': '用棋子摆图案：第 1 个图案用 1 颗棋子，第 2 个图案用 5 颗，第 3 个图案用 9 颗……<br/><br/>问：(1) 第 10 个图案用几颗棋子？(2) 第 n 个图案呢？',
    'steps': [
      '列出已知：第1个→1颗，第2个→5颗，第3个→9颗',
      '算差值：5 − 1 = <b style="color:#34d399">4</b>，9 − 5 = <b style="color:#34d399">4</b><br/>每次都多 4 颗——等差！',
      '写通项：第 n 个 = 1 + 4×(n−1) = <b style="color:#fbbf24">4n − 3</b>',
      '验证：n=1→4×1−3=1 ✓　n=2→4×2−3=5 ✓　n=3→4×3−3=9 ✓',
      '代入 n=10：4×10 − 3 = <b style="color:#fbbf24">37</b> 颗',
    ],
    'comment': '从特殊到一般——算前几个 → 找差值规律 → 写通项 → 代入验证。四步走完，任何图形规律题都是这个套路。',
    'narr': '来做一道图形规律探究题。用棋子摆图案，第一个用1颗，第二个用5颗，第三个用9颗。问第十个用几颗？第一步，列出已知，把前三个写下来。第二步，算差值：5减1等于4，9减5等于4，每次都多4颗，是等差！第三步，写通项：第一个是1，公差是4，所以第n个等于1加4乘n减1，化简得4n减3。第四步，验证：n等于1得1，n等于2得5，n等于3得9，全对。最后代入n等于10，4乘10减3等于37颗。算前几个、找差值、写通项、代入验证——四步走完，任何图形规律题都是这个套路。',
  },
  '7a-5-08': {
    'title': '🔬 探究：分类讨论',
    'sub': '一个条件，两种可能',
    'prob': '已知 |a| = 8，|b| = 5，且 ab < 0（一正一负）。<br/><br/>问：a + b 的值是多少？',
    'steps': [
      '先定方向：ab < 0 说明 a 和 b <b style="color:#fb7185">一正一负</b>，但谁正谁负不确定',
      '情况一：a > 0, b < 0 → a = 8, b = −5<br/>a + b = 8 + (−5) = <b style="color:#34d399">3</b>',
      '情况二：a < 0, b > 0 → a = −8, b = 5<br/>a + b = −8 + 5 = <b style="color:#fb7185">−3</b>',
      '两种情况都成立，所以 a + b = <b style="color:#fbbf24">3 或 −3</b><br/>只答一个就丢一半的分！',
    ],
    'comment': '分类讨论——条件说"一正一负"但没说谁正谁负，就必须两种情况都走一遍。画两条数轴分别表示，一目了然。',
    'narr': '分类讨论探究：已知a的绝对值是8，b的绝对值是5，ab小于零——说明一正一负。但谁正谁负？不确定！所以要分两种情况。情况一：a正b负，a等于8，b等于负5，a加b等于3。情况二：a负b正，a等于负8，b等于5，a加b等于负3。两种都成立，答案是3或负3。只答一个就丢一半的分。凡是条件里说一正一负、或者字母符号不确定，立刻想分类讨论。',
  },
  '7a-6-15': {
    'title': '🔬 探究：角的旋转',
    'sub': '旋转过程中，角在变化',
    'prob': '射线 OB 从 OA 出发，绕点 O 逆时针旋转。<br/><br/>问：(1) 旋转 30° 后，∠AOB 的余角是多少？<br/>(2) 旋转多少度后 OB 与 OA 垂直？',
    'steps': [
      '旋转 30° 后，∠AOB = 30°',
      '余角 = 90° − 30° = <b style="color:#34d399">60°</b>',
      'OB ⊥ OA 时，∠AOB = 90°<br/>所以旋转 <b style="color:#fbbf24">90°</b> 后垂直',
      '继续旋转到 180° 时 OB 与 OA 成平角（共线）<br/>旋转过程中：角变大 → 余角变小 → 补角变小',
    ],
    'comment': '旋转类题目画图分析最直观——画出旋转后的位置，标出各角度关系，答案就在图上。这就是数形结合。',
    'narr': '角的旋转探究。射线OB从OA出发逆时针旋转。旋转30度后，角AOB等于30度，余角等于90减30等于60度。旋转到90度时OB垂直于OA。继续旋转到180度成平角。旋转过程中角AOB在变大，余角在变小，补角也在变小。旋转类题目画图分析最直观：画出旋转后的位置，标出各角度关系，答案就在图上。这就是数形结合的思想。',
  },
}

def replace_explore(pid):
    spec = EXPLORE.get(pid)
    if not spec:
        return False
    
    html_path = os.path.join(DEMO, f'{pid}.html')
    s = open(html_path, encoding='utf-8').read()
    
    # 删除旧探究场景（从 🔬 到 scene 结束）
    # 找到含 🔬 的 scene div 并移除
    pattern = r'\n\s*<div class="scene">\s*<div class="scene-title">🔬[\s\S]*?</div>\s*(?=\n)'
    s_new = re.sub(pattern, '', s)
    
    if s_new == s:
        # 没有旧场景要删，直接追加
        pass
    else:
        s = s_new
    
    # 在 hint 前插入新场景
    scene_html = make_scene(spec['title'], spec['sub'], spec['prob'], spec['steps'], spec['comment'])
    hint = '<div class="hint">'
    s = s.replace(hint, scene_html + '\n' + hint, 1)
    
    # 更新讲解词
    narr_path = os.path.join(DEMO, f'{pid}-narrations.json')
    if os.path.exists(narr_path):
        narrs = json.load(open(narr_path))
        # 替换最后一条（旧探究词）
        narrs[-1] = spec['narr']
        json.dump(narrs, open(narr_path, 'w'), ensure_ascii=False, indent=1)
    
    open(html_path, 'w', encoding='utf-8').write(s)
    print(f'  ✅ {pid}: 探究场景重做（三段式 + 渐进揭示）')
    return True

if __name__ == '__main__':
    print('重做探究场景：')
    for pid in EXPLORE:
        replace_explore(pid)
    print('\n配音请运行（先删旧音频再重生成）：')
    print('cd app && for pid in ' + ' '.join(EXPLORE) + '; do rm -rf public/demo/$pid/*.mp3; node scripts/gen-demo-audio.mjs $pid; done')
