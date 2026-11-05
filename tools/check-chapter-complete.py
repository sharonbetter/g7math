#!/usr/bin/env python3
"""
章节完整性终检器：验证一个章节是否满足 CHAPTER_BUILD_SPEC.md 的全部要求。
用法：python3 tools/check-chapter-complete.py 7b-c7
退出码 0 = 全绿可交付，1 = 有缺失项。
"""
import json, os, re, sys, subprocess

ROOT = os.path.join(os.path.dirname(__file__), '..')
DEMO = os.path.join(ROOT, 'app', 'public', 'demo')
EXAMS = os.path.join(ROOT, 'data', 'exams')
LESSONS = os.path.join(ROOT, 'data', 'lessons')

OFF_SYLLABUS = ['韦达', '判别式', '因式分解', '分式方程', '勾股', '全等', '二次函数', '抛物线', '三角函数', '正弦', '余弦', '正切']

def check(chapter_id):
    fails = []
    warns = []

    # ---- 课件数据文件 ----
    lesson_file = os.path.join(LESSONS, f'{chapter_id}.json')
    if not os.path.exists(lesson_file):
        fails.append(('课件数据', f'{chapter_id}.json 不存在'))
        return fails, warns
    lessons = json.load(open(lesson_file))
    point_ids = [l['pointId'] for l in lessons['lessons']]
    print(f'课件数据: {len(point_ids)} 个知识点')

    # ---- 动画课件 HTML + 配音 ----
    demo_manifest = os.path.join(DEMO, 'manifest.json')
    manifest_pids = []
    if os.path.exists(demo_manifest):
        manifest_pids = json.load(open(demo_manifest)).get('animatedLessons', [])
    
    for pid in point_ids:
        html = os.path.join(DEMO, f'{pid}.html')
        audio_dir = os.path.join(DEMO, pid)
        narr = os.path.join(DEMO, f'{pid}-narrations.json')
        
        if not os.path.exists(html):
            fails.append(('动画课件', f'{pid}.html 不存在'))
            continue
        if pid not in manifest_pids:
            warns.append(('manifest', f'{pid} 不在 demo/manifest.json（需重跑 sync-data）'))
        
        # 音频完整性（抽查）
        if os.path.isdir(audio_dir):
            mp3s = [f for f in os.listdir(audio_dir) if f.endswith('.mp3')]
            scenes = len(open(html).read().split('class="scene"')) - 1
            if len(mp3s) < scenes:
                fails.append(('配音', f'{pid}: 音频 {len(mp3s)} < 场景 {scenes}'))
        else:
            fails.append(('配音', f'{pid}/ 目录不存在'))

    # ---- 考评题库 ----
    exam_file = os.path.join(EXAMS, f'{chapter_id}.json')
    if not os.path.exists(exam_file):
        fails.append(('考评', f'{chapter_id}.json 不存在'))
        return fails, warns
    exam = json.load(open(exam_file))
    questions = exam['questions']
    
    # 题量
    if len(questions) < 20:
        warns.append(('题量', f'{len(questions)} 题（建议 ≥20）'))
    
    # 能力题
    ability = [q for q in questions if '能力题' in (q.get('errorTags') or [])]
    if len(ability) < 3:
        fails.append(('能力题', f'{len(ability)} 道（应 ≥3）'))
    else:
        types = set()
        for q in ability:
            for t in (q.get('errorTags') or []):
                if t.startswith('能力题:'):
                    types.add(t.replace('能力题:', ''))
        if len(types) < 3:
            fails.append(('能力题', f'类型仅 {len(types)} 种（应 ≥3 种）'))
    
    #     # LaTeX 格式（抽查含分数的题）
    bare_frac = 0
    for q in questions:
        stem = q.get('stem', '') + q.get('solution', '')
        # 检测裸分数模式（数字/数字 且不含 \frac）
        if re.search(r'(?<![\d.])\d{1,3}/\d{1,3}(?![\d.])', stem) and '\\frac' not in stem:
            bare_frac += 1
    if bare_frac > 3:
        fails.append(('LaTeX', f'{bare_frac} 题含裸分数未转 LaTeX'))
    
    # 思路引导覆盖
    no_guidance = 0
    for q in questions:
        if not q.get('guidance'):
            no_guidance += 1
        for v in (q.get('variants') or []):
            if not v.get('guidance'):
                no_guidance += 1
    if no_guidance > 0:
        fails.append(('思路引导', f'{no_guidance} 条无 guidance'))
    
    # 思想方法标注
    no_method = 0
    for q in questions:
        g = q.get('guidance', '')
        if g and '核心思想' not in g and not q.get('thinkingMethod'):
            no_method += 1
    if no_method > len(questions) * 0.5:  # 超过一半没标注
        warns.append(('思想方法', f'{no_method}/{len(questions)} 题未标注'))
    
    # 超纲术语
    for q in questions:
        text = q.get('stem', '') + q.get('solution', '') + q.get('guidance', '')
        for term in OFF_SYLLABUS:
            if term in text:
                fails.append(('超纲', f'{q["id"]} 含「{term}」'))
                break
    
    # ---- 检测器 ----
    r = subprocess.run(
        ['python3', os.path.join(ROOT, 'tools', 'check-animated-lessons.py')] + point_ids,
        capture_output=True, text=True
    )
    if r.returncode != 0:
        for line in r.stdout.split('\n'):
            if '❌' in line or '失败' in line:
                fails.append(('动画检测', line.strip()))
    
    return fails, warns

def main():
    if len(sys.argv) < 2:
        print('用法: python3 tools/check-chapter-complete.py <chapterId>')
        sys.exit(1)
    
    ch = sys.argv[1]
    print(f'═══ 章节完整性终检: {ch} ═══\n')
    
    fails, warns = check(ch)
    
    if warns:
        print('⚠️ 警告（不阻塞交付）:')
        for cat, msg in warns:
            print(f'  [{cat}] {msg}')
    
    if fails:
        print(f'\n❌ 未通过 {len(fails)} 项（不许交付）:')
        for cat, msg in fails:
            print(f'  [{cat}] {msg}')
        sys.exit(1)
    else:
        print('\n✅ 全绿，可以交付。')
        sys.exit(0)

if __name__ == '__main__':
    main()
