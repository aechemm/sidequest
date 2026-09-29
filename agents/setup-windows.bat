@echo off
cd /d "%~dp0"
echo Checking Python...
where py >nul 2>&1 && set PY=py || set PY=python
%PY% --version >nul 2>&1 || (
  echo.
  echo Python not found. Install from https://www.python.org/downloads/
  echo IMPORTANT: check "Add python.exe to PATH" during install.
  echo Then close and reopen Command Prompt and run this script again.
  pause
  exit /b 1
)

echo Using: %PY%
%PY% -m pip install -r requirements.txt
if not exist agent_config.yaml (
  copy agent_config.yaml.example agent_config.yaml
  echo Created agent_config.yaml — edit it with your Band keys before running agents.
)
echo.
echo Done. Next: notepad agent_config.yaml  then  run_all.bat
pause
