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
```

---

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
```

---

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
