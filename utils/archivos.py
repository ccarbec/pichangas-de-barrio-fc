"""Validación de fotos/comprobantes subidos antes de guardarlos como BLOB
en la base de datos — una foto de cámara sin comprimir (varios MB) tarda
mucho en subir a la nube (Turso) y puede hacer fallar la escritura, dejando
al jugador con la página colgada en medio del pago."""

MAX_BYTES_IMAGEN = 5 * 1024 * 1024


def validar_tamano_imagen(archivo_subido):
    """Devuelve un mensaje de error si el archivo pesa más de lo razonable
    para un comprobante/foto de perfil, o None si está OK."""
    if archivo_subido.size > MAX_BYTES_IMAGEN:
        return (
            f"La imagen pesa {archivo_subido.size / 1024 / 1024:.1f} MB — el máximo es "
            f"{MAX_BYTES_IMAGEN // 1024 // 1024} MB. Prueba con una captura de pantalla "
            "en vez de la foto original de la cámara."
        )
    return None
