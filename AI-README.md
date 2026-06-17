# 知识图谱编辑器 — 给 AI 看的项目说明书

> **写给接手的新 AI**: 这是整个项目的完整说明书。读完后你就能理解这个桌面应用是做什么的、怎么工作的、每个文件管什么、遇到问题怎么改。

---

## 一、一句话说清这个项目

这是一个**桌面版知识图谱编辑工具**，Electron 做窗口，Python 做后端，中间用 **stdin/stdout JSON 行协议** 通信。用户可以在可视化画布上拖拽编辑节点（概念）和边（关系），给节点设层级，写富文本笔记，保存为 `.kg` 文件。

---

## 二、项目架构 (给 AI 看的通信图)

```
用户操作 (点击/拖拽/按键)
       ↓
app.js  (前端交互逻辑)
  ├── vis-network 渲染图
  ├── console.log / error → preload.js → main.js → log 文件
  └── window.api.call(action, params)
             ↓ IPC invoke
       preload.js (安全桥接, 3 个 API)
             ↓ ipcMain.handle
       main.js (Electron 主进程)
             ↓ stdin 写入 JSON 行
       worker.py (Python 主循环)
             ↓ 路由分发
       knowledge_graph.py (数据模型 CRUD)
             ↓ stdout 返回 JSON 行
       main.js (解析结果)
             ↓ IPC 返回
       app.js (更新 vis-network)
```

### 关键设计决策

| 决策 | 原因 |
|------|------|
| **零端口** — stdin/stdout 管道通信 | 不占用端口、无需 HTTP 服务器、部署简单 |
| **Python 常驻进程** — 启动时 spawn，关闭时 kill | 避免每次操作都启动 Python 的开销 |
| **JSON 行协议** — 每行一条完整 JSON，\n 分隔 | 简单可靠，两边都好解析 |
| **contextIsolation: true** — 前端不能直接访问 Node.js | Electron 安全最佳实践 |
| **vis-network** — 专业网络图库 | 内置力导向布局、拖拽、缩放，无需自己实现 |

---

## 三、每个文件的精确职责

### 根目录文件

| 文件 | 行数 | 职责 |
|------|------|------|
| `main.js` | ~165 | Electron 主进程。管理 Python 子进程、IPC 处理器、运行时日志、窗口管理 |
| `preload.js` | ~11 | 安全桥接，向前端暴露 3 个 API: `call()`, `saveDialog()`, `openDialog()`, `log()` |
| `start.bat` | ~33 | Windows 双击启动脚本，自动 npm install + 检测 Python |
| `package.json` | ~10 | Electron 依赖配置，`npm start` 启动 |
| `.gitignore` | ~15 | Git 忽略规则 |
| `ARCHITECTURE.md` | ~315 | 旧版架构文档（偏向人类阅读） |
| `KG-FORMAT.md` | ~168 | `.kg` 文件格式规范 |

### backend/ 目录

| 文件 | 行数 | 职责 |
|------|------|------|
| `worker.py` | ~130 | **Python 主循环**。从 stdin 读 JSON，查找 HANDLERS 路由表执行函数，写 stdout 返回 |
| `knowledge_graph.py` | ~270 | **数据模型**。`KnowledgeGraph` 类管理 nodes/edges 的 CRUD、搜索、`.kg` 文件持久化 |

### frontend/ 目录

| 文件 | 行数 | 职责 |
|------|------|------|
| `index.html` | ~280 | UI 结构。工具栏、画布、属性面板、标签页弹窗、快捷键帮助面板 |
| `style.css` | ~1200+ | **电影感暗色主题**。毛玻璃、噪点纹理、霓虹光晕、全圆角按钮、响应式 |
| `app.js` | ~455 | **前端核心逻辑**。vis-network 初始化、事件处理、快捷键、层级控制、标签页富文本编辑 |

---

## 四、通信协议（核心！不能改格式）

### JSON 行协议

```
Node.js 写入 Python stdin:
  {"id": 1, "action": "get_graph"}
  {"id": 2, "action": "add_node", "label": "新节点", "color": "#E74C3C", "level": 1}

Python 写入 stdout:
  {"id": 1, "result": {"nodes": [...], "edges": [...]}}
  {"id": 2, "result": {"id": "a1b2c3d4", "label": "新节点", ...}}
  {"id": 2, "error": "ValueError: 节点不存在"}
```

**规则（不要改）**:
1. 每行一条完整 JSON，末尾 `\n`
2. `id` 必须原样返回，用于匹配请求和响应
3. 成功返回 `result`，失败返回 `error`
4. 前端统一通过 `window.api.call(action, params)` 调用

### Python API 路由表 (worker.py 的 HANDLERS)

```
get_graph      → 返回全部 nodes + edges
add_node       → label, color, properties, level, content
update_node    → node_id, label, color, properties, level, content
delete_node    → node_id (级联删除关联边)
get_node       → node_id

add_edge       → from, to, label, color, properties
update_edge    → edge_id, label, color, properties
delete_edge    → edge_id
get_edge       → edge_id

search_nodes   → query (匹配 label + properties + content)
save_graph     → filepath (.kg 格式)
load_graph     → filepath
new_graph      → 清空图谱
load_sample    → 加载示例数据
```

---

## 五、数据模型

### 节点 Node

```json
{
  "id": "a1b2c3d4",        // 8位 UUID
  "label": "人工智能",       // 显示标签
  "color": "#E74C3C",       // 十六进制颜色
  "properties": {},         // 自定义键值对
  "level": 1,               // 层级 1-10，影响节点大小
  "content": "<h2>...</h2>" // 富文本内容 (HTML)
}
```

### 边 Edge

```json
{
  "id": "e1f2g3h4",
  "from": "a1b2c3d4",
  "to": "b2c3d4e5",
  "label": "包含",
  "color": "#95A5A6",
  "properties": {}
}
```

### 节点大小计算 (app.js 中 `ns()` 函数)

```
size = max(12, 30 - (level - 1) * 3)
Lv.1 = 30px, Lv.3 = 24px, Lv.5 = 18px, Lv.10 = 12px
```

---

## 六、布局系统

定义在 `app.js` 的 `LP` (LAYOUT_PRESETS) 常量中。

### 三种布局

| 布局 | key | 物理引擎 | 原理 |
|------|-----|---------|------|
| **力导向** | `force` | forceAtlas2Based | 节点之间微弱排斥 + 边弹簧拉动，不相连的节点完全无作用力 |
| **层次** | `hierarchical` | 禁用 | vis-network 内置层次布局，树状排列，零交叉 |
| **辐射** | `radial` | 禁用 | 以连接数最多的节点为中心辐射排列 |

### 力导向物理参数(最终调优版)

```javascript
gravitationalConstant: -2    // 连接节点间微弱排斥
springLength: 130             // 边自然长度
springConstant: 0.02          // 弹簧刚度
damping: 0.5                  // 阻尼
barnesHut.avoidOverlap: 0.9   // 防重叠 (满值)
```

**特别注意**: 切换到力导向时必须显式禁用 `hierarchical: { enabled: false }`，否则 vis-network 会残留旧布局设置，导致节点被锁定。

---

## 七、快捷键系统 (app.js 中注册)

```
Space        → 连接选中的两个节点 (先点→后点)
Ctrl+N       → 新建图谱
Ctrl+O       → 打开 .kg 文件
Ctrl+S       → 保存
Ctrl+A       → 全选节点
A            → 添加节点
E            → 添加边模式
Delete       → 删除选中
F2           → 编辑节点标签
L            → 整理布局
1/2/3        → 切换布局 (力导向/层次/辐射)
双击          → 打开节点标签页
Tab          → 聚焦搜索框
?            → 快捷键帮助面板
Esc          → 取消/关闭
```

---

## 八、`.kg` 文件格式

```
{
  "format": "knowledge-graph",     // 文件类型标识
  "version": 1,                     // 格式版本
  "created": "ISO 时间戳",
  "updated": "ISO 时间戳",
  "metadata": {                     // 元信息
    "title": "图谱名",
    "node_count": 10,
    "edge_count": 15
  },
  "nodes": [...],                   // 所有节点
  "edges": [...]                    // 所有边
}
```

**兼容性**: Python 后端自动识别 `.kg` 和旧 JSON 格式。

---

## 九、运行时日志系统

| 组件 | 实现 | 位置 |
|------|------|------|
| 主进程日志 | `log()` 函数 → `LOG_BUF` → 退出时写 `debug/` | main.js |
| 渲染进程日志 | `console-message` 事件 → `log()` | main.js |
| 前端日志 | IIFE 重写 `console.log` → `window.api.log()` → IPC → main.js | app.js 开头 |
| 全局错误 | `window.addEventListener("error", ...)` | app.js 末尾 |

每次退出自动生成 `debug/session-{时间戳}.log`。

---

## 十、已知坑点 / 常见Bug

### 1. 顶层 getElementById 崩溃
所有 `document.getElementById(...).addEventListener(...)` 如果元素 ID 在 HTML 中不存在，脚本直接崩溃。
**修复**: 加 null 检查 `document.getElementById('xxx') && document.getElementById('xxx').addEventListener(...)`

### 2. 布局切换残留
vis-network 的 `setOptions()` 深层合并对象，切换到力导向时必须显式禁用 hierarchical。
**修复**: 
```javascript
state.network.setOptions({
  layout: { hierarchical: { enabled: false }, improvedLayout: true, ... },
  physics: { enabled: true }
});
```

### 3. IPC handler 参数 undefined
前端调用 `window.api.call('action')` 不带第二个参数时，`params` 为 undefined。
**修复**: IPC handler 中 `if (!params) params = {}` + 日志打印时 try/catch 包裹 `JSON.stringify`

### 4. 日志递归
不要在 `log()` 函数内使用 `console.log()`（会被 override 的版本拦截导致递归）。
**修复**: 保存原始 console 为 `_RAW_LOG`/`_RAW_ERR`，`log()` 内部只调用原始方法。

### 5. vis-network CDN 加载失败
unpkg.com 可能在某些网络环境不可用。
**修复**: 添加 jsdelivr CDN 作为后备：
```html
<script src="https://unpkg.com/..."></script>
<script>if(typeof vis==="undefined"){/* 加载备用 CDN */}</script>
```

---

## 十一、怎样加新功能 (三步法)

### 加一个后端操作

```python
# 1. worker.py 加路由
@register("my_action")
def handle_my_action(params):
    # 业务逻辑
    return {"result": "ok"}

# 2. app.js 调用
var r = await ca('my_action', { key: 'value' });

# 3. index.html 加 UI
```

### 加一种新布局

```javascript
// app.js 的 LP 中加一项
const LP = {
  myLayout: {
    physics: { enabled: false },  // 或 forceAtlas2Based
    layout: { ... },
    label: '我的布局',
  },
};
// 然后 index.html 的下拉框加 option
```

### 加一个快捷键

```javascript
// app.js 的 keydown 事件中加 case
if(e.key==='X') { e.preventDefault(); doSomething(); }
```

---

## 十二、启动命令

```bash
# 首次
npm install
npm start

# 或双击 start.bat
```

---

## 十三、关键代码锚点 (快速跳转)

| 想找什么 | 文件:行号 (约) |
|---------|---------------|
| 初始化 vis-network | `app.js:47` - `initNet()` |
| 初始化失败原因 | 看 `debug/session-*.log` |
| 添加节点 | `app.js:208` - `addNode()` |
| 点击事件处理 | `app.js:78` - `hClick()` |
| 切换布局 | `app.js:96` - `applyLayout()` |
| 节点面板 | `app.js:140` - `showNodePanel()` |
| 标签页 (富文本) | `app.js:280` - `openTab()` |
| 快捷键注册 | `app.js:355` - keydown 事件 |
| Python 路由表 | `worker.py:15` - `HANDLERS` |
| 数据模型 CRUD | `knowledge_graph.py:27` - `KnowledgeGraph` |
| IPC 日志 | `main.js:106` - `call-python` |
| 渲染进程错误捕获 | `main.js:128` - `console-message` |
| 日志写出 | `main.js:34` - `writeLog()` |
| 文件保存对话框 | `main.js:114` - `save-dialog` |
