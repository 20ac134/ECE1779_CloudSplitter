# Cloud Splitter (Local)

## Quick start

1. cd to the frontend directory and run:
```bash
Remove-Item -Recurse -Force .\node_modules
Remove-Item -Force .\package-lock.json
npm install
npx vite build
```

2. cd back to the cloud-splitter directory and run:
```bash
docker compose up -d
```

3. Open local application using the below link:
- http://localhost:5173
- Should see login page, if not click logout button located at top right

