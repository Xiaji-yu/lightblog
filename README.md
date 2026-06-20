# LightBlog

A lightweight, zero-database blog system powered by Node.js and Markdown.

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D14-blue)
![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen)

## ✨ Features

- 📝 **Markdown-first** — All articles are `.md` files with YAML Front Matter
- 🔐 **Secure auth** — Session + Bearer Token dual auth, bcrypt password hashing
- 🎨 **Dark mode** — System-aware theme switching with manual toggle
- 📱 **Responsive** — Works on desktop, tablet, and mobile
- ⚡ **Production-ready** — Nginx reverse proxy + Systemd service included
- 🏷️ **Categories & tags** — Flexible article organization
- 📖 **Timeline view** — Chronological browsing of all articles
- 🔧 **Admin panel** — Full CRUD, Markdown import, Token management
- 🛡️ **XSS protection** — DOMPurify sanitization on rendered HTML

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Xiaji-yu/lightblog.git
cd lightblog/api

# Install dependencies
npm install

# Start the server
node server.js
```

Open `http://localhost:3000` in your browser.

> **First run**: 3 demo articles are automatically imported. Admin credentials are printed to the console — save them!

## 📁 Project Structure

```
lightblog/
├── LICENSE
├── README.md
├── .gitignore
├── cleanup-logs.sh              # Log rotation script
│
├── nginx.conf                   # Nginx configuration
├── blog.service                 # Systemd service file
├── deploy-linux.sh              # Automated deployment script
│
├── static/                      # Frontend (served by Nginx in production)
│   ├── index.html               # Home page
│   ├── admin.html               # Admin dashboard
│   ├── login.html               # Login page
│   ├── article.html             # Article detail page
│   ├── timeline.html            # Timeline view
│   ├── css/
│   │   ├── style.css            # Main styles (glassmorphism, dark mode)
│   │   ├── admin.css            # Admin panel styles
│   │   └── login.css            # Login page styles
│   ├── js/
│   │   ├── script.js            # Home page logic
│   │   ├── admin.js             # Admin CRUD & Token management
│   │   ├── login.js             # Authentication
│   │   └── article.js           # Article rendering
│   └── images/                  # Cover images
│
└── api/                         # Backend
    ├── server.js                # Express application (all routes)
    ├── package.json
    ├── .env.example             # Environment variables template
    ├── API_DOCUMENTATION.md      # Full API reference
    ├── seed/                    # Demo articles (imported on first run)
    │   ├── welcome-to-lightblog.md
    │   ├── markdown-guide.md
    │   └── deployment-guide.md
    └── app-data/                # Runtime data (gitignored)
        ├── md/                  # Markdown articles
        ├── users.json           # User accounts
        ├── article-id-map.json  # Article ID mapping
        └── logs/                # Application logs
```

## 🔧 Configuration

Copy `.env.example` to `.env` and customize:

```ini
# Server port
PORT=3000

# Disable Express static file serving (set to true when using Nginx)
DISABLE_STATIC=true

# Session secret (generate with: openssl rand -hex 32)
SESSION_SECRET=your-random-secret-here

# Admin passwords (only used on first run — leave empty to auto-generate)
# ADMIN_PASSWORD=
# SUPERADMIN_PASSWORD=

# Set to 'production' for HTTPS-only cookies
NODE_ENV=production
```

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/articles` | — | List all articles |
| `GET` | `/api/public/articles` | — | Latest 5 articles |
| `GET` | `/api/articles/:id` | — | Get article (add `?html=true` for HTML) |
| `POST` | `/api/articles` | Token | Create article |
| `PUT` | `/api/articles/:id` | Token | Update article |
| `DELETE` | `/api/articles/:id` | Token | Delete article |
| `POST` | `/api/login` | — | Login |
| `POST` | `/api/logout` | Session | Logout |
| `GET` | `/api/session` | — | Current session info |
| `POST` | `/api/change-password` | Token | Change password |
| `GET` | `/api/token` | Token | Get API token |
| `POST` | `/api/token/reset` | Token | Reset token |
| `DELETE` | `/api/token` | Token | Delete token |

Full API documentation: [API_DOCUMENTATION.md](api/API_DOCUMENTATION.md)

## 🖥️ Production Deployment

See [deploy-linux.sh](deploy-linux.sh) for the automated deployment script, or follow these steps:

### 1. Server Setup

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Deploy

```bash
sudo mkdir -p /var/www
cd /var/www
git clone https://github.com/Xiaji-yu/lightblog.git blog
cd blog/api
npm install --production
cp .env.example .env
# Edit .env with your configuration
nano .env
```

### 3. Configure Nginx

```bash
sudo cp ../nginx.conf /etc/nginx/sites-available/blog
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Start the Service

```bash
sudo cp ../blog.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now blog
sudo systemctl status blog
```

### 5. Enable HTTPS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔐 Authentication

LightBlog uses a dual authentication system:

- **Session auth** — For browser-based access (admin panel)
- **Token auth** — For API/programmatic access (`Authorization: Bearer <token>`)

Token usage example:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/articles
```

## 📝 Writing Articles

Articles are Markdown files with YAML Front Matter:

```markdown
---
title: My First Post
date: 2026-06-20
category: Tech
cover: article1.jpg
excerpt: A short description of this post.
---

# My First Post

Article content in **Markdown**...
```

## 🧹 Maintenance

```bash
# Clean logs older than 7 days
./cleanup-logs.sh

# Backup data
tar -czf backup-$(date +%Y%m%d).tar.gz api/app-data/

# Update dependencies
cd api && npm update
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express 4 |
| Markdown | marked 9 |
| Auth | express-session + bcryptjs |
| Sanitization | DOMPurify + jsdom |
| Frontend | Vanilla HTML/CSS/JS |
| Deployment | Nginx + Systemd |

## 📄 License

MIT — see [LICENSE](LICENSE) for details.