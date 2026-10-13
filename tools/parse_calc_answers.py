#!/usr/bin/env python3
"""从答案册 OCR 解析训练列表（号/标题/速查题数），并合并进 calc-skeleton.json"""
import json
import os
import re

ANS_DIR = os.path.join(os.path.dirname(__file__), '..', 'refs', 'calc', 'answers_ocr')

def clean(line):
    return re.sub(r'\s+', ' ', line).strip()

def main():
    files = sorted(f for f in os.listdir(ANS_DIR) if f.endswith('.txt'))
    found = {}
    cur = None
    in_quick = False
    for fname in files:
        for raw in map(clean, open(os.path.join(ANS_DIR, fname), encoding='utf-8')):
            if not raw:
                continue
            m = re.search(r'训练\s*(\d{1,2})\s*([^，。；\d]{2,26})', raw)
            if m and '速查' not in raw:
                no = int(m.group(1))
                title = re.sub(r'答案速查.*$', '', m.group(2)).strip(' .。:：-—·•()（）')
                cur = found.setdefault(no, {'no': no, 'title': title, 'quickCount': 0})
                if not cur['title'] and title:
                    cur['title'] = title
                in_quick = '速查' in raw
                continue
            if cur is not None:
                if '速查' in raw:
                    in_quick = True
                    continue
                if '方法详解' in raw or '视频' in raw:
                    in_quick = False
                    continue
                if in_quick:
                    cur['quickCount'] += len(re.findall(r'(?<![\d.])(\d{1,2})[.、]', raw))

    print('答案册解析到', len(found), '个训练')
    missing = [n for n in range(1, max(found) + 1) if n not in found]
    print('答案册缺失:', missing)

    # 合并进骨架
    skel_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'calc-skeleton.json')
    skeleton = {t['no']: t for t in json.load(open(skel_path, encoding='utf-8'))}
    for no, info in found.items():
        t = skeleton.setdefault(no, {'no': no, 'title': '', 'module': '', 'pdfPage': 0, 'bookPage': 0, 'stars': 0, 'minutes': 0, 'ansPage': 0})
        if not t['title'] or len(info['title']) > len(t['title']):
            t['title'] = t['title'] or info['title']
        t['quickCount'] = info['quickCount']
    out = [skeleton[k] for k in sorted(skeleton)]
    json.dump(out, open(skel_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('合并后共', len(out), '个训练')
    for t in out:
        print(f"T{t['no']:>2} [{t.get('quickCount', 0)}题] {t['title']}")

if __name__ == '__main__':
    main()
