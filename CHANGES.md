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

## 2026-08-29 — 样式设置全面改版（主任审查 V2）

### 需求变更
1. 去掉弹窗里每个分类的「启用」开关；只保留卡片层总开关
2. 分两大类：① 智能体回复用户 ② 智能体内部（思考/工具/命令/文件），内部可统一也可分开
3. 字号：数字 + 上下箭头步进
4. 颜色：色盘 + 自定义输入
5. 新增透明度滑块
6. 字体：预制下拉（系统默认/PingFang SC/等宽等）
7. 新增文字效果（粗体/斜体/下划线）
8. 留空 = DSH 默认；初始显示准确默认值（深色主题实测：回复 #f9fafb 16px，思考/工具 #adb2b8 14px）

### 数据结构（服务端 schema）
- enabled（总开关）
- reply：智能体回复用户
- internal：智能体内部（统一设置）
- thinking：内部-思考（分开设置）
- tool：内部-工具/命令/文件（分开设置）
- 每个 TextStyle：color / opacity / size / font / effect

### 优先级
- internal 设置了 → 覆盖 thinking/tool 的单独设置
- 全部留空 → 纯 DSH 默认

### 说明
- 默认色值按深色主题实测（用户当前 dark 主题）
- 弹窗支持重置全部、Esc/点遮罩关闭

## 2026-08-29 — 分类重构（主任审查 V3：粗中有细 + 单独优先）

### 需求变化
1. 分类命名清晰：
   - ① 智能体回复用户（assistant 正文）—— 单独一个框
   - ② 其他显示内容（大框）—— 思考过程、调用工具、执行命令、读写文件等非最终回复内容
2. ② 大框内：总设置（全部统一）+ 单独设置（思考 / 工具命令文件 分别）
3. **生效规则（最重要修正）**：
   - 只设总 → 按总
   - 总+单独 → 按单独（单独 > 总，之前做反了）
4. UI：② 大框用主色边框突出，总设置块带「总」徽章，单独设置块带「单」徽章（虚线框）

### 实现
- styleRule()：单条样式生成（空样式返回 null）
- buildCss()：thinking/tool 各自 hasAnyStyle 判断，单独非空用单独，否则回退 internal 总设置
- renderForm()：统一表单（5列），internal 用独立默认值
- renderModal()：① 独立框 + ② 大框（总设置块 + 单独设置块嵌套）

### 验证
- 构建通过、部署、DSH 重启正常
- 产物含「其他显示内容/总设置/单独设置/智能体回复用户」结构

## 2026-08-30 — 功能实现 + 真实 DOM 选择器修正 + 端到端验证

### 功能实现
- buildCss 按「单独 > 总」规则生成样式（thinking/tool 单独非空用单独，否则回退 internal）
- styleRule 全部属性加 `!important`，确保覆盖 DSH 内置样式（注入顺序不可控）
- 总开关（enabled）关闭时清空全部样式，恢复 DSH 默认

### 选择器修正（Playwright 实测真实 DOM，之前源码猜测不准）
| 类型 | 之前（错） | 实测（对） |
|------|-----------|-----------|
| 回复正文 | text/assistant | **assistant-step** 内 `[class*="_markdown"]` |
| 工具调用 | tool-result | **tool-call** 内 `[class*="_summary"]` |
| 命令 | command 内 `_body` | command 内 `_summary`（摘要） |
- 思考文字保持 reasoning → `[class*="_thinkBody"]`

### 端到端验证（无头 Chromium 实测）
- 回复正文颜色：`rgb(249,250,251)` → 注入后 `rgb(245,158,11)`（橙色生效）✓
- 回复字号：20px 生效 ✓
- 工具调用 `_summary`：变绿 `rgb(34,197,94)` + 10px ✓
- 命令 `_summary`：变蓝 `rgb(96,165,250)` ✓
- 说明：`!important` 覆盖 DSH 默认样式成功，CSS 注入真实生效

## 2026-08-30 — 侧边栏按钮 + 右侧面板 + 默认值显示 + 步进

### 侧边栏
- 加 SKIN 调节按钮（替换 passpass 小锁，自动移除锁按钮）
- 点击打开右侧设置面板，对话背景完全可见

### 弹窗 → 右侧面板
- 改为右侧滑入 fixed 面板（不遮背景，对话保持可见可调）
- 右上角关闭按钮 ✕，Esc 关闭
- 无全屏遮罩、无模糊

### 默认值显示
- 字号输入框直接显示默认值（回复 16，内部/思考/工具 14）
- 颜色 placeholder 显示默认色值（#f9fafb / #adb2b8）
- 步进基于有效字号（未自定义 = 默认值作基准，从 16+1=17 开始，不是 0+1=1）

## 2026-08-30 — 三个根因修复（整行生效 + 样式自动注入 + CSS 逗号坑）

### 修复列表
1. **样式按行生效**：选择器改为作用到整个 flow item 节点（`[data-chat-flow-kind="tool-call"]`），加 `*` 后代选择器强制所有子元素字号 + SVG 图标缩放
2. **CSS 逗号坑**：`A, B *` 只有 `B` 被加 `*`——用 `each()` 函数逐项展开 `A *, B *`。实测：tool-call 标题/摘要 10px ✓，context 10px ✓，图标 8px ✓
3. **样式自动注入（NO STYLE 根因）**：scope.getSnapshot() 在页面加载时 status=loading → value=undefined。改为"立即读 + 订阅变化 + 500ms 重试(最多 20 次)"，确保页面加载后自动应用已保存样式
4. **openPanel 读取也做 status 检查**：snap?.status === 'ready' 时才读 value，否则用空对象

### 验证
- 注入的 CSS 不再是 NO STYLE ✅
- tool-call: titleFs=10px summaryFs=10px svgW=8 ✅
- command: titleFs=10px summaryFs=10px svgW=8 ✅
- context: titleFs=10px svgW=8 ✅

## 2026-08-30 — 简化：两类设置（回复信息 + 内部信息统一）

### 结构简化
- 去掉 thinking/tool 单独设置，去掉"总设置+单独设置"嵌套
- 改为两类：① 回复信息（reply）② 内部信息（internal）—— 思考/工具/命令统一设置
- 服务端 schema 从 4 个字段精简为 2 个（reply + internal）
- 面板 UI 从 4 组精简为 2 组

### 功能验证
- 回复颜色 #22c55e 生效 ✅
- 内部字号 12px 所有节点（reasoning/command/tool-call/context）整行+图标生效 ✅
- CSS 逗号坑已确认修好 ✅
- 样式自动注入 ✅

## 2026-08-30 — 行距设置 + Think 归入内部信息（选择器修正）

### 需求
1. 内部信息（思考/工具/命令）这类多行记录要能单独设行距
2. Think（思考过程）实测 kind 是 assistant-step（跟回复正文同一个），但类名 QWLzlG_*（ReasoningRow）—— 必须归入"内部信息"而不是"回复信息"

### 实现
1. TextStyle 加 lineHeight 字段（0-3 倍率，0=默认）；服务端 schema + settings.yaml 同步
2. styleRule 输出 line-height；hasAnyStyle 判断含 lineHeight
3. renderForm 加"行距"控件（±0.1 步进）
4. 选择器修正：
   - reply → `assistant-step` 内 `[class*="_markdown"]`（真正的回复正文，不含 Think）
   - internal → `assistant-step` 内 `[class*="QWLzlG"]`（Think）+ reasoning/command/tool-call/tool-result/context

### 验证
- schema: reply/internal 都含 lineHeight ✅
- 面板有行距控件（reply + internal）✅
- 内部设字号12+行距1.8 → CSS 输出 `font-size:12px;line-height:1.8` ✅
- Think 选择器命中（QWLzlG）✅
