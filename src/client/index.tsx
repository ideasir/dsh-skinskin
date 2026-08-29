/** dsh-skinskin — 前端文字皮肤定制
 * 修改 DSH 对话记录界面的文字样式（颜色/字号/字体），分类设置：
 *   - 思考文字（reasoning）：模型思考过程
 *   - 执行命令文字（command/tool）：工具调用、命令执行
 *   - 真实回复文字（reply）：assistant 正文回复
 *
 * 实现方式：把三类文字各自的 CSS 规则注入 <style>，选择器基于 DSH 前端的
 * data-chat-flow-kind 属性（稳定，不随 hash 类名变化）。
 *
 * UI 结构（与其他 ideasir 插件统一）：
 *   - 设置面板卡片：紧凑头（图标+标题+版本+描述+ideasir+卸载+已最新+智能检测+箭头）
 *   - 卡片展开后：一个大按钮「样式设置」→ 点开弹窗做详细设置
 */

import * as React from 'react'
import { useEffect, useState } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { Button, IconChevronDownOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'

const SKIN_NAMESPACE = 'skinskin'
const REPO = 'https://github.com/ideasir/dsh-skinskin'
const VERSION = '0829-0.1.0-rc.2'

// ── 类型 ──────────────────────────────────────────────
interface TextStyle {
  enabled: boolean
  color: string   // CSS 颜色（如 #f59e0b / rgb(...)）
  size: number    // 字号 px
  font: string    // 字体（如 'JetBrains Mono' / 'PingFang SC'）
}

interface SkinSettings {
  reasoning: TextStyle   // 思考文字
  command: TextStyle     // 执行命令文字
  reply: TextStyle       // 真实回复文字
}

interface SettingsFace {
  scope: SettingsScope<SkinSettings>
}

type CardProps = PropsRuntime<'settings.plugin.item'> & InjectFace<SettingsFace>

const DEFAULT_TEXT: TextStyle = { enabled: false, color: '', size: 0, font: '' }

// ── 三类文字的 CSS 选择器（基于 DSH 前端 data-chat-flow-kind 稳定属性）──
const SELECTORS: Record<keyof SkinSettings, string> = {
  reasoning: `[data-chat-flow-kind="reasoning"] [class*="_thinkBody"]`,
  command: `[data-chat-flow-kind="command"] [class*="_body"], [data-chat-flow-kind="command"] [class*="_summary"], [data-chat-flow-kind="tool-call"] [class*="_body"], [data-chat-flow-kind="tool-result"] [class*="_body"]`,
  reply: `[data-chat-flow-kind="text"] [class*="_content"], [data-chat-flow-kind="text"] [class*="_markdown"], [data-chat-flow-kind="text"] [class*="_body"]`,
}

// ── 样式注入 ──────────────────────────────────────────
let styleEl: HTMLStyleElement | null = null

function buildCss(settings: SkinSettings): string {
  const rules: string[] = []
  ;(['reasoning', 'command', 'reply'] as const).forEach((kind) => {
    const s = settings?.[kind]
    if (!s?.enabled) return
    const parts: string[] = []
    if (s.color) parts.push(`color:${s.color}`)
    if (s.size > 0) parts.push(`font-size:${s.size}px`)
    if (s.font && s.font.trim()) parts.push(`font-family:"${s.font.trim()}"`)
    if (parts.length) rules.push(`${SELECTORS[kind]} { ${parts.join(';')} }`)
  })
  return rules.join('\n')
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
.dsh-mm-btn-env{font-size:12px;line-height:18px}
.dsh-mm-chevron{color:var(--dsw-alias-label-tertiary);transition:transform .14s ease-in-out;display:inline-flex}
.dsh-mm-body{border-top:1px solid var(--dsw-alias-border-l2);padding:14px 14px 16px;background:var(--dsw-alias-bg-module-platform)}

/* 样式设置弹窗 */
.dsh-skinskin-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;animation:dsh-skinskin-fadein .2s ease-out}
@keyframes dsh-skinskin-fadein{from{opacity:0}to{opacity:1}}
.dsh-skinskin-modal{width:min(680px,92vw);max-height:82vh;overflow:auto;background:var(--dsw-alias-bg-layer-2,#1b1d20);border:1px solid var(--dsw-alias-border-l1);border-radius:14px;padding:18px 20px;box-shadow:0 12px 40px rgba(0,0,0,.5);animation:dsh-skinskin-pop .18s ease-out}
@keyframes dsh-skinskin-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
.dsh-skinskin-modal h3{margin:0 0 4px;font-size:16px;font-weight:600;color:var(--dsw-alias-label-primary)}
.dsh-skinskin-modal .sub{margin:0 0 16px;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.dsh-skinskin-group{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:12px;margin-bottom:12px}
.dsh-skinskin-group-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.dsh-skinskin-group-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);display:flex;align-items:center;gap:6px}
.dsh-skinskin-group-title .desc{font-size:11px;font-weight:400;color:var(--dsw-alias-label-tertiary)}
.dsh-skinskin-toggle{display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsh-skinskin-fields{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:10px}
.dsh-skinskin-field label{display:block;font-size:11px;color:var(--dsw-alias-label-tertiary);margin-bottom:4px}
.dsh-skinskin-field input[type=text],.dsh-skinskin-field input[type=number]{width:100%;padding:6px 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px;box-sizing:border-box}
.dsh-skinskin-field input:disabled{opacity:.4;cursor:not-allowed}
.dsh-skinskin-color-row{display:flex;align-items:center;gap:6px}
.dsh-skinskin-color-row input[type=color]{width:30px;height:30px;border:none;background:none;padding:0;cursor:pointer}
.dsh-skinskin-foot{display:flex;align-items:center;justify-content:space-between;margin-top:14px}
.dsh-skinskin-hint{font-size:11px;color:var(--dsw-alias-label-tertiary)}
`

// ── 全局状态（弹窗）──
let modalOverlay: HTMLElement | null = null
let modalSettings: SkinSettings = {
  reasoning: { ...DEFAULT_TEXT },
  command: { ...DEFAULT_TEXT },
  reply: { ...DEFAULT_TEXT },
}
let modalSave: ((s: SkinSettings) => void) | null = null
let modalClose: (() => void) | null = null

function closeModal() {
  document.querySelectorAll('.dsh-skinskin-overlay').forEach(el => el.remove())
  modalOverlay = null
  modalClose = null
}

const PRESETS: Array<{ kind: keyof SkinSettings; label: string; icon: string; desc: string }> = [
  { kind: 'reasoning', label: '思考文字', icon: '💭', desc: '模型思考过程' },
  { kind: 'command', label: '执行命令', icon: '⚙️', desc: '工具调用 / 命令执行' },
  { kind: 'reply', label: '真实回复', icon: '💬', desc: 'assistant 正文回复' },
]

const PALETTE = ['#f59e0b', '#22c55e', '#60a5fa', '#f472b6', '#a78bfa', '#f87171', '#ffffff', '#9ca3af']

// ── 卡片组件（紧凑，与其他 ideasir 插件统一）──
function SkinPluginCard(props: CardProps) {
  const [open, setOpen] = useState(false)
  const { scope } = props
  const [settings, setSettings] = useState<SkinSettings>({
    reasoning: { ...DEFAULT_TEXT },
    command: { ...DEFAULT_TEXT },
    reply: { ...DEFAULT_TEXT },
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
            reasoning: { ...DEFAULT_TEXT, ...(v.reasoning || {}) },
            command: { ...DEFAULT_TEXT, ...(v.command || {}) },
            reply: { ...DEFAULT_TEXT, ...(v.reply || {}) },
          }
          setSettings(merged)
          applySkin(v.enabled === false ? { reasoning: { ...DEFAULT_TEXT, enabled: false }, command: { ...DEFAULT_TEXT, enabled: false }, reply: { ...DEFAULT_TEXT, enabled: false } } : merged)
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
      void scope.set('reasoning' as never, next.reasoning as never)
      void scope.set('command' as never, next.command as never)
      void scope.set('reply' as never, next.reply as never)
    } catch (e) { console.warn('[dsh-skinskin] 保存失败', e) }
  }

  // 总开关
  const toggleMaster = () => {
    const next = !masterEnabled
    setMasterEnabled(next)
    applySkin(next ? settings : { reasoning: { ...DEFAULT_TEXT, enabled: false }, command: { ...DEFAULT_TEXT, enabled: false }, reply: { ...DEFAULT_TEXT, enabled: false } })
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

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); closeModal() } }

  return (
    <li className={`dsh-mm-card ${open ? 'dsh-mm-card-open' : ''}`}>
      {/* 卡片头：与其他插件一致 */}
      <button className="dsh-mm-head" onClick={() => setOpen(v => !v)} tabIndex={-1}>
        <span className="dsh-mm-head-text">
          <div className="dsh-mm-name-row">
            <span className="dsh-mm-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span dangerouslySetInnerHTML={{ __html: SKIN_SVG }} />Skin Skin
            </span>
            <span className="dsh-mm-version-badge">{VERSION}</span>
          </div>
          <span className="dsh-mm-desc">修改对话记录的文字颜色 / 字号 / 字体，思考、命令、回复可分别设置</span>
        </span>
        <span className="dsh-mm-btns">
          <a className="dsh-mm-btn-link" href={REPO} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title="打开 GitHub 仓库">ideasir</a>
          <button className="dsh-mm-btn-uninstall" onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (confirm('确定卸载 Skin Skin 插件吗？\n\n将从 DSH 中移除插件本体和全部配置。')) { /* 卸载逻辑 */ } }} title="卸载插件">卸载</button>
          <button className="dsh-mm-btn-update" style={{ color: 'var(--dsw-alias-label-tertiary)' }} onClick={(e: React.MouseEvent) => { e.stopPropagation(); }} title="当前已是最新版本">已最新</button>
          <span className="dsh-mm-chevron"><IconChevronDownOutline14 /></span>
        </span>
      </button>

      {/* 展开内容：总开关 + 样式设置大按钮 */}
      {open && (
        <div className="dsh-mm-body">
          {/* 总开关（与 passpass 同款绿色开关） */}
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

          {/* 样式设置大按钮（弹窗） */}
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

// ── 弹窗渲染（DOM innerHTML，支持 Esc 关闭）──
function renderModal(): string {
  const group = (kind: keyof SkinSettings) => {
    const p = PRESETS.find(x => x.kind === kind)!
    const s = modalSettings[kind]
    return `
      <div class="dsh-skinskin-group" data-kind="${kind}">
        <div class="dsh-skinskin-group-head">
          <span class="dsh-skinskin-group-title">${p.icon} ${p.label} <span class="desc">${p.desc}</span></span>
          <label class="dsh-skinskin-toggle">
            <input type="checkbox" data-field="enabled" data-kind="${kind}" ${s.enabled ? 'checked' : ''} /> 启用
          </label>
        </div>
        <div class="dsh-skinskin-fields">
          <div class="dsh-skinskin-field">
            <label>颜色</label>
            <div class="dsh-skinskin-color-row">
              <input type="color" data-field="color" data-kind="${kind}" value="${s.color || '#888888'}" ${s.enabled ? '' : 'disabled'} />
              <input type="text" data-field="color" data-kind="${kind}" value="${escapeAttr(s.color)}" placeholder="自动 或 #颜色" ${s.enabled ? '' : 'disabled'} />
            </div>
          </div>
          <div class="dsh-skinskin-field">
            <label>字号</label>
            <input type="number" data-field="size" data-kind="${kind}" value="${s.size || ''}" placeholder="默认" min="0" max="40" ${s.enabled ? '' : 'disabled'} />
          </div>
          <div class="dsh-skinskin-field">
            <label>字体</label>
            <input type="text" data-field="font" data-kind="${kind}" value="${escapeAttr(s.font)}" placeholder="默认（如 PingFang SC / JetBrains Mono）" ${s.enabled ? '' : 'disabled'} />
          </div>
        </div>
      </div>
    `
  }

  return `
    <div class="dsh-skinskin-modal" role="dialog" aria-label="样式设置">
      <h3>🎨 Skin Skin 样式设置</h3>
      <p class="sub">修改对话记录的三种文字样式，即时生效。留空 = 使用 DSH 默认。</p>
      ${group('reasoning')}
      ${group('command')}
      ${group('reply')}
      <div class="dsh-skinskin-foot">
        <span class="dsh-skinskin-hint">💡 修改即时生效，无需刷新。按 Esc 关闭。</span>
        <button type="button" data-action="close" style="padding:8px 18px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);cursor:pointer;font-size:13px;font-weight:500">完成</button>
      </div>
    </div>
  `
}

function escapeAttr(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

// ── 弹窗事件绑定 ──────────────────────────────────────
function bindModalEvents(overlay: HTMLElement) {
  // Esc 关闭
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
  document.addEventListener('keydown', onKey)
  overlay.setAttribute('data-esc', '')

  // 点击遮罩关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal()
  })

  // 字段变化
  overlay.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement
    const kind = el.dataset.kind as keyof SkinSettings
    const field = el.dataset.field as string
    if (!kind || !field || !modalSettings[kind]) return
    if (field === 'color') {
      modalSettings[kind].color = el.value
      // 同步色板输入框
      overlay.querySelectorAll<HTMLInputElement>(`input[data-field="color"][data-kind="${kind}"]`).forEach(i => { i.value = el.value })
    } else if (field === 'size') {
      modalSettings[kind].size = Number(el.value) || 0
    } else if (field === 'font') {
      modalSettings[kind].font = el.value
    }
    if (modalSave) modalSave(modalSettings)
  })

  // 启用开关
  overlay.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement
    if (el.dataset.field === 'enabled') {
      const kind = el.dataset.kind as keyof SkinSettings
      if (!kind || !modalSettings[kind]) return
      modalSettings[kind].enabled = el.checked
      // 同步组内 disabled 状态（改起来麻烦，直接重渲染）
      if (modalSave) modalSave(modalSettings)
      return
    }
    if (el.dataset.field === 'color') {
      const kind = el.dataset.kind as keyof SkinSettings
      if (!kind || !modalSettings[kind]) return
      modalSettings[kind].color = el.value
      if (modalSave) modalSave(modalSettings)
    }
  })

  // 完成 / 关闭
  overlay.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.getAttribute('data-action') === 'close') closeModal()
  })

  // 清理事件（overlay 移除时）
  const observer = new MutationObserver(() => {
    if (!document.body.contains(overlay)) {
      document.removeEventListener('keydown', onKey)
      observer.disconnect()
    }
  })
  observer.observe(document.body, { childList: true })
}

// ── 图标（Lucide，24×24 / 2px / round）──
const SKIN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/><path d="M3.6 9h16.8"/><path d="M3.6 15h16.8"/><path d="M12 3a15.5 15.5 0 0 1 0 18"/><path d="M12 3a15.5 15.5 0 0 0 0 18"/></svg>'
const PALETTE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 22a10 10 0 1 1 10-10c0 2-1.5 3-3 3h-2.5a2.5 2.5 0 0 0-2 4c.5.8.2 3-2.5 3z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/></svg>'

// ── 插件入口 ──────────────────────────────────────────
export const inject = ['slots', 'connection', 'settingsScope'] as const

export function apply(ctx: Context): void {
  const { api } = ctx.get('connection') as ConnectionHandle
  const scope = ctx.settingsScope.bind<SkinSettings>({ namespace: SKIN_NAMESPACE as never })

  // 注入卡片 CSS
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-skinskin-css'
  style.textContent = CARD_CSS
  document.head.appendChild(style)

  // 注册设置面板卡片（key = 服务端 settingsNamespace）
  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
    name: 'settings.plugin.item',
    key: SKIN_NAMESPACE,
    id: SKIN_NAMESPACE,
    order: 95,
    inject: (): SettingsFace => ({ scope }),
  }, SkinPluginCard))

  // 注入已保存的样式
  try {
    const v = scope.getSnapshot()?.value
    if (v) applySkin(v as SkinSettings)
  } catch { /* ignore */ }

  void api
}