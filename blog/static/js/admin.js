// 全局变量
let articles = [];
let currentArticleId = null;

// DOM 元素
const articlesList = document.getElementById('articlesList');
const addArticleBtn = document.getElementById('addArticleBtn');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');
const logoutBtn = document.getElementById('logoutBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const manageTokenBtn = document.getElementById('manageTokenBtn');
const tokenModal = document.getElementById('tokenModal');
const tokenModalClose = document.getElementById('tokenModalClose');
const tokenValue = document.getElementById('tokenValue');
const tokenNote = document.getElementById('tokenNote');
const copyTokenBtn = document.getElementById('copyTokenBtn');
const resetTokenBtn = document.getElementById('resetTokenBtn');
const deleteTokenBtn = document.getElementById('deleteTokenBtn');
const notLoggedInModal = document.getElementById('notLoggedInModal');
const goToLoginBtn = document.getElementById('goToLoginBtn');
const changePasswordModal = document.getElementById('changePasswordModal');
const changePasswordModalClose = document.getElementById('changePasswordModalClose');
const cancelChangePasswordBtn = document.getElementById('cancelChangePasswordBtn');
const changePasswordSubmitBtn = document.getElementById('changePasswordSubmitBtn');
const changePasswordForm = document.getElementById('changePasswordForm');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordStrength = document.getElementById('passwordStrength');
const passwordMatch = document.getElementById('passwordMatch');
const articleModal = document.getElementById('articleModal');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const cancelBtn = document.getElementById('cancelBtn');
const articleForm = document.getElementById('articleForm');
const saveBtn = document.getElementById('saveBtn');
const deleteModal = document.getElementById('deleteModal');
const deleteModalClose = document.getElementById('deleteModalClose');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deleteArticleTitle = document.getElementById('deleteArticleTitle');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const charCount = document.getElementById('charCount');
const mdPaste = document.getElementById('mdPaste');
const parseMarkdownBtn = document.getElementById('parseMarkdownBtn');
const clearMarkdownBtn = document.getElementById('clearMarkdownBtn');
const mdFileUpload = document.getElementById('mdFileUpload');
const fileName = document.getElementById('fileName');

// ==================== 初始化 ====================
// 检查DOM是否已就绪，如果已就绪则直接执行，否则等待DOMContentLoaded事件
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await checkAuth();
    });
} else {
    // DOM已经加载完成，直接执行
    (async () => {
        await checkAuth();
    })();
}

// ==================== 认证相关 ====================
// 检查登录状态
async function checkAuth() {
    try {
        const response = await fetch('/api/session');
        const data = await response.json();

        if (!data.isLoggedIn) {
            // 未登录，自动跳转到登录页面
            window.location.href = 'login.html';
            return;
        }

        // 已登录，显示用户信息
        displayUserInfo(data.user);

        // 加载文章列表
        await loadArticles();
        setupEventListeners();
    } catch (error) {
        console.error('认证检查失败:', error);
        // 出错时也跳转到登录页面
        window.location.href = 'login.html';
    }
}

// 显示用户信息
function displayUserInfo(user) {
    userName.textContent = user.displayName || user.username;

    // 根据角色显示不同徽章
    if (user.role === 'superadmin') {
        userRole.textContent = '超级管理员';
        userRole.className = 'user-role-badge superadmin';
    } else {
        userRole.textContent = '管理员';
        userRole.className = 'user-role-badge admin';
    }

    userInfo.style.display = 'flex';
}

// 显示未登录模态框
function showNotLoggedInModal() {
    notLoggedInModal.classList.add('active');
    addArticleBtn.style.display = 'none'; // 隐藏新建文章按钮
}

// 隐藏未登录模态框
function hideNotLoggedInModal() {
    notLoggedInModal.classList.remove('active');
}

// 登出
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });

        if (response.ok) {
            localStorage.removeItem('userInfo');
            window.location.href = 'login.html';
        } else {
            showToast('登出失败', 'error');
        }
    } catch (error) {
        console.error('登出错误:', error);
        showToast('网络错误，请稍后重试', 'error');
    }
}

// ==================== 修改密码功能 ====================

// 打开修改密码模态框
function openChangePasswordModal() {
    changePasswordForm.reset();
    passwordStrength.className = 'password-strength';
    passwordStrength.textContent = '';
    passwordMatch.className = 'password-match';
    passwordMatch.textContent = '';
    changePasswordModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 关闭修改密码模态框
function closeChangePasswordModal() {
    changePasswordModal.classList.remove('active');
    document.body.style.overflow = '';
}

// 打开Token管理模态框
let currentApiToken = null;

async function openTokenModal() {
    tokenNote.textContent = '';
    tokenValue.textContent = '加载中...';
    tokenValue.className = 'token-value';
    tokenModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 获取当前用户的Token
    await loadApiToken();
}

// 关闭Token管理模态框
function closeTokenModal() {
    tokenModal.classList.remove('active');
    document.body.style.overflow = '';
}

// 加载API Token
async function loadApiToken() {
    try {
        const response = await fetch('/api/token', {
            credentials: 'include'
        });
        const data = await response.json();

        if (response.ok && data) {
            currentApiToken = data.apiToken;
            if (currentApiToken) {
                tokenValue.textContent = currentApiToken;
                tokenValue.className = 'token-value';
                tokenNote.textContent = '此Token可用于调用API接口';
            } else {
                tokenValue.textContent = '您还没有API Token';
                tokenValue.className = 'token-value empty';
                tokenNote.textContent = '点击"重置Token"按钮生成';
            }
        } else {
            tokenValue.textContent = '加载失败';
            tokenValue.className = 'token-value empty';
        }
    } catch (error) {
        console.error('获取Token失败:', error);
        tokenValue.textContent = '网络错误';
        tokenValue.className = 'token-value empty';
    }
}

// 复制Token到剪贴板
async function copyToken() {
    if (!currentApiToken) {
        showToast('暂无Token可复制', 'warning');
        return;
    }

    try {
        await navigator.clipboard.writeText(currentApiToken);
        showToast('Token已复制到剪贴板', 'success');
    } catch (error) {
        // 降级方案：使用传统的复制方法
        const textArea = document.createElement('textarea');
        textArea.value = currentApiToken;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Token已复制到剪贴板', 'success');
        } catch (err) {
            showToast('复制失败，请手动复制', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// 重置Token
async function resetToken() {
    if (!confirm('确定要重置API Token吗？旧的Token将立即失效！')) {
        return;
    }

    try {
        const response = await fetch('/api/token/reset', {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();

        if (response.ok && data.success) {
            currentApiToken = data.apiToken;
            tokenValue.textContent = currentApiToken;
            tokenValue.className = 'token-value';
            tokenNote.textContent = 'Token已重置，请妥善保存';
            showToast('Token已重置', 'success');
        } else {
            showToast(data.error || '重置失败', 'error');
        }
    } catch (error) {
        console.error('重置Token失败:', error);
        showToast('网络错误，请稍后重试', 'error');
    }
}

// 删除Token
async function deleteToken() {
    if (!confirm('确定要删除API Token吗？删除后将无法通过API访问！')) {
        return;
    }

    try {
        const response = await fetch('/api/token', {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();

        if (response.ok && data.success) {
            currentApiToken = null;
            tokenValue.textContent = '您还没有API Token';
            tokenValue.className = 'token-value empty';
            tokenNote.textContent = '点击"重置Token"按钮生成';
            showToast('Token已删除', 'success');
        } else {
            showToast(data.error || '删除失败', 'error');
        }
    } catch (error) {
        console.error('删除Token失败:', error);
        showToast('网络错误，请稍后重试', 'error');
    }
}

// 检查密码强度
function checkPasswordStrength(password) {
    if (!password) {
        passwordStrength.className = 'password-strength';
        passwordStrength.textContent = '';
        return;
    }

    let strength = 0;
    const checks = {
        '长度至少8位': password.length >= 8,
        '包含小写字母': /[a-z]/.test(password),
        '包含大写字母': /[A-Z]/.test(password),
        '包含数字': /[0-9]/.test(password),
        '包含特殊字符': /[^a-zA-Z0-9]/.test(password)
    };

    strength = Object.values(checks).filter(Boolean).length;

    if (password.length < 6) {
        passwordStrength.className = 'password-strength weak';
        passwordStrength.textContent = '密码太短（至少6位）';
    } else if (strength <= 2) {
        passwordStrength.className = 'password-strength weak';
        passwordStrength.textContent = '密码强度：弱';
    } else if (strength === 3 || strength === 4) {
        passwordStrength.className = 'password-strength medium';
        passwordStrength.textContent = '密码强度：中';
    } else {
        passwordStrength.className = 'password-strength strong';
        passwordStrength.textContent = '密码强度：强';
    }
}

// 检查密码是否匹配
function checkPasswordMatch() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!confirmPassword) {
        passwordMatch.className = 'password-match';
        passwordMatch.textContent = '';
        return false;
    }

    if (newPassword === confirmPassword) {
        passwordMatch.className = 'password-match match';
        passwordMatch.textContent = '✓ 密码一致';
        return true;
    } else {
        passwordMatch.className = 'password-match mismatch';
        passwordMatch.textContent = '✗ 密码不一致';
        return false;
    }
}

// 修改密码
async function changePassword() {
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // 验证
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('请填写所有密码字段', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('新密码长度至少6位', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('两次输入的新密码不一致', 'error');
        return;
    }

    try {
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast('密码修改成功，请重新登录', 'success');
            closeChangePasswordModal();

            // 2秒后跳转到登录页面
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showToast(data.error || '修改密码失败', 'error');
        }
    } catch (error) {
        console.error('修改密码错误:', error);
        showToast('网络错误，请稍后重试', 'error');
    }
}

// ==================== 事件监听 ====================
function setupEventListeners() {
    // 登出按钮
    logoutBtn.addEventListener('click', logout);

    // 修改密码按钮
    changePasswordBtn.addEventListener('click', openChangePasswordModal);

    // Token管理按钮
    manageTokenBtn.addEventListener('click', openTokenModal);

    // 新建文章按钮
    addArticleBtn.addEventListener('click', () => openModal(null));

    // 未登录模态框 - 去登录按钮
    goToLoginBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });

    // 修改密码模态框
    changePasswordModalClose.addEventListener('click', closeChangePasswordModal);
    cancelChangePasswordBtn.addEventListener('click', closeChangePasswordModal);
    changePasswordSubmitBtn.addEventListener('click', changePassword);

    // Token管理模态框
    tokenModalClose.addEventListener('click', closeTokenModal);
    copyTokenBtn.addEventListener('click', copyToken);
    resetTokenBtn.addEventListener('click', resetToken);
    deleteTokenBtn.addEventListener('click', deleteToken);

    // 文章模态框
    modalClose.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // 密码强度检查
    newPasswordInput.addEventListener('input', () => {
        checkPasswordStrength(newPasswordInput.value);
        if (confirmPasswordInput.value) {
            checkPasswordMatch();
        }
    });

    // 密码一致性检查
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);

    // 点击遮罩关闭
    tokenModal.querySelector('.modal-overlay').addEventListener('click', closeTokenModal);
    changePasswordModal.querySelector('.modal-overlay').addEventListener('click', closeChangePasswordModal);
    articleModal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    deleteModal.querySelector('.modal-overlay').addEventListener('click', closeDeleteModal);

    // 删除模态框
    deleteModalClose.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', confirmDelete);

    // 保存文章
    saveBtn.addEventListener('click', saveArticle);

    // 字数统计
    document.getElementById('content').addEventListener('input', (e) => {
        charCount.textContent = e.target.value.length;
    });

    // Markdown 导入功能
    parseMarkdownBtn.addEventListener('click', () => parseMarkdown());
    clearMarkdownBtn.addEventListener('click', () => {
        mdPaste.value = '';
        fileName.textContent = '';
        mdFileUpload.value = '';
    });

    // 文件上传功能
    mdFileUpload.addEventListener('change', handleFileUpload);

    // 使用事件委托处理文章操作按钮点击
    articlesList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.icon-btn.edit');
        const deleteBtn = e.target.closest('.icon-btn.delete');

        if (editBtn) {
            const id = editBtn.dataset.id;
            if (id) {
                openModal(id);
            }
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (id) {
                showDeleteModal(id);
            }
        }
    });

    // ESC 关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeDeleteModal();
            closeChangePasswordModal();
            closeTokenModal();
        }
    });
}

// ==================== API 调用 ====================
async function loadArticles() {
    try {
        const response = await fetch('/api/articles', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('获取文章失败');
        articles = await response.json();
        renderArticles();
    } catch (error) {
        console.error('加载文章失败:', error);
        showToast('加载文章失败', 'error');
    }
}

// 获取单篇文章完整数据
async function getArticle(id) {
    try {
        const response = await fetch(`/api/articles/${id}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('获取文章失败');
        return await response.json();
    } catch (error) {
        console.error('获取文章失败:', error);
        showToast('获取文章失败: ' + error.message, 'error');
        return null;
    }
}

async function createArticle(articleData) {
    try {
        const response = await fetch('/api/articles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(articleData)
        });

        if (!response.ok) throw new Error('创建文章失败');

        const result = await response.json();
        showToast('文章创建成功', 'success');
        closeModal();
        await loadArticles();
        return result;
    } catch (error) {
        console.error('创建文章失败:', error);
        showToast('创建文章失败: ' + error.message, 'error');
    }
}

async function updateArticle(id, articleData) {
    try {
        const response = await fetch(`/api/articles/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(articleData)
        });

        if (!response.ok) throw new Error('更新文章失败');

        const result = await response.json();
        showToast('文章更新成功', 'success');
        closeModal();
        await loadArticles();
        return result;
    } catch (error) {
        console.error('更新文章失败:', error);
        showToast('更新文章失败: ' + error.message, 'error');
    }
}

async function deleteArticle(id) {
    try {
        const response = await fetch(`/api/articles/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('删除文章失败');

        const result = await response.json();
        showToast('文章删除成功', 'success');
        await loadArticles();
        return result;
    } catch (error) {
        console.error('删除文章失败:', error);
        showToast('删除文章失败: ' + error.message, 'error');
    }
}

// ==================== 渲染 ====================
function renderArticles() {
    if (articles.length === 0) {
        articlesList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
                    <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2"/>
                </svg>
                <h3>暂无文章</h3>
                <p>点击"新建文章"按钮创建您的第一篇文章</p>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <table class="article-table">
            <thead>
                <tr>
                    <th>标题</th>
                    <th>分类</th>
                    <th>日期</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${articles.map(article => `
                    <tr>
                        <td data-label="标题">
                            <div class="article-title">${escapeHtml(article.title)}</div>
                            <div class="article-meta">${escapeHtml(article.filename)}</div>
                        </td>
                        <td data-label="分类">
                            <span class="article-category">${escapeHtml(article.category || '未分类')}</span>
                        </td>
                        <td data-label="日期" class="article-date">${formatDate(article.date)}</td>
                        <td data-label="操作">
                            <div class="article-actions">
                                <button class="icon-btn edit" data-id="${article.id}" title="编辑">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </button>
                                <button class="icon-btn delete" data-id="${article.id}" title="删除">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    articlesList.innerHTML = tableHTML;
}

// ==================== 模态框操作 ====================
async function openModal(articleId = null) {
    currentArticleId = articleId;

    if (articleId) {
        modalTitle.textContent = '编辑文章';

        // 从articles数组中获取元数据（列表数据）
        const article = articles.find(a => a.id === articleId);
        if (article) {
            document.getElementById('articleId').value = article.id;
            document.getElementById('title').value = article.title || '';
            document.getElementById('date').value = article.date || '';
            document.getElementById('category').value = article.category || '';
            document.getElementById('cover').value = article.cover || '';
            document.getElementById('excerpt').value = article.excerpt || '';
            document.getElementById('content').value = '加载中...';
            charCount.textContent = '0';
        }

        // 异步获取完整文章内容
        const fullArticle = await getArticle(articleId);
        if (fullArticle && fullArticle.content) {
            document.getElementById('content').value = fullArticle.content;
            charCount.textContent = fullArticle.content.length;
        } else {
            document.getElementById('content').value = '无法加载文章内容，请重试';
        }
    } else {
        modalTitle.textContent = '新建文章';
        articleForm.reset();
        document.getElementById('articleId').value = '';
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        charCount.textContent = '0';
    }

    articleModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    articleModal.classList.remove('active');
    document.body.style.overflow = '';
    currentArticleId = null;
}

// ==================== 删除操作 ====================
function showDeleteModal(articleId) {
    // 尝试在articles数组中查找文章
    let article = null;
    if (articles && articles.length > 0) {
        article = articles.find(a => a.id === articleId);
    }

    // 如果找不到，使用articleId作为后备（允许删除操作继续）
    if (!article) {
        console.warn('未在articles数组中找到文章，使用articleId作为后备:', articleId);
        article = {
            id: articleId,
            title: articleId, // 使用ID作为标题
            filename: articleId + '.md'
        };
    }

    currentArticleId = article.id;
    deleteArticleTitle.textContent = article.title || article.filename || '未知文章';
    deleteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    document.body.style.overflow = '';
    currentArticleId = null;
}

async function confirmDelete() {
    if (currentArticleId) {
        await deleteArticle(currentArticleId);
        closeDeleteModal();
    }
}

// ==================== 保存文章 ====================
async function saveArticle() {
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();

    if (!title || !content) {
        showToast('请填写标题和内容', 'error');
        return;
    }

    // 防抖：保存期间禁用按钮，防止重复提交
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    const articleData = {
        title: title,
        date: document.getElementById('date').value,
        category: document.getElementById('category').value.trim(),
        cover: document.getElementById('cover').value.trim(),
        excerpt: document.getElementById('excerpt').value.trim(),
        content: content
    };

    try {
        if (currentArticleId) {
            await updateArticle(currentArticleId, articleData);
        } else {
            await createArticle(articleData);
        }
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '保存';
    }
}

// ==================== Markdown 解析功能 ====================
function parseMarkdown(filename = null) {
    const markdown = mdPaste.value.trim();

    if (!markdown) {
        showToast('请先粘贴 Markdown 内容或上传文件', 'error');
        return;
    }

    try {
        // 解析 Front Matter
        const frontMatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n/);

        if (!frontMatterMatch) {
            showToast('未找到 Front Matter，请确保文档以 --- 分隔', 'error');
            return;
        }

        const frontMatter = frontMatterMatch[1];
        const body = markdown.replace(frontMatterMatch[0], '');

        // 解析 Front Matter 字段（支持多行列表格式）
        const meta = {};
        const lines = frontMatter.split('\n');
        let currentKey = null;
        let currentList = [];

        lines.forEach((line, index) => {
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
                const listItem = line.trim().substring(2);
                currentList.push(listItem);
            }
        });

        // 保存最后一个字段
        if (currentKey) {
            if (currentList.length > 0) {
                meta[currentKey] = currentList.join(', ');
            }
        }

        // 填充表单
        // 标题：如果有文件名则使用文件名（去掉.md和短横线），否则使用meta.title
        if (filename) {
            const titleFromFile = filename
                .replace(/\.md$/i, '')  // 去掉.md扩展名
                .replace(/-/g, ' ')      // 将短横线转为空格
                .replace(/\s+/g, ' ')    // 合并多余空格
                .trim();
            document.getElementById('title').value = titleFromFile;
        } else if (meta.title) {
            document.getElementById('title').value = meta.title;
        }

        // 日期：从Front Matter的date字段读取，需要转换为yyyy-MM-dd格式
        if (meta.date) {
            const dateValue = meta.date;
            // 如果是ISO格式 (2025-10-22T17:05:00)，只取日期部分
            const dateOnly = dateValue.split('T')[0];
            document.getElementById('date').value = dateOnly;
        }

        // 分类：从Front Matter读取（优先级：tags > tag > category）
        if (meta.tags) {
            document.getElementById('category').value = meta.tags;
        } else if (meta.tag) {
            document.getElementById('category').value = meta.tag;
        } else if (meta.category) {
            // 兼容旧的category字段
            document.getElementById('category').value = meta.category;
        }

        // 封面图和摘要保持原逻辑
        if (meta.cover) {
            document.getElementById('cover').value = meta.cover;
        }
        if (meta.excerpt) {
            document.getElementById('excerpt').value = meta.excerpt;
        }

        document.getElementById('content').value = body;

        // 更新字数统计
        charCount.textContent = body.length;

        showToast('Markdown 解析成功，表单已填充', 'success');
    } catch (error) {
        console.error('解析 Markdown 失败:', error);
        showToast('解析失败：' + error.message, 'error');
    }
}

// 处理文件上传
async function handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    // 验证文件类型
    if (!file.name.endsWith('.md') && file.type !== 'text/markdown' && file.type !== 'text/plain') {
        showToast('请选择 Markdown 文件 (.md)', 'error');
        event.target.value = ''; // 清空选择
        fileName.textContent = '';
        return;
    }

    try {
        // 读取文件内容
        const content = await readFileAsText(file);

        // 填充到文本框
        mdPaste.value = content;

        // 显示文件名
        fileName.textContent = `已选择: ${file.name}`;

        // 自动解析并填充表单
        parseMarkdown(file.name);

        // 清空文件选择，允许重复选择同一文件
        event.target.value = '';
    } catch (error) {
        console.error('读取文件失败:', error);
        showToast('读取文件失败: ' + error.message, 'error');
        fileName.textContent = '';
    }
}

// 读取文件为文本的辅助函数
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('文件读取错误'));
        reader.readAsText(file, 'UTF-8');
    });
}
let toastTimer;
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 这些函数需要在文件末尾之前定义，所以这里只是引用
// 实际的函数定义在上面已经完成

// 暴露给全局（仅用于兼容，实际使用事件委托）
// 注意：不要将这里改为调用自身，而是引用已定义的函数
window.editArticle = openModal;
window.showDeleteModal = showDeleteModal;
