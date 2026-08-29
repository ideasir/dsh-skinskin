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
