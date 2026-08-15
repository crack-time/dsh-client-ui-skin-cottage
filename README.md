# dsh-client-ui-skin-cottage

田园小屋皮肤（Pastoral Cottage Skin）—— 面向 DeepSeek Harness Web GUI（dsh web）的纯 UI 换肤插件。

![screenshot placeholder]

## 功能

- 3840x2160 田园风格壁纸全屏铺底（base64 内嵌，无额外静态资源请求）
- 所有面板半透明毛玻璃效果（通过覆盖 DSH 设计 token 实现，明暗主题自动适配）
- 天空蓝品牌色、柔和边框、细滚动条、圆角细节
- 侧栏折叠按钮微调（不贴右缘，避免遮挡）
- tooltip 深底白字（修复白底白字不可见问题）
- 纯浏览器端插件：不注册宿主服务，卸载即完全恢复

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

# 3. 重启 dsh web 并刷新浏览器
```

## 自定义

编辑 `src/client/cottage.module.css`（样式）或替换 `assets/cottage-bg-b64.txt`（壁纸 base64），然后：

```powershell
node build-client.js   # 重建 lib/client.js
# 重启 dsh web，刷新浏览器
```

壁纸压缩：PowerShell + System.Drawing 将任意 JPEG 缩放到 3840x2160 质量 72 后转 base64 写入 `assets/cottage-bg-b64.txt`。

## 卸载

1. 删除 `cordis.patch.yml` 中的 `ui-skin-cottage` 注册行
2. 重启 dsh web
3. （可选）`dsh plugin --profile web remove @crack/dsh-client-ui-skin-cottage`

## 项目结构

```
dsh-client-ui-skin-cottage/
├── src/client/cottage.module.css   # 皮肤 CSS 源文件（构建时注入）
├── assets/cottage-bg-b64.txt       # 壁纸 base64（4K JPEG）
├── assets/cottage-bg.jpg           # 壁纸原图备份
├── build-client.js                 # 构建脚本：CSS + base64 -> lib/client.js
├── lib/client.js                   # 浏览器端 bundle（已构建，clone 即用）
├── lib/index.js                    # 宿主端空入口
├── cordis.patch.yml                # 插件自带注册 patch（参考）
├── skin.json                       # 皮肤元数据
└── package.json                    # dsh.client 声明
```

## 说明

- 插件通过覆盖 DSH 的 CSS 设计 token（`--dsw-alias-*`、`--dsw-specific-*`）生效，不修改 DSH 自带代码
- 壁纸为个人图片，如用于分发请替换为你拥有版权的图片
- DSH 版本升级若改变 token 名或组件结构，需同步微调皮肤 CSS
