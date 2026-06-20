// 全局变量
let allArticles = [];
let currentArticleId = '';

// DOM 元素
const articleDetail = document.getElementById('articleDetail');
const tocList = document.getElementById('tocList');

// 从URL获取文章ID
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

if (!articleId) {
    articleDetail.innerHTML = '<div class="error">未指定文章ID</div>';
} else {
    currentArticleId = articleId;
    loadArticle();
    loadAllArticles(); // 加载所有文章列表
}

// 加载文章
async function loadArticle() {
    try {
        const response = await fetch(`/api/articles/${articleId}?html=true`);
        if (!response.ok) throw new Error('文章不存在');

        const article = await response.json();
        renderArticle(article);
    } catch (error) {
        console.error('加载文章失败:', error);
        articleDetail.innerHTML = `
            <div class="error">
                <h2>加载失败</h2>
                <p>${error.message}</p>
                <a href="index.html" class="btn btn-primary" style="margin-top: 20px;">返回首页</a>
            </div>
        `;
    }
}

// 渲染文章
function renderArticle(article) {
    const coverImg = article.meta.cover ? `images/${article.meta.cover}` : 'images/hero-bg.jpg';

    const html = `
        <a href="index.html" class="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            返回文章列表
        </a>

        <article>
            <header class="article-header">
                ${coverImg ? `<img src="${coverImg}" alt="${escapeHtml(article.meta.title)}" class="article-cover" onerror="this.src='images/hero-bg.jpg'">` : ''}
                <div class="article-meta">
                    <span class="category">${escapeHtml(article.meta.category || '未分类')}</span>
                    <time>${formatDate(article.meta.date)}</time>
                </div>
                <h1 class="article-title">${escapeHtml(article.meta.title)}</h1>
            </header>

            <div class="article-content" id="articleContent">
                ${article.content}
            </div>
        </article>
    `;

    articleDetail.innerHTML = html;
    document.title = `${article.meta.title} - 我的博客`;
}

// 加载所有文章列表（用于侧边栏导航）
async function loadAllArticles() {
    try {
        const response = await fetch('/api/articles');
        if (!response.ok) throw new Error('获取文章列表失败');

        allArticles = await response.json();
        renderArticleList();
    } catch (error) {
        console.error('加载文章列表失败:', error);
        tocList.innerHTML = '<li><a href="#" class="toc-empty">加载失败</a></li>';
    }
}

// 渲染文章列表到侧边栏
function renderArticleList() {
    if (allArticles.length === 0) {
        tocList.innerHTML = '<li><a href="#" class="toc-empty">暂无文章</a></li>';
        return;
    }

    tocList.innerHTML = '';

    allArticles.forEach(article => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `article.html?id=${encodeURIComponent(article.id)}`;
        a.textContent = article.title || article.filename.replace('.md', '');
        a.className = 'article-nav-item';

        // 如果是当前文章，添加active类
        if (article.id === currentArticleId) {
            a.classList.add('active');
        }

        li.appendChild(a);
        tocList.appendChild(li);
    });
}

// 工具函数：转义HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 工具函数：格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
