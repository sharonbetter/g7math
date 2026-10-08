# 内容数据规范（课件 / 考评题库）

所有内容文件为 **UTF-8 JSON**，放在 `data/lessons/` 与 `data/exams/`。

## 0. 数学书写约定（重要）

**统一使用 Unicode 纯文本数学书写，禁止使用 LaTeX 反斜杠命令**（避免 JSON 转义错误）。

| 含义 | 写法 |
| --- | --- |
| 乘方 | `x²`、`x³`、`xⁿ`、`(-2)³`、`2⁴` |
| 分数 | `(2x-1)/3`、`3/4`、`-1/2` |
| 根号 | `√2`、`√(a+1)`、`∛8`、`∛(-27)` |
| 圆周率 | `π` |
| 不等号 | `>` `<` `≥` `≤` `≠` |
| 几何 | `∠AOB`、`△ABC`、`AB∥CD`、`AB⊥CD`、`°`、`△`、`≌` |
| 区间/集合 | `{x | x > 2}` |
| 其他 | `×` `÷` `·` `±` `≈` `∴` `∵` `⟹` `⟺` |

公式独占一行时直接写在同一字符串里并用 `；` 或换行符 `\n` 分隔。**允许**在极少数情况下使用 `$...$` 包裹 LaTeX（此时 JSON 中反斜杠必须写成 `\\`），但默认不要使用。

---

## 1. 课件（Lesson）

文件：`data/lessons/<chapterId>.json`（一章一个文件，包含该章所有知识点课件）。

```json
{
  "chapterId": "7a-c1",
  "chapterTitle": "第一章 有理数",
  "lessons": [
    {
      "pointId": "7a-1-01",
      "title": "正数和负数的意义",
      "durationMinutes": 15,
      "objectives": [
        "理解正数、负数的意义，会用正负数表示具有相反意义的量"
      ],
      "slides": [
        {
          "kind": "concept",
          "title": "情境引入",
          "body": "文字讲解……（可用 \n 分段）"
        },
        {
          "kind": "example",
          "title": "例1",
          "problem": "题目原文",
          "solution": "完整解答过程，分步写清楚",
          "notes": "本题考查什么、关键在哪一步"
        },
        {
          "kind": "method",
          "title": "方法提炼",
          "body": "可迁移的解题方法/口诀"
        },
        {
          "kind": "pitfall",
          "title": "易错提醒",
          "body": "常见错误与避免办法"
        },
        {
          "kind": "book",
          "title": "《探究应用新思维》拓展",
          "body": "结合该书对应讲次的拓展方法与典型题（要写清方法，必要时给出例题与解答）",
          "bookRef": "数与代数/1 数形结合话数轴"
        }
      ],
      "summary": "一句话小结",
      "checkQuestions": [
        { "question": "随堂检测题", "answer": "答案与简要解析" }
      ]
    }
  ]
}
```

字段要求：

- 每个知识点**至少** 6 张 slide：`concept` ×2、`example` ×2、`method` ×1、`pitfall` ×1，并且**至少 1 张 `book` 类型**的拓展 slide（合计 ≥7 张）。
- `example` 的 `solution` 必须写完整过程，不能只给答案。
- `checkQuestions` 每课 2~3 题，必须给答案。
- `durationMinutes` 与 `data/curriculum.json` 中该知识点的 `estimatedMinutes` 一致。
- **必须覆盖 `data/curriculum.json` 中该章列出的每一个 pointId，一个都不能少。**

---

## 2. 考评卷（Exam）

文件：`data/exams/<chapterId>.json`（一章一套，学生约 1 小时内完成）。

```json
{
  "id": "7a-c1-exam",
  "chapterId": "7a-c1",
  "chapterTitle": "第一章 有理数",
  "title": "第一章 有理数 · 章节考评",
  "totalEstimatedSeconds": 3300,
  "sections": [
    { "id": "A", "title": "一、选择题（每题只有一个正确选项）", "type": "choice", "questionIds": ["7a-c1-e01"] },
    { "id": "B", "title": "二、填空题", "type": "fill", "questionIds": ["7a-c1-e09"] },
    { "id": "C", "title": "三、计算题（写出必要的计算过程）", "type": "calc", "questionIds": ["7a-c1-e14"] },
    { "id": "D", "title": "四、应用题（写出必要的解答过程）", "type": "applied", "questionIds": ["7a-c1-e19"] }
  ],
  "questions": [
    {
      "id": "7a-c1-e01",
      "type": "choice",
      "difficulty": 1,
      "estimatedSeconds": 60,
      "pointIds": ["7a-1-01"],
      "stem": "如果收入 100 元记作 +100 元，那么支出 60 元记作（  ）",
      "options": ["A. +60 元", "B. -60 元", "C. +40 元", "D. -40 元"],
      "answer": "B",
      "solution": "收入与支出是具有相反意义的量。收入记为正，则支出记为负，所以支出 60 元记作 -60 元，选 B。",
      "errorTags": ["概念不清", "符号理解错误"],
      "commonWrong": [
        { "answer": "A", "reason": "没有理解“相反意义的量”，直接把 60 当成正数" }
      ],
      "source": { "kind": "book", "ref": "数与代数/1 数形结合话数轴", "pdfPage": 8 },
      "variants": [
        {
          "stem": "向南走 5 米记作 -5 米，那么向北走 8 米记作（  ）",
          "options": ["A. +8 米", "B. -8 米", "C. +5 米", "D. -5 米"],
          "answer": "A",
          "solution": "向南为负，则向北为正，向北走 8 米记作 +8 米，选 A。",
          "estimatedSeconds": 45
        }
      ]
    }
  ]
}
```

### 2.1 题量与时间预算（每章）

| 题型 | 题量 | 单题预计耗时 | 小计 |
| --- | --- | --- | --- |
| 选择题 | 8 | 45~90 秒 | 约 9 分钟 |
| 填空题 | 5 | 90~180 秒 | 约 11 分钟 |
| 计算题 | 5 | 180~300 秒 | 约 18 分钟 |
| 应用题 | 4 | 240~420 秒 | 约 20 分钟 |
| **合计** | **22** | | **约 58 分钟（3300~3600 秒）** |

`totalEstimatedSeconds` 必须等于所有题目 `estimatedSeconds` 之和。

### 2.2 难度与顺序

- `difficulty` 取 1~5：1=基础概念，2=简单计算，3=中等，4=较难综合，5=推理探究。
- 同一大题内**按 `difficulty` 非递减排列**（由易到难）。
- 整卷总体覆盖：基础概念 ≥30%、计算 ≥35%、应用推理 ≥30%。

### 2.3 题目来源

- **优先**从《探究应用新思维·七年级数学》中抽取、改编对应题目，此时
  `source.kind = "book"`，`ref` 填该书讲次（见 `data/book/index.json` 的 `id`），
  `pdfPage` 填该书对应的 **PDF 页码**（`data/book/index.json` 中的 `pdfStart`/`pdfEnd` 区间内）。
  该书 OCR 文本位于 `data/book/units/*.txt`，页码图位于 `data/book/pages/page_NNNN.png`。
- 书中没有合适的题时自行设计，此时 `source.kind = "original"`，且不要写 `ref`/`pdfPage`。
- 每章**至少 8 道**题来自书中（`kind = "book"`），其余可自编。
- 从书中引用时，**必须对照 `data/book/pages/page_NNNN.png` 图像核对题目原文**（OCR 对公式识别有误差），并把题目改写成规范的现代表述（补全省略的条件、统一符号写法）。

### 2.4 各字段要求

- `stem`：题干，选择题不含选项。填空题用 `______` 表示空；一道填空有多个空时用 `(1)____ (2)____`。
- `options`：仅选择题有，固定 4 个选项，形如 `"A. ……"`。
- `answer`：
  - `choice` → 选项字母，如 `"B"`。
  - `fill` → 字符串；多个空按顺序用 `；` 连接，如 `"-3；2"`。
  - `calc` / `applied` → **最终答案**的规范形式（用于自动判分），如 `"x = 3"`、`"原式 = -7"`。
- `acceptedAnswers`：可选，字符串数组，列出与 `answer` 等价的其他写法（如 `"x=3"`、`"3"`）。
- `solution`：**完整解析**，必须包含思路与每一步推导，计算题要写出计算过程，应用题要写出设元、列式、求解、作答。
- `rubric`：`calc`/`applied` 必填，3~5 条关键步骤要点（用于步骤分与错因定位）。
- `errorTags`：2~4 个错因标签，从以下集合中选：
  `概念不清`、`审题不清`、`符号错误`、`计算失误`、`公式记错`、`方法选择不当`、`漏解或多解`、`分类讨论不全`、`步骤不规范`、`单位或作答遗漏`、`图形识别错误`、`推理不严谨`。
- `commonWrong`：1~3 条典型的错误答案及其原因（`answer` 与 `reason`）。
- `variants`：**每道题 1~2 个变式题**，用于生成专项练习；结构同主题（有 `options`/`answer`/`solution`/`estimatedSeconds`），不需要 `variants` 和 `source`。变式题必须与原题考同一个知识点、难度相当或略高，且**答案必须重新独立计算**。

### 2.5 正确性要求

- 所有题目的 `answer` 与 `solution` 必须一致且**数学上正确**，请逐题验算。
- 填空题答案若为数值，必须是最简结果；若为表达式，写法要与 `solution` 一致。
- 计算题不要出现无解、多解未说明的情况。
