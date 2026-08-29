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

## 2026-08-29 — UI 规范化（主任审查修正）

### 问题
卡片又高又空：表单直接内联展开在卡片里，未按统一规范（其他插件是紧凑卡片头 + 大按钮 + 弹窗）。

### 修正
1. 卡片头与其他 ideasir 插件统一：dsh-mm-card 结构 + 图标 + 版本徽章 + ideasir/卸载/已最新 + 箭头
2. 卡片展开内容：**总开关**（passpass 同款绿色开关）+ **样式设置大按钮**（主题色）
3. 点击「样式设置」→ **弹窗**（DOM overlay，Esc/点遮罩关闭）内做三类文字 × 颜色/字号/字体 设置
4. 服务端加总开关字段 `enabled`
5. 样式即时生效（CSS 注入基于 data-chat-flow-kind 稳定属性）
