# Server Deployment Guide

_IMPORTANT_ - nginx init conf is the blueprint for nginx.conf

## Step-by-Step Commands to Deploy with HTTPS

### 1. Stop Current Containers
```bash
cd docker
docker compose down
```

### 2. Rebuild All Containers (with dependency fixes)
```bash
# docker compose build --no-cache
docker compose build --no-cache
```

### 3. Start Services (without SSL first)
```bash
# docker compose up -d server trade-engine dungeon-runtime
docker compose up -d server trade-engine dungeon-runtime
```

### 4. Set Up SSL Certificates
Replace `your-email@example.com` with your actual email:
```bash
./setup-ssl.sh your-email@example.com
```

### 5. Verify Everything is Running
```bash
# Check container status
docker compose ps

# Check logs if needed
docker compose logs -f
```

### 6. Test HTTPS Endpoints
```bash
# Test health check
curl -I https://api.flagwars.dev/health

# Test API endpoint
curl -I https://api.flagwars.dev/api/
```

---

## Troubleshooting Commands

### If SSL setup fails:
```bash
# Check nginx logs
docker compose logs nginx

# Check certbot logs
docker compose logs certbot

# Restart nginx
docker compose restart nginx
```

### If containers won't start:
```bash
# Check all logs
docker compose logs

# Rebuild specific service
docker compose build --no-cache server
docker compose up -d server
```

### Manual certificate renewal:
```bash
./renew-ssl.sh
```

---

## Expected Results

After successful deployment:
- ✅ Server accessible at `https://api.flagwars.dev`
- ✅ Health check at `https://api.flagwars.dev/health`
- ✅ API endpoints at `https://api.flagwars.dev/api/`
- ✅ Netlify can connect to your HTTPS API

## Important DNS Setup

**Before running the setup, ensure your domain points to your server:**
```bash
# Verify DNS resolution (should return 156.67.31.253)
nslookup api.flagwars.dev
```

**Update your React app to use the new API URL:**
```
https://api.flagwars.dev/api
```
