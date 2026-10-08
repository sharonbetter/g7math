# 微信小程序端

原生小程序实现，与 `app/`（PC/H5 端）共用同一份内容数据。

## 打开方式

1. 生成内容数据（首次或内容更新后执行一次）：

   ```bash
   node tools/sync-miniprogram-data.mjs
   ```

2. 用微信开发者工具「导入项目」，目录选 `miniprogram/`。
   `project.config.json` 里的 `appid` 目前是 `touristappid`（游客模式），
   有自己的小程序 AppID 后替换即可。

不需要 `npm install`，也不需要构建步骤。

## 目录结构

```
miniprogram/
├── app.js / app.json / app.wxss     主包骨架与全局样式
├── config.js                        后端地址与页图地址（见下）
├── sitemap.json
├── data/curriculum.js               课程大纲（主包，由脚本生成）
├── lib/                             与 H5 端行为一致的逻辑层
│   ├── answers.js                   答案归一化与等价判定
│   ├── grading.js                   判分、错因、耗时标记、汇总
│   ├── timing.js                    逐题计时
│   ├── adaptive.js                  错因分析与专项练习组卷
│   ├── auth.js                      登录与会话（openid / 本机 id）
│   ├── store.js                     按用户隔离的学习数据存储
│   ├── data.js                      大纲访问
│   └── modelGrade.js                非客观题模型批改
├── pages/                           主包页面
│   ├── login/                       登录
│   ├── home/                        首页
│   └── progress/                    学习报告
└── pkgContent/                      内容分包（1.8 MB）
    ├── content.js                   课件/考评/教辅数据访问
    ├── data/                        由脚本生成的内容数据
    └── pages/
        ├── curriculum/              课程中心
        ├── chapter/                 章节知识点
        ├── lesson/                  知识点课件
        ├── book/                    探究新思维
        ├── exams/                   章节考评列表
        ├── examIntro/               考评说明
        ├── run/                     作答（计时、跳题、拍照）
        ├── report/                  考评报告
        └── remedial/                专项讲解
```

分包是因为小程序「主包 / 单个分包」各不能超过 2 MB：主包 0.12 MB，内容分包 1.84 MB。
主包不能 `require` 分包文件，因此课件、考评卷都在分包内，主包只放大纲。

## 与 H5 端的差异

| 项 | H5 端 | 小程序端 |
|---|---|---|
| 存储 | `localStorage` | `wx.setStorageSync`，按用户 id 分键 |
| 用户标识 | 手机号 | 微信 openid（未接服务器时为本机 id） |
| 页图 | `fetch` 静态文件 | 需要 HTTPS 域名，见 `config.bookPageBase` |
| 模型批改 | `/api/grade`（Vite 中间件） | 需要 HTTPS 域名，见 `config.apiBase` |
| 公式渲染 | KaTeX | 纯文本（内容本就用 Unicode 数学符号） |

## 需要配置服务器才能启用的功能

`config.js` 里两项都留空时，小程序仍可完整使用：看课件、做题、计时、本地判分、
错因分析、专项练习循环。以下两项在填上 HTTPS 域名后才会启用：

```js
apiBase: 'https://你的域名',        // 模型批改 + openid 登录
bookPageBase: 'https://你的域名/book-pages',  // 教辅扫描页图
```

### openid 登录

真正拿到 openid 必须在服务器上调 `jscode2session`（需要 AppID 和 secret，
不能放在小程序里）。服务器只需提供：

```
POST {apiBase}/login   { code }  ->  { openid }
```

`wx.login()` 的 code 由小程序端获取并发送。没配 `apiBase` 时，
`lib/auth.js` 会退回一个本机生成的稳定 id，功能不受影响，只是换设备不通用。

### 模型批改

服务器需要提供与 H5 端相同的接口：

```
POST {apiBase}/grade
{
  stem, standardAnswer, standardSolution, rubric,
  studentAnswer, studentWork, images: ['data:image/jpeg;base64,...']
}  ->  { correct, unreadable, reason }
```

有手写照片时服务端应改用视觉模型，并以照片为准；照片看不清时返回
`unreadable: true`，小程序端会把这题标为「手写待确认」，不记错题。

批改接口不可用时，`run` 页会自动退回本地文字比对，保证考评能正常完成。

还需要在微信公众平台把域名加入
「开发管理 → 开发设置 → 服务器域名」的 request 合法域名。

## 验证

仓库根目录执行：

```bash
node tools/test-miniprogram-lib.js        # 判分/计时/自适应逻辑（44 项）
node tools/test-miniprogram-pages.js      # 页面模块加载与内容数据（33 项）
node tools/test-miniprogram-lifecycle.js  # 各页 onLoad/onShow 数据（36 项）
node tools/test-miniprogram-flow.js       # 22 题作答到交卷全流程（42 项）
```

这些脚本用 stub 的 `wx` / `Page` 在 Node 里直接跑，覆盖模块路径、数据访问、
逐题作答、照片待确认、交卷汇总与专项练习生成。界面渲染仍需在微信开发者工具中确认。

## 已实现的交互

- 题号可点击跳题，离开某题时该题计时暂停、返回后继续
- 应用题按 (1)(2)(3) 拆成多个输入框，分别填写
- 计算题、应用题支持拍照或从相册上传手写过程（最多 3 张，压缩后存本地）
- 交卷后报告页逐题展示你的答案、正确答案、完整解析与错因
- 手写照片题在报告页对照解析确认；确认前不计错题、也不算掌握
- 专项讲解课件与专项练习变式，循环到无错题、无超时
