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


def listar_pagos_por_inscripciones(inscripcion_ids):
    """Como obtener_pago_por_inscripcion, pero para varias inscripciones a
    la vez en una sola consulta (jugador viendo varias pichangas propias)."""
    if not inscripcion_ids:
        return {}
    conexion = get_connection()
    try:
        placeholders = ",".join("?" * len(inscripcion_ids))
        filas = conexion.execute(
            f"SELECT * FROM pagos WHERE inscripcion_id IN ({placeholders})",
            tuple(inscripcion_ids),
        ).fetchall()
        return {f["inscripcion_id"]: dict(f) for f in filas}
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


def marcar_pago_manual(inscripcion_id, monto, verificado_por):
    """El admin marca el pago como recibido en efectivo, sin necesidad de
    que el jugador haya subido comprobante de Yape."""
    existente = obtener_pago_por_inscripcion(inscripcion_id)
    conexion = get_connection()
    try:
        if existente:
            conexion.execute(
                """
                UPDATE pagos
                SET monto = ?, estado = 'verificado', metodo_pago = 'efectivo',
                    verificado_por = ?, fecha_verificacion = datetime('now','localtime'), nota = NULL
                WHERE id = ?
                """,
                (monto, verificado_por, existente["id"]),
            )
        else:
            conexion.execute(
                """
                INSERT INTO pagos (inscripcion_id, monto, estado, metodo_pago, verificado_por, fecha_verificacion)
                VALUES (?, ?, 'verificado', 'efectivo', ?, datetime('now','localtime'))
                """,
                (inscripcion_id, monto, verificado_por),
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
                jugadores.apellidos,
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


def listar_todos():
    """Todos los pagos de la historia del club (verificados, pendientes,
    rechazados) — para exportar a Excel. Sin la imagen del comprobante
    (BLOB, no tiene sentido en una celda de Excel)."""
    conexion = get_connection()
    try:
        filas = conexion.execute(
            """
            SELECT
                pagos.id, pagos.monto, pagos.estado, pagos.metodo_pago,
                pagos.fecha_pago, pagos.fecha_verificacion, pagos.nota,
                usuarios.nombre, jugadores.apodo, jugadores.apellidos,
                partidos.fecha AS partido_fecha, partidos.hora AS partido_hora,
                partidos.cancha AS partido_cancha
            FROM pagos
            JOIN inscripciones ON inscripciones.id = pagos.inscripcion_id
            JOIN jugadores ON jugadores.id = inscripciones.jugador_id
            JOIN usuarios ON usuarios.id = jugadores.usuario_id
            JOIN partidos ON partidos.id = inscripciones.partido_id
            ORDER BY pagos.fecha_pago
            """
        ).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()


def cuadre_multiples(partido_ids):
    """Como cuadre_partido, pero para varios partidos en una sola ida y
    vuelta a Turso (2 consultas agregadas en vez de 2 por cada partido
    mostrado en pantalla)."""
    if not partido_ids:
        return {}
    conexion = get_connection()
    try:
        placeholders = ",".join("?" * len(partido_ids))
        recaudado_filas = conexion.execute(
            f"""
            SELECT inscripciones.partido_id AS partido_id, COALESCE(SUM(pagos.monto), 0) AS total
            FROM pagos
            JOIN inscripciones ON inscripciones.id = pagos.inscripcion_id
            WHERE inscripciones.partido_id IN ({placeholders}) AND pagos.estado = 'verificado'
            GROUP BY inscripciones.partido_id
            """,
            tuple(partido_ids),
        ).fetchall()
        pendiente_filas = conexion.execute(
            f"""
            SELECT inscripciones.partido_id AS partido_id, COALESCE(SUM(pagos.monto), 0) AS total
            FROM pagos
            JOIN inscripciones ON inscripciones.id = pagos.inscripcion_id
            WHERE inscripciones.partido_id IN ({placeholders}) AND pagos.estado = 'pendiente'
            GROUP BY inscripciones.partido_id
            """,
            tuple(partido_ids),
        ).fetchall()
    finally:
        conexion.close()
    recaudado_por_partido = {f["partido_id"]: f["total"] for f in recaudado_filas}
    pendiente_por_partido = {f["partido_id"]: f["total"] for f in pendiente_filas}
    return {
        pid: {
            "recaudado": recaudado_por_partido.get(pid, 0),
            "pendiente": pendiente_por_partido.get(pid, 0),
        }
        for pid in partido_ids
    }


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
