#!/usr/bin/env python3
"""给已有的动画课件追加例题、方法、易错场景"""
import json, os, re

ROOT = os.path.join(os.path.dirname(__file__), '..')
LESSONS_DIR = os.path.join(ROOT, 'data', 'lessons')
DEMO_DIR = os.path.join(ROOT, 'app', 'public', 'demo')

def speakable(text):
    """简化版符号转读法"""
    t = text
    for old, new in [('℃','摄氏度'), ('−','-'), ('＋','+'),
                     ('+','正'), ('=','等于'), ('≠','不等于'), ('≈','约等于'),
                     ('≥','大于等于'), ('≤','小于等于'), ('>','大于'), ('<','小于'),
                     ('×','乘'), ('÷','除以'), ('→','然后'), ('←','反过来')]:
        t = t.replace(old, new)
    # 数字前的负号
    t = re.sub(r'(?<![\d])-(\d)', r'负\1', t)
    t = re.sub(r'(?<![\d])\+(\d)', r'正\1', t)
    # 运算符号
    t = re.sub(r'(\d)\s*-\s*(\d)', r'\1减\2', t)
    t = re.sub(r'(\d)\s*\+\s*(\d)', r'\1加\2', t)
    # 分数
    t = re.sub(r'(\d+)/(\d+)', r'\2分之\1', t)
    # 符号名
    t = t.replace('|', '的绝对值')
    # 问句停顿
    t = re.sub(r'？\s*(?=[^，。！？；\s])', '？。', t)
    t = re.sub(r'。\s*其实', '。。其实', t)
    t = re.sub(r'。\s*所以', '。。所以', t)
    t = re.sub(r'。\s*注意', '。。注意', t)
    return t.strip()

def example_scene(ex_num, problem, solution, notes=None):
    """例题场景：题目 → 解答 → 点评"""
    # 提取题目前几行作为展示
    prob_lines = [l.strip() for l in problem.split('\n') if l.strip()][:4]
    prob_html = '<br>'.join(prob_lines)
    
    # 解答分段（按换行）
    sol_lines = [l.strip() for l in solution.split('\n') if l.strip()][:6]
    sol_html = '<br>'.join(sol_lines)
    
    html = f'''<div class="scene" id="ex{ex_num}">
    <div class="scene-title">📝 例题 {ex_num}</div>
    <div style="background:rgba(245,158,11,.12);border:2px solid rgba(245,158,11,.3);border-radius:16px;padding:20px 25px;margin-bottom:15px;opacity:0;animation:slide-up .7s .2s both">
      <div style="font-size:.85rem;color:#b45309;margin-bottom:8px;font-weight:600">题目</div>
      <div style="font-size:1.1rem;line-height:1.7">{prob_html}</div>
    </div>
    <div style="background:rgba(16,185,129,.1);border:2px solid rgba(16,185,129,.3);border-radius:16px;padding:20px 25px;opacity:0;animation:slide-up .7s 1.5s both">
      <div style="font-size:.85rem;color:#15803d;margin-bottom:8px;font-weight:600">解答</div>
      <div style="font-size:1rem;line-height:1.7">{sol_html}</div>
    </div>'''
    
    if notes:
        html += f'''
    <div style="background:rgba(99,102,241,.1);border:2px solid rgba(99,102,241,.3);border-radius:12px;padding:14px 20px;margin-top:12px;opacity:0;animation:slide-up .7s 3s both">
      <span style="font-size:.9rem;color:#6366f1">💡 {notes[:80]}</span>
    </div>'''
    
    html += '</div>'
    
    narration = f'看这道题。{speakable(problem[:200])}。我们来看解答。{speakable(solution[:300])}'
    if notes:
        narration += f'。注意，{speakable(notes[:100])}'
    return html, narration

def method_scene(title, body):
    """方法提炼场景"""
    # 解析body中的步骤
    steps = [l.strip() for l in body.split('\n') if l.strip() and len(l.strip()) > 5][:5]
    steps_html = ''
    for i, step in enumerate(steps):
        delay = .2 + i * .3
        step_clean = step.lstrip('·•-123456789. ')
        steps_html += f'''
    <div class="step-row" style="opacity:0;animation:slide-up .6s {delay}s both">
      <div class="step-num">{i+1}</div>
      <div class="step-card" style="font-size:.95rem">{step_clean[:80]}</div>
    </div>'''
    
    html = f'''<div class="scene" id="method">
    <div class="scene-title">🔑 方法提炼</div>
    <div class="scene-sub">{title}</div>
    {steps_html}
</div>'''
    
    narration = f'方法总结。{speakable(body[:250])}'
    return html, narration

def pitfall_scene(body):
    """易错提醒场景"""
    # 提取关键句子
    lines = [l.strip() for l in body.split('\n') if l.strip() and len(l.strip()) > 8][:3]
    items_html = ''
    for i, line in enumerate(lines):
        delay = .2 + i * .4
        line_clean = line.lstrip('·•-123456789. ')
        items_html += f'''
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;opacity:0;animation:slide-up .6s {delay}s both">
      <span style="font-size:1.3rem">⚠️</span>
      <div style="background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);border-radius:12px;padding:12px 20px;flex:1;font-size:.95rem;line-height:1.6">{line_clean[:100]}</div>
    </div>'''
    
    html = f'''<div class="scene" id="pitfall">
    <div class="scene-title">⚠️ 易错提醒</div>
    <div class="scene-sub">这些地方最容易出错</div>
    {items_html}
    <div style="text-align:center;margin-top:15px;opacity:0;animation:slide-up .6s 1.5s both">
      <span style="font-size:.9rem;color:#94a3b8">记住这些坑，考试不踩雷</span>
    </div>
</div>'''
    
    narration = f'最后提醒几个容易出错的地方。{speakable(body[:250])}'
    return html, narration


def process_lesson(chapter_file, pid):
    """给已有的动画课件追加场景"""
    d = json.load(open(os.path.join(LESSONS_DIR, chapter_file), encoding='utf-8'))
    lesson = next((l for l in d['lessons'] if l['pointId'] == pid), None)
    if not lesson:
        print(f'  ✗ 未找到 {pid}')
        return
    
    html_path = os.path.join(DEMO_DIR, f'{pid}.html')
    if not os.path.exists(html_path):
        print(f'  ✗ {pid}.html 不存在')
        return
    
    html = open(html_path, encoding='utf-8').read()
    
    # 检查是否已添加过例题
    if 'id="ex1"' in html:
        print(f'  - {pid} 已有例题场景')
        return
    
    # 收集新场景
    new_scenes = []
    narrations = []
    
    for slide in lesson['slides']:
        if slide['kind'] == 'example' and slide.get('problem'):
            ex_num = len([s for s in new_scenes if 'id="ex' in s[0]]) + 1
            scene_html, narration = example_scene(
                ex_num, slide['problem'], slide.get('solution', ''), slide.get('notes')
            )
            new_scenes.append((scene_html, narration))
        elif slide['kind'] == 'method' and slide.get('body'):
            scene_html, narration = method_scene(slide.get('title', ''), slide['body'])
            new_scenes.append((scene_html, narration))
        elif slide['kind'] == 'pitfall' and slide.get('body'):
            scene_html, narration = pitfall_scene(slide['body'])
            new_scenes.append((scene_html, narration))
    
    if not new_scenes:
        print(f'  - {pid} 无例题/方法/易错内容')
        return
    
    # 在 hint 前插入新场景
    hint_pos = html.find('<div class="hint">')
    if hint_pos < 0:
        hint_pos = html.find("class='hint'")
    if hint_pos < 0:
        print(f'  ✗ {pid} 未找到 hint 元素')
        return
    
    scenes_html = '\n'.join(sh for sh, _ in new_scenes)
    html = html[:hint_pos] + scenes_html + '\n' + html[hint_pos:]
    
    # 更新 JS 中的 sceneAudio 数组
    # 找到现有的 sceneAudio 定义并扩展
    audio_match = re.search(r"const sceneAudio=\[(.+?)\]", html)
    if audio_match:
        existing = audio_match.group(1)
        # 计算新场景的索引（从现有场景数开始）
        existing_count = len(re.findall(r"'\d+\.mp3'", existing))
        new_entries = [f"'{pid}/{existing_count + i + 1}.mp3'" for i in range(len(new_scenes))]
        new_array = existing.rstrip(',') + ',' + ','.join(new_entries) + ']'
        html = html.replace(audio_match.group(0), f'const sceneAudio=[{new_array}')
    
    # 写入 HTML
    open(html_path, 'w', encoding='utf-8').write(html)
    
    # 保存讲解稿
    narr_path = os.path.join(DEMO_DIR, f'{pid}-extra-narrations.json')
    existing_narr = []
    old_narr_path = os.path.join(DEMO_DIR, f'{pid}-narrations.json')
    if os.path.exists(old_narr_path):
        existing_narr = json.load(open(old_narr_path))
    all_narr = existing_narr + [n for _, n in new_scenes]
    json.dump(all_narr, open(old_narr_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    
    # 确保音频目录存在
    audio_dir = os.path.join(DEMO_DIR, pid)
    os.makedirs(audio_dir, exist_ok=True)
    
    print(f'  ✅ {pid}: 追加 {len(new_scenes)} 个场景（例题+方法+易错）')


# 处理所有已有的动画课件
chapter_file = '7a-c1.json'
pids = ['7a-1-02', '7a-1-03', '7a-1-04', '7a-1-05']
print('追加例题/方法/易错场景：')
for pid in pids:
    process_lesson(chapter_file, pid)
print('完成')
