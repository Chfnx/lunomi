# Railway Deployment Guide

## Stap 1: GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/jouw-username/lunomi.git
git push -u origin main
```

## Stap 2: Railway Project Aanmaken
1. Ga naar https://railway.app
2. Klik "New Project"
3. Klik "Deploy from GitHub repo"
4. Selecteer je repository

## Stap 3: Database Toevoegen
1. Klik "+ New" → "Database" → "PostgreSQL"
2. Wacht tot de database klaar is
3. Kopieer de `DATABASE_URL` uit de variables

## Stap 4: Redis Toevoegen
1. Klik "+ New" → "Database" → "Redis"
2. Wacht tot Redis klaar is
3. Kopieer de `REDIS_URL` uit de variables

## Stap 5: Backend Deployen
1. Klik op je backend service
2. Ga naar "Variables" tab
3. Voeg deze variabelen toe:
   - `DATABASE_URL` (van PostgreSQL)
   - `REDIS_URL` (van Redis)
   - `NODE_ENV=production`
   - `BACKEND_PORT=4000`
   - `CORS_ORIGIN=https://jouw-frontend.railway.app`
   - `JWT_SECRET=<maak een sterk geheim aan>`
   - `X_API_KEY=<je X API key>`
   - `X_API_SECRET=<je X API secret>`
   - `X_BEARER_TOKEN=<je X bearer token>`
   - `BITGET_API_KEY=<je Bitget API key>`
   - `BITGET_API_SECRET=<je Bitget API secret>`
   - `BITGET_PASSPHRASE=<je Bitget passphrase>`

## Stap 6: Frontend Deployen
1. Klik "+ New" → "Empty Service"
2. Noem het "frontend"
3. Ga naar "Settings" → "Build" → "Dockerfile"
4. Stel Dockerfile path in: `frontend/Dockerfile`
5. Ga naar "Variables" tab
6. Voeg toe:
   - `VITE_API_URL=https://jouw-backend.railway.app`

## Stap 7: Networking
1. Ga naar backend service → "Networking"
2. Klik "Generate Domain" voor een publieke URL
3. Doe hetzelfde voor frontend
4. Update `CORS_ORIGIN` in backend met de frontend URL

## Stap 8: Database Migrate
1. Open de backend service
2. Ga naar "Console" tab
3. Voer uit: `npm run db:push`

## Stap 9: Testen
1. Ga naar je frontend URL
2. Test de connectie
3. Check backend logs voor errors

## Environment Variables Overzicht

### Backend:
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
NODE_ENV=production
BACKEND_PORT=4000
CORS_ORIGIN=https://frontend-url.railway.app
JWT_SECRET=sterk_geheim_hier
X_API_KEY=...
X_API_SECRET=...
X_BEARER_TOKEN=...
BITGET_API_KEY=...
BITGET_API_SECRET=...
BITGET_PASSPHRASE=...
```

### Frontend:
```
VITE_API_URL=https://backend-url.railway.app
```

## Kosten
- Railway geeft $5 gratis credit per maand
- PostgreSQL: ~$5/maand
- Redis: ~$5/maand
- Backend + Frontend hosting: ~$5/maand
- Totaal: ~$15-20/maand (buiten free tier)

## Tips
- Gebruik Railway's "Metrics" tab om performance te monitoren
- Zet "Auto-deploy" aan voor automatische deploys bij git push
- Gebruik "Secrets" voor sensitive variables
- Check "Logs" voor debugging
