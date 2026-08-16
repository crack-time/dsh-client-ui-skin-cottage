window.__ModuleLoader__.load({ id: "@crack/dsh-client-ui-skin-cottage", factory: (require) => {
const css = "/* ============================================\r\n   田园小屋 (Pastoral Cottage) Skin\r\n   3840x2160 吉卜力风格田园插画全屏背景\r\n   半透明毛玻璃面板\r\n   ============================================ */\r\n\r\n/* === 亮色版 === */\r\nbody[data-dsh-cottage] {\r\n  /* 壁纸全屏铺底 */\r\n  background-color: #3a6ea5;\r\n  background-size: cover;\r\n  background-position: center center;\r\n  background-attachment: fixed;\r\n  background-repeat: no-repeat;\r\n}\r\n\r\n/* ---- #root 容器：透明背景让壁纸透出来 ---- */\r\nbody[data-dsh-cottage] #root {\r\n  background: transparent !important;\r\n}\r\n\r\n/* ============================================\r\n   Design Token 覆盖 — 亮色\r\n   ============================================ */\r\nbody[data-dsh-cottage] {\r\n  /* 品牌色：天空蓝 */\r\n  --dsw-alias-brand-primary: #5a9fd4;\r\n  --dsw-alias-brand-primary-invert: #fff;\r\n  --dsw-alias-brand-text: #4a8fc4;\r\n\r\n  /* 背景：半透明毛玻璃 */\r\n  --dsw-alias-bg-base: rgba(255, 255, 255, 0.48);\r\n  --dsw-alias-bg-layer-1: rgba(255, 255, 255, 0.42);\r\n  --dsw-alias-bg-layer-2: rgba(250, 249, 247, 0.90);\r\n  --dsw-alias-bg-layer-3: rgba(240, 237, 230, 0.48);\r\n  --dsw-alias-bg-overlay: rgba(255, 255, 255, 0.68);\r\n  --dsw-alias-bg-mask-1: rgba(0, 0, 0, 0.45);\r\n\r\n  /* 边框 */\r\n  --dsw-alias-border-l1: rgba(90, 159, 212, 0.12);\r\n  --dsw-alias-border-l2: rgba(90, 159, 212, 0.18);\r\n  --dsw-alias-border-l3: rgba(90, 159, 212, 0.25);\r\n\r\n  /* 文字 */\r\n  --dsw-alias-label-primary: #2c3e50;\r\n  --dsw-alias-label-secondary: #46535f;\r\n  --dsw-alias-label-tertiary: #64748a;\r\n  --dsw-alias-label-primary-inverted: #fff;\r\n\r\n  /* 交互 */\r\n  --dsw-alias-interactive-bg-hover: rgba(90, 159, 212, 0.10);\r\n  --dsw-alias-interactive-bg-active: rgba(90, 159, 212, 0.15);\r\n  --dsw-alias-interactive-bg-hover-accent: rgba(90, 159, 212, 0.14);\r\n\r\n  /* 按钮 */\r\n  --dsw-alias-button-primary-fill: #5a9fd4;\r\n  --dsw-alias-button-primary-hover: #4a8fc4;\r\n  --dsw-alias-button-elevated-fill: rgba(255, 255, 255, 0.65);\r\n  --dsw-alias-button-contrast-fill: #3a6ea5;\r\n\r\n  /* 侧边栏 */\r\n  --dsw-specific-sidebar-fill: rgba(248, 245, 240, 0.42);\r\n\r\n  /* 聊天气泡 */\r\n  --dsw-specific-bubble: rgba(255, 255, 255, 0.48);\r\n  --dsw-specific-bubble-highlight: rgba(90, 159, 212, 0.12);\r\n\r\n  /* 输入框 */\r\n  --dsw-specific-input-major: rgba(255, 255, 255, 0.85);\r\n\r\n  /* 菜单 / 选择器 */\r\n  --dsw-specific-menu: rgba(255, 255, 255, 0.72);\r\n  --dsw-specific-selector: rgba(248, 245, 240, 0.62);\r\n\r\n  /* 代码块 */\r\n  --dsw-alias-markdown-code-block: rgba(248, 245, 240, 0.58);\r\n  --dsw-alias-markdown-inline-code: rgba(248, 245, 240, 0.64);\r\n\r\n  /* Toast / Tooltip */\r\n  --dsw-alias-toast-bg: rgba(45, 75, 105, 0.92);\r\n  --dsw-alias-tooltip-bg: rgba(44, 44, 46, 0.95);\r\n}\r\n\r\n/* ============================================\r\n   Design Token 覆盖 — 暗色\r\n   ============================================ */\r\nbody[data-dsh-cottage][data-ds-dark-theme] {\r\n  --dsw-alias-brand-primary: #7ab8e8;\r\n  --dsw-alias-brand-primary-invert: #1a2a3a;\r\n  --dsw-alias-brand-text: #7ab8e8;\r\n\r\n  --dsw-alias-bg-base: rgba(18, 22, 30, 0.52);\r\n  --dsw-alias-bg-layer-1: rgba(22, 26, 34, 0.50);\r\n  --dsw-alias-bg-layer-2: rgba(26, 30, 38, 0.90);\r\n  --dsw-alias-bg-layer-3: rgba(30, 34, 42, 0.46);\r\n  --dsw-alias-bg-overlay: rgba(20, 24, 32, 0.72);\r\n  --dsw-alias-bg-mask-1: rgba(0, 0, 0, 0.55);\r\n\r\n  --dsw-alias-border-l1: rgba(122, 184, 232, 0.10);\r\n  --dsw-alias-border-l2: rgba(122, 184, 232, 0.16);\r\n  --dsw-alias-border-l3: rgba(122, 184, 232, 0.22);\r\n\r\n  --dsw-alias-label-primary: #e0e6ed;\r\n  --dsw-alias-label-secondary: #a0aab4;\r\n  --dsw-alias-label-tertiary: #7a8490;\r\n  --dsw-alias-label-primary-inverted: #1a2a3a;\r\n\r\n  --dsw-alias-interactive-bg-hover: rgba(122, 184, 232, 0.10);\r\n  --dsw-alias-interactive-bg-active: rgba(122, 184, 232, 0.15);\r\n  --dsw-alias-interactive-bg-hover-accent: rgba(122, 184, 232, 0.12);\r\n\r\n  --dsw-alias-button-primary-fill: #4a8ab8;\r\n  --dsw-alias-button-primary-hover: #5a9ac8;\r\n  --dsw-alias-button-elevated-fill: rgba(30, 34, 42, 0.62);\r\n  --dsw-alias-button-contrast-fill: #7ab8e8;\r\n\r\n  --dsw-specific-sidebar-fill: rgba(22, 26, 34, 0.52);\r\n  --dsw-specific-bubble: rgba(26, 30, 38, 0.50);\r\n  --dsw-specific-bubble-highlight: rgba(122, 184, 232, 0.12);\r\n  --dsw-specific-input-major: rgba(18, 22, 30, 0.85);\r\n  --dsw-specific-menu: rgba(22, 26, 34, 0.72);\r\n  --dsw-specific-selector: rgba(26, 30, 38, 0.66);\r\n\r\n  --dsw-alias-markdown-code-block: rgba(22, 26, 34, 0.55);\r\n  --dsw-alias-markdown-inline-code: rgba(26, 30, 38, 0.60);\r\n\r\n  --dsw-alias-toast-bg: rgba(30, 38, 50, 0.92);\r\n  --dsw-alias-tooltip-bg: rgba(22, 26, 34, 0.95);\r\n}\r\n\r\n/* ============================================\r\n   中央聊天区：父容器全透明，壁纸全显示\r\n   （子区域保持现状：气泡/输入卡半透明不变）\r\n   ============================================ */\r\nbody[data-dsh-cottage] .wSkVaW_root {\r\n  background: transparent;\r\n}\r\n\r\n/* ============================================\r\n   布局框架（frame）：全透明，壁纸全显示\r\n   （侧栏/详情列有自己的背景，不受影响）\r\n   ============================================ */\r\nbody[data-dsh-cottage] .pI_x6G_frame {\r\n  background: transparent;\r\n}\r\n\r\n/* ============================================\r\n   消息文本列：与输入框等宽、同透明度（直角）\r\n   背景挂在视口固定的滚动容器（scrollBody）上，\r\n   左右边缘 2px 渐变淡出；\r\n   消息内容保持 748px（--dsh-chat-content-width）\r\n   ============================================ */\r\n/* width:100% + max-width：作为 flex 子项带 margin:0 auto 时不会被拉伸，\r\n   若只靠 max-width 宽度会退化到内容宽度（加载历史时缩成窄条） */\r\nbody[data-dsh-cottage]:not(:has(.qBU-ya_root)) .wSkVaW_scrollBody {\r\n  width: 100%;\r\n  /* 背景与输入座位同宽（812px）；文本列有 max-width:748 自行封顶 */\r\n  max-width: calc(var(--dsh-composer-card-max-width) + 2 * var(--dsh-composer-side-clearance));\r\n  margin: 0 auto;\r\n  /* 左右边缘渐变淡出，避免白面板与壁纸硬切（中间仍为 85% 不透明） */\r\n  background-color: transparent;\r\n  background-image: linear-gradient(to right,\r\n    transparent 0,\r\n    var(--dsw-specific-input-major) 2px,\r\n    var(--dsw-specific-input-major) calc(100% - 2px),\r\n    transparent 100%);\r\n}\r\n\r\n/* 新建对话（hero 欢迎态）：解除面板约束，恢复 dsh 全宽布局\r\n   （hero 内容本就以 780px 居中，不再套白色面板） */\r\nbody[data-dsh-cottage] .wSkVaW_root[data-phase=\"hero\"] .wSkVaW_scrollBody {\r\n  max-width: none;\r\n  margin: 0;\r\n  background: transparent;\r\n}\r\n\r\n/* 滚动区内边距收窄到 16px，让消息内容正好 748px（默认 32px 会挤窄） */\r\nbody[data-dsh-cottage] .Md3f7G_scroll {\r\n  padding: 16px;\r\n}\r\n\r\n/* ============================================\r\n   输入框座位（仅激活态：整条 = 统计条 + 输入卡）：\r\n   由皮肤 JS 移出滚动容器（成为 scrollBody 之后的兄弟），\r\n   宽度与面板一致并居中；滚动视口下边缘 = 输入框顶部，\r\n   文本不会穿到其后；整条共用文本列同款白色背景。\r\n   hero/其他阶段不约束，保持 dsh 原布局\r\n   ============================================ */\r\nbody[data-dsh-cottage] .wSkVaW_root[data-phase=\"active\"] .wSkVaW_composerSeat {\r\n  width: 100%;\r\n  /* 比消息面板宽 32px（= 卡片左右内边距），让输入卡恢复 dsh 默认 780px */\r\n  max-width: calc(var(--dsh-composer-card-max-width) + 2 * var(--dsh-composer-side-clearance));\r\n  margin: 0 auto;\r\n  background-color: transparent;\r\n  background-image: linear-gradient(to right,\r\n    transparent 0,\r\n    var(--dsw-specific-input-major) 2px,\r\n    var(--dsw-specific-input-major) calc(100% - 2px),\r\n    transparent 100%);\r\n}\r\n\r\n/* ============================================\r\n   会话统计条：放宽到与座位同宽（780px），\r\n   内边距收窄，完整展示统计文本不被省略号截断\r\n   ============================================ */\r\nbody[data-dsh-cottage] .FJxK0a_root {\r\n  max-width: var(--dsh-composer-card-max-width);\r\n  padding: 4px 4px 0;\r\n  font-size: 12px;\r\n}\r\n\r\n/* 原生\"回到底部\"按钮：滚动容器保持为 scrollBody，原生显隐逻辑\r\n   有效；仅改为水平居中、贴输入框上方 16px（默认右对齐且按\r\n   152px 输入框高度预留偏移） */\r\nbody[data-dsh-cottage] [data-conversation-scroll] .Md3f7G_toBottomSlot {\r\n  bottom: 16px;\r\n  justify-content: center;\r\n  padding-right: 0;\r\n}\r\n\r\n/* ============================================\r\n   顶部标题栏：透明度与中间文本区一致\r\n   ============================================ */\r\nbody[data-dsh-cottage] .wSkVaW_header {\r\n  background: var(--dsw-specific-input-major);\r\n}\r\n\r\n/* ============================================\r\n   侧边栏：透明度与中间文本区一致\r\n   （布局列 .pI_x6G_sidebarCol 保持透明，\r\n    侧栏根 .hHd-Xa_root 使用 input-major）\r\n   ============================================ */\r\nbody[data-dsh-cottage] .pI_x6G_sidebarCol {\r\n  background: transparent;\r\n}\r\nbody[data-dsh-cottage] .hHd-Xa_root {\r\n  background: var(--dsw-specific-input-major);\r\n}\r\n\r\n/* ============================================\r\n   会话列表底部渐隐条：渐隐进 sidebar-fill 颜色，\r\n   在壁纸上形成白色边界，去掉\r\n   ============================================ */\r\nbody[data-dsh-cottage] .qDHVXG_fade {\r\n  display: none;\r\n}\r\n\r\n/* ============================================\r\n   侧栏折叠按钮微调\r\n   ============================================ */\r\n/* 展开态：折叠按钮略左移，不贴右缘 */\r\nbody[data-dsh-cottage] .hHd-Xa_logoRow > button:last-child {\r\n  margin-right: 7px;\r\n}\r\n\r\n/* ============================================\r\n   滚动条美化\r\n   ============================================ */\r\nbody[data-dsh-cottage] ::-webkit-scrollbar {\r\n  width: 6px;\r\n}\r\nbody[data-dsh-cottage] ::-webkit-scrollbar-track {\r\n  background: transparent;\r\n}\r\nbody[data-dsh-cottage] ::-webkit-scrollbar-thumb {\r\n  background: rgba(90, 159, 212, 0.3);\r\n  border-radius: 3px;\r\n}\r\nbody[data-dsh-cottage] ::-webkit-scrollbar-thumb:hover {\r\n  background: rgba(90, 159, 212, 0.5);\r\n}\r\n/* ============================================\r\n   轨迹页（中间主区域，.qBU-ya_root）：作用域还原\r\n   dsh 默认 token —— 页面本身保持 dsh 默认外观；\r\n   其余区域（侧栏/顶栏/输入区等）皮肤照常生效。\r\n   注意：从轨迹页打开的弹层挂在 body 上，会继承\r\n   皮肤 token（玻璃效果），此为已知取舍\r\n   ============================================ */\r\nbody[data-dsh-cottage] .qBU-ya_root {\r\n  --dsw-alias-bg-base: var(--dsw-static-neutral-bluish-00);\r\n  --dsw-alias-bg-layer-1: var(--dsw-static-neutral-bluish-00);\r\n  --dsw-alias-bg-layer-2: var(--dsw-static-neutral-bluish-00);\r\n  --dsw-alias-bg-layer-3: var(--dsw-static-neutral-bluish-00);\r\n  --dsw-alias-bg-overlay: var(--dsw-static-neutral-bluish-150);\r\n  --dsw-alias-bg-mask-1: rgba(0, 0, 0, 0.24);\r\n  --dsw-alias-bg-mask-2: rgba(0, 0, 0, 0.12);\r\n  --dsw-alias-bg-mask-3: rgba(0, 0, 0, 0.48);\r\n  --dsw-alias-bg-skeleton: rgba(0, 0, 0, 0.04);\r\n  --dsw-alias-bg-multi-select: var(--dsw-static-neutral-bluish-60);\r\n  --dsw-alias-border-l1: rgba(0, 0, 0, 0.04);\r\n  --dsw-alias-border-l2: rgba(0, 0, 0, 0.1);\r\n  --dsw-alias-border-l3: rgba(0, 0, 0, 0.12);\r\n  --dsw-alias-brand-primary: var(--dsw-static-neutral-bluish-1000);\r\n  --dsw-alias-brand-primary-invert: var(--dsw-static-neutral-bluish-1000);\r\n  --dsw-alias-brand-text: var(--dsw-static-neutral-bluish-1000);\r\n  --dsw-alias-button-contrast-fill: var(--dsw-static-neutral-bluish-700);\r\n  --dsw-alias-button-elevated-fill: var(--dsw-static-neutral-bluish-00);\r\n  --dsw-alias-button-primary-fill: var(--dsw-alias-brand-primary);\r\n  --dsw-alias-button-primary-hover: var(--dsw-static-neutral-bluish-750);\r\n  --dsw-alias-interactive-bg-hover: rgba(38, 49, 72, 0.06);\r\n  --dsw-alias-interactive-bg-active: rgba(38, 49, 72, 0.1);\r\n  --dsw-alias-interactive-bg-hover-accent: rgba(38, 49, 72, 0.14);\r\n  --dsw-alias-label-primary: var(--dsw-static-neutral-bluish-1000);\r\n  --dsw-alias-label-secondary: var(--dsw-static-neutral-bluish-700);\r\n  --dsw-alias-label-tertiary: var(--dsw-static-neutral-bluish-600);\r\n  --dsw-alias-label-primary-inverted: var(--dsw-static-neutral-bluish-00);\r\n  --dsw-alias-markdown-code-block: var(--dsw-static-neutral-bluish-50);\r\n  --dsw-alias-markdown-inline-code: var(--dsw-static-neutral-bluish-100);\r\n  --dsw-alias-state-success-primary: var(--dsw-static-green-500);\r\n  --dsw-alias-state-warn-primary: var(--dsw-static-amber-500);\r\n  --dsw-alias-toast-bg: var(--dsw-static-neutral-bluish-800);\r\n  --dsw-alias-tooltip-bg: var(--dsw-static-neutral-bluish-850);\r\n  --dsw-specific-bubble: var(--dsw-static-deepseek-50);\r\n  --dsw-specific-bubble-highlight: var(--dsw-static-deepseek-200);\r\n  --dsw-specific-input-major: var(--dsw-static-neutral-bluish-00);\r\n  --dsw-specific-menu: var(--dsw-alias-bg-layer-3);\r\n  --dsw-specific-selector: var(--dsw-static-neutral-bluish-60);\r\n  --dsw-specific-sidebar-fill: var(--dsw-static-neutral-bluish-50);\r\n}\r\n\r\nbody[data-dsh-cottage][data-ds-dark-theme] .qBU-ya_root {\r\n  --dsw-alias-bg-base: var(--dsw-static-neutral-bluish-950);\r\n  --dsw-alias-bg-layer-1: var(--dsw-static-neutral-bluish-875);\r\n  --dsw-alias-bg-layer-2: var(--dsw-static-neutral-bluish-850);\r\n  --dsw-alias-bg-layer-3: var(--dsw-static-neutral-bluish-800);\r\n  --dsw-alias-bg-overlay: var(--dsw-static-neutral-bluish-700);\r\n  --dsw-alias-bg-mask-1: rgba(0, 0, 0, 0.5);\r\n  --dsw-alias-bg-mask-2: rgba(0, 0, 0, 0.2);\r\n  --dsw-alias-bg-mask-3: rgba(0, 0, 0, 0.48);\r\n  --dsw-alias-bg-skeleton: rgba(255, 255, 255, 0.08);\r\n  --dsw-alias-bg-multi-select: var(--dsw-static-neutral-850);\r\n  --dsw-alias-border-l1: rgba(255, 255, 255, 0.06);\r\n  --dsw-alias-border-l2: rgba(255, 255, 255, 0.12);\r\n  --dsw-alias-border-l3: rgba(255, 255, 255, 0.16);\r\n  --dsw-alias-brand-primary: var(--dsw-static-neutral-bluish-50);\r\n  --dsw-alias-brand-primary-invert: var(--dsw-static-neutral-bluish-50);\r\n  --dsw-alias-brand-text: var(--dsw-static-neutral-bluish-50);\r\n  --dsw-alias-button-contrast-fill: var(--dsw-static-neutral-bluish-50);\r\n  --dsw-alias-button-elevated-fill: var(--dsw-static-neutral-bluish-750);\r\n  --dsw-alias-button-primary-fill: var(--dsw-alias-brand-primary);\r\n  --dsw-alias-button-primary-hover: var(--dsw-static-neutral-bluish-100);\r\n  --dsw-alias-interactive-bg-hover: rgba(255, 255, 255, 0.08);\r\n  --dsw-alias-interactive-bg-active: rgba(255, 255, 255, 0.14);\r\n  --dsw-alias-interactive-bg-hover-accent: rgba(255, 255, 255, 0.24);\r\n  --dsw-alias-label-primary: var(--dsw-static-neutral-bluish-50);\r\n  --dsw-alias-label-secondary: var(--dsw-static-neutral-bluish-300);\r\n  --dsw-alias-label-tertiary: var(--dsw-static-neutral-bluish-400);\r\n  --dsw-alias-label-primary-inverted: var(--dsw-static-neutral-bluish-800);\r\n  --dsw-alias-markdown-code-block: var(--dsw-static-neutral-bluish-900);\r\n  --dsw-alias-markdown-inline-code: var(--dsw-static-neutral-bluish-850);\r\n  --dsw-alias-state-success-primary: var(--dsw-static-green-500);\r\n  --dsw-alias-state-warn-primary: var(--dsw-static-amber-500);\r\n  --dsw-alias-toast-bg: var(--dsw-static-neutral-bluish-750);\r\n  --dsw-alias-tooltip-bg: var(--dsw-static-neutral-bluish-750);\r\n  --dsw-specific-bubble: var(--dsw-static-neutral-bluish-850);\r\n  --dsw-specific-bubble-highlight: var(--dsw-static-neutral-bluish-750);\r\n  --dsw-specific-input-major: var(--dsw-static-neutral-bluish-850);\r\n  --dsw-specific-menu: var(--dsw-alias-bg-layer-3);\r\n  --dsw-specific-selector: var(--dsw-static-neutral-bluish-800);\r\n  --dsw-specific-sidebar-fill: var(--dsw-static-neutral-bluish-900);\r\n}\r\n\r\n/* 轨迹页内滚动条滑块还原默认颜色 */\r\nbody[data-dsh-cottage] .qBU-ya_root ::-webkit-scrollbar-thumb {\r\n  background: var(--dsw-alias-scrollbar-bg-l2);\r\n}\r\nbody[data-dsh-cottage] .qBU-ya_root ::-webkit-scrollbar-thumb:hover {\r\n  background: var(--dsw-alias-scrollbar-hover-l2);\r\n}\n/* 侧边栏归档入口按钮（添加工作区右侧） */\nbody[data-dsh-cottage] button[data-cottage-archive-btn] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 28px;\n  height: 28px;\n  padding: 0;\n  border: none;\n  background: transparent;\n  border-radius: 8px;\n  font-size: 15px;\n  line-height: 1;\n  cursor: pointer;\n  transition: background 0.15s ease, transform 0.1s ease;\n  flex-shrink: 0;\n}\nbody[data-dsh-cottage] button[data-cottage-archive-btn]:hover {\n  background: rgba(90, 159, 212, 0.18);\n}\nbody[data-dsh-cottage] button[data-cottage-archive-btn]:active {\n  transform: scale(0.92);\n}\n/* ============================================\n |  归档会话视图（archive view）\n |  原位覆盖工作区列表区域 · 布局与原生树一致\n |  ============================================ */\n/* 工具行解除 60px 宽度限制：第 4 个（归档）按钮不被裁剪，整体左移排列 */\nbody[data-dsh-cottage] [class*=\"_headerActions\"] {\n  max-width: none !important;\n}\n/* 覆盖层容器：absolute 铺满树区域 */\nbody[data-dsh-cottage] [data-cottage-archive-view] {\n  position: absolute;\n  inset: 0;\n  display: flex;\n  flex-direction: column;\n  z-index: 100;\n  background: color-mix(in srgb, var(--dsw-alias-bg-1, #f7fafc) 92%, transparent);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border-radius: 12px;\n  overflow: hidden;\n}\nbody[data-dsh-cottage] .cottage-archive {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  min-height: 0;\n  color: #2b4259;\n}\nbody[data-dsh-cottage] .cottage-archive-head {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  height: 36px;\n  padding: 0 10px;\n  flex: none;\n  border-bottom: 1px solid var(--dsw-alias-divider, rgba(90, 159, 212, 0.25));\n  background: var(--dsw-alias-bg-2, rgba(90, 159, 212, 0.12));\n}\nbody[data-dsh-cottage] .cottage-archive-back {\n  border: none;\n  background: transparent;\n  color: #2f6ea5;\n  font-size: 12px;\n  padding: 3px 8px;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: background 0.15s ease;\n}\nbody[data-dsh-cottage] .cottage-archive-back:hover {\n  background: rgba(90, 159, 212, 0.18);\n}\nbody[data-dsh-cottage] .cottage-archive-title {\n  font-weight: 600;\n  font-size: 13px;\n  flex: 1;\n  white-space: nowrap;\n}\nbody[data-dsh-cottage] .cottage-archive-orders {\n  display: flex;\n  gap: 2px;\n}\nbody[data-dsh-cottage] .cottage-archive-orders button {\n  border: none;\n  background: transparent;\n  color: #4a6a8c;\n  font-size: 11px;\n  padding: 3px 8px;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: background 0.15s ease;\n}\nbody[data-dsh-cottage] .cottage-archive-orders button:hover {\n  background: rgba(90, 159, 212, 0.18);\n}\nbody[data-dsh-cottage] .cottage-archive-orders button.on {\n  background: #5a9fd4;\n  color: #fff;\n}\nbody[data-dsh-cottage] .cottage-archive-error {\n  padding: 8px 10px;\n  font-size: 12px;\n  color: #a05a5a;\n  background: rgba(200, 90, 90, 0.1);\n  border-bottom: 1px solid rgba(200, 90, 90, 0.2);\n}\nbody[data-dsh-cottage] .cottage-archive-list {\n  list-style: none;\n  margin: 0;\n  padding: 6px;\n  overflow-y: auto;\n  flex: 1;\n  min-height: 0;\n}\nbody[data-dsh-cottage] .cottage-archive-empty {\n  padding: 22px 12px;\n  text-align: center;\n  color: #8aa3ba;\n  font-size: 12px;\n}\n/* 行：与原生工作区会话行同高、同圆角、同 hover 背景 */\nbody[data-dsh-cottage] .cottage-archive-item {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  height: 32px;\n  padding: 0 8px;\n  border-radius: 8px;\n  color: var(--dsw-alias-label-primary, #2b4259);\n  transition: background 0.12s ease;\n}\nbody[data-dsh-cottage] .cottage-archive-item:hover {\n  background: var(--dsw-alias-interactive-bg-hover, rgba(90, 159, 212, 0.1));\n}\nbody[data-dsh-cottage] .cottage-archive-meta {\n  flex: 1;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\nbody[data-dsh-cottage] .cottage-archive-label {\n  font-size: 13px;\n  color: var(--dsw-alias-label-primary, #2b4259);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\nbody[data-dsh-cottage] .cottage-archive-time {\n  font-size: 11px;\n  color: var(--dsw-alias-label-tertiary, #8aa3ba);\n}\nbody[data-dsh-cottage] .cottage-archive-actions {\n  display: flex;\n  gap: 6px;\n  flex-shrink: 0;\n}\nbody[data-dsh-cottage] .cottage-archive-actions button {\n  border: 1px solid rgba(90, 159, 212, 0.4);\n  background: rgba(90, 159, 212, 0.1);\n  color: #2f6ea5;\n  font-size: 11px;\n  padding: 3px 10px;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: all 0.15s ease;\n}\nbody[data-dsh-cottage] .cottage-archive-actions button:hover:not(:disabled) {\n  background: #5a9fd4;\n  color: #fff;\n}\nbody[data-dsh-cottage] .cottage-archive-actions button.danger {\n  border-color: rgba(200, 90, 90, 0.4);\n  background: rgba(200, 90, 90, 0.08);\n  color: #a05a5a;\n}\nbody[data-dsh-cottage] .cottage-archive-actions button.danger:hover:not(:disabled) {\n  background: #c05a5a;\n  color: #fff;\n}\nbody[data-dsh-cottage] .cottage-archive-actions button:disabled {\n  opacity: 0.45;\n  cursor: default;\n}\n/* 侧边栏归档入口按钮（添加工作区右侧，第 4 个按钮） */\nbody[data-dsh-cottage] button[data-cottage-archive-btn] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 28px;\n  height: 28px;\n  padding: 0;\n  border: none;\n  background: transparent;\n  border-radius: 50%;\n  font-size: 15px;\n  line-height: 1;\n  cursor: pointer;\n  transition: background 0.15s ease, transform 0.1s ease;\n  flex-shrink: 0;\n}\nbody[data-dsh-cottage] button[data-cottage-archive-btn]:hover {\n  background: rgba(90, 159, 212, 0.18);\n}\nbody[data-dsh-cottage] button[data-cottage-archive-btn]:active {\n  transform: scale(0.92);\n}\n";

const tagId = "@crack/dsh-client-ui-skin-cottage/cottage.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@crack/dsh-client-ui-skin-cottage";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}

var module = { exports: {} }; var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
let react = require("react");
let react_dom_client = require("react-dom/client");
let react_jsx_runtime = require("react/jsx-runtime");

//#region lib/client/archive.js
/**
* Archive view for the Pastoral Cottage skin.
*
* Renders IN PLACE over the workspace browser's tree region (mounted by
* src/client/index.ts into an absolute overlay container) — same layout
* vocabulary as the native list, just archived sessions. Talks to the
* host-half API (src/index.ts). The sidebar entry button (injected next to
* "Add workspace") toggles the view.
*
* Sorting follows the native workspace browser's "view options": reads
* `dsh.workspace.view.v5` (the browser's persisted view state) for the
* initial order and offers the same manual/updated toggle locally.
*/
const VIEW_KEY = "dsh.workspace.view.v5";
async function getArchived() {
	const res = await fetch("/plugins/@crack/dsh-client-ui-skin-cottage/api/archived");
	if (!res.ok) throw new Error("加载归档列表失败");
	return (await res.json()).items ?? [];
}
async function postAction(action, sessionId) {
	const res = await fetch("/plugins/@crack/dsh-client-ui-skin-cottage/api/" + action, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ sessionId })
	});
	if (!res.ok) {
		const data = await res.json().catch(() => null);
		throw new Error(data?.error ?? "操作失败");
	}
}
/** Read the native workspace browser's persisted order preference. */
function readNativeOrder() {
	try {
		const raw = localStorage.getItem(VIEW_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (parsed.orderBy === "manual" || parsed.orderBy === "updated") return parsed.orderBy;
		}
	} catch {}
	return "updated";
}
function formatTime(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function ArchiveView({ onClose }) {
	const [items, setItems] = (0, react.useState)([]);
	const [order, setOrder] = (0, react.useState)(readNativeOrder);
	const [busy, setBusy] = (0, react.useState)(null);
	const [error, setError] = (0, react.useState)(null);
	const refresh = (0, react.useCallback)(async () => {
		try {
			setItems(await getArchived());
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	}, []);
	(0, react.useEffect)(() => {
		refresh();
	}, [refresh]);
	const act = async (action, item) => {
		setBusy(item.sessionId);
		setError(null);
		try {
			await postAction(action, item.sessionId);
			await refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(null);
		}
	};
	const sorted = order === "updated" ? [...items].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")) : items;
	return (0, react_jsx_runtime.jsxs)("div", {
		className: "cottage-archive",
		onClick: (e) => e.stopPropagation(),
		onKeyDown: (e) => e.stopPropagation(),
		children: [
			(0, react_jsx_runtime.jsxs)("div", {
				className: "cottage-archive-head",
				children: [
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "cottage-archive-back",
						onClick: onClose,
						children: "← 返回"
					}),
					(0, react_jsx_runtime.jsxs)("span", {
						className: "cottage-archive-title",
						children: [
							"📦 归档会话 (",
							items.length,
							")"
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: "cottage-archive-orders",
						role: "group",
						"aria-label": "归档排序",
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: order === "updated" ? "on" : "",
							onClick: () => setOrder("updated"),
							children: "按时间"
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: order === "manual" ? "on" : "",
							onClick: () => setOrder("manual"),
							children: "按归档顺序"
						})]
					})
				]
			}),
			error && (0, react_jsx_runtime.jsx)("div", {
				className: "cottage-archive-error",
				children: error
			}),
			(0, react_jsx_runtime.jsxs)("ul", {
				className: "cottage-archive-list",
				children: [sorted.length === 0 && (0, react_jsx_runtime.jsx)("li", {
					className: "cottage-archive-empty",
					children: "暂无归档会话"
				}), sorted.map((item) => (0, react_jsx_runtime.jsxs)("li", {
					className: "cottage-archive-item",
					children: [(0, react_jsx_runtime.jsxs)("div", {
						className: "cottage-archive-meta",
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: "cottage-archive-label",
							title: item.title,
							children: item.title
						}), (0, react_jsx_runtime.jsx)("span", {
							className: "cottage-archive-time",
							children: formatTime(item.createdAt)
						})]
					}), (0, react_jsx_runtime.jsxs)("div", {
						className: "cottage-archive-actions",
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: busy === item.sessionId,
							onClick: () => void act("unarchive", item),
							children: "恢复"
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "danger",
							disabled: busy === item.sessionId,
							onClick: () => {
								if (window.confirm(`删除会话「${item.title}」？\n会话日志将被移除，此操作不可恢复。`)) act("delete-session", item);
							},
							children: "删除"
						})]
					})]
				}, item.sessionId))]
			})
		]
	});
}

//#endregion
//#region lib/client/index.js
const BG = "url(\"/plugins/@crack/dsh-client-ui-skin-cottage/bg.jpg\") center center / cover no-repeat fixed #3a6ea5";
function apply(ctx) {
	const body = document.body;
	body.dataset.dshCottage = "";
	function setBg() {
		body.style.background = BG;
	}
	setBg();
	const obs = new MutationObserver(() => {
		if (body.style.background !== BG) setBg();
	});
	obs.observe(body, {
		attributes: true,
		attributeFilter: ["style"]
	});
	function moveSeat() {
		document.querySelectorAll(".wSkVaW_scrollBody").forEach((sb) => {
			if (sb.querySelector("[data-conversation-composer-overlay]")) return;
			const root = sb.closest(".wSkVaW_root");
			const active = !!root && root.dataset.phase === "active";
			const seat = sb.querySelector(":scope > [data-composer-seat]");
			if (active && seat && seat.parentNode === sb) sb.insertAdjacentElement("afterend", seat);
			else if (!active) (sb.parentNode ? sb.parentNode.querySelectorAll(":scope > [data-composer-seat]") : []).forEach((s) => {
				if (s.parentNode !== sb) sb.appendChild(s);
			});
		});
	}
	function atBottomNow(panel) {
		const floor = Math.max(0, panel.scrollHeight - panel.clientHeight);
		return panel.scrollTop >= floor - 25;
	}
	let seatRO = null;
	let lastSeat = null;
	function onSeatResize() {
		const sb = document.querySelector(".wSkVaW_scrollBody");
		if (sb && atBottomNow(sb)) sb.scrollTop = sb.scrollHeight;
	}
	function ensureArchiveButton() {
		if (document.querySelector("[data-cottage-archive-btn]")) return;
		const labels = [
			"添加工作区",
			"Add workspace",
			"Add workspace…"
		];
		for (const btn of document.querySelectorAll("button[aria-label]")) {
			const label = (btn.getAttribute("aria-label") || "").trim();
			if (labels.includes(label)) {
				const b = document.createElement("button");
				b.type = "button";
				b.dataset.cottageArchiveBtn = "";
				b.title = "归档会话";
				b.setAttribute("aria-label", "归档会话");
				b.textContent = "📦";
				b.addEventListener("click", () => toggleArchiveView());
				btn.insertAdjacentElement("afterend", b);
				return;
			}
		}
	}
	let lastCrumbs = null;
	function onDomChange() {
		ensureArchiveButton();
		moveSeat();
		const seat = document.querySelector("[data-composer-seat]");
		if (seat !== lastSeat) {
			if (seatRO) seatRO.disconnect();
			seatRO = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onSeatResize) : null;
			if (seatRO && seat) seatRO.observe(seat);
			lastSeat = seat;
		}
		const chatActive = !!document.querySelector(".wSkVaW_scrollBody .Md3f7G_root");
		const crumb = document.querySelector(".wSkVaW_crumbs");
		const crumbText = crumb ? crumb.textContent : "";
		const sb = document.querySelector(".wSkVaW_scrollBody");
		if (chatActive && sb) {
			if (crumbText !== lastCrumbs) {
				lastCrumbs = crumbText;
				sb.scrollTop = sb.scrollHeight;
			}
		} else if (!chatActive) lastCrumbs = crumbText;
	}
	onDomChange();
	let archiveRoot = null;
	let archiveHost = null;
	let archiveTarget = null;
	function openArchiveView() {
		const header = document.querySelector("button[data-cottage-archive-btn]")?.parentElement?.parentElement;
		const target = header?.nextElementSibling ?? header?.parentElement;
		if (!target || archiveRoot) return;
		const host = document.createElement("div");
		host.dataset.cottageArchiveView = "";
		target.style.position = "relative";
		target.appendChild(host);
		archiveTarget = target;
		archiveHost = host;
		archiveRoot = (0, react_dom_client.createRoot)(host);
		archiveRoot.render((0, react.createElement)(ArchiveView, { onClose: closeArchiveView }));
	}
	function closeArchiveView() {
		archiveRoot?.unmount();
		archiveRoot = null;
		archiveHost?.remove();
		archiveHost = null;
		if (archiveTarget) archiveTarget.style.position = "";
		archiveTarget = null;
	}
	function toggleArchiveView() {
		if (archiveRoot) closeArchiveView();
		else openArchiveView();
	}
	const obs2 = new MutationObserver(onDomChange);
	obs2.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["data-phase", "data-conversation-composer-overlay"]
	});
	try {
		ctx.effect(() => () => {
			obs.disconnect();
			obs2.disconnect();
			if (seatRO) seatRO.disconnect();
			delete body.dataset.dshCottage;
			body.style.removeProperty("background");
			document.querySelectorAll("[data-cottage-archive-btn]").forEach((el) => el.remove());
			closeArchiveView();
		}, "ui-skin-cottage: background");
	} catch {}
}

//#endregion
exports.apply = apply;
return module.exports; } });
//# sourceMappingURL=client.js.map