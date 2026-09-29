@echo off
cd /d "%~dp0"
echo SideQuest local demo fix
echo.

if exist .env (
  echo Found .env — backing up to .env.local-backup
  if exist .env.local-backup del /F .env.local-backup
  move /Y .env .env.local-backup
  echo   Demo will use mock data instead of live Crusoe/Neo4j.
) else (
  echo No .env file — mock mode already.
)

echo.
echo Next steps:
echo   1. Stop the dev server ^(Ctrl+C in the terminal^)
echo   2. npm run dev
echo   3. Open http://127.0.0.1:4318  ^(NOT https^)
echo   4. Click Run Demo Data — wait up to 30 seconds on older code
echo.
echo Test API: http://127.0.0.1:4318/api/health
echo   ^(should show JSON, not 404^)
echo.
pause
