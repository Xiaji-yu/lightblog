const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { marked } = require('marked');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// 常量
const BCRYPT_SALT_ROUNDS = 10;
const TITLE_MAX_LENGTH = 200;
const CONTENT_MAX_LENGTH = 500000;
const EXCERPT_LENGTH = 150;

// 初始化 DOMPurify（用于服务端 HTML 清洗）
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// 安全的随机 ID 生成
function secureRandomHex(bytes = 8) {
    return crypto.randomBytes(bytes).toString('hex');
}

// 支持分离部署：数据目录可通过环境变量配置
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'app-data');
const MD_DIR = path.join(DATA_DIR, 'md');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ID_MAP_FILE = path.join(DATA_DIR, 'article-id-map.json');
const LOG_DIR = path.join(DATA_DIR, 'logs');

const DISABLE_STATIC = process.env.DISABLE_STATIC === 'true'; // 设置为true时禁用静态文件服务（用于Nginx反向代理场景）

// 初始化 Session 中间件
const sessionSecret = (() => {
    if (process.env.SESSION_SECRET) {
        return process.env.SESSION_SECRET;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    if (process.env.NODE_ENV === 'production') {
        console.error('致命错误: SESSION_SECRET 环境变量未设置，生产环境必须配置');
        process.exit(1);
    }
    console.warn('⚠️  SESSION_SECRET 未设置，已生成随机密钥（重启后所有用户需重新登录）');
    return generated;
})();

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
}));

// 默认用户（首次运行时创建，密码从环境变量读取或生成随机密码）
const DEFAULT_USERS = {
    'admin': {
        username: 'admin',
        password: null,
        role: 'admin',
        displayName: '管理员',
        apiTokenHash: null
    },
    'superadmin': {
        username: 'superadmin',
        password: null,
        role: 'superadmin',
        displayName: '超级管理员',
        apiTokenHash: null
    }
};

// 全局用户数据
let users = {};

// 全局变量（内存中的映射）
let articleIdMap = {};

// 加载或创建用户数据
async function loadUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        users = JSON.parse(data);

        // 迁移：检查并升级明文密码为 bcrypt 哈希
        let migrated = false;
        for (const [username, user] of Object.entries(users)) {
            if (user.password && !user.password.startsWith('$2')) {
                // 密码不是 bcrypt 哈希，自动升级
                user.password = await bcrypt.hash(user.password, BCRYPT_SALT_ROUNDS);
                migrated = true;
            }
        }
        if (migrated) {
            await saveUsers();
            console.log('已自动升级密码为 bcrypt 哈希');
        }

        console.log('已加载用户数据，共', Object.keys(users).length, '个用户');
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('加载用户数据失败:', error);
        }
        // 用户文件不存在，创建默认用户
        users = JSON.parse(JSON.stringify(DEFAULT_USERS)); // 深拷贝

        // 从环境变量设置密码，或生成随机密码
        const adminPassword = process.env.ADMIN_PASSWORD || secureRandomHex(8);
        const superadminPassword = process.env.SUPERADMIN_PASSWORD || secureRandomHex(8);

        users.admin.password = await bcrypt.hash(adminPassword, BCRYPT_SALT_ROUNDS);
        users.superadmin.password = await bcrypt.hash(superadminPassword, BCRYPT_SALT_ROUNDS);

        await saveUsers();
        console.log('已创建默认用户数据');
        if (!process.env.ADMIN_PASSWORD) {
            console.log(`  admin 初始密码: ${adminPassword}`);
        }
        if (!process.env.SUPERADMIN_PASSWORD) {
            console.log(`  superadmin 初始密码: ${superadminPassword}`);
        }
        console.log('  ⚠️ 请登录后立即修改密码，这些密码仅显示一次');
    }
}

// 保存用户数据
async function saveUsers() {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    } catch (error) {
        console.error('保存用户数据失败:', error);
    }
}

// 验证用户凭据
async function verifyPassword(plainPassword, storedPassword) {
    return await bcrypt.compare(plainPassword, storedPassword);
}

// 生成API Token
function generateApiToken() {
    return 'blog_' + Date.now().toString(36) + '_' + secureRandomHex(32);
}

// 哈希API Token（SHA-256，仅存储哈希值）
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// Token认证中间件（用于API）
function requireTokenAuth(req, res, next) {
    // 首先检查是否已登录（Session认证）
    if (req.session && req.session.user) {
        req.user = req.session.user; // 统一通过 req.user 获取用户信息
        return next();
    }

    // 否则检查Token认证
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权，请提供有效的Token' });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
        return res.status(401).json({ error: 'Token不能为空' });
    }

    // 验证Token（比较哈希值）
    const tokenHash = hashToken(token);
    const user = Object.values(users).find(u => u.apiTokenHash === tokenHash);
    if (!user) {
        return res.status(401).json({ error: '无效的Token' });
    }

    // Token有效，将用户信息附加到req对象
    req.user = user;
    next();
}

// 加载或创建ID映射
async function loadIdMap() {
    try {
        const data = await fs.readFile(ID_MAP_FILE, 'utf-8');
        articleIdMap = JSON.parse(data);
        console.log('已加载文章ID映射，共', Object.keys(articleIdMap).length, '篇文章');
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('加载ID映射失败:', error);
        }
        // 映射文件不存在，为现有文章创建映射
        await rebuildIdMap();
    }
}

// 重建ID映射（扫描所有md文件）
async function rebuildIdMap() {
    try {
        const files = await fs.readdir(MD_DIR);
        const mdFiles = files.filter(file => file.endsWith('.md'));
        articleIdMap = {};

        for (const file of mdFiles) {
            // 为所有文件（包括旧文件）生成新的随机ID，避免暴露文件名
            const newId = generateId();
            articleIdMap[newId] = file;
        }

        await saveIdMap();
        console.log('已重建文章ID映射（所有文章使用随机ID），共', mdFiles.length, '篇文章');
    } catch (error) {
        console.error('重建ID映射失败:', error);
    }
}

// 保存ID映射
async function saveIdMap() {
    try {
        await fs.writeFile(ID_MAP_FILE, JSON.stringify(articleIdMap, null, 2), 'utf-8');
    } catch (error) {
        console.error('保存ID映射失败:', error);
    }
}

// 解析 Front Matter（支持多行列表格式）
function parseFrontMatter(content) {
    const frontMatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    let meta = {};
    let body = content;

    if (frontMatterMatch) {
        const frontMatter = frontMatterMatch[1];
        body = content.replace(frontMatterMatch[0], '');

        const lines = frontMatter.split('\n');
        let currentKey = null;
        let currentList = [];

        lines.forEach(line => {
            const match = line.match(/^([^:]+):\s*(.*)$/);
            if (match) {
                if (currentKey && currentList.length > 0) {
                    meta[currentKey] = currentList.join(', ');
                    currentList = [];
                }

                currentKey = match[1].trim();
                let value = match[2].trim();
                value = value.replace(/^["']|["']$/g, '');

                if (value.startsWith('- ')) {
                    currentList.push(value.substring(2));
                } else if (value) {
                    meta[currentKey] = value;
                }
            } else if (currentKey && line.trim().startsWith('- ')) {
                currentList.push(line.trim().substring(2));
            }
        });

        if (currentKey && currentList.length > 0) {
            meta[currentKey] = currentList.join(', ');
        }
    }

    // 确定分类（优先级：tags > tag > category）
    let category = meta.category;
    if (meta.tags) {
        category = meta.tags;
    } else if (meta.tag) {
        category = meta.tag;
    }
    meta.category = category;

    return { meta, body };
}

// 生成随机ID
function generateId() {
    return 'art_' + secureRandomHex(16);
}
function getFilenameById(id) {
    return articleIdMap[id];
}

// 根据ID设置文件名映射
async function setFilenameForId(id, filename) {
    articleIdMap[id] = filename;
    await saveIdMap();
}

// 根据ID删除映射
async function removeIdMapping(id) {
    delete articleIdMap[id];
    await saveIdMap();
}

// 中间件
app.use(express.json());

// 通用 API 频率限制
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 100次请求
    message: { error: '请求过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 登录接口专用频率限制（防暴力破解）
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 10, // 10次尝试
    message: { error: '登录尝试次数过多，请15分钟后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 对所有 API 路由应用通用频率限制
app.use('/api', apiLimiter);

// 屏蔽敏感数据目录的访问（在静态文件服务之前）
app.use((req, res, next) => {
    if (req.path.startsWith('/app-data') || req.path.endsWith('.json') || req.path === '/server.js' || req.path === '/package.json') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
});

// 静态文件服务（仅服务 static/ 目录，而非整个 api 目录）
if (!DISABLE_STATIC) {
    const staticDir = path.join(__dirname, '..', 'static');
    app.use(express.static(staticDir));
    console.log('📁 静态文件服务已启用（由Express提供）');
} else {
    console.log('⚡ 静态文件服务已禁用（由Nginx提供）');
}

// ============ 认证相关 API ============

// 登录接口
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }

        const user = users[username];

        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        if (!await verifyPassword(password, user.password)) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 登录成功，保存用户信息到 session
        req.session.userId = username;
        req.session.user = {
            username: user.username,
            role: user.role,
            displayName: user.displayName
        };

        // 如果用户还没有API Token，自动生成一个
        if (!user.apiTokenHash) {
            const newToken = generateApiToken();
            user.apiTokenHash = hashToken(newToken);
            await saveUsers();
            res.json({
                success: true,
                message: '登录成功',
                user: req.session.user,
                apiToken: newToken
            });
        } else {
            res.json({
                success: true,
                message: '登录成功',
                user: req.session.user,
                apiToken: null  // 已存在token，不重复展示
            });
        }
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: '登录失败' });
    }
});

// 登出接口
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('登出失败:', err);
            return res.status(500).json({ error: '登出失败' });
        }
        res.json({ success: true, message: '已登出' });
    });
});

// 获取当前登录用户信息
app.get('/api/session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            isLoggedIn: true,
            user: req.session.user
        });
    } else {
        res.json({
            isLoggedIn: false
        });
    }
});

// 修改密码接口
app.post('/api/change-password', requireTokenAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const username = req.user.username;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: '当前密码和新密码不能为空' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: '新密码长度至少6位' });
        }

        // 验证当前密码
        const user = users[username];
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        if (!await verifyPassword(currentPassword, user.password)) {
            return res.status(401).json({ error: '当前密码错误' });
        }

        // 更新密码
        users[username].password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
        await saveUsers();

        // 销毁当前Session，强制重新登录
        req.session.destroy((err) => {
            if (err) {
                console.error('销毁Session失败:', err);
            }
        });

        res.json({
            success: true,
            message: '密码修改成功，请重新登录'
        });
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({ error: '修改密码失败' });
    }
});

// ============ Token 管理 API ============

// 获取当前用户的API Token状态
app.get('/api/token', requireTokenAuth, (req, res) => {
    const username = req.user.username;
    const user = users[username];

    if (!user) {
        return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        hasToken: !!user.apiTokenHash
    });
});

// 重置/生成API Token
app.post('/api/token/reset', requireTokenAuth, async (req, res) => {
    try {
        const username = req.user.username;
        const user = users[username];

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 生成新Token，仅返回原始Token一次
        const newToken = generateApiToken();
        user.apiTokenHash = hashToken(newToken);
        await saveUsers();

        res.json({
            success: true,
            message: 'Token已重置，请妥善保存',
            apiToken: newToken
        });
    } catch (error) {
        console.error('重置Token失败:', error);
        res.status(500).json({ error: '重置Token失败' });
    }
});

// 删除API Token（禁用API访问）
app.delete('/api/token', requireTokenAuth, async (req, res) => {
    try {
        const username = req.user.username;
        const user = users[username];

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        user.apiTokenHash = null;
        await saveUsers();

        res.json({
            success: true,
            message: 'Token已删除，API访问已禁用'
        });
    } catch (error) {
        console.error('删除Token失败:', error);
        res.status(500).json({ error: '删除Token失败' });
    }
});

// ============ 文章管理 API（需要登录，支持Session和Token） ============

// 辅助函数：读取所有Markdown文件
async function getAllArticles() {
    const files = await fs.readdir(MD_DIR);
    const mdFiles = files.filter(file => file.endsWith('.md'));

    const articles = await Promise.all(
        mdFiles.map(async (file) => {
            const filePath = path.join(MD_DIR, file);
            const content = await fs.readFile(filePath, 'utf-8');

            const { meta, body } = parseFrontMatter(content);

            const id = Object.keys(articleIdMap).find(key => articleIdMap[key] === file) || file.replace('.md', '');

            return {
                id: id,
                filename: file,
                meta: meta,
                content: body,
                excerpt: meta.excerpt || body.substring(0, EXCERPT_LENGTH) + '...'
            };
        })
    );

    articles.sort((a, b) => new Date(b.meta.date) - new Date(a.meta.date));

    return articles;
}

// 获取所有文章列表（仅元数据）- 公开接口（无需认证）
app.get('/api/public/articles', async (req, res) => {
    try {
        const articles = await getAllArticles();
        const list = articles.slice(0, 5).map(article => ({
            id: article.id,
            filename: article.filename,
            title: article.meta.title,
            date: article.meta.date,
            category: article.meta.category,
            cover: article.meta.cover,
            excerpt: article.excerpt
        }));
        res.json(list);
    } catch (error) {
        console.error('获取公开文章列表失败:', error);
        res.status(500).json({ error: '获取文章列表失败' });
    }
});

// 获取所有文章列表（仅元数据）- 公开访问
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await getAllArticles();
        const list = articles.map(article => ({
            id: article.id,
            filename: article.filename,
            title: article.meta.title,
            date: article.meta.date,
            category: article.meta.category,
            cover: article.meta.cover,
            excerpt: article.excerpt
        }));
        res.json(list);
    } catch (error) {
        console.error('获取文章列表失败:', error);
        res.status(500).json({ error: '获取文章列表失败' });
    }
});

// 获取单篇文章（支持Markdown原始内容和HTML渲染）- 公开访问
app.get('/api/articles/:id', async (req, res) => {
    const { id } = req.params;
    const filename = getFilenameById(id);

    if (!filename) {
        return res.status(404).json({ error: '文章不存在' });
    }

    try {
        const filePath = path.join(MD_DIR, filename);
        const content = await fs.readFile(filePath, 'utf-8');

        const { meta, body } = parseFrontMatter(content);

        const article = {
            id: id,
            filename: filename,
            meta: meta,
            content: body,
            excerpt: meta.excerpt || body.substring(0, EXCERPT_LENGTH) + '...'
        };

        // 支持返回HTML或Markdown
        const asHtml = req.query.html === 'true';

        if (asHtml) {
            // 使用 DOMPurify 清洗 HTML 防止 XSS 攻击
            const rawHtml = marked.parse(article.content);
            res.json({
                ...article,
                content: DOMPurify.sanitize(rawHtml)
            });
        } else {
            res.json(article);
        }
    } catch (error) {
        console.error('读取文章失败:', error);
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: '文章不存在' });
        }
        return res.status(500).json({ error: '获取文章失败' });
    }
});

// 创建新文章
app.post('/api/articles', requireTokenAuth, async (req, res) => {
    try {
        const { title, date, category, cover, excerpt, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: '标题和内容不能为空' });
        }

        if (title.length > TITLE_MAX_LENGTH) {
            return res.status(400).json({ error: '标题不能超过200个字符' });
        }

        if (content.length > CONTENT_MAX_LENGTH) {
            return res.status(400).json({ error: '内容不能超过500000个字符' });
        }

        // 生成随机ID（不暴露在URL中）
        const id = generateId();

        // 生成文件名（服务器端保存，不暴露给前端）
        const timestamp = Date.now();
        const slug = title.toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5\s]/g, '')
            .replace(/\s+/g, '-');
        const filename = `${slug}-${timestamp}-${secureRandomHex(4)}.md`;

        // 转义YAML值（防止注入）
        function escapeYamlValue(val) {
            if (!val) return '';
            return val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        }

        // 构建Front Matter
        const frontMatter = `---
title: "${escapeYamlValue(title)}" 
date: ${date || new Date().toISOString().split('T')[0]}
category: "${escapeYamlValue(category || '未分类')}"
cover: "${escapeYamlValue(cover || '')}"
excerpt: "${escapeYamlValue(excerpt || '')}" 
---

`;

        const fullContent = frontMatter + content;

        await fs.writeFile(
            path.join(MD_DIR, filename),
            fullContent,
            'utf-8'
        );

        // 保存ID映射
        await setFilenameForId(id, filename);

        res.status(201).json({
            id: id,  // 返回随机ID给前端
            filename: filename,  // 文件名保留在服务器端，不用于URL
            message: '文章创建成功'
        });
    } catch (error) {
        console.error('创建文章失败:', error);
        res.status(500).json({ error: '创建文章失败' });
    }
});

// 更新文章
app.put('/api/articles/:id', requireTokenAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, date, category, cover, excerpt, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: '标题和内容不能为空' });
        }

        if (title.length > TITLE_MAX_LENGTH) {
            return res.status(400).json({ error: '标题不能超过200个字符' });
        }

        if (content.length > CONTENT_MAX_LENGTH) {
            return res.status(400).json({ error: '内容不能超过500000个字符' });
        }

        // 直接通过 ID 映射查找文件，避免读取所有文件
        const filename = getFilenameById(id);

        if (!filename) {
            return res.status(404).json({ error: '文章不存在' });
        }

        // 读取原文件以获取已有的 meta 信息作为后备
        let existingMeta = {};
        try {
            const existingContent = await fs.readFile(path.join(MD_DIR, filename), 'utf-8');
            const parsed = parseFrontMatter(existingContent);
            existingMeta = parsed.meta;
        } catch (e) {
            // 文件读取失败，使用空 meta
        }

        // 构建新的Front Matter
        const frontMatter = `---
title: "${escapeYamlValue(title)}" 
date: ${date || existingMeta.date || new Date().toISOString().split('T')[0]}
category: "${escapeYamlValue(category || existingMeta.category || '未分类')}"
cover: "${escapeYamlValue(cover || existingMeta.cover || '')}"
excerpt: "${escapeYamlValue(excerpt || existingMeta.excerpt || '')}" 
---

`;

        const fullContent = frontMatter + content;

        await fs.writeFile(
            path.join(MD_DIR, filename),
            fullContent,
            'utf-8'
        );

        res.json({
            id: id,
            filename: filename,
            message: '文章更新成功'
        });
    } catch (error) {
        console.error('更新文章失败:', error);
        res.status(500).json({ error: '更新文章失败' });
    }
});

// 删除文章
app.delete('/api/articles/:id', requireTokenAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const filename = getFilenameById(id);

        if (!filename) {
            return res.status(404).json({ error: '文章不存在' });
        }

        await fs.unlink(path.join(MD_DIR, filename));

        // 删除ID映射
        await removeIdMapping(id);

        res.json({ message: '文章删除成功' });
    } catch (error) {
        console.error('删除文章失败:', error);
        res.status(500).json({ error: '删除文章失败' });
    }
});

// 启动服务器
app.listen(PORT, async () => {
    // 确保数据目录存在
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(MD_DIR, { recursive: true });
        await fs.mkdir(LOG_DIR, { recursive: true });
        console.log(`✓ 数据目录已创建: ${DATA_DIR}`);

        // 首次运行：从 seed 目录导入示例文章
        const SEED_DIR = path.join(__dirname, 'seed');
        const existingFiles = await fs.readdir(MD_DIR);
        const mdFiles = existingFiles.filter(f => f.endsWith('.md'));

        if (mdFiles.length === 0) {
            try {
                const seedFiles = await fs.readdir(SEED_DIR);
                const seedMdFiles = seedFiles.filter(f => f.endsWith('.md'));

                for (const seedFile of seedMdFiles) {
                    const src = path.join(SEED_DIR, seedFile);
                    const content = await fs.readFile(src, 'utf-8');
                    const dest = path.join(MD_DIR, seedFile);
                    await fs.writeFile(dest, content, 'utf-8');
                }

                console.log(`✓ 已从 seed/ 导入 ${seedMdFiles.length} 篇示例文章`);
            } catch (e) {
                if (e.code !== 'ENOENT') {
                    console.warn('⚠ 导入示例文章失败:', e.message);
                }
            }
        }
    } catch (error) {
        console.error('创建数据目录失败:', error);
    }

    // 启动时加载ID映射
    await loadIdMap();

    // 启动时加载用户数据
    await loadUsers();

    console.log(`博客服务器运行在 http://localhost:${PORT}`);
    console.log(`API接口:`);
    console.log(`  GET    /api/articles          - 获取文章列表（公开）`);
    console.log(`  GET    /api/articles/:id      - 获取单篇文章（公开）`);
    console.log(`  GET    /api/public/articles   - 获取公开文章列表（首页用）`);
    console.log(`  POST   /api/articles          - 创建文章（需Token）`);
    console.log(`  PUT    /api/articles/:id      - 更新文章（需Token）`);
    console.log(`  DELETE /api/articles/:id      - 删除文章（需Token）`);
    console.log(`  POST   /api/login             - 用户登录`);
    console.log(`  POST   /api/logout            - 用户登出`);
    console.log(`  GET    /api/session           - 获取当前会话信息`);
    console.log(`  POST   /api/change-password   - 修改密码（需Token）`);
    console.log(`  GET    /api/token             - 获取API Token状态`);
    console.log(`  POST   /api/token/reset       - 重置API Token`);
    console.log(`  DELETE /api/token             - 删除API Token`);
    console.log(`\n主页: http://localhost:${PORT}/index.html`);
    console.log(`后台: http://localhost:${PORT}/admin.html`);
    console.log(`登录: http://localhost:${PORT}/login.html`);
});
