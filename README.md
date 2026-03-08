# 🐄 DairyPro Backend — Setup & Deployment Guide

**Stack:** Node.js + Express + MySQL + JWT Authentication

---

## 📁 Folder Structure

```
dairypro-backend/
├── server.js                  ← Entry point
├── package.json
├── .env.example               ← Copy to .env and fill in values
├── config/
│   └── db.js                  ← MySQL connection pool
├── middleware/
│   └── auth.js                ← JWT verification middleware
├── controllers/
│   ├── auth.controller.js     ← Register / Login / Me
│   ├── cattle.controller.js   ← Cattle CRUD
│   ├── milk.controller.js     ← Milk production logs
│   ├── sales.controller.js    ← Sales CRUD
│   ├── revenue.controller.js  ← Revenue analytics
│   ├── inventory.controller.js
│   └── dashboard.controller.js
├── routes/
│   ├── auth.routes.js
│   ├── cattle.routes.js
│   ├── milk.routes.js
│   ├── sales.routes.js
│   ├── revenue.routes.js
│   ├── inventory.routes.js
│   └── dashboard.routes.js
└── database/
    ├── migrate.js             ← Creates all tables
    └── seed.js                ← Inserts sample data
```

---

## 🚀 LOCAL SETUP (Step by Step)

### Step 1 — Install Node.js & MySQL
- Download Node.js (v18+): https://nodejs.org
- Download MySQL (v8+): https://dev.mysql.com/downloads/mysql/
- After installing MySQL, start the MySQL service

### Step 2 — Clone / Create Project
```bash
# Navigate to your folder
cd dairypro-backend

# Install all dependencies
npm install
```

### Step 3 — Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Open .env and set your MySQL password:
# DB_PASSWORD=your_actual_mysql_password
```

Your `.env` should look like:
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=dairypro
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### Step 4 — Run Database Migrations
```bash
# This creates the database and all tables
npm run migrate
```
Expected output:
```
✅  MySQL connected successfully
🔧  Running migrations...
✅  Table: users
✅  Table: cattle
✅  Table: milk_production
✅  Table: sales
✅  Table: inventory
✅  Table: alerts
🎉  All migrations completed successfully!
```

### Step 5 — (Optional) Seed Sample Data
```bash
# This inserts demo data for testing
npm run seed
```
Creates: 1 admin user, 5 cattle, 7 days of milk logs, 2 sales
Login credentials: `admin@dairypro.com` / `admin123`

### Step 6 — Start the Server
```bash
# Development mode (auto-restarts on file change)
npm run dev

# Production mode
npm start
```

Server runs at: `http://localhost:5000`
Test it: open browser and go to `http://localhost:5000` — you should see:
```json
{ "status": "ok", "message": "🐄 DairyPro API is running!" }
```

---

## 📡 API Reference

All protected routes require this header:
```
Authorization: Bearer <your_jwt_token>
```

### 🔐 Auth Endpoints
| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| POST | `/api/auth/register` | Create new farm account | ❌ |
| POST | `/api/auth/login` | Login & get token | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| PUT | `/api/auth/change-password` | Change password | ✅ |

**Register body:**
```json
{
  "farm_name": "GreenMeadow Farm",
  "email": "admin@farm.com",
  "password": "securepass123"
}
```

**Login body:**
```json
{ "email": "admin@farm.com", "password": "securepass123" }
```
**Login response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "farm_name": "GreenMeadow Farm", "email": "..." }
}
```

---

### 🐄 Cattle Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/cattle` | List all cattle |
| GET | `/api/cattle?health=Healthy` | Filter by health |
| GET | `/api/cattle?search=Bessie` | Search by name/tag |
| GET | `/api/cattle/:id` | Get one cattle |
| POST | `/api/cattle` | Add cattle |
| PUT | `/api/cattle/:id` | Update cattle |
| DELETE | `/api/cattle/:id` | Remove cattle |

**POST /api/cattle body:**
```json
{
  "tag_id": "COW-001",
  "name": "Bessie",
  "breed": "Holstein Friesian",
  "age_years": 4,
  "health_status": "Healthy",
  "avg_daily_yield": 22.5,
  "purchase_price": 180000
}
```

---

### 🥛 Milk Production Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/milk` | All milk logs |
| GET | `/api/milk/today` | Today's total |
| GET | `/api/milk/weekly` | Last 7 days chart |
| GET | `/api/milk?from=2026-01-01&to=2026-03-01` | Date range |
| POST | `/api/milk` | Log new entry |
| DELETE | `/api/milk/:id` | Delete entry |

**POST /api/milk body:**
```json
{
  "cattle_tag": "COW-001",
  "log_date": "2026-03-05",
  "session": "Morning",
  "quantity_l": 18.5,
  "quality": "Grade A",
  "notes": "Normal yield"
}
```

---

### 🛒 Sales Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/sales` | All sales |
| GET | `/api/sales?type=Milk` | Filter by type |
| GET | `/api/sales?status=Pending` | Filter by status |
| POST | `/api/sales` | Record sale |
| PATCH | `/api/sales/:id/status` | Update payment status |
| DELETE | `/api/sales/:id` | Delete sale |

**POST /api/sales body:**
```json
{
  "sale_type": "Milk",
  "item_desc": "Fresh Whole Milk",
  "quantity": 200,
  "rate": 120,
  "buyer_name": "Ahmad Dairy Co.",
  "payment_status": "Paid",
  "sale_date": "2026-03-05"
}
```

---

### 💰 Revenue Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/revenue/summary` | Total revenue breakdown |
| GET | `/api/revenue/monthly` | Last 12 months chart |
| GET | `/api/revenue/top-buyers` | Top customers |

---

### 📊 Dashboard
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/dashboard/summary` | All stats in one call |

---

## ☁️ DEPLOYMENT (Production)

### Option A — Deploy on Railway (Easiest, Free tier available)
1. Create account at https://railway.app
2. Click **New Project** → **Deploy from GitHub**
3. Push your code to GitHub first
4. Add a MySQL plugin in Railway dashboard
5. Set environment variables in Railway:
   - Copy all keys from `.env.example`
   - Railway auto-provides `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` from the MySQL plugin
6. Railway auto-deploys on every git push ✅

### Option B — Deploy on VPS (DigitalOcean / Linode)
```bash
# 1. SSH into your server
ssh root@your_server_ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# 4. Clone and setup
git clone https://github.com/yourusername/dairypro-backend.git
cd dairypro-backend
npm install
cp .env.example .env
nano .env   # fill in your values

# 5. Run migrations
npm run migrate

# 6. Install PM2 (keeps app running forever)
npm install -g pm2
pm2 start server.js --name dairypro
pm2 startup   # auto-start on reboot
pm2 save

# 7. Setup Nginx reverse proxy
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/dairypro
```

Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/dairypro /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
# For HTTPS:
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

### Option C — Deploy on Render (Free)
1. Push code to GitHub
2. Go to https://render.com → New Web Service
3. Connect repo, set Build Command: `npm install`
4. Set Start Command: `npm start`
5. Add environment variables in dashboard
6. Create a free MySQL database at https://planetscale.com and connect

---

## 🔗 Connecting Frontend to Backend

In your `dairy-management.html`, replace local state with API calls:

```javascript
const API = 'http://localhost:5000/api';
let token = localStorage.getItem('token');

// Login example
async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.success) {
    token = data.token;
    localStorage.setItem('token', token);
  }
}

// Authenticated request example
async function getCattle() {
  const res = await fetch(`${API}/cattle`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  return data.data;  // array of cattle
}

// Add cattle example
async function addCattle(cattleObj) {
  const res = await fetch(`${API}/cattle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(cattleObj)
  });
  return await res.json();
}
```

---

## 🛡️ Security Checklist for Production
- [ ] Change `JWT_SECRET` to a long random string (32+ chars)
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (SSL certificate via Let's Encrypt)
- [ ] Set `FRONTEND_URL` to your actual frontend domain
- [ ] Use strong MySQL password
- [ ] Enable MySQL firewall (only allow local connections)
- [ ] Set up database backups (daily)

---

## 🧪 Testing with Postman
1. Download Postman: https://postman.com
2. Create a collection called "DairyPro"
3. First call `POST /api/auth/login` — copy the token from response
4. In Postman, go to **Authorization** tab → Type: Bearer Token → paste token
5. Now test any protected endpoint

---
*DairyPro Backend — Built with Node.js + Express + MySQL*
