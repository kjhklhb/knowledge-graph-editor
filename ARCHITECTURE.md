# 🧠 知识图谱编辑器 — 项目架构说明书

> **用途**: 供 AI / 开发者快速理解项目全貌  
> **项目路径**: `F:\testgui\knowledge-graph-editor`  
> **启动方式**: 双击 `start.bat`  

---

## 一、项目架构总览

```
┌──────────────────────────────────────────────────┐
│               Electron 桌面窗口                    │
│  ┌────────────────────────────────────────────┐  │
│  │  frontend/index.html   (UI 布局)           │  │
│  │  frontend/style.css    (样式)              │  │
│  │  frontend/app.js       (交互逻辑+可视化)    │  │
│  │        │                                    │  │
│  │  window.api.call(action, params)            │  │
│  └──────────┬─────────────────────────────────┘  │
│             │ ipcRenderer.invoke                  │
│       preload.js (安全桥接)                       │
│             │ ipcMain.handle                      │
│       main.js (Electron 主进程)                   │
│             │ stdin/stdout (JSON 行协议)           │
└─────────────┼────────────────────────────────────┘
              │
       Python 子进程 (常驻)
       ┌──────┴──────┐
       │  worker.py   │  ← 路由分发 + 主循环
       │  knowledge_  │  ← 数据模型 (CRUD)
       │  graph.py    │
       └─────────────┘
```

### 核心设计

| 层 | 技术 | 职责 |
|----|------|------|
| **UI 层** | HTML + CSS + vis-network | 图谱可视化、交互操作、属性编辑面板 |
| **桥接层** | preload.js + main.js (Electron IPC) | 安全地桥接前端和 Python 后端 |
| **后端** | Python (纯标准库) | 知识图谱数据模型、CRUD、搜索、文件持久化 |
| **通信** | stdin/stdout JSON 行协议 | 零端口、管道通信 |

---

## 二、文件清单

```
knowledge-graph-editor/
├── start.bat                  # 双击启动脚本
├── package.json               # Electron 依赖配置
├── main.js                    # Electron 主进程 (152 行)
├── preload.js                 # 安全桥接 (8 行)
├── requirements.txt           # Python 依赖 (当前为零)
├── KG-FORMAT.md               # .kg 文件协议文档
├── backend/
│   ├── worker.py              # Python 主循环 + 路由 (142 行)
│   └── knowledge_graph.py    # 知识图谱数据模型 (237 行)
└── frontend/
    ├── index.html             # 界面布局 (165 行)
    ├── style.css              # 完整样式 (446 行)
    └── app.js                 # 前端逻辑 (711 行)
```

---

## 三、通信协议 (不可修改)

### JSON 行协议

```
Node.js → Python (stdin):
  {"id": 1, "action": "get_graph"}
  {"id": 2, "action": "add_node", "label": "新节点", "color": "#4A90D9"}

Python → Node.js (stdout):
  {"id": 1, "result": {"nodes": [...], "edges": [...]}}
  {"id": 2, "result": {"id": "a1b2c3d4", ...}}
  {"id": 2, "error": "ValueError: 节点不存在"}
```

**规则**:
- 每行一条完整 JSON，末尾 `\n`
- `id` 必须原样返回
- 成功返回 `result`，失败返回 `error`
- 前端统一通过 `window.api.call(action, params)` 调用

### 前端 → 后端 API 列表

| action | params | 返回值 |
|--------|--------|--------|
| `get_graph` | - | `{nodes, edges}` |
| `load_sample` | - | 示例图谱数据 |
| `add_node` | `{label, color, properties}` | 新节点 |
| `update_node` | `{node_id, label, color, properties}` | 更新后节点 |
| `delete_node` | `{node_id}` | `{removed_edges: N}` |
| `get_node` | `{node_id}` | 节点 |
| `add_edge` | `{from, to, label, color, properties}` | 新边 |
| `update_edge` | `{edge_id, label, color, properties}` | 更新后边 |
| `delete_edge` | `{edge_id}` | `{success: true}` |
| `get_edge` | `{edge_id}` | 边 |
| `search_nodes` | `{query}` | `[{node}, ...]` |
| `save_graph` | `{filepath}` | `{path, node_count, edge_count}` |
| `load_graph` | `{filepath}` | `{path, node_count, edge_count}` |
| `new_graph` | - | `{nodes: [], edges: []}` |

---

## 四、布局系统

### 三种布局预设

定义在 `app.js` 的 `LAYOUT_PRESETS` 对象中：

| 布局 | 物理引擎 | 适用场景 |
|------|---------|----------|
| **力导向** (`force`) | forceAtlas2Based + barnesHut | 通用知识图谱 |
| **层次** (`hierarchical`) | 禁用 | 树状层级结构，零交叉 |
| **辐射** (`radial`) | 禁用 | 中心-外围结构 |

### 力导向物理参数调优记录

```
最终参数:
  gravitationalConstant: -2      # 连接节点间微弱排斥
  springLength: 130              # 边自然长度
  springConstant: 0.02           # 弹簧刚度（弱）
  damping: 0.5                   # 阻尼
  barnesHut.gravitationalConstant: 0   # 不相连节点无互作用
  avoidOverlap: 0.9              # 强防重叠
```

**设计决策**: 不相连的节点之间没有斥力/引力，只有有边连接的节点才受物理影响。

---

## 五、`.kg` 文件格式

专用文件扩展名 `.kg`，结构如下：

```json
{
  "format": "knowledge-graph",
  "version": 1,
  "app": "知识图谱编辑器",
  "created": "ISO时间戳",
  "updated": "ISO时间戳",
  "metadata": {
    "title": "图谱名称",
    "description": "描述",
    "node_count": 8,
    "edge_count": 10
  },
  "nodes": [{ "id", "label", "color", "properties" }],
  "edges": [{ "id", "from", "to", "label", "color", "properties" }]
}
```

**兼容性**: Python 后端自动识别 `.kg` 格式和旧 JSON 格式。详见 `KG-FORMAT.md`。

---

## 六、关键实现细节

### 6.1 数据模型 (`knowledge_graph.py`)

```python
class KnowledgeGraph:
    nodes: dict  # id -> {id, label, color, properties}
    edges: dict  # id -> {id, from, to, label, color, properties}
```

- 节点和边存储在内存字典中
- `add_*` 自动生成 8 位 UUID
- `delete_node` 会级联删除相关边
- 使用 `_dirty` 标记追踪未保存的更改

### 6.2 可视化 (`app.js`)

- 使用 **vis-network** 库渲染图谱
- 节点形状: `dot`，大小 25px
- 边的类型: `curvedCW`（弧形，减少视觉交叉）
- 支持: 拖拽、缩放、双击编辑、键盘删除、搜索高亮

### 6.3 属性面板

```
右侧面板三种模式:
  ┌─ 空状态 ──→ 提示点击节点/边
  ├─ 节点编辑 ─→ 标签 / 颜色 / 属性 (JSON)
  └─ 边编辑 ──→ 标签 / 颜色 / 属性 (JSON)
```

### 6.4 添加边的流程

1. 点击「边」按钮 → 进入添加边模式
2. 点击起始节点
3. 点击目标节点
4. 填写关系标签和颜色
5. 点击「确认添加」

### 6.5 搜索实现

- 输入防抖 300ms
- 后端搜索：匹配节点 label 和 properties 中的所有值
- 前端：隐藏不匹配节点（`hidden: true`）

---

## 七、样式系统

| 变量 | 值 | 用途 |
|------|-----|------|
| `--bg-primary` | `#1a1b2e` | 主背景 |
| `--bg-secondary` | `#222340` | 面板/工具栏背景 |
| `--bg-surface` | `#2a2b4a` | 输入框/卡片背景 |
| `--accent` | `#6c63ff` | 主色调 |
| `--danger` | `#ff4757` | 删除操作 |
| `--border` | `#3a3b5a` | 边框 |

暗色主题，采用 CSS 变量统一管理色彩。

---

## 八、启动说明

```bash
# 前提条件
1. 安装 Node.js 18+
2. 安装 Python 3.8+

# 首次运行
cd knowledge-graph-editor
npm install       # 安装 Electron 依赖
npm start         # 启动应用

# 或直接双击 start.bat （自动执行以上步骤）
```

---

## 九、已知约束

| 约束 | 说明 |
|------|------|
| **Python 命令** | main.js 中写死 `python`，Win 下如果找不到改成 `python3` 或完整路径 |
| **vis-network CDN** | index.html 从 unpkg.com 加载 vis-network，首次需要联网 |
| **数据仅在内存** | 关闭前需手动保存为 `.kg` 文件 |
| **通信超时** | Python 调用 30s 超时，大图谱操作需注意 |
| **单线程 Python** | worker.py 同步处理请求，不适合高并发 |

---

## 十、扩展指南

### 添加新的后端操作

```python
# 1. 在 worker.py 注册处理器
@register("my_new_action")
def handle_my_new_action(params):
    # ... 业务逻辑 ...
    return {"result": "ok"}

# 2. 在 app.js 调用
const result = await callApi('my_new_action', { key: 'value' });
```

### 添加新的布局

```javascript
// 在 app.js 的 LAYOUT_PRESETS 中添加
const LAYOUT_PRESETS = {
  myLayout: {
    physics: { ... },
    layout: { ... },
    label: '我的布局',
  },
};

// 在 index.html 的下拉框中添加选项
// <option value="myLayout">我的布局</option>
```

### 修改节点/边样式

在 `app.js` 的 `initNetwork()` 函数中，修改 `base` 对象的 `nodes`/`edges` 配置：

```javascript
const base = {
  nodes: {
    shape: 'dot',     // 可选: dot, square, triangle, star, ellipse, hexagon
    size: 25,          // 节点大小
    font: { size: 14 }, // 标签字号
  },
  edges: {
    smooth: { type: 'curvedCW' },  // 可选: continuous, curvedCW, curvedCCW, dynamic
    width: 2,
  },
};
```

---

## 十一、故障排查

| 问题 | 检查点 |
|------|--------|
| 窗口黑屏 | 检查 vis-network CDN 是否能访问 |
| Python 未启动 | 终端运行 `python --version` 确认可用 |
| 保存/打开没反应 | 查看 DevTools 控制台错误日志 |
| 节点重叠 | 点击「整理布局」重新运行物理引擎 |
| 拖拽卡顿 | 力导向参数过强，调低 `gravitationalConstant` |
