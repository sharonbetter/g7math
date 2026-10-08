#!/usr/bin/env python3
"""校验 data/lessons/*.json 与 data/exams/*.json 是否符合 docs/CONTENT_SCHEMA.md。"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

ERROR_TAGS = {
    "概念不清", "审题不清", "符号错误", "计算失误", "公式记错", "方法选择不当",
    "漏解或多解", "分类讨论不全", "步骤不规范", "单位或作答遗漏", "图形识别错误", "推理不严谨",
}
REQUIRED_SLIDE_KINDS = {"concept", "example", "method", "pitfall", "book"}
TARGET_QUESTIONS = {"choice": 8, "fill": 5, "calc": 5, "applied": 4}


def load(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def curriculum_points():
    cur = load(os.path.join(DATA, "curriculum.json"))
    out = {}
    for v in cur["volumes"]:
        for c in v["chapters"]:
            pts = {}
            for s in c["sections"]:
                for p in s["points"]:
                    pts[p["id"]] = p
            out[c["id"]] = {"chapter": c, "points": pts}
    return out


def check_lesson_file(cid, info, errors, warnings):
    path = os.path.join(DATA, "lessons", f"{cid}.json")
    if not os.path.exists(path):
        warnings.append(f"[课件] {cid} 缺少课件文件")
        return
    try:
        doc = load(path)
    except Exception as e:
        errors.append(f"[课件] {cid} JSON 解析失败：{e}")
        return
    lessons = doc.get("lessons", [])
    by_id = {l.get("pointId"): l for l in lessons}
    missing = set(info["points"]) - set(by_id)
    extra = set(by_id) - set(info["points"])
    if missing:
        errors.append(f"[课件] {cid} 缺少知识点课件：{sorted(missing)}")
    if extra:
        errors.append(f"[课件] {cid} 含未知知识点：{sorted(extra)}")
    for pid, l in by_id.items():
        p = info["points"].get(pid)
        if not p:
            continue
        kinds = [s.get("kind") for s in l.get("slides", [])]
        if len(kinds) < 7:
            errors.append(f"[课件] {cid}/{pid} slides 仅 {len(kinds)} 张（要求 ≥7）")
        for k in REQUIRED_SLIDE_KINDS:
            if k not in kinds:
                errors.append(f"[课件] {cid}/{pid} 缺少 {k} 类型 slide")
        if l.get("durationMinutes") != p["estimatedMinutes"]:
            warnings.append(
                f"[课件] {cid}/{pid} durationMinutes={l.get('durationMinutes')} 与大纲 {p['estimatedMinutes']} 不一致"
            )
        if l.get("title") != p["name"]:
            warnings.append(f"[课件] {cid}/{pid} title 与大纲 name 不一致")
        if not l.get("objectives"):
            errors.append(f"[课件] {cid}/{pid} 缺少 objectives")
        if not l.get("checkQuestions"):
            errors.append(f"[课件] {cid}/{pid} 缺少 checkQuestions")
        for s in l.get("slides", []):
            if s.get("kind") == "example" and not s.get("solution"):
                errors.append(f"[课件] {cid}/{pid} 有 example 未给 solution")
            if s.get("kind") == "book" and not s.get("bookRef"):
                warnings.append(f"[课件] {cid}/{pid} 有 book slide 未标 bookRef")


def check_exam_file(cid, info, errors, warnings):
    path = os.path.join(DATA, "exams", f"{cid}.json")
    if not os.path.exists(path):
        warnings.append(f"[考评] {cid} 缺少考评卷")
        return
    try:
        doc = load(path)
    except Exception as e:
        errors.append(f"[考评] {cid} JSON 解析失败：{e}")
        return
    qs = doc.get("questions", [])
    by_id = {q.get("id"): q for q in qs}
    if len(qs) != 22:
        warnings.append(f"[考评] {cid} 题量 {len(qs)}（规范建议 22）")

    # section 引用一致
    in_sections = []
    for s in doc.get("sections", []):
        for qid in s.get("questionIds", []):
            if qid not in by_id:
                errors.append(f"[考评] {cid} section {s.get('id')} 引用了不存在的题 {qid}")
            in_sections.append(qid)
    if set(in_sections) != set(by_id):
        errors.append(f"[考评] {cid} sections 与 questions 集合不一致")

    # 题量分布
    for t, n in TARGET_QUESTIONS.items():
        got = sum(1 for q in qs if q.get("type") == t)
        if got != n:
            warnings.append(f"[考评] {cid} {t} 题量为 {got}（规范建议 {n}）")

    # 时间合计
    total = sum(q.get("estimatedSeconds", 0) for q in qs)
    if doc.get("totalEstimatedSeconds") != total:
        errors.append(
            f"[考评] {cid} totalEstimatedSeconds={doc.get('totalEstimatedSeconds')} ≠ 求和 {total}"
        )
    if not (3000 <= total <= 3900):
        warnings.append(f"[考评] {cid} 总预计耗时 {total}s 偏离 3300~3600")

    # 覆盖知识点
    covered = set()
    for q in qs:
        for p in q.get("pointIds", []):
            covered.add(p)
    missing = set(info["points"]) - covered
    if missing:
        errors.append(f"[考评] {cid} 未覆盖知识点：{sorted(missing)}")
    unknown = covered - set(info["points"])
    if unknown:
        errors.append(f"[考评] {cid} 引用了未知知识点：{sorted(unknown)}")

    # 难度非递减（按 section 顺序）
    for s in doc.get("sections", []):
        seq = [by_id[qid].get("difficulty", 0) for qid in s.get("questionIds", []) if qid in by_id]
        if seq != sorted(seq):
            warnings.append(f"[考评] {cid} section {s.get('id')} difficulty 非单调：{seq}")

    # 逐题检查
    book_n = 0
    for q in qs:
        qid = q.get("id")
        t = q.get("type")
        if t not in TARGET_QUESTIONS:
            errors.append(f"[考评] {cid}/{qid} 非法题型 {t}")
        if not q.get("stem"):
            errors.append(f"[考评] {cid}/{qid} 缺少 stem")
        if not q.get("solution"):
            errors.append(f"[考评] {cid}/{qid} 缺少 solution")
        if not q.get("answer"):
            errors.append(f"[考评] {cid}/{qid} 缺少 answer")
        if not q.get("estimatedSeconds"):
            errors.append(f"[考评] {cid}/{qid} 缺少 estimatedSeconds")
        if t == "choice":
            opts = q.get("options") or []
            if len(opts) != 4:
                errors.append(f"[考评] {cid}/{qid} 选择题选项数 {len(opts)} ≠ 4")
            if str(q.get("answer", "")).strip().upper()[:1] not in "ABCD":
                errors.append(f"[考评] {cid}/{qid} 选择题答案 {q.get('answer')!r} 不是 A~D")
        if t in ("calc", "applied") and not q.get("rubric"):
            errors.append(f"[考评] {cid}/{qid} {t} 缺少 rubric")
        if not q.get("variants"):
            errors.append(f"[考评] {cid}/{qid} 缺少 variants")
        for v in q.get("variants", []):
            if not v.get("answer") or not v.get("solution") or not v.get("stem"):
                errors.append(f"[考评] {cid}/{qid} 有变式缺少 stem/answer/solution")
        for tag in q.get("errorTags", []):
            if tag not in ERROR_TAGS:
                warnings.append(f"[考评] {cid}/{qid} 非规范错因标签：{tag}")
        src = q.get("source") or {}
        if src.get("kind") == "book":
            book_n += 1
        elif src.get("kind") != "original":
            errors.append(f"[考评] {cid}/{qid} source.kind 非法：{src.get('kind')}")
        if re.search(r"\\[a-zA-Z]+", q.get("stem", "") + q.get("solution", "")):
            warnings.append(f"[考评] {cid}/{qid} 疑似使用了 LaTeX 反斜杠命令")
    if book_n < 6:
        warnings.append(f"[考评] {cid} 书内题仅 {book_n} 道（规范建议 ≥8）")
    return {"questions": len(qs), "book": book_n, "seconds": total, "points": len(covered)}


def main():
    info = curriculum_points()
    errors, warnings = [], []
    stats = {}
    for cid, ci in info.items():
        check_lesson_file(cid, ci, errors, warnings)
        st = check_exam_file(cid, ci, errors, warnings)
        if st:
            stats[cid] = st

    print("=" * 72)
    print(f"章节 {len(info)} 个；已生成考评卷 {len(stats)} 份")
    print("=" * 72)
    for cid, st in sorted(stats.items()):
        print(
            f"  {cid:8s} 题 {st['questions']:>2} · 书内题 {st['book']:>2} · "
            f"预计 {st['seconds']:>4}s · 覆盖知识点 {st['points']}"
        )

    lessons = sorted(f[:-5] for f in os.listdir(os.path.join(DATA, "lessons"))) if os.path.isdir(os.path.join(DATA, "lessons")) else []
    print(f"\n已生成课件：{', '.join(lessons) if lessons else '（无）'}")

    print(f"\n错误 {len(errors)} 条，警告 {len(warnings)} 条")
    for e in errors:
        print("  ✗", e)
    for w in warnings[:60]:
        print("  !", w)
    if len(warnings) > 60:
        print(f"  ... 另有 {len(warnings) - 60} 条警告")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
