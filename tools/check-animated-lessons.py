#!/usr/bin/env python3
"""
动画课件自动化检测（对应 docs/ANIMATED_LESSON_TESTS.md 的可机检用例）。

用法：
  python3 tools/check-animated-lessons.py                  # 检测全部 demo/*.html
  python3 tools/check-animated-lessons.py 7a-1-02          # 检测指定知识点
  python3 tools/check-animated-lessons.py --quiet          # 只输出失败项（失败退出码 1）

规则来源 = 第一章 5 个知识点开发中实际踩过的坑，逐条对应测试用例编号。
"""
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'demo')

# 场景容器：class="scene" 精确匹配（排除 scene-title / scene-sub）
SCENE_OPEN = re.compile(r'<div class="scene"(?=[>\s])')


def split_scenes(body):
    """按场景容器切分，返回 [(序号, 内容)]；内容截止到下一个场景或文末"""
    spans = []
    for m in SCENE_OPEN.finditer(body):
        spans.append((m.start(), m.end()))
    scenes = []
    for i, (start, tag_end) in enumerate(spans):
        end = spans[i + 1][0] if i + 1 < len(spans) else len(body)
        scenes.append((i + 1, body[start:end]))
    return scenes


def path_coords_in_view(svg_text, fails, vb_w, vb_h, tag):
    """检查所有 mindmap 连线的 d 坐标是否落在 viewBox 内"""
    for pm in re.finditer(r'<path[^>]*d="([^"]+)"[^>]*/?>', svg_text):
        if 'mindmap-line' not in pm.group(0):
            continue
        nums = [float(x) for x in re.findall(r'-?\d+\.?\d*', pm.group(1))]
        xs, ys = nums[0::2], nums[1::2]
        if any(x > vb_w + 5 or x < -5 for x in xs):
            fails.append(('C05', f'{tag} 连线 x 越界(≤{vb_w}): {pm.group(1)[:50]}'))
        if any(y > vb_h + 5 or y < -5 for y in ys):
            fails.append(('C05', f'{tag} 连线 y 越界(≤{vb_h}): {pm.group(1)[:50]}'))


def check_one(pid):
    """返回 [失败项]，空列表 = 全部通过"""
    fails = []
    html_path = os.path.join(ROOT, f'{pid}.html')
    if not os.path.exists(html_path):
        return [('FILE', f'文件不存在: {pid}.html')]
    s = open(html_path, encoding='utf-8').read()
    body = re.sub(r'<script[\s\S]*?</script>', '', s)

    # ---- S01 场景隐藏机制（opacity:0+pointer-events:none 或 display:none 均可）----
    # 注意做声明级校验：`display:none pointer-events:none`（缺分号）整条无效，历史上真实发生过
    scene_css = re.search(r'\.scene\s*\{[^}]*\}', s)
    active_css = re.search(r'\.scene\.active\s*\{[^}]*\}', s)
    if not scene_css:
        fails.append(('S01', '找不到 .scene CSS 规则'))
    else:
        css = scene_css.group(0)
        # 所有声明必须以 ; 或 } 结尾（否则后面拼上去的属性会毁掉整条声明）
        decls = re.findall(r'([a-z-]+)\s*:\s*([^;}{]+)', css)
        bad = [d for d, v in decls if v.split()[:1] and not re.fullmatch(
            r'[#\w.,()%\s\-\'"]+', v.strip())]
        if bad:
            fails.append(('S01', f'.scene 存在非法声明（疑似缺分号）：{bad}'))
        props = {d: v.strip() for d, v in decls}
        disp = props.get('display', '')
        opa = props.get('opacity', '')
        if 'none' not in disp and '0' not in opa:
            fails.append(('S01', '.scene 无隐藏机制（display:none / opacity:0）'))
        if 'none' not in props.get('pointer-events', ''):
            fails.append(('S01', '.scene 缺 pointer-events:none（隐藏场景不应可点击）'))
    if not active_css:
        fails.append(('S01', '缺少 .scene.active 恢复显示规则'))
    else:
        acss = active_css.group(0)
        decls = re.findall(r'([a-z-]+)\s*:\s*([^;}{]+)', acss)
        props = {d: v.strip() for d, v in decls}
        ok = ('1' in props.get('opacity', '') or 'block' in props.get('display', ''))
        if not ok:
            fails.append(('S01', '.scene.active 未恢复显示（opacity:1 / display:block）'))

    # ---- S02 畸形标签（历史 bug：<div="scene">）----
    for m in re.finditer(r'<(\w+)="', body):
        fails.append(('S02', f'畸形标签 <{m.group(1)}=" （缺属性名，元素将不被隐藏）'))
        break

    # ---- S03 每个场景 div 配对（历史 bug：多余 </div> 使内容溢出场景容器）----
    scenes = split_scenes(body)
    n = len(scenes)
    if n == 0:
        return fails + [('S03', '未找到任何场景容器')]
    HARMLESS_TAIL = re.compile(
        r'^(\s|</div>|<div class="hint">[\s\S]*?</div>|<div id="dots"></div>'
        r'|</body>|</html>|<!--[\s\S]*?-->)*$')
    for idx, (i, sc) in enumerate(scenes):
        if idx < n - 1:
            opens = len(re.findall(r'<div\b', sc))
            closes = len(re.findall(r'</div>', sc))
            if opens != closes:
                fails.append(('S03', f'场景 {i} div 不配对（{opens} 开 {closes} 关），内容会溢出到其他页'))
        else:
            # 末场景：用栈定位场景容器自身的闭合位置，其后只允许全局元素/外层闭合
            depth, end_pos = 0, None
            for m in re.finditer(r'<div\b|</div>', sc):
                depth += 1 if m.group(0).startswith('<div') else -1
                if depth == 0:
                    end_pos = m.end()
                    break
            if end_pos is None:
                fails.append(('S03', f'场景 {i} 容器未闭合'))
            else:
                tail = sc[end_pos:]
                if not HARMLESS_TAIL.match(tail):
                    snippet = re.sub(r'\s+', ' ', tail[:80])
                    fails.append(('S03', f'场景 {i} 闭合后有泄漏内容（会常显在所有页面）: {snippet}…'))

    # ---- S04 点击开始不误跳页（历史 bug：document click 抢跑 go(cur+1)）----
    if not re.search(r'if\s*\(\s*cur\s*<\s*0\s*\)\s*return', s):
        fails.append(('S04', 'document click 缺少 if(cur<0)return 守卫'))

    # ---- S05 开始提示移除 ----
    if '点击开始' in s and not re.search(r'\.remove\(\)', s):
        fails.append(('S05', '开始提示没有 remove() 移除逻辑，会残留在所有页面'))

    # ---- S06 音频播完自动翻页 ----
    if not re.search(r'audio\.onended|addEventListener\([\'"]ended', s):
        fails.append(('S06', '缺少 audio.onended 自动翻页'))

    # ---- S07 播放按钮状态由音频事件驱动 ----
    if not (re.search(r'onpause|onplaying|onplay\b|onended', s) and re.search(r'bp\.textContent|btn', s)):
        fails.append(('S07', '播放按钮状态未由音频事件驱动（进度条在动、按钮还是 ▶）'))

    # ---- E01 例题：题目与解答渐进展示（历史 bug：同时弹出）----
    ex_scenes = [(i, sc) for i, sc in scenes if re.search(r'例\s*[题1-9１-９]', sc)]
    for i, sc in ex_scenes:
        if '解答' in sc and 'data-reveal-at' not in sc:
            fails.append(('E01', f'例题场景 {i} 有解答但无 data-reveal-at 渐进'))

    # ---- E02 data-reveal-at 独立属性（历史 bug：嵌进 style 里失效）----
    if re.search(r'style="[^"]*data-reveal-at', s):
        fails.append(('E02', 'data-reveal-at 被嵌进 style 属性（浏览器识别不到）'))

    # ---- E03 reveal 阈值合法 ----
    for t in re.findall(r'data-reveal-at="([\d.]+)"', s):
        if not (0 < float(t) < 1):
            fails.append(('E03', f'reveal 阈值越界: {t}（应在 0~1）'))

    # ---- C01 场景类型齐全（历史 bug：只做概念，漏了例题/方法/易错）----
    all_text = ''.join(sc for _, sc in scenes)
    for label, kws in [('例题', ('例题', '例1', '例 1', '例2', '例 2')),
                       ('方法提炼', ('方法提炼', '方法总结')),
                       ('易错提醒', ('易错', '常见错误', '⚠'))]:
        if not any(k in all_text for k in kws):
            fails.append(('C01', f'缺少{label}场景'))
    if n < 5:
        fails.append(('C01', f'场景仅 {n} 个（概念+例题×2+方法+易错应 ≥5）'))

    # ---- C02 音频数 = 场景数，且非空 ----
    audio_dir = os.path.join(ROOT, pid)
    mp3s = sorted(f for f in os.listdir(audio_dir) if f.endswith('.mp3')) if os.path.isdir(audio_dir) else []
    if len(mp3s) != n:
        fails.append(('C02', f'音频 {len(mp3s)} 个 ≠ 场景 {n} 个'))
    for f in mp3s:
        size = os.path.getsize(os.path.join(audio_dir, f))
        if size < 10_000:
            fails.append(('C02', f'音频 {f} 仅 {size}B（疑似空文件）'))

    # ---- C03 讲解稿条数 = 场景数 ----
    nj = os.path.join(ROOT, f'{pid}-narrations.json')
    if os.path.exists(nj):
        cnt = len(json.load(open(nj, encoding='utf-8')))
        if cnt != n:
            fails.append(('C03', f'讲解稿 {cnt} 条 ≠ 场景 {n} 个'))

    # ---- C04~C06 脑图（方法提炼场景：按场景标题定位，避免误匹配注释）----
    method = next((sc for _, sc in scenes
                   if re.search(r'scene-title">[^<]*(方法提炼|方法总结)', sc)), '')
    if method:
        if '<svg' not in method:
            fails.append(('C04', '方法提炼不是脑图形式（无 SVG）'))
        else:
            vb = re.search(r'viewBox="0 0 (\d+) (\d+)"', method)
            vb_w, vb_h = (int(vb.group(1)), int(vb.group(2))) if vb else (0, 0)
            lines = re.findall(r'mindmap-line', method)
            branches = re.findall(r'slide-left', method)
            # C04 连线数 ≥ 分支数（历史 bug：连线缺失）
            if branches and len(lines) < len(branches):
                fails.append(('C04', f'连线 {len(lines)} 条 < 分支 {len(branches)} 个（有分支没连线）'))
            if not lines:
                fails.append(('C04', '脑图无动画连线'))
            # C05 连线端点在 viewBox 内（历史 bug：viewBox 太小连线被裁剪）
            if vb_w:
                path_coords_in_view(method, fails, vb_w, vb_h, '方法提炼脑图')
                # 分支框也应在 viewBox 内
                for rm in re.finditer(r'<rect[^>]*x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"', method):
                    x, y, w, h = map(float, rm.groups())
                    if x + w > vb_w + 5 or y + h > vb_h + 5:
                        fails.append(('C05', f'分支框越界 viewBox({vb_w}×{vb_h}): x={x} y={y} w={w} h={h}'))
            # C06 分支标题是关键词不是长句（历史 bug：整句话塞进框里溢出）
            for tm in re.finditer(r'font-weight="700"[^>]*>([^<]+)<', method):
                t = tm.group(1).strip()
                if len(t) > 12:
                    fails.append(('C06', f'分支标题过长（{len(t)} 字）: {t[:16]}… 应提炼为关键词'))

    return fails


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    quiet = '--quiet' in sys.argv
    if args:
        pids = [a[:-5] if a.endswith('.html') else a for a in args]
    else:
        pids = sorted(f[:-5] for f in os.listdir(ROOT) if re.fullmatch(r'7[ab]-\d+-\d+\.html', f))
    total = 0
    for pid in pids:
        fails = check_one(pid)
        if not quiet or fails:
            print(f'{pid}: {"✅ PASS" if not fails else f"❌ {len(fails)} 项失败"}')
        for rid, msg in fails:
            print(f'   [{rid}] {msg}')
        total += len(fails)
    print(f'\n检测 {len(pids)} 个课件，{total} 项失败')
    sys.exit(1 if total else 0)


if __name__ == '__main__':
    main()
