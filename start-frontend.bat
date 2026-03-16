@echo off
title ViralCommerce AI — Frontend
cd /d "%~dp0\frontend"
echo.
echo  ============================================
echo   ViralCommerce AI — Frontend
echo  ============================================
echo   URL: http://localhost:3000
echo  ============================================
echo.
set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm run dev
pause
