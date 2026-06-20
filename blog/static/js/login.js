// 登录页面 JavaScript

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // 显示提示消息
    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        toast.className = 'toast show ' + type;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 表单提交
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            showToast('请填写用户名和密码', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showToast('登录成功，正在跳转...', 'success');

                // 保存用户信息到 localStorage（用于前端显示）
                if (data.user) {
                    localStorage.setItem('userInfo', JSON.stringify(data.user));
                }

                // 2秒后跳转到后台管理页面
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            } else {
                showToast(data.error || '登录失败', 'error');
            }
        } catch (error) {
            console.error('登录错误:', error);
            showToast('网络错误，请稍后重试', 'error');
        }
    });

    // 检查是否已经登录
    checkLoginStatus();

    // 自动填充上次输入的用户名（可选）
    const savedUsername = localStorage.getItem('lastUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
    }
});

// 检查登录状态
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/session');
        const data = await response.json();

        if (data.isLoggedIn) {
            // 已经登录，直接跳转到后台
            window.location.href = 'admin.html';
        }
    } catch (error) {
        // 忽略错误，让用户正常显示登录页面
        console.log('未登录或会话已过期');
    }
}
