# Skin Skin

> 当前版本 `0829-0.1.0-rc.2`，适配 DSH `v0.1.1-rc.2`（开发者预览版）。给 DeepSeek Harness 前端换肤——修改对话记录里的文字颜色、字号和字体，思考、命令、回复可以分别设置。

## 功能

- **文字颜色**：设置色值（支持取色器选色和手动输入 hex/rgb）
- **文字大小**：设置字号（px）
- **文字字体**：设置字体（如 PingFang SC、JetBrains Mono）
- **分类设置**：对话记录界面里的文字分三种类型，各自独立配置：
  - 💭 **思考文字** —— 模型思考过程（reasoning）
  - ⚙️ **执行命令** —— 工具调用、命令执行（command / tool）
  - 💬 **真实回复** —— assistant 的正文回复（text）
- **即时生效**：改完立刻应用，不用刷新页面

## 怎么用

1. 安装插件后，打开 DSH 的 **设置 → 插件配置**
2. 找到 **Skin Skin 皮肤定制** 卡片，点开
3. 每个分类（思考/命令/回复）都有：
   - **启用** 开关（打开后该分类的样式才生效）
   - **颜色** 取色器 + 输入框
   - **字号** 数字输入
   - **字体** 文字输入
4. 留空的选项 = 用 DSH 默认样式

## 部署

从 GitHub 克隆后构建：

```bash
git clone https://github.com/ideasir/dsh-skinskin.git
cd dsh-skinskin
# 构建服务端 + 客户端
npm run build
# 部署到 DSH profile
cp -r . /root/.dsh/profiles/web/node_modules/dsh-skinskin/
# 在 profile package.json 的 dependencies + bundles 里加 dsh-skinskin
# 重启 DSH
systemctl restart dsh
```

## 原理（简要）

- 配置存在 DSH 设置里（`skinskin` 命名空间，settings.yaml）
- 插件把配置转成 CSS 注入前端
- 选择器基于 DSH 界面的 `data-chat-flow-kind` 属性（`reasoning` / `command` / `text`），这个属性不会随 DSH 升级变，比 hash 类名稳定

## 版本

当前版本：`0829-0.1.0-rc.2`