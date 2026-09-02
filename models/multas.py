"""Multas por tardanza o por no asistir a un partido confirmado.

Se pagan igual que la inscripción: Yape (sube comprobante, el admin lo
verifica) o efectivo (el admin la marca pagada directamente). Mientras un
jugador tenga una multa de tipo 'no_asistio' sin pagar, no puede confirmar
en otro partido — ver tiene_multa_no_asistio_pendiente(), usado antes de
inscribir_jugador() en las páginas."""

from database.connection import get_connection

TIPOS_VALIDOS = ("tardanza", "no_asistio")


def crear_multa(jugador_id, partido_id, tipo, monto):
    conexion = get_connection()
    try:
        cursor = conexion.execute(
            "INSERT INTO multas (jugador_id, partido_id, tipo, monto) VALUES (?, ?, ?, ?)",
            (jugador_id, partido_id, tipo, monto),
        )
        conexion.commit()
        return cursor.lastrowid
    finally:
        conexion.close()


def eliminar_multa_de_inscripcion(jugador_id, partido_id, tipo):
    """Si el admin corrige una marca de asistencia (ej. de 'no llegó' a
    'llegó'), borra la multa asociada — pero solo si todavía no se pagó,
    para no perder un pago ya hecho por error de tipeo."""
    conexion = get_connection()
    try:
        conexion.execute(
            """
            DELETE FROM multas
            WHERE jugador_id = ? AND partido_id = ? AND tipo = ? AND estado != 'pagado'
            """,
            (jugador_id, partido_id, tipo),
        )
        conexion.commit()
    finally:
        conexion.close()


def tiene_multa_no_asistio_pendiente(jugador_id):
    conexion = get_connection()
    try:
        fila = conexion.execute(
            "SELECT 1 FROM multas WHERE jugador_id = ? AND tipo = 'no_asistio' AND estado != 'pagado' LIMIT 1",
            (jugador_id,),
        ).fetchone()
        return fila is not None
    finally:
        conexion.close()


def obtener_multa(multa_id):
    conexion = get_connection()
    try:
        fila = conexion.execute("SELECT * FROM multas WHERE id = ?", (multa_id,)).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


def listar_multas_jugador(jugador_id, solo_pendientes=True):
    conexion = get_connection()
    try:
        consulta = "SELECT * FROM multas WHERE jugador_id = ?"
        if solo_pendientes:
            consulta += " AND estado != 'pagado'"
        consulta += " ORDER BY fecha_creacion DESC"
        filas = conexion.execute(consulta, (jugador_id,)).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()


def listar_multas_partido(partido_id):
    conexion = get_connection()
    try:
        filas = conexion.execute(
            """
            SELECT multas.*, usuarios.nombre, jugadores.apodo
            FROM multas
            JOIN jugadores ON jugadores.id = multas.jugador_id
            JOIN usuarios ON usuarios.id = jugadores.usuario_id
            WHERE multas.partido_id = ?
            ORDER BY multas.fecha_creacion
            """,
            (partido_id,),
        ).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()


def listar_pendientes_verificacion():
    """Multas con comprobante subido, esperando que el admin las apruebe o
    rechace (para la página Pagos)."""
    conexion = get_connection()
    try:
        filas = conexion.execute(
            """
            SELECT
                multas.*, usuarios.nombre, jugadores.apodo,
                partidos.fecha AS partido_fecha, partidos.hora AS partido_hora
            FROM multas
            JOIN jugadores ON jugadores.id = multas.jugador_id
            JOIN usuarios ON usuarios.id = jugadores.usuario_id
            LEFT JOIN partidos ON partidos.id = multas.partido_id
            WHERE multas.estado = 'pendiente_verificacion'
            ORDER BY multas.fecha_creacion
            """
        ).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()


def subir_comprobante(multa_id, imagen_bytes, mime):
    conexion = get_connection()
    try:
        conexion.execute(
            """
            UPDATE multas SET estado = 'pendiente_verificacion', comprobante_img = ?,
                comprobante_mime = ?, metodo_pago = 'yape', nota = NULL
            WHERE id = ?
            """,
            (imagen_bytes, mime, multa_id),
        )
        conexion.commit()
    finally:
        conexion.close()


def verificar_pago(multa_id, verificado_por):
    conexion = get_connection()
    try:
        conexion.execute(
            """
            UPDATE multas SET estado = 'pagado', verificado_por = ?,
                fecha_pago = datetime('now','localtime'), nota = NULL
            WHERE id = ?
            """,
            (verificado_por, multa_id),
        )
        conexion.commit()
    finally:
        conexion.close()


def rechazar_pago(multa_id, verificado_por, nota=""):
    conexion = get_connection()
    try:
        conexion.execute(
            """
            UPDATE multas SET estado = 'debe', verificado_por = ?, nota = ?
            WHERE id = ?
            """,
            (verificado_por, nota.strip(), multa_id),
        )
        conexion.commit()
    finally:
        conexion.close()


def marcar_pagado_manual(multa_id, verificado_por):
    conexion = get_connection()
    try:
        conexion.execute(
            """
            UPDATE multas SET estado = 'pagado', metodo_pago = 'efectivo', verificado_por = ?,
                fecha_pago = datetime('now','localtime'), nota = NULL
            WHERE id = ?
            """,
            (verificado_por, multa_id),
        )
        conexion.commit()
    finally:
        conexion.close()
