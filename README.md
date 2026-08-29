# Skin Skin

> 当前版本 `0829-0.1.0-rc.2`，适配 DSH `v0.1.1-rc.2`（开发者预览版）。
> 给 DeepSeek Harness 前端换肤——修改对话记录里文字的**颜色 / 透明度 / 字号 / 行距 / 字体 / 文字效果**，分"回复信息"和"内部信息"两大类。

## 功能

分**两大类**独立设置，互不干扰：

**💬 ① 回复信息** —— 智能体**真正回复用户的内容**（assistant 正文）
**🧠 ② 内部信息** —— 思考过程、调用工具、执行命令、读写文件等**非最终回复内容**（统一设置）

每个类别可设置：

- 🎨 **颜色**：色盘取色 + 自定义输入（hex / rgb）
- 🌫️ **透明度**：滑块（0-100%）
- 🔠 **字号**：数字 + 上下箭头步进（允许归零 = 用 DSH 默认）
- 📏 **行距**：数字 + 步进，控制多行记录（Tool call / Think）之间的垂直间距
- ✒️ **字体**：预制下拉（系统默认 / PingFang SC / 微软雅黑 / 等宽等）
- ✨ **文字效果**：粗体 / 斜体 / 下划线 / 组合

**留空 = 使用 DSH 当前默认样式**，改完**即时生效**，不用刷新。

## 怎么用

1. 安装插件后，DSH **侧边栏设置按钮旁**会出现一个**调节图标**按钮（📊）
2. 点击图标 → 右侧滑出**样式设置面板**（不遮背景，对话保持可见，边调边看）
3. 面板分两组（回复信息 / 内部信息），各自设置样式
4. 也可以进 **设置 → 插件配置 → Skin Skin** 卡片打开面板
5. 改完关闭面板，对话文字立即应用

## 生效规则

- ① 回复信息只作用于**真正回复的正文**（不影响思考/工具）
- ② 内部信息统一作用于**思考 + 工具 + 命令 + 文件操作**等所有非回复内容
- 全部留空 = 纯 DSH 默认外观

## 部署

```bash
git clone https://github.com/ideasir/dsh-skinskin.git
cd dsh-skinskin
# 构建服务端 + 客户端（需先装依赖，复用 dsh-makemake 的 node_modules 或 npm install）
npm run build
# 部署到 DSH profile
cp -r lib cordis.patch.yml package.json /root/.dsh/profiles/web/node_modules/dsh-skinskin/
# 在 profile package.json 的 dependencies + dsh.profile.bundles 里加 dsh-skinskin
# 重启 DSH
systemctl restart dsh
```

## 原理（简要）

- 配置存在 DSH 设置里（`skinskin` 命名空间，settings.yaml）
- 插件把配置转成 **CSS 注入**前端（`<style data-plugin="dsh-skinskin">`）
- 选择器基于 DSH 界面的 **`data-chat-flow-kind`** 属性（稳定锚点）+ 实测 DOM 类后缀（`QWLzlG`/`_markdown`/`lXshSW`），不依赖会变的 hash 类名
- 所有样式带 **`!important`** 确保覆盖 DSH 内置样式
- 行距用 `margin-bottom` 控制（flex 子项的 `gap` 无效，这是踩坑总结）

## 开发

详见 [`DEVELOPMENT.md`](./DEVELOPMENT.md)。

## 版本

当前版本：`0829-0.1.0-rc.2`