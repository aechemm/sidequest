@echo off
cd /d "%~dp0"
echo Starting SideQuest BAND agents...
start "Extractor" python extractor.py
start "GraphAgent" python graph_agent.py
start "Scout" python scout.py
start "Connector" python connector.py
start "Critic" python critic.py
echo.
echo Five agent windows opened. Leave them running for the demo.
echo Press any key to close this launcher (agents keep running).
pause >nul
