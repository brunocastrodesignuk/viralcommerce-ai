@echo off
title ViralCommerce AI — Backend
cd /d "%~dp0"
echo.
echo  ============================================
echo   ViralCommerce AI — Backend API
echo  ============================================
echo   URL: http://localhost:8000
echo   Docs: http://localhost:8000/docs
echo  ============================================
echo.
C:\Python314\python.exe -X utf8 -m uvicorn backend.main:create_app --factory --host 0.0.0.0 --port 8000 --log-level info
pause
