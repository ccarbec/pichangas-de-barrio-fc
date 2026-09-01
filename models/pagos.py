"""Comprobantes de pago (Yape) por inscripción, y el cuadre de caja por
partido (recaudado verificado vs. costo de cancha)."""

from database.connection import get_connection


def obtener_pago_por_inscripcion(inscripcion_id):
    conexion = get_connection()
    try:
        fila = conexion.execute(
            "SELECT * FROM pagos WHERE inscripcion_id = ?", (inscripcion_id,)
        ).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


def obtener_pago(pago_id):
    conexion = get_connection()
    try:
        fila = conexion.execute("SELECT * FROM pagos WHERE id = ?", (pago_id,)).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


def registrar_pago(inscripcion_id, monto, imagen_bytes, mime):
    """Sube (o vuelve a subir, si el anterior fue rechazado) el comprobante
    y lo deja en estado 'pendiente' para que el admin lo verifique."""
    existente = obtener_pago_por_inscripcion(inscripcion_id)
    conexion = get_connection()
    try:
        if existente:
            conexion.execute(
                """
                UPDATE pagos
                SET monto = ?, comprobante_img = ?, comprobante_mime = ?, estado = 'pendiente',
                    fecha_pago = datetime('now','localtime'), verificado_por = NULL,
                    fecha_verificacion = NULL, nota = NULL
                WHERE id = ?
                """,
                (monto, imagen_bytes, mime, existente["id"]),
            )
        else:
            conexion.execute(
                """
                INSERT INTO pagos (inscripcion_id, monto, comprobante_img, comprobante_mime)
                VALUES (?, ?, ?, ?)
                """,
                (inscripcion_id, monto, imagen_bytes, mime),
            )
        conexion.commit()
    finally:
        conexion.close()


def listar_pagos_pendientes():
    conexion = get_connection()
    try:
        filas = conexion.execute(
            """
            SELECT
                pagos.*,
                usuarios.nombre,
                jugadores.apodo,
                partidos.fecha AS partido_fecha,
                partidos.hora AS partido_hora,
                partidos.cancha AS partido_cancha
            FROM pagos
            JOIN inscripciones ON inscripciones.id = pagos.inscripcion_id
            JOIN jugadores ON jugadores.id = inscripciones.jugador_id
            JOIN usuarios ON usuarios.id = jugadores.usuario_id
            JOIN partidos ON partidos.id = inscripciones.partido_id
            WHERE pagos.estado = 'pendiente'
            ORDER BY pagos.fecha_pago
            """
        ).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()


def verificar_pago(pago_id, verificado_por):
    conexion = get_connection()
    try:
        conexion.execute(
            """
            UPDATE pagos SET estado = 'verificado', verificado_por = ?,
                fecha_verificacion = datetime('now','localtime'), nota = NULL
            WHERE id = ?
            """,
            (verificado_por, pago_id),
        )
        conexion.commit()
    finally:
        conexion.close()


def rechazar_pago(pago_id, verificado_por, nota=""):
    conexion = get_connection()
    try:
        conexion.execute(
            """
            UPDATE pagos SET estado = 'rechazado', verificado_por = ?,
                fecha_verificacion = datetime('now','localtime'), nota = ?
            WHERE id = ?
            """,
            (verificado_por, nota.strip(), pago_id),
        )
        conexion.commit()
    finally:
        conexion.close()


def cuadre_partido(partido_id):
    conexion = get_connection()
    try:
        recaudado = conexion.execute(
            """
            SELECT COALESCE(SUM(pagos.monto), 0) AS total
            FROM pagos
            JOIN inscripciones ON inscripciones.id = pagos.inscripcion_id
            WHERE inscripciones.partido_id = ? AND pagos.estado = 'verificado'
            """,
            (partido_id,),
        ).fetchone()["total"]
        pendiente = conexion.execute(
            """
            SELECT COALESCE(SUM(pagos.monto), 0) AS total
            FROM pagos
            JOIN inscripciones ON inscripciones.id = pagos.inscripcion_id
            WHERE inscripciones.partido_id = ? AND pagos.estado = 'pendiente'
            """,
            (partido_id,),
        ).fetchone()["total"]
        return {"recaudado": recaudado, "pendiente": pendiente}
    finally:
        conexion.close()
