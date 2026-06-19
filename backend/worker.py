"""
知识图谱编辑器 - Python 后端 Worker
通过 stdin/stdout JSON 行与 Electron 主进程通信
"""

import sys
import json
import traceback
from knowledge_graph import graph

# ============================================================
# 处理器路由表
# 每个函数接收 params(dict)，返回可 JSON 序列化的结果
# ============================================================

HANDLERS = {}

def register(action):
    """装饰器：注册处理器"""
    def decorator(func):
        HANDLERS[action] = func
        return func
    return decorator


# ---------- 图谱数据 ----------

@register("get_graph")
def handle_get_graph(params):
    """获取完整图谱数据"""
    return graph.get_graph()

@register("load_sample")
def handle_load_sample(params):
    """加载示例图谱"""
    return graph.load_sample()


# ---------- 节点 CRUD ----------

@register("add_node")
def handle_add_node(params):
    """添加节点"""
    return graph.add_node(
        label=params.get("label", "新节点"),
        color=params.get("color", "#00E8C6"),
        properties=params.get("properties", {}),
    )

@register("update_node")
def handle_update_node(params):
    """更新节点"""
    node_id = params.get("node_id")
    if not node_id:
        raise ValueError("缺少 node_id")
    return graph.update_node(
        node_id=node_id,
        label=params.get("label"),
        color=params.get("color"),
        properties=params.get("properties"),
    )

@register("delete_node")
def handle_delete_node(params):
    """删除节点"""
    node_id = params.get("node_id")
    if not node_id:
        raise ValueError("缺少 node_id")
    return graph.delete_node(node_id)

@register("get_node")
def handle_get_node(params):
    """获取单个节点"""
    node_id = params.get("node_id")
    if not node_id:
        raise ValueError("缺少 node_id")
    return graph.get_node(node_id)


# ---------- 边 CRUD ----------

@register("add_edge")
def handle_add_edge(params):
    """添加边"""
    from_id = params.get("from")
    to_id = params.get("to")
    if not from_id or not to_id:
        raise ValueError("缺少 from 或 to")
    return graph.add_edge(
        from_id=from_id,
        to_id=to_id,
        label=params.get("label", "关联"),
        color=params.get("color", "#6B7280"),
        properties=params.get("properties", {}),
    )

@register("update_edge")
def handle_update_edge(params):
    """更新边"""
    edge_id = params.get("edge_id")
    if not edge_id:
        raise ValueError("缺少 edge_id")
    return graph.update_edge(
        edge_id=edge_id,
        label=params.get("label"),
        color=params.get("color"),
        properties=params.get("properties"),
    )

@register("delete_edge")
def handle_delete_edge(params):
    """删除边"""
    edge_id = params.get("edge_id")
    if not edge_id:
        raise ValueError("缺少 edge_id")
    return graph.delete_edge(edge_id)

@register("get_edge")
def handle_get_edge(params):
    """获取单条边"""
    edge_id = params.get("edge_id")
    if not edge_id:
        raise ValueError("缺少 edge_id")
    return graph.get_edge(edge_id)


# ---------- 搜索 ----------

@register("search_nodes")
def handle_search_nodes(params):
    """搜索节点"""
    query = params.get("query", "")
    return graph.search_nodes(query)


# ---------- 持久化 ----------

@register("save_graph")
def handle_save_graph(params):
    """保存图谱到文件"""
    filepath = params.get("filepath")
    if not filepath:
        raise ValueError("缺少 filepath")
    return graph.save_to_file(filepath)

@register("load_graph")
def handle_load_graph(params):
    """从文件加载图谱"""
    filepath = params.get("filepath")
    if not filepath:
        raise ValueError("缺少 filepath")
    return graph.load_from_file(filepath)

@register("new_graph")
def handle_new_graph(params):
    """新建空白图谱"""
    graph.clear()
    return graph.get_graph()


# ============================================================
# 主循环：从 stdin 读取 JSON 请求，处理，往 stdout 写 JSON 响应
# ============================================================

def main():
    """主循环"""
    # 确保 stdout 是行缓冲的
    sys.stdin.reconfigure(encoding='utf-8', errors='replace')
    sys.stdout.reconfigure(encoding='utf-8')

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        msg_id = -1
        try:
            request = json.loads(line)
            msg_id = request.get("id", -1)
            action = request.get("action", "")
            # 提取除 id, action 之外的参数
            params = {k: v for k, v in request.items() if k not in ("id", "action")}

            if action in HANDLERS:
                try:
                    result = HANDLERS[action](params)
                    response = {"id": msg_id, "result": result}
                except Exception as e:
                    response = {"id": msg_id, "error": f"{type(e).__name__}: {str(e)}"}
            else:
                response = {"id": msg_id, "error": f"未知操作: {action}"}

        except json.JSONDecodeError as e:
            response = {"id": msg_id, "error": f"JSON 解析失败: {e}"}
        except Exception as e:
            response = {"id": msg_id, "error": f"{type(e).__name__}: {str(e)}"}

        # 写响应
        sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
