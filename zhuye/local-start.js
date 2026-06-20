#!/usr/bin/env node

/**
 * 本地开发服务器启动脚本
 * 同时提供静态文件和API服务
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const API_PORT = 3000;
const STATIC_PORT = 8080;

console.log('======================================');
console.log('  本地开发服务器启动中...');
console.log('======================================\n');

// 检查 static 目录是否存在
const staticDir = path.join(__dirname, 'static');
const apiDir = path.join(__dirname, 'api');

// 启动静态文件服务器（使用 Node.js 简单 HTTP 服务器）
function startStaticServer() {
    return new Promise((resolve, reject) => {
        const { exec } = require('child_process');
        console.log('📁 启动静态文件服务器...');

        // 检查 static 目录
        const fs = require('fs');
        if (!fs.existsSync(staticDir)) {
            console.error(`❌ 错误: 找不到 static 目录: ${staticDir}`);
            reject(new Error('static directory not found'));
            return;
        }

        // 使用 npx 启动一个简单的静态文件服务器
        const staticServer = spawn('npx', ['http-server', staticDir, '-p', STATIC_PORT, '-c-1'], {
            stdio: 'inherit',
            shell: true
        });

        staticServer.on('error', (err) => {
            console.error('❌ 启动静态文件服务器失败:', err.message);
            reject(err);
        });

        // 等待服务器启动
        setTimeout(() => {
            console.log(`   ✅ 静态文件服务器: http://localhost:${STATIC_PORT}`);
            resolve(staticServer);
        }, 2000);
    });
}

// 启动 API 服务器
function startAPIServer() {
    return new Promise((resolve, reject) => {
        console.log('🔌 启动 API 服务器...');

        // 检查 api 目录
        const fs = require('fs');
        if (!fs.existsSync(apiDir)) {
            console.error(`❌ 错误: 找不到 api 目录: ${apiDir}`);
            reject(new Error('api directory not found'));
            return;
        }

        // 检查 node_modules
        if (!fs.existsSync(path.join(apiDir, 'node_modules'))) {
            console.log('   📦 正在安装 API 依赖...');
            const npmInstall = spawn('npm', ['install'], {
                cwd: apiDir,
                stdio: 'inherit',
                shell: true
            });

            npmInstall.on('close', (code) => {
                if (code !== 0) {
                    console.error('❌ 依赖安装失败');
                    reject(new Error('npm install failed'));
                    return;
                }
                launchAPIServer(resolve, reject);
            });
        } else {
            launchAPIServer(resolve, reject);
        }
    });
}

function launchAPIServer(resolve, reject) {
    const { spawn } = require('child_process');
    const apiServer = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, 'api'),
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PORT: API_PORT }
    });

    apiServer.on('error', (err) => {
        console.error('❌ 启动 API 服务器失败:', err.message);
        reject(err);
    });

    // 等待服务器启动
    setTimeout(() => {
        console.log(`   ✅ API 服务器: http://localhost:${API_PORT}/api/server/status`);
        resolve(apiServer);
    }, 2000);
}

// 启动所有服务
async function startAll() {
    try {
        await Promise.all([
            startStaticServer(),
            startAPIServer()
        ]);

        console.log('\n======================================');
        console.log('✅ 所有服务已启动！');
        console.log('======================================');
        console.log(`\n🌐 访问主页: http://localhost:${STATIC_PORT}`);
        console.log(`📡 API 地址: http://localhost:${API_PORT}/api/server/status`);
        console.log('\n💡 提示:');
        console.log('   - 按 Ctrl+C 停止所有服务');
        console.log('   - 修改静态文件后会自动刷新');
        console.log('   - API 修改后需要重启\n');

        // 优雅关闭
        process.on('SIGINT', () => {
            console.log('\n\n🛑 正在停止服务...');
            process.exit(0);
        });

    } catch (error) {
        console.error('\n❌ 启动失败:', error.message);
        process.exit(1);
    }
}

// 检查依赖
try {
    require('http-server');
} catch (e) {
    console.log('📦 正在安装开发依赖...');
    const { execSync } = require('child_process');
    execSync('npm install -g http-server', { stdio: 'inherit' });
}

startAll();
