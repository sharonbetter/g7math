#!/usr/bin/env python3
"""Build the 探究应用新思维七年级数学 index (unit -> OCR text) from the scanned book.

The PDF is a pure scan, so page text comes from data/ocr/book/page_NNNN.txt
(produced by tools/ocr). Printed page numbers in the book's own TOC map to PDF
pages with a constant offset, verified below.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OCR_DIR = os.path.join(ROOT, "data", "ocr", "book")
OUT_DIR = os.path.join(ROOT, "data", "book")
UNITS_DIR = os.path.join(OUT_DIR, "units")

# Printed page of each unit, taken from the book's own 目录 (OCR page 6-7, hand-corrected).
UNITS = [
    # (category, no, title, printed_page, kind)
    ("数与代数", "1", "数形结合话数轴", 1, "lesson"),
    ("数与代数", "2", "绝对值的探究", 8, "lesson"),
    ("数与代数", "3", "有理数的运算", 14, "lesson"),
    ("数与代数", "4", "数轴上的数学问题", 22, "lesson"),
    ("数与代数", "5", "整式的加减", 30, "lesson"),
    ("数与代数", "6", "自然数的排序", 37, "lesson"),
    ("数与代数", "探究", "供应站的最佳位置的确定", 41, "explore"),
    ("数与代数", "探究", "乘方美谈", 44, "explore"),
    ("数与代数", "探究", "以符示数", 48, "explore"),
    ("数与代数", "7", "一元一次方程", 52, "lesson"),
    ("数与代数", "8", "设元", 58, "lesson"),
    ("数与代数", "9", "情境应用题", 65, "lesson"),
    ("数与代数", "10", "绝对值与方程", 73, "lesson"),
    ("数与代数", "探究", "从三阶幻方谈起", 77, "explore"),
    ("数与代数", "探究", "商品的利润", 81, "explore"),
    ("数与代数", "探究", "多变的行程问题", 84, "explore"),
    ("数与代数", "11", "二元一次方程组", 89, "lesson"),
    ("数与代数", "12", "方程组的应用", 95, "lesson"),
    ("数与代数", "13", "不定方程（组）", 101, "lesson"),
    ("数与代数", "14", "一元一次不等式（组）", 107, "lesson"),
    ("数与代数", "15", "不等式（组）的应用", 113, "lesson"),
    ("数与代数", "16", "从估算到数感", 119, "lesson"),
    ("数与代数", "17", "平面直角坐标系", 124, "lesson"),
    ("数与代数", "18", "实数", 133, "lesson"),
    ("空间与图形", "19", "丰富的图形世界", 140, "lesson"),
    ("空间与图形", "20", "线段、射线与直线", 148, "lesson"),
    ("空间与图形", "21", "角", 154, "lesson"),
    ("空间与图形", "22", "相交线与平行线", 161, "lesson"),
    ("空间与图形", "23", "认识三角形", 168, "lesson"),
    ("空间与图形", "24", "多边形的边与角", 176, "lesson"),
    ("空间与图形", "探究", "设而不求", 182, "explore"),
    ("空间与图形", "探究", "平面镶嵌", 187, "explore"),
    ("空间与图形", "探究", "三角形三边关系", 193, "explore"),
    ("空间与图形", "探究", "四边形面积的计算", 197, "explore"),
    ("空间与图形", "探究", "图形生长的奥秘", 206, "explore"),
    ("空间与图形", "探究", "实验与操作", 214, "explore"),
    ("统计与概率", "25", "图中有数", 222, "lesson"),
    ("参考答案", "-", "参考答案", 230, "answers"),
]

# Which 2024 人教版七年级 knowledge points each unit feeds (mapping is refined per question later).
CATEGORY_MAP = {"数与代数": "代数", "空间与图形": "几何", "统计与概率": "统计", "参考答案": "答案"}


def load_pages():
    pages = {}
    for name in os.listdir(OCR_DIR):
        m = re.match(r"page_(\d+)\.txt$", name)
        if not m:
            continue
        with open(os.path.join(OCR_DIR, name), encoding="utf-8") as fh:
            pages[int(m.group(1))] = fh.read()
    return pages


def main():
    pages = load_pages()
    total_pdf_pages = max(pages)
    os.makedirs(UNITS_DIR, exist_ok=True)

    # Verify the offset between printed page numbers and PDF page numbers.
    # 讲1 (printed p.1) begins on PDF page 8.
    offset = 7
    probe = pages.get(1 + offset, "")
    assert "数形结合话数轴" in probe, "page offset verification failed"

    units = []
    for i, (cat, no, title, printed, kind) in enumerate(UNITS):
        pdf_start = printed + offset
        next_printed = UNITS[i + 1][3] if i + 1 < len(UNITS) else printed + 8
        pdf_end = next_printed + offset - 1
        pdf_end = min(pdf_end, total_pdf_pages)
        text = "\n".join(
            f"\n===== [书内第 {p - offset} 页 / PDF 第 {p} 页] =====\n" + pages.get(p, "")
            for p in range(pdf_start, pdf_end + 1)
        )
        uid = f"{CATEGORY_MAP[cat]}-{no}-{title}"
        uid = uid.replace(" ", "").replace("/", "_")
        with open(os.path.join(UNITS_DIR, f"{uid}.txt"), "w", encoding="utf-8") as fh:
            fh.write(text.strip() + "\n")
        units.append({
            "id": uid,
            "category": cat,
            "no": no,
            "title": title,
            "kind": kind,
            "printedStart": printed,
            "printedEnd": max(printed, next_printed - 1),
            "pdfStart": pdf_start,
            "pdfEnd": pdf_end,
            "chars": len(text),
            "textFile": f"units/{uid}.txt",
        })

    index = {
        "book": "探究应用新思维·七年级数学",
        "author": "黄东坡",
        "pdfPages": total_pdf_pages,
        "printedToPdfOffset": offset,
        "ocr": "macOS Vision (zh-Hans), tools/ocr.swift",
        "note": "PDF 为纯扫描件，无文本层；本索引由 OCR 结果 + 书内目录整理。OCR 对数学公式识别有误差，引用题目时需对照原页图像核对。",
        "units": units,
    }
    with open(os.path.join(OUT_DIR, "index.json"), "w", encoding="utf-8") as fh:
        json.dump(index, fh, ensure_ascii=False, indent=2)

    print(f"units: {len(units)}")
    print(f"total chars: {sum(u['chars'] for u in units)}")
    for u in units:
        print(f"  {u['id']:40s} printed {u['printedStart']:>3}-{u['printedEnd']:<3} pdf {u['pdfStart']:>3}-{u['pdfEnd']:<3} {u['chars']:>6} chars")


if __name__ == "__main__":
    main()
