@echo off
if not exist .venv\Scripts\activate.bat (
    echo .venv not found. Run setup_venv.bat first.
    exit /b 1
)
call .venv\Scripts\activate.bat
python host.py
