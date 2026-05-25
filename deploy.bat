@echo off
title Buzzi Messenger Deploy

echo ==========================
echo Buzzi Messenger Deploy
echo ==========================

cd /d "%~dp0"

echo.
echo Git initialiseren...
git init

echo.
echo Main branch instellen...
git branch -M main

echo.
echo Bestanden toevoegen...
git add .

echo.
echo Eerste commit maken...
git commit -m "Initial Buzzi Messenger upload"

echo.
echo Oude remote verwijderen...
git remote remove origin 2>nul

echo.
echo Nieuwe GitHub remote toevoegen...
git remote add origin https://github.com/BuzziMessenger/Buzzi5ChatGPT.git

echo.
echo Uploaden naar GitHub...
git push -u origin main --force

echo.
echo ==================================
echo Upload voltooid 😄
echo ==================================

pause