# Crea el acceso directo "Actualizar Datos en Localhost" en el Escritorio,
# apuntando a correr_sincronizar_local.bat de ESTA carpeta (funciona sin
# importar donde se copio el proyecto).

$carpetaScripts = $PSScriptRoot
$carpetaProyecto = Split-Path $carpetaScripts -Parent
$rutaAccesoDirecto = "$env:USERPROFILE\Desktop\Actualizar Datos en Localhost.lnk"

$wsh = New-Object -ComObject WScript.Shell
$acceso = $wsh.CreateShortcut($rutaAccesoDirecto)
$acceso.TargetPath = Join-Path $carpetaScripts "correr_sincronizar_local.bat"
$acceso.WorkingDirectory = $carpetaProyecto
$acceso.IconLocation = "shell32.dll,239"
$acceso.Description = "Copiar datos reales (Turso) a la base local de pruebas de localhost"
$acceso.Save()

Write-Output "Acceso directo creado en: $rutaAccesoDirecto"
