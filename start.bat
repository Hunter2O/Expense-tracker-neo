@echo off
setlocal
cd /d "%~dp0"

if not exist backend\.venv\Scripts\python.exe (
  echo Run setup.bat first.
  pause
  exit /b 1
)

echo Starting the API and the app in two windows...
start "Expense Tracker API" /d "%~dp0backend" cmd /k ".venv\Scripts\python.exe -m uvicorn app.main:app --reload"
start "Expense Tracker App" /d "%~dp0frontend" cmd /k "npm run dev"

echo Opening your browser in a few seconds...
timeout /t 8 /nobreak >nul
start "" http://localhost:5173
echo.
echo To stop the app, close the two new windows.
timeout /t 5 >nul
