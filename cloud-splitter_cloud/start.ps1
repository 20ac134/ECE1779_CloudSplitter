
# Start Cloud Splitter on Windows (detached) and open URLs
param(
    [switch]$Logs
)

Write-Host "Starting Cloud Splitter (detached)..." -ForegroundColor Cyan
docker compose up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker compose failed. Ensure Docker Desktop is running."
    exit 1
}

Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"
Start-Process "http://localhost:8080/health"
Start-Process "http://localhost:8025"

if ($Logs) {
    Write-Host "Attaching logs. Press Ctrl+C to stop viewing (containers keep running)." -ForegroundColor Yellow
    docker compose logs -f
} else {
    Write-Host "Cloud Splitter started. Use 'docker compose logs -f' to follow logs." -ForegroundColor Green
}
