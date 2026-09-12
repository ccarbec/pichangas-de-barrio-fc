# Crea el acceso directo "Enviar Recordatorios WhatsApp" en el Escritorio,
# apuntando a correr_recordatorios_manual.bat de ESTA carpeta (funciona sin
# importar donde se copio el proyecto).

$carpetaScripts = $PSScriptRoot
$carpetaProyecto = Split-Path $carpetaScripts -Parent
$rutaAccesoDirecto = "$env:USERPROFILE\Desktop\Enviar Recordatorios WhatsApp.lnk"

$wsh = New-Object -ComObject WScript.Shell
$acceso = $wsh.CreateShortcut($rutaAccesoDirecto)
$acceso.TargetPath = Join-Path $carpetaScripts "correr_recordatorios_manual.bat"
$acceso.WorkingDirectory = $carpetaProyecto
$acceso.IconLocation = "shell32.dll,138"
$acceso.Description = "Revisar y enviar recordatorios de WhatsApp de Pichangas de Barrio FC"
$acceso.Save()

Write-Output "Acceso directo creado en: $rutaAccesoDirecto"
