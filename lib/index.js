/** dsh-skinskin server entry — 前端文字皮肤定制
 *
 * 职责：
 * - 注册 skinskin 设置命名空间，持久化三类文字的样式配置
 *   （思考文字 / 执行命令文字 / 真实回复文字 × 颜色 / 字号 / 字体）
 * - 客户端读取设置后注入 CSS 到 DSH 前端
 *
 * 数据模型：
 *   reasoning: { enabled, color, size, font }   — 思考文字
 *   command:   { enabled, color, size, font }   — 执行命令文字（工具调用/命令）
 *   reply:     { enabled, color, size, font }   — 真实回复文字（assistant 正文）
 */
import Schema from '@deepseek-ai/schemastery';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
export const name = 'dsh-skinskin';
export const inject = ['settings'];
// 单类文字样式：颜色（hex 或 CSS 颜色）/ 字号（px 数字）/ 字体（CSS font-family 或系统字体名）
const TextStyle = Schema.object({
    enabled: Schema.boolean().default(false),
    color: Schema.string().default(''),
    size: Schema.number().default(0),
    font: Schema.string().default(''),
});
// 插件配置：三类文字各自独立样式
export const SkinConfig = Schema.object({
    reasoning: TextStyle,
    command: TextStyle,
    reply: TextStyle,
});
const DEFAULT_CONFIG = {
    reasoning: { enabled: false, color: '', size: 0, font: '' },
    command: { enabled: false, color: '', size: 0, font: '' },
    reply: { enabled: false, color: '', size: 0, font: '' },
};
export function apply(ctx) {
    // 注册设置命名空间（客户端设置面板 + 服务端落盘 settings.yaml）
    ctx.settings?.register(settingsNamespace('skinskin'), SkinConfig, { base: DEFAULT_CONFIG });
    console.log('[dsh-skinskin] 已注册设置命名空间 skinskin');
}
//# sourceMappingURL=index.js.map