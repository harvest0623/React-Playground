# 将 tsx 编译为 js
- @babel/standalone (babel的浏览器版本)
- @types/babel__standalone (babel的浏览器版本的类型定义)
- 下载：npm i @babel/standalone @types/babel__standalone

# 资源处理
**比如：**
- import { useState } from 'react';
- import Abc from './Abc.tsx';

**需要用到：babel (parse、transform、generate)  AST -- 抽象语法树**

`const url = URL.createObjectURL(new Blob([code1], { type: 'application/javascript' }));` 将某份资源处理成一个 **blob 地址**，并在 babel 编译的过程中**将 from "xxx" 修改成 from "blob:http://xxxxxx"**

# babel
- @babel/core (babel的核心版本)
- @types/babel__core (babel的核心版本的类型定义)
- 下载：npm i @babel/core @types/babel__core

# 引入 React
```html
<script type="importmap">
    {
        "imports": {
            "react": "https://esm.sh/react@18.2.0"
        }
    }
</script>

<script type="module">
    import React from "react";
    console.log(React);
</script>
```

# 代码提示器
- 下载：npm i @monaco-editor/react

# 预览
- **iframe 标签**
- 左侧的 tsx 代码被编译，编译完后引入带一个 html文件中，并将这个 html 文件展示在iframe中

# allotment 拖拽组件
- 下载：npm i allotment

# 样式隔离
- index.module.scss 将组件的样式隔离起来，不会影响到其他组件的样式
- 下载：npm i -D sass
- 使用：import styles from './index.module.scss'
- 组件中使用：className={styles.组件名}
- 组件中使用：{...styles.组件名}

# 代码提示器 @monaco-editor/react 代码提示
- 第三方的库需要代码提示：@typescript/ata
- 下载：npm i @typescript/ata

# 防抖
- 用于处理用户在超出时间才重新渲染
- 下载：npm i lodash-es @types/lodash-es  --save