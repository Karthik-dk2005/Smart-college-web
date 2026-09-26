@echo off
title Smart Department - Full-Stack Application
cd /d "%~dp0"
echo ========================================================
echo Starting Smart Department Unified Full-Stack Application
echo ========================================================
set "PATH=C:\Users\User\.local\bin;%PATH%"
if exist "backend\.venv\Scripts\python.exe" (
    backend\.venv\Scripts\python.exe run.py
) else (
    uv run python run.py
)
pause
