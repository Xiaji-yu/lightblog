# Personal Homepage (zhuye)

A modern personal homepage featuring real-time clock, calendar, memo system, server status monitoring, and blog integration.

## Features

- 🕐 **Real-time Clock** — Current time, date, and holiday display
- 📅 **Calendar** — Month-switchable calendar view
- 📝 **Memo System** — Date-based memo management with localStorage persistence
- 🖥️ **Server Monitoring** — SSH-based server status, latency, and load detection
- 👤 **Profile Card** — Beautiful personal information display
- 📝 **Blog Box** — Latest articles from LightBlog (auto-refreshed)
- 🌤️ **Weather Widget** — Real-time weather via wttr.in API
- 💬 **Daily Quote** — Random quotes from hitokoto API

## Tech Stack

- **Frontend**: Vanilla HTML + CSS + JavaScript
- **Backend**: Node.js + Express
- **SSH**: ssh2 library
- **Styling**: CSS3 (gradients, animations, responsive)

## Quick Start

### 1. Install Dependencies

```bash
cd zhuye
npm install
```

### 2. Configure Server Passwords

Copy the environment variable example and fill in actual passwords:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
ROUTER_PASSWORD=your_router_password
NAS_PASSWORD=your_nas_password
CLOUD_PASSWORD=your_cloud_password
OPENCLAW_PASSWORD=your_openclaw_password
PORT=3000
BLOG_SERVICE_URL=https://blog.xiaji.xin
```

### 3. Start Server

```bash
npm start
```

Or in development mode:

```bash
npm run dev
```

### 4. Open Homepage

Visit: http://localhost:3000

## Project Structure

```
zhuye/
├── api/
│   ├── server.js           # Backend server (SSH monitoring, blog proxy)
│   ├── package.json
│   ├── .env.example        # Environment variable template
│   └── .env                # Actual config (gitignored)
├── static/
│   ├── index.html          # Homepage HTML
│   ├── script.js           # Frontend logic (clock, calendar, weather, etc.)
│   ├── style.css           # Styles
│   └── 1212.png            # Avatar image
├── nginx.conf              # Nginx configuration
├── deploy.sh               # Linux deployment script
└── README.md               # 中文文档
```

## Server Monitoring

Pre-configured servers (edit in `api/server.js`):

| Server | Host | SSH Port |
|--------|------|----------|
| Router | home.xiaji.xin | 22 |
| NAS | home.xiaji.xin | 2222 |
| Cloud | xiaji.xin | 22 |
| OpenClaw | home.xiaji.xin | 3333 |

### Detection Mechanism

- SSH protocol connection
- Timeout: 10 seconds
- Server load via `uptime` command
- Auto-refresh every 60 seconds

## Blog Integration

The homepage includes a blog section that fetches articles from LightBlog via the backend proxy:

```
Frontend → zhuye:3000/api/articles → blog:3000/api/articles → JSON response
```

- Auto-refreshes every 5 minutes
- Displays latest 5 articles with title, date, category, and excerpt
- Links to full article on blog.xiaji.xin

## Security Notes

⚠️ **Important**:

1. `.env` file contains server passwords — **never commit to version control**
2. `.env` is already in `.gitignore`
3. Production: use key-based SSH authentication instead of passwords
4. Don't expose server addresses and credentials to unauthorized users
5. Change passwords regularly, use strong passwords

## Customization

### Edit Profile Info

Edit the `.profile-box` section in `static/index.html`:

```html
<h2>Your Name</h2>
<p class="profile-title">Title / Role</p>
<p class="profile-description">Your bio here...</p>
```

### Change Avatar

Replace the `1212.png` file or update the image path in `index.html`.

### Adjust Theme Colors

Edit gradient in `static/style.css`:

```css
background: linear-gradient(90deg, #1e3c72 0%, #2a5298 25%, #6b4c9a 50%, #9b4bd9 75%, #7e22ce 100%);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Troubleshooting

### Server Status Shows "Detection Failed"

1. Check if the server is online and connected to the internet
2. Verify SSH service is running (port 22 or custom port)
3. Check passwords in `.env` file
4. Ensure network can reach target servers

### Port Conflict

If port 3000 is occupied, change the `PORT` value in `.env`.

### Memos Not Loading

Memo data is stored in browser's `localStorage`. Clearing browser data will delete memos. Back up regularly.

## Future Improvements

- [ ] WebSocket real-time server status push
- [ ] Server CPU, memory, disk usage monitoring
- [ ] Cloud sync for memos
- [ ] Dark/light theme toggle
- [ ] Multi-language support
- [ ] Charts for server load history

## License

MIT
