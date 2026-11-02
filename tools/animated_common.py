#!/usr/bin/env python3
"""第三章（代数式）5 个知识点的动画课件生成器：概念场景手工设计，例题/脑图/易错自动装配。"""
import json, os, re

ROOT = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'demo')
LESSON = None  # 由调用方注入
SPECS = []

def s(pid):
    return [l for l in LESSON['lessons'] if l['pointId'] == pid][0]


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


if __name__ != '__main__' and LESSON is not None:
    pass
