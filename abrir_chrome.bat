@echo off
REM Espera a que el panel (Streamlit) ya este arriba y recien ahi abre
REM Chrome apuntando a el. Lo llama iniciar_pichangas.bat en segundo plano,
REM no hace falta correrlo a mano.

set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

for /l %%i in (1,1,30) do (
    curl -s -o nul http://localhost:8508 2>nul
    if not errorlevel 1 goto :abrir
    timeout /t 1 /nobreak >nul
)

:abrir
if exist "%CHROME%" (
    start "" "%CHROME%" "http://localhost:8508"
) else (
    start "" "http://localhost:8508"
)
