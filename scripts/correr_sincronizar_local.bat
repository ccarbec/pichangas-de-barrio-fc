@echo off
cd /d "%~dp0.."

if not exist ".venv\Scripts\python.exe" (
    echo No se encontro el entorno virtual en .venv
    pause
    exit /b 1
)

echo Copiando datos reales (jugadores, partidos, pagos, multas) a localhost...
echo.

".venv\Scripts\python.exe" "scripts\sincronizar_jugadores_a_local.py"

echo.
echo Listo. Si localhost esta abierto, recarga la pagina para verlo.
pause
