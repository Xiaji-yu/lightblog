# Zhuye Blog-Box 添加总结

## ✅ 已完成的功能

在zhuye个人主页的 `div.profile-box` 下方成功添加了 `div.blog-box` 组件，用于显示从blog API获取的最新文章列表。

---

## 📝 修改的文件

### 1. index.html
**位置**: 第71行开始

添加了blog-box HTML结构：
```html
<!-- 博客文章列表 -->
<div class="blog-box">
    <div class="blog-header">
        <h2>📝 最新文章</h2>
        <a href="http://localhost:3000" target="_blank" class="blog-more">查看更多 →</a>
    </div>
    <div class="blog-list" id="blog-list">
        <div class="blog-loading">加载中...</div>
    </div>
</div>
```

---

### 2. script.js
**新增功能**:

1. **loadBlogPosts()** - 异步获取博客文章列表
   - API地址: `/api/articles` (相对路径，通过zhuye代理)
   - 超时: 10秒
   - 每5分钟自动刷新

2. **renderBlogPosts(articles)** - 渲染文章列表
   - 显示最新5篇文章
   - 包含标题、日期、摘要、分类、阅读链接

3. **辅助函数**:
   - `escapeHtml()` - XSS防护
   - `formatDate()` - 日期格式化

**集成位置**: 第297-299行
```javascript
// 加载博客文章列表
loadBlogPosts();
// 每5分钟刷新一次博客文章
setInterval(loadBlogPosts, 300000);
```

---

### 3. style.css
**新增样式** (约40行，第270-410行):

- `.blog-box` - 主容器
- `.blog-header` - 标题栏
- `.blog-more` - "查看更多"链接（悬停效果）
- `.blog-list` - 文章列表容器
- `.blog-item` - 单篇文章卡片（悬停效果）
- `.blog-item-header` - 文章标题和日期
- `.blog-item-title` - 文章标题
- `.blog-item-date` - 发布日期
- `.blog-item-excerpt` - 文章摘要（限制3行）
- `.blog-item-footer` - 底部分类和链接
- `.blog-item-category` - 分类标签
- `.blog-item-link` - "阅读全文"链接
- `.blog-loading` - 加载状态
- `.blog-empty` - 空状态（含备用链接）
- `.blog-error` - 错误状态（含备用链接）
- `.blog-backup-link` - 备用跳转链接

**响应式设计**: 移动端优化（第537-547行）

---

## 🔌 API配置

**架构**: zhuye后端代理 → blog后端 → Markdown文件

```
用户请求 → zhuye:3001/api/articles → blog:3000/api/articles → 返回文章数据
```

| 项目 | 值 |
|------|-----|
| 前端请求URL | `/api/articles` (相对路径) |
| zhuye代理路由 | `/api/articles` |
| blog服务地址 | `http://localhost:3000` (默认) |
| Token配置 | `BLOG_API_TOKEN` 环境变量 |
| 默认Token | YOUR_BLOG_API_TOKEN |
| 刷新间隔 | 5分钟 |
| 显示数量 | 5篇 |

---

## 🎨 功能特性

✅ **自动获取** - 页面加载时自动从blog API获取文章
✅ **实时更新** - 每5分钟自动刷新
✅ **响应式设计** - 适配桌面和移动端
✅ **悬停效果** - 卡片悬停动画
✅ **错误处理** - API失败时显示错误和备用链接
✅ **XSS防护** - 使用escapeHtml转义内容
✅ **美观展示** - 日期分类标签，摘要截断
✅ **直接跳转** - 点击阅读全文跳转到blog文章页

---

## 🚀 使用说明

### 前置条件
1. **blog服务**必须运行在 `http://localhost:3000` (或配置的地址)
2. **zhuye服务**必须运行在 `http://localhost:3001`
3. Token `YOUR_BLOG_API_TOKEN` 必须在blog的users.json中配置

### 启动步骤

**方式一：临时启动**

1. 启动blog服务（端口3000）:
   ```bash
   cd D:\python\www\blog
   node server.js
   ```

2. 启动zhuye服务（端口3001）:
   ```bash
   cd D:\python\www\zhuye\api
   node server.js
   ```

3. 访问: http://localhost:3001

**方式二：使用Windows服务** (推荐)

1. 安装blog服务（如果未安装）:
   ```bash
   cd D:\python\www\blog
   install-service.bat
   ```

2. 启动zhuye服务:
   ```bash
   cd D:\python\www\zhuye\api
   start-blog.bat
   ```

3. 访问: http://localhost:3001

### 故障处理
- **加载失败**: 显示错误信息和"前往博客主页查看"链接
- **无文章**: 显示"暂无文章"和备用链接
- **API不可用**: 自动降级到备用链接

---

## 📊 文件修改统计

| 文件 | 修改行数 | 说明 |
|------|----------|------|
| index.html | +16行 | 添加blog-box HTML |
| script.js | +65行 | 添加JS功能 |
| style.css | +145行 | 添加样式和响应式 |
| api/server.js | +30行 | 修改端口为3001，添加代理路由 |
| **总计** | **+256行** | |

---

## 📝 API代理实现

---

## 🔍 测试步骤

### 1. 检查服务状态

**测试blog API** (端口3000):
```bash
curl -s http://localhost:3000/api/articles \
  -H "Authorization: Bearer YOUR_BLOG_API_TOKEN" \
  | head -20
```
预期返回JSON数组

**测试zhuye代理API** (端口3001):
```bash
curl -s http://localhost:3001/api/articles | head -20
```
预期返回与blog API相同的数据

### 2. 浏览器测试

1. 访问 http://localhost:3001
2. 检查页面是否正常显示
3. 查看blog-box区域：
   - ✅ 应该显示"加载中..."（短暂）
   - ✅ 然后显示5篇文章列表
   - ✅ 每篇文章包含：标题、日期、分类、摘要、阅读链接
4. 点击"阅读全文"跳转到blog文章页
5. 点击"查看更多"跳转到blog主页

### 3. 刷新测试

- 刷新页面，blog-box应重新加载
- 每5分钟自动刷新一次（可观察网络请求）

### 4. 故障测试

- 停止blog服务，查看错误提示
- 修改zhuye的BLOG_API_TOKEN测试认证失败
- 移动端测试响应式效果
- 检查浏览器控制台是否有错误

### 5. 运行自动化测试脚本

```bash
cd D:\python\www\zhuye
test-blog-api.bat
```

---

## 🎯 注意事项

1. **端口配置**:
   - zhuye服务运行在端口3001
   - blog服务运行在端口3000
   - 修改 `zhuye/api/server.js` 第9行可更改zhuye端口
   - 修改 `BLOG_SERVICE_URL` 环境变量可更改blog服务地址

2. **Token配置**:
   - Token已移至后端（zhuye server.js），前端无需暴露
   - 可通过环境变量 `BLOG_API_TOKEN` 修改
   - 默认Token: `YOUR_BLOG_API_TOKEN`

3. **环境变量支持** (可选):
   ```bash
   # zhuye/.env 文件可添加：
   PORT=3001
   BLOG_SERVICE_URL=http://localhost:3000
   BLOG_API_TOKEN=YOUR_BLOG_API_TOKEN
   ```

4. **性能优化**:
   - 当前每5分钟刷新一次
   - 可考虑在zhuye后端添加缓存机制
   - 可添加文章封面图显示

5. **扩展功能** (可选):
   - 显示文章封面图
   - 添加搜索功能
   - 分类筛选
   - 加载更多按钮
   - 本地缓存减少请求

---

## 📝 版本信息

- **创建日期**: 2026-03-26
- **修改内容**: 为zhuye添加blog-box组件
- **API端口**: 3000
- **Zhuye端口**: 3001
- **Token有效期**: 永久（当前配置）

---

**状态**: ✅ 完成
**测试状态**: 待测试（需确保blog服务运行）
