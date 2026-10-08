# 七年级数学学习工具

面向**人教版（2024）七年级数学**的本地学习工具：知识点课件讲解 → 章节考评（逐题计时）→ 自动批改与错因分析 → 专项讲解课件 → 专项练习，循环推进直到没有错题与耗时问题。

课程大纲依据 **国家中小学智慧教育平台**（<https://basic.smartedu.cn/>）人教版（2024）七年级上、下册，共 **12 章 / 114 个知识点**；
讲解与题目融合 **《探究应用新思维·七年级数学》**（黄东坡）的探究与应用方法，并保留该书 **277 页原页浏览**用于溯源核对。

---

## 快速开始

PC / 网页端：

```bash
cd app
node scripts/sync-data.mjs      # 把 ../data 的内容同步到 app/public/data
npm install                     # 首次运行
npm run dev                     # 打开 http://127.0.0.1:5273
```

生产构建：

```bash
cd app && npm run build && npm run preview
```

微信小程序端：

```bash
node tools/sync-miniprogram-data.mjs    # 生成小程序可直接 require 的内容数据
```

然后用微信开发者工具导入 `miniprogram/` 目录，无需 npm install 与构建。
详见 [`miniprogram/README.md`](miniprogram/README.md)。

---

## 功能一览

| 模块 | 路径 | 说明 |
| --- | --- | --- |
| 课程中心 | `/curriculum` | 按 七上/七下 → 章 → 节 → 知识点 浏览，每个知识点配套课件 |
| 课件讲解 | `/lesson/:pointId` | 概念 → 例题（先做后看）→ 方法提炼 → 易错提醒 → 《探究应用新思维》拓展 → 随堂检测 |
| 章节考评 | `/exams`、`/exam/:chapterId` | 每章 22 题（选择 8 / 填空 5 / 计算 5 / 应用 4），约 1 小时 |
| 答题与计时 | `/run/:roundId` | 逐题计时，实时显示本题用时与预计用时；提交即上传成功 |
| 考评报告 | `/report/:roundId` | 逐题耗时对比、耗时标记、批改、错因分析、步骤分自查 |
| 专项讲解 | `/remedial/:roundId` | 自动生成的专项讲解课件：薄弱知识点精讲 + 逐题错因剖析 + 变式跟进 |
| 专项练习 | 由报告页生成 | 变式题自动组卷，再次批改分析，形成循环 |
| 探究新思维 | `/book` | 原书 38 个讲次的 OCR 文本与原页图像浏览 |
| 学习报告 | `/progress` | 长期薄弱知识点、考评历史、数据导出/导入 |

---

## 关键规则

**计时口径**（`src/lib/timing.ts`）

- 每题的**开始时间** = 上一题的**结束时间**；第一题从点击「开始答题」算起
- 选择题**结束时间** = 选定选项并提交该题答案的时刻（另记录「首次选中用时」）
- 填空题 / 计算题 / 应用题**结束时间** = 提交答案并上传成功的时刻
- 因此 `第 n 题耗时 = 提交(n) − 提交(n−1)`，各题首尾相接

**耗时标记**（`src/lib/grading.ts`）

```
实际耗时 − 预计耗时 > 60 000 ms  →  标记为「耗时标记题」
```

**自适应循环**（`src/lib/adaptive.ts`）

```
考评 → 批改 + 耗时对比
   ├─ 无错题且无超时 → 标记「已掌握」，结束
   └─ 有错题/超时   → 专项讲解课件 → 专项练习（变式题自动组卷）→ 再次批改 → 回到判断
```

---

## 目录结构

```
.
├─ data/
│  ├─ curriculum.json          # 人教版（2024）七上/七下 12 章 114 个知识点
│  ├─ lessons/<chapterId>.json # 每章的知识点课件
│  ├─ exams/<chapterId>.json   # 每章的考评卷（含解析、错因、变式）
│  ├─ ocr/book/                # 277 页 OCR 文本
│  └─ book/                    # index.json + units/（讲次文本）+ pages_jpg/（原页图像）
├─ app/                        # Vite + React + TypeScript + Tailwind 前端（PC / 网页）
├─ miniprogram/                # 微信小程序端（原生，含内容分包）
├─ tools/
│  ├─ ocr.swift / ocr          # macOS Vision 逐页 OCR
│  ├─ render.swift / render    # PDF 逐页渲染为 PNG
│  ├─ compress_pages.py        # PNG → 网页可用 JPEG
│  ├─ build_book.py            # 按书中目录切分讲次
│  ├─ validate_content.py      # 内容规范校验
│  ├─ sync-miniprogram-data.mjs# data/ → 小程序内容模块
│  └─ test-miniprogram-*.js    # 小程序端逻辑与流程测试
└─ docs/
   ├─ DESIGN.md                # 系统设计文档
   └─ CONTENT_SCHEMA.md        # 课件 / 题库数据规范
```

---

## 双端说明

PC / 网页端与微信小程序端共用同一份 `data/` 内容，判分、计时、耗时标记与
自适应循环的规则完全一致（小程序端的 `miniprogram/lib/` 是同一套逻辑的移植，
有测试保证行为对齐）。

| 能力 | PC / 网页端 | 微信小程序端 |
| --- | --- | --- |
| 课件、考评、专项循环 | ✅ | ✅ |
| 用户区分 | 手机号登录 | 微信 openid（未接服务器时为本机 id） |
| 学习数据存储 | 浏览器 localStorage | 小程序本地存储，按用户分键 |
| 非客观题模型批改 | 本地 `/api/grade` 中间件 | 需 HTTPS 域名（`miniprogram/config.js`） |
| 教辅原页图像 | 同步到静态目录 | 需 HTTPS 域名（`miniprogram/config.js`） |

---

## 内容校验

```bash
python3 tools/validate_content.py
```

检查项：JSON 合法性、题量与题型分布、`totalEstimatedSeconds` 求和一致、知识点全覆盖、难度单调性、`rubric`/`variants` 完整性、错因标签规范性、是否误用 LaTeX 反斜杠。

---

## 内容再生成

`data/lessons/` 与 `data/exams/` 缺失的章节会显示「正在生成中」，应用仍可正常使用其余章节。补齐后重新执行：

```bash
cd app && node scripts/sync-data.mjs
```

即可在界面中看到新内容。

---

## 已知限制

1. 原书 PDF 为**纯扫描件**，内容依赖 macOS Vision OCR，数学公式识别存在误差；书内题均以 OCR 原文 + 书末《参考答案》交叉验证，并把依赖插图的条件改写为自足的文字题干。题库中的书内题请通过 `/book` 的原页图像做最终人工核对。
2. 答题界面为纯文本，不显示插图；统计与几何题目均以文字/表格完整给出数据。
3. 计算题与应用题的解题**过程**不做逐行自动判分，采用「最终答案自动判分 + 步骤要点自查给部分分」。
4. 学习数据存于浏览器 localStorage，清空浏览器数据会丢失，请用「学习报告 → 数据管理」导出备份。
