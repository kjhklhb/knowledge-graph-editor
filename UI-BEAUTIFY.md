# 🎨 知识图谱编辑器 — UI 美化设计建议书

> **版本**: v1.0  
> **日期**: 2026-06  
> **适用对象**: 给编写代码的 AI 或前端开发者  
> **目标**: 在保持现有架构不变的前提下，将软件 UI 提升到专业桌面工具水准

---

## 目录

- [一、项目 UI 现状分析](#一项目-ui-现状分析)
- [二、色彩与质感升级](#二色彩与质感升级)
- [三、布局与间距优化](#三布局与间距优化)
- [四、组件级美化](#四组件级美化)
- [五、动效与微交互](#五动效与微交互)
- [六、vis-network 节点/边视觉增强](#六vis-network-节点边视觉增强)
- [七、图标系统](#七图标系统)
- [八、实现优先级](#八实现优先级)
- [九、技术约束与注意事项](#九技术约束与注意事项)

---

## 一、项目 UI 现状分析

| 维度 | 现状 | 可提升空间 |
|------|------|-----------|
| **色彩系统** | 暗色主题，CSS 变量统一管理，冰蓝主色 `#4da6ff` | 日间模式不够完善，部分组件主题切换不彻底 |
| **工具栏** | Emoji 图标 + 文字按钮，毛玻璃背景 | 可用 SVG 图标提升质感，按钮间距可优化 |
| **属性面板** | 320px 宽毛玻璃面板，基本表单组件 | 间距、动效、视觉层级可提升 |
| **图谱画布** | vis-network 原生渲染，深空背景 | 节点样式可更现代（渐变感、光晕选中） |
| **标签页弹窗** | contenteditable 富文本编辑器 | 工具栏布局可更紧凑，排版可优化 |
| **底部状态栏** | 36px 高，简单文字 | 可增加微交互和状态指示 |
| **动效** | fadeUp 入场动画，基础 hover 过渡 | 可增加更多微交互动效和过渡反馈 |
| **整体一致性** | 电影感暗色风格基本统一 | 组件视觉层级可更分明，间距系统可更精细 |

---

## 二、色彩与质感升级

### 2.1 深色模式调整

当前 CSS 变量体系良好，但背景可更富层次感：

- **应用背景**：使用极深蓝黑渐变，不要纯黑
- **卡片/面板**：半透明毛玻璃叠加双层背景纹理
- **画布背景**：叠加 subtle 网格纹理，制造「无限画布」感

```css
/* 应用主背景 — 深蓝黑渐变 */
body {
  background: radial-gradient(ellipse at 50% 0%, #0f1525 0%, #080a10 100%);
}

/* 面板 — 多层毛玻璃 */
.panel {
  background: 
    linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%),
    rgba(12, 14, 22, 0.85);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
}

/* 画布网格纹理 */
#graph-container {
  background-image: 
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

### 2.2 日间模式完整设计

当前日间模式（`.theme-day`）需要完整覆盖所有组件。完整配色方案：

| 变量 | 暗色值 | 日间值 |
|------|--------|--------|
| `--bg-deep` | `#080a10` | `#f5f6fa` |
| `--bg-primary` | `#0c0e16` | `#ffffff` |
| `--bg-secondary` | `#11141f` | `#f0f2f7` |
| `--bg-surface` | `#181c2a` | `#e8ebf2` |
| `--accent` | `#4da6ff` | `#3b8ee5` |
| `--text-primary` | `#ffffff` | `#1a1a2e` |
| `--text-secondary` | `#f0f4ff` | `#2d2d44` |
| `--text-tertiary` | `rgba(255,255,255,0.55)` | `rgba(0,0,0,0.5)` |
| `--shadow-sm` | `0 2px 12px rgba(0,0,0,0.4)` | `0 2px 12px rgba(0,0,0,0.06)` |

确保 `.theme-day` 下**所有**使用了 CSS 变量的属性都被正确覆盖，不留遗漏。

### 2.3 霓虹光晕系统

为可交互元素增加统一的光晕体系：

| 状态 | 光晕效果 |
|------|---------|
| **hover** | `box-shadow: 0 0 20px rgba(77, 166, 255, 0.15)` |
| **focus/active** | `box-shadow: 0 0 30px rgba(77, 166, 255, 0.25)` |
| **选中（图谱节点）** | 利用 vis-network 的 `color.highlight` + `borderWidthSelected` |
| **按钮主色** | `box-shadow: 0 4px 24px rgba(77, 166, 255, 0.2)` |

---

## 三、布局与间距优化

### 3.1 工具栏重设计

```
┌─────────────────────────────────────────────────────────────┐
│ [⌘ 知识图谱]  │  📄新建 │ 📂打开 │ 💾保存 │ 📊示例  │  ...  │  🔍 搜索...    [🌙] [⌨️] [● 就绪] │
└─────────────────────────────────────────────────────────────┘
```

改动细则：

| 项目 | 当前 | 建议 |
|------|------|------|
| 工具栏高度 | 64px | **52px**（更紧凑） |
| Logo 区域 | 纯文字 | 增加视觉徽标或图形化图标 |
| 按钮间距 | 2px | **分组留白 16px**，组内 4px |
| 按钮样式 | 全圆角 pill | **8px 圆角**，更现代 |
| 搜索框 | 160px 固定 | 聚焦时**宽度微扩**动画 |
| 状态指示 | 文字「就绪」 | **圆点指示器**（绿/黄/红） |

### 3.2 右侧属性面板优化

当前面板宽度 320px，三种模式（空/节点/边/添加边）：

- **标题**：更小字号 + 更轻字重，大写字母间距
- **表单标签**：`text-transform: uppercase; letter-spacing: 0.8px; font-size: 10px; color: var(--text-muted)`
- **输入框聚焦**：边框颜色过渡 + 左侧 2px accent 竖条（用 `box-shadow` 模拟）
- **颜色选择器**：自定义圆形预览，隐藏原生取色器样式
- **滚动条**：WebKit 自定义细滚动条（已实现，宽度 3px 可保持）
- **按钮组**：靠右对齐，主次按钮视觉层级分明

### 3.3 底部状态栏升级

```
节点: 12 | 边: 15                    ● 就绪                    布局: 力导向
```

| 项目 | 当前 | 建议 |
|------|------|------|
| 高度 | 36px | **28px** |
| 状态指示 | 文字 | 左侧**小圆点**（绿色=就绪，黄色=加载，红色=错误） |
| 文字风格 | 普通字体 | **等宽字体** `font-family: var(--font-mono)` |
| 切换动画 | 无 | 状态文字切换时**淡入淡出** |

---

## 四、组件级美化

### 4.1 按钮系统

建立三级按钮体系：

#### 主按钮（主要操作）
```css
.btn-primary {
  background: linear-gradient(135deg, var(--accent), #3a8be5);
  border: none;
  border-radius: 8px;
  color: #fff;
  padding: 8px 20px;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 2px 12px rgba(77, 166, 255, 0.2);
  cursor: pointer;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(77, 166, 255, 0.35);
}
.btn-primary:active {
  transform: translateY(0);
}
```

#### 次按钮（辅助操作）
```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: var(--text-secondary);
  padding: 8px 20px;
  transition: all 0.25s ease;
  cursor: pointer;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}
```

#### 工具栏按钮（紧凑轻量）
```css
.tool-btn {
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  color: var(--text-tertiary);
  font-size: 12px;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.tool-btn:hover {
  background: var(--accent-subtle);
  color: var(--text-primary);
}
```

### 4.2 下拉选择框

自定义 `<select>` 样式，覆盖原生：

```css
.tool-select {
  padding: 6px 32px 6px 14px;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-tertiary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
  /* 自定义箭头 SVG */
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,...");
  background-repeat: no-repeat;
  background-position: right 12px center;
}
.tool-select:hover {
  border-color: rgba(77, 166, 255, 0.2);
  color: var(--text-secondary);
}
.tool-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-subtle);
}
```

### 4.3 标签页弹窗（富文本编辑器）

```
┌─ 节点标签页 ───────────────────────────────────── [💾 保存] [✕] ─┐
│ ● 人工智能                              Lv.1  #a1b2c3d4        │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ [字号▼] │ [B] [I] [U] [S] │ [🖍️] [🎨] │ [≡] [≡] [≡] │ [•] [1.] │ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │                                                              │ │
│ │             在此编写节点的详细知识...                          │ │
│ │                                                              │ │
│ │                                                              │ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │ 字数: 128                                    点击「保存」或 Ctrl+S │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

优化要点：
- 标题栏左对齐：**色点 + 标题输入框 + 层级标签 + ID**
- 格式工具栏紧凑图标按钮，hover 浅色背景
- 编辑器区域舒适排版：`line-height: 1.8; max-width: 720px; margin: 0 auto;`
- 底部字数统计等宽字体，右侧对齐
- 弹窗宽高比合理，大屏居中，宽度不超过 860px

### 4.4 快捷键帮助面板

```
┌─ ⌨️ 快捷键 ────────────────────────────────────────── [✕] ─┐
│                                                              │
│  图谱操作          编辑            布局            导航       │
│  Ctrl+N  新建     A     添加节点   L    整理布局   双击 标签页 │
│  Ctrl+O  打开     E     添加边     1    力导向     Esc  取消   │
│  Ctrl+S  保存     Del   删除选中   2    层次       Tab  搜索   │
│  Ctrl+A  全选     F2    编辑标签   3    辐射       ?    帮助   │
│                   Space 连接                                │
└──────────────────────────────────────────────────────────────┘
```

优化要点：
- 网格布局（`grid-template-columns: 1fr 1fr`），每列一个快捷键分组
- 键帽 `<kbd>` 样式：深色背景、圆角、内阴影、等宽字体
- 每组标题小号大写字母

### 4.5 空状态提示

```
          🌐
   图 谱 为 空
    
「示例」加载数据 · 点击「节点」创建 · 按 ⌘ 查看快捷键
```

- 居中的大号图标 + 标题 + 说明文字
- 图标微弱的漂浮动画 `@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`
- 说明文字建议下一步操作，增加「快速开始」引导感

---

## 五、动效与微交互

### 5.1 入场动画

| 元素 | 动画 | 延迟 |
|------|------|------|
| 工具栏 | fadeIn + translateY(-20px) | 0ms |
| 画布 | fadeIn | 100ms |
| 属性面板 | slideInRight | 200ms |
| 底部状态栏 | fadeIn + translateY(20px) | 300ms |
| 工具栏按钮 | fadeUp stagger | 依次 50ms 间隔 |

```css
/* stagger 延迟通过 JS 动态添加或使用相邻兄弟选择器 */
.tool-btn:nth-child(1) { animation-delay: 0ms; }
.tool-btn:nth-child(2) { animation-delay: 50ms; }
.tool-btn:nth-child(3) { animation-delay: 100ms; }
/* ... */

/* 尊重用户系统设置 */
@media (prefers-reduced-motion: no-preference) {
  .tool-btn { animation: fadeUp 0.5s var(--ease-out) both; }
}
```

### 5.2 hover/active 反馈

- 所有可交互元素 hover 时 0.2s 过渡
- 按钮点击时微下压 `scale(0.97)`
- 输入框聚焦时左侧出现 2px accent 竖条

```css
.form-input:focus {
  border-color: var(--accent);
  box-shadow: 
    inset 2px 0 0 var(--accent),
    0 0 0 3px var(--accent-subtle);
}
```

### 5.3 状态过渡

- 面板切换（空/节点/边/添加边）时 fade + 轻微 slide
- 搜索结果显示/隐藏时节点淡入淡出
- 保存成功时状态栏闪烁绿色

### 5.4 加载与进度

- 后端操作期间在顶部显示**微妙的进度条**（3px 高，从左到右渐变流动）
- 或状态栏显示旋转点指示器

```css
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.loading-bar {
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## 六、vis-network 节点/边视觉增强

### 6.1 节点样式

在 `app.js` 的 `initNetwork()` 中的 `base` 对象修改：

```javascript
nodes: {
  shape: 'dot',
  size: 28,
  borderWidth: 2,
  borderWidthSelected: 3,
  font: {
    size: 13,
    face: 'Inter, Segoe UI, PingFang SC, sans-serif',
    strokeWidth: 3,
    strokeColor: '#080a10',
    color: '#ffffff',
  },
  shadow: {
    enabled: true,
    size: 8,
    x: 0,
    y: 2,
    color: 'rgba(0,0,0,0.4)',
  },
  // 选中时霓虹光晕
  color: {
    highlight: {
      border: '#4da6ff',
      background: '...', // 由 Cc() 函数动态生成
    },
  },
}
```

### 6.2 颜色工具函数增强

当前 `Cc()` 函数生成节点颜色对象。可增加渐变感：

```javascript
function Cc(color) {
  // 让边框比背景稍暗，形成微妙的立体感
  return {
    background: color,
    border: darken(color, 0.2),
    highlight: {
      background: lighten(color, 0.15),
      border: '#4da6ff',  // 选中时统一冰蓝边框
    },
    hover: {
      background: lighten(color, 0.08),
      border: darken(color, 0.1),
    },
  };
}
```

### 6.3 边样式

```javascript
edges: {
  width: 2,
  widthSelected: 3,
  smooth: {
    type: 'curvedCW',
    roundness: 0.15,
  },
  font: {
    size: 11,
    strokeWidth: 3,
    strokeColor: '#080a10',
    align: 'middle',
  },
  arrows: {
    to: {
      enabled: true,
      scaleFactor: 0.6,
    },
  },
  color: {
    inherit: false,  // 不继承节点颜色，使用自定义颜色
    highlight: '#4da6ff',
  },
  selectionWidth: 2,
}
```

### 6.4 交互增强

| 交互 | 效果 | 实现方式 |
|------|------|---------|
| 悬停节点 | 微放大 + 光晕 | vis-network `hover: true` + `scaling` 配置 |
| 拖拽节点 | 阴影跟随 | vis-network 原生 + `shadow` 配置 |
| 选中节点 | 霓虹外圈 | `color.highlight` + `borderWidthSelected: 3` |
| 导航按钮 | 自定义样式 | CSS 覆盖 `.vis-navigation .vis-button` |

---

## 七、图标系统

### 7.1 统一图标方案

将 Emoji 替换为视觉统一的 Unicode 符号或极简 SVG：

| 功能 | 当前 Emoji | 建议 Unicode | 建议 SVG 描述 |
|------|-----------|-------------|--------------|
| 新建 | 📄 | `□` | 文档轮廓 + 加号 |
| 打开 | 📂 | `▤` | 文件夹轮廓 |
| 保存 | 💾 | `☐` 或 `⬚` | 软盘轮廓 |
| 示例 | 📊 | `◈` | 网格/表格 |
| 节点 | ➕ | `✚` | 圆 + 加号 |
| 边 | ➡️ | `→` | 箭头连线 |
| 删除 | 🗑️ | `✕` | 垃圾桶轮廓 |
| 整理 | ✨ | `⟳` | 刷新/整理 |
| 搜索 | 🔍 | `⌕` | 放大镜 |
| 主题 | 🌙/☀️ | `☾`/`☀` | 月亮/太阳 |

### 7.2 图标使用原则

- 所有图标大小统一 16×16（工具栏）/ 14×14（面板内）
- 颜色继承 `currentColor`，跟随主题
- 图标与文字间距 6px

---

## 八、实现优先级

### P0 — 核心体验（必须实现）

- [ ] 日间模式 `.theme-day` 完整覆盖所有组件
- [ ] 背景渐变 + 画布 subtile 网格纹理
- [ ] 按钮系统统一（主/次/工具栏三级样式）
- [ ] 输入框聚焦动效（左侧 accent 竖条）
- [ ] 属性面板间距和排版优化

### P1 — 质感提升（强烈建议）

- [ ] SVG/Unicode 图标替换 Emoji
- [ ] 入场动画（stagger fadeUp）
- [ ] 节点选中光晕增强（vis-network highlight 配置）
- [ ] 状态栏升级（圆点指示器 + 等宽字体）
- [ ] 自定义滚动条完善
- [ ] 颜色选择器自定义样式

### P2 — 锦上添花（可选）

- [ ] 顶部加载进度条
- [ ] 画布导航按钮自定义样式
- [ ] 拖拽节点阴影跟随
- [ ] 保存成功闪烁反馈
- [ ] 空状态漂浮动画
- [ ] 标签页弹窗排版优化

---

## 九、技术约束与注意事项

### 9.1 不可修改的约束

| 约束 | 说明 |
|------|------|
| **HTML 结构** | 不改变 id/class 名称，只改 CSS 和 app.js 中的样式配置 |
| **后端代码** | 不修改 Python 后端（`worker.py` / `knowledge_graph.py`） |
| **零外部依赖** | 不使用 npm 包、图标库、CSS 框架 |
| **通信协议** | 不修改 JSON 行协议和 IPC 接口 |

### 9.2 可修改的范围

| 文件 | 允许修改的内容 |
|------|--------------|
| `frontend/style.css` | 完全重写或增量修改 |
| `frontend/app.js` | `initNetwork()` 中的 `base` 对象节点/边配置 |
| `frontend/index.html` | 仅改 class 属性（不删改 id） |

### 9.3 关键实现细节

- 主题切换通过 `document.documentElement.classList.toggle('theme-day')` 控制
- 所有 CSS 变量定义在 `:root` 和 `.theme-day` 选择器中
- vis-network 节点形状固定为 `dot`，大小 25-30px
- 动效使用 `prefers-reduced-motion` 媒体查询尊重用户系统设置
- 每次修改后测试：点击/拖拽/编辑/快捷键/布局切换

### 9.4 质量验收标准

- [ ] 深色/日间模式切换完整，无遗漏组件
- [ ] 所有按钮 hover/active 有视觉反馈
- [ ] 输入框聚焦有明显状态变化
- [ ] 面板切换动画流畅
- [ ] 图谱交互（点击、拖拽、编辑）不受影响
- [ ] 窗口缩放到 1200px / 900px / 600px 布局不乱
- [ ] 控制台无报错

---

## 附录：CSS 变量参考（当前值）

```css
:root {
  /* 基底 */
  --bg-deep: #080a10;
  --bg-primary: #0c0e16;
  --bg-secondary: #11141f;
  --bg-surface: #181c2a;

  /* 毛玻璃 */
  --glass-bg: rgba(12, 14, 22, 0.88);
  --glass-bg-light: rgba(24, 28, 42, 0.82);
  --glass-bg-card: rgba(24, 28, 42, 0.7);

  /* 主色 */
  --accent: #4da6ff;
  --accent-hover: #70b5ff;
  --accent-subtle: rgba(77, 166, 255, 0.08);

  /* 文字 */
  --text-primary: #ffffff;
  --text-secondary: #f0f4ff;
  --text-tertiary: rgba(255, 255, 255, 0.55);
  --text-muted: rgba(255, 255, 255, 0.25);

  /* 功能色 */
  --danger: #ff4757;
  --success: #4dc878;
  --warning: #e67e22;

  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 9999px;

  /* 动效 */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --transition: 0.4s var(--ease-out);
}
```

---

> 本建议书基于项目现有架构和代码分析生成，所有修改建议均在前端范围内，不涉及后端 Python 代码和通信协议变更。
