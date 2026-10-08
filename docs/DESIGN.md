# 七年级数学学习工具 · 系统设计

> 依据：国家中小学智慧教育平台 <https://basic.smartedu.cn/> 人教版（2024）义务教育教科书《数学》七年级上册、下册
> 融合教辅：《探究应用新思维·七年级数学》（黄东坡）

---

## 1. 需求与实现对照

| 需求 | 实现 |
| --- | --- |
| ① 按智慧平台人教版七上/七下大纲设计课件与讲解 | `data/curriculum.json`（12 章 / 114 个知识点，目录已按平台与人教社 2024 版核对）+ `data/lessons/*.json`（每知识点 7~10 张 slide 课件） |
| ② 解析《探究应用新思维》并拆分到对应知识点 | `tools/ocr.swift`（macOS Vision 逐页 OCR 277 页）→ `tools/build_book.py`（按书中目录切分 38 个讲次）→ 课件 `book` slide、题库 `source.kind="book"` + `ref`/`pdfPage` |
| ③ 每章一套考评题（概念→计算→应用推理） | `data/exams/<chapterId>.json`，每卷 22 题：选择 8 / 填空 5 / 计算 5 / 应用 4，约 3300~3600 秒 |
| ④ 由易到难、取材于该书、补自编题、预计耗时、完整解析 | 每卷 `difficulty` 大题内非递减；`source.kind` 区分 book/original；每题 `estimatedSeconds`；每题 `solution` + `commonWrong` |
| ⑤⑥⑦⑧ 逐题耗时点记录 | `src/lib/timing.ts` + `src/pages/Run.tsx`：每题 `startedAt` / `submittedAt` / `durationMs` / `firstPickMs` / `revisitMs` |
| ⑨ 实际耗时与预计耗时对比，超出 1 分钟以上才标记 | `isSlow()`：`actualMs − estimatedSeconds×1000 > 60000` |
| ⑩ 比对结果、标记错题、分析错因、生成专项讲解课件 | `src/lib/grading.ts` + `src/pages/Report.tsx` + `src/pages/RemedialPage.tsx` |
| ⑪ 对超时题与错题生成专项练习并循环 | `src/lib/adaptive.ts` + `LoopState`（`src/lib/store.ts`），循环至无错题、无超时 → `mastered` |

---

## 2. 数据流水线

```
探究应用新思维七年级数学.pdf（277 页纯扫描件，无文本层，137 MB）
        │
        ├─ tools/ocr.swift        macOS Vision（zh-Hans）逐页 OCR  → data/ocr/book/page_NNNN.txt（277 个，55.5 万字符）
        ├─ tools/render.swift     逐页渲染                      → data/book/pages/*.png（277 张）
        ├─ tools/compress_pages.py 压缩为网页可用图              → data/book/pages_jpg/*.jpg（277 张，44 MB）
        └─ tools/build_book.py    按书中目录切分 38 个讲次         → data/book/index.json + data/book/units/*.txt

国家中小学智慧教育平台（人教版 2024 七上/七下目录）
        └─ 人工核对人教社/教研来源           → data/curriculum.json（2 册 / 12 章 / 114 知识点）

内容生成（教研员视角）
        ├─ data/lessons/<chapterId>.json   知识点课件（概念/例题/方法/易错/《新思维》拓展）
        └─ data/exams/<chapterId>.json     章节考评卷（含解析、错因、变式）

        └─ app/scripts/sync-data.mjs  →  app/public/data/（供前端静态读取）
```

**页码映射**：书中印刷页码 + 7 = PDF 页码（已用 3 个讲次交叉验证：印刷 1 → PDF 8，印刷 222 → PDF 229，印刷 230 → PDF 237）。

---

## 3. 前端架构

```
app/
├─ public/data/                 # 由 scripts/sync-data.mjs 从 ../data 同步
├─ src/
│  ├─ types.ts                  # 全部数据结构
│  ├─ lib/
│  │  ├─ answers.ts             # 答案归一化与等价判定（分数/小数、全半角、多空、数值等价计算器）
│  │  ├─ grading.ts             # 批改、错因、耗时标记规则、格式化和统计
│  │  ├─ timing.ts              # 计时引擎（首尾相接的计时链）
│  │  ├─ adaptive.ts            # 错因分析 + 专项练习卷生成 + 掌握判定
│  │  ├─ store.ts               # localStorage 持久化（轮次/循环状态/学习进度/导入导出）
│  │  └─ data.ts                # 课件、题库、书籍索引加载
│  ├─ components/               # MathText（Unicode + 可选 KaTeX）、UI 原子组件
│  └─ pages/                    # Home / Curriculum / ChapterPage / LessonPage /
│                               # ExamList / ExamIntro / Run / Report /
│                               # RemedialList / RemedialPage / Book / Progress
```

---

## 4. 计时模型（核心）

时间轴是一条**首尾相接的链**：

```
考评开始 ──► 第1题(选择) ──► 第2题(选择) ──► 第3题(填空) ──► …
   t0          submit1         submit2         submit3
   │             │               │               │
   └── dur1 ─────┘               │               │
                 └──── dur2 ─────┘               │
                                 └──── dur3 ─────┘
```

- `startedAt(1) = round.startedAt`（点击「开始答题」的时刻）
- `startedAt(n) = submittedAt(n−1)`
- `durationMs(n) = submittedAt(n) − startedAt(n)`
- 终点 `submittedAt`：
  - **选择题**：选定选项 → 点「提交本题」→ 记录提交时刻（同时另存 `firstPickMs` = 首次选中选项用时，作为更细的耗时点）
  - **填空题 / 计算题 / 应用题**：填写答案 → 点「提交并上传」→ 保存成功（写入 localStorage 并回显「已提交并上传成功 ✓」）时记录

答题为**线性顺序**（不可回退），以保证计时链的语义与需求一致；交卷后在报告页逐题回看。

**标记规则**：`durationMs − estimatedSeconds×1000 > 60 000 ms` 才标记为「耗时标记题」；≤ 1 分钟不标记。

---

## 5. 批改与错因

| 题型 | 判分方式 |
| --- | --- |
| 选择题 | 选项字母比对 |
| 填空题 | 答案归一化后比对：全/半角、空白、标点统一；支持多空按 `；` 分段顺序比对；支持分数↔小数等价（内置安全数值表达式求值器，支持 `+-*/^()`、`√`、`π`）；支持 `acceptedAnswers` 多解与省略变量名（`x=3` ↔ `3`） |
| 计算题 / 应用题 | 以「最终答案」自动判分；同时给出 `rubric` 步骤要点自查清单，按命中比例给部分分（上限 0.8） |

**错因分析**三级递进：
1. 学生答案命中题目预置的 `commonWrong` → 使用该具体错因（如「去括号时只变了第一项符号」）；
2. 否则使用题目的 `errorTags` 生成通用错因说明；
3. 汇总到知识点维度，形成薄弱知识点列表。

---

## 6. 自适应循环

```
        ┌──────────────────────────────────────────────┐
        │  第 1 轮：章节考评（22 题，约 1 小时）          │
        └───────────────────────┬──────────────────────┘
                                ▼
                 逐题批改 + 耗时对比（>1min 标记）
                                │
              ┌─────────────────┴─────────────────┐
       无错题且无超时                        有错题或超时
              │                                   │
              ▼                                   ▼
      标记「已掌握」                 ┌──────────────────────────┐
      循环结束                       │ 专项讲解课件              │
                                     │ · 薄弱知识点精讲          │
                                     │ · 逐题错因剖析 + 思路重建 │
                                     │ · 变式跟进                │
                                     └────────────┬─────────────┘
                                                  ▼
                                     ┌──────────────────────────┐
                                     │ 专项练习卷（自动组卷）    │
                                     │ ① 错题/超时题的变式题     │
                                     │ ② 同知识点其他题的变式    │
                                     │ ③ 跨章同知识点强化题      │
                                     │ ④ 不足时重做原题          │
                                     │ 总预计耗时 ≤ 25 分钟      │
                                     └────────────┬─────────────┘
                                                  │
                                    再次批改 + 耗时对比 ──► 回到判断
```

循环状态存于 `LoopState`：`{chapterId, round, status: 'exam'|'remedial'|'mastered', roundIds, weakPointIds}`，
每轮结束自动推进；只有「零错题 + 零耗时标记」才进入 `mastered`。

---

## 7. 题库与课件规范

见 `docs/CONTENT_SCHEMA.md`。要点：

- **数学书写**：统一 Unicode 纯文本（`x²`、`√2`、`(2x-1)/3`、`∠AOB`），避免 JSON 中的 LaTeX 反斜杠转义问题；渲染层仍兼容 `$...$` KaTeX。
- **每章考评卷**：22 题 / 3300~3600 秒 / 选择 8·填空 5·计算 5·应用 4 / 大题内难度非递减 / 每题含解析·错因标签·典型错答·1~2 个变式。
- **每章课件**：覆盖该章全部知识点，每知识点 ≥7 张 slide（含 2 概念 + 2 例题 + 1 方法 + 1 易错 + 1《新思维》拓展）。
- **几何题与统计题**受限于答题界面无法显示插图：一律要求把图形条件、图表数据用文字/表格完整写进题干。

校验工具：`python3 tools/validate_content.py`（结构、题量、时间合计、知识点覆盖、难度单调性、rubric/variants 完整性、LaTeX 反斜杠检查）。

---

## 8. 运行方式

```bash
# 1) 生成前端所需数据副本（把 ../data 同步到 app/public/data）
cd app && node scripts/sync-data.mjs

# 2) 开发模式
npm run dev            # http://127.0.0.1:5273

# 3) 生产构建 + 预览
npm run build && npm run preview
```

数据全部保存在浏览器 localStorage，可在「学习报告 → 数据管理」中导出/导入 JSON。

---

## 9. 已知限制

1. **PDF 为纯扫描件**：所有书内内容依赖 macOS Vision OCR，数学公式（尤其是分式、根式、上下标、图形标注）识别有误差。因此：
   - 从书中取题时以 OCR 文本 + 书末《参考答案》交叉验证；
   - **无法进行图像级复核**（本会话模型不支持图像输入），`ref`/`pdfPage` 仅作为溯源线索；
   - 工具内置「探究新思维」原页浏览（`/book`），可由人工对照扫描页复核题库中的书内题。
2. **图形题**：答题界面为纯文本，凡依赖插图的题目均改写为文字描述条件；原书的图形题请到 `/book` 查看原页。
3. **计算题/应用题的解题过程**不做逐行自动判分，采用「最终答案自动判分 + rubric 步骤自查给部分分」的方案。
4. OCR 文本与解析结果保存在 `data/` 下，未随应用打包（仅同步索引、文本与压缩页图）。
