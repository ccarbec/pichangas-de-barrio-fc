# Crea el acceso directo "Enviar Mensaje de Cierre" en el Escritorio,
# apuntando a correr_cierre_manual.bat de ESTA carpeta (funciona sin
# importar donde se copio el proyecto).

$carpetaScripts = $PSScriptRoot
$carpetaProyecto = Split-Path $carpetaScripts -Parent
$rutaAccesoDirecto = "$env:USERPROFILE\Desktop\Enviar Mensaje de Cierre.lnk"

$wsh = New-Object -ComObject WScript.Shell
$acceso = $wsh.CreateShortcut($rutaAccesoDirecto)
$acceso.TargetPath = Join-Path $carpetaScripts "correr_cierre_manual.bat"
$acceso.WorkingDirectory = $carpetaProyecto
$acceso.IconLocation = "shell32.dll,177"
$acceso.Description = "Enviar mensaje de aliento tras la ultima pichanga jugada"
$acceso.Save()

Write-Output "Acceso directo creado en: $rutaAccesoDirecto"
