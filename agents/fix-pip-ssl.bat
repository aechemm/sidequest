@echo off
cd /d "%~dp0"
where py >nul 2>&1 && set PY=py || set PY=python

echo.
echo Fixing pip SSL certificate error on Windows...
echo.

set CERT=%USERPROFILE%\cacert.pem
echo Downloading CA bundle to %CERT%
curl -fsSL -o "%CERT%" https://raw.githubusercontent.com/certifi/python-certifi/master/certifi/cacert.pem
if errorlevel 1 (
  echo curl failed. Try opening this URL in a browser, save as cacert.pem in your user folder:
  echo https://raw.githubusercontent.com/certifi/python-certifi/master/certifi/cacert.pem
  pause
  exit /b 1
)

set SSL_CERT_FILE=%CERT%
set REQUESTS_CA_BUNDLE=%CERT%
set PIP_CERT=%CERT%

echo Installing agent dependencies...
%PY% -m pip install -r requirements.txt
if errorlevel 1 (
  echo.
  echo Still failing? Repair Python from Start Menu ^> Python 3.14 ^> Modify ^> Repair
  echo Or install Python 3.12 from https://www.python.org/downloads/ and use py -3.12
  pause
  exit /b 1
)

echo.
echo Success. To make SSL fix permanent, add these to System Environment Variables:
echo   SSL_CERT_FILE=%CERT%
echo   REQUESTS_CA_BUNDLE=%CERT%
echo.
echo Next: copy agent_config.yaml.example agent_config.yaml, add Band keys, run run_all.bat
pause
