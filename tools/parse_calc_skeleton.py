#!/usr/bin/env python3
"""从 OCR 文本解析《一本·计算题满分训练》七年级的训练骨架。"""
import json
import os
import re

OCR_DIR = os.path.join(os.path.dirname(__file__), '..', 'refs', 'calc', 'book_ocr')
START_PDF_PAGE = 8   # 跳过封面/目录

STAR_CHARS = set('众公女六攻兴次乗关各类音火立米交亦衣')
NOISE = ['微信公众号', '教辅资料站', '关注微信', '获取更多', '教辅资源', '关注公众号', '答案速查', '方法详解', '视频辅导', '扫码', '本书']

def clean(line):
    return re.sub(r'\s+', ' ', line).strip()

def stars(s):
    return min(3, sum(1 for ch in s if ch in STAR_CHARS or ch in '★☆')) if s else 0

def main():
    files = sorted(f for f in os.listdir(OCR_DIR) if f.endswith('.txt'))
    trainings = {}
    cur_module = ''
    cur = None

    for fname in files:
        pdf_page = int(re.search(r'(\d+)', fname).group(1))
        if pdf_page < START_PDF_PAGE:
            continue
        lines = [clean(l) for l in open(os.path.join(OCR_DIR, fname), encoding='utf-8')]
        book_page = None
        for l in reversed(lines[-6:]):
            if re.fullmatch(r'\d{1,3}', l):
                book_page = int(l)
                break

        for raw in lines:
            if not raw or any(n in raw for n in NOISE):
                continue
            mmod = re.search(r'第([一二三四五六七八九十]+)模块', raw)
            if mmod:
                cur_module = f'第{mmod.group(1)}模块'
            mtr = re.search(r'训练\s*(\d{1,2})\s*([^，。；\d]{2,26})', raw)
            if mtr:
                no = int(mtr.group(1))
                if no not in trainings:
                    title = mtr.group(2).strip(' .。:：-—·•()（）')
                    title = re.sub(r'[（(]\s*[众公女六攻兴次★☆]+\s*[)）]?', '', title)
                    title = re.sub(r'\s*[众公女六攻兴次★☆]+\s*$', '', title)
                    title = title.strip(' .。:：-—·•')
                    cur = {'no': no, 'title': title, 'module': cur_module,
                           'pdfPage': pdf_page, 'bookPage': book_page,
                           'stars': stars(raw.split('难度')[-1]) if '难度' in raw else 0,
                           'minutes': 0, 'ansPage': 0}
                    trainings[no] = cur
                else:
                    cur = trainings[no]
                continue
            if cur is None:
                continue
            if '难度' in raw:
                cur['stars'] = cur['stars'] or stars(raw.split('难度')[-1])
            mm = re.search(r'建议用时[：:]?\s*(\d+)', raw)
            if mm and not cur['minutes']:
                cur['minutes'] = int(mm.group(1))
            ma = re.search(r'答案见\s*(\d+)', raw)
            if ma and not cur['ansPage']:
                cur['ansPage'] = int(ma.group(1))

    out = [trainings[k] for k in sorted(trainings)]
    path = os.path.join(os.path.dirname(__file__), '..', 'data', 'calc-skeleton.json')
    json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'共 {len(out)} 个训练；缺失：', [n for n in range(1, max(trainings) + 1) if n not in trainings])
    for t in out:
        print(f"T{t['no']:>2} [{'★' * t['stars'] or '?':<3}|{t['minutes'] or '?':>2}m|答{t['ansPage'] or '?':>3}] {t['module']}｜{t['title']}｜p{t['pdfPage']}")

if __name__ == '__main__':
    main()
