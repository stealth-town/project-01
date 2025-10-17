# Deployment Guide

This guide will help you deploy the Unfuck Game to production using:
- **Supabase Cloud** for the database
- **Docker** for backend services (server + workers)
- **Netlify** for the frontend

## Prerequisites

- Docker and Docker Compose installed on your server
- A Supabase Cloud account ([supabase.com](https://supabase.com))
- A Netlify account ([netlify.com](https://netlify.com))
- Git installed on your server

---

## Step 1: Set Up Supabase Cloud

### 1.1 Create a New Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose an organization and set project details
4. Wait for the project to be created (~2 minutes)

### 1.2 Apply Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `docker/init-supabase.sql` from this repository
3. Copy all contents and paste into the SQL Editor
4. Click "Run" to execute the schema
5. Verify tables were created in the **Table Editor**

### 1.3 Get API Credentials

1. Go to **Project Settings** > **API**
2. Copy the **Project URL** (looks like: `https://xxxxx.supabase.co`)
3. Copy the **anon/public** key (this is your SUPABASE_ANON_KEY)
4. Save these for the next steps

---

## Step 2: Deploy Backend (Docker on Your Server)

### 2.1 Clone the Repository

```bash
cd ~
git clone <your-repo-url> unfuck
cd unfuck
```

### 2.2 Run Installation Script

```bash
./install.sh
```

This will:
- Check for Docker and Docker Compose
- Install dependencies
- Create `docker/.env` from template

### 2.3 Configure Environment Variables

Edit `docker/.env` and add your Supabase credentials:

```bash
nano docker/.env
```

Update with your values:
```env
SUPABASE_API_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Save and exit (Ctrl+X, then Y, then Enter)

### 2.4 Build the Project

```bash
./build.sh
```

This will build all packages in the correct order:
1. Shared package
2. Server
3. Workers (trade-engine, dungeon-runtime)

### 2.5 Start Docker Services

```bash
cd docker
docker-compose up -d
```

### 2.6 Verify Services are Running

```bash
docker-compose ps
```

You should see 3 containers running:
- `unfuck-server` (port 3000)
- `unfuck-trade-engine`
- `unfuck-dungeon-runtime`

Check logs:
```bash
docker-compose logs -f
```

Test the API:
```bash
curl http://localhost:3000/health
```

Should return: `{"status":"ok"}`

---

## Step 3: Deploy Frontend (Netlify)

### 3.1 Push Code to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 3.2 Connect to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" > "Import an existing project"
3. Choose your Git provider (GitHub)
4. Select your repository
5. Configure build settings:

**Build settings:**
- **Build command:** `cd packages/app && yarn build`
- **Publish directory:** `packages/app/dist`
- **Base directory:** (leave empty)

### 3.3 Set Environment Variables

In Netlify, go to **Site settings** > **Environment variables** and add:

```
VITE_API_URL=http://your-server-ip:3000/api
```

Or if you have a domain:
```
VITE_API_URL=https://api.yourdomain.com/api
```

### 3.4 Deploy

Click "Deploy site" and wait for the build to complete.

---

## Step 4: Configure Domain & SSL (Optional but Recommended)

### 4.1 For the API Server

If you want a custom domain for your API (e.g., `api.yourdomain.com`):

1. Set up a reverse proxy (nginx/Caddy) on your server
2. Point your domain's DNS A record to your server's IP
3. Configure SSL with Let's Encrypt

**Example nginx config:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then get SSL:
```bash
sudo certbot --nginx -d api.yourdomain.com
```

### 4.2 For the Frontend (Netlify)

Netlify automatically provides SSL. To use a custom domain:

1. Go to **Site settings** > **Domain management**
2. Click "Add custom domain"
3. Follow the instructions to update your DNS records

---

## Maintenance Commands

### View Logs
```bash
cd ~/unfuck/docker
docker-compose logs -f                    # All services
docker-compose logs -f server             # Server only
docker-compose logs -f trade-engine       # Trade engine only
```

### Restart Services
```bash
cd ~/unfuck/docker
docker-compose restart                    # Restart all
docker-compose restart server             # Restart server only
```

### Stop Services
```bash
cd ~/unfuck/docker
docker-compose down
```

### Update Application
```bash
cd ~/unfuck
git pull
./build.sh
cd docker
docker-compose down
docker-compose up -d --build
```

### Check Service Status
```bash
cd ~/unfuck/docker
docker-compose ps
```

### Clean Up Old Images
```bash
docker system prune -a
```

---

## Troubleshooting

### Server won't start

1. Check logs: `docker-compose logs server`
2. Verify environment variables in `docker/.env`
3. Ensure Supabase credentials are correct
4. Check if port 3000 is available: `netstat -tulpn | grep 3000`

### Workers not connecting

1. Check logs: `docker-compose logs trade-engine` or `docker-compose logs dungeon-runtime`
2. Verify Supabase credentials
3. Ensure server is running first: `docker-compose ps`

### Frontend can't connect to API

1. Check CORS settings in the server
2. Verify `VITE_API_URL` is set correctly in Netlify
3. Test API directly: `curl http://your-server:3000/health`

### Database connection issues

1. Verify Supabase project is running
2. Check API credentials in Project Settings > API
3. Ensure `init-supabase.sql` was executed successfully

---

## Security Notes

Since this is a closed demo for friends and family:
- No row-level security (RLS) is implemented
- Anyone with the URL can access the game
- For production use, implement proper authentication and RLS

---

## Architecture Overview

```
┌─────────────────┐
│   Netlify       │ (Frontend - React)
│   (Static)      │
└────────┬────────┘
         │ VITE_API_URL
         ▼
┌─────────────────┐
│   Your Server   │
│  Docker Compose │
│                 │
│  ┌───────────┐  │
│  │  Server   │  │ (Port 3000)
│  │  (API)    │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────┴─────┐  │
│  │  Workers  │  │
│  │  - Trade  │  │
│  │  - Dungeon│  │
│  └───────────┘  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Cloud  │ (PostgreSQL)
│   (Database)    │
└─────────────────┘
```

---

## Support

If you encounter issues:
1. Check the logs first
2. Verify all environment variables
3. Ensure all services are running
4. Test each component individually (database, API, frontend)
