window.__ModuleLoader__.load({
	id: "dsh-skinskin",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/index.tsx
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
		const SKIN_NAMESPACE = "skinskin";
		const REPO = "https://github.com/ideasir/dsh-skinskin";
		const VERSION = "0829-0.1.0-rc.2";
		const DEFAULT_TEXT = {
			color: "",
			opacity: 1,
			size: 0,
			font: "",
			effect: ""
		};
		const DEFAULTS = {
			reply: {
				color: "#f9fafb",
				size: 16,
				font: "系统默认"
			},
			thinking: {
				color: "#adb2b8",
				size: 14,
				font: "系统默认"
			},
			tool: {
				color: "#adb2b8",
				size: 14,
				font: "等宽字体"
			}
		};
		const FONT_PRESETS = [
			"系统默认",
			"PingFang SC",
			"Microsoft YaHei",
			"JetBrains Mono",
			"Consolas",
			"Menlo",
			"monospace",
			"serif",
			"sans-serif"
		];
		const EFFECT_OPTIONS = [
			{
				value: "",
				label: "无"
			},
			{
				value: "bold",
				label: "粗体"
			},
			{
				value: "italic",
				label: "斜体"
			},
			{
				value: "underline",
				label: "下划线"
			},
			{
				value: "bold,italic",
				label: "粗体+斜体"
			},
			{
				value: "bold,underline",
				label: "粗体+下划线"
			}
		];
		const SELECTORS = {
			reply: `[data-chat-flow-kind="assistant-step"] [class*="_markdown"]`,
			internal: `[data-chat-flow-kind="reasoning"] [class*="_thinkBody"], [data-chat-flow-kind="command"] [class*="_summary"], [data-chat-flow-kind="command"] [class*="_body"], [data-chat-flow-kind="tool-call"] [class*="_summary"], [data-chat-flow-kind="tool-call"] [class*="_body"], [data-chat-flow-kind="tool-result"] [class*="_summary"], [data-chat-flow-kind="tool-result"] [class*="_body"]`,
			thinking: `[data-chat-flow-kind="reasoning"] [class*="_thinkBody"], [data-chat-flow-kind="reasoning"] [class*="_summary"]`,
			tool: `[data-chat-flow-kind="command"] [class*="_summary"], [data-chat-flow-kind="command"] [class*="_body"], [data-chat-flow-kind="tool-call"] [class*="_summary"], [data-chat-flow-kind="tool-call"] [class*="_body"], [data-chat-flow-kind="tool-result"] [class*="_summary"], [data-chat-flow-kind="tool-result"] [class*="_body"]`
		};
		let styleEl = null;
		function styleRule(selector, s) {
			if (!s) return null;
			const parts = [];
			if (s.color) parts.push(`color:${s.color} !important`);
			if (s.opacity !== void 0 && s.opacity !== 1) parts.push(`opacity:${s.opacity} !important`);
			if (s.size > 0) parts.push(`font-size:${s.size}px !important`);
			if (s.font && s.font.trim() && s.font !== "系统默认") parts.push(`font-family:"${s.font.trim()}" !important`);
			if (s.effect) {
				const fx = s.effect.split(",");
				if (fx.includes("bold")) parts.push("font-weight:700 !important");
				if (fx.includes("italic")) parts.push("font-style:italic !important");
				if (fx.includes("underline")) parts.push("text-decoration:underline !important");
			}
			return parts.length ? `${selector} { ${parts.join(";")} }` : null;
		}
		function buildCss(settings) {
			const rules = [];
			const r = styleRule(SELECTORS.reply, settings?.reply);
			if (r) rules.push(r);
			const thinkingStyle = hasAnyStyle(settings?.thinking) ? settings.thinking : settings?.internal;
			const toolStyle = hasAnyStyle(settings?.tool) ? settings.tool : settings?.internal;
			const tr = styleRule(SELECTORS.thinking, thinkingStyle);
			if (tr) rules.push(tr);
			const tlr = styleRule(SELECTORS.tool, toolStyle);
			if (tlr) rules.push(tlr);
			return rules.join("\n");
		}
		function hasAnyStyle(s) {
			if (!s) return false;
			return !!(s.color || s.size > 0 || s.font && s.font.trim() && s.font !== "系统默认" || s.effect || s.opacity !== void 0 && s.opacity !== 1);
		}
		function applySkin(settings) {
			if (!styleEl) {
				styleEl = document.createElement("style");
				styleEl.dataset.plugin = "dsh-skinskin";
				document.head.appendChild(styleEl);
			}
			styleEl.textContent = buildCss(settings || {});
		}
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
.dsh-skinskin-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;animation:dsh-skinskin-fadein .2s ease-out}
@keyframes dsh-skinskin-fadein{from{opacity:0}to{opacity:1}}
.dsh-skinskin-modal{width:min(720px,94vw);max-height:84vh;overflow:auto;background:var(--dsw-alias-bg-layer-2,#1b1d20);border:1px solid var(--dsw-alias-border-l1);border-radius:14px;padding:18px 20px;box-shadow:0 12px 40px rgba(0,0,0,.5);animation:dsh-skinskin-pop .18s ease-out}
@keyframes dsh-skinskin-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
.dsh-skinskin-modal h3{margin:0 0 4px;font-size:16px;font-weight:600;color:var(--dsw-alias-label-primary)}
.dsh-skinskin-modal .sub{margin:0 0 16px;font-size:12px;color:var(--dsw-alias-label-tertiary)}
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
`;
		let modalSettings = {
			reply: { ...DEFAULT_TEXT },
			internal: { ...DEFAULT_TEXT },
			thinking: { ...DEFAULT_TEXT },
			tool: { ...DEFAULT_TEXT }
		};
		let modalSave = null;
		function closeModal() {
			document.querySelectorAll(".dsh-skinskin-overlay").forEach((el) => el.remove());
		}
		function SkinPluginCard(props) {
			const [open, setOpen] = (0, react.useState)(false);
			const { scope } = props;
			const [settings, setSettings] = (0, react.useState)({
				reply: { ...DEFAULT_TEXT },
				internal: { ...DEFAULT_TEXT },
				thinking: { ...DEFAULT_TEXT },
				tool: { ...DEFAULT_TEXT }
			});
			const [masterEnabled, setMasterEnabled] = (0, react.useState)(true);
			(0, react.useEffect)(() => {
				const load = () => {
					try {
						const v = scope.getSnapshot()?.value;
						if (v) {
							setMasterEnabled(v.enabled !== false);
							const merged = {
								reply: {
									...DEFAULT_TEXT,
									...v.reply || {}
								},
								internal: {
									...DEFAULT_TEXT,
									...v.internal || {}
								},
								thinking: {
									...DEFAULT_TEXT,
									...v.thinking || {}
								},
								tool: {
									...DEFAULT_TEXT,
									...v.tool || {}
								}
							};
							setSettings(merged);
							applySkin(v.enabled === false ? {
								reply: { ...DEFAULT_TEXT },
								internal: { ...DEFAULT_TEXT },
								thinking: { ...DEFAULT_TEXT },
								tool: { ...DEFAULT_TEXT }
							} : merged);
						}
					} catch {}
				};
				load();
				const unsub = scope.subscribe?.(load);
				return () => {
					try {
						unsub?.();
					} catch {}
				};
			}, [scope]);
			const save = (next) => {
				setSettings(next);
				applySkin(next);
				try {
					scope.set("reply", next.reply);
					scope.set("internal", next.internal);
					scope.set("thinking", next.thinking);
					scope.set("tool", next.tool);
				} catch (e) {
					console.warn("[dsh-skinskin] 保存失败", e);
				}
			};
			const toggleMaster = () => {
				const next = !masterEnabled;
				setMasterEnabled(next);
				applySkin(next ? settings : {
					reply: { ...DEFAULT_TEXT },
					internal: { ...DEFAULT_TEXT },
					thinking: { ...DEFAULT_TEXT },
					tool: { ...DEFAULT_TEXT }
				});
				try {
					scope.set("enabled", next);
				} catch (e) {
					console.warn("[dsh-skinskin] 保存失败", e);
				}
			};
			const openModal = () => {
				modalSettings = JSON.parse(JSON.stringify(settings));
				const overlay = document.createElement("div");
				overlay.className = "dsh-skinskin-overlay";
				overlay.innerHTML = renderModal();
				document.body.appendChild(overlay);
				modalSave = save;
				bindModalEvents(overlay);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: `dsh-mm-card ${open ? "dsh-mm-card-open" : ""}`,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					className: "dsh-mm-head",
					onClick: () => setOpen((v) => !v),
					tabIndex: -1,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "dsh-mm-head-text",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-mm-name-row",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dsh-mm-title",
								style: {
									display: "inline-flex",
									alignItems: "center",
									gap: 6
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { dangerouslySetInnerHTML: { __html: SKIN_SVG } }), "Skin Skin"]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-mm-version-badge",
								children: VERSION
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-mm-desc",
							children: "修改对话记录的文字样式（颜色/透明度/字号/字体/效果），分「回复」和「内部」两大类"
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "dsh-mm-btns",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
								className: "dsh-mm-btn-link",
								href: REPO,
								target: "_blank",
								rel: "noreferrer",
								onClick: (e) => e.stopPropagation(),
								title: "打开 GitHub 仓库",
								children: "ideasir"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "dsh-mm-btn-uninstall",
								onClick: (e) => {
									e.stopPropagation();
									if (confirm("确定卸载 Skin Skin 插件吗？\n\n将从 DSH 中移除插件本体和全部配置。")) {}
								},
								title: "卸载插件",
								children: "卸载"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "dsh-mm-btn-update",
								style: { color: "var(--dsw-alias-label-tertiary)" },
								onClick: (e) => {
									e.stopPropagation();
								},
								title: "当前已是最新版本",
								children: "已最新"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-mm-chevron",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {})
							})
						]
					})]
				}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-mm-body",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-mm-master",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							role: "switch",
							"aria-checked": masterEnabled,
							onClick: toggleMaster,
							style: {
								flex: "none",
								position: "relative",
								width: 44,
								height: 24,
								borderRadius: 999,
								border: "none",
								cursor: "pointer",
								padding: 0,
								background: masterEnabled ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-border-l3)",
								transition: "background .18s cubic-bezier(0.4, 0, 0.2, 1)",
								boxShadow: masterEnabled ? "inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, transparent)" : "none"
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: {
								position: "absolute",
								top: 3,
								left: masterEnabled ? 23 : 3,
								width: 18,
								height: 18,
								borderRadius: 999,
								background: "#fff",
								boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
								transition: "left .2s cubic-bezier(0.34, 1.56, 0.64, 1)"
							} })
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-mm-master-label",
							children: masterEnabled ? "Skin Skin 已开启" : "Skin Skin 已关闭"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-mm-master-note",
							children: masterEnabled ? "自定义文字样式已生效" : "关闭后使用 DSH 默认文字样式"
						})] })]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: openModal,
						style: {
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 8,
							width: "100%",
							padding: "12px 0",
							borderRadius: 10,
							border: "none",
							background: "var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary))",
							color: "var(--dsw-alias-label-primary-inverted,#fff)",
							cursor: "pointer",
							fontSize: 13,
							fontWeight: 600,
							transition: "filter .12s"
						},
						onMouseEnter: (e) => e.target.style.filter = "brightness(1.1)",
						onMouseLeave: (e) => e.target.style.filter = "",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							dangerouslySetInnerHTML: { __html: PALETTE_SVG },
							style: { display: "inline-flex" }
						}), "样式设置"]
					})]
				})]
			});
		}
		function renderForm(kind) {
			const s = modalSettings[kind];
			const def = (kind === "internal" ? {
				color: "#adb2b8",
				size: 14,
				font: "系统默认"
			} : DEFAULTS[kind]) || {
				color: "#adb2b8",
				size: 14,
				font: "系统默认"
			};
			const sizeVal = s.size || "";
			const opacityPct = Math.round((s.opacity ?? 1) * 100);
			return `
    <div class="dsh-skinskin-fields">
      <div class="dsh-skinskin-field">
        <label>颜色</label>
        <div class="dsh-skinskin-color-row">
          <input type="color" data-field="color" data-kind="${kind}" value="${s.color || def.color}" />
          <input type="text" data-field="color-text" data-kind="${kind}" value="${escapeAttr(s.color)}" placeholder="自定义（如 #f59e0b / rgb(...)）" />
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
          ${FONT_PRESETS.map((f) => `<option value="${escapeAttr(f)}" ${(s.font || "") === f || !s.font && f === "系统默认" ? "selected" : ""}>${f === "系统默认" ? `默认（${def.font}）` : f}</option>`).join("")}
        </select>
      </div>
      <div class="dsh-skinskin-field">
        <label>文字效果</label>
        <select data-field="effect" data-kind="${kind}">
          ${EFFECT_OPTIONS.map((e) => `<option value="${e.value}" ${s.effect === e.value ? "selected" : ""}>${e.label}</option>`).join("")}
        </select>
      </div>
    </div>
  `;
		}
		function renderModal() {
			return `
    <div class="dsh-skinskin-modal" role="dialog" aria-label="样式设置">
      <h3>🎨 Skin Skin 样式设置</h3>
      <p class="sub">设置文字样式，留空 = 使用 DSH 默认。修改即时生效。</p>

      <!-- ① 智能体回复用户 -->
      <div class="dsh-skinskin-group">
        <div class="dsh-skinskin-group-head">
          <span class="dsh-skinskin-group-title">💬 ① 智能体回复用户 <span class="desc">assistant 正文回复</span></span>
        </div>
        ${renderForm("reply")}
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
          ${renderForm("internal")}
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
            ${renderForm("thinking")}
          </div>
          <div class="dsh-skinskin-group">
            <div class="dsh-skinskin-group-head">
              <span class="dsh-skinskin-group-title">⚙️ 调用工具 / 执行命令 / 读写文件</span>
            </div>
            ${renderForm("tool")}
          </div>
        </div>
      </div>

      <div class="dsh-skinskin-foot">
        <span class="dsh-skinskin-hint">💡 修改即时生效。按 Esc 或点遮罩关闭。</span>
        <button type="button" data-action="reset" class="dsh-skinskin-reset">重置全部为默认</button>
        <button type="button" data-action="close" style="padding:8px 18px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);cursor:pointer;font-size:13px;font-weight:500">完成</button>
      </div>
    </div>
  `;
		}
		function escapeAttr(s) {
			return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
		}
		function bindModalEvents(overlay) {
			const onKey = (e) => {
				if (e.key === "Escape") closeModal();
			};
			document.addEventListener("keydown", onKey);
			overlay.addEventListener("click", (e) => {
				if (e.target === overlay) closeModal();
				const t = e.target;
				if (t.getAttribute("data-action") === "close") closeModal();
				if (t.getAttribute("data-action") === "reset") {
					modalSettings = {
						reply: { ...DEFAULT_TEXT },
						internal: { ...DEFAULT_TEXT },
						thinking: { ...DEFAULT_TEXT },
						tool: { ...DEFAULT_TEXT }
					};
					if (modalSave) modalSave(modalSettings);
					overlay.innerHTML = renderModal();
					return;
				}
				if (t.classList.contains("step")) {
					const kind = t.dataset.kind;
					const step = Number(t.dataset.step) || 0;
					const s = modalSettings[kind];
					const cur = s.size || 0;
					const next = Math.max(0, Math.min(40, cur + step));
					s.size = next;
					if (modalSave) modalSave(modalSettings);
					const input = overlay.querySelector(`input[data-field="size"][data-kind="${kind}"]`);
					if (input) input.value = next ? String(next) : "";
					return;
				}
			});
			overlay.addEventListener("input", (e) => {
				const el = e.target;
				const kind = el.dataset.kind;
				const field = el.dataset.field;
				if (!kind || !field || !modalSettings[kind]) return;
				const s = modalSettings[kind];
				if (field === "color") {
					s.color = el.value;
					const text = overlay.querySelector(`input[data-field="color-text"][data-kind="${kind}"]`);
					if (text) text.value = el.value;
				} else if (field === "color-text") {
					s.color = el.value;
					const picker = overlay.querySelector(`input[data-field="color"][data-kind="${kind}"]`);
					if (picker && /^#[0-9a-fA-F]{6}$/.test(el.value)) picker.value = el.value;
				} else if (field === "size") s.size = Number(el.value) || 0;
				else if (field === "opacity") {
					s.opacity = Number(el.value) / 100;
					const val = overlay.querySelector(`[data-opacity-val="${kind}"]`);
					if (val) val.textContent = el.value + "%";
				} else if (field === "font") s.font = el.value === "系统默认" ? "" : el.value;
				else if (field === "effect") s.effect = el.value;
				if (modalSave) modalSave(modalSettings);
			});
			const observer = new MutationObserver(() => {
				if (!document.body.contains(overlay)) {
					document.removeEventListener("keydown", onKey);
					observer.disconnect();
				}
			});
			observer.observe(document.body, { childList: true });
		}
		const SKIN_SVG = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"16\" height=\"16\"><path d=\"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z\"/><path d=\"M3.6 9h16.8\"/><path d=\"M3.6 15h16.8\"/><path d=\"M12 3a15.5 15.5 0 0 1 0 18\"/><path d=\"M12 3a15.5 15.5 0 0 0 0 18\"/></svg>";
		const PALETTE_SVG = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"18\" height=\"18\"><path d=\"M12 22a10 10 0 1 1 10-10c0 2-1.5 3-3 3h-2.5a2.5 2.5 0 0 0-2 4c.5.8.2 3-2.5 3z\"/><circle cx=\"7.5\" cy=\"11.5\" r=\"1\"/><circle cx=\"11\" cy=\"7.5\" r=\"1\"/><circle cx=\"15.5\" cy=\"8.5\" r=\"1\"/></svg>";
		const inject = [
			"slots",
			"connection",
			"settingsScope"
		];
		function apply(ctx) {
			const { api } = ctx.get("connection");
			const scope = ctx.settingsScope.bind({ namespace: SKIN_NAMESPACE });
			const style = document.createElement("style");
			style.dataset.plugin = "dsh-skinskin-css";
			style.textContent = CARD_CSS;
			document.head.appendChild(style);
			ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
				name: "settings.plugin.item",
				key: SKIN_NAMESPACE,
				id: SKIN_NAMESPACE,
				order: 95,
				inject: () => ({ scope })
			}, SkinPluginCard));
			try {
				const v = scope.getSnapshot()?.value;
				if (v) applySkin(v);
			} catch {}
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map