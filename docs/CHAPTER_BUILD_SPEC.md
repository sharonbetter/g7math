# 章节建设规格书（MANDATORY）

> 任何新章节（七下/八年级/…）交付前必须逐条满足本规格。
> 交付前运行 `python3 tools/check-chapter-complete.py <chapterId>` 全绿才可交付。
> 最后更新：2026-11-03

---

## 一、知识课件（动画播放器）

| 项 | 要求 | 验证 |
|---|---|---|
| 动画课件 HTML | 每个知识点一个 `.html`，`app/public/demo/{pointId}.html` | 文件存在 |
| 场景数 | ≥5（概念≥1 + 例题×2 + 方法脑图 + 易错卡） | `check-animated-lessons.py` |
| 概念场景 | 手工设计 SVG 动画（非纯文字卡） | 人工抽查 |
| 方法提炼 | SVG 脑图（中心 + ≥4 分支） | 检测器 C04~C06 |
| 探究场景 | 每章 ≥1 个（追加到核心知识点课件末尾） | 人工确认 |
| 配音 | 全场景 MiniMax TTS（`gen-demo-audio.mjs`） | 检测器 C02 |
| 检测通过 | `check-animated-lessons.py <pid>` 全 PASS | 自动 |

## 二、考评题库

| 项 | 要求 | 验证 |
|---|---|---|
| 常规题 | 每章 ≥20 题（choice/fill/calc/applied） | 题数统计 |
| **能力题** | 每章 ≥3 道（`errorTags` 含"能力题"） | `gen-ability-questions.mjs` |
| 能力题类型 | 覆盖 ≥3 种（新定义/规律/框图/多结论/分类讨论…十大题型） | errorTags 检查 |
| **LaTeX 格式** | 题干/解答中分数用 `\frac{}{}`、乘方用 `^`、科学记数法用 `\times` | `check-chapter-complete.py` |
| 题面图形 | 涉及数轴/坐标/几何的题配 `@@fig` 图 | 人工抽查 |

## 三、思路引导（三件套）

| 项 | 要求 | 验证 |
|---|---|---|
| guidance 字段 | 每题（主卷 + 变式）都有，非空 | 覆盖率 100% |
| 风格 | 首句定方向 → 分步为什么 → 收尾通法（用户审定样例风格） | 人工抽查 |
| **思想方法标注** | guidance 末尾含"核心思想是「××」"或 `thinkingMethod` 字段 | `annotate-methods.py` |
| 思路引导展示 | 前端 GuidedSolution 正确渲染（结构化步骤 + 通法收束） | 人工确认 |

## 四、错题讲解闭环

| 项 | 要求 | 验证 |
|---|---|---|
| 文字引导 | 报告页错题卡显示 🧭 思路引导 | 已实现，无需改动 |
| 讲解视频 | 「生成讲解」按钮可用（含讲解词 + TTS + 播放器） | 已实现 |
| 专项练习 | 每道错题 1 道，静态优先、枯竭调模型 | 已实现 |
| 动态出题 | `/api/gen-variant` 可用，GLM 生成 + 审查 | 已实现 |

## 五、数据与同步

| 项 | 要求 | 验证 |
|---|---|---|
| data/lessons | 课件数据 JSON（slides 结构完整） | 文件存在 |
| data/exams | 考评 JSON（questions + variants + guidance） | 文件存在 |
| sync-data | `node scripts/sync-data.mjs` 成功，前端可访问 | 命令执行 |
| manifest | demo/manifest.json 含所有 pointId | `check-animated-lessons.py` |

## 六、禁止事项

- ❌ 不得引入超纲术语（韦达定理/因式分解/勾股/三角函数/二次函数等）
- ❌ 不得出现没有 guidance 的考评题（前端会回退模板版但视为未完成）
- ❌ 不得跳过检测器直接交付
- ❌ 课件中不得使用未测试的自定义 CSS/JS（用 animated_common.py 模板）

---

## 交付流程

```bash
# 1. 建课件数据 + 动画 HTML + 配音
# 2. 建考评题（常规 + 能力题 + LaTeX 格式）
# 3. 生成思路引导（gen-guidance.mjs）
# 4. 标注思想方法（annotate-methods.py）
# 5. 追加探究场景（append-explore.py 或手工）
# 6. 终检
python3 tools/check-animated-lessons.py --chapter <chId>
python3 tools/check-chapter-complete.py <chId>
# 7. 全绿 → cd app && node scripts/sync-data.mjs → 交付
```
