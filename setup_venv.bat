@echo off
REM Requires Python 3.9-3.11 (usd-core 26.5 does not support 3.12+)
REM Download Python from https://www.python.org/downloads/
python -m venv .venv
if errorlevel 1 (
    echo ERROR: python not found. Install Python 3.9-3.11 and ensure it is on PATH.
    exit /b 1
)
.venv\Scripts\pip install --upgrade pip
.venv\Scripts\pip install -r requirements.txt
echo Done. Run start.bat to start the server.
