/** dsh-skinskin — 前端文字皮肤定制
 *
 * 分两大类设置：
 *   ① 智能体回复用户（reply）—— assistant 正文
 *   ② 智能体内部（internal / thinking / tool）—— 思考、调用工具、读写文件等提示
 *      - internal：内部统一设置（一个样式套用到全部内部文字）
 *      - thinking：内部-思考（分开设置时用）
 *      - tool：内部-工具/命令/文件（分开设置时用）
 *
 * 每个样式表单：颜色（色盘+自定义）/ 透明度（滑块）/ 字号（数字+上下箭头）/ 字体（预制下拉）/ 文字效果
 * 留空 = 使用 DSH 当前默认样式。总开关在卡片层（关 = 全部用默认）。
 */

import * as React from 'react'
import { useEffect, useState } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { IconChevronDownOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'

const SKIN_NAMESPACE = 'skinskin'
const REPO = 'https://github.com/ideasir/dsh-skinskin'
const VERSION = '0829-0.1.0-rc.2'

// ── 类型 ──────────────────────────────────────────────
interface TextStyle {
  color: string        // CSS 颜色；空 = DSH 默认
  opacity: number      // 透明度 0-1；1 = 不透明
  size: number         // 字号 px；0 = DSH 默认
  font: string         // 字体；空 = DSH 默认
  effect: string       // 文字效果：'' | 'bold' | 'italic' | 'underline' | 'bold,italic' ...
}

interface SkinSettings {
  reply: TextStyle      // ① 智能体回复用户
  internal: TextStyle   // ② 智能体内部（统一）
  thinking: TextStyle   // ②-1 思考（分开）
  tool: TextStyle       // ②-2 工具/命令/文件（分开）
}

interface SettingsFace {
  scope: SettingsScope<SkinSettings>
}

type CardProps = PropsRuntime<'settings.plugin.item'> & InjectFace<SettingsFace>

const DEFAULT_TEXT: TextStyle = { color: '', opacity: 1, size: 0, font: '', effect: '' }

// ── DSH 默认值（深色主题实测，用于面板初始显示；留空 = 跟随主题变量）──
const DEFAULTS: Record<string, { color: string; size: number; font: string }> = {
  reply: { color: '#f9fafb', size: 16, font: '系统默认' },
  thinking: { color: '#adb2b8', size: 14, font: '系统默认' },
  tool: { color: '#adb2b8', size: 14, font: '等宽字体' },
}

// 分类的默认字号（步进基准）
function defaultSizeFor(kind: string): number {
  if (kind === 'internal') return DEFAULTS.thinking.size
  return (DEFAULTS[kind] || DEFAULTS.thinking).size
}

// ── 预制字体 ──────────────────────────────────────────
const FONT_PRESETS = [
  '系统默认',
  'PingFang SC',
  'Microsoft YaHei',
  'JetBrains Mono',
  'Consolas',
  'Menlo',
  'monospace',
  'serif',
  'sans-serif',
]

// ── 文字效果选项 ──────────────────────────────────────
const EFFECT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: '无' },
  { value: 'bold', label: '粗体' },
  { value: 'italic', label: '斜体' },
  { value: 'underline', label: '下划线' },
  { value: 'bold,italic', label: '粗体+斜体' },
  { value: 'bold,underline', label: '粗体+下划线' },
]

// ── CSS 选择器（基于 data-chat-flow-kind 稳定属性，作用于整行节点）──
// 2026-08-30 主任反馈修正：样式要"按行生效"，作用到整个 flow item 节点，
// 让该行内所有文字（标题/摘要）+ 图标统一缩放，而不是只改行内某段文字
const SELECTORS: Record<keyof SkinSettings, string> = {
  // 回复：assistant-step 整个节点（正文 markdown）
  reply: `[data-chat-flow-kind="assistant-step"]`,
  // 内部总设置：所有非最终回复的节点
  internal: `[data-chat-flow-kind="reasoning"], [data-chat-flow-kind="command"], [data-chat-flow-kind="tool-call"], [data-chat-flow-kind="tool-result"], [data-chat-flow-kind="context"]`,
  // 思考：reasoning 节点
  thinking: `[data-chat-flow-kind="reasoning"]`,
  // 工具/命令：command / tool-call / tool-result / context 节点
  tool: `[data-chat-flow-kind="command"], [data-chat-flow-kind="tool-call"], [data-chat-flow-kind="tool-result"], [data-chat-flow-kind="context"]`,
}

// ── 样式注入 ──────────────────────────────────────────
let styleEl: HTMLStyleElement | null = null

// 生成单条样式规则（空样式返回 null）
function styleRule(selector: string, s: TextStyle): string | null {
  if (!s) return null
  const parts: string[] = []
  // 用 !important 确保覆盖 DSH 内置样式（我们的 <style> 注入顺序不可控）
  if (s.color) parts.push(`color:${s.color} !important`)
  if (s.opacity !== undefined && s.opacity !== 1) parts.push(`opacity:${s.opacity} !important`)
  if (s.size > 0) parts.push(`font-size:${s.size}px !important`)
  if (s.font && s.font.trim() && s.font !== '系统默认') parts.push(`font-family:"${s.font.trim()}" !important`)
  if (s.effect) {
    const fx = s.effect.split(',')
    if (fx.includes('bold')) parts.push('font-weight:700 !important')
    if (fx.includes('italic')) parts.push('font-style:italic !important')
    if (fx.includes('underline')) parts.push('text-decoration:underline !important')
  }
  return parts.length ? `${selector} { ${parts.join(';')} }` : null
}

function buildCss(settings: SkinSettings): string {
  const rules: string[] = []
  // 把逗号分隔的多选择器列表逐个加后缀（A, B, C * 只匹配 C 的后代——CSS 坑）
  const each = (selector: string, suffix: string): string =>
    selector.split(',').map(s => s.trim() + suffix).join(', ')
  // 对每个 kind 生成：主规则（整行节点）+ 子元素强制 + SVG 图标缩放
  const emit = (selector: string, style: TextStyle | undefined) => {
    if (!style) return
    const main = styleRule(selector, style)
    if (!main) return
    rules.push(main)
    // 整行生效：所有后代文本也应用字号（子元素自带 font-size 会覆盖继承值）
    if (style.size > 0) {
      rules.push(`${each(selector, ' *')} { font-size:${style.size}px !important }`)
      // SVG 图标随字号缩放
      rules.push(`${each(selector, ' svg')} { width:${Math.round(style.size * 0.8)}px; height:${Math.round(style.size * 0.8)}px !important }`)
    }
    // 透明度整行生效
    if (style.opacity !== undefined && style.opacity !== 1) {
      rules.push(`${each(selector, ' *')} { opacity:${style.opacity} !important }`)
    }
  }

  // ① 回复
  emit(SELECTORS.reply, settings?.reply)

  // ② 内部：单独优先，单独没设回退总设置
  const thinkingStyle = hasAnyStyle(settings?.thinking) ? settings.thinking : settings?.internal
  const toolStyle = hasAnyStyle(settings?.tool) ? settings.tool : settings?.internal
  emit(SELECTORS.thinking, thinkingStyle)
  emit(SELECTORS.tool, toolStyle)

  return rules.join('\n')
}

// 判断某个 TextStyle 是否设置了任何项（非全空）
function hasAnyStyle(s: TextStyle | undefined): boolean {
  if (!s) return false
  return !!(s.color || s.size > 0 || (s.font && s.font.trim() && s.font !== '系统默认') || s.effect || (s.opacity !== undefined && s.opacity !== 1))
}

function applySkin(settings: SkinSettings) {
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.dataset.plugin = 'dsh-skinskin'
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = buildCss(settings || {} as SkinSettings)
}

// ── 共享 CSS（与其他 ideasir 插件卡片统一）──
const CARD_CSS = `
.dsh-mm-card{list-style:none;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-3,#fff);transition:border-color .16s,background .16s;overflow:hidden}
.dsh-mm-card:hover{border-color:var(--dsw-alias-label-dimmed,#9ca3af)}
.dsh-mm-card-open{background:var(--dsw-alias-bg-layer-2,#fff);border-color:var(--dsw-alias-label-dimmed,#9ca3af)}
.dsh-mm-head{width:100%;appearance:none;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:12px}
.dsh-mm-head:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#4c78ff);outline-offset:-2px}
.dsh-mm-head-text{display:flex;flex-direction:column;gap:2px;min-width:0}
.dsh-mm-name-row{display:flex;align-items:center;gap:6px}
.dsh-mm-title{font-size:14px;line-height:20px;font-weight:600;color:var(--dsw-alias-label-primary)}
.dsh-mm-version-badge{font-size:11px;line-height:16px;font-weight:500;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap}
.dsh-mm-desc{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary)}
.dsh-mm-btns{display:flex;align-items:center;gap:6px;flex-shrink:0}
.dsh-mm-btn-link{font-size:12px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-secondary);text-decoration:none;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:2px 10px;white-space:nowrap;transition:color .12s,border-color .12s,background .12s}
.dsh-mm-btn-uninstall{font-size:12px;line-height:18px;font-weight:500;color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent);border-radius:999px;padding:2px 10px;cursor:pointer;white-space:nowrap;transition:background .12s,border-color .12s}
.dsh-mm-btn-update{font-size:12px;line-height:18px;font-weight:500;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:2px 10px;cursor:pointer;white-space:nowrap;transition:background .12s,border-color .12s}
.dsh-mm-chevron{color:var(--dsw-alias-label-tertiary);transition:transform .14s ease-in-out;display:inline-flex}
.dsh-mm-body{border-top:1px solid var(--dsw-alias-border-l2);padding:14px 14px 16px;background:var(--dsw-alias-bg-module-platform)}
.dsh-mm-master{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.dsh-mm-master-label{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}
.dsh-mm-master-note{font-size:11px;color:var(--dsw-alias-label-tertiary)}

/* 样式设置弹窗 */
/* 样式设置面板：右侧滑入，不遮背景，对话保持可见方便边调边看 */
.dsh-skinskin-panel{position:fixed;top:0;right:0;z-index:2147483000;width:min(620px,78vw);height:100vh;overflow:auto;background:var(--dsw-alias-bg-layer-2,#1b1d20);border-left:1px solid var(--dsw-alias-border-l1);padding:18px 20px;box-shadow:-4px 0 20px rgba(0,0,0,.3);animation:dsh-skinskin-slide .18s ease-out}
@keyframes dsh-skinskin-slide{from{transform:translateX(100%)}to{transform:none}}
.dsh-skinskin-panel h3{margin:0 0 4px;font-size:16px;font-weight:600;color:var(--dsw-alias-label-primary)}
.dsh-skinskin-panel .sub{margin:0 0 16px;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.dsh-skinskin-panel .close-btn{position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);cursor:pointer;display:grid;place-items:center;font-size:16px;transition:background .12s,border-color .12s}
.dsh-skinskin-panel .close-btn:hover{background:var(--dsw-alias-bg-hover);border-color:var(--dsw-alias-label-dimmed)}
.dsh-skinskin-group{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:12px;margin-bottom:12px}
.dsh-skinskin-group-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.dsh-skinskin-group-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);display:flex;align-items:center;gap:6px}
.dsh-skinskin-group-title .desc{font-size:11px;font-weight:400;color:var(--dsw-alias-label-tertiary)}
.dsh-skinskin-fields{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.dsh-skinskin-field label{display:block;font-size:11px;color:var(--dsw-alias-label-tertiary);margin-bottom:4px}
.dsh-skinskin-field input[type=text],.dsh-skinskin-field input[type=number],.dsh-skinskin-field select{width:100%;padding:5px 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px;box-sizing:border-box}
.dsh-skinskin-color-row{display:flex;align-items:center;gap:6px}
.dsh-skinskin-color-row input[type=color]{width:30px;height:30px;border:none;background:none;padding:0;cursor:pointer}
.dsh-skinskin-size-row{display:flex;align-items:center;gap:2px}
.dsh-skinskin-size-row input{flex:1;min-width:0;text-align:center}
.dsh-skinskin-size-row .step{width:26px;height:28px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:8px;cursor:pointer;font-size:14px;line-height:1;display:grid;place-items:center;transition:background .12s,border-color .12s}
.dsh-skinskin-size-row .step:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.dsh-skinskin-opacity-row{display:flex;align-items:center;gap:8px}
.dsh-skinskin-opacity-row input[type=range]{flex:1;min-width:0;accent-color:var(--dsw-alias-brand-primary,#4c78ff)}
.dsh-skinskin-opacity-row .val{font-size:11px;color:var(--dsw-alias-label-secondary);width:34px;text-align:right;font-family:ui-monospace,Menlo,monospace}
.dsh-skinskin-foot{display:flex;align-items:center;justify-content:space-between;margin-top:14px}
.dsh-skinskin-hint{font-size:11px;color:var(--dsw-alias-label-tertiary)}
.dsh-skinskin-reset{font-size:12px;color:var(--dsw-alias-label-secondary);background:none;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:5px 12px;cursor:pointer;transition:border-color .12s,color .12s}
.dsh-skinskin-reset:hover{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
`

// ── 全局状态（弹窗）──
let modalOverlay: HTMLElement | null = null
let modalSettings: SkinSettings = {
  reply: { ...DEFAULT_TEXT },
  internal: { ...DEFAULT_TEXT },
  thinking: { ...DEFAULT_TEXT },
  tool: { ...DEFAULT_TEXT },
}
let modalSave: ((s: SkinSettings) => void) | null = null
let modalClose: (() => void) | null = null

function closeModal() {
  document.querySelectorAll('.dsh-skinskin-overlay').forEach(el => el.remove())
  modalOverlay = null
  modalClose = null
}

// ── 卡片组件 ──────────────────────────────────────────
function SkinPluginCard(props: CardProps) {
  const [open, setOpen] = useState(false)
  const { scope } = props
  const [settings, setSettings] = useState<SkinSettings>({
    reply: { ...DEFAULT_TEXT },
    internal: { ...DEFAULT_TEXT },
    thinking: { ...DEFAULT_TEXT },
    tool: { ...DEFAULT_TEXT },
  })
  const [masterEnabled, setMasterEnabled] = useState(true)

  // 读取设置 + 应用
  useEffect(() => {
    const load = () => {
      try {
        const v = scope.getSnapshot()?.value
        if (v) {
          setMasterEnabled(v.enabled !== false)
          const merged: SkinSettings = {
            reply: { ...DEFAULT_TEXT, ...(v.reply || {}) },
            internal: { ...DEFAULT_TEXT, ...(v.internal || {}) },
            thinking: { ...DEFAULT_TEXT, ...(v.thinking || {}) },
            tool: { ...DEFAULT_TEXT, ...(v.tool || {}) },
          }
          setSettings(merged)
          applySkin(v.enabled === false ? { reply: { ...DEFAULT_TEXT }, internal: { ...DEFAULT_TEXT }, thinking: { ...DEFAULT_TEXT }, tool: { ...DEFAULT_TEXT } } : merged)
        }
      } catch { /* ignore */ }
    }
    load()
    const unsub = scope.subscribe?.(load)
    return () => { try { unsub?.() } catch { /* ignore */ } }
  }, [scope])

  // 更新设置（保存 + 应用）
  const save = (next: SkinSettings) => {
    setSettings(next)
    applySkin(next)
    try {
      void scope.set('reply' as never, next.reply as never)
      void scope.set('internal' as never, next.internal as never)
      void scope.set('thinking' as never, next.thinking as never)
      void scope.set('tool' as never, next.tool as never)
    } catch (e) { console.warn('[dsh-skinskin] 保存失败', e) }
  }

  // 总开关
  const toggleMaster = () => {
    const next = !masterEnabled
    setMasterEnabled(next)
    applySkin(next ? settings : { reply: { ...DEFAULT_TEXT }, internal: { ...DEFAULT_TEXT }, thinking: { ...DEFAULT_TEXT }, tool: { ...DEFAULT_TEXT } })
    try {
      void scope.set('enabled' as never, next as never)
    } catch (e) { console.warn('[dsh-skinskin] 保存失败', e) }
  }

  // 打开样式设置弹窗
  const openModal = () => {
    modalSettings = JSON.parse(JSON.stringify(settings))
    const overlay = document.createElement('div')
    overlay.className = 'dsh-skinskin-overlay'
    overlay.innerHTML = renderModal()
    document.body.appendChild(overlay)
    modalOverlay = overlay
    modalSave = save
    bindModalEvents(overlay)
  }

  return (
    <li className={`dsh-mm-card ${open ? 'dsh-mm-card-open' : ''}`}>
      <button className="dsh-mm-head" onClick={() => setOpen(v => !v)} tabIndex={-1}>
        <span className="dsh-mm-head-text">
          <div className="dsh-mm-name-row">
            <span className="dsh-mm-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span dangerouslySetInnerHTML={{ __html: SKIN_SVG }} />Skin Skin
            </span>
            <span className="dsh-mm-version-badge">{VERSION}</span>
          </div>
          <span className="dsh-mm-desc">修改对话记录的文字样式（颜色/透明度/字号/字体/效果），分「回复」和「内部」两大类</span>
        </span>
        <span className="dsh-mm-btns">
          <a className="dsh-mm-btn-link" href={REPO} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title="打开 GitHub 仓库">ideasir</a>
          <button className="dsh-mm-btn-uninstall" onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (confirm('确定卸载 Skin Skin 插件吗？\n\n将从 DSH 中移除插件本体和全部配置。')) { /* 卸载逻辑 */ } }} title="卸载插件">卸载</button>
          <button className="dsh-mm-btn-update" style={{ color: 'var(--dsw-alias-label-tertiary)' }} onClick={(e: React.MouseEvent) => { e.stopPropagation(); }} title="当前已是最新版本">已最新</button>
          <span className="dsh-mm-chevron"><IconChevronDownOutline14 /></span>
        </span>
      </button>

      {open && (
        <div className="dsh-mm-body">
          {/* 总开关 */}
          <div className="dsh-mm-master">
            <button type="button" role="switch" aria-checked={masterEnabled} onClick={toggleMaster}
              style={{
                flex: 'none', position: 'relative', width: 44, height: 24, borderRadius: 999,
                border: 'none', cursor: 'pointer', padding: 0,
                background: masterEnabled ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-border-l3)',
                transition: 'background .18s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: masterEnabled ? 'inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, transparent)' : 'none',
              } as any}>
              <span style={{
                position: 'absolute', top: 3, left: masterEnabled ? 44 - 18 - 3 : 3,
                width: 18, height: 18, borderRadius: 999, background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transition: 'left .2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              } as any} />
            </button>
            <div>
              <div className="dsh-mm-master-label">{masterEnabled ? 'Skin Skin 已开启' : 'Skin Skin 已关闭'}</div>
              <div className="dsh-mm-master-note">{masterEnabled ? '自定义文字样式已生效' : '关闭后使用 DSH 默认文字样式'}</div>
            </div>
          </div>

          {/* 样式设置大按钮 */}
          <button type="button" onClick={openModal}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
              background: 'var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary))',
              color: 'var(--dsw-alias-label-primary-inverted,#fff)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              transition: 'filter .12s',
            } as any}
            onMouseEnter={(e: any) => e.target.style.filter = 'brightness(1.1)'}
            onMouseLeave={(e: any) => e.target.style.filter = ''}>
            <span dangerouslySetInnerHTML={{ __html: PALETTE_SVG }} style={{ display: 'inline-flex' }} />
            样式设置
          </button>
        </div>
      )}
    </li>
  )
}

// ── 弹窗渲染（右侧面板，不遮背景）──
// 渲染单个样式表单（5 列：颜色/透明度/字号/字体/效果）
function renderForm(kind: string): string {
  const s = modalSettings[kind as keyof SkinSettings]
  const opts = kind === 'internal' ? { color: '#adb2b8', size: 14, font: '系统默认' } : DEFAULTS[kind]
  const def = opts || { color: '#adb2b8', size: 14, font: '系统默认' }
  // 字号输入框直接显示当前有效字号（未自定义 = 默认字号），方便以默认值为基准步进
  const effectiveSize = s.size > 0 ? s.size : def.size
  const sizeVal = String(effectiveSize)
  const opacityPct = Math.round((s.opacity ?? 1) * 100)
  return `
    <div class="dsh-skinskin-fields">
      <div class="dsh-skinskin-field">
        <label>颜色</label>
        <div class="dsh-skinskin-color-row">
          <input type="color" data-field="color" data-kind="${kind}" value="${s.color || def.color}" />
          <input type="text" data-field="color-text" data-kind="${kind}" value="${escapeAttr(s.color)}" placeholder="默认 ${def.color}" />
        </div>
      </div>
      <div class="dsh-skinskin-field">
        <label>透明度</label>
        <div class="dsh-skinskin-opacity-row">
          <input type="range" data-field="opacity" data-kind="${kind}" min="0" max="100" value="${opacityPct}" />
          <span class="val" data-opacity-val="${kind}">${opacityPct}%</span>
        </div>
      </div>
      <div class="dsh-skinskin-field">
        <label>字号</label>
        <div class="dsh-skinskin-size-row">
          <button type="button" class="step" data-step="-1" data-field="size" data-kind="${kind}">−</button>
          <input type="number" data-field="size" data-kind="${kind}" value="${sizeVal}" placeholder="默认 ${def.size}" min="0" max="40" />
          <button type="button" class="step" data-step="1" data-field="size" data-kind="${kind}">+</button>
        </div>
      </div>
      <div class="dsh-skinskin-field">
        <label>字体</label>
        <select data-field="font" data-kind="${kind}">
          ${FONT_PRESETS.map(f => `<option value="${escapeAttr(f)}" ${(s.font || '') === f || (!s.font && f === '系统默认') ? 'selected' : ''}>${f === '系统默认' ? `默认（${def.font}）` : f}</option>`).join('')}
        </select>
      </div>
      <div class="dsh-skinskin-field">
        <label>文字效果</label>
        <select data-field="effect" data-kind="${kind}">
          ${EFFECT_OPTIONS.map(e => `<option value="${e.value}" ${s.effect === e.value ? 'selected' : ''}>${e.label}</option>`).join('')}
        </select>
      </div>
    </div>
  `
}

function renderModal(): string {
  return `
    <div class="dsh-skinskin-panel" role="dialog" aria-label="样式设置">
      <button type="button" class="close-btn" data-action="close" title="关闭">✕</button>
      <h3>🎨 Skin Skin 样式设置</h3>
      <p class="sub">设置文字样式，留空 = 使用 DSH 默认。修改即时生效。</p>

      <!-- ① 智能体回复用户 -->
      <div class="dsh-skinskin-group">
        <div class="dsh-skinskin-group-head">
          <span class="dsh-skinskin-group-title">💬 ① 智能体回复用户 <span class="desc">assistant 正文回复</span></span>
        </div>
        ${renderForm('reply')}
      </div>

      <!-- ② 其他显示内容（大框） -->
      <div class="dsh-skinskin-group" style="border:2px solid var(--dsw-alias-brand-primary,#4c78ff)">
        <div class="dsh-skinskin-group-head">
          <span class="dsh-skinskin-group-title">🧠 ② 其他显示内容 <span class="desc">思考过程、调用工具、执行命令、读写文件等非最终回复内容</span></span>
        </div>
        <p style="font-size:11px;color:var(--dsw-alias-label-tertiary);margin:0 0 10px">总设置：作用于全部非回复内容。单独设置权重 > 总设置（设了单独就以单独为准）。</p>

        <!-- 总设置 -->
        <div style="border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:10px;margin-bottom:12px;background:var(--dsw-alias-bg-base)">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:999px;background:var(--dsw-alias-brand-primary);color:#fff;font-size:11px;font-weight:700">总</span>
            总设置（思考、工具、命令、文件等全部统一）
          </div>
          ${renderForm('internal')}
        </div>

        <!-- 单独设置 -->
        <div style="border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;padding:10px;background:var(--dsw-alias-bg-base)">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:999px;background:var(--dsw-alias-label-tertiary);color:var(--dsw-alias-bg-base);font-size:11px;font-weight:700">单</span>
            单独设置（可分别设置，优先级高于总设置）
          </div>
          <div class="dsh-skinskin-group" style="margin-bottom:8px">
            <div class="dsh-skinskin-group-head">
              <span class="dsh-skinskin-group-title">💭 思考过程</span>
            </div>
            ${renderForm('thinking')}
          </div>
          <div class="dsh-skinskin-group">
            <div class="dsh-skinskin-group-head">
              <span class="dsh-skinskin-group-title">⚙️ 调用工具 / 执行命令 / 读写文件</span>
            </div>
            ${renderForm('tool')}
          </div>
        </div>
      </div>

      <div class="dsh-skinskin-foot">
        <span class="dsh-skinskin-hint">💡 修改即时生效。按 Esc 关闭。</span>
        <button type="button" data-action="reset" class="dsh-skinskin-reset">重置全部为默认</button>
        <button type="button" data-action="close" style="padding:8px 18px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);cursor:pointer;font-size:13px;font-weight:500">完成</button>
      </div>
    </div>
  `
}

function escapeAttr(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

// ── 右侧面板事件绑定 ──────────────────────────────────
function bindPanelEvents(panel: HTMLElement) {
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { panel.remove(); document.removeEventListener('keydown', onKey) } }
  document.addEventListener('keydown', onKey)

  panel.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.getAttribute('data-action') === 'close') { panel.remove(); document.removeEventListener('keydown', onKey) }
    if (t.getAttribute('data-action') === 'reset') {
      modalSettings = {
        reply: { ...DEFAULT_TEXT }, internal: { ...DEFAULT_TEXT }, thinking: { ...DEFAULT_TEXT }, tool: { ...DEFAULT_TEXT },
      }
      if (modalSave) modalSave(modalSettings)
      panel.innerHTML = renderModal()
      return
    }
    // 字号步进（基于有效字号：未自定义则用默认字号作基准）
    if (t.classList.contains('step')) {
      const kind = t.dataset.kind as keyof SkinSettings
      const step = Number(t.dataset.step) || 0
      const s = modalSettings[kind]
      // 有效字号 = 已设置值，否则用该分类的默认字号
      const defSize = defaultSizeFor(kind)
      const cur = s.size > 0 ? s.size : defSize
      const next = Math.max(1, Math.min(40, cur + step))
      s.size = next
      if (modalSave) modalSave(modalSettings)
      const input = panel.querySelector<HTMLInputElement>(`input[data-field="size"][data-kind="${kind}"]`)
      if (input) input.value = String(next)
      return
    }
  })

  // 输入变化
  panel.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement
    const kind = el.dataset.kind as keyof SkinSettings
    const field = el.dataset.field as string
    if (!kind || !field || !modalSettings[kind]) return
    const s = modalSettings[kind]
    if (field === 'color') {
      s.color = el.value
      const text = panel.querySelector<HTMLInputElement>(`input[data-field="color-text"][data-kind="${kind}"]`)
      if (text) text.value = el.value
    } else if (field === 'color-text') {
      s.color = el.value
      const picker = panel.querySelector<HTMLInputElement>(`input[data-field="color"][data-kind="${kind}"]`)
      if (picker && /^#[0-9a-fA-F]{6}$/.test(el.value)) picker.value = el.value
    } else if (field === 'size') {
      s.size = Number(el.value) || 0
    } else if (field === 'opacity') {
      s.opacity = Number(el.value) / 100
      const val = panel.querySelector<HTMLSpanElement>(`[data-opacity-val="${kind}"]`)
      if (val) val.textContent = el.value + '%'
    } else if (field === 'font') {
      s.font = el.value === '系统默认' ? '' : el.value
    } else if (field === 'effect') {
      s.effect = el.value
    }
    if (modalSave) modalSave(modalSettings)
  })
}

// ── 图标（Lucide）──
const SKIN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/><path d="M3.6 9h16.8"/><path d="M3.6 15h16.8"/><path d="M12 3a15.5 15.5 0 0 1 0 18"/><path d="M12 3a15.5 15.5 0 0 0 0 18"/></svg>'
const PALETTE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 22a10 10 0 1 1 10-10c0 2-1.5 3-3 3h-2.5a2.5 2.5 0 0 0-2 4c.5.8.2 3-2.5 3z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/></svg>'
// 调节图标 — 侧边栏按钮用
const ADJUST_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="18" cy="5" r="3"/><path d="M18 8v14"/><circle cx="6" cy="12" r="3"/><path d="M6 15v7"/><path d="M6 2v7"/><path d="M18 2v2"/><circle cx="18" cy="19" r="3"/><path d="M18 22v1"/><path d="M6 12H2"/><path d="M22 5h-1"/></svg>'

// ── 插件入口 ──────────────────────────────────────────
export const inject = ['slots', 'connection', 'settingsScope'] as const

export function apply(ctx: Context): void {
  const { api } = ctx.get('connection') as ConnectionHandle
  const scope = ctx.settingsScope.bind<SkinSettings>({ namespace: SKIN_NAMESPACE as never })

  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-skinskin-css'
  style.textContent = CARD_CSS
  document.head.appendChild(style)

  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
    name: 'settings.plugin.item',
    key: SKIN_NAMESPACE,
    id: SKIN_NAMESPACE,
    order: 95,
    inject: (): SettingsFace => ({ scope }),
  }, SkinPluginCard))

  // 侧边栏设置按钮（替换 passpass 小锁位置，点击打开右侧面板）
  ctx.effect(() => {
    const tryInject = () => {
      const settingsArea = document.querySelector<HTMLElement>('[class*="hHd-Xa_settingsArea"]')
      if (!settingsArea) return null

      // 移除 passpass 的小锁（主任要求：小锁去掉，换成 SKIN 调节按钮）
      document.querySelectorAll('.dsh-passpass-lock-btn').forEach(el => el.remove())

      // 已注入过就跳过
      if (settingsArea.querySelector('.dsh-skinskin-sidebar-btn')) return true

      // 让 settingsArea 变成横向 flex
      settingsArea.style.display = 'flex'
      settingsArea.style.alignItems = 'center'
      settingsArea.style.justifyContent = 'space-between'
      settingsArea.style.width = '100%'

      // 设置按钮宽度收缩
      const settingsBtn = settingsArea.querySelector('button')
      if (settingsBtn) {
        settingsBtn.style.flex = '1'
        settingsBtn.style.minWidth = '0'
      }

      // 背景透明右侧面板
      const openPanel = () => {
        // 移除旧面板
        document.querySelector('.dsh-skinskin-panel')?.remove()
        // 读取当前设置（可能还在 loading，用当前已应用的值或默认）
        const snap = scope.getSnapshot()
        const cur = snap?.status === 'ready' && snap.value ? snap.value : {}
        modalSettings = JSON.parse(JSON.stringify(cur))
        const panel = document.createElement('div')
        panel.className = 'dsh-skinskin-panel'
        panel.innerHTML = renderModal()
        document.body.appendChild(panel)
        modalSave = (s: SkinSettings) => {
          try {
            applySkin(s)
            void scope.set('reply' as never, s.reply as never)
            void scope.set('internal' as never, s.internal as never)
            void scope.set('thinking' as never, s.thinking as never)
            void scope.set('tool' as never, s.tool as never)
          } catch (e) { console.warn('[dsh-skinskin] 保存失败', e) }
        }
        bindPanelEvents(panel)
      }

      // 创建调节按钮
      const btn = document.createElement('button')
      btn.className = 'dsh-skinskin-sidebar-btn'
      btn.title = '样式设置'
      btn.innerHTML = ADJUST_SVG
      btn.addEventListener('click', (e) => { e.stopPropagation(); openPanel() })

      // 插入到 settingsArea 末尾
      settingsArea.appendChild(btn)
      return true
    }

    if (tryInject()) return
    const timer = setInterval(() => { if (tryInject()) clearInterval(timer) }, 500)
    return () => clearInterval(timer)
  }, 'dsh-skinskin: sidebar button')

  // 应用已有样式：settingsScope 可能还在 loading，需要 立即读 + 订阅 + 重试
  // （这是之前 NO STYLE 的根因：页面加载时 scope 未就绪，同步读返回 undefined）
  const applySaved = () => {
    try {
      const snap = scope.getSnapshot()
      if (snap?.status === 'ready' && snap.value) {
        applySkin(snap.value as SkinSettings)
        return true
      }
    } catch { /* ignore */ }
    return false
  }
  // 立即试一次
  applySaved()
  // 订阅变化（设置保存后自动应用）
  const unsubApply = scope.subscribe?.(applySaved)
  // 重试兜底（settingsScope 就绪有延迟）
  let retry = 0
  const retryTimer = setInterval(() => {
    retry++
    if (applySaved() || retry > 20) clearInterval(retryTimer)
  }, 500)

  // 清理
  const disposers: Array<() => void> = []
  if (unsubApply) disposers.push(unsubApply)
  disposers.push(() => clearInterval(retryTimer))
  const unload = () => disposers.forEach(d => { try { d() } catch { /* ignore */ } })
  // 插件卸载时清理
  try { ctx.on('dispose', unload) } catch { /* ignore */ }

  void api
}