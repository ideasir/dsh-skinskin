# dsh-skinskin 开发文档

> **UI 规范：** 图标（Lucide 24×24 stroke-2）、主题（CSS 变量）、卡片结构（dsh-mm-*）统一遵循
> `/vol1/1000/DeepSeek/DSH-UI-SPEC.md` —— 所有 ideasir 插件必须遵守，禁止硬编码颜色/非标准图标。

## 1. 项目结构

```text
src/index.ts               # 服务端：注册 skinskin 设置命名空间
src/client/index.tsx       # 客户端：设置面板 UI + CSS 注入
lib/index.js               # 服务端构建产物
lib/client.js              # 客户端 bundle 构建产物
cordis.patch.yml           # DSH bundle 注册 patch
package.json               # npm 与 DSH bundle 元数据
tsdown.config.ts           # 客户端 bundle 配置
CHANGES.md                 # 详细变更记录
```

## 2. 数据模型

配置存在 DSH 设置命名空间 `skinskin`（settings.yaml），三类文字各自独立：

```ts
interface TextStyle {
  enabled: boolean  // 是否启用
  color: string     // 颜色（hex / rgb / 任意 CSS 颜色）
  size: number      // 字号 px（0 = 默认）
  font: string      // 字体名（空 = 默认）
}
interface SkinSettings {
  reasoning: TextStyle  // 思考文字
  command: TextStyle    // 执行命令文字
  reply: TextStyle      // 真实回复文字
}
```

## 3. CSS 注入原理（关键）

DSH 前端用 CSS modules，hash 类名每次构建都会变（如 `QWLzlG_thinkBody`），**不能直接依赖**。

但 DSH 的对话流节点带 **`data-chat-flow-kind`** 属性，值稳定：

| kind 值 | 含义 | 对应设置项 |
|---------|------|-----------|
| `reasoning` | 思考过程 | thinking |
| `command` / `tool-call` / `tool-result` | 命令/工具调用 | command |
| `text` / `assistant` | 真实回复正文 | reply |

选择器（src/client/index.tsx 的 `SELECTORS`）：

```css
/* 思考 */
[data-chat-flow-kind="reasoning"] [class*="_thinkBody"],
[data-chat-flow-kind="reasoning"] [class*="_summary"]
/* 命令 */
[data-chat-flow-kind="command"] [class*="_body"],
[data-chat-flow-kind="tool-call"] [class*="_body"],
[data-chat-flow-kind="tool-result"] [class*="_body"]
/* 回复 */
[data-chat-flow-kind="text"] [class*="_content"],
[data-chat-flow-kind="assistant"] [class*="_content"]
```

`[class*="_xxx"]` 匹配 hash 类名的**稳定后缀**，规避前缀变化。

**⚠️ DSH 升级后验证**：如果 DSH 改了 flow-kind 的取值或 DOM 结构，用浏览器 DevTools 检查实际 DOM，更新 `SELECTORS`。

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
3. `cp -r /vol1/1000/DeepSeek/dsh-skinskin /root/.dsh/profiles/web/node_modules/dsh-skinskin`
4. `systemctl restart dsh`

## 6. 踩过的坑

- **schemastery 没有 `.additionalProperties()`**：`Schema.object({...}).additionalProperties(false)` 不存在（那是 zod API），直接去掉即可。
  ```
  error TS2339: Property 'additionalProperties' does not exist on type 'Schema<...>'
  ```
- **@deepseek-ai 客户端包**（dsh-client-ui-slots/primitives）不在 DSH 全局 node_modules，在插件仓库的 node_modules 里。软链到 **dsh-makemake 的 node_modules**（包含全部客户端包且同源），不要软链 DSH 全局（缺客户端包）。
- **`data-chat-flow-kind` 是稳定锚点**：宁可多写几个 fallback 选择器（`[class*="_body"]` 等），也不要只依赖单一 hash 类名。