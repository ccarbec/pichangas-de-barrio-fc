@echo off
cd /d "%~dp0.."

if not exist ".venv\Scripts\python.exe" (
    echo No se encontro el entorno virtual en .venv
    pause
    exit /b 1
)

echo Revisando y enviando recordatorios de WhatsApp...
echo No cierres esta ventana ni el Chrome que se abra mientras corre.
echo.

".venv\Scripts\python.exe" "scripts\recordatorios_auto.py"

echo.
echo Listo. Revisa arriba si hubo envios o fallos.
pause
