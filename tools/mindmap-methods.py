#!/usr/bin/env python3
"""把方法提炼场景改为脑图（中心主题 + 放射分支 + SVG 动画连线）"""
import json, os, re

DEMO = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'demo')
LESSONS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'lessons', '7a-c1.json')

def make_mindmap(title, steps, colors):
    """生成脑图 SVG HTML
    steps: [(标题, 描述)] 最多 5 个
    colors: 每个分支的颜色
    """
    n = len(steps)
    svg_w = 800
    svg_h = max(350, n * 90 + 40)
    cx = 130  # 中心节点 x
    cy = svg_h // 2

    # 中心节点
    center = f'''
    <g style="animation:pop-in .6s .1s both" transform-origin="{cx} {cy}">
      <rect x="{cx-85}" y="{cy-28}" width="170" height="56" rx="28" fill="#6366f1" stroke="#818cf8" stroke-width="2"/>
      <text x="{cx}" y="{cy+5}" text-anchor="middle" fill="#fff" font-size="16" font-weight="700">{title}</text>
    </g>'''

    branches = ''
    for i, (step_title, step_desc) in enumerate(steps):
        by = 50 + i * (svg_h - 80) // max(n - 1, 1) if n > 1 else cy
        if n == 1: by = cy
        bx = 480  # 分支卡起点 x

        color = colors[i % len(colors)]
        delay = 0.5 + i * 0.4

        # 连线（贝塞尔曲线）
        mid_x = (cx + 95 + bx) // 2
        branches += f'''
    <path d="M{cx+88} {cy} Q{mid_x} {cy} {mid_x} {by} Q{mid_x} {by} {bx-12} {by}"
          fill="none" stroke="{color}" stroke-width="2" opacity=".6"
          style="stroke-dasharray:600;stroke-dashoffset:600;animation:draw-line 1s {delay:.1f}s forwards"/>'''

        # 分支圆点
        branches += f'''
    <circle cx="{bx-12}" cy="{by}" r="5" fill="{color}" opacity=".8"
            style="animation:pop-in .4s {delay+0.3:.1f}s both"/>'''

        # 分支卡片
        branches += f'''
    <g style="animation:slide-left .6s {delay+0.2:.1f}s both">
      <rect x="{bx}" y="{by-32}" width="290" height="64" rx="14" fill="rgba(255,255,255,.06)" stroke="{color}" stroke-width="1.5"/>
      <circle cx="{bx+24}" cy="{by}" r="16" fill="{color}" opacity=".2"/>
      <text x="{bx+24}" y="{by+5}" text-anchor="middle" fill="{color}" font-size="13" font-weight="800">{i+1}</text>
      <text x="{bx+48}" y="{by-6}" fill="{color}" font-size="14" font-weight="700">{step_title}</text>
      <text x="{bx+48}" y="{by+14}" fill="#94a3b8" font-size="11">{step_desc[:22]}</text>
    </g>'''

    return f'''<div class="scene"><div class="scene-title">🔑 方法提炼</div><div class="scene-sub">{title}</div>
<style>@keyframes slide-left{{from{{transform:translateX(40px);opacity:0}}to{{transform:translateX(0);opacity:1}}}}</style>
<svg width="{svg_w}" height="{svg_h}" viewBox="0 0 {svg_w} {svg_h}" style="display:block;margin:0 auto">
<style>@keyframes draw-line{{to{{stroke-dashoffset:0}}}}</style>
{center}{branches}
</svg></div>'''


def extract_steps(body):
    """从方法正文提取关键步骤"""
    lines = [l.strip() for l in body.split('\n') if l.strip() and len(l.strip()) > 8]
    # 尝试按"第一步""第二步"或数字编号分段
    steps = []
    current_title = ''
    for line in lines:
        m = re.match(r'第([一二三四五六])[步，]', line) or re.match(r'^(\d)[\.、．]', line)
        if m:
            if current_title:
                steps.append((current_title, ''))
            current_title = line[:40]
        elif len(line) > 15 and not current_title:
            current_title = line[:40]
        elif current_title and len(line) > 10:
            # 补充描述
            if len(steps) < len([s for s in steps]) + 1:
                pass
    # 如果没提取到步骤，取前4行作为步骤
    if not steps:
        for line in lines[:5]:
            # 去掉前缀符号
            clean = re.sub(r'^[·•\-\d\.、（）()]+', '', line).strip()
            if len(clean) > 5:
                # 取第一句话作为标题，剩下的作为描述
                parts = re.split(r'[。；;]', clean, 1)
                title = parts[0][:20]
                desc = parts[1].strip()[:24] if len(parts) > 1 else ''
                steps.append((title, desc))
    return steps[:5]  # 最多 5 个分支


COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#60a5fa']

lessons = json.load(open(LESSONS_FILE, encoding='utf-8'))

for pid in ['7a-1-01', '7a-1-02', '7a-1-03', '7a-1-04', '7a-1-05']:
    lesson = next((l for l in lessons['lessons'] if l['pointId'] == pid), None)
    if not lesson: continue

    method_slide = next((s for s in lesson['slides'] if s['kind'] == 'method'), None)
    if not method_slide: continue

    html_path = os.path.join(DEMO, f'{pid}.html')
    if not os.path.exists(html_path): continue

    s = open(html_path).read()

    # 找到现有的 method scene
    method_start = s.find('<div class="scene" id="method">')
    if method_start < 0:
        method_start = s.find('🔑 方法提炼')
        if method_start > 0:
            method_start = s.rfind('<div class="scene"', 0, method_start)
    if method_start < 0:
        print(f'- {pid}: 未找到 method 场景')
        continue

    method_end = s.find('<div class="scene"', method_start + 10)
    if method_end < 0:
        method_end = s.find('<div class="hint"', method_start)
    if method_end < 0:
        method_end = s.find('</div>\n<div class="hint">', method_start)
    if method_end < 0:
        method_end = len(s)

    # 提取步骤
    steps = extract_steps(method_slide.get('body', ''))
    if not steps:
        print(f'- {pid}: 方法正文无有效步骤')
        continue

    # 生成脑图
    mindmap = make_mindmap(method_slide.get('title', ''), steps, COLORS)

    # 替换
    s = s[:method_start] + mindmap + '\n' + s[method_end:]
    open(html_path, 'w').write(s)
    print(f'✅ {pid}: 方法提炼改为脑图（{len(steps)} 个分支）')

print('完成')
