# Markdown Reader

一个简洁的桌面 Markdown 阅读与编辑器，第一版采用左侧编辑、右侧预览的布局。

## 已实现

- 打开 `.md`、`.markdown`、`.mdown`、`.mkd` 文件
- 新建、保存、另存为，并自动补齐 `.md` 扩展名
- 未保存内容在新建、打开和关闭窗口前提醒
- 菜单与快捷键：新建、打开、保存、另存为、关闭、撤销与重做
- 标题、列表、表格、引用、链接、图片与代码高亮
- 同目录内的相对路径图片
- Markdown HTML 安全过滤；渲染页面无法直接访问文件系统

## 使用

开发环境需要 Node.js 22+ 与 pnpm 11：

```bash
pnpm install --frozen-lockfile
pnpm dev
```

验证与构建：

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm dist
```

`pnpm dist` 会在 `dist/` 生成可打开的 macOS 应用目录。生成可分发的 DMG、Windows 或 Linux 安装包是下一阶段工作。

## 安全边界

- 文件选择和写入均由 Electron 主进程执行；网页界面只通过有限的预加载接口通信。
- 已关闭 Node 集成并启用上下文隔离与沙箱。
- 脚本、事件属性和不受信任 HTML 会在预览前移除。
- 本地图片仅允许读取 Markdown 文件同目录及其子目录中的相对路径。
