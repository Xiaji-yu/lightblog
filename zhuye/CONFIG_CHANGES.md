# Zhuye Blog-Box 配置变更总结

## 📅 变更日期
2026-03-26

## 🎯 变更内容

### 1. 端口修改
- **zhuye API端口**从3000改为**3001**
- 避免与blog服务端口冲突

### 2. API架构变更
- **之前**: 前端直接调用blog API (http://localhost:3000/api/articles)
- **现在**: 前端调用zhuye代理API (/api/articles) → zhuye后端转发 → blog API

### 3. 安全性提升
- **之前**: Token暴露在前端代码中
- **现在**: Token存储在zhuye后端环境变量中，前端无需知道

---

## 📝 修改的文件

### 核心代码文件
1. **zhuye/api/server.js**
   - 第9行: `PORT = process.env.PORT || 3001` (从3000改为3001)
   - 第238-267行: 新增 `/api/articles` 代理路由
   - 新增配置常量:
     - `BLOG_SERVICE_URL`
     - `BLOG_API_TOKEN`

2. **zhuye/static/index.html**
   - 第71-84行: 新增blog-box HTML结构

3. **zhuye/static/script.js**
   - 第203-262行: `loadBlogPosts()` 函数
   - 第264-283行: `renderBlogPosts()` 函数
   - 第285-295行: 辅助函数
   - 第297-299行: 集成到DOMContentLoaded
   - API URL改为相对路径: `/api/articles`

4. **zhuye/static/style.css**
   - 第270-410行: blog-box样式
   - 第537-547行: 响应式样式

### 配置文件
5. **zhuye/.env** (实际配置)
   - PORT=3001 (从3000修改)
   - BLOG_SERVICE_URL=http://localhost:3000
   - BLOG_API_TOKEN=blog_mn7alwxy_mua3znpcofa

6. **zhuye/api/.env.example** (示例文件)
   - 同步更新为3001端口和新增blog配置

### 文档文件
7. **BLOG_BOX_SUMMARY.md** - 完整功能文档
8. **BLOG_BOX_QUICKREF.md** - 快速参考
9. **test-blog-api.bat** - 测试脚本

---

## 🔄 架构对比

### 修改前
```
前端浏览器 → http://localhost:3000/api/articles (blog服务)
          → Token硬编码在前端
          → 跨域问题(CORS)
```

### 修改后
```
前端浏览器 → http://localhost:3001/api/articles (zhuye服务)
          → zhuye代理转发 → http://localhost:3000/api/articles
          → Token在后端配置
          → 同域请求，无CORS问题
```

---

## ✅ 优势

1. **安全性**: Token不再暴露给客户端
2. **解耦**: 前端无需知道blog服务地址
3. **灵活性**: 可轻松切换blog服务地址
4. **CORS**: 同源请求，无需配置CORS
5. **统一**: 所有API通过zhuye统一入口

---

## 🚀 部署步骤

### 1. 更新环境变量
确保 `zhuye/.env` 包含:
```bash
PORT=3001
BLOG_SERVICE_URL=http://localhost:3000
BLOG_API_TOKEN=blog_mn7alwxy_mua3znpcofa
```

### 2. 重启zhuye服务
```bash
# 如果正在运行，先停止 (Ctrl+C)
# 然后重新启动
cd D:\python\www\zhuye\api
node server.js
# 或: start-blog.bat
```

### 3. 验证配置
```bash
# 测试zhuye代理API
curl http://localhost:3001/api/articles
# 应该返回文章列表JSON
```

### 4. 访问主页
打开浏览器: http://localhost:3001
- blog-box应显示最新5篇文章
- 点击"阅读全文"可跳转到blog

---

## 🧪 测试检查清单

- [ ] zhuye服务启动在端口3001
- [ ] blog服务启动在端口3000
- [ ] 访问 http://localhost:3001/api/articles 返回文章列表
- [ ] 浏览器打开 http://localhost:3001 显示blog-box
- [ ] blog-box显示5篇文章（标题、日期、分类、摘要）
- [ ] 点击"阅读全文"能跳转到blog文章页
- [ ] 点击"查看更多"跳转到blog主页
- [ ] 刷新页面，blog-box重新加载
- [ ] 停止blog服务，显示错误提示和备用链接
- [ ] 移动端响应式布局正常

---

## 📊 统计

- **修改文件数**: 9个
- **新增代码行数**: ~256行
- **涉及端口**: zhuye(3001) → blog(3000)
- **API调用**: 前端(1) → zhuye代理(1) → blog(1) = 减少前端请求复杂度

---

## 🔧 故障排除

### 问题1: blog-box显示"加载失败"
**检查**:
```bash
# 1. blog服务是否运行
curl http://localhost:3000/api/articles -H "Authorization: Bearer blog_mn7alwxy_mua3znpcofa"

# 2. zhuye代理是否正常
curl http://localhost:3001/api/articles

# 3. 查看zhuye日志
tail -f logs/blog.log  # 如果有配置日志
```

### 问题2: 端口冲突
**解决**: 修改 `.env` 中的PORT值，重启服务

### 问题3: Token无效
**解决**: 检查blog的users.json中是否有有效token

---

## 📚 相关文档

- `BLOG_BOX_SUMMARY.md` - 完整功能说明
- `BLOG_BOX_QUICKREF.md` - 快速参考
- `test-blog-api.bat` - API测试工具
- `.env.example` - 环境变量示例

---

**状态**: ✅ 配置完成
**最后更新**: 2026-03-26
