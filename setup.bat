@echo off
setlocal
cd /d "%~dp0"
echo.
echo === Expense Tracker setup (run this once) ===
echo.

rem ---- 1. Check Python ----
set "PY="
where py >nul 2>&1 && set "PY=py -3"
if not defined PY where python >nul 2>&1 && set "PY=python"
if not defined PY (
  echo [!] Python was not found.
  echo     Install it with:  winget install Python.Python.3.12
  echo     or from https://www.python.org/downloads/  ^(tick "Add python.exe to PATH"^)
  echo     Then close this window and run setup.bat again.
  pause
  exit /b 1
)

rem ---- 2. Check Node.js ----
where npm >nul 2>&1
if errorlevel 1 (
  echo [!] Node.js was not found.
  echo     Install it with:  winget install OpenJS.NodeJS.LTS
  echo     or from https://nodejs.org
  echo     Then close this window and run setup.bat again.
  pause
  exit /b 1
)

rem ---- 3. Find PostgreSQL's psql ----
set "PSQL="
where psql >nul 2>&1 && set "PSQL=psql"
if not defined PSQL (
  for /d %%D in ("%ProgramFiles%\PostgreSQL\*") do (
    if exist "%%D\bin\psql.exe" set "PSQL=%%D\bin\psql.exe"
  )
)
if not defined PSQL (
  echo [!] PostgreSQL was not found.
  echo     Install it from https://www.postgresql.org/download/windows/
  echo     Keep the default port 5432 and remember the password you set for the "postgres" user.
  echo     Then run setup.bat again.
  pause
  exit /b 1
)

rem ---- 4. Create the database ----
echo Creating the "expenses" database...
set /p PGPASSWORD=Enter the password you chose for the PostgreSQL "postgres" user: 
"%PSQL%" -h localhost -U postgres -v ON_ERROR_STOP=1 -q -f db\init.sql
if errorlevel 1 (
  set "PGPASSWORD="
  echo.
  echo [!] Could not set up the database. Check that PostgreSQL is running
  echo     and that the password is correct, then run setup.bat again.
  pause
  exit /b 1
)
set "PGPASSWORD="
echo Database ready.

rem ---- 5. Backend packages ----
echo.
echo Installing backend packages...
%PY% -m venv backend\.venv
if errorlevel 1 ( echo [!] Could not create the Python environment. & pause & exit /b 1 )
backend\.venv\Scripts\python.exe -m pip install --quiet --upgrade pip
backend\.venv\Scripts\python.exe -m pip install --quiet -r backend\requirements.txt
if errorlevel 1 ( echo [!] Backend install failed. & pause & exit /b 1 )

rem ---- 6. Frontend packages ----
echo.
echo Installing frontend packages...
pushd frontend
call npm install --no-audit --no-fund
if errorlevel 1 ( popd & echo [!] Frontend install failed. & pause & exit /b 1 )
popd

echo.
echo === Setup complete. Double-click start.bat to run the app. ===
pause
