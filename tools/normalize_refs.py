#!/usr/bin/env python3
"""把 curriculum.json 的 bookRefs 与 lessons/*.json 的 slide.bookRef 统一成
   「<书内类别>/<讲次号或“探究”> <讲次标题>」的规范写法（依据 data/book/index.json）。

用法：python3 tools/normalize_refs.py [--check]
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

CHECK = "--check" in sys.argv


def canonical_map():
    idx = json.load(open(os.path.join(DATA, "book", "index.json"), encoding="utf-8"))
    by_title = {}
    for u in idx["units"]:
        no = u["no"]
        prefix = "" if no in ("探究", "-") else f"{no} "
        if no == "探究":
            prefix = "探究 "
        canonical = f"{u['category']}/{prefix}{u['title']}"
        by_title[u["title"]] = canonical
        by_title[u["id"]] = canonical
    return by_title


def resolve(ref, by_title):
    if ref in by_title:
        return by_title[ref]
    title = ref.split("/", 1)[1] if "/" in ref else ref
    if title in by_title:
        return by_title[title]
    stripped = re.sub(r"^\s*\d+\s*", "", title).strip()
    stripped = re.sub(r"^(探究)\s*", "", stripped).strip()
    return by_title.get(stripped)


def main():
    by_title = canonical_map()
    changed = []
    unresolved = []

    # 1) curriculum.json
    cpath = os.path.join(DATA, "curriculum.json")
    cur = json.load(open(cpath, encoding="utf-8"))
    for v in cur["volumes"]:
        for c in v["chapters"]:
            for s in c["sections"]:
                for p in s["points"]:
                    refs = p.get("bookRefs") or []
                    new = []
                    for r in refs:
                        c2 = resolve(r, by_title)
                        if c2 is None:
                            unresolved.append((p["id"], r))
                            new.append(r)
                        else:
                            new.append(c2)
                            if c2 != r:
                                changed.append((p["id"], r, c2))
                    p["bookRefs"] = new
    if not CHECK:
        json.dump(cur, open(cpath, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        open(cpath, "a", encoding="utf-8").write("\n")

    # 2) lessons/*.json
    ldir = os.path.join(DATA, "lessons")
    lesson_changed = 0
    if os.path.isdir(ldir):
        for name in sorted(os.listdir(ldir)):
            if not name.endswith(".json"):
                continue
            path = os.path.join(ldir, name)
            doc = json.load(open(path, encoding="utf-8"))
            touched = False
            for l in doc.get("lessons", []):
                for sl in l.get("slides", []):
                    ref = sl.get("bookRef")
                    if not ref:
                        continue
                    c2 = resolve(ref, by_title)
                    if c2 is None:
                        unresolved.append((f"{name}:{l.get('pointId')}", ref))
                    elif c2 != ref:
                        sl["bookRef"] = c2
                        touched = True
                        lesson_changed += 1
            if touched and not CHECK:
                json.dump(doc, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
                open(path, "a", encoding="utf-8").write("\n")

    print(f"curriculum.json 规范化 {len(changed)} 条引用")
    for pid, old, new in changed[:40]:
        print(f"  {pid}: {old}  ->  {new}")
    if len(changed) > 40:
        print(f"  ... 另有 {len(changed) - 40} 条")
    print(f"lessons/*.json 规范化 {lesson_changed} 条 bookRef")
    print(f"无法解析的引用 {len(unresolved)} 条")
    for pid, r in unresolved:
        print("  !", pid, r)
    return 1 if unresolved else 0


if __name__ == "__main__":
    sys.exit(main())
