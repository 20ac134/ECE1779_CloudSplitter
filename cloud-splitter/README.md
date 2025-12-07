# Cloud Splitter (Local)

## Quick start

1. cd to the frontend directory and run:
```bash
Remove-Item -Recurse -Force .\node_modules
Remove-Item -Force .\package-lock.json
npm install
npx vite build
npm run build
```

2. cd back to the cloud-splitter directory and run:
```bash
docker compose up -d
```

3. Open:
- Web: http://localhost:5173
- API: http://localhost:8080
- MailHog: http://localhost:8025
