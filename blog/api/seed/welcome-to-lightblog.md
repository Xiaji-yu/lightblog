---
title: 欢迎使用 LightBlog
date: 2026-06-20
category: 入门
cover: article1.jpg
excerpt: LightBlog 是一个基于 Node.js + Markdown 的轻量级博客系统，几分钟即可完成部署。
---

# 欢迎使用 LightBlog

LightBlog 是一个**轻量级、零数据库**的个人博客系统。你只需要一个支持 Node.js 的服务器，就能拥有一个完整的博客。

## 特性

- 📝 **Markdown 写作** — 所有文章以 `.md` 文件存储，支持 Front Matter 元数据
- 🎨 **暗色模式** — 自动响应系统主题，也可手动切换
- 🔐 **安全认证** — Session + API Token 双重认证，密码 bcrypt 哈希存储
- 📱 **响应式设计** — 完美适配桌面、平板和手机
- ⚡ **高性能** — Nginx 静态文件直出 + Node.js API 代理
- 🏷️ **分类与标签** — 支持文章分类和标签筛选
- 📖 **时间线视图** — 以时间线方式浏览所有文章

## 快速开始

```bash
# 克隆项目
git clone https://github.com/Xiaji-yu/lightblog.git
cd lightblog/api

# 安装依赖
npm install

# 启动服务
node server.js
```

浏览器访问 `http://localhost:3000` 即可看到你的博客。

## 管理后台

访问 `/admin.html`，使用首次启动时控制台打印的管理员账号密码登录。

登录后你可以：
- 创建、编辑、删除文章
- 管理 API Token
- 修改管理员密码

---

> 更多信息请参考项目 [README](https://github.com/Xiaji-yu/lightblog) 和 [API 文档](API_DOCUMENTATION.md)。