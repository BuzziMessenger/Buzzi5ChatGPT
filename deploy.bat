@echo off
title Buzzi Messenger Deploy

echo ====================================
echo      Buzzi Messenger Deploy
echo ====================================

cd /d "%~dp0"

echo.
echo [1/6] Git initialiseren...
git init

echo.
echo [2/6] Main branch instellen...
git branch -M main

echo.
echo [3/6] Bestanden toevoegen...
git add .

echo.
echo [4/6] Commit maken...
git commit -m "Buzzi Messenger Update"

echo.
echo [5/6] Github remote instellen...
git remote remove origin 2>nul
git remote add origin https://github.com/BuzziMessenger/Buzzi5ChatGPT.git

echo.
echo [6/6] Uploaden naar Github...
git push -u origin main --force

echo.
echo ====================================
echo        Upload voltooid 😄
echo ====================================

pause