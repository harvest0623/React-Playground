# React Playground

> 一个功能丰富的在线 React 代码编辑器和 playground，支持实时预览、多人协作、AI 代码助手等 30+ 功能。

![React Playground](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Vite](https://img.shields.io/badge/Vite-7-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ 核心特性

### 编辑器
- Monaco Editor — VS Code 同款编辑器内核
- 10+ 编辑器主题（Monokai, Dracula, Nord, One Dark Pro...）
- 实时 TypeScript/TSX 编译和预览
- 内联错误标注（红色波浪线）
- 代码格式化（Prettier）

### 协作 & 分享
- WebSocket 实时多人协作
- 权限管理（Owner / Editor / Viewer）
- 邀请链接分享
- 一键分享（URL 编码）

### AI 代码助手
- 内嵌 AI 聊天面板
- 流式响应（逐字显示）
- 快捷操作：解释代码 / 修复错误 / 生成组件 / 优化代码
- 代码块一键插入编辑器

### 开发体验
- 模板选择器（6 个预设模板）
- 文件搜索（Ctrl+P）+ Command Palette（Ctrl+Shift+P）
- 拖拽上传文件
- 键盘快捷键
- 状态持久化（IndexedDB）
- 版本历史 + Diff 对比
- 国际化（中文 / English）

### 可视化工具
- CSS 可视化编辑器（颜色选择器、滑块、下拉框）
- 组件 Props 编辑器
- 预览区多设备模拟（桌面 / 平板 / 手机）
- 录制预览操作
- 导出为 ZIP / 独立 HTML

### UI/UX
- 启动动画（Splash Screen）
- 骨架屏加载态
- 深色/浅色主题
- 拖拽调整分栏
- 响应式布局（移动端适配）

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- npm >= 9

### 安装运行

```bash
# 克隆项目
git clone https://github.com/harvest0623/React-Playground.git
cd React-Playground

# 安装前端依赖
cd frontend
npm install
npm run dev

# 在另一个终端启动后端（如需协作功能）
cd backend
npm install
npm run dev
```

### 访问地址
- 前端：http://localhost:5173
- 后端 API：http://localhost:3000
- WebSocket：ws://localhost:3001

## 📁 项目结构

```
React-Playground/
├── frontend/                 # 前端（React + Vite + TypeScript）
│   ├── src/
│   │   ├── Components/       # UI 组件
│   │   │   ├── AIAssistant/  # AI 代码助手
│   │   │   ├── CodeEditor/   # Monaco 编辑器
│   │   │   ├── CollaborationButton/  # 协作按钮
│   │   │   ├── CollaborationPanel/   # 协作面板
│   │   │   ├── CommandPalette/       # 命令面板
│   │   │   ├── CSSVisualEditor/      # CSS 可视化编辑器
│   │   │   ├── DiffViewer/           # Diff 对比视图
│   │   │   ├── PropsEditor/          # Props 编辑器
│   │   │   ├── ThemeStore/           # 编辑器主题商店
│   │   │   └── ...
│   │   ├── ReactPlayground/  # 核心模块
│   │   ├── Collaboration/    # 协作状态管理
│   │   └── i18n/             # 国际化
│   └── ...
├── backend/                  # 后端（Next.js + WebSocket）
│   ├── src/
│   │   ├── lib/              # WebSocket 服务器
│   │   └── app/api/          # REST API
│   └── ...
└── README.md
```

## 🛠 技术栈

| 技术 | 用途 |
|------|------|
| React 19 | UI 框架 |
| TypeScript 5.9 | 类型安全 |
| Vite 7 | 构建工具 |
| Monaco Editor | 代码编辑器 |
| Babel Standalone | TSX/TS 实时编译 |
| Allotment | 可拖拽分栏 |
| WebSocket | 实时通信 |
| Next.js 16 | 后端框架 |
| IndexedDB | 本地持久化 |
| Prettier | 代码格式化 |

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+Z | 撤销 |
| Ctrl+Shift+Z | 重做 |
| Ctrl+M | 格式化代码 |
| Ctrl+P | 文件搜索 |
| Ctrl+Shift+P | 命令面板 |
| Escape | 关闭面板 |

## 📄 License

MIT