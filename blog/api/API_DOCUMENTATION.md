# 博客系统 API 接口文档

## 📋 概述

本博客系统提供完整的 RESTful API 接口，用于获取文章列表和阅读文章内容。所有API返回JSON格式数据。

**⚠️ 注意**：自v2.0版本起，**所有API接口需要登录认证**（管理员权限）。

## 🔐 认证说明

### 登录获取Session

首先需要登录获取session cookie：

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt
```

登录成功后，后续请求需要携带cookies：

```bash
curl -b cookies.txt http://localhost:3000/api/articles
```

## 📖 API 接口列表

### 1. 获取文章列表

**接口**：`GET /api/articles`

**描述**：获取所有文章的元数据列表（不包含完整内容），按发布日期倒序排列

**认证**：✅ 需要登录

**请求参数**：无

**响应示例**：

```json
[
  {
    "id": "art_mn5qp1cv_ri4ubsie3",
    "filename": "openclaw部署及连接napcat教程-1774424511940.md",
    "title": "OpenClaw部署及连接napcat教程",
    "date": "2026-02-10",
    "category": "openclaw, NapCat, websocket",
    "cover": "article1.jpg",
    "excerpt": "本文介绍了OpenClaw的部署和配置流程..."
  }
]
```

**字段说明**：

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 文章唯一标识（随机生成，不暴露文件名） |
| filename | string | 实际存储的文件名（服务器端使用） |
| title | string | 文章标题 |
| date | string | 发布日期（YYYY-MM-DD格式） |
| category | string | 文章分类 |
| cover | string | 封面图片文件名（可选） |
| excerpt | string | 文章摘要（前150字符或front matter中的excerpt） |

**使用示例**：

```bash
# 使用curl
curl -b cookies.txt "http://localhost:3000/api/articles"

# 使用JavaScript
fetch('/api/articles', {
  credentials: 'include'  // 重要：包含cookies
})
.then(res => res.json())
.then(data => console.log(data));

# 使用Python
import requests
response = requests.get('http://localhost:3000/api/articles', cookies=cookies)
articles = response.json()
```

---

### 2. 获取单篇文章

**接口**：`GET /api/articles/:id`

**描述**：根据文章ID获取单篇文章的完整内容

**认证**：✅ 需要登录

**请求参数**：

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| id | path | string | ✅ | 文章ID（从文章列表API获取） |
| html | query | boolean | ❌ | 是否返回渲染后的HTML（默认false，返回Markdown） |

**响应（Markdown格式）**：

```json
{
  "id": "art_mn5qp1cv_ri4ubsie3",
  "filename": "openclaw部署及连接napcat教程-1774424511940.md",
  "meta": {
    "title": "OpenClaw部署及连接napcat教程",
    "date": "2026-02-10",
    "category": "openclaw, NapCat, websocket",
    "cover": "article1.jpg",
    "excerpt": "本文介绍了..."
  },
  "content": "# 文章正文\n\n使用Markdown语法...",
  "excerpt": "摘要内容"
}
```

**响应（HTML格式，?html=true）**：

```json
{
  "id": "art_mn5qp1cv_ri4ubsie3",
  "filename": "openclaw部署及连接napcat教程-1774424511940.md",
  "meta": {
    "title": "OpenClaw部署及连接napcat教程",
    "date": "2026-02-10",
    "category": "openclaw, NapCat, websocket",
    "cover": "article1.jpg",
    "excerpt": "本文介绍了..."
  },
  "content": "<h1>OpenClaw部署及连接napcat教程</h1>\n<blockquote>...</blockquote>\n<h2>目录</h2>\n<ul>...",
  "excerpt": "摘要内容"
}
```

**使用示例**：

```bash
# 获取Markdown原文
curl -b cookies.txt "http://localhost:3000/api/articles/art_mn5qp1cv_ri4ubsie3"

# 获取HTML渲染后的内容
curl -b cookies.txt "http://localhost:3000/api/articles/art_mn5qp1cv_ri4ubsie3?html=true"
```

---

### 3. 获取当前会话信息

**接口**：`GET /api/session`

**描述**：获取当前登录用户信息

**认证**：❌ 无需登录（公开接口）

**响应示例**：

```json
// 已登录
{
  "isLoggedIn": true,
  "user": {
    "username": "admin",
    "role": "admin",
    "displayName": "管理员"
  }
}

// 未登录
{
  "isLoggedIn": false
}
```

---

### 4. 用户登录

**接口**：`POST /api/login`

**描述**：用户登录获取session

**认证**：❌ 无需登录（公开接口）

**请求体**：

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**：

```json
{
  "success": true,
  "message": "登录成功",
  "user": {
    "username": "admin",
    "role": "admin",
    "displayName": "管理员"
  }
}
```

---

### 5. 用户登出

**接口**：`POST /api/logout`

**描述**：登出并销毁session

**认证**：✅ 需要登录

**响应示例**：

```json
{
  "success": true,
  "message": "已登出"
}
```

---

### 6. 修改密码

**接口**：`POST /api/change-password`

**描述**：修改当前登录用户的密码

**认证**：✅ 需要登录

**请求体**：

```json
{
  "currentPassword": "旧密码",
  "newPassword": "新密码"
}
```

**响应示例**：

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

**错误响应**：

```json
// 400 - 参数错误
{
  "error": "当前密码和新密码不能为空"
}

// 400 - 密码太短
{
  "error": "新密码长度至少6位"
}

// 401 - 当前密码错误
{
  "error": "当前密码错误"
}
```

---

## 🔧 常见使用场景

### 场景1：构建移动端App

```javascript
// 1. 登录
const login = async (username, password) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
};

// 2. 获取文章列表
const getArticles = async () => {
  const res = await fetch('/api/articles', {
    credentials: 'include'  // 自动携带cookie
  });
  return res.json();
};

// 3. 阅读文章（HTML格式）
const getArticleHtml = async (articleId) => {
  const res = await fetch(`/api/articles/${articleId}?html=true`, {
    credentials: 'include'
  });
  return res.json();
};
```

### 场景2：第三方网站嵌入

```html
<!-- 使用iframe嵌入文章 -->
<iframe src="/article.html?id=art_mn5qp1cv_ri4ubsie3" width="100%" height="600"></iframe>
```

或者通过API获取数据后自定义渲染：

```javascript
// 获取文章HTML内容并显示
fetch('/api/articles/art_mn5qp1cv_ri4ubsie3?html=true', {
  credentials: 'include'
})
.then(res => res.json())
.then(article => {
  document.getElementById('article-content').innerHTML = article.content;
  document.title = article.meta.title;
});
```

### 场景3：数据备份/导出

```bash
#!/bin/bash
# 备份所有文章为JSON
curl -b cookies.txt "http://localhost:3000/api/articles" > articles_backup_$(date +%Y%m%d).json

# 导出所有文章为Markdown文件
curl -b cookies.txt "http://localhost:3000/api/articles" | \
  python3 -c "
import sys, json, os
data = json.load(sys.stdin)
for article in data:
    filename = article['filename']
    content = requests.get(f'http://localhost:3000/api/articles/{article[\"id\"]}', cookies=cookies).json()['content']
    with open(f'backup/{filename}', 'w', encoding='utf-8') as f:
        f.write(content)
"
```

---

## 🛡️ 安全说明

### 当前认证方式
- ✅ 基于Session的认证
- ✅ Cookie自动管理
- ✅ 所有管理API需要登录
- ⚠️ 密码明文存储（仅开发环境）

### 生产环境建议
1. **HTTPS**：强制使用HTTPS，设置 `cookie.secure: true`
2. **密码哈希**：使用bcrypt等库存储密码哈希
3. **Rate Limiting**：添加登录尝试频率限制
4. **CORS**：根据需要配置CORS策略
5. **API密钥**：为公开API考虑添加API密钥认证
6. **Session存储**：使用Redis等外部存储支持多实例部署

---

## 📊 数据格式说明

### Front Matter格式

文章文件（.md）使用YAML格式的Front Matter：

```markdown
---
title: 文章标题
date: 2024-03-15
category: 技术
cover: article1.jpg
excerpt: 文章简短描述
---

# 文章正文

正文内容...
```

API会解析这些字段并返回到 `meta` 对象中。

---

## 🧪 API测试工具

您可以使用以下工具测试API：

1. **curl**（命令行）
2. **Postman** / **Insomnia**（桌面应用）
3. **浏览器开发者工具**（Console或Network面板）
4. **在线工具**：https://reqbin.com/ （需配置携带cookies）

---

## 🔄 版本更新

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2024-03 | 基础文章CRUD API（无需认证） |
| v2.0 | 2025-03-26 | 添加登录认证，所有API需要管理员权限 |

---

## ❓ 常见问题

### Q: 为什么API需要登录？
A: 为防止未授权访问和文章内容泄露，所有API自v2.0起需要管理员登录认证。

### Q: 如何让部分API公开（如博客首页）？
A: 需要修改 `server.js`，移除特定路由的 `requireAuth` 中间件。例如让文章列表公开：
```javascript
app.get('/api/articles', async (req, res) => { ... }  // 移除 requireAuth
```

### Q: API返回的ID是什么格式？
A: ID是随机生成的字符串（如 `art_mn5qp1cv_ri4ubsie3`），不暴露实际文件名，提高安全性。

### Q: 如何获取HTML渲染的文章？
A: 在URL中添加查询参数 `?html=true`，服务器会使用marked库将Markdown渲染为HTML。

---

**文档版本**：v2.0
**最后更新**：2025-03-26
**API状态**：✅ 稳定运行
