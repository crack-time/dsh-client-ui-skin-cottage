# dsh-client-ui-skin-cottage

田园小屋皮肤（Pastoral Cottage Skin）—— 面向 DeepSeek Harness Web GUI（dsh web）的纯 UI 换肤插件。

![田园小屋皮肤](docs/screenshot.jpg)

## 功能

### 壁纸与整体氛围
- 3840x2160 田园风格壁纸全屏铺底（host 路由 serve，bundle 保持 20KB）
- `#root` / 布局 frame 全透明，壁纸完全透出；明暗主题自动适配
- 天空蓝品牌色、柔和边框、细滚动条；tooltip 深底白字（修复白底白字不可见问题）

### 面板与透明度（设计 token 覆盖）
- 中央消息面板：与输入框同宽（780px）居中、85% 不透明、直角，左右边缘 2px 渐变淡出，与壁纸平滑衔接
- 顶部标题栏、侧边栏、输入区（统计条 + 输入卡）统一使用 `--dsw-specific-input-major`（85%），透明度一致
- 消息内容保持 748px 阅读宽度

### 滚动与输入区布局（内置浏览器端 JS 行为）
- 输入框座位整体移出滚动容器：消息滚动在输入框顶部截断，文本不会从输入框后面穿过
- 会话切换自动滚动到底部（检测头部面包屑变化 + 短暂钉底窗口，加载历史/新消息时保持底部）
- 自绘"回到底部"按钮：水平居中于面板、位于输入框上方，滚离底部自动出现，点击平滑回底（原生按钮隐藏）
- 保留 dsh 原生滚动监听，流式输出自动跟随

### 特殊状态
- 新建对话（hero 欢迎态）：解除面板约束，恢复全宽布局，标题与输入框居中悬浮于壁纸
- 轨迹页（点击"轨迹"后展示的一切，含弹层/菜单）：皮肤规则通过 `:not(:has(.qBU-ya_root))` 自动失效，页面保持 dsh 默认外观（明暗主题均生效）
- 会话统计条加宽至与输入框同宽，完整显示轮次/步数/耗时等指标
- 侧栏会话列表底部渐隐条移除；折叠按钮微调（不贴右缘）


### 归档会话管理（皮肤扩展）
- 侧边栏"添加工作区"按钮右侧新增 📦 归档入口
- 面板列出全部归档会话（标签 = 工作目录名，时间 = 创建时间）
- 分组与排序跟随原生"视图选项"（按工作区/单列、按时间/手动），分组可折叠，与原生共享同一持久化状态（`dsh.workspace.view.v5`）
- 每行 hover 出现三点菜单：**重命名 / 还原 / 删除**
  - 重命名：原生 Modal 弹窗（复用 `@deepseek-ai/dsh-client-ui-primitives` 的 Modal/Button 组件），自动聚焦全选、中文输入法（IME）保护、Enter 确认、Escape/遮罩关闭、错误内联提示——与工作区会话重命名交互一致
  - 还原（unarchive）：回到原工作区位置
  - 删除：原生 Modal 确认弹窗（红色危险按钮 + 后果说明 + 进行中状态），移除日志文件，不可恢复
- dsh 原生只有归档（archiveSession），重命名/恢复/删除由本插件 host 面实现：
  - 重命名 = 官方持久化路径（load → prepare → append session/title → persistence.append → projectionCache.write）
  - 恢复 = workspaceRegistry 官方写路径（enqueueOperation/setState）对称操作
  - 删除 = 移除持久化日志 + 刷新 registry 索引 + 清归档集，并 emit `session/disposed` 让浏览器列表即时移除
- API：`/plugins/@crack/dsh-client-ui-skin-cottage/api`（GET /archived、POST /rename-session、POST /unarchive、POST /delete-session）

> 卸载即完全恢复（host 面除 bg.jpg 外新增归档 API 路由）

## 安装

插件通过符号链接安装到 dsh web profile：

```powershell
# 1. 链接安装（一次性）
dsh plugin --profile web add "link:E:\path\to\dsh-client-ui-skin-cottage"

# 2. 在 profile patch 中注册插件行
#    编辑 C:\Users\<you>\.dsh\profiles\web\cordis.patch.yml，追加：
#    - insert:
#        - id: ui-skin-cottage
#          name: '@crack/dsh-client-ui-skin-cottage'

# 3. 保存后 dsh 自动热重载（boot HMR 重读 patch），无需重启
```

## 开发

需要 Node + pnpm。

```powershell
pnpm install          # 安装构建链（typescript / tsdown）
pnpm run build        # 一次构建：tsc(host) + tsc(client) + tsdown
pnpm run watch        # 监听模式：改 src/ 自动重建
pnpm run typecheck    # 类型检查
```

- 编辑 `src/client/cottage.css`（样式）或 `src/client/index.ts`（浏览器端逻辑）
- 替换 `assets/cottage-bg.jpg`（壁纸原图，由 host 路由 serve）
- 构建完成后浏览器自动热替换（client-hmr，无需刷新/重启）

## 卸载

1. 删除 `cordis.patch.yml` 中的 `ui-skin-cottage` 注册行
2. 重启 dsh web
3. （可选）`dsh plugin --profile web remove @crack/dsh-client-ui-skin-cottage`

## 项目结构

```
dsh-client-ui-skin-cottage/
├── src/index.ts                    # host 面：注册 bg.jpg 路由
├── src/client/index.ts             # 浏览器端逻辑（apply）
├── src/client/archive.tsx          # 归档视图 React 组件（原生 Modal/Button 复用）
├── src/client/cottage.css   # 皮肤 CSS 源文件（构建时注入）
├── assets/cottage-bg.jpg           # 壁纸原图（host 路由 serve）
├── scripts/cottage-inline-plugin.mjs  # tsdown 插件：内联 CSS
├── scripts/dev.mjs                 # watch 并行构建
├── tsconfig.json / tsconfig.client.json  # host/client 双 program
├── tsdown.config.ts                # client bundle 协议构建
├── lib/client.js                   # 浏览器端 bundle（已构建，clone 即用）
├── lib/index.js                    # 宿主端空入口
├── cordis.patch.yml                # 插件自带注册 patch（参考）
├── skin.json                       # 皮肤元数据
└── package.json                    # dsh.client 声明
```

## 图片来源与版权

- 壁纸：《田园小屋风景》4K（3840x2160），来源于 [彼岸图网](https://pic.netbian.com/tupian/34434.html)（[原文页面](https://pic.netbian.com/tupian/34434.html)）
- 彼岸图网声明：壁纸图片资源来源于互联网和网友分享，**请勿用于商业用途**，图片版权归原创作者所有
- 本插件仅供个人学习与使用，**禁止任何商业用途**；如需商用或分发，请自行替换为你拥有版权的图片
- 如涉及侵权，请联系原作者或彼岸图网（客服QQ55346968）处理，作者会第一时间移除相关资源

## 说明

- 插件通过覆盖 DSH 的 CSS 设计 token（`--dsw-alias-*`、`--dsw-specific-*`）+ 少量浏览器端 JS 行为（座位重排、滚动管理、自绘按钮）生效，不修改 DSH 自带代码；归档弹窗直接复用平台模块 `@deepseek-ai/dsh-client-ui-primitives`（Modal/Button），保证与原生 UI 像素级一致
- 壁纸为个人图片，如用于分发请替换为你拥有版权的图片
- DSH 版本升级若改变 token 名或组件结构，需同步微调皮肤 CSS