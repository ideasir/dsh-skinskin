# CHANGES

## 2026-08-29 — 初始版本 0829-0.1.0-rc.2

### 功能
- 前端文字皮肤定制：修改 DSH 对话记录界面的文字颜色、字号、字体
- 分类设置：思考文字（reasoning）/ 执行命令（command/tool）/ 真实回复（text）三类独立配置
- 即时生效：设置变化直接注入 CSS，无需刷新

### 实现
- 服务端 src/index.ts：注册 `skinskin` 设置命名空间（schemastery Schema）
- 客户端 src/client/index.tsx：
  - settings.plugin.item 卡片（dsh-mm-* 风格，keyed slot key=skinskin）
  - 三类文字 × 颜色/字号/字体 表单
  - CSS 注入：基于 `data-chat-flow-kind` 稳定属性 + `[class*="_xxx"]` 后缀匹配，规避 hash 类名变化
- 依赖：复用 dsh-makemake 的 node_modules（软链），@deepseek-ai 同源

### 踩坑
- schemastery 无 `.additionalProperties()`（zod API），去掉即可
- @deepseek-ai 客户端包（slots/primitives）在插件仓库 node_modules，不在 DSH 全局；软链 dsh-makemake 的 node_modules
- `data-chat-flow-kind` 是稳定锚点，用 `[class*="_body"]` 等后缀匹配防 hash 变化
