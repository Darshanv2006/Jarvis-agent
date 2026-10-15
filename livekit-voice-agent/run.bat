@echo off
echo ========================================================
echo   Starting JARVIS Assistant-C37 LiveKit Voice Agent
echo ========================================================
cd /d "%~dp0"

IF NOT EXIST "venv" (
    echo [1/3] Creating Python virtual environment...
    python -m venv venv
)

echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/3] Checking dependencies...
pip install -r requirements.txt --quiet

echo.
echo ========================================================
echo   Launching agent.py dev...
echo ========================================================
python agent.py dev
pause
