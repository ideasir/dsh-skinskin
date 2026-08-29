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
		* 修改 DSH 对话记录界面的文字样式（颜色/字号/字体），分类设置：
		*   - 思考文字（reasoning）：模型思考过程
		*   - 执行命令文字（command/tool）：工具调用、命令执行
		*   - 真实回复文字（reply）：assistant 正文回复
		*
		* 实现方式：把三类文字各自的 CSS 规则注入 <style>，选择器基于 DSH 前端的
		* data-chat-flow-kind 属性（稳定，不随 hash 类名变化）。
		*/
		const SKIN_NAMESPACE = "skinskin";
		const REPO = "https://github.com/ideasir/dsh-skinskin";
		const DEFAULT_TEXT = {
			enabled: false,
			color: "",
			size: 0,
			font: ""
		};
		const SELECTORS = {
			reasoning: `[data-chat-flow-kind="reasoning"] [class*="_thinkBody"], [data-chat-flow-kind="reasoning"] [class*="_summary"]`,
			command: `[data-chat-flow-kind="command"] [class*="_body"], [data-chat-flow-kind="command"] [class*="_summary"], [data-chat-flow-kind="tool-call"] [class*="_body"], [data-chat-flow-kind="tool-result"] [class*="_body"]`,
			reply: `[data-chat-flow-kind="text"] [class*="_content"], [data-chat-flow-kind="text"] [class*="_body"], [data-chat-flow-kind="assistant"] [class*="_content"], [data-chat-flow-kind="assistant"] [class*="_body"]`
		};
		let styleEl = null;
		function buildCss(settings) {
			const rules = [];
			[
				"reasoning",
				"command",
				"reply"
			].forEach((kind) => {
				const s = settings?.[kind];
				if (!s?.enabled) return;
				const parts = [];
				if (s.color) parts.push(`color:${s.color}`);
				if (s.size > 0) parts.push(`font-size:${s.size}px`);
				if (s.font && s.font.trim()) parts.push(`font-family:"${s.font.trim()}"`);
				if (parts.length) rules.push(`${SELECTORS[kind]} { ${parts.join(";")} }`);
			});
			return rules.join("\n");
		}
		function applySkin(settings) {
			if (!styleEl) {
				styleEl = document.createElement("style");
				styleEl.dataset.plugin = "dsh-skinskin";
				document.head.appendChild(styleEl);
			}
			styleEl.textContent = buildCss(settings || {});
		}
		function SkinPluginCard(props) {
			const [open, setOpen] = (0, react.useState)(false);
			const { scope } = props;
			const [settings, setSettings] = (0, react.useState)({
				reasoning: { ...DEFAULT_TEXT },
				command: { ...DEFAULT_TEXT },
				reply: { ...DEFAULT_TEXT }
			});
			(0, react.useEffect)(() => {
				const load = () => {
					try {
						const v = scope.getSnapshot()?.value;
						if (v) {
							setSettings({
								reasoning: {
									...DEFAULT_TEXT,
									...v.reasoning || {}
								},
								command: {
									...DEFAULT_TEXT,
									...v.command || {}
								},
								reply: {
									...DEFAULT_TEXT,
									...v.reply || {}
								}
							});
							applySkin(v);
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
			const update = async (kind, patch) => {
				const next = {
					...settings,
					[kind]: {
						...settings[kind],
						...patch
					}
				};
				setSettings(next);
				applySkin(next);
				try {
					await scope.set(kind, next[kind]);
				} catch (e) {
					console.warn("[dsh-skinskin] 保存失败", e);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				style: {
					listStyle: "none",
					border: "1px solid var(--dsw-alias-border-l2)",
					borderRadius: 12,
					background: "var(--dsw-alias-bg-layer-3,#fff)",
					overflow: "hidden",
					minWidth: 0
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					style: {
						width: "100%",
						appearance: "none",
						border: 0,
						background: "none",
						font: "inherit",
						color: "inherit",
						textAlign: "left",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 12,
						padding: "12px 14px"
					},
					"aria-expanded": open,
					onClick: () => setOpen((v) => !v),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: 2,
							minWidth: 0
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 6
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: {
									fontSize: 14,
									lineHeight: 20,
									fontWeight: 600,
									color: "var(--dsw-alias-label-primary)"
								},
								children: "Skin Skin 皮肤定制"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: {
									fontSize: 11,
									color: "var(--dsw-alias-label-secondary)",
									background: "var(--dsw-alias-bg-layer-1)",
									border: "1px solid var(--dsw-alias-border-l2)",
									borderRadius: 999,
									padding: "0 8px",
									fontFamily: "ui-monospace,Menlo,monospace"
								},
								children: "0829-0.1.0-rc.2"
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: {
								fontSize: 12,
								color: "var(--dsw-alias-label-tertiary)"
							},
							children: "修改对话记录的文字颜色 / 字号 / 字体，思考、命令、回复可分别设置"
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 6,
							flexShrink: 0
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
							href: REPO,
							target: "_blank",
							rel: "noreferrer",
							onClick: (e) => e.stopPropagation(),
							style: {
								fontSize: 12,
								color: "var(--dsw-alias-label-secondary)",
								textDecoration: "none",
								background: "var(--dsw-alias-bg-layer-1)",
								border: "1px solid var(--dsw-alias-border-l2)",
								borderRadius: 999,
								padding: "2px 10px"
							},
							children: "ideasir"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: {
								color: "var(--dsw-alias-label-tertiary)",
								transform: open ? "rotate(180deg)" : "none",
								transition: "transform .14s ease-in-out",
								display: "inline-flex"
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {})
						})]
					})]
				}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: {
						borderTop: "1px solid var(--dsw-alias-border-l2)",
						padding: "14px 14px 16px",
						background: "var(--dsw-alias-bg-module-platform)"
					},
					children: [[
						{
							kind: "reasoning",
							label: "思考文字",
							icon: "💭",
							desc: "模型思考过程"
						},
						{
							kind: "command",
							label: "执行命令",
							icon: "⚙️",
							desc: "工具调用 / 命令执行"
						},
						{
							kind: "reply",
							label: "真实回复",
							icon: "💬",
							desc: "assistant 正文回复"
						}
					].map(({ kind, label, icon, desc }) => {
						const s = settings[kind];
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								marginBottom: 14,
								padding: 12,
								border: "1px solid var(--dsw-alias-border-l2)",
								borderRadius: 12,
								background: "var(--dsw-alias-bg-layer-1)"
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									marginBottom: 10
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									style: {
										display: "flex",
										alignItems: "center",
										gap: 6,
										fontSize: 13,
										fontWeight: 600,
										color: "var(--dsw-alias-label-primary)"
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: icon }),
										label,
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												fontSize: 11,
												fontWeight: 400,
												color: "var(--dsw-alias-label-tertiary)"
											},
											children: desc
										})
									]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									style: {
										display: "inline-flex",
										alignItems: "center",
										gap: 6,
										cursor: "pointer",
										fontSize: 12,
										color: "var(--dsw-alias-label-secondary)"
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: s.enabled,
										onChange: (e) => update(kind, { enabled: e.target.checked })
									}), "启用"]
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "grid",
									gridTemplateColumns: "1fr 1fr 1.6fr",
									gap: 10
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										style: {
											display: "block",
											fontSize: 11,
											color: "var(--dsw-alias-label-tertiary)",
											marginBottom: 4
										},
										children: "颜色"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											alignItems: "center",
											gap: 6
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "color",
											value: s.color || "#000000",
											disabled: !s.enabled,
											onChange: (e) => update(kind, { color: e.target.value }),
											style: {
												width: 30,
												height: 30,
												border: "none",
												background: "none",
												padding: 0,
												cursor: s.enabled ? "pointer" : "not-allowed",
												opacity: s.enabled ? 1 : .4
											}
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "text",
											value: s.color,
											disabled: !s.enabled,
											placeholder: "自动 或 #颜色",
											onChange: (e) => update(kind, { color: e.target.value }),
											style: {
												flex: 1,
												minWidth: 0,
												padding: "6px 8px",
												borderRadius: 8,
												border: "1px solid var(--dsw-alias-border-l2)",
												background: "var(--dsw-alias-bg-base)",
												color: "var(--dsw-alias-label-primary)",
												fontSize: 12
											}
										})]
									})] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										style: {
											display: "block",
											fontSize: 11,
											color: "var(--dsw-alias-label-tertiary)",
											marginBottom: 4
										},
										children: "字号"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "number",
										min: 0,
										max: 40,
										value: s.size || "",
										disabled: !s.enabled,
										placeholder: "默认",
										onChange: (e) => update(kind, { size: Number(e.target.value) || 0 }),
										style: {
											width: "100%",
											padding: "6px 8px",
											borderRadius: 8,
											border: "1px solid var(--dsw-alias-border-l2)",
											background: "var(--dsw-alias-bg-base)",
											color: "var(--dsw-alias-label-primary)",
											fontSize: 12
										}
									})] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										style: {
											display: "block",
											fontSize: 11,
											color: "var(--dsw-alias-label-tertiary)",
											marginBottom: 4
										},
										children: "字体"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "text",
										value: s.font,
										disabled: !s.enabled,
										placeholder: "默认（如 PingFang SC / JetBrains Mono）",
										onChange: (e) => update(kind, { font: e.target.value }),
										style: {
											width: "100%",
											padding: "6px 8px",
											borderRadius: 8,
											border: "1px solid var(--dsw-alias-border-l2)",
											background: "var(--dsw-alias-bg-base)",
											color: "var(--dsw-alias-label-primary)",
											fontSize: 12
										}
									})] })
								]
							})]
						}, kind);
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: {
							margin: 0,
							fontSize: 11,
							color: "var(--dsw-alias-label-tertiary)"
						},
						children: "💡 修改即时生效，无需刷新页面。输入框留空 = 使用 DSH 默认样式。"
					})]
				})]
			});
		}
		const inject = [
			"slots",
			"connection",
			"settingsScope"
		];
		function apply(ctx) {
			const { api } = ctx.get("connection");
			const scope = ctx.settingsScope.bind({ namespace: SKIN_NAMESPACE });
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