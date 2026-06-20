# 个人主页

一个现代化的个人主页，包含实时时钟、日历、备忘录系统和服务器状态监控功能。

## 功能特性

- 🕐 **实时时钟**：显示当前时间、日期和节假日
- 📅 **简略日历**：可切换月份的日历视图
- 📝 **备忘录系统**：按日期管理备忘录，数据持久化存储在本地
- 🖥️ **服务器监控**：SSH连接检测服务器在线状态、延迟和负载
- 👤 **个人简介**：美观的个人信息展示卡片

## 技术栈

- **前端**：原生HTML + CSS + JavaScript
- **后端**：Node.js + Express
- **SSH连接**：ssh2 库
- **样式**：CSS3（渐变、动画、响应式）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置服务器密码

复制环境变量示例文件并填入实际密码：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置所有服务器密码：

```env
ROUTER_PASSWORD=0621
NAS_PASSWORD=Yll@2468
CLOUD_PASSWORD=Yll@2468
OPENCLAW_PASSWORD=Yll@2468
PORT=3000
```

### 3. 启动服务器

```bash
npm start
```

或者在开发模式下运行：

```bash
npm run dev
```

### 4. 访问主页

打开浏览器访问：http://localhost:3000

## 配置说明

### 服务器配置

在 `server.js` 中已预配置了以下服务器：

- **软路由**：192.168.1.2 (root)
- **NAS**：192.168.1.110 (yll)
- **云服务器**：xiaji.xin (root)
- **OpenClaw**：192.168.1.111 (xiaji)

如需修改服务器配置，编辑 `server.js` 中的 `serverConfigs` 对象。

### 检测机制

- 使用 SSH 协议连接服务器
- 超时时间：10秒
- 通过 `uptime` 命令获取服务器负载
- 自动每60秒刷新一次状态

## 项目结构

```
zhuye/
├── index.html          # 主页HTML结构
├── style.css           # 样式表
├── script.js           # 前端逻辑
├── server.js           # 后端服务器
├── package.json        # 依赖配置
├── .env.example        # 环境变量示例
├── config.yaml         # 配置文件（备用）
└── README.md           # 说明文档
```

## 安全提示

⚠️ **重要安全提醒**：

1. `.env` 文件包含服务器密码，**切勿提交到版本控制系统**
2. 建议将 `.env` 添加到 `.gitignore`（已配置）
3. 生产环境建议使用密钥认证代替密码
4. 不要将服务器地址和账号信息暴露给未授权用户
5. 定期更换密码，使用强密码

## 自定义配置

### 修改个人简介

编辑 `index.html` 中的 `.profile-box` 部分：

```html
<h2>你的名字</h2>
<p class="profile-title">职位 / 头衔</p>
<p class="profile-description">这里是个人简介...</p>
```

### 更换头像

替换 `avatar.png` 文件，或修改 `index.html` 中的图片路径。

### 调整主题颜色

在 `style.css` 中修改渐变色：

```css
background: linear-gradient(90deg, #1e3c72 0%, #2a5298 25%, #6b4c9a 50%, #9b4bd9 75%, #7e22ce 100%);
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 故障排除

### 服务器状态显示"检测失败"

1. 检查服务器是否开机并联网
2. 验证 SSH 服务是否运行（端口22）
3. 检查 `.env` 文件中的密码是否正确
4. 确保网络可以访问目标服务器

### 端口占用

如果端口3000被占用，可以修改 `.env` 中的 `PORT` 值。

### 无法加载备忘录

备忘录数据存储在浏览器的 localStorage 中，清除浏览器数据会导致备忘录丢失。建议定期备份。

## 后续优化建议

- [ ] 使用 WebSocket 实时推送服务器状态
- [ ] 添加服务器 CPU、内存、磁盘使用率监控
- [ ] 实现备忘录的云端同步
- [ ] 添加主题切换功能（深色/浅色模式）
- [ ] 支持多语言
- [ ] 添加图表展示服务器历史负载

## License

MIT
