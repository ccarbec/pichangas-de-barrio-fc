@echo off
cd /d "%~dp0"

if not exist ".venv\Scripts\streamlit.exe" (
    echo No se encontro el entorno virtual en .venv
    echo Corre: py -3.13 -m venv .venv  y luego  .venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

echo Iniciando Pichangas de Barrio FC...
echo No cierres esta ventana mientras uses la aplicacion.
echo Se abrira sola en Chrome. Para salir, cierra esta ventana.
echo.

start "" /min cmd /c "%~dp0abrir_chrome.bat"

".venv\Scripts\streamlit.exe" run app.py --server.headless true --server.port 8508

pause
