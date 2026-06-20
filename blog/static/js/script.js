// ==================== 主题切换功能 ====================
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

// 检查本地存储的主题设置
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');

    // 保存主题偏好
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// ==================== 加载文章列表 ====================
async function loadArticles() {
    try {
        const response = await fetch('/api/articles');
        if (!response.ok) throw new Error('获取文章失败');

        const articles = await response.json();
        renderArticles(articles);
    } catch (error) {
        console.error('加载文章失败:', error);
        const grid = document.getElementById('articlesGrid');
        if (grid) {
            grid.innerHTML = '<div class="empty-state"><p>加载文章失败，请刷新重试</p></div>';
        }
    }
}

function renderArticles(articles) {
    const grid = document.getElementById('articlesGrid');
    if (!grid) return;

    if (articles.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
                    <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2"/>
                </svg>
                <h3>暂无文章</h3>
                <p>管理员尚未发布任何文章</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = articles.map(article => `
        <article class="article-card">
            <div class="card-image">
                <img src="${article.cover ? 'images/' + article.cover : 'images/hero-bg.jpg'}"
                     alt="${article.title}"
                     onerror="this.src='images/hero-bg.jpg'">
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <span class="category">${escapeHtml(article.category || '未分类')}</span>
                    <span class="date">${formatDate(article.date)}</span>
                </div>
                <h3 class="card-title">${escapeHtml(article.title)}</h3>
                <p class="card-excerpt">${escapeHtml(article.excerpt)}</p>
                <a href="article.html?id=${article.id}" class="read-more">
                    阅读全文
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
            </div>
        </article>
    `).join('');

    // 重新绑定卡片点击事件
    bindCardEvents();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ==================== 文章卡片点击效果 ====================
function bindCardEvents() {
    const articleCards = document.querySelectorAll('.article-card');
    articleCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // 如果点击的是链接本身，不触发卡片点击
            if (e.target.closest('a')) return;

            const link = card.querySelector('.read-more');
            if (link) {
                window.location.href = link.href;
            }
        });
    });
}

// ==================== 导航栏滚动效果 ====================
const navbar = document.querySelector('.navbar');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // 添加滚动样式
    if (currentScrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScrollY = currentScrollY;
});

// ==================== 平滑滚动 ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    const href = anchor.getAttribute('href');
    // 跳过 "#" 或空锚点
    if (!href || href === '#' || href === '') {
        return;
    }

    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== 页面加载时获取文章 ====================
document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
});

// ==================== 搜索按钮功能 ====================
const searchBtn = document.querySelector('.btn-primary');
if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        // 这里可以添加搜索功能
        console.log('搜索功能待实现');
    });
}

// ==================== 页面加载动画 ====================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');

    // 淡入效果
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(30px)';

        setTimeout(() => {
            heroContent.style.transition = 'all 1s ease';
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 100);
    }

    // 文章卡片渐入
    const cards = document.querySelectorAll('.article-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';

        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 300 + (index * 100));
    });
});

// ==================== 返回顶部功能 ====================
let backToTopBtn = null;

function createBackToTopButton() {
    backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 999;
    `;
    document.body.appendChild(backToTopBtn);

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    backToTopBtn.addEventListener('mouseenter', () => {
        backToTopBtn.style.transform = 'translateY(-3px)';
        backToTopBtn.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.5)';
    });

    backToTopBtn.addEventListener('mouseleave', () => {
        backToTopBtn.style.transform = 'translateY(0)';
        backToTopBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
    });
}

// 监听滚动显示/隐藏返回顶部按钮
window.addEventListener('scroll', () => {
    if (!backToTopBtn) {
        createBackToTopButton();
    }

    if (window.scrollY > 500) {
        backToTopBtn.style.opacity = '1';
        backToTopBtn.style.visibility = 'visible';
    } else {
        backToTopBtn.style.opacity = '0';
        backToTopBtn.style.visibility = 'hidden';
    }
});

// ==================== 图片懒加载 ====================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('.card-image img').forEach(img => {
        imageObserver.observe(img);
    });
}

// ==================== 阅读进度指示器（可选） ====================
function createProgressBar() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 70px;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
        width: 0%;
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = `${scrolled}%`;
    });
}

createProgressBar();
