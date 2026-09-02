# Crea el acceso directo "Pichangas FC" en el Escritorio, apuntando a
# iniciar_pichangas.bat de ESTA carpeta (funciona sin importar donde se
# copio el proyecto).

$carpetaProyecto = $PSScriptRoot
$rutaAccesoDirecto = "$env:USERPROFILE\Desktop\Pichangas FC.lnk"

$wsh = New-Object -ComObject WScript.Shell
$acceso = $wsh.CreateShortcut($rutaAccesoDirecto)
$acceso.TargetPath = Join-Path $carpetaProyecto "iniciar_pichangas.bat"
$acceso.WorkingDirectory = $carpetaProyecto
$acceso.IconLocation = "shell32.dll,21"
$acceso.Description = "Abrir Pichangas de Barrio FC"
$acceso.Save()

Write-Output "Acceso directo creado en: $rutaAccesoDirecto"
