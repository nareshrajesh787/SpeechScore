# Monorepo Deployment (Frontend & Backend in One Repo)

If your GitHub repo contains both frontend/ and backend/ folders in the root (a monorepo), you can easily deploy both parts. Cloud hosts support deployment from subdirectories:

## How To Deploy a Monorepo:

### Frontend (Vercel/Netlify)
1. **Import your GitHub repo.**
2. **Set `Root Directory`:** `frontend/`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Environment Variables:**
   - `VITE_API_URL=https://your-backend-domain.com`

### Backend (Railway/Render/Fly.io/Your VPS)
1. **Import your GitHub repo.**
2. **Set `Root Directory`:** `backend/`
3. **For Python:** install requirements and run backend.
   - Railway/Render: Auto-detects `backend/`, or set in settings.
   - Custom VPS: `cd backend && pip install -r requirements.txt` and start `uvicorn`.
4. **Environment Variables:** (Add in service dashboard or .env file in backend)
   - `ASSEMBLYAI_API_KEY=...`
   - `GEMINI_API_KEY=...`
   - `ALLOWED_ORIGINS=https://frontend-domain.com`
   - `FIREBASE_CREDENTIALS_JSON={...}`  or  `FIREBASE_CREDENTIALS_FILE=...`

---

# Deployment Guide for SpeechScore

## ✅ All Critical Issues Fixed!

Your project is now ready for deployment. Here's what was fixed:

### Fixed Issues:
1. ✅ Environment variable support for API URL in frontend
2. ✅ CORS configuration supports production URLs via environment variables
3. ✅ Added `firebase-admin` to requirements.txt
4. ✅ Firebase credentials now use environment variables (secure for production)
5. ✅ Automatic file cleanup after processing
6. ✅ File size validation (20MB max)
7. ✅ File type validation
8. ✅ Health check endpoint (`/health` and `/api/health`)
9. ✅ Better error handling with proper HTTP status codes
10. ✅ Production server script included

---

## 🚀 Deployment Steps

### Frontend Deployment

#### Option 1: Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel **(Root Directory: frontend/)**
3. Set environment variable:
   - `VITE_API_URL = https://your-backend-domain.com`
4. Build command: `npm run build`  Output directory: `dist`
5. Deploy!

#### Option 2: Netlify
1. Push your code to GitHub
2. Import project in Netlify **(Publish directory = frontend/dist, base directory = frontend/)**
3. Set environment variable:
   - `VITE_API_URL = https://your-backend-domain.com`
4. Build command: `npm run build`
5. Deploy!

#### Option 3: Static Hosting (nginx, Apache, etc.)
1. Build: `cd frontend && npm run build`
2. Upload frontend/dist/ to your server
3. Configure server to serve static files
4. Set env var during build or use config file

---

### Backend Deployment

#### Option 1: Railway / Render / Fly.io
1. Import project, set root directory to `backend/`
2. Set environment variables:
   ```
   ASSEMBLYAI_API_KEY=your_key
   GEMINI_API_KEY=your_key
   ALLOWED_ORIGINS=https://your-frontend-domain.com
   FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
   ```
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Deploy!

#### Option 2: VPS (DigitalOcean, AWS EC2, etc.)
1. SSH into your server
2. `cd backend && pip install -r requirements.txt`
3. Create `.env` file with all environment variables in backend/
4. Run with production script:
   ```bash
   chmod +x run_production.sh
   ./run_production.sh
   ```
   Or manually:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
   ```
5. Set up reverse proxy (nginx) for SSL/TLS
6. Configure firewall

#### Option 3: Docker (Optional)
Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

## 🔐 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.com
```

### Backend (.env)
```env
# API Keys
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
GEMINI_API_KEY=your_gemini_api_key

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Firebase Credentials (choose one method)
# Method 1: JSON string (recommended for production)
FIREBASE_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# Method 2: File path (for local development)
FIREBASE_CREDENTIALS_FILE=path/to/credentials.json
```

---

## 📋 Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Firebase credentials configured securely
- [ ] CORS origins updated with production URLs
- [ ] API keys are valid and have sufficient quotas
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend runs locally with production settings
- [ ] Health check endpoint works (`/api/health`)
- [ ] SSL/TLS certificate configured (HTTPS)
- [ ] Domain names configured (DNS)
- [ ] Monitoring/logging set up (optional but recommended)

---

## 🧪 Testing After Deployment

1. **Health Check**: Visit `https://your-backend.com/api/health`
2. **Frontend**: Visit your frontend URL and test login
3. **Full Flow**: Upload an audio file and verify analysis works
4. **Error Handling**: Test with invalid files (too large, wrong type)

---

## 🔧 Troubleshooting

### CORS Errors
- Check `ALLOWED_ORIGINS` includes your frontend URL exactly (with https://)
- Ensure no trailing slashes in URLs

### Firebase Authentication Errors
- Verify `FIREBASE_CREDENTIALS_JSON` is valid JSON (escape quotes properly)
- Check Firebase project settings allow your domain

### File Upload Errors
- Check file size limits (20MB max)
- Verify temp directory has write permissions
- Check disk space on server

### API Connection Errors
- Verify `VITE_API_URL` is correct in frontend
- Check backend is running and accessible
- Verify firewall/security groups allow traffic

---

## 📊 Production Recommendations

1. **Monitoring**: Set up error tracking (Sentry, Rollbar)
2. **Logging**: Configure structured logging
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Backup**: Regular backups of Firestore data
5. **Scaling**: Use load balancer for multiple backend instances
6. **CDN**: Use CDN for frontend static assets

---

## 🎉 You're Ready!

Your application is now production-ready. Follow the steps above to deploy to your chosen platform.
