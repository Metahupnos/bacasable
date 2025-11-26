@echo off
title Portfolio Suivi - Serveurs

echo ================================================
echo    Demarrage des serveurs Portfolio Suivi
echo ================================================
echo.

:: Demarrer le proxy finance dans une nouvelle fenetre
echo [1/2] Demarrage du serveur Finance Proxy (port 4001)...
start "Finance Proxy - Port 4001" cmd /k "cd /d %~dp0finance-proxy && npm start"

:: Attendre 2 secondes
timeout /t 2 /nobreak >nul

:: Demarrer l'application React dans une nouvelle fenetre
echo [2/2] Demarrage de l'application React (port 3000)...
start "Portfolio Suivi - Port 3000" cmd /k "cd /d %~dp0 && npm start"

echo.
echo ================================================
echo    Serveurs demarres !
echo ================================================
echo.
echo    Finance Proxy : http://localhost:4001
echo    Application   : http://localhost:3000
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul
