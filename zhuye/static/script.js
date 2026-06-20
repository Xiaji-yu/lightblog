// ==================== 全局变量 ====================
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// 天气缓存
let weatherCache = {
    data: null,
    timestamp: 0,
    CACHE_DURATION: 30 * 60 * 1000 // 30分钟缓存
};

// 语录缓存
let quoteCache = {
    data: null,
    timestamp: 0,
    CACHE_DURATION: 10 * 60 * 1000 // 10分钟缓存
};

// 节假日数据（2025-2026年中国主要节假日）
const holidays = {
    // 格式: 'YYYY-MM-DD': '节日名称'
    '2025-01-01': '元旦',
    '2025-01-28': '除夕',
    '2025-01-29': '春节',
    '2025-01-30': '春节',
    '2025-01-31': '春节',
    '2025-02-01': '春节',
    '2025-02-02': '春节',
    '2025-02-03': '春节',
    '2025-02-04': '春节',
    '2025-04-04': '清明节',
    '2025-04-05': '清明节',
    '2025-04-06': '清明节',
    '2025-05-01': '劳动节',
    '2025-05-02': '劳动节',
    '2025-05-03': '劳动节',
    '2025-05-31': '端午节',
    '2025-06-01': '端午节',
    '2025-06-02': '端午节',
    '2025-10-06': '中秋节',
    '2025-10-07': '中秋节',
    '2025-10-08': '中秋节',
    '2025-10-01': '国庆节',
    '2025-10-02': '国庆节',
    '2025-10-03': '国庆节',
    '2025-10-04': '国庆节',
    '2025-10-05': '国庆节',
    '2025-10-06': '国庆节',
    '2025-10-07': '国庆节',
    '2025-12-25': '圣诞节',
    '2026-01-01': '元旦',
    '2026-01-21': '除夕',
    '2026-01-22': '春节',
    '2026-01-23': '春节',
    '2026-01-24': '春节',
    '2026-01-25': '春节',
    '2026-01-26': '春节',
    '2026-01-27': '春节',
    '2026-01-28': '春节',
    '2026-04-04': '清明节',
    '2026-04-05': '清明节',
    '2026-04-06': '清明节',
    '2026-05-01': '劳动节',
    '2026-05-02': '劳动节',
    '2026-05-03': '劳动节',
    '2026-06-19': '端午节',
    '2026-06-20': '端午节',
    '2026-06-21': '端午节',
    '2026-09-25': '中秋节',
    '2026-09-26': '中秋节',
    '2026-09-27': '中秋节',
    '2026-10-01': '国庆节',
    '2026-10-02': '国庆节',
    '2026-10-03': '国庆节',
    '2026-10-04': '国庆节',
    '2026-10-05': '国庆节',
    '2026-10-06': '国庆节',
    '2026-10-07': '国庆节',
};

// 星期名称
const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

// ==================== 时钟功能 ====================
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;

    document.getElementById('clock-time').textContent = timeStr;
    document.getElementById('clock-date').textContent = dateStr;

    // 检查节假日
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const holiday = holidays[dateKey];
    document.getElementById('clock-holiday').textContent = holiday || '';
}

// ==================== 日历功能 ====================
function renderCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // 更新月份标题
    document.getElementById('current-month').textContent =
        `${currentYear}年${currentMonth + 1}月`;

    // 清空日历
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';

    // 添加上月剩余日期
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = prevMonthLastDay - i;
        calendarDays.appendChild(dayDiv);
    }

    // 添加当月日期
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = day;

        // 标记今天
        if (currentYear === today.getFullYear() &&
            currentMonth === today.getMonth() &&
            day === today.getDate()) {
            dayDiv.classList.add('today');
        }

        calendarDays.appendChild(dayDiv);
    }

    // 添加下月开始日期
    const totalCells = startDayOfWeek + totalDays;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = day;
        calendarDays.appendChild(dayDiv);
    }
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ==================== 服务器状态检测 ====================
async function checkServerStatus() {
    const serverList = document.getElementById('server-list');
    serverList.innerHTML = '';

    const servers = [
        { name: '软路由', id: 'router' },
        { name: 'NAS', id: 'nas' },
        { name: '云服务器', id: 'cloud' },
        { name: 'OpenClaw', id: 'openclaw' }
    ];

    for (const server of servers) {
        const serverItem = document.createElement('div');
        serverItem.className = 'server-item';
        serverItem.innerHTML = `
            <div class="server-name">${server.name}</div>
            <div class="server-status">
                <span class="status-indicator status-checking"></span>
                <span class="status-text">检测中...</span>
            </div>
        `;
        serverList.appendChild(serverItem);

        // 调用后端API检测服务器状态
        try {
            const response = await fetch(`/api/server/status?server=${server.id}&timeout=10000`);
            const result = await response.json();

            const statusEl = serverItem.querySelector('.server-status');
            const indicator = statusEl.querySelector('.status-indicator');
            const textEl = statusEl.querySelector('.status-text');

            if (result.success && result.data) {
                const status = result.data;
                if (status.online) {
                    indicator.className = 'status-indicator status-online';
                    textEl.innerHTML = `
                        <span class="server-info">延迟: ${status.latency}ms</span>
                        <span class="server-latency">|</span>
                        <span class="server-load">负载: ${status.load || 'N/A'}</span>
                    `;
                } else {
                    indicator.className = 'status-indicator status-offline';
                    textEl.textContent = '离线';
                }
            } else {
                indicator.className = 'status-indicator status-offline';
                textEl.textContent = '检测失败';
            }
        } catch (error) {
            const statusEl = serverItem.querySelector('.server-status');
            const indicator = statusEl.querySelector('.status-indicator');
            const textEl = statusEl.querySelector('.status-text');
            indicator.className = 'status-indicator status-offline';
            textEl.textContent = '检测失败';
        }
    }
}

// ==================== 博客文章列表 ====================
async function loadBlogPosts() {
    const blogList = document.getElementById('blog-list');
    if (!blogList) return;

    const API_URL = '/api/articles';

    try {
        const response = await fetch(API_URL, {
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // API返回的是数组直接在前端
        if (Array.isArray(result) && result.length > 0) {
            renderBlogPosts(result);
        } else if (result.success && result.data && result.data.length > 0) {
            renderBlogPosts(result.data);
        } else {
            blogList.innerHTML = `
                <div class="blog-empty">
                    暂无文章
                    <a href="https://blog.xiaji.xin" target="_blank" class="blog-backup-link">前往博客主页 →</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('获取博客文章失败:', error);
        blogList.innerHTML = `
            <div class="blog-error">
                加载失败: ${error.message}
                <a href="https://blog.xiaji.xin" target="_blank" class="blog-backup-link">前往博客主页查看 →</a>
            </div>
        `;
    }
}

function renderBlogPosts(articles) {
    const blogList = document.getElementById('blog-list');
    if (!blogList) return;

    // 只显示最新的5篇文章
    const recentArticles = articles.slice(0, 5);

    blogList.innerHTML = recentArticles.map(article => `
        <div class="blog-item">
            <div class="blog-item-header">
                <h3 class="blog-item-title">${escapeHtml(article.title)}</h3>
                <span class="blog-item-date">${formatDate(article.date)}</span>
            </div>
            <p class="blog-item-excerpt">${escapeHtml(article.excerpt || '暂无摘要')}</p>
            <div class="blog-item-footer">
                <span class="blog-item-category">${escapeHtml(article.category || '未分类')}</span>
                <a href="https://blog.xiaji.xin/article.html?id=${article.id}" target="_blank" class="blog-item-link">阅读全文</a>
            </div>
        </div>
    `).join('');
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
    if (isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ==================== 天气功能 ====================
// 天气代码到图标和描述的映射
const weatherCodeMap = {
    '113': { icon: '☀️', desc: '晴朗' },
    '116': { icon: '⛅', desc: '多云' },
    '119': { icon: '☁️', desc: '阴天' },
    '122': { icon: '☁️', desc: '阴天' },
    '143': { icon: '🌫️', desc: '薄雾' },
    '176': { icon: '🌦️', desc: '小雨' },
    '179': { icon: '🌧️', desc: '中雨' },
    '182': { icon: '🌧️', desc: '大雨' },
    '185': { icon: '🌧️', desc: '暴雨' },
    '200': { icon: '⛈️', desc: '雷雨' },
    '227': { icon: '🌨️', desc: '小雪' },
    '230': { icon: '❄️', desc: '中雪' },
    '233': { icon: '❄️', desc: '大雪' },
    '236': { icon: '❄️', desc: '暴雪' },
    '239': { icon: '🌧️', desc: '冻雨' },
    '260': { icon: '🌫️', desc: '雾凇' },
    '263': { icon: '🌦️', desc: '毛毛雨' },
    '266': { icon: '🌦️', desc: '小雨' },
    '281': { icon: '🌧️', desc: '冻雨' },
    '284': { icon: '🌧️', desc: '冻雨' },
    '293': { icon: '🌦️', desc: '小雨' },
    '296': { icon: '🌧️', desc: '中雨' },
    '299': { icon: '🌧️', desc: '大雨' },
    '302': { icon: '🌧️', desc: '暴雨' },
    '305': { icon: '🌧️', desc: '大雨' },
    '308': { icon: '🌧️', desc: '暴雨' },
    '311': { icon: '🌧️', desc: '冻雨' },
    '314': { icon: '🌧️', desc: '冻雨' },
    '317': { icon: '🌨️', desc: '小雪' },
    '320': { icon: '🌨️', desc: '中雪' },
    '323': { icon: '❄️', desc: '大雪' },
    '326': { icon: '❄️', desc: '暴雪' },
    '329': { icon: '🌨️', desc: '小雪' },
    '332': { icon: '❄️', desc: '中雪' },
    '335': { icon: '❄️', desc: '大雪' },
    '338': { icon: '❄️', desc: '暴雪' },
    '350': { icon: '🌦️', desc: '小雨' },
    '353': { icon: '🌦️', desc: '小雨' },
    '356': { icon: '🌧️', desc: '中雨' },
    '359': { icon: '🌧️', desc: '大雨' },
    '362': { icon: '🌧️', desc: '暴雨' },
    '365': { icon: '🌧️', desc: '大雨' },
    '368': { icon: '🌧️', desc: '暴雨' },
    '371': { icon: '❄️', desc: '大雪' },
    '374': { icon: '🌨️', desc: '小雪' },
    '377': { icon: '🌨️', desc: '中雪' },
    '386': { icon: '⛈️', desc: '雷雨' },
    '389': { icon: '⛈️', desc: '雷雨' },
    '392': { icon: '⛈️', desc: '雷雨' },
    '395': { icon: '❄️', desc: '暴雪' }
};

// 默认天气数据（当API不可用时的备用）
const defaultWeather = {
    city: '上海',
    temp: '22',
    code: '116',
    desc: '多云'
};

async function loadWeather() {
    const locationEl = document.getElementById('weather-location');
    const iconEl = document.getElementById('weather-icon');
    const tempEl = document.getElementById('weather-temp');
    const descEl = document.getElementById('weather-desc');

    if (!locationEl || !iconEl || !tempEl || !descEl) return;

    // 检查缓存
    const now = Date.now();
    if (weatherCache.data && (now - weatherCache.timestamp < weatherCache.CACHE_DURATION)) {
        updateWeatherDisplay(weatherCache.data);
        return;
    }

    try {
        // 使用 wttr.in API（免费，无需注册）
        // 默认城市：上海。可以通过修改 URL 中的城市名来更改
        const response = await fetch('https://wttr.in/Shanghai?format=j1&lang=zh', {
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const current = data.current_condition[0];
        const city = data.nearest_area[0].areaName[0].value;

        const weather = {
            city: city,
            temp: current.temp_C,
            code: current.weatherCode,
            desc: current.weatherDesc[0].value
        };

        // 缓存数据
        weatherCache.data = weather;
        weatherCache.timestamp = Date.now();

        updateWeatherDisplay(weather);
    } catch (error) {
        console.warn('天气API请求失败，使用默认数据:', error);
        updateWeatherDisplay(defaultWeather);
    }
}

function updateWeatherDisplay(weather) {
    const locationEl = document.getElementById('weather-location');
    const iconEl = document.getElementById('weather-icon');
    const tempEl = document.getElementById('weather-temp');
    const descEl = document.getElementById('weather-desc');

    const weatherInfo = weatherCodeMap[weather.code] || { icon: '🌡️', desc: weather.desc || '未知' };

    locationEl.textContent = weather.city;
    iconEl.textContent = weatherInfo.icon;
    tempEl.textContent = `${weather.temp}°C`;
    descEl.textContent = weatherInfo.desc;
}

// ==================== 语录功能 ====================
async function loadQuote() {
    const quoteTextEl = document.getElementById('quote-text');
    const quoteAuthorEl = document.getElementById('quote-author');
    const quoteBoxEl = document.getElementById('quote-box'); // 可能不需要，但为了检查存在性

    if (!quoteTextEl || !quoteAuthorEl) return;

    // 检查缓存
    const now = Date.now();
    if (quoteCache.data && (now - quoteCache.timestamp < quoteCache.CACHE_DURATION)) {
        updateQuoteDisplay(quoteCache.data);
        return;
    }

    try {
        // 使用一言 API
        const response = await fetch('https://v1.hitokoto.cn/', {
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // 缓存数据
        quoteCache.data = data;
        quoteCache.timestamp = Date.now();

        updateQuoteDisplay(data);
    } catch (error) {
        console.warn('一言API请求失败:', error);
        // 显示默认语录
        const defaultQuote = {
            hitokoto: '简洁是美德。',
            from: '云崽',
            from_who: null
        };
        updateQuoteDisplay(defaultQuote);
    }
}

function updateQuoteDisplay(quote) {
    const quoteTextEl = document.getElementById('quote-text');
    const quoteAuthorEl = document.getElementById('quote-author');

    quoteTextEl.textContent = quote.hitokoto;
    quoteAuthorEl.textContent = quote.from_who || (quote.from ? `《${quote.from}》` : '');
}

// ==================== 事件监听器 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 启动时钟
    updateClock();
    setInterval(updateClock, 1000);

    // 初始化日历
    renderCalendar();

    // 加载天气（每30分钟刷新）
    loadWeather();
    setInterval(loadWeather, 30 * 60 * 1000);

    // 加载语录（每10分钟刷新）
    loadQuote();
    setInterval(loadQuote, 10 * 60 * 1000);

    // 语录刷新按钮
    const quoteRefreshBtn = document.getElementById('quote-refresh');
    if (quoteRefreshBtn) {
        quoteRefreshBtn.addEventListener('click', () => {
            loadQuote();
        });
    }

    // 服务器状态检测（每60秒刷新一次）
    checkServerStatus();
    setInterval(checkServerStatus, 60000);

    // 加载博客文章列表
    loadBlogPosts();
    // 每5分钟刷新一次博客文章
    setInterval(loadBlogPosts, 300000);
});
