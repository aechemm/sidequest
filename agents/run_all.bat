@echo off
cd /d "%~dp0"
where py >nul 2>&1 && set PY=py || set PY=python
echo Starting SideQuest BAND agents using %PY%...
start "Extractor" %PY% extractor.py
start "GraphAgent" %PY% graph_agent.py
start "Scout" %PY% scout.py
start "Connector" %PY% connector.py
start "Critic" %PY% critic.py
echo.
echo Five agent windows opened. Leave them running for the demo.
echo Press any key to close this launcher (agents keep running).
pause >nul
