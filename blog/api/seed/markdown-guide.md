---
title: Markdown 写作指南
date: 2026-06-18
category: 教程
cover: article2.jpg
excerpt: 掌握 Markdown 基础语法，写出结构清晰、排版优美的技术文章。
---

# Markdown 写作指南

Markdown 是一种轻量级标记语言，让你用纯文本格式编写文档，然后转换为结构化的 HTML。

## 基础语法

### 标题

使用 `#` 号标记标题，支持 1-6 级：

```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 文本格式

- **粗体**：`**粗体**`
- *斜体*：`*斜体*`
- ~~删除线~~：`~~删除线~~`
- `行内代码`：`` `代码` ``

### 链接与图片

```markdown
[链接文字](https://example.com)
![图片描述](image.jpg)
```

### 列表

无序列表：

```markdown
- 项目一
- 项目二
  - 子项目
```

有序列表：

```markdown
1. 第一步
2. 第二步
3. 第三步
```

## 代码块

使用三个反引号包裹代码块，并指定语言：

```python
def hello():
    print("Hello, World!")
```

```javascript
const greeting = "Hello, World!";
console.log(greeting);
```

## 引用

> 这是一段引用文字。
> 可以包含多个段落。

## 表格

| 功能 | 状态 | 优先级 |
|------|------|--------|
| 文章编辑 | ✅ 完成 | 高 |
| 评论系统 | 🚧 开发中 | 中 |
| RSS 订阅 | 📋 计划中 | 低 |

## 分割线

使用三个或更多 `-`、`*` 或 `_`：

---

## Front Matter

LightBlog 支持在文章开头使用 Front Matter 定义元数据：

```yaml
---
title: 文章标题
date: 2026-06-18
category: 教程
cover: article2.jpg
excerpt: 文章摘要
---
```

写好 Front Matter 能让你的文章在博客中正确显示标题、日期、分类和封面图。