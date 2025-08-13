@echo off
echo Creating Python 3.12 virtual environment...

REM Create virtual environment
python -m venv .venv

REM Activate the virtual environment
call .venv\Scripts\activate

REM Upgrade pip
python -m pip install --upgrade pip

REM Install dependencies from requirements.txt if it exists
IF EXIST requirements.txt (
    echo Installing dependencies...
    pip install -r requirements.txt
) ELSE (
    echo No requirements.txt found. Installing common packages...
    pip install fastapi sqlalchemy uvicorn
)

echo.
echo ✅ Environment setup complete. You're now using Python:
python --version
