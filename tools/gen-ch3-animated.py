#!/usr/bin/env python3
"""第三章（代数式）5 个知识点的动画课件生成器：概念场景手工设计，例题/脑图/易错自动装配。"""
import json, os, re

ROOT = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'demo')
LESSON = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'lessons', '7a-c3.json'), encoding='utf-8'))

CSS = '''* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:-apple-system,"PingFang SC",sans-serif; background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460); color:#fff; min-height:100vh; overflow:hidden; }
.stage { width:100vw; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; }
.scene { width:90vw; max-width:900px; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); opacity:0; transition:opacity .6s ease; pointer-events:none; }
.scene.active { opacity:1; pointer-events:auto; }
.scene-title { font-size:2.2rem; font-weight:800; text-align:center; margin-bottom:12px; background:linear-gradient(90deg,#fff,#94a3b8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; opacity:0; animation:fade-in .8s .2s both; }
.scene-sub { text-align:center; font-size:1.1rem; color:#94a3b8; margin-bottom:20px; opacity:0; animation:fade-in .8s .4s both; }
@keyframes fade-in { from{opacity:0;transform:translateY(-15px)} to{opacity:1;transform:translateY(0)} }
@keyframes pop-in { from{opacity:0;transform:scale(.3)} to{opacity:1;transform:scale(1)} }
@keyframes slide-up { from{opacity:0;transform:translateY(25px)} to{opacity:1;transform:translateY(0)} }
@keyframes mm-left { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
@keyframes mindmap-line { to{opacity:1} }
@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
.card { border-radius:14px; padding:14px 22px; line-height:1.7; }
.hg { color:#34d399; font-weight:800; } .hr { color:#fb7185; font-weight:800; } .hgold { color:#fbbf24; font-weight:800; }
.hint { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); font-size:.85rem; color:#475569; }
.dot { width:10px; height:10px; border-radius:50%; background:rgba(255,255,255,.2); cursor:pointer; transition:all .3s; }
.dot.active { background:#6366f1; transform:scale(1.3); }
#dots { position:fixed; top:22px; left:50%; transform:translateX(-50%); display:flex; gap:10px; z-index:50; }'''

JS = '''(function(){
  var scenes=document.querySelectorAll('.scene');
  var dotsEl=document.getElementById('dots');
  var cur=-1;var playing=false;
  var audio=new Audio();audio.preload='auto';
  var pid=location.pathname.split('/').pop().replace('.html','');
  var sceneAudio=[];scenes.forEach(function(_,i){sceneAudio.push(pid+'/'+(i+1)+'.mp3')});
  scenes.forEach(function(_,i){var d=document.createElement('div');d.className='dot';d.onclick=function(e){e.stopPropagation();go(i)};dotsEl.appendChild(d);});
  var ctrl=document.createElement('div');
  ctrl.style.cssText='position:fixed;bottom:20px;right:20px;display:flex;align-items:center;gap:12px;z-index:100';
  ctrl.innerHTML='<div style="width:120px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden"><div id="pf" style="height:100%;width:0%;background:#6366f1;border-radius:2px"></div></div><button id="bp" style="width:48px;height:48px;border-radius:50%;background:#6366f1;border:none;color:#fff;font-size:1.4rem;cursor:pointer;display:flex;align-items:center;justify-content:center">▶</button>';
  document.body.appendChild(ctrl);
  var bp=document.getElementById('bp');var pf=document.getElementById('pf');
  function go(n){
    if(n===cur)return;
    if(cur>=0){scenes[cur].classList.remove('active');dotsEl.children[cur].classList.remove('active');}
    cur=Math.max(0,Math.min(scenes.length-1,n));
    scenes[cur].classList.add('active');dotsEl.children[cur].classList.add('active');
    scenes[cur].querySelectorAll('[data-reveal-at]').forEach(function(el){
      el.style.opacity='0';el.style.transform='translateY(20px)';el.style.transition='opacity .8s ease,transform .8s ease';
    });
    if(cur<sceneAudio.length){audio.src=sceneAudio[cur];audio.play().then(function(){playing=true;bp.textContent='⏸'}).catch(function(){playing=false;bp.textContent='▶'});}
  }
  audio.onended=function(){playing=false;bp.textContent='▶';if(cur<scenes.length-1){setTimeout(function(){go(cur+1)},500)}};
  audio.ontimeupdate=function(){
    if(audio.duration>0){var pct=audio.currentTime/audio.duration;pf.style.width=Math.round(pct*100)+'%';
      scenes[cur]&&scenes[cur].querySelectorAll('[data-reveal-at]').forEach(function(el){
        if(pct>=(parseFloat(el.dataset.revealAt)||0.4)){el.style.opacity='1';el.style.transform='translateY(0)';}
      });}
  };
  bp.onclick=function(e){e.stopPropagation();if(playing){audio.pause();playing=false;bp.textContent='▶'}else{audio.play().then(function(){playing=true;bp.textContent='⏸'}).catch(function(){})}};
  var lastGo=0;
  document.addEventListener('click',function(e){
    if(e.target.closest('#bp')||e.target.closest('.dot'))return;
    var now=Date.now();if(now-lastGo<300)return;lastGo=now;if(cur<0)return;
    if(cur<scenes.length-1)go(cur+1);else audio.pause();
  });
  document.addEventListener('keydown',function(e){
    if(e.key===' '){e.preventDefault();if(playing){audio.pause();playing=false;bp.textContent='▶'}else{audio.play().then(function(){playing=true;bp.textContent='⏸'}).catch(function(){})}}
    if(e.key==='ArrowRight'&&cur>=0)go(cur+1);
    if(e.key==='ArrowLeft'&&cur>0)go(cur-1);
  });
  var sh=document.createElement('div');
  sh.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1.5rem;color:#6366f1;cursor:pointer;z-index:200;text-align:center';
  sh.innerHTML='🎬<br><span style="font-size:1rem;color:#94a3b8">点击开始</span>';
  sh.onclick=function(e){e.stopPropagation();e.preventDefault();sh.remove();lastGo=Date.now();go(0);};
  document.body.appendChild(sh);
})();'''

# ---------- 例题/易错/脑图装配 ----------
def split_steps(sol):
    return [l.strip() for l in sol.split('\n') if l.strip()]

def strip_num(l):
    return re.sub(r'^[（(]?\d+[)）][.、．]?\s*|^第[一二三四五六七八九十\d]+步[：:]?\s*', '', l).strip()

def example_scene(idx, prob, sol, tag):
    steps = [strip_num(l) for l in split_steps(sol)]
    steps_html = ''.join(
        f'<div style="display:flex;gap:10px;margin-top:6px"><span style="flex:none;width:22px;height:22px;border-radius:50%;background:rgba(52,211,153,.25);color:#34d399;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800">{i+1}</span><span style="font-size:1rem;color:#e2e8f0;line-height:1.7">{s}</span></div>'
        for i, s in enumerate(steps))
    return {'title': f'📝 例{idx} · {tag}', 'html': f'''
<div class="card" style="background:rgba(251,191,36,.08);border:2px solid rgba(251,191,36,.35);animation:slide-up .6s .3s both">
  <b style="color:#fbbf24">题目</b>&nbsp;&nbsp;<span style="font-size:1.05rem;color:#e2e8f0">{prob[:180]}</span>
</div>
<div data-reveal-at="0.26" class="card" style="background:rgba(16,185,129,.08);border:2px solid rgba(16,185,129,.35);margin-top:12px">
  <b style="color:#34d399">解答</b>{steps_html}
</div>
<div data-reveal-at="0.8" class="card" style="background:rgba(167,139,250,.1);border:2px solid rgba(167,139,250,.35);margin-top:12px;text-align:center">
  <span style="color:#ddd6fe;font-size:.98rem"><b>点评</b>：先把题目翻译成式子，再一步步算——你会了吗？</span>
</div>''', 'narration': None}  # narration 由外层生成

def mindmap_scene(center, branches):
    colors = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#f43f5e']
    ys = [30 + i * 62 for i in range(len(branches))]
    h = ys[-1] + 62
    cy = (ys[0] + ys[-1]) // 2
    parts = [f'<rect x="40" y="{cy-30}" width="200" height="60" rx="30" fill="#6366f1" style="animation:pop-in .6s .1s both"/>',
             f'<text x="140" y="{cy+4}" text-anchor="middle" fill="#fff" font-size="17" font-weight="800" style="animation:pop-in .6s .1s both">{center}</text>']
    for i, (t, note) in enumerate(branches):
        c = colors[i % 5]
        parts.append(f'<path d="M242 {cy} C320 {cy}, 340 {ys[i]}, 372 {ys[i]}" fill="none" stroke="{c}" stroke-width="2" opacity=".5" style="opacity:0;animation:mindmap-line .8s {0.5+i*0.3}s forwards"/>')
        parts.append(f'<g style="animation:mm-left .5s {0.7+i*0.3}s both"><rect x="380" y="{ys[i]-28}" width="440" height="56" rx="14" fill="rgba(255,255,255,.05)" stroke="{c}" stroke-width="1.5"/>'
                     f'<circle cx="408" cy="{ys[i]}" r="16" fill="{c}" opacity=".25"/><text x="408" y="{ys[i]+5}" text-anchor="middle" fill="{c}" font-size="14" font-weight="800">{i+1}</text>'
                     f'<text x="434" y="{ys[i]-4}" fill="{c}" font-size="15" font-weight="700">{t}</text>'
                     f'<text x="434" y="{ys[i]+17}" fill="#94a3b8" font-size="12">{note}</text></g>')
    svg = f'<svg width="860" height="{h}" viewBox="0 0 860 {h}" style="display:block;margin:0 auto;max-width:95vw">' + ''.join(parts) + '</svg>'
    return {'title': '🔑 方法提炼', 'sub': '一张脑图收束', 'html': svg, 'narration': None}

def pitfall_scene(items):
    cards = ''
    for i, (t, d) in enumerate(items):
        cards += f'''<div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.3);animation:slide-up .6s {0.3+i*0.4}s both">
<b class="hr">坑 {i+1} · {t}</b><br/><span style="font-size:.95rem;color:#cbd5e1">{d}</span></div>'''
    return {'title': '⚠️ 易错提醒', 'sub': '把坑一个一个标出来', 'html': f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:6px">{cards}</div>' + '<div style="text-align:center;margin-top:15px;animation:slide-up .6s 1.9s both"><span style="font-size:.9rem;color:#94a3b8">记住这些坑，考试不踩雷</span></div>', 'narration': None}

# ---------- 讲解词口语化 ----------
def speak(t):
    t = re.sub(r'@@fig[\s\S]*?@@', '', t)
    return (t.replace('×', ' 乘 ').replace('÷', ' 除以 ').replace('−', '负').replace('−', '负')
             .replace('=', ' 等于 ').replace('²', '的平方').replace('≥', '大于等于').replace('≤', '小于等于')
             .replace('≠', '不等于').replace('π', '派').replace('…', '，以此类推，')
             .replace('\n', '。').replace('  ', ' '))

# ================= 各知识点规格（概念场景手工设计） =================
def s(pid):
    return [l for l in LESSON['lessons'] if l['pointId'] == pid][0]

SPECS = []

# ============ 7a-3-01 用字母表示数与代数式的概念 ============
les = s('7a-3-01')
SPECS.append({'pid': '7a-3-01', 'mind': [('字母代表什么', '任意数？正整数？范围随题意'),
    ('数量关系', '和差积商倍，对应加减乘除'),
    ('单独的数也是', '5、a 都是代数式'),
    ('等式不算', '含等号/不等号的不是代数式')],
 'concepts': [
  {'title': '🔤 字母：一只万能占位符', 'sub': '从一句算式到一条规律', 'html': '''
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:6px">
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:.85rem;color:#94a3b8">正方形边长 a</div>
    <svg width="110" height="86" viewBox="0 0 110 86"><rect x="18" y="8" width="70" height="70" fill="rgba(52,211,153,.15)" stroke="#34d399" stroke-width="2" rx="4"/><text x="53" y="50" text-anchor="middle" fill="#34d399" font-size="20" font-weight="800">a</text></svg>
    <div style="font-size:1.2rem;font-weight:800;color:#34d399">周长 = 4a</div>
  </div>
  <div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.4);text-align:center;animation:pop-in .5s .8s both">
    <div style="font-size:.85rem;color:#94a3b8">铅笔每支 2 元，买 n 支</div>
    <div style="font-size:3rem;margin:8px 0">✏️</div>
    <div style="font-size:1.2rem;font-weight:800;color:#a5b4fc">总价 = 2n</div>
  </div>
  <div class="card" style="background:rgba(245,158,11,.1);border:2px solid rgba(245,158,11,.4);text-align:center;animation:pop-in .5s 1.3s both">
    <div style="font-size:.85rem;color:#94a3b8">任意一个奇数</div>
    <div style="font-size:1.6rem;margin:8px 0;color:#fcd34d;font-weight:800">2n − 1</div>
    <div style="font-size:.85rem;color:#94a3b8">n=1→1，n=2→3，n=3→5…</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:16px;text-align:center;animation:slide-up .6s 2s both">
  <span style="font-size:1.1rem">一个字母，装得下 <b class="hg">5</b>、装得下 <b class="hg">100</b>、装得下<b class="hgold">任何一个数</b>——它是一只<b class="hgold">万能占位符</b>。</span>
</div>''',
   'narr': '小学咱们就见过字母了：正方形边长是 a，周长就是 4a；铅笔每支两元，买 n 支总价就是 2n；随便一个奇数，都能写成 2n 减 1。你发现没有？一个字母装得下 5，装得下 100，装得下任何一个数——它就是一只万能占位符。今天咱们把这件事说清楚：用字母表示数，到底有哪些讲究。'},
  {'title': '📦 什么算代数式', 'sub': '红灯绿灯，一眼分辨', 'html': '''
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);text-align:center;animation:slide-up .6s .3s both">
  <span style="font-size:1.15rem"><b class="hgold">定义</b>：用<b>运算符号</b>把数或字母连接起来的式子，叫做<b class="hgold">代数式</b>。</span>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:14px">
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);animation:slide-up .6s 1s both">
    <b class="hg">✓ 这些都是</b>
    <div style="font-size:1.25rem;font-weight:800;margin-top:6px;line-height:2">2a + 3　(m+n)/2</div>
    <div style="font-size:1rem;margin-top:4px;line-height:2"><span class="hg">单独的数</span> −7　<span class="hg">单独的字母</span> b</div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:4px">单独一个数、一个字母，也算代数式</div>
  </div>
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);animation:slide-up .6s 1.5s both">
    <b class="hr">✗ 这些不是</b>
    <div style="font-size:1.25rem;font-weight:800;margin-top:6px;line-height:2">x² − 1 <span class="hr">=</span> 0　y <span class="hr">≥</span> 0</div>
    <div style="font-size:.9rem;color:#94a3b8;margin-top:4px">带<b class="hr">等号、不等号</b>的是等式/不等式，不是代数式</div>
  </div>
</div>''',
   'narr': '代数式的定义就一句话：用运算符号把数或字母连接起来的式子。注意红绿灯：2a 加 3、m 加 n 除以 2，绿灯通过；很多人不知道，单独一个数负 7、单独一个字母 b，也算代数式；但 x 平方减 1 等于 0 带 etc 等号，y 大于等于 0 带不等号——它们是等式、不等式，红灯，不是代数式。'},
  {'title': '🎯 字母也有活动范围', 'sub': '它能代表谁，题意说了算', 'html': '''
<svg width="800" height="200" viewBox="0 0 800 200" style="display:block;margin:0 auto;max-width:95vw">
  <line x1="60" y1="110" x2="740" y2="110" stroke="#64748b" stroke-width="2.5"/><polygon points="740,110 730,105 730,115" fill="#64748b"/>
  <g font-size="14" fill="#94a3b8" text-anchor="middle">
    <line x1="150" y1="103" x2="150" y2="117" stroke="#64748b" stroke-width="2"/><text x="150" y="138">1</text>
    <line x1="300" y1="103" x2="300" y2="117" stroke="#64748b" stroke-width="2"/><text x="300" y="138">2</text>
    <line x1="450" y1="103" x2="450" y2="117" stroke="#64748b" stroke-width="2"/><text x="450" y="138">3</text>
    <line x1="600" y1="103" x2="600" y2="117" stroke="#64748b" stroke-width="2"/><text x="600" y="138">4</text>
    <text x="375" y="170" fill="#fbbf24">n 是正整数：只能站在 1、2、3、4… 这些点上</text>
  </g>
  <circle cx="150" cy="110" r="8" fill="#34d399" style="animation:pop-in .4s .5s both"/>
  <circle cx="300" cy="110" r="8" fill="#34d399" style="animation:pop-in .4s .9s both"/>
  <circle cx="450" cy="110" r="8" fill="#34d399" style="animation:pop-in .4s 1.3s both"/>
  <circle cx="600" cy="110" r="8" fill="#34d399" style="animation:pop-in .4s 1.7s both"/>
  <circle cx="225" cy="110" r="9" fill="none" stroke="#fb7185" stroke-width="2.5" style="animation:pop-in .4s 2.2s both"/>
  <line x1="218" y1="103" x2="232" y2="117" stroke="#fb7185" stroke-width="2.5" style="animation:pop-in .4s 2.2s both"/>
  <line x1="232" y1="103" x2="218" y2="117" stroke="#fb7185" stroke-width="2.5" style="animation:pop-in .4s 2.2s both"/>
  <text x="225" y="80" text-anchor="middle" fill="#fb7185" font-size="13" style="animation:pop-in .4s 2.2s both">1.5 ✗</text>
</svg>
<div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.4);margin-top:12px;text-align:center;animation:slide-up .6s 2.8s both">
  <span style="font-size:1.05rem;color:#c7d2fe">字母能代表谁，<b class="hgold">题意说了算</b>：s = vt 里 v、t 取正数；“n 是正整数”时，1.5 就不能来。</span>
</div>''',
   'narr': '还有一条容易忽略：字母也有活动范围。看这条数轴，n 是正整数，它只能站在 1、2、3、4 这些点上——1.5 想挤进来？直接打叉。路程 s 等于 vt 里，v 和 t 取正数才有意义。所以写含字母的式子之前，先问一句：这个字母，题意让它代表谁？'}],
})

# ============ 7a-3-02 列代数式与书写规范 ============
les = s('7a-3-02')
SPECS.append({'pid': '7a-3-02', 'mind': [('圈出关键词', '和差积商倍、平方、大多少'),
    ('按语言顺序翻译', '必要时加括号'),
    ('易混两对', '平方和 ≠ 和的平方；差的平方'),
    ('书写规范', '乘号省略、系数 1 省略、除号变分数线')],
 'concepts': [
  {'title': '💬 一句话，两种式子', 'sub': '“平方和”与“和的平方”只差两个字', 'html': '''
<div style="display:flex;gap:20px;margin-top:6px;justify-content:center">
  <div class="card" style="flex:1;background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);text-align:center;animation:slide-up .6s .3s both">
    <div style="font-size:.9rem;color:#94a3b8">a 与 b 的<b class="hg">平方和</b></div>
    <div style="display:flex;gap:10px;justify-content:center;margin:12px 0">
      <div style="width:64px;height:64px;border-radius:12px;background:rgba(52,211,153,.2);border:2px solid #34d399;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:800">a²</div>
      <div style="width:64px;height:64px;border-radius:12px;background:rgba(52,211,153,.2);border:2px solid #34d399;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:800">b²</div>
    </div>
    <div style="font-size:.85rem;color:#94a3b8">先各自平方 → 再相加</div>
    <div style="font-size:1.5rem;font-weight:900;color:#34d399;margin-top:6px">a² + b²</div>
  </div>
  <div class="card" style="flex:1;background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);text-align:center;animation:slide-up .6s 1s both">
    <div style="font-size:.9rem;color:#94a3b8">a 与 b 的<b class="hr">和的平方</b></div>
    <div style="display:flex;gap:6px;justify-content:center;margin:12px 0;align-items:center">
      <div style="width:34px;height:64px;border-radius:10px;background:rgba(244,63,94,.2);border:2px solid #fb7185;display:flex;align-items:center;justify-content:center;font-weight:800">a</div>
      <div style="font-weight:800;color:#fb7185">+</div>
      <div style="width:34px;height:64px;border-radius:10px;background:rgba(244,63,94,.2);border:2px solid #fb7185;display:flex;align-items:center;justify-content:center;font-weight:800">b</div>
      <div style="font-size:1.6rem">→</div>
      <div style="width:84px;height:64px;border-radius:10px;background:rgba(244,63,94,.25);border:2px solid #fb7185;display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:800">(a+b)²</div>
    </div>
    <div style="font-size:.85rem;color:#94a3b8">先合并成一块 → 再整体平方</div>
    <div style="font-size:1.5rem;font-weight:900;color:#fb7185;margin-top:6px">(a + b)²</div>
  </div>
</div>''',
   'narr': '先看一场小小的误会。小华说：把 a 与 b 的平方和求出来。注意，他要的是平方和——先各自平方，再相加，a 方加 b 方。要是你写成了 a 加 b 括号的平方，那就变成和的平方：先合并成一块，再整体平方，完全是另一道题。平方和、和的平方，就差两个字，天壤之别。怎么不踩坑？下一幕给你一本翻译词典。'},
  {'title': '📖 关键词翻译词典', 'sub': '日常语言 → 代数语言', 'html': '''
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.4);text-align:center;animation:pop-in .4s .3s both"><span style="font-size:1.05rem">“和” → <b class="hg">+</b></span></div>
  <div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.4);text-align:center;animation:pop-in .4s .6s both"><span style="font-size:1.05rem">“差” → <b class="hg">−</b>（被减数在前）</span></div>
  <div class="card" style="background:rgba(16,185,129,.1);border:2px solid rgba(16,185,129,.4);text-align:center;animation:pop-in .4s .9s both"><span style="font-size:1.05rem">“积” → <b class="hg">×</b></span></div>
  <div class="card" style="background:rgba(16,185,129,.1);border:2px solid rgba(16,185,129,.4);text-align:center;animation:pop-in .4s 1.2s both"><span style="font-size:1.05rem">“商” → <b class="hg">÷</b>（被除数在前）</span></div>
  <div class="card" style="background:rgba(245,158,11,.1);border:2px solid rgba(245,158,11,.4);text-align:center;animation:pop-in .4s 1.5s both"><span style="font-size:1.05rem">“大 3、多 3” → <b class="hgold">+ 3</b></span></div>
  <div class="card" style="background:rgba(245,158,11,.1);border:2px solid rgba(245,158,11,.4);text-align:center;animation:pop-in .4s 1.8s both"><span style="font-size:1.05rem">“少 3、小 3” → <b class="hgold">− 3</b></span></div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:14px;text-align:center;animation:slide-up .6s 2.3s both">
  <span style="font-size:1rem">口诀：<b class="hgold">先圈关键词，再按语言顺序翻译</b>——“比 a 的 2 倍大 3” → 2a <b class="hg">+</b> 3</span>
</div>''',
   'narr': '这本词典背下来，翻译就不慌：和，用加号；差，用减号，注意被减数在前；积，乘号；商，除号，被除数在前；大 3、多 3 就是加 3；少 3、小 3 就是减 3。口诀是：先圈关键词，再按语言顺序翻译。比如比 a 的 2 倍大 3——a 的 2 倍是 2a，大 3 就加 3，得 2a 加 3。'},
  {'title': '✍️ 书写四条规矩', 'sub': '代数式有自己的排版礼仪', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);display:flex;align-items:center;justify-content:center;gap:18px;animation:slide-up .5s .3s both">
    <span style="font-size:1.15rem;color:#94a3b8">2 × a</span><span style="font-size:1.3rem">→</span><span style="font-size:1.3rem;font-weight:800;color:#34d399">2a</span>
    <span style="font-size:.85rem;color:#94a3b8">数乘字母，乘号省略</span>
  </div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);display:flex;align-items:center;justify-content:center;gap:18px;animation:slide-up .5s .9s both">
    <span style="font-size:1.15rem;color:#94a3b8">1 × a</span><span style="font-size:1.3rem">→</span><span style="font-size:1.3rem;font-weight:800;color:#34d399">a</span>
    <span style="font-size:.85rem;color:#94a3b8">系数 1 省略不写</span>
  </div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);display:flex;align-items:center;justify-content:center;gap:18px;animation:slide-up .5s 1.5s both">
    <span style="font-size:1.15rem;color:#94a3b8">a ÷ 2</span><span style="font-size:1.3rem">→</span><span style="font-size:1.3rem;font-weight:800;color:#34d399">a/2</span>
    <span style="font-size:.85rem;color:#94a3b8">除号改成分数线</span>
  </div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);display:flex;align-items:center;justify-content:center;gap:18px;animation:slide-up .5s 2.1s both">
    <span style="font-size:1.15rem;color:#94a3b8">3 × (x − 1)</span><span style="font-size:1.3rem">→</span><span style="font-size:1.3rem;font-weight:800;color:#34d399">3(x − 1)</span>
    <span style="font-size:.85rem;color:#94a3b8">数在括号前，乘号也省略</span>
  </div>
</div>''',
   'narr': '写出来的式子要讲礼仪，四条规矩：数乘字母，乘号省略，2 乘 a 写 2a；系数是 1 的时候省略，1a 就写 a；除号要改成分数线，a 除以 2 写成二分之 a；数放在括号前面，乘号也省略，3 乘括号 x 减 1，直接写 3 括号 x 减 1。这四条，从今天起养成习惯。'}],
})

# ============ 7a-3-03 正比例与反比例 ============
les = s('7a-3-03')
SPECS.append({'pid': '7a-3-03', 'mind': [('点名两个量', '分清谁是 x、谁是 y'),
    ('写等量关系', '公式或题意翻成等式'),
    ('比值一定', 'y/x = k（k≠0）→ 正比例'),
    ('乘积一定', 'xy = k（k≠0）→ 反比例')],
 'concepts': [
  {'title': '📈 一起变 vs 反着变', 'sub': '两种关联量，两种脾气', 'html': '''
<div style="display:flex;gap:20px;margin-top:6px">
  <div class="card" style="flex:1;background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);animation:slide-up .6s .3s both">
    <b class="hg">笔记本：单价 4 元不变</b>
    <svg width="100%" height="150" viewBox="0 0 320 150">
      <rect x="20" y="110" width="40" height="24" fill="rgba(52,211,153,.6)" style="animation:slide-up .5s .8s both"/>
      <rect x="90" y="86" width="40" height="48" fill="rgba(52,211,153,.7)" style="animation:slide-up .5s 1.2s both"/>
      <rect x="160" y="62" width="40" height="72" fill="rgba(52,211,153,.8)" style="animation:slide-up .5s 1.6s both"/>
      <rect x="230" y="38" width="40" height="96" fill="rgba(52,211,153,.9)" style="animation:slide-up .5s 2s both"/>
      <g font-size="12" fill="#94a3b8" text-anchor="middle">
        <text x="40" y="140">1本 4元</text><text x="110" y="140">2本 8元</text><text x="180" y="140">3本 12元</text><text x="250" y="140">4本 16元</text>
      </g>
      <text x="160" y="20" text-anchor="middle" fill="#34d399" font-size="13" font-weight="700">本数×2，总价也×2 —— 一起变大</text>
    </svg>
  </div>
  <div class="card" style="flex:1;background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);animation:slide-up .6s .8s both">
    <b class="hr">上学路 200 米不变</b>
    <svg width="100%" height="150" viewBox="0 0 320 150">
      <rect x="30" y="30" width="30" height="90" fill="rgba(244,63,94,.55)" style="animation:pop-in .5s 1.4s both"/>
      <rect x="110" y="60" width="30" height="60" fill="rgba(244,63,94,.7)" style="animation:pop-in .5s 1.8s both"/>
      <rect x="190" y="80" width="30" height="40" fill="rgba(244,63,94,.85)" style="animation:pop-in .5s 2.2s both"/>
      <rect x="260" y="95" width="30" height="25" fill="rgba(244,63,94,1)" style="animation:pop-in .5s 2.6s both"/>
      <g font-size="12" fill="#94a3b8" text-anchor="middle">
        <text x="45" y="138">速度20 用10分</text><text x="125" y="138">速度40 用5分</text><text x="205" y="138">速度60</text><text x="275" y="138">速度80</text>
      </g>
      <text x="160" y="20" text-anchor="middle" fill="#fb7185" font-size="13" font-weight="700">速度变大，时间变小 —— 反着变</text>
    </svg>
  </div>
</div>''',
   'narr': '先看两种脾气。买同一种笔记本，单价 4 元不变：买 1 本花 4 元，2 本 8 元，3 本 12 元——本数翻倍，总价也翻倍，两个量一起变大，好得像双胞胎。再看上学路：全程 200 米不变，速度 20 时用 10 分钟，提到 40 就只要 5 分钟——速度变大，时间反而变小，这俩是反着来的。一起变的、反着变的，就是今天的两位主角：正比例和反比例。'},
  {'title': '⚖️ 两把判定钥匙', 'sub': '比值一定？乘积一定？', 'html': '''
<div style="display:flex;gap:20px;margin-top:6px">
  <div class="card" style="flex:1;background:rgba(52,211,153,.1);border:3px solid rgba(52,211,153,.5);text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:.9rem;color:#94a3b8">比值一定（同扩同缩）</div>
    <div style="font-size:2rem;font-weight:900;color:#34d399;margin:10px 0">y / x = k</div>
    <div style="font-size:1.1rem;font-weight:800;color:#34d399">y 与 x 成<b>正比例</b></div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:6px">k≠0 · 也可写 y = kx</div>
  </div>
  <div class="card" style="flex:1;background:rgba(244,63,94,.1);border:3px solid rgba(244,63,94,.5);text-align:center;animation:pop-in .5s 1s both">
    <div style="font-size:.9rem;color:#94a3b8">乘积一定（一扩一缩）</div>
    <div style="font-size:2rem;font-weight:900;color:#fb7185;margin:10px 0">x · y = k</div>
    <div style="font-size:1.1rem;font-weight:800;color:#fb7185">y 与 x 成<b>反比例</b></div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:6px">k≠0 · 一个变大另一个变小</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:16px;text-align:center;animation:slide-up .6s 1.8s both">
  <span style="font-size:1.05rem">判定就一句：<b class="hgold">算出 y/x 或 xy，看它是不是不为 0 的定值</b></span>
</div>''',
   'narr': '判定就两把钥匙。第一把：把 y 除以 x 算出来，如果是个不为 0 的定值 k，两个量同扩同缩，y 与 x 成正比例，也可以写成 y 等于 kx。第二把：把 x 乘 y 算出来，如果是个不为 0 的定值 k，一个变大另一个变小，成反比例。记住那个不起眼但致命的括号条件：k 不等于 0。'},
  {'title': '🔍 图像长相', 'sub': '一眼认出它们', 'html': '''
<div style="display:flex;gap:20px;margin-top:6px">
  <div class="card" style="flex:1;background:rgba(52,211,153,.08);border:2px solid rgba(52,211,153,.4);text-align:center;animation:slide-up .6s .3s both">
    <div style="font-size:.9rem;color:#94a3b8;margin-bottom:6px">正比例 y = kx：过原点的直线</div>
    <svg width="90%" height="170" viewBox="0 0 280 170">
      <line x1="30" y1="140" x2="260" y2="140" stroke="#64748b" stroke-width="2"/><line x1="30" y1="140" x2="30" y2="15" stroke="#64748b" stroke-width="2"/>
      <line x1="30" y1="140" x2="245" y2="25" stroke="#34d399" stroke-width="3.5" stroke-linecap="round" opacity="0" style="animation:mindmap-line 1s 1s forwards"/>
      <circle cx="30" cy="140" r="5" fill="#fbbf24" style="animation:pop-in .4s .8s both"/>
      <text x="150" y="60" fill="#34d399" font-size="12" opacity="0" style="animation:mindmap-line .5s 1.8s forwards">一路向上 ↑</text>
    </svg>
  </div>
  <div class="card" style="flex:1;background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);text-align:center;animation:slide-up .6s .8s both">
    <div style="font-size:.9rem;color:#94a3b8;margin-bottom:6px">反比例 xy = k：双曲线</div>
    <svg width="90%" height="170" viewBox="0 0 280 170">
      <line x1="30" y1="140" x2="260" y2="140" stroke="#64748b" stroke-width="2"/><line x1="140" y1="15" x2="140" y2="160" stroke="#64748b" stroke-width="2"/>
      <path d="M40 25 Q70 120 138 158" fill="none" stroke="#fb7185" stroke-width="3.5" opacity="0" style="animation:mindmap-line 1s 1.2s forwards"/>
      <path d="M142 12 Q210 40 252 135" fill="none" stroke="#fb7185" stroke-width="3.5" opacity="0" style="animation:mindmap-line 1s 1.6s forwards"/>
      <text x="60" y="110" fill="#fb7185" font-size="12" opacity="0" style="animation:mindmap-line .5s 2.2s forwards">越走越低 ↘</text>
    </svg>
  </div>
</div>''',
   'narr': '顺便记一下它们的长相：正比例 y 等于 kx 的图像，是一条经过原点的直线，一路向上；反比例的图像是双曲线，一支在第一象限往下弯，一支在第三象限往上弯，永远不碰坐标轴。现在图相和式子都对上号了，来做两道题练练手。'}],
})

# ============ 7a-3-04 求代数式的值 ============
les = s('7a-3-04')
SPECS.append({'pid': '7a-3-04', 'mind': [('能化简先化简', '去括号合并，式子变短'),
    ('代入加括号', '负数、分数一律加括号'),
    ('按顺序算', '先乘方，再乘除，后加减'),
    ('算完回头查', '符号、括号、单位都检查')],
 'concepts': [
  {'title': '🎰 同一个式子，喂不同的数', 'sub': '2x + 1 是台小机器', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:22px;margin-top:20px">
  <div style="text-align:center">
    <div style="font-size:.85rem;color:#94a3b8;margin-bottom:6px">输入 x</div>
    <div style="width:110px;height:70px;border-radius:14px;background:rgba(99,102,241,.15);border:2px solid #818cf8;display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:900;color:#a5b4fc" id="inslot">3</div>
  </div>
  <div style="text-align:center">
    <div style="width:150px;height:90px;border-radius:16px;background:rgba(251,191,36,.12);border:3px solid rgba(251,191,36,.5);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:900;color:#fbbf24">2x + 1</div>
    <div style="font-size:.85rem;color:#94a3b8;margin-top:6px">加工机器</div>
  </div>
  <div style="text-align:center">
    <div style="font-size:.85rem;color:#94a3b8;margin-bottom:6px">输出</div>
    <div style="width:110px;height:70px;border-radius:14px;background:rgba(52,211,153,.15);border:2px solid #34d399;display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:900;color:#34d399" id="outslot">7</div>
  </div>
</div>
<div style="display:flex;justify-content:center;gap:14px;margin-top:22px">
  <div style="padding:8px 18px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);animation:pop-in .4s 1s both">x = 3 → <b class="hg">7</b></div>
  <div style="padding:8px 18px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);animation:pop-in .4s 1.6s both">x = 0 → <b class="hg">1</b></div>
  <div style="padding:8px 18px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);animation:pop-in .4s 2.2s both">x = −4 → <b class="hr">−7</b></div>
</div>''',
   'narr': '把 2x 加 1 想成一台小机器：左边喂进去一个 x，右边吐出一个结果。喂 3，出来 7；喂 0，出来 1；喂负 4，出来负 7。同一个式子，字母取不同的值，结果就不同——这就是求代数式的值：用具体数值代替字母，按运算关系算出结果。'},
  {'title': '📥 负数要穿外套', 'sub': '代入时括号是保命符', 'html': '''
<div style="display:flex;flex-direction:column;gap:14px;margin-top:6px">
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);text-align:center;animation:slide-up .6s .3s both">
    <span style="font-size:.95rem;color:#94a3b8">x = −3，代入 2x + 1</span>
    <div style="font-size:1.5rem;font-weight:900;margin-top:8px">2 × <span style="color:#fb7185">(−3)</span> + 1</div>
    <div style="font-size:.9rem;color:#94a3b8;margin-top:6px">负数一进门就穿上括号外套，防止符号逃跑</div>
  </div>
  <div class="card" style="background:rgba(245,158,11,.08);border:2px solid rgba(245,158,11,.4);text-align:center;animation:slide-up .6s 1.1s both">
    <span style="font-size:.95rem;color:#94a3b8">x = −2/3，代入 3x²</span>
    <div style="font-size:1.5rem;font-weight:900;margin-top:8px">3 × <span style="color:#fbbf24">(−2/3)²</span></div>
    <div style="font-size:.9rem;color:#94a3b8;margin-top:6px">分数、乘方里的负数更要括号——整个分数一起平方</div>
  </div>
</div>''',
   'narr': '代入有个保命符：括号。x 等于负 3，要写成 2 乘括号负 3 加 1——负数一进门就穿上括号外套，防止符号半路逃跑。x 等于负三分之二、还要平方的时候更得包严实：3 乘括号负三分之二括号的平方，整个分数一起平方。记住：负数、分数、乘方前面，一律加括号。'},
  {'title': '⚡ (−3)² ≠ −3²', 'sub': '一对最坑的孪生兄弟', 'html': '''
<div style="display:flex;gap:20px;margin-top:6px;justify-content:center">
  <div class="card" style="flex:1;max-width:340px;background:rgba(52,211,153,.1);border:3px solid rgba(52,211,153,.5);text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:2.4rem;font-weight:900;color:#34d399">(−3)²</div>
    <div style="font-size:.9rem;color:#94a3b8;margin:6px 0">括号是底数的一部分<br/>底数是 −3</div>
    <div style="font-size:2rem;font-weight:900">(−3)×(−3) = <b class="hg">9</b></div>
  </div>
  <div class="card" style="flex:1;max-width:340px;background:rgba(244,63,94,.1);border:3px solid rgba(244,63,94,.5);text-align:center;animation:pop-in .5s 1s both">
    <div style="font-size:2.4rem;font-weight:900;color:#fb7185">−3²</div>
    <div style="font-size:.9rem;color:#94a3b8;margin:6px 0">只平方 3，负号站在门外<br/>底数是 3</div>
    <div style="font-size:2rem;font-weight:900">−(3×3) = <b class="hr">−9</b></div>
  </div>
</div>''',
   'narr': '来认识一对最坑的孪生兄弟。括号负 3 的平方，括号是底数的一部分，底数是负 3，负 3 乘负 3 等于 9。而负 3 的平方不加括号，只平方 3，负号站在门外，结果是负 9。一个 9 一个负 9，全看括号在不在。这对兄弟在考试里专门蹲守粗心的人，你可别踩。'}],
})

# ============ 7a-3-05 公式代入与整体代入 ============
les = s('7a-3-05')
SPECS.append({'pid': '7a-3-05', 'mind': [('写公式', '公式就是现成的代数式'),
    ('对号代入', '字母在哪，数就代到哪'),
    ('圈出那一块', '如 x²+x、a+b 是一个整体'),
    ('变形凑整', '把式子凑出已知的那块')],
 'concepts': [
  {'title': '🧮 公式就是现成的代数式', 'sub': 'S = πr²：拿来就代', 'html': '''
<div style="display:flex;align-items:center;justify-content:center;gap:26px;margin-top:20px">
  <div class="card" style="background:rgba(99,102,241,.1);border:3px solid rgba(99,102,241,.5);text-align:center;animation:pop-in .5s .3s both">
    <div style="font-size:.85rem;color:#94a3b8">圆的面积公式</div>
    <div style="font-size:2rem;font-weight:900;color:#a5b4fc">S = πr²</div>
  </div>
  <div style="text-align:center;animation:pop-in .5s 1s both">
    <div style="font-size:.85rem;color:#94a3b8">半径 r = 3</div>
    <div style="margin-top:6px;font-size:2rem">→</div>
  </div>
  <div class="card" style="background:rgba(52,211,153,.1);border:3px solid rgba(52,211,129,.5);text-align:center;animation:pop-in .5s 1.6s both">
    <div style="font-size:.85rem;color:#94a3b8">代入</div>
    <div style="font-size:1.3rem;font-weight:800;color:#34d399;line-height:1.8">S = π × 3² = 9π（cm²）</div>
  </div>
</div>
<div class="card" style="background:rgba(251,191,36,.1);border:2px solid rgba(251,191,36,.4);margin-top:18px;text-align:center;animation:slide-up .6s 2.2s both">
  <span style="font-size:1.05rem">周长、面积、体积公式……<b class="hgold">都是现成的代数式</b>：写公式 → 对号代入 → 按顺序算 → 带单位</span>
</div>''',
   'narr': '公式求值最直白：公式就是现成的代数式。圆的半径是 3，面积怎么求？写公式 S 等于 派 r 方，把 r 等于 3 代进去，S 等于 派 乘 3 的平方，等于 9 派，单位平方厘米。套路四步：写公式、对号代入、按顺序算、带上单位。'},
  {'title': '🧩 圈出那一块', 'sub': '整体代入：不必求出字母自己', 'html': '''
<div style="display:flex;flex-direction:column;gap:14px;margin-top:6px">
  <div class="card" style="background:rgba(251,191,36,.08);border:2px solid rgba(251,191,36,.4);text-align:center;animation:slide-up .6s .3s both">
    <span style="font-size:1.1rem">已知 <b class="hgold">x² + x = 3</b>（把这一块看成整体）</span>
  </div>
  <div style="text-align:center;animation:slide-up .7s 1s both">
    <span style="font-size:1.9rem;font-weight:900">2<span style="color:#fbbf24;background:rgba(251,191,36,.18);border:2px dashed #fbbf24;border-radius:8px;padding:2px 8px">x² + x</span> − 5</span>
    <div style="font-size:.9rem;color:#94a3b8;margin-top:8px">要求的式子里，藏着 2 个这样的块</div>
  </div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:slide-up .7s 1.8s both">
    <div style="font-size:1.35rem;font-weight:900;line-height:2">= 2 × <b class="hgold">(x² + x)</b> − 5 = 2 × <b class="hgold">3</b> − 5 = <b class="hg">1</b></div>
  </div>
</div>''',
   'narr': '再看一招神操作：整体代入。已知 x 方加 x 等于 3，求 2x 方加 2x 减 5。别急着解方程求 x——把 x 方加 x 这一整块圈出来，你会发现要求的式子里正好藏着两个这样的块：2 乘括号 x 方加 x，再减 5。整块代进去，2 乘 3 减 5，等于 1。全程没求出 x 是多少，照样把值算出来了。'},
  {'title': '🔀 变形凑整', 'sub': '没有现成的块？自己造一个', 'html': '''
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">
  <div class="card" style="background:rgba(244,63,94,.08);border:2px solid rgba(244,63,94,.4);text-align:center;animation:slide-up .6s .3s both">
    <span style="font-size:1.05rem">已知 x + 1/x = 3，求 x² + 1/x² = ？</span>
  </div>
  <div class="card" style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.4);text-align:center;animation:slide-up .6s 1s both">
    <div style="font-size:1.2rem;font-weight:800;line-height:2.1;color:#c7d2fe">x² + 1/x² = <span style="color:#fbbf24">(x + 1/x)²</span> − 2</div>
    <div style="font-size:.9rem;color:#94a3b8">完全平方展开后，中间项 2×x×(1/x) = 2，减掉它就凑出已知块</div>
  </div>
  <div class="card" style="background:rgba(52,211,153,.08);border:2px solid rgba(52,211,129,.4);text-align:center;animation:slide-up .6s 1.8s both">
    <div style="font-size:1.35rem;font-weight:900">= 3² − 2 = <b class="hg">7</b></div>
  </div>
</div>''',
   'narr': '有时候式子里没有现成的块，怎么办？自己造一个。已知 x 加 x 分之一等于 3，求 x 方加 x 方分之一。用完全平方：x 加 x 分之一的平方，展开正好是 x 方加 2 加 x 方分之一，所以 x 方加 x 方分之一，等于括号的平方减 2。整块代进去，3 的平方减 2，等于 7。看到一块、代一块；没有块，就变形凑出一块。'}],
})

# ================= 组装与写出 =================
def build(spec):
    pid = spec['pid']
    les = s(pid)
    scenes = []
    for c in spec['concepts']:
        scenes.append(c)
    # 例题（取 problem/solution）
    exs = [sl for sl in les['slides'] if sl['kind'] == 'example']
    for i, ex in enumerate(exs, 1):
        prob = (ex.get('problem') or '')[:200].replace('\n', ' ')
        scenes.append(example_scene(i, prob, ex.get('solution') or '', ex.get('title', f'例{i}').replace(f'例{i} ', '') or ''))
    scenes.append(mindmap_scene(spec['mind_center'] if 'mind_center' in spec else spec['mind'][0][0], spec['mind']))
    # 易错
    pit = next((sl for sl in les['slides'] if sl['kind'] == 'pitfall'), None)
    items = []
    if pit:
        for line in (pit.get('body') or '').split('\n'):
            m = re.match(r'\s*(\d+)[.、．]\s*(.+)', line.strip())
            if m:
                seg = m.group(2)
                if '：' in seg and len(seg.split('：')[0]) < 14:
                    t, d = seg.split('：', 1)
                elif ':' in seg and len(seg.split(':')[0]) < 14:
                    t, d = seg.split(':', 1)
                else:
                    t, d = seg[:12], seg
                items.append((t.strip(), d.strip()[:90]))
    scenes.append(pitfall_scene(items[:4]))
    # 讲解词
    narrations = []
    for i, sc in enumerate(scenes):
        if sc.get('narr'):
            narrations.append(sc['narr'])
        else:
            if sc['title'].startswith('📝'):
                # 例题讲解词：读题眼 + 分步
                ex = exs[0] if len(narrations) <= 3 else exs[1] if len(exs) > 1 else exs[0]
                steps = [strip_num(l) for l in split_steps(ex.get('solution') or '')]
                step_speak = '。'.join(f'第{"一二三四五"[k]}步，{speak(x)[:80]}' for k, x in enumerate(steps[:4]))
                narrations.append(f'来看这道题，先自己想一想再看解答。题目说：{speak(ex.get("problem") or "")[:100]}。我们一起来：{step_speak}。你发现了吗？关键就是把题意一步步翻译成式子，再按顺序算。听懂了，一会儿练习里换数字再试。')
            elif sc['title'].startswith('🔑'):
                brs = '。'.join(f'第{"一二三四五"[k]}，{t}：{n}' for k, (t, n) in enumerate(spec['mind']))
                narrations.append(f'这个知识点，用这张脑图收个尾。{brs}。把这张图记在脑子里，这类题就有了固定的下手顺序。')
            else:
                pits = '。'.join(f'坑{chr(0x2460+i)}，{t}' for i, (t, _) in enumerate(items[:4]))
                narrations.append(f'最后几个坑，注意避开。{pits}。记住这些坑，考试不踩雷。')
    # 写 HTML
    body = ''
    for sc in scenes:
        sub = f'<div class="scene-sub">{sc["sub"]}</div>' if sc.get('sub') else ''
        body += f'\n  <div class="scene"><div class="scene-title">{sc["title"]}</div>{sub}{sc["html"]}\n  </div>\n'
    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>{s(pid)["title"]}</title>
<style>
{CSS}
</style>
</head>
<body>
<div id="dots"></div>
<div class="stage">
{body}
<div class="hint">点击画面或按空格键 →</div>
</div>
<script>
{JS}
</script>
</body>
</html>'''
    open(os.path.join(ROOT, f'{pid}.html'), 'w', encoding='utf-8').write(html)
    os.makedirs(os.path.join(ROOT, pid), exist_ok=True)
    json.dump(narrations, open(os.path.join(ROOT, f'{pid}-narrations.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'✅ {pid}: {len(scenes)} 场景，讲解词 {len(narrations)} 条')

for spec in SPECS:
    build(spec)
print('第三章 5 个知识点生成完毕')
