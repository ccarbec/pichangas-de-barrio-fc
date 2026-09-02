@echo off
cd /d "C:\carlos\pichangas_fc"
".venv\Scripts\python.exe" "scripts\recordatorios_auto.py" >> "logs\recordatorios.log" 2>&1
