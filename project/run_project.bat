@echo off
echo ========================================
echo  Hospital Intelligence Platform
echo  Starting Application...
echo ========================================
echo.

echo Checking MongoDB connection...
timeout /t 2 /nobreak >nul

echo.
echo Starting Backend Server...
start "Hospital Backend" cmd /k "cd /d %~dp0server && node index.js"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Development Server...
start "Hospital Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ========================================
echo  Application Starting!
echo ========================================
echo.
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:5173
echo.
echo  Press any key to open the application in your browser...
pause >nul

start http://localhost:5173

echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
