# dsh-skinskin 开发文档

> **UI 规范：** 图标（Lucide 24×24 stroke-2）、主题（CSS 变量）、卡片结构（dsh-mm-*）统一遵循
> `/vol1/1000/DeepSeek/DSH-UI-SPEC.md` —— 所有 ideasir 插件必须遵守。

## 1. 项目结构

```text
src/index.ts               # 服务端：注册 skinskin 设置命名空间（schemastery Schema）
src/client/index.tsx       # 客户端：设置面板 UI + CSS 注入
lib/index.js               # 服务端构建产物
lib/client.js              # 客户端 bundle 构建产物（tsdown，CJS + ModuleLoader）
cordis.patch.yml           # DSH bundle 注册 patch
package.json               # npm 与 DSH bundle 元数据
tsdown.config.ts           # 客户端 bundle 配置
README.md                  # 项目介绍
DEVELOPMENT.md             # 本文档
CHANGES.md                 # 详细变更记录
```

## 2. 数据模型

配置存在 DSH 设置命名空间 `skinskin`（settings.yaml），**两类**设置：

```ts
interface TextStyle {
  color: string        // CSS 颜色；空 = DSH 默认
  opacity: number      // 透明度 0-1；1 = 不透明
  size: number         // 字号 px；0 = DSH 默认
  lineHeight: number   // 行距倍率（0-3）；0 = DSH 默认
  font: string         // 字体名；空 = DSH 默认
  effect: string       // 文字效果：'bold'|'italic'|'underline'|'bold,italic' 等；空 = 默认
}
interface SkinSettings {
  enabled: boolean     // 总开关
  reply: TextStyle     // ① 回复信息（智能体真正回复用户的内容）
  internal: TextStyle  // ② 内部信息（思考/工具/命令/文件等统一设置）
}
```

## 3. CSS 注入原理（关键）

DSH 前端用 CSS modules，hash 类名每次构建都会变，**不能直接依赖**。插件用两个稳定锚点：

### 3.1 `data-chat-flow-kind` 属性（外层节点稳定锚点）

对话流的每个条目（flow item）带 `data-chat-flow-kind` 属性。**实测取值**（2026-08-30）：

| kind 值 | 含义 |
|---------|------|
| `assistant-step` | 智能体一个回复步骤（内含 **正文 markdown** + **Think 块**） |
| `reasoning` | 思考过程（独立 kind 时） |
| `command` | 命令执行（permission 等） |
| `tool-call` | 工具调用（Bash / Read / Grep 等） |
| `tool-result` | 工具结果 |
| `context` | 上下文注入 |
| `user` / `turn-tail` / `turn-error` | 用户消息 / 回合尾 / 错误 |

### 3.2 实测 DOM 类后缀（内层文本容器锚点）

| 内容 | 类名特征 |
|------|---------|
| 回复正文 | `assistant-step` 内 `[class*="_markdown"]` |
| Think 思考块 | `assistant-step` 内 `[class*="QWLzlG"]`（ReasoningRow） |
| 工具/命令卡片 | `tool-call`/`command` 内 `[class*="_title"]`、`[class*="_summary"]` |
| 多行记录列表 | `[class*="lXshSW_list"]` / `[class*="lXshSW_item"]`（TodoPanel） |

### 3.3 当前选择器

```ts
// ① 回复：assistant-step 内的 markdown 正文（不含 Think 块）
reply: `[data-chat-flow-kind="assistant-step"] [class*="_markdown"]`
// ② 内部：Think(assistant-step 内 QWLzlG) + reasoning/command/tool-call/tool-result/context + TodoPanel 列表
internal: `[data-chat-flow-kind="assistant-step"] [class*="QWLzlG"], [data-chat-flow-kind="reasoning"],
           [data-chat-flow-kind="command"], [data-chat-flow-kind="tool-call"], [data-chat-flow-kind="tool-result"],
           [data-chat-flow-kind="context"], [class*="lXshSW_list"], [class*="lXshSW_item"]`
```

### 3.4 样式生成

- 每个设置项生成 3 条规则：**主规则**（整行节点）+ **子元素强制**（`*` 后代）+ **SVG 图标缩放**（`svg` width/height 按字号×0.8）
- **全部带 `!important`**（覆盖 DSH 内置样式，注入顺序不可控）
- **逗号选择器坑**：`A, B, C *` 只有 `C` 被加 `*` —— 用 `each()` 函数逐项展开成 `A *, B *, C *`
- **行距用 `margin-bottom`**（不是 `gap`）：flow item 是 flex 子项，`gap` 对子项无效，只有容器设置才生效；`margin-bottom` 才能拉开条目间距

## 4. 构建

```bash
# 服务端（tsc）
node node_modules/.bin/tsc --noEmitOnError false --outDir lib --target ES2022 --module ESNext --moduleResolution bundler --declaration false --esModuleInterop true --skipLibCheck true
# 客户端（tsdown）
node node_modules/.bin/tsdown
```

依赖：复用 dsh-makemake 的 node_modules（软链），@deepseek-ai 包同源。

## 5. 部署

1. profile package.json 的 `dependencies` 加 `"dsh-skinskin": "file:/vol1/1000/DeepSeek/dsh-skinskin"`
2. `dsh.profile.bundles` 加 `"dsh-skinskin"`
3. `cp -r lib cordis.patch.yml package.json /root/.dsh/profiles/web/node_modules/dsh-skinskin/`
4. `systemctl restart dsh`

## 6. 踩过的坑（按时间序）

1. **schemastery 没有 `.additionalProperties()`**：那是 zod API，直接去掉。
2. **@deepseek-ai 客户端包**（dsh-client-ui-slots/primitives）不在 DSH 全局 node_modules，在插件仓库里；软链 **dsh-makemake 的 node_modules**（包含全部客户端包且同源）。
3. **settingsScope 异步就绪**：`getSnapshot()` 页面加载时 `status=loading` → `value=undefined`。必须"立即读 + `subscribe` 订阅 + 500ms 重试（20次）"才能自动注入已保存样式（否则页面刷新后样式丢失）。
4. **Think 的 kind 是 assistant-step**：跟回复正文同一个 kind！必须用 `[class*="QWLzlG"]`（ReasoningRow 类）区分思考块，不能靠 kind 单独定位。否则思考被算进"回复信息"。
5. **回复正文只匹配 `_markdown`**：`assistant-step` 是整行节点，回复正文是其中的 `[class*="_markdown"]` 子元素；如果选择器作用到整个 assistant-step，会把 Think 块也一起改。
6. **CSS 逗号坑**：`[a], [b] *` 只有 `[b]` 的后代被匹配。多选择器必须逐项展开加后缀。
7. **`gap` 对 flex 子项无效**：flow item（Tool call/Think 条目）是 flex 列的子项，条间距要用 `margin-bottom`；`gap` 只有写在容器上才生效。这是行距功能三轮才修对的核心坑。
8. **字号步进 `Math.max(1,...)` 卡死**：最小锁 1 就无法回到默认（0=默认）。改成 `Math.max(0,...)`，size=0 时 CSS 不输出 font-size（用 DSH 默认），输入框显示默认字号。
9. **`!important` 覆盖**：DSH 内置 hash 类名特异性高，注入 CSS 必须带 `!important` 才能生效。

## 7. 验证

改完用无头 Chromium（Playwright）打开 DSH 实测：
- 样式自动注入：`<style data-plugin="dsh-skinskin">` 存在且内容正确
- 面板开合、字号步进、行距步进
- 对话流真实 DOM 的 computed style（fontSize / lineHeight / marginBottom / color）确认生效
- 选择器命中：`querySelector('[data-chat-flow-kind="tool-call"]')` 等