/** dsh-skinskin server entry — 前端文字皮肤定制
 *
 * 职责：
 * - 注册 skinskin 设置命名空间，持久化文字样式配置
 * - 分两大类：① 智能体回复用户（reply）② 智能体内部（internal/thinking/tool）
 * - 每个样式表单：颜色 / 透明度 / 字号 / 字体 / 文字效果（粗体/斜体/下划线）
 * - 留空 = 使用 DSH 默认样式
 *
 * 数据模型：
 *   reply      —— 智能体回复用户的正文
 *   internal   —— 智能体内部（思考+工具统一设置）
 *   thinking   —— 内部：思考文字（分开设置）
 *   tool       —— 内部：工具调用/命令/文件提示（分开设置）
 *   每个都是 TextStyle（无 enabled 开关，留空即默认）
 */
import Schema from '@deepseek-ai/schemastery';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
export const name = 'dsh-skinskin';
export const inject = ['settings'];
// 单类文字样式：颜色 / 透明度(0-1) / 字号(px) / 字体 / 文字效果
const TextStyle = Schema.object({
    color: Schema.string().default(''), // CSS 颜色；空 = DSH 默认
    opacity: Schema.number().min(0).max(1).default(1), // 透明度 0-1；1 = 不透明
    size: Schema.number().min(0).max(40).default(0), // 字号 px；0 = DSH 默认
    font: Schema.string().default(''), // 字体；空 = DSH 默认
    effect: Schema.string().default(''), // 文字效果：'bold'|'italic'|'underline'|'bold,italic' 等；空 = 默认
});
// 插件配置：总开关 + 两大类样式
export const SkinConfig = Schema.object({
    enabled: Schema.boolean().default(true),
    reply: TextStyle, // ① 智能体回复用户
    internal: TextStyle, // ② 智能体内部（统一设置）
    thinking: TextStyle, // ②-1 思考（分开设置）
    tool: TextStyle, // ②-2 工具/命令/文件（分开设置）
});
const DEFAULT_CONFIG = {
    enabled: true,
    reply: { color: '', opacity: 1, size: 0, font: '', effect: '' },
    internal: { color: '', opacity: 1, size: 0, font: '', effect: '' },
    thinking: { color: '', opacity: 1, size: 0, font: '', effect: '' },
    tool: { color: '', opacity: 1, size: 0, font: '', effect: '' },
};
export function apply(ctx) {
    // 注册设置命名空间（客户端设置面板 + 服务端落盘 settings.yaml）
    ctx.settings?.register(settingsNamespace('skinskin'), SkinConfig, { base: DEFAULT_CONFIG });
    console.log('[dsh-skinskin] 已注册设置命名空间 skinskin');
}
//# sourceMappingURL=index.js.map