# 📁 .kg 知识图谱文件格式规范 v1

> **文件扩展名**: `.kg`  
> **MIME 类型**: `application/json`（基于 JSON）  
> **设计目标**: 单个文件包含完整的知识图谱数据，便于存储、分发和归档

---

## 一、概述

`.kg`（Knowledge Graph）是知识图谱编辑器使用的专有文件格式。它基于纯 JSON，将所有节点、边、属性及元信息打包到一个文件中。

### 设计原则

1. **自包含** — 一个 `.kg` 文件就是一个完整的知识图谱
2. **可读性** — 基于 JSON，直接用文本编辑器可以查看和修改
3. **可扩展** — 通过版本号字段确保向后兼容
4. **可追踪** — 包含创建/修改时间戳、节点/边统计

---

## 二、文件结构

```json
{
  "format": "knowledge-graph",
  "version": 1,
  "app": "知识图谱编辑器",
  "created": "2026-06-17T01:00:01.160983",
  "updated": "2026-06-17T01:00:01.161980",
  "metadata": {
    "title": "未命名图谱",
    "description": "",
    "node_count": 8,
    "edge_count": 10
  },
  "nodes": [],
  "edges": []
}
```

### 顶层字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `format` | string | ✅ | 固定为 `"knowledge-graph"`，用于文件类型识别 |
| `version` | number | ✅ | 格式版本号，当前为 `1` |
| `app` | string | ❌ | 创建该文件的应用程序名称 |
| `created` | string | ❌ | ISO 8601 格式的创建时间戳 |
| `updated` | string | ❌ | ISO 8601 格式的最后修改时间戳 |
| `metadata` | object | ❌ | 图谱元信息（见下方） |
| `nodes` | array | ✅ | 节点列表（见第三章） |
| `edges` | array | ✅ | 边列表（见第四章） |

### 元信息 `metadata`

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 图谱标题 |
| `description` | string | 图谱描述 |
| `node_count` | number | 节点数量（冗余统计） |
| `edge_count` | number | 边数量（冗余统计） |

---

## 三、节点（Node）

### 节点结构

```json
{
  "id": "a1b2c3d4",
  "label": "人工智能",
  "color": "#E74C3C",
  "properties": {
    "领域": "计算机科学",
    "描述": "研究智能机器"
  }
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 节点唯一标识符，8位短 UUID |
| `label` | string | ✅ | 节点显示标签 |
| `color` | string | ❌ | 节点颜色，十六进制格式 `#RRGGBB`，默认 `#4A90D9` |
| `properties` | object | ❌ | 自定义属性键值对，key/value 均为字符串 |

### 示例

```json
{
  "id": "e873c55c",
  "label": "机器学习",
  "color": "#3498DB",
  "properties": {
    "类型": "监督学习",
    "框架": "Scikit-learn"
  }
}
```

---

## 四、边（Edge）

### 边结构

```json
{
  "id": "f6e7d8c9",
  "from": "a1b2c3d4",
  "to": "b2c3d4e5",
  "label": "包含",
  "color": "#95A5A6",
  "properties": {
    "权重": "强"
  }
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 边唯一标识符，8位短 UUID |
| `from` | string | ✅ | 起始节点 ID |
| `to` | string | ✅ | 目标节点 ID |
| `label` | string | ❌ | 关系标签，如"包含"、"依赖于" |
| `color` | string | ❌ | 边颜色，十六进制格式 `#RRGGBB`，默认 `#95A5A6` |
| `properties` | object | ❌ | 自定义属性键值对 |

### 自环（Self-loop）

from 和 to 指向同一节点即为自环：

```json
{
  "id": "loop1234",
  "from": "a1b2c3d4",
  "to": "a1b2c3d4",
  "label": "自环演示"
}
```

---

## 五、颜色规范

颜色使用十六进制格式 `#RRGGBB`，不区分大小写。

### 推荐颜色表

| 颜色 | 色值 | 用途 |
|------|------|------|
| 🔴 红色 | `#E74C3C` | 核心概念 |
| 🔵 蓝色 | `#3498DB` | 子领域 |
| 🟢 绿色 | `#2ECC71` | 具体技术 |
| 🟣 紫色 | `#9B59B6` | 交叉领域 |
| 🟠 橙色 | `#F39C12` | 应用方向 |
| 🔷 青色 | `#1ABC9C` | 基础技术 |
| ⚪ 灰色 | `#95A5A6` | 边（默认） |

---

## 六、兼容性

### 向后兼容

`.kg v1` 解析器可以读取以下格式：

- ✅ `.kg v1` 标准格式
- ✅ 旧版知识图谱编辑器保存的纯 JSON 格式（nodes/edges 平铺）
- ✅ 通用 vis-network JSON 导出格式

### 格式检测

解析器通过检查顶层 `format` 字段：

```python
is_kg_format = data.get("format") == "knowledge-graph"
```

若识别为 `.kg` 格式，则读取 `metadata` 中的元信息；否则按旧 JSON 格式处理。

---

## 七、使用示例

### 在知识图谱编辑器中

```bash
# 保存为 .kg 文件
保存 → 选择 "知识图谱文件 (.kg)" → 保存为 my-graph.kg

# 打开 .kg 文件
打开 → 选择 my-graph.kg → 自动加载
```

### 手动创建 .kg 文件

用任何文本编辑器创建 `hello.kg`：

```json
{
  "format": "knowledge-graph",
  "version": 1,
  "nodes": [
    { "id": "n1", "label": "Hello" },
    { "id": "n2", "label": "World" }
  ],
  "edges": [
    { "id": "e1", "from": "n1", "to": "n2", "label": "says" }
  ]
}
```

### 用 Python 读取

```python
import json

with open("my-graph.kg", "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"格式: {data['format']} v{data['version']}")
print(f"节点数: {len(data['nodes'])}")
print(f"边数: {len(data['edges'])}")

for node in data['nodes']:
    print(f"  🔵 {node['label']} ({node['id']})")

for edge in data['edges']:
    print(f"  ➡️  {edge['from']} → {edge['to']}: {edge['label']}")
```

---

## 八、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-06 | 初始规范定义 |

---

## 九、附录

### A. 文件扩展名关联（Windows）

要在 Windows 中双击 `.kg` 文件自动用知识图谱编辑器打开：

```powershell
# 以管理员身份运行
ftype KGraphFile="F:\path\to\start.bat" "%%1"
assoc .kg=KGraphFile
```

### B. 与标准 JSON 格式的差异

| 特性 | `.kg` 格式 | 旧 JSON 格式 |
|------|-----------|-------------|
| 文件标识 | 有 `format` 字段 | 无 |
| 版本控制 | 有 `version` 字段 | 无 |
| 元信息 | 包含标题、描述、统计 | 无 |
| 时间戳 | 创建/修改时间 | 无 |
| 兼容性 | 可扩展，版本升级 | 结构固定 |
