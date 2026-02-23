# 🎨 React Playground 

<div align="center">
    <span 
        style="display: inline-block; padding: 0.25rem 0.75rem; 
        margin: 0.25rem; border-radius: 4px; background-color: #61DAFB; color: #000; font-size: 0.875rem; font-weight: 500;">React 19.2.0
    </span>
    <span 
        style="display: inline-block; padding: 0.25rem 0.75rem; 
        margin: 0.25rem; border-radius: 4px; background-color: #3178C6; color: #fff; font-size: 0.875rem; font-weight: 500;">TypeScript 5.9.3
    </span>
    <span 
        style="display: inline-block; padding: 0.25rem 0.75rem; 
        margin: 0.25rem; border-radius: 4px; background-color: #646CFF; color: #fff; font-size: 0.875rem; font-weight: 500;">Vite 7.2.4
    </span>
    <span 
        style="display: inline-block; padding: 0.25rem 0.75rem; 
        margin: 0.25rem; border-radius: 4px; background-color: #F9DC5C; color: #000; font-size: 0.875rem; font-weight: 500;">Babel 7.29.0
    </span>
    <span 
        style="display: inline-block; padding: 0.25rem 0.75rem; 
        margin: 0.25rem; border-radius: 4px; background-color: #007ACC; color: #fff; font-size: 0.875rem; font-weight: 500;">Monaco Editor 4.7.0
    </span>
    <span 
        style="display: inline-block; padding: 0.25rem 0.75rem; 
        margin: 0.25rem; border-radius: 4px; background-color: #22C55E; color: #fff; font-size: 0.875rem; font-weight: 500;">Allotment 1.20.5
    </span>
    <span 
        style="display: inline-block; padding: 0.25rem 0.75rem; 
        margin: 0.25rem; border-radius: 4px; background-color: #CD6799; color: #fff; font-size: 0.875rem; font-weight: 500;">Sass 1.97.3
    </span>
</div>

> **一个轻量、现代的在线 React 代码编辑器**，专为前端开发者打造，支持 TypeScript/TSX 实时编辑与预览，让你在浏览器中快速迭代组件原型。

## ✨ 项目亮点

### 🚀 实时开发体验
- **即时反馈**：修改代码后 **`300ms` 内自动编译并更新预览**
- **智能防抖**：使用 **`Lodash-es` 防抖优化**，避免频繁输入导致性能损耗
- **所见即所得**：`iframe` 实时渲染，**无需手动刷新**

### 🎯 TypeScript 增强
- **类型检查**：实时 `TypeScript` 类型验证
- **智能提示**：通过 `@typescript/ata` 自动获取第三方库类型定义
- **TSX 编译**：浏览器端 `Babel` 编译，支持**最新 `React` 语法**

### 🎨 现代 UI 设计
- **主题切换**：**深色/浅色双模式**，支持系统主题自动适配
- **响应式布局**：拖拽调整面板比例，适配不同屏幕尺寸
- **样式隔离**：`CSS Modules` + `Sass`，彻底告别样式冲突

### 📦 便捷功能
- **多文件管理**：模拟真实项目结构，支持多文件编辑与切换
- **一键导出**：打包为 `ZIP` 文件，本地复现无压力
- **模板系统**：可自定义默认项目模板，快速启动新项目

## 🚀 功能特性

- **Monaco 编辑器**：基于 VS Code 同款编辑器，提供语法高亮、智能提示和自动补全
- **实时预览**：iframe 实时渲染，所见即所得，无需手动刷新
- **TSX 即时编译**：浏览器端 Babel 编译，TypeScript 类型检查与代码提示无缝衔接
- **主题切换**：支持深色/浅色双模式，适配不同开发场景
- **多文件管理**：多文件编辑与切换，模拟真实项目结构
- **拖拽布局**：灵活调整编辑器与预览面板比例，提升开发效率
- **代码导出**：一键打包下载为 ZIP，本地复现无压力
- **样式隔离**：CSS Modules + Sass，彻底告别样式冲突

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.0 | 现代 UI 框架，函数式组件 + Hooks |
| TypeScript | 5.9.3 | 类型安全，智能提示 |
| Vite | 7.2.4 | 极速构建与热重载 |
| Babel | 7.29.0 | 浏览器端 TSX/JSX 编译 |
| Monaco Editor | 4.7.0 | 专业代码编辑体验 |
| Allotment | 1.20.5 | 可拖拽面板布局 |
| Sass | 1.97.3 | 增强 CSS 能力 |
| Lodash-es | 4.17.23 | 防抖等工具函数 |
| JSZip + File-Saver | 最新 | 代码打包下载 |

## 📁 项目结构

```plaintext
src/
├── Components/
│   ├── CodeEditor/            # 代码编辑器模块
│   │   ├── Editor.tsx         # Monaco 编辑器主体
│   │   ├── FileNameItem.tsx   # 单个文件标签
│   │   ├── FileNameList.tsx   # 文件列表管理
│   │   └── ata.ts             # TypeScript 自动类型获取配置
│   ├── Header/                # 顶部导航与操作栏
│   │   └── icons/             # 图标资源
│   └── Preview/               # 实时预览模块
│       ├── compiler.ts        # TSX 编译核心逻辑
│       └── iframe.html        # 预览容器模板
├── ReactPlayground/           # 应用核心逻辑
│   ├── template/              # 默认项目模板
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── import-map.json
│   ├── PlaygroundContext.tsx  # 全局状态管理
│   ├── files.ts               # 初始文件配置
│   ├── utils.ts               # 工具函数
│   └── index.tsx              # 主容器组件
├── App.tsx                    # 应用入口
└── main.tsx                   # React 挂载点
```

## 🏃 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

### 4. 运行代码检查

```bash
npm run lint
```

### 5. 预览生产构建

```bash
npm run preview
```

## 🔍 核心实现原理

### 1. TSX 实时编译

使用 `@babel/standalone` 在浏览器端将 TSX 代码转换为可执行的 JavaScript：

```typescript
import Babel from '@babel/standalone';

const result = Babel.transform(code, {
    presets: ['react', 'typescript'],
    filename: 'App.tsx'
});
```

### 2. 预览渲染

将编译后的代码封装为 Blob URL，注入 iframe 实现实时预览：

```typescript
const blob = new Blob([compiledCode], { type: 'application/javascript' });
const url = URL.createObjectURL(blob);
```

### 3. TypeScript 智能提示

通过 `@typescript/ata` 自动获取第三方库类型定义，提供精准的代码补全：

```typescript
import { createTypeAcquisitionWorker } from '@typescript/ata';

const ata = createTypeAcquisitionWorker({
    worker: new Worker(new URL('./ata.worker.ts', import.meta.url))
});
```

### 4. 样式隔离

采用 CSS Modules + Sass 方案，确保组件样式互不干扰：

```typescript
import styles from './Editor.module.scss';

<div className={styles.editorContainer}>...</div>
```

### 5. 防抖优化

使用 `lodash-es` 的防抖函数，避免频繁输入导致的重复编译：

```typescript
import { debounce } from 'lodash-es';

const debouncedCompile = debounce(compileCode, 300);
```

## 🧩 开发指南

### 添加新功能

1. 在 `src/Components/` 下创建新组件目录
2. 使用 `.module.scss` 编写样式，确保隔离
3. 通过 `PlaygroundContext` 共享全局状态
4. 遵循 TypeScript 类型规范，完善类型定义

### 修改默认模板

模板文件位于 `src/ReactPlayground/template/`：
- `App.tsx`：默认 React 组件
- `main.tsx`：应用入口
- `import-map.json`：ES Module 导入映射（可扩展第三方库支持）

## 📦 依赖说明

### 生产依赖

- `@babel/core` & `@babel/standalone`：浏览器端代码编译
- `@monaco-editor/react`：专业代码编辑体验
- `@typescript/ata`：TypeScript 智能提示
- `allotment`：可拖拽面板布局
- `file-saver` & `jszip`：代码打包下载
- `lodash-es`：工具函数库
- `react` & `react-dom`：UI 框架核心

### 开发依赖

- `typescript`：类型检查与编译
- `vite`：现代构建工具
- `eslint`：代码规范检查
- `sass`：CSS 预处理器
- `@vitejs/plugin-react`：Vite React 插件

## 🤝 贡献指南

1. `Fork` 本仓库
2. 创建特性分支：`git checkout -b feature/YourFeature`
3. 提交更改：`git commit -m 'Add some YourFeature'`
4. 推送到分支：`git push origin feature/YourFeature`
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](https://github.com/harvest0623/React-Playground/blob/main/LICENSE) 文件。

## 📞 联系方式

- GitHub Issues: [提交问题](https://github.com/harvest0623/React-Playground/issues)
- 邮箱：3367741939@qq.com or harvest060523@gmail.com

**如果这个项目对你有帮助，欢迎给一个 ⭐ Star！**