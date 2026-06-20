const express = require('express');
const { Client } = require('ssh2');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');  // 可选：支持HTTPS代理
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;  // 修改为3000

// 调试：检查环境变量加载情况
console.log('\n🔧 调试信息:');
console.log('  工作目录:', process.cwd());
console.log('  .env 文件路径:', path.resolve(__dirname, '..', '.env'));
console.log('  .env 文件是否存在:', fs.existsSync(path.resolve(__dirname, '..', '.env')));
console.log('  环境变量状态:');
console.log('    ROUTER_PASSWORD:', process.env.ROUTER_PASSWORD ? '✅ 已设置' : '❌ 未设置');
console.log('    NAS_PASSWORD:', process.env.NAS_PASSWORD ? '✅ 已设置' : '❌ 未设置');
console.log('    CLOUD_PASSWORD:', process.env.CLOUD_PASSWORD ? '✅ 已设置' : '❌ 未设置');
console.log('    OPENCLAW_PASSWORD:', process.env.OPENCLAW_PASSWORD ? '✅ 已设置' : '❌ 未设置');
console.log('');

// 中间件
app.use(cors());
app.use(express.json());

// 提供静态文件服务
const staticPath = path.join(__dirname, '..', 'static');
app.use(express.static(staticPath));

// 服务器配置
const serverConfigs = {
    router: {
        name: '软路由',
        host: 'home.xiaji.xin',
        port: 22,
        username: 'root',
        password: process.env.ROUTER_PASSWORD
    },
    nas: {
        name: 'NAS',
        host: 'home.xiaji.xin',
        port: 2222,  // SSH 端口改为 7999
        username: 'yll',
        password: process.env.NAS_PASSWORD
    },
    cloud: {
        name: '云服务器',
        host: 'xiaji.xin',
        port: 22,
        username: 'root',
        password: process.env.CLOUD_PASSWORD
    },
    openclaw: {
        name: 'OpenClaw',
        host: 'home.xiaji.xin',
        port: 3333,  // SSH 端口改为 6999
        username: 'xiaji',
        password: process.env.OPENCLAW_PASSWORD
    }
};

const TIMEOUT_MS = 10000;

// SSH连接检测函数
function checkServerSSH(serverId) {
    return new Promise((resolve) => {
        const config = serverConfigs[serverId];
        if (!config || !config.password) {
            resolve({
                online: false,
                latency: null,
                load: null,
                error: '未配置密码'
            });
            return;
        }

        const startTime = Date.now();
        const conn = new Client();

        conn.on('error', (err) => {
            const latency = Date.now() - startTime;
            console.log(`${config.name} 连接失败:`, err.message);
            resolve({
                online: false,
                latency: latency,
                load: null,
                error: err.message
            });
        });

        conn.on('close', () => {
            // 连接关闭时的处理
        });

        conn.connect({
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            tryKeyboard: false,
            keepaliveInterval: 5000,
            keepaliveCountMax: 3
        });

        conn.on('ready', () => {
            const latency = Date.now() - startTime;

            // 执行 uptime 命令获取负载信息
            conn.exec('uptime', (err, stream) => {
                if (err) {
                    conn.end();
                    resolve({
                        online: true,
                        latency: latency,
                        load: null,
                        error: null
                    });
                    return;
                }

                let loadData = '';
                stream.on('data', (data) => {
                    loadData += data.toString();
                });

                stream.on('close', () => {
                    conn.end();

                    // 解析负载信息
                    // uptime 输出示例: "18:52:30 up 10:23,  2 users,  load average: 0.00, 0.01, 0.05"
                    const loadMatch = loadData.match(/load average:\s+([\d.]+),\s+([\d.]+),\s+([\d.]+)/);
                    const load1 = loadMatch ? parseFloat(loadMatch[1]).toFixed(2) : null;

                    resolve({
                        online: true,
                        latency: latency,
                        load: load1,
                        error: null
                    });
                });
            });
        });

        // 设置连接超时
        setTimeout(() => {
            if (conn._sock && conn._sock._parent) {
                conn.end();
            }
            const latency = Date.now() - startTime;
            resolve({
                online: false,
                latency: latency > TIMEOUT_MS ? TIMEOUT_MS : latency,
                load: null,
                error: '连接超时'
            });
        }, TIMEOUT_MS);
    });
}

// API路由：获取所有服务器状态
app.get('/api/server/status', async (req, res) => {
    const { server, timeout = 10000 } = req.query;

    if (server) {
        // 检测单个服务器
        if (!(server in serverConfigs)) {
            return res.json({
                success: false,
                message: '未知的服务器ID',
                data: null
            });
        }

        try {
            const status = await checkServerSSH(server);
            res.json({
                success: true,
                message: '检测完成',
                data: status
            });
        } catch (error) {
            res.json({
                success: false,
                message: error.message,
                data: null
            });
        }
    } else {
        // 检测所有服务器
        try {
            const results = {};
            const promises = [];

            for (const serverId in serverConfigs) {
                promises.push(
                    checkServerSSH(serverId).then(status => {
                        results[serverId] = status;
                    })
                );
            }

            await Promise.all(promises);

            res.json({
                success: true,
                message: '检测完成',
                data: results
            });
        } catch (error) {
            res.json({
                success: false,
                message: error.message,
                data: null
            });
        }
    }
});

// API路由：手动刷新单个服务器状态
app.post('/api/server/refresh/:serverId', async (req, res) => {
    const { serverId } = req.params;

    if (!(serverId in serverConfigs)) {
        return res.json({
            success: false,
            message: '未知的服务器ID',
            data: null
        });
    }

    try {
        const status = await checkServerSSH(serverId);
        res.json({
            success: true,
            message: '刷新完成',
            data: status
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message,
            data: null
        });
    }
});

// ==================== 博客文章代理 API ====================
// 配置blog服务地址
const BLOG_SERVICE_URL = process.env.BLOG_SERVICE_URL || 'http://localhost:3000';

// 代理获取文章列表（blog的 /api/articles 为公开接口，无需认证）
app.get('/api/articles', async (req, res) => {
    try {
        const blogUrl = `${BLOG_SERVICE_URL}/api/articles`;

        // 转发请求到blog服务（公开接口，无需Token）
        const response = await fetch(blogUrl, {
            timeout: 10000
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Blog API错误 [${response.status}]:`, errorText);
            return res.status(response.status).json({
                success: false,
                message: `获取文章失败: ${response.statusText}`,
                error: errorText
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('代理请求失败:', error);
        res.status(500).json({
            success: false,
            message: '获取文章列表失败',
            error: error.message
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 API 服务器启动成功`);
    console.log(`📍 API 地址: http://localhost:${PORT}`);
    console.log(`⏰ 当前时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('\n📋 已配置的服务器:');

    let configuredCount = 0;
    for (const [id, config] of Object.entries(serverConfigs)) {
        const status = config.password ? '✅ 已配置' : '❌ 未配置密码';
        console.log(`   ${config.name} (${config.host}) - ${status}`);
        if (config.password) configuredCount++;
    }

    console.log(`\n📊 配置状态: ${configuredCount}/${Object.keys(serverConfigs).length}`);
    console.log('\n💡 提示: 请确保 .env 文件中已设置所有服务器密码');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 正在关闭服务器...');
    process.exit(0);
});
