@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo   KANDO - servidor local
echo   ----------------------
echo   Sitio:  http://localhost:5173/index.html
echo   Editor: http://localhost:5173/editor.html
echo.
echo   Deja esta ventana abierta mientras navegas.
echo   Para cerrar el servidor, cerra esta ventana.
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:5173/index.html'"

where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 5173
  goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
  py -3 -m http.server 5173
  goto :end
)

echo No encontramos Python en esta computadora.
echo.
echo Opcion 1: instalalo desde https://www.python.org/downloads/ y volve a ejecutar este archivo.
echo Opcion 2: abri index.html con doble clic (funciona igual, sin servidor).
echo.
pause

:end
endlocal
