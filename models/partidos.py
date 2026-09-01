"""CRUD de pichangas (partidos programados)."""

from database.connection import get_connection


def crear_partido(fecha, hora, cancha, cupo_max, costo_cancha, costo_por_jugador, notas=""):
    conexion = get_connection()
    try:
        cursor = conexion.execute(
            """
            INSERT INTO partidos (fecha, hora, cancha, cupo_max, costo_cancha, costo_por_jugador, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (fecha, hora, cancha.strip(), cupo_max, costo_cancha, costo_por_jugador, notas.strip()),
        )
        conexion.commit()
        return cursor.lastrowid
    finally:
        conexion.close()


def obtener_partido(partido_id):
    conexion = get_connection()
    try:
        fila = conexion.execute("SELECT * FROM partidos WHERE id = ?", (partido_id,)).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


def listar_partidos(estado=None):
    conexion = get_connection()
    try:
        consulta = "SELECT * FROM partidos"
        parametros = ()
        if estado:
            consulta += " WHERE estado = ?"
            parametros = (estado,)
        consulta += " ORDER BY fecha, hora"
        filas = conexion.execute(consulta, parametros).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()


def actualizar_partido(partido_id, fecha, hora, cancha, cupo_max, costo_cancha, costo_por_jugador, notas=""):
    conexion = get_connection()
    try:
        conexion.execute(
            """
            UPDATE partidos
            SET fecha = ?, hora = ?, cancha = ?, cupo_max = ?, costo_cancha = ?,
                costo_por_jugador = ?, notas = ?
            WHERE id = ?
            """,
            (fecha, hora, cancha.strip(), cupo_max, costo_cancha, costo_por_jugador, notas.strip(), partido_id),
        )
        conexion.commit()
    finally:
        conexion.close()


def cambiar_estado(partido_id, estado):
    conexion = get_connection()
    try:
        conexion.execute("UPDATE partidos SET estado = ? WHERE id = ?", (estado, partido_id))
        conexion.commit()
    finally:
        conexion.close()


def duplicar_partido(partido_id, nueva_fecha, nueva_hora):
    """Repite un partido (misma cancha/cupo/costo) en una fecha/hora nueva."""
    original = obtener_partido(partido_id)
    return crear_partido(
        nueva_fecha,
        nueva_hora,
        original["cancha"],
        original["cupo_max"],
        original["costo_cancha"],
        original["costo_por_jugador"],
        original["notas"] or "",
    )
