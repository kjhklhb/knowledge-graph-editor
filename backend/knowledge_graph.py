"""
知识图谱数据模型

节点 (Node): {id, label, color, properties: {key: value}, level, content}
边   (Edge): {id, from, to, label, color, properties: {key: value}}
图谱 (Graph): {nodes: [...], edges: [...]}
"""

import json
import os
import uuid


class KnowledgeGraph:
    """内存中的知识图谱，支持 CRUD 操作和持久化"""

    def __init__(self):
        self.nodes = {}   # id -> Node
        self.edges = {}   # id -> Edge
        self._dirty = False
        self._title = "未命名图谱"
        self._description = ""
        self._created_iso = __import__('datetime').datetime.now().isoformat()

    # ---- 节点操作 ----

    def add_node(self, label="新节点", color="#00E8C6", properties=None, level=1, content=""):
        """添加一个节点，返回节点字典"""
        node_id = str(uuid.uuid4())[:8]
        node = {
            "id": node_id,
            "label": label,
            "color": color,
            "properties": properties or {},
            "level": max(1, min(10, int(level))),
            "content": content,
        }
        self.nodes[node_id] = node
        self._dirty = True
        return node

    def update_node(self, node_id, label=None, color=None, properties=None, level=None, content=None):
        """更新节点属性"""
        if node_id not in self.nodes:
            raise ValueError(f"节点 {node_id} 不存在")
        node = self.nodes[node_id]
        if label is not None:
            node["label"] = label
        if color is not None:
            node["color"] = color
        if properties is not None:
            node["properties"] = properties
        if level is not None:
            node["level"] = max(1, min(10, int(level)))
        if content is not None:
            node["content"] = content
        self._dirty = True
        return node

    def delete_node(self, node_id):
        """删除节点及其关联的所有边"""
        if node_id not in self.nodes:
            raise ValueError(f"节点 {node_id} 不存在")

        # 删除关联边
        edges_to_remove = [
            eid for eid, e in self.edges.items()
            if e["from"] == node_id or e["to"] == node_id
        ]
        for eid in edges_to_remove:
            del self.edges[eid]

        del self.nodes[node_id]
        self._dirty = True
        return {"removed_edges": len(edges_to_remove)}

    def get_node(self, node_id):
        """获取单个节点"""
        if node_id not in self.nodes:
            raise ValueError(f"节点 {node_id} 不存在")
        return self.nodes[node_id]

    # ---- 边操作 ----

    def add_edge(self, from_id, to_id, label="关联", color="#6B7280", properties=None):
        """添加一条边"""
        if from_id not in self.nodes:
            raise ValueError(f"起始节点 {from_id} 不存在")
        if to_id not in self.nodes:
            raise ValueError(f"目标节点 {to_id} 不存在")

        edge_id = str(uuid.uuid4())[:8]
        edge = {
            "id": edge_id,
            "from": from_id,
            "to": to_id,
            "label": label,
            "color": color,
            "properties": properties or {},
        }
        self.edges[edge_id] = edge
        self._dirty = True
        return edge

    def update_edge(self, edge_id, label=None, color=None, properties=None):
        """更新边属性"""
        if edge_id not in self.edges:
            raise ValueError(f"边 {edge_id} 不存在")
        edge = self.edges[edge_id]
        if label is not None:
            edge["label"] = label
        if color is not None:
            edge["color"] = color
        if properties is not None:
            edge["properties"] = properties
        self._dirty = True
        return edge

    def delete_edge(self, edge_id):
        """删除一条边"""
        if edge_id not in self.edges:
            raise ValueError(f"边 {edge_id} 不存在")
        del self.edges[edge_id]
        self._dirty = True
        return {"success": True}

    def get_edge(self, edge_id):
        """获取单条边"""
        if edge_id not in self.edges:
            raise ValueError(f"边 {edge_id} 不存在")
        return self.edges[edge_id]

    # ---- 查询 ----

    def get_graph(self):
        """获取完整图谱"""
        return {
            "nodes": list(self.nodes.values()),
            "edges": list(self.edges.values()),
        }

    def search_nodes(self, query):
        """按标签或属性搜索节点"""
        q = query.lower()
        results = []
        for node in self.nodes.values():
            if q in node["label"].lower():
                results.append(node)
                continue
            for k, v in node["properties"].items():
                if q in str(k).lower() or q in str(v).lower():
                    results.append(node)
                    break
            # 也搜索 content
            if q in node.get("content", "").lower():
                results.append(node)
        return results

    # ---- 持久化 (专用 .kg 格式) ----

    def _build_kg_data(self):
        """构建 .kg 格式完整数据结构"""
        import datetime
        return {
            "format": "knowledge-graph",
            "version": 1,
            "app": "知识图谱编辑器",
            "created": self._created_iso,
            "updated": datetime.datetime.now().isoformat(),
            "metadata": {
                "title": self._title,
                "description": self._description,
                "node_count": len(self.nodes),
                "edge_count": len(self.edges),
            },
            "nodes": list(self.nodes.values()),
            "edges": list(self.edges.values()),
        }

    def save_to_file(self, filepath):
        """保存图谱到 .kg 文件"""
        data = self._build_kg_data()
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        self._dirty = False
        return {"path": filepath, "node_count": len(self.nodes), "edge_count": len(self.edges)}

    def load_from_file(self, filepath):
        """从 .kg 或旧 JSON 文件加载图谱（自动识别格式）"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"文件不存在: {filepath}")
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.nodes.clear()
        self.edges.clear()

        # 检测是否为 .kg 标准格式
        is_kg = data.get("format") == "knowledge-graph"
        if is_kg:
            meta = data.get("metadata", {})
            self._title = meta.get("title", "未命名图谱")
            self._description = meta.get("description", "")
            self._created_iso = data.get("created", __import__('datetime').datetime.now().isoformat())

        # 兼容旧 JSON 格式：nodes/edges 可能在 data 字段内
        raw_nodes = data.get("nodes", data.get("data", {}).get("nodes", []))
        raw_edges = data.get("edges", data.get("data", {}).get("edges", []))

        for node_data in raw_nodes:
            nid = str(node_data.get("id"))
            self.nodes[nid] = {
                "id": nid,
                "label": node_data.get("label", ""),
                "color": node_data.get("color", {}).get("background") if isinstance(node_data.get("color"), dict) else node_data.get("color", "#00E8C6"),
                "properties": node_data.get("properties", {}),
                "level": int(node_data.get("level", 1)),
                "content": node_data.get("content", ""),
            }

        for edge_data in raw_edges:
            eid = str(edge_data.get("id", str(uuid.uuid4())[:8]))
            self.edges[eid] = {
                "id": eid,
                "from": str(edge_data.get("from")),
                "to": str(edge_data.get("to")),
                "label": edge_data.get("label", ""),
                "color": edge_data.get("color", {}).get("color") if isinstance(edge_data.get("color"), dict) else edge_data.get("color", "#6B7280"),
                "properties": edge_data.get("properties", {}),
            }

        self._dirty = False
        return {"path": filepath, "node_count": len(self.nodes), "edge_count": len(self.edges)}

    def is_dirty(self):
        return self._dirty

    def clear(self):
        """清空图谱"""
        self.nodes.clear()
        self.edges.clear()
        self._dirty = False
        self._title = "未命名图谱"
        self._description = ""

    def load_sample(self):
        """加载示例知识图谱"""
        self.clear()
        n1 = self.add_node("人工智能", "#00E8C6", {"领域": "计算机科学", "描述": "研究智能机器"}, level=1)
        n2 = self.add_node("机器学习", "#5BA3EC", {"领域": "人工智能", "类型": "监督学习"}, level=2)
        n3 = self.add_node("深度学习", "#8FD46D", {"领域": "机器学习", "框架": "PyTorch/TensorFlow"}, level=3)
        n4 = self.add_node("自然语言处理", "#A37FFF", {"领域": "人工智能", "应用": "文本分析"}, level=2)
        n5 = self.add_node("计算机视觉", "#FFCA28", {"领域": "人工智能", "应用": "图像识别"}, level=2)
        n6 = self.add_node("Transformer", "#03D6B8", {"年份": "2017", "论文": "Attention Is All You Need"}, level=3)
        n7 = self.add_node("GPT", "#EE5D43", {"类型": "大语言模型", "公司": "OpenAI"}, level=4)
        n8 = self.add_node("知识图谱", "#FF9A5C", {"定义": "结构化知识表示"}, level=1)

        self.add_edge(n1["id"], n2["id"], "包含", "#6B7280")
        self.add_edge(n1["id"], n4["id"], "包含", "#6B7280")
        self.add_edge(n1["id"], n5["id"], "包含", "#6B7280")
        self.add_edge(n1["id"], n8["id"], "包含", "#6B7280")
        self.add_edge(n2["id"], n3["id"], "包含", "#6B7280")
        self.add_edge(n3["id"], n6["id"], "基础", "#6B7280")
        self.add_edge(n6["id"], n7["id"], "核心技术", "#6B7280")
        self.add_edge(n4["id"], n6["id"], "应用", "#6B7280")
        self.add_edge(n5["id"], n3["id"], "应用", "#6B7280")
        self.add_edge(n7["id"], n7["id"], "自环演示", "#6B7280")

        self._dirty = True
        return self.get_graph()


# 全局实例
graph = KnowledgeGraph()
graph.load_sample()
