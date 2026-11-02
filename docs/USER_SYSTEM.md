# 用户系统（注册 / 登录 / 充值）

2026-10 起，系统从「本机学习工具」升级为**正式对外运营的账号制产品**。本文记录方案决策与实现进度。

## 决策记录

| 决策点 | 结论 |
| --- | --- |
| 使用范围 | 正式对外运营（需考虑合规、备案、防刷、客服） |
| 商业模式 | 会员订阅：月/季/年卡解锁全部功能 |
| 收款通道 | 微信支付商户号直连（有个体户/企业资质，需备案域名 + HTTPS） |
| 优先端 | 网页端优先（小程序后续接入同一后端） |
| 免费/会员边界 | 内容全免费浏览；AI 功能（语音讲解、模型批改、错因诊断、变式生成）每天 3 次免费，会员不限 |
| 账号方式 | 手机号 + 短信验证码注册 + 密码登录；密码 scrypt 哈希存储 |

⚠️ **合规提示**：面向义务教育阶段学生的学科类产品受「双减」政策监管，以个体户/企业普通资质运营存在政策风险。上线前建议评估产品定位（「学习工具/教辅配套」而非「培训」）并咨询专业意见。

## 架构

```
浏览器 ──HTTPS──▶ Caddy（自动证书，静态托管 app 构建产物 + 反代 /api）
                    └─▶ Node 服务（Hono + better-sqlite3，端口 8787）
                          ├─ /api/auth/*   注册 / 登录 / 短信验证码 / 找回密码 / 登出
                          ├─ /api/me       当前用户（含会员信息）
                          ├─ /api/data     学习数据云端同步（blob，最后写入胜出）
                          └─（后续）/api/membership / /api/pay / /api/admin / AI 接口迁入
```

- 单域名单源部署，会话用 httpOnly cookie，无跨域问题
- SQLite（WAL）承载几千用户量级；表结构不绑定 SQLite 特性，量大可迁 Postgres
- 开发时：`server`（8787）+ `app` dev server（5273，`/api/auth|me|data|health` 由 vite 代理转发）
- **离线回退**：后端不可达时（本地没起 server / 断网），应用沿用 localStorage 会话与本机数据，功能不中断。后端在线时以服务端会话为准（401 即未登录）

## 里程碑进度

- [x] **M1 后端骨架 + 账号体系**（2026-10-29 完成）
  - `server/`：注册（短信验证码）/ 密码登录 / 找回密码 / 登出 / 会话
  - 密码 scrypt（N=16384）哈希；会话 HMAC-SHA256 令牌（30 天），改密码后全部旧令牌失效
  - 限流与防刷：验证码 60s/条、5 条/天/手机号、10 条/天/IP；登录连续错 5 次锁 10 分钟；登录/注册/重置按 IP 限速
  - 前端登录页（登录 / 注册 / 找回密码三个 tab），`App.tsx` 增加 ready 门控
  - 首次登录自动把本机学习数据上传绑定账号；云端有数据则拉回（换设备同步）
  - 旧 e2e 测试统一走 `tools/lib/e2e-auth.mjs`（后端在线走真实登录，离线回退注入）
- [ ] **M2 学习数据持续同步**：变更防抖上行 + 多端冲突提示（当前为登录时一次性同步）
- [ ] **M3 会员 + 微信支付**：SKU 配置、下单、Native 扫码 / JSAPI、回调验签入账（幂等）、15 分钟关单
- [ ] **M4 会员权益门控**：AI 功能每日免费 3 次；`grade-api.ts` 的 LLM 接口迁入 server（Key 只留服务端）
- [ ] **M5 管理后台**：用户列表/封禁、手动开通会员（补偿）、订单与退款
- [ ] **M6 部署与加固**：域名 + ICP 备案、HTTPS（Caddy）、systemd、数据库备份脚本

## 数据模型（`server/src/db.ts`，PRAGMA user_version 迁移）

| 表 | 用途 |
| --- | --- |
| `users` | phone 唯一、password_hash、role（user/admin）、status、**membership_expires_at**、password_changed_at（令牌版本） |
| `sms_codes` | 验证码哈希（HMAC）、用途、过期、used；按天清理 |
| `user_data` | 每用户学习数据 blob + updated_at（最后写入胜出） |

会员 = `membership_expires_at` 一个时间戳，续费取 `max(现在, 当前到期) + SKU 时长`，账目以订单流水为准（M3 建 `orders` 表）。

## 运行

```bash
# 后端（首次先 cp .env.example .env；不配置短信=开发模式，验证码直接返回 devCode）
cd server && npm install && npm run dev        # http://127.0.0.1:8787

# 前端（已有 /api 代理到 8787）
cd app && npm run dev                          # http://127.0.0.1:5273
```

管理员账号（M5 管理后台上线前的临时办法）：

```bash
cd server && npm run create-admin -- <手机号> [密码(至少8位，省略则自动生成)] [姓名]
# 例：npm run create-admin -- 13900000001 '' 测试管理员
```

对已存在账号执行会重置密码并提升为管理员（该账号旧登录态全部失效）。

## 测试

- 后端冒烟：注册 / 登录 / 限流 / 数据同步 409 冲突 / 登出全链路（curl 验证过）
- 端到端：`node tools/e2e-auth.mjs`（注册→登录态保持→登出→密码登录→错误密码拒绝）
- 其余 e2e（gems / pet-profile / lesson-battle 等）已接入 `e2eLogin`，后端在线/离线均可跑
- 已知过期：`tools/test-calc-dungeon.mjs` 期望的 `#/calc?chapter=` 深链在当前 UI 已不存在（历史遗留，与用户系统无关）

## 待办（外部依赖，建议尽早启动）

1. 域名 + 服务器（ICP 备案 2~4 周，微信支付回调要求备案域名）
2. 微信支付商户号申请（需绑定的已认证公众号/小程序 AppID）
3. 短信服务开通（腾讯云/阿里云，企业签名审核 1~3 天；`server/src/routes/auth.ts` 的 `sendSms` 留好了接入点）
