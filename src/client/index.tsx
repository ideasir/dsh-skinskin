/** dsh-skinskin — 前端文字皮肤定制
 * 修改 DSH 对话记录界面的文字样式（颜色/字号/字体），分类设置：
 *   - 思考文字（reasoning）：模型思考过程
 *   - 执行命令文字（command/tool）：工具调用、命令执行
 *   - 真实回复文字（reply）：assistant 正文回复
 *
 * 实现方式：把三类文字各自的 CSS 规则注入 <style>，选择器基于 DSH 前端的
 * data-chat-flow-kind 属性（稳定，不随 hash 类名变化）。
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
  // 思考：ReasoningRow 的正文容器（xxx_thinkBody），fallback 到 flow item 内文本
  reasoning: `[data-chat-flow-kind="reasoning"] [class*="_thinkBody"], [data-chat-flow-kind="reasoning"] [class*="_summary"]`,
  // 命令：GenericCommandCard 的正文/摘要（命令气泡 + 工具调用结果）
  command: `[data-chat-flow-kind="command"] [class*="_body"], [data-chat-flow-kind="command"] [class*="_summary"], [data-chat-flow-kind="tool-call"] [class*="_body"], [data-chat-flow-kind="tool-result"] [class*="_body"]`,
  // 回复：MarkdownText 渲染的正文（assistant 真实回复）
  reply: `[data-chat-flow-kind="text"] [class*="_content"], [data-chat-flow-kind="text"] [class*="_body"], [data-chat-flow-kind="assistant"] [class*="_content"], [data-chat-flow-kind="assistant"] [class*="_body"]`,
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

// ── 卡片组件 ──────────────────────────────────────────
function SkinPluginCard(props: CardProps) {
  const [open, setOpen] = useState(false)
  const { scope } = props
  const [settings, setSettings] = useState<SkinSettings>({
    reasoning: { ...DEFAULT_TEXT },
    command: { ...DEFAULT_TEXT },
    reply: { ...DEFAULT_TEXT },
  })

  // 读取设置 + 应用到前端
  useEffect(() => {
    const load = () => {
      try {
        const v = scope.getSnapshot()?.value
        if (v) {
          setSettings({
            reasoning: { ...DEFAULT_TEXT, ...(v.reasoning || {}) },
            command: { ...DEFAULT_TEXT, ...(v.command || {}) },
            reply: { ...DEFAULT_TEXT, ...(v.reply || {}) },
          })
          applySkin(v as SkinSettings)
        }
      } catch { /* ignore */ }
    }
    load()
    const unsub = scope.subscribe?.(load)
    return () => { try { unsub?.() } catch { /* ignore */ } }
  }, [scope])

  // 更新某类文字的某个属性
  const update = async (kind: keyof SkinSettings, patch: Partial<TextStyle>) => {
    const next = {
      ...settings,
      [kind]: { ...settings[kind], ...patch },
    }
    setSettings(next)
    applySkin(next)
    try {
      await scope.set(kind as never, next[kind] as never)
    } catch (e) { console.warn('[dsh-skinskin] 保存失败', e) }
  }

  const presets: Array<{ kind: keyof SkinSettings; label: string; icon: string; desc: string }> = [
    { kind: 'reasoning', label: '思考文字', icon: '💭', desc: '模型思考过程' },
    { kind: 'command', label: '执行命令', icon: '⚙️', desc: '工具调用 / 命令执行' },
    { kind: 'reply', label: '真实回复', icon: '💬', desc: 'assistant 正文回复' },
  ]

  return (
    <li style={{ listStyle: 'none', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12, background: 'var(--dsw-alias-bg-layer-3,#fff)', overflow: 'hidden', minWidth: 0 }}>
      <button type="button" style={{ width: '100%', appearance: 'none', border: 0, background: 'none', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px' }}
        aria-expanded={open} onClick={() => setOpen(v => !v)}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, lineHeight: 20, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' }}>Skin Skin 皮肤定制</span>
            <span style={{ fontSize: 11, color: 'var(--dsw-alias-label-secondary)', background: 'var(--dsw-alias-bg-layer-1)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 999, padding: '0 8px', fontFamily: 'ui-monospace,Menlo,monospace' }}>0829-0.1.0-rc.2</span>
          </span>
          <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' }}>修改对话记录的文字颜色 / 字号 / 字体，思考、命令、回复可分别设置</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <a href={REPO} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary)', textDecoration: 'none', background: 'var(--dsw-alias-bg-layer-1)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 999, padding: '2px 10px' }}>ideasir</a>
          <span style={{ color: 'var(--dsw-alias-label-tertiary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .14s ease-in-out', display: 'inline-flex' }}>
            <IconChevronDownOutline14 />
          </span>
        </span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--dsw-alias-border-l2)', padding: '14px 14px 16px', background: 'var(--dsw-alias-bg-module-platform)' }}>
          {/* 三个分类 */}
          {presets.map(({ kind, label, icon, desc }) => {
            const s = settings[kind]
            return (
              <div key={kind} style={{ marginBottom: 14, padding: 12, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12, background: 'var(--dsw-alias-bg-layer-1)' }}>
                {/* 分类头 + 启用开关 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' }}>
                    <span>{icon}</span>{label}
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--dsw-alias-label-tertiary)' }}>{desc}</span>
                  </span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>
                    <input type="checkbox" checked={s.enabled}
                      onChange={e => update(kind, { enabled: e.target.checked })} />
                    启用
                  </label>
                </div>

                {/* 三个属性：颜色 / 字号 / 字体 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.6fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', marginBottom: 4 }}>颜色</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="color" value={s.color || '#000000'} disabled={!s.enabled}
                        onChange={e => update(kind, { color: e.target.value })}
                        style={{ width: 30, height: 30, border: 'none', background: 'none', padding: 0, cursor: s.enabled ? 'pointer' : 'not-allowed', opacity: s.enabled ? 1 : 0.4 }} />
                      <input type="text" value={s.color} disabled={!s.enabled}
                        placeholder="自动 或 #颜色"
                        onChange={e => update(kind, { color: e.target.value })}
                        style={{ flex: 1, minWidth: 0, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-base)', color: 'var(--dsw-alias-label-primary)', fontSize: 12 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', marginBottom: 4 }}>字号</label>
                    <input type="number" min={0} max={40} value={s.size || ''} disabled={!s.enabled}
                      placeholder="默认"
                      onChange={e => update(kind, { size: Number(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-base)', color: 'var(--dsw-alias-label-primary)', fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', marginBottom: 4 }}>字体</label>
                    <input type="text" value={s.font} disabled={!s.enabled}
                      placeholder="默认（如 PingFang SC / JetBrains Mono）"
                      onChange={e => update(kind, { font: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-base)', color: 'var(--dsw-alias-label-primary)', fontSize: 12 }} />
                  </div>
                </div>
              </div>
            )
          })}

          {/* 实时预览说明 */}
          <p style={{ margin: 0, fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' }}>
            💡 修改即时生效，无需刷新页面。输入框留空 = 使用 DSH 默认样式。
          </p>
        </div>
      )}
    </li>
  )
}

// ── 插件入口 ──────────────────────────────────────────
export const inject = ['slots', 'connection', 'settingsScope'] as const

export function apply(ctx: Context): void {
  const { api } = ctx.get('connection') as ConnectionHandle
  const scope = ctx.settingsScope.bind<SkinSettings>({ namespace: SKIN_NAMESPACE as never })

  // 注册设置面板卡片（key = 服务端 settingsNamespace）
  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
    name: 'settings.plugin.item',
    key: SKIN_NAMESPACE,
    id: SKIN_NAMESPACE,
    order: 95,
    inject: (): SettingsFace => ({ scope }),
  }, SkinPluginCard))

  // 注入样式（应用已保存的设置）
  try {
    const v = scope.getSnapshot()?.value
    if (v) applySkin(v as SkinSettings)
  } catch { /* ignore */ }

  void api
}
