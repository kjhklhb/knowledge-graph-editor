<<<<<<< HEAD
# 🧠 知识图谱编辑器 — Git 工作流指南

> 本文档面向参与本项目的开发者，介绍 Git 使用规范、提交约定、分支策略和协作流程。

---

## 一、📦 仓库信息

| 项目 | 值 |
|------|-----|
| 远程仓库 | `https://github.com/kjhklhb/knowledge-graph-editor.git` |
| 默认分支 | `main` |
| 许可证 | 未指定（私有/开源待定） |

---

## 二、🚀 快速开始

### 克隆仓库

```bash
git clone https://github.com/kjhklhb/knowledge-graph-editor.git
cd knowledge-graph-editor
```

### 查看远程

```bash
git remote -v
# origin  https://github.com/kjhklhb/knowledge-graph-editor.git (fetch)
# origin  https://github.com/kjhklhb/knowledge-graph-editor.git (push)
```

### 日常三连

```bash
git pull            # 拉取最新代码
# ... 改代码 ...
git add .           # 暂存
git commit -m "feat: 我的改动"   # 提交
git push            # 推送到 remote
=======
<div align="center">

# 🧠 知识图谱编辑器

**Knowledge Graph Editor** — 可视化桌面工具，让知识管理像画图一样直观

![Electron](https://img.shields.io/badge/Electron-32+-47848F?logo=electron&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python&logoColor=white)
![vis-network](https://img.shields.io/badge/vis--network-9.1-1A9CDB)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## 📸 界面预览

```
┌─────────────────────────────────────────────────────────────┐
│ ⌘ 知识图谱编辑器    📄新建 📂打开 💾保存 📊示例  ...  🔍搜索  │
├──────────────────────────────────────────┬──────────────────┤
│                                          │   🔵 节点属性     │
│    🌐 可视化画布                          │   标签: ________  │
│                                          │   层级: [-] Lv.1 [+]│
│    [人工智能] ──包含──→ [机器学习]         │   颜色: 🎨 #E74C3C│
│       │                 │                │   属性: {....}    │
│       ├──包含──→ [自然语言处理]            │   [💾 保存]       │
│       │                 │                │                  │
│       └──包含──→ [计算机视觉]              │                  │
│                                          │                  │
├──────────────────────────────────────────┴──────────────────┤
│ 节点: 8 | 边: 10 | 模式: 浏览 | 布局: 力导向               │
└─────────────────────────────────────────────────────────────┘
```

> ✨ 电影感暗色主题 · 毛玻璃面板 · 霓虹光晕 · 全圆角设计

---

## ✨ 功能特性

### 🎯 核心功能

| 功能 | 说明 |
|------|------|
| **节点编辑** | 创建/编辑/删除概念节点，支持 10 级层级和 12 种预设颜色 |
| **关系连接** | 节点间拖拽连线，标注关系类型，支持自环 |
| **三种布局** | 力导向 / 层次树形 / 辐射布局，一键切换 |
| **富文本笔记** | 双击节点打开标签页编辑器，支持加粗/列表/颜色等格式 |
| **属性管理** | 每个节点和边支持自定义 JSON 属性键值对 |
| **智能搜索** | 按标签、属性、笔记内容实时搜索节点 |
| **文件持久化** | 保存为 `.kg` 格式，支持旧版 JSON 兼容导入 |

### ⌨️ 快捷键

| 按键 | 操作 |
|------|------|
| `A` | 添加节点 |
| `E` | 添加边模式 |
| `Space` | 连接选中两个节点 |
| `1/2/3` | 切换布局（力导向/层次/辐射） |
| `L` | 整理布局 |
| `Delete` | 删除选中 |
| `双击` | 打开节点标签页 |
| `?` | 快捷键帮助面板 |

### 🎨 视觉设计

- **暗色电影感主题** — 深黑/深蓝基底，护眼且沉浸
- **毛玻璃面板** — 模糊背景叠加，层次分明
- **霓虹光晕** — 选中和 Hover 时冰蓝色光晕特效
- **层级可视化** — 节点大小随层级变化（Lv.1=30px → Lv.10=12px）
- **fadeUp 动画** — 面板和按钮缓动入场

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│  前端 (Electron 渲染进程)                                    │
│  index.html  →  UI 结构（工具栏/画布/属性面板/标签页弹窗）    │
│  style.css   →  电影感暗色主题（毛玻璃/光晕/噪点纹理）         │
│  app.js      →  vis-network 交互、事件处理、快捷键注册        │
├─────────────────────────────────────────────────────────────┤
│  preload.js  →  contextBridge 安全桥接（4 个 IPC API）       │
├─────────────────────────────────────────────────────────────┤
│  main.js     →  Electron 主进程                              │
│                 Python 子进程管理 / IPC 路由 / 会话日志        │
├─────────────────────────────────────────────────────────────┤
│  Python 后端 (常驻子进程 · stdin/stdout JSON 行通信)          │
│  worker.py   →  主循环 + 14 个路由注册                        │
│  knowledge_graph.py → 数据模型 CRUD / .kg 持久化 / 格式兼容   │
└─────────────────────────────────────────────────────────────┘
```

### 通信协议

```
前端 → window.api.call(action, params)
     → IPC invoke → main.js → stdin
     → Python worker.py → 路由分发 → 处理
     → stdout → main.js → IPC 返回 → 前端更新 vis-network
```

### 设计决策

| 决策 | 理由 |
|------|------|
| **零端口通信** — stdin/stdout 管道 | 不占端口、无需 HTTP 服务器、部署简单 |
| **Python 常驻进程** | 避免每次操作都启动 Python，响应迅速 |
| **JSON 行协议** | 简单可靠，一行一条完整 JSON，两边都好解析 |
| **contextIsolation: true** | Electron 安全最佳实践 |
| **vis-network** | 专业网络图库，力导向/拖拽/缩放开箱即用 |

---

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.8+)
- npm (随 Node.js 一起安装)

### 安装与启动

```bash
# 1. 克隆仓库
git clone https://github.com/kjhklhb/knowledge-graph-editor.git
cd knowledge-graph-editor

# 2. 安装前端依赖
npm install

# 3. 启动！（会自动拉起 Python 后端）
npm start
```

> Windows 用户也可以直接双击 `start.bat` 一键启动。

### 文件结构

```
knowledge-graph-editor/
├── main.js                    # Electron 主进程
├── preload.js                 # 安全桥接
├── package.json               # 项目配置
├── start.bat                  # Windows 一键启动脚本
├── .gitignore
│
├── backend/
│   ├── worker.py              # Python 主循环 + 路由 (14 个 API)
│   └── knowledge_graph.py     # 数据模型 CRUD + .kg 持久化
│
├── frontend/
│   ├── index.html             # UI 结构 (286 行)
│   ├── style.css              # 电影感暗色主题 (1236 行)
│   └── app.js                 # 前端核心逻辑 (456 行)
│
├── AI-README.md               # 给 AI 看的项目说明书
├── GIT-GUIDE.md               # Git 工作流指南
├── KG-FORMAT.md               # .kg 文件格式规范
├── ARCHITECTURE.md            # 架构设计文档
│
└── debug/                     # 运行时日志（自动生成）
>>>>>>> 543e3bf (docs: 添加项目介绍文档 README.md)
```

---

<<<<<<< HEAD
## 三、🌿 分支策略

本项目采用轻量级分支策略，以 `main` 为主线：

```
main  ← 稳定可发布版本，始终可运行
  │
  ├── feat/xxx     ← 新功能分支，完成后合并回 main
  ├── fix/xxx      ← Bug 修复分支
  └── docs/xxx     ← 文档更新分支
```

### 命名规则

| 分支类型 | 格式 | 示例 |
|---------|------|------|
| 功能 | `feat/<简短描述>` | `feat/undo-redo` |
| 修复 | `fix/<问题描述>` | `fix/layout-switch-bug` |
| 文档 | `docs/<内容>` | `docs/api-usage` |
| 实验 | `exp/<描述>` | `exp/webgl-renderer` |

### 分支操作

```bash
# 创建并切换
git checkout -b feat/new-layout

# 开发完成后合并回 main
git checkout main
git merge feat/new-layout

# 删除已完成的分支
git branch -d feat/new-layout
=======
## 📂 .kg 文件格式

本项目使用专用 `.kg`（Knowledge Graph）格式存储图谱数据，基于纯 JSON。

```json
{
  "format": "knowledge-graph",
  "version": 1,
  "nodes": [
    { "id": "a1b2c3d4", "label": "人工智能", "color": "#E74C3C", "level": 1, "content": "<h2>...</h2>" }
  ],
  "edges": [
    { "id": "e1f2g3h4", "from": "a1b2c3d4", "to": "b2c3d4e5", "label": "包含" }
  ]
}
```

- **自包含** — 一个 `.kg` 文件就是一个完整图谱
- **向后兼容** — 自动识别旧版 JSON 格式
- **可读性强** — 纯文本，任意编辑器可查看修改

> 详细规范见 [KG-FORMAT.md](KG-FORMAT.md)

---

## 🛠️ 开发指南

### 加一个新后端操作

```python
# backend/worker.py
@register("my_action")
def handle_my_action(params):
    # 业务逻辑
    return {"result": "ok"}
```

```javascript
// frontend/app.js
var result = await ca('my_action', { key: 'value' });
```

### 加一种新布局

```javascript
// frontend/app.js
const LP = {
  myLayout: {
    physics: { enabled: false },
    layout: { ... },
    label: '我的布局',
  },
};
// index.html 的下拉框加 <option>
```

### 加一个快捷键

```javascript
// frontend/app.js keydown 事件中
if (e.key === 'X') { e.preventDefault(); doSomething(); }
```

> 完整开发指南见 [GIT-GUIDE.md](GIT-GUIDE.md)

---

## 📊 示例图谱

启动后点击工具栏「📊 示例」即可加载内置示例图谱：

```
人工智能
├── 机器学习 ──→ 深度学习 ──→ Transformer ──→ GPT
├── 自然语言处理 ──→ Transformer
├── 计算机视觉 ──→ 深度学习
└── 知识图谱
>>>>>>> 543e3bf (docs: 添加项目介绍文档 README.md)
```

---

<<<<<<< HEAD
## 四、📝 提交信息规范

采用 [Conventional Commits](https://www.conventionalcommits.org/) 约定，格式如下：

```
<类型>: <简短描述>

<可选详细说明>
```

### 类型

| 类型 | 用途 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加辐射布局` |
| `fix` | Bug 修复 | `fix: 布局切换时节点被锁定` |
| `docs` | 文档 | `docs: 更新 API 路由表` |
| `refactor` | 重构 | `refactor: 抽离布局配置常量` |
| `style` | 样式/UI | `style: 调整工具栏圆角` |
| `chore` | 杂项 | `chore: 更新 electron 到 v32` |
| `perf` | 性能 | `perf: 优化大量节点渲染` |
| `test` | 测试 | `test: 添加节点 CRUD 测试` |

### 优秀示例

```
feat: 添加辐射布局 (radial)

- 在 LP 常量中新增 radial 配置
- 布局选择器增加"辐射"选项
- 快捷键 3 切换辐射布局
- 整理布局按钮支持辐射模式
```

```
fix: 力导向布局切换后节点被锁定

原因是 vis-network 的 setOptions 不会自动禁用
hierarchical 布局，切回力导向时需要显式设置
hierarchical.enabled = false
```

### 简易提交

小改动可以用一行：

```bash
git commit -m "fix: delete_node 缺少 level/content 字段"
git commit -m "docs: 补充快捷键帮助面板内容"
```

---

## 五、📋 本项目的 Git 最佳实践

### ✅ 推荐做法

1. **小而专的提交** — 每个提交只做一件事，方便回滚
2. **先 pull 再 push** — 推送前先 `git pull --rebase` 避免合并分叉
3. **保持工作区干净** — 不提交调试日志、node_modules、__pycache__
4. **写有意义的描述** — 两周后自己也能看懂改了什么

### ❌ 避免做法

- 不要把 `node_modules/`、`debug/`、`__pycache__/` 提交到仓库
- 不要用 `git commit -m "fix bug"` 这样模糊的描述
- 不要直接推送到 `main` 分支（如果开启了保护）

### .gitignore 已经覆盖

```
node_modules/
debug/
backend/__pycache__/
*.log
.DS_Store
Thumbs.db
```

---

## 六、🔄 典型协作流程

### 单人开发

```bash
# 工作前
git checkout main
git pull

# 创建分支
git checkout -b feat/my-feature

# 多次提交
git add .
git commit -m "feat: 第一件事"
git add .
git commit -m "feat: 第二件事"

# 合并回主线
git checkout main
git merge feat/my-feature
git push

# 清理
git branch -d feat/my-feature
```

### 多人协作（推荐）

```bash
# 从最新的 main 开始
git checkout main
git pull

# 功能分支
git checkout -b feat/awesome

# ... 开发，多次提交 ...
git add .
git commit -m "feat: done"

# 推送自己的分支
git push -u origin feat/awesome

# 在 GitHub 上创建 Pull Request → Code Review → 合并

# 合并后删除远程分支
git push origin --delete feat/awesome
```

---

## 七、📎 实用命令速查

```bash
# 查看状态
git status

# 查看历史（简洁）
git log --oneline --graph --all

# 查看某次提交详情
git show <commit-hash>

# 暂存未完成的改动（切换分支前）
git stash
git stash pop    # 恢复

# 撤销暂存
git reset HEAD <file>

# 撤销本地修改（谨慎！）
git checkout -- <file>

# 修改上一次提交信息
git commit --amend -m "新的描述"

# 拉取并变基（避免 merge commit）
git pull --rebase

# 查看文件变动
git diff
git diff --staged
```

---

## 八、📚 推荐阅读

- [Git 官方文档](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [如何写 Git 提交信息](https://chris.beams.io/posts/git-commit/)

---

> 最后更新: 2026-06-17  
> 如有疑问，欢迎提 Issue 或直接联系项目维护者。
=======
## ⚠️ 已知问题

- **布局切换残留**: 切回力导向后如节点被锁定，可再按一次 `L` 整理
- **CDN 加载**: 若 vis-network 加载失败会自动切 jsdelivr 备用 CDN
- **中文路径**: 确保项目路径不含特殊字符

---

## 🧑‍💻 技术栈

| 技术 | 用途 |
|------|------|
| [Electron](https://www.electronjs.org/) | 跨平台桌面应用框架 |
| [vis-network](https://visjs.github.io/vis-network/) | 网络图可视化引擎 |
| Python 3 | 后端数据模型与持久化 |
| stdin/stdout JSON 行协议 | 进程间通信 |

---

## 📄 许可证

本项目基于 MIT 许可证开源。

---

<p align="center">
  <b>🧠 知识图谱编辑器</b> · 让复杂知识一目了然
</p>
>>>>>>> 543e3bf (docs: 添加项目介绍文档 README.md)
