#!/usr/bin/env python3
"""生成《探究应用新思维·七年级数学》与 人教版（2024）七年级大纲知识点的双向映射文档。

来源：
  - data/curriculum.json  每个知识点的 bookRefs 字段
  - data/book/index.json  书内 38 个讲次
输出：
  - docs/BOOK_MAPPING.md
  - data/book/mapping.json
"""
import json
import os
import re
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

# 不属于七年级大纲的书内讲次（八年级衔接内容）
BEYOND_GRADE7 = {
    "几何-23-认识三角形": "人教版八年级上册「三角形」",
    "几何-24-多边形的边与角": "人教版八年级上册「多边形及其内角和」",
    "几何-探究-三角形三边关系": "人教版八年级上册「三角形」拓展",
    "几何-探究-图形生长的奥秘": "图形规律探究（跨年级综合）",
}


def main():
    cur = json.load(open(os.path.join(DATA, "curriculum.json"), encoding="utf-8"))
    book = json.load(open(os.path.join(DATA, "book", "index.json"), encoding="utf-8"))
    units = {u["id"]: u for u in book["units"]}
    by_title = {u["title"]: u["id"] for u in book["units"]}
    by_id = set(units)

    def resolve(ref):
        """bookRefs 有 '类别/序号 标题'、'类别/探究 标题'、'类别/标题'、'讲次id' 等写法，统一解析为讲次 id。"""
        if ref in by_id:
            return ref
        title = ref.split("/", 1)[1] if "/" in ref else ref
        if title in by_title:
            return by_title[title]
        stripped = re.sub(r"^\s*\d+\s*", "", title).strip()
        if stripped in by_title:
            return by_title[stripped]
        stripped2 = re.sub(r"^探究\s*", "", stripped).strip()
        if stripped2 in by_title:
            return by_title[stripped2]
        return None

    point_to_units = defaultdict(list)
    unit_to_points = defaultdict(list)
    unresolved = defaultdict(list)
    points = {}
    chapters = {}

    for v in cur["volumes"]:
        for c in v["chapters"]:
            chapters[c["id"]] = (v["name"], c)
            for s in c["sections"]:
                for p in s["points"]:
                    points[p["id"]] = (v["name"], c, s, p)
                    for ref in p.get("bookRefs", []):
                        uid = resolve(ref)
                        if uid:
                            if uid not in point_to_units[p["id"]]:
                                point_to_units[p["id"]].append(uid)
                            if p["id"] not in unit_to_points[uid]:
                                unit_to_points[uid].append(p["id"])
                        else:
                            unresolved[ref].append(p["id"])

    unmapped = [u for u in book["units"] if u["id"] not in unit_to_points]
    unknown_refs = sorted(unresolved)
    multi = {uid: ps for uid, ps in unit_to_points.items() if len(ps) > 1}

    lines = []
    lines.append("# 《探究应用新思维·七年级数学》↔ 人教版（2024）七年级知识点 映射表")
    lines.append("")
    lines.append(f"- 大纲：人教版（2024）七年级上、下册，共 {len(chapters)} 章 / {len(points)} 个知识点")
    lines.append(f"- 教辅：《{book['book']}》（{book['author']}），共 {len(book['units'])} 个讲次 / {book['pdfPages']} 页扫描件")
    lines.append(f"- 已建立映射的书内讲次：**{len(unit_to_points)}** / {len(book['units'])}")
    lines.append("")
    lines.append("映射用途：① 每个知识点的课件中包含一张「新思维拓展」slide，讲解该讲次对应的方法与典型题；"
                 "② 章节考评卷中 `source.kind=\"book\"` 的题目按讲次与 PDF 页码溯源，可在应用 `/book` 页核对原页图像。")
    lines.append("")

    lines.append("## 一、按大纲知识点查阅（该知识点讲解取自书中哪些讲次）")
    lines.append("")
    for vid, (vname, c) in [(cid, chapters[cid]) for cid in chapters]:
        lines.append(f"### {vname} · {c['no']} {c['title']}")
        lines.append("")
        lines.append("| 知识点 | 知识点 ID | 对应《探究应用新思维》讲次 |")
        lines.append("| --- | --- | --- |")
        for s in c["sections"]:
            for p in s["points"]:
                refs = point_to_units.get(p["id"], [])
                cell = "、".join(f"第 {units[r]['printedStart']} 页 {units[r]['title']}" for r in refs if r in units)
                lines.append(f"| {p['name']} | `{p['id']}` | {cell or '—'} |")
        lines.append("")

    lines.append("## 二、按书内讲次查阅（该讲次讲解被拆分到哪些知识点）")
    lines.append("")
    lines.append("| 类别 | 讲次 | 书内页码 | 对应大纲知识点 |")
    lines.append("| --- | --- | --- | --- |")
    for u in book["units"]:
        ps = unit_to_points.get(u["id"], [])
        if u["id"] in BEYOND_GRADE7 and not ps:
            cell = f"（{BEYOND_GRADE7[u['id']]}，非七年级大纲内容，作为衔接拓展）"
        else:
            cell = "、".join(f"{points[pid][3]['name']} `{pid}`" for pid in ps) or "—"
        no = u["no"] if u["no"] not in ("探究", "-") else u["no"]
        lines.append(f"| {u['category']} | {no} {u['title']} | {u['printedStart']}–{u['printedEnd']} | {cell} |")
    lines.append("")

    if multi:
        lines.append("## 三、一个讲次对应多个大纲知识点的情形")
        lines.append("")
        for uid, ps in sorted(multi.items()):
            u = units[uid]
            names = "、".join(points[p][3]["name"] for p in ps)
            lines.append(f"- **{u['title']}**（书内第 {u['printedStart']} 页）→ {names}")
        lines.append("")

    lines.append("## 四、未纳入七年级映射的书内讲次")
    lines.append("")
    if unmapped:
        for u in unmapped:
            reason = BEYOND_GRADE7.get(u["id"], "内容与七年级大纲无直接对应，作为方法拓展保留")
            lines.append(f"- {u['category']} 第 {u['printedStart']} 页 **{u['title']}**：{reason}（可在应用 `/book` 页查看原页）")
    else:
        lines.append("- 无")
    lines.append("")

    if unknown_refs:
        lines.append("## 五、数据校验提示")
        lines.append("")
        lines.append("以下 `bookRefs` 未能在 `data/book/index.json` 中找到对应讲次：")
        for r in unknown_refs:
            pids = "、".join(f"`{p}`" for p in unresolved[r])
            lines.append(f"- `{r}`（出现在 {pids}）")
        lines.append("")

    os.makedirs(os.path.join(ROOT, "docs"), exist_ok=True)
    with open(os.path.join(ROOT, "docs", "BOOK_MAPPING.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")

    mapping = {
        "pointToUnits": {k: v for k, v in point_to_units.items()},
        "unitToPoints": {k: v for k, v in unit_to_points.items()},
        "unmappedUnits": [u["id"] for u in unmapped],
        "unknownRefs": {k: v for k, v in unresolved.items()},
    }
    with open(os.path.join(DATA, "book", "mapping.json"), "w", encoding="utf-8") as fh:
        json.dump(mapping, fh, ensure_ascii=False, indent=2)

    print(f"知识点 {len(points)} 个，其中 {len(point_to_units)} 个已映射到书内讲次")
    print(f"书内讲次 {len(book['units'])} 个，其中 {len(unit_to_points)} 个已映射到知识点")
    print(f"未映射讲次 {len(unmapped)} 个；无法识别的 bookRefs {len(unknown_refs)} 个")
    if unknown_refs:
        print("  ! 未知引用：", unknown_refs)
    print("已写出 docs/BOOK_MAPPING.md 与 data/book/mapping.json")


if __name__ == "__main__":
    main()
