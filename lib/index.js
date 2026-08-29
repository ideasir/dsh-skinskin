/** dsh-skinskin server entry — 前端文字皮肤定制
 *
 * 职责：
 * - 注册 skinskin 设置命名空间，持久化文字样式配置
 * - 分两类设置：
 *   ① 回复信息（reply）：智能体真正回复用户的内容
 *   ② 内部信息（internal）：思考过程、调用工具、执行命令等非最终回复内容（统一设置）
 * - 每个样式表单：颜色 / 透明度 / 字号 / 字体 / 文字效果（粗体/斜体/下划线）
 * - 留空 = 使用 DSH 默认样式
 */
import Schema from '@deepseek-ai/schemastery';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
export const name = 'dsh-skinskin';
export const inject = ['settings'];
// 单类文字样式：颜色 / 透明度(0-1) / 字号(px) / 字体 / 文字效果 / 行距
const TextStyle = Schema.object({
    color: Schema.string().default(''), // CSS 颜色；空 = DSH 默认
    opacity: Schema.number().min(0).max(1).default(1), // 透明度 0-1；1 = 不透明
    size: Schema.number().min(0).max(40).default(0), // 字号 px；0 = DSH 默认
    lineHeight: Schema.number().min(0).max(3).default(0), // 行距倍率（如 1.5）；0 = DSH 默认
    font: Schema.string().default(''), // 字体；空 = DSH 默认
    effect: Schema.string().default(''), // 文字效果：'bold'|'italic'|'underline' 等；空 = 默认
});
// 插件配置：总开关 + 两类样式
export const SkinConfig = Schema.object({
    enabled: Schema.boolean().default(true),
    reply: TextStyle, // ① 回复信息（智能体真正回复用户的内容）
    internal: TextStyle, // ② 内部信息（思考/工具/命令等统一设置）
});
const DEFAULT_CONFIG = {
    enabled: true,
    reply: { color: '', opacity: 1, size: 0, lineHeight: 0, font: '', effect: '' },
    internal: { color: '', opacity: 1, size: 0, lineHeight: 0, font: '', effect: '' },
};
export function apply(ctx) {
    // 注册设置命名空间（客户端设置面板 + 服务端落盘 settings.yaml）
    ctx.settings?.register(settingsNamespace('skinskin'), SkinConfig, { base: DEFAULT_CONFIG });
    console.log('[dsh-skinskin] 已注册设置命名空间 skinskin');
}
//# sourceMappingURL=index.js.map