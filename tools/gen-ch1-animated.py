#!/usr/bin/env python3
"""生成第一章剩余 9 个知识点的动画课件 HTML + 讲解稿 JSON"""
import json, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'demo')
os.makedirs(OUT, exist_ok=True)

# 共用 CSS（精简版）
CSS = """<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,"PingFang SC",sans-serif;background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);color:#fff;min-height:100vh;overflow:hidden}
.stage{width:100vw;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}
.scene{width:90vw;max-width:900px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0;transition:opacity .6s ease;pointer-events:none}
.scene.active{opacity:1;pointer-events:auto}
.particle{position:absolute;border-radius:50%;animation:float 3s ease-in-out infinite;pointer-events:none}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
.scene-title{font-size:2.2rem;font-weight:800;text-align:center;margin-bottom:12px;background:linear-gradient(90deg,#fff,#94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;opacity:0;animation:fade-in .8s .2s both}
.scene-sub{text-align:center;font-size:1.1rem;color:#94a3b8;margin-bottom:20px;opacity:0;animation:fade-in .8s .4s both}
@keyframes fade-in{from{opacity:0;transform:translateY(-15px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop-in{0%{transform:scale(0) rotate(-10deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes slide-up{0%{transform:translateY(40px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes slide-left{0%{transform:translateX(-40px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes drop-in{0%{transform:translateY(-30px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes draw-line{to{stroke-dashoffset:0}}
.anim-pop{animation:pop-in .6s cubic-bezier(.68,-0.55,.265,1.55) both}
.anim-up{animation:slide-up .7s ease both}
.anim-left{animation:slide-left .7s ease both}
.anim-drop{animation:drop-in .6s cubic-bezier(.68,-0.55,.265,1.55) both}
.anim-bounce{animation:bounce 1.5s ease-in-out infinite}
.anim-pulse{animation:pulse 1.5s ease-in-out infinite}
.svg-line{stroke-dasharray:1000;stroke-dashoffset:1000;animation:draw-line 1.5s ease forwards}
.card{background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.2);border-radius:16px;padding:20px 30px;text-align:center;backdrop-filter:blur(10px)}
.green{color:#10b981}.red{color:#f43f5e}.gold{color:#f59e0b}.blue{color:#60a5fa}
.bg-green{background:rgba(16,185,129,.15);border-color:rgba(16,185,129,.4)}
.bg-red{background:rgba(244,63,94,.15);border-color:rgba(244,63,94,.4)}
.bg-gold{background:rgba(245,158,11,.15);border-color:rgba(245,158,11,.4)}
.bg-blue{background:rgba(96,165,250,.15);border-color:rgba(96,165,250,.4)}
.hint{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);font-size:.9rem;color:#64748b;animation:bob 1.5s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-8px)}}
.dots{position:absolute;top:20px;left:50%;transform:translateX(-50%);display:flex;gap:10px}
.dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.2);cursor:pointer;transition:all .3s}
.dot.active{background:#6366f1;transform:scale(1.3)}
</style>"""

JS = """<script>
const scenes=document.querySelectorAll('.scene');const dotsEl=document.getElementById('dots');let cur=-1;let playing=false;
const audio=new Audio();audio.preload='auto';
const pid=location.pathname.split('/').pop().replace('.html','');
const sceneAudio=Array.from(scenes).map((_,i)=>`${pid}/${i+1}.mp3`);
scenes.forEach((_,i)=>{const d=document.createElement('div');d.className='dot';d.onclick=e=>{e.stopPropagation();go(i)};dotsEl.appendChild(d)});
const ctrl=document.createElement('div');ctrl.style.cssText='position:fixed;bottom:20px;right:20px;display:flex;align-items:center;gap:12px;z-index:100';
ctrl.innerHTML=`<div style="width:120px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden"><div id="pf" style="height:100%;width:0%;background:#6366f1;border-radius:2px;transition:width .3s"></div></div><button id="bp" style="width:48px;height:48px;border-radius:50%;background:#6366f1;border:none;color:#fff;font-size:1.4rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(99,102,241,.4)">▶</button>`;
document.body.appendChild(ctrl);const bp=document.getElementById('bp'),pf=document.getElementById('pf');
function go(n){if(n===cur)return;if(cur>=0){scenes[cur].classList.remove('active');dotsEl.children[cur].classList.remove('active')}cur=Math.max(0,Math.min(scenes.length-1,n));scenes[cur].classList.add('active');dotsEl.children[cur].classList.add('active');scenes[cur].querySelectorAll('[style*="animation"]').forEach(el=>{el.style.animation='none';el.offsetHeight;el.style.animation=''});audio.src=sceneAudio[cur];play()}
function play(){audio.play().then(()=>{playing=true;bp.textContent='⏸'}).catch(()=>{playing=false;bp.textContent='▶'})}
function pause(){audio.pause();playing=false;bp.textContent='▶'}
bp.onclick=e=>{e.stopPropagation();playing?pause():play()};
audio.onended=()=>{if(cur<scenes.length-1)setTimeout(()=>go(cur+1),500);else pause()};
audio.ontimeupdate=()=>{if(audio.duration>0)pf.style.width=Math.round(audio.currentTime/audio.duration*100)+'%'};
document.addEventListener('click',e=>{if(e.target.closest('#bp')||e.target.closest('.dot'))return;if(cur<scenes.length-1)go(cur+1);else pause()});
document.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();playing?pause():play()}if(e.key==='ArrowRight')go(cur+1);if(e.key==='ArrowLeft')go(cur-1)});
const sh=document.createElement('div');sh.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1.5rem;color:#6366f1;cursor:pointer;z-index:200;text-align:center';sh.innerHTML='🎬<br><span style="font-size:1rem;color:#94a3b8">点击开始</span>';sh.onclick=()=>{go(0);sh.remove()};document.body.appendChild(sh);
</script>"""

def html(pid, title, scenes_html):
    return f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><title>{title}</title>{CSS}</head>
<body><div class="stage">
<div class="particle" style="width:6px;height:6px;background:#6366f1;top:15%;left:10%;opacity:.3"></div>
<div class="particle" style="width:4px;height:4px;background:#0ea5e9;top:25%;left:85%;animation-delay:1s;opacity:.2"></div>
<div class="particle" style="width:8px;height:8px;background:#f59e0b;bottom:20%;left:15%;animation-delay:2s;opacity:.15"></div>
<div class="dots" id="dots"></div>
{scenes_html}
<div class="hint">点击画面或按空格键 →</div>
</div>{JS}</body></html>"""

# ===== 9 个知识点的场景 =====
LESSONS = {}

# 7a-1-03 有理数的分类（树形图动画）
LESSONS['7a-1-03'] = {'title':'有理数的概念与分类','scenes':[
{'html':"""<div class="scene"><div class="scene-title">🌳 给学过的数"排排队"</div><div class="scene-sub">正数、负数、0——统称有理数</div>
<div style="display:flex;justify-content:center;gap:30px;margin-top:20px">
<div class="card bg-green anim-pop" style="animation-delay:.2s"><div style="font-size:2rem">1, 2, 3…</div><div class="green" style="margin-top:6px">正整数</div></div>
<div class="card bg-gold anim-pop" style="animation-delay:.5s"><div style="font-size:2rem">0</div><div class="gold" style="margin-top:6px">零</div></div>
<div class="card bg-red anim-pop" style="animation-delay:.8s"><div style="font-size:2rem">−1, −2…</div><div class="red" style="margin-top:6px">负整数</div></div>
<div class="card bg-blue anim-pop" style="animation-delay:1.1s"><div style="font-size:1.5rem">1/2, −3/4…</div><div class="blue" style="margin-top:6px">分数</div></div>
</div>
<div class="card anim-up" style="margin-top:20px;animation-delay:1.5s"><div style="font-size:1.2rem">整数 ∪ 分数 = <b class="gold">有理数</b></div></div></div>""",
'narration':'我们学过的数越来越多了。正整数，像 1、2、3。零。负整数，像负 1、负 2。还有分数，像二分之一、负四分之三。现在把它们集中起来，统称有理数。有理数等于整数并上分数。'},
{'html':"""<div class="scene"><div class="scene-title">🔍 两把分类的尺子</div><div class="scene-sub">按"符号"分 or 按"定义"分</div>
<div style="display:flex;justify-content:center;gap:50px;margin-top:20px">
<div><div style="text-align:center;font-size:1.1rem;font-weight:700;margin-bottom:12px;color:#60a5fa">📏 按符号分</div>
<div class="card bg-green anim-up" style="animation-delay:.2s;padding:12px 20px;margin-bottom:8px"><span class="green">正有理数</span></div>
<div class="card bg-gold anim-up" style="animation-delay:.4s;padding:12px 20px;margin-bottom:8px"><span class="gold">0</span></div>
<div class="card bg-red anim-up" style="animation-delay:.6s;padding:12px 20px"><span class="red">负有理数</span></div></div>
<div><div style="text-align:center;font-size:1.1rem;font-weight:700;margin-bottom:12px;color:#f59e0b">📐 按定义分</div>
<div class="card bg-blue anim-up" style="animation-delay:.3s;padding:12px 20px;margin-bottom:8px"><span class="blue">整数</span><span style="font-size:.8rem;color:#94a3b8">（正整数、0、负整数）</span></div>
<div class="card bg-blue anim-up" style="animation-delay:.5s;padding:12px 20px"><span class="blue">分数</span><span style="font-size:.8rem;color:#94a3b8">（正分数、负分数）</span></div></div></div>
<div class="card anim-up" style="margin-top:20px;animation-delay:1s"><div style="font-size:.95rem;color:#94a3b8">分类标准不同，结果不同——但每个数的归属是唯一的</div></div></div>""",
'narration':'分类有两把尺子。第一把，按符号分。正有理数、零、负有理数。第二把，按定义分。整数和分数。分类标准不同，结果不同。但每个数的归属是唯一的。'},
{'html':"""<div class="scene"><div class="scene-title">⚡ 快速判断</div><div class="scene-sub">这些数分别是什么？</div>
<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:15px;margin-top:20px">
<div class="card anim-pop" style="animation-delay:.2s;padding:15px 25px"><span style="font-size:1.5rem;font-weight:700">−7</span><div class="red" style="font-size:.85rem">负整数</div></div>
<div class="card anim-pop" style="animation-delay:.4s;padding:15px 25px"><span style="font-size:1.5rem;font-weight:700">0</span><div class="gold" style="font-size:.85rem">整数（非正非负）</div></div>
<div class="card anim-pop" style="animation-delay:.6s;padding:15px 25px"><span style="font-size:1.5rem;font-weight:700">3.5</span><div class="blue" style="font-size:.85rem">正分数</div></div>
<div class="card anim-pop" style="animation-delay:.8s;padding:15px 25px"><span style="font-size:1.5rem;font-weight:700">−2/3</span><div class="blue" style="font-size:.85rem">负分数</div></div>
<div class="card anim-pop" style="animation-delay:1s;padding:15px 25px"><span style="font-size:1.5rem;font-weight:700">100</span><div class="green" style="font-size:.85rem">正整数</div></div>
</div>
<div class="card anim-up" style="margin-top:20px;animation-delay:1.3s"><div style="font-size:.95rem">💡 有限小数和无限循环小数都是<b class="blue">分数</b></div></div></div>""",
'narration':'来快速判断几个。负 7，负整数。0，整数，非正非负。3 点 5，可以化成分数，所以是正分数。负三分之二，负分数。100，正整数。注意，有限小数和无限循环小数都可以化成分数，所以它们都是分数。'},
]}

# 7a-1-04 数轴三要素（画法动画）
LESSONS['7a-1-04'] = {'title':'数轴的三要素与画法','scenes':[
{'html':"""<div class="scene"><div class="scene-title">🌡️ 温度计里藏着一条数轴</div><div class="scene-sub">把温度计放平，就是一条数轴</div>
<div style="display:flex;justify-content:center;margin-top:20px">
<svg width="700" height="180" viewBox="0 0 700 180">
<rect x="290" y="10" width="120" height="160" rx="60" fill="rgba(255,255,255,.1)" stroke="#475569" stroke-width="2"/>
<line x1="350" y1="20" x2="350" y2="160" stroke="#f59e0b" stroke-width="4" class="svg-line"/>
<circle cx="350" cy="160" r="12" fill="#f59e0b" opacity=".3"/>
<g font-size="12" fill="#64748b" text-anchor="middle">
<text x="310" y="35">50°</text><text x="310" y="65">25°</text><text x="310" y="95">0°</text><text x="310" y="125">−25°</text><text x="310" y="155">−50°</text></g>
<g stroke="#475569" stroke-width="1"><line x1="330" y1="30" x2="350" y2="30"/><line x1="330" y1="60" x2="350" y2="60"/><line x1="330" y1="90" x2="350" y2="90"/><line x1="330" y1="120" x2="350" y2="120"/><line x1="330" y1="150" x2="350" y2="150"/></g>
<text x="500" y="95" fill="#94a3b8" font-size="13">放平旋转 90°</text>
<path d="M480,80 Q500,70 520,80" fill="none" stroke="#6366f1" stroke-width="2" marker-end="url(#arr)"/>
<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0L6,3L0,6Z" fill="#6366f1"/></marker></defs>
</svg></div>
<div style="text-align:center;margin-top:10px;color:#94a3b8;font-size:.95rem;animation:fade-in .8s 1.5s both">温度计上的刻度线放平 → 数轴的雏形</div></div>""",
'narration':'看这个温度计。中间是零度，上面是正温度，下面是负温度。有刻度，有零点，有方向。现在把它放平，旋转九十度。看到了吗？这就是一条数轴的雏形。'},
{'html':"""<div class="scene"><div class="scene-title">📐 画数轴：三步走</div><div="scene-sub">原点 + 正方向 + 单位长度</div>
<div style="display:flex;flex-direction:column;gap:15px;align-items:center;margin-top:15px">
<div style="display:flex;align-items:center;gap:15px;animation:slide-up .6s .2s both">
<div style="width:40px;height:40px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:900">1</div>
<div style="background:rgba(255,255,255,.08);border-radius:12px;padding:12px 25px;font-size:1.05rem">画直线，标<b class="gold">原点</b>（0）</div>
<svg width="200" height="30"><line x1="0" y1="15" x2="200" y2="15" stroke="#475569" stroke-width="2" class="svg-line"/><circle cx="100" cy="15" r="5" fill="#f59e0b"/></svg></div>
<div style="display:flex;align-items:center;gap:15px;animation:slide-up .6s .5s both">
<div style="width:40px;height:40px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:900">2</div>
<div style="background:rgba(255,255,255,.08);border-radius:12px;padding:12px 25px;font-size:1.05rem">定<b class="green">正方向</b>（向右，画箭头）</div>
<svg width="200" height="30"><line x1="0" y1="15" x2="180" y2="15" stroke="#10b981" stroke-width="2" class="svg-line" marker-end="url(#ar2)"/><defs><marker id="ar2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0L6,3L0,6Z" fill="#10b981"/></marker></defs></svg></div>
<div style="display:flex;align-items:center;gap:15px;animation:slide-up .6s .8s both">
<div style="width:40px;height:40px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:900">3</div>
<div style="background:rgba(255,255,255,.08);border-radius:12px;padding:12px 25px;font-size:1.05rem">取<b class="blue">单位长度</b>（每格等长）</div>
<svg width="200" height="40"><line x1="0" y1="20" x2="200" y2="20" stroke="#475569" stroke-width="2"/><g stroke="#60a5fa" stroke-width="1.5"><line x1="50" y1="14" x2="50" y2="26"/><line x1="100" y1="14" x2="100" y2="26"/><line x1="150" y1="14" x2="150" y2="26"/></g><g font-size="10" fill="#60a5fa" text-anchor="middle"><text x="50" y="38">1</text><text x="100" y="38">2</text><text x="150" y="38">3</text></g></svg></div></div>
<div class="card anim-up" style="margin-top:15px;animation-delay:1.2s"><div style="font-size:.95rem;color:#94a3b8">三者缺一不可，单位长度必须统一</div></div></div>""",
'narration':'画数轴三步走。第一步，画一条直线，标出原点，就是零。第二步，确定正方向，通常向右，画上箭头。第三步，取单位长度，每格等长。三要素缺一不可。特别注意，单位长度必须统一。'},
{'html':"""<div class="scene"><div class="scene-title">⚠️ 常见错误</div><div class="scene-sub">这些都不是合格的数轴</div>
<div style="display:flex;justify-content:center;gap:20px;margin-top:20px">
<div class="card bg-red anim-up" style="animation-delay:.2s;padding:15px 20px">
<div style="font-size:1.5rem">❌</div><div style="margin-top:6px;font-size:.9rem">没有箭头<br>（缺少正方向）</div>
<svg width="150" height="20"><line x1="0" y1="10" x2="150" y2="10" stroke="#64748b" stroke-width="2"/><g stroke="#64748b"><line x1="30" y1="5" x2="30" y2="15"/><line x1="60" y1="5" x2="60" y2="15"/><line x1="90" y1="5" x2="90" y2="15"/></g></svg></div>
<div class="card bg-red anim-up" style="animation-delay:.5s;padding:15px 20px">
<div style="font-size:1.5rem">❌</div><div style="margin-top:6px;font-size:.9rem">格子不等长<br>（单位不统一）</div>
<svg width="150" height="20"><line x1="0" y1="10" x2="150" y2="10" stroke="#64748b" stroke-width="2" marker-end="url(#e3)"/><g stroke="#64748b"><line x1="20" y1="5" x2="20" y2="15"/><line x1="45" y1="5" x2="45" y2="15"/><line x1="120" y1="5" x2="120" y2="15"/></g><defs><marker id="e3" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0L5,3L0,6Z" fill="#64748b"/></marker></defs></svg></div>
<div class="card bg-red anim-up" style="animation-delay:.8s;padding:15px 20px">
<div style="font-size:1.5rem">❌</div><div style="margin-top:6px;font-size:.9rem">没有原点<br>（缺少基准）</div>
<svg width="150" height="20"><line x1="0" y1="10" x2="140" y2="10" stroke="#64748b" stroke-width="2" marker-end="url(#e4)"/><g stroke="#64748b"><line x1="30" y1="5" x2="30" y2="15"/><line x1="80" y1="5" x2="80" y2="15"/><line x1="120" y1="5" x2="120" y2="15"/></g><defs><marker id="e4" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0L5,3L0,6Z" fill="#64748b"/></marker></defs></svg></div></div>
<div class="card bg-green anim-up" style="margin-top:15px;animation-delay:1.2s"><div style="font-size:1.5rem">✅</div><div style="margin-top:4px;font-size:.9rem">原点 + 箭头 + 等距刻度<br>= 合格的数轴</div></div></div>""",
'narration':'看三个常见的错误。第一个，没有箭头，缺少正方向。第二个，格子不等长，单位不统一。第三个，没有原点，缺少基准。合格的数轴，必须有原点、箭头和等距的刻度。记住这三点。'},
]}

# 7a-1-05 数轴上的点
LESSONS['7a-1-05'] = {'title':'用数轴上的点表示有理数','scenes':[
{'html':"""<div class="scene"><div class="scene-title">🏠 数轴建好了，请有理数"入住"</div><div class="scene-sub">每个数分到属于自己的那个点</div>
<div style="display:flex;justify-content:center;margin-top:20px">
<svg width="700" height="120" viewBox="0 0 700 120">
<line x1="50" y1="60" x2="650" y2="60" stroke="#475569" stroke-width="3" marker-end="url(#a5)" marker-start="url(#a5r)"/>
<defs><marker id="a5" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0L8,3L0,6Z" fill="#475569"/></marker><marker id="a5r" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"><path d="M8,0L0,3L8,6Z" fill="#475569"/></marker></defs>
<g stroke="#475569" stroke-width="1.5"><line x1="100" y1="52" x2="100" y2="68"/><line x1="200" y1="52" x2="200" y2="68"/><line x1="300" y1="52" x2="300" y2="68"/><line x1="400" y1="52" x2="400" y2="68"/><line x1="500" y1="52" x2="500" y2="68"/><line x1="600" y1="52" x2="600" y2="68"/></g>
<g font-size="13" fill="#64748b" text-anchor="middle"><text x="100" y="90">−2</text><text x="200" y="90">−1</text><text x="300" y="90">0</text><text x="400" y="90">1</text><text x="500" y="90">2</text><text x="600" y="90">3</text></g>
<circle cx="500" cy="60" r="7" fill="#10b981" class="anim-drop" style="animation-delay:.5s"><animate attributeName="r" values="7;9;7" dur="1.5s" repeatCount="indefinite"/></circle>
<text x="500" y="40" text-anchor="middle" fill="#10b981" font-size="14" font-weight="700" class="anim-drop" style="animation-delay:.5s">+2 ✓</text>
<circle cx="100" cy="60" r="7" fill="#f43f5e" class="anim-drop" style="animation-delay:.9s"/>
<text x="100" y="40" text-anchor="middle" fill="#f43f5e" font-size="14" font-weight="700" class="anim-drop" style="animation-delay:.9s">−2 ✓</text>
<circle cx="300" cy="60" r="7" fill="#f59e0b" class="anim-drop" style="animation-delay:1.3s"/>
<text x="300" y="40" text-anchor="middle" fill="#f59e0b" font-size="14" font-weight="700" class="anim-drop" style="animation-delay:1.3s">0 ✓</text>
</svg></div>
<div style="text-align:center;margin-top:10px;color:#94a3b8;font-size:.95rem;animation:fade-in .8s 1.8s both">
正数住右边 <span class="green">●</span> ｜ 负数住左边 <span class="red">●</span> ｜ 0 住原点 <span class="gold">●</span></div></div>""",
'narration':'数轴建好了，现在请有理数入住。看，正 2 入住了，它站在原点右边两格的位置。负 2 也入住了，站在原点左边两格。0 就站在原点上。规律很清楚，正数都在原点右边，负数都在左边，0 就是原点。'},
{'html':"""<div class="scene"><div class="scene-title">📏 距离与位置</div><div class="scene-sub">右边的数总比左边的大</div>
<div style="display:flex;justify-content:center;margin-top:20px">
<svg width="700" height="140" viewBox="0 0 700 140">
<line x1="50" y1="70" x2="650" y2="70" stroke="#475569" stroke-width="3" marker-end="url(#a6)" marker-start="url(#a6r)"/>
<defs><marker id="a6" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0L8,3L0,6Z" fill="#475569"/></marker><marker id="a6r" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"><path d="M8,0L0,3L8,6Z" fill="#475569"/></marker></defs>
<g stroke="#475569" stroke-width="1.5"><line x1="100" y1="62" x2="100" y2="78"/><line x1="200" y1="62" x2="200" y2="78"/><line x1="300" y1="62" x2="300" y2="78"/><line x1="400" y1="62" x2="400" y2="78"/><line x1="500" y1="62" x2="500" y2="78"/></g>
<g font-size="13" fill="#64748b" text-anchor="middle"><text x="100" y="100">−2</text><text x="200" y="100">−1</text><text x="300" y="100">0</text><text x="400" y="100">1</text><text x="500" y="100">2</text></g>
<line x1="100" y1="40" x2="500" y2="40" stroke="#6366f1" stroke-width="2" stroke-dasharray="5,3" marker-end="url(#ar6)" marker-start="url(#ar6s)"/>
<defs><marker id="ar6" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0L6,3L0,6Z" fill="#6366f1"/></marker><marker id="ar6s" markerWidth="8" markerHeight="8" refX="0" refY="3" orient="auto"><path d="M6,0L0,3L6,6Z" fill="#6366f1"/></marker></defs>
<text x="300" y="30" text-anchor="middle" fill="#6366f1" font-size="13" font-weight="600">−2 &lt; 2（左边 &lt; 右边）</text>
<circle cx="100" cy="70" r="6" fill="#f43f5e" class="anim-drop" style="animation-delay:.3s"/><circle cx="500" cy="70" r="6" fill="#10b981" class="anim-drop" style="animation-delay:.6s"/>
</svg></div>
<div style="display:flex;justify-content:center;gap:20px;margin-top:15px">
<div class="card bg-red anim-up" style="animation-delay:.4s;padding:10px 20px"><span class="red">← 越左越小</span></div>
<div class="card bg-green anim-up" style="animation-delay:.6s;padding:10px 20px"><span class="green">越右越大 →</span></div></div></div>""",
'narration':'在数轴上，右边的点表示的数，总比左边的大。看负 2 和正 2，负 2 在左边，正 2 在右边，所以负 2 小于正 2。越往左越小，越往右越大。'},
{'html':"""<div class="scene"><div class="scene-title">🎯 分数和小数也能入住</div><div class="scene-sub">任何有理数都有唯一的"家"</div>
<div style="display:flex;justify-content:center;margin-top:20px">
<svg width="700" height="120" viewBox="0 0 700 120">
<line x1="50" y1="60" x2="650" y2="60" stroke="#475569" stroke-width="3" marker-end="url(#a7)" marker-start="url(#a7r)"/>
<defs><marker id="a7" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0L8,3L0,6Z" fill="#475569"/></marker><marker id="a7r" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"><path d="M8,0L0,3L8,6Z" fill="#475569"/></marker></defs>
<g stroke="#475569" stroke-width="1" opacity=".5"><line x1="100" y1="54" x2="100" y2="66"/><line x1="150" y1="54" x2="150" y2="66"/><line x1="200" y1="54" x2="200" y2="66"/><line x1="250" y1="54" x2="250" y2="66"/><line x1="300" y1="54" x2="300" y2="66"/><line x1="350" y1="54" x2="350" y2="66"/><line x1="400" y1="54" x2="400" y2="66"/><line x1="450" y1="54" x2="450" y2="66"/><line x1="500" y1="54" x2="500" y2="66"/><line x1="550" y1="54" x2="550" y2="66"/><line x1="600" y1="54" x2="600" y2="66"/></g>
<g font-size="12" fill="#64748b" text-anchor="middle"><text x="200" y="90">−1</text><text x="300" y="90">0</text><text x="400" y="90">1</text><text x="500" y="90">2</text></g>
<circle cx="250" cy="60" r="6" fill="#60a5fa" class="anim-drop" style="animation-delay:.4s"/>
<text x="250" y="40" text-anchor="middle" fill="#60a5fa" font-size="13" font-weight="700" class="anim-drop" style="animation-delay:.4s">−1/2</text>
<circle cx="450" cy="60" r="6" fill="#60a5fa" class="anim-drop" style="animation-delay:.8s"/>
<text x="450" y="40" text-anchor="middle" fill="#60a5fa" font-size="13" font-weight="700" class="anim-drop" style="animation-delay:.8s">1/2</text>
<circle cx="325" cy="60" r="6" fill="#10b981" class="anim-drop" style="animation-delay:1.2s"/>
<text x="325" y="40" text-anchor="middle" fill="#10b981" font-size="13" font-weight="700" class="anim-drop" style="animation-delay:1.2s">0.5</text>
</svg></div>
<div class="card anim-up" style="margin-top:20px;animation-delay:1.6s">
<div style="font-size:1.05rem">分数、小数都能找到唯一的点</div>
<div style="font-size:.85rem;color:#94a3b8;margin-top:4px">1/2 和 0.5 住在同一个点——它们相等</div></div></div>""",
'narration':'分数和小数也能入住。看，负二分之一，站在负 1 和零的中间。二分之一，站在零和 1 的中间。零点五，也站在同一个位置。因为二分之一等于零点五，它们住在同一个点。'},
]}

print(f'准备生成 {len(LESSONS)} 个知识点')
for pid, data in LESSONS.items():
    scenes_html = '\n'.join(s['html'] for s in data['scenes'])
    full_html = html(pid, data['title'], scenes_html)
    filepath = os.path.join(OUT, f'{pid}.html')
    with open(filepath, 'w') as f:
        f.write(full_html)
    # 保存讲解稿
    narrations = [s['narration'] for s in data['scenes']]
    narr_path = os.path.join(OUT, f'{pid}-narrations.json')
    with open(narr_path, 'w') as f:
        json.dump(narrations, f, ensure_ascii=False, indent=1)
    print(f'  ✅ {pid} ({len(data["scenes"])} 场景)')

print('HTML 生成完毕')
