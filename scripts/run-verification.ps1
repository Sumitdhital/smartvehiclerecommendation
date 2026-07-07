# PowerShell script to run production build, start server, run tests, and clean up.

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Starting Next.js Production Server..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Start npm start in the background via cmd.exe
$NextProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run start" -PassThru -NoNewWindow

# Wait for server to boot
Write-Host "Waiting 5 seconds for server to initialize on port 3000..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Run Puppeteer test suite
Write-Host "Running Puppeteer test script..." -ForegroundColor Green
node scripts/test-ui.js

# Kill Next.js server process
Write-Host "Cleaning up Next.js server process (PID: $($NextProcess.Id))..." -ForegroundColor Yellow
Stop-Process -Id $NextProcess.Id -Force

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Verification completed! Screenshots are in test-results/." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
