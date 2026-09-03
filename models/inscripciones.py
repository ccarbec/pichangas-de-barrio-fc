"""Inscripción de jugadores a un partido, con lista de espera automática
cuando se llena el cupo."""

from database.connection import get_connection


def contar_confirmados(partido_id):
    conexion = get_connection()
    try:
        fila = conexion.execute(
            "SELECT COUNT(*) AS n FROM inscripciones WHERE partido_id = ? AND estado = 'confirmado'",
            (partido_id,),
        ).fetchone()
        return fila["n"]
    finally:
        conexion.close()


def obtener_inscripcion(partido_id, jugador_id):
    conexion = get_connection()
    try:
        fila = conexion.execute(
            "SELECT * FROM inscripciones WHERE partido_id = ? AND jugador_id = ?",
            (partido_id, jugador_id),
        ).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


def listar_inscripciones_jugador_multiples(jugador_id, partido_ids):
    """Como obtener_inscripcion, pero para varios partidos a la vez en una
    sola consulta — el jugador ve varias pichangas en la misma pantalla y
    antes se pedía cada una por separado (1 ida y vuelta a Turso c/u)."""
    if not partido_ids:
        return {}
    conexion = get_connection()
    try:
        placeholders = ",".join("?" * len(partido_ids))
        filas = conexion.execute(
            f"SELECT * FROM inscripciones WHERE jugador_id = ? AND partido_id IN ({placeholders})",
            (jugador_id, *partido_ids),
        ).fetchall()
        return {f["partido_id"]: dict(f) for f in filas}
    finally:
        conexion.close()


def contar_confirmados_multiples(partido_ids):
    """Como contar_confirmados, pero para varios partidos en una sola
    consulta — evita 1 ida y vuelta a Turso por cada pichanga en pantalla."""
    if not partido_ids:
        return {}
    conexion = get_connection()
    try:
        placeholders = ",".join("?" * len(partido_ids))
        filas = conexion.execute(
            f"""
            SELECT partido_id, COUNT(*) AS n FROM inscripciones
            WHERE partido_id IN ({placeholders}) AND estado = 'confirmado'
            GROUP BY partido_id
            """,
            tuple(partido_ids),
        ).fetchall()
        conteos = {f["partido_id"]: f["n"] for f in filas}
        return {pid: conteos.get(pid, 0) for pid in partido_ids}
    finally:
        conexion.close()


def obtener_inscripcion_por_id(inscripcion_id):
    conexion = get_connection()
    try:
        fila = conexion.execute(
            "SELECT * FROM inscripciones WHERE id = ?", (inscripcion_id,)
        ).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


_CASO_CUPO = """
    CASE WHEN (SELECT COUNT(*) FROM inscripciones WHERE partido_id = ? AND estado = 'confirmado') < ?
         THEN 'confirmado' ELSE 'lista_espera' END
"""


def inscribir_jugador(partido_id, jugador_id, cupo_max):
    """Confirma al jugador, o lo manda a lista de espera si ya no hay cupo.

    El cupo se cuenta y se escribe en la misma sentencia SQL (no en un
    SELECT aparte seguido de un INSERT/UPDATE) para que dos jugadores
    confirmando al mismo tiempo por el último cupo no puedan colarse los
    dos como 'confirmado'.

    Si ya tenía una inscripción cancelada para este partido, la reactiva en
    vez de crear una fila nueva (evita chocar con el UNIQUE(partido_id,
    jugador_id)).
    """
    existente = obtener_inscripcion(partido_id, jugador_id)
    conexion = get_connection()
    try:
        if existente:
            conexion.execute(
                f"UPDATE inscripciones SET estado = ({_CASO_CUPO}), asistio = NULL WHERE id = ?",
                (partido_id, cupo_max, existente["id"]),
            )
        else:
            conexion.execute(
                f"INSERT INTO inscripciones (partido_id, jugador_id, estado) VALUES (?, ?, ({_CASO_CUPO}))",
                (partido_id, jugador_id, partido_id, cupo_max),
            )
        conexion.commit()
        return obtener_inscripcion(partido_id, jugador_id)["estado"]
    finally:
        conexion.close()


def cancelar_inscripcion(inscripcion_id):
    """Cancela la inscripción y, si tenía cupo confirmado, sube al primero
    de la lista de espera. Devuelve el dict (nombre/apodo/telefono) del
    jugador recién promovido, o None si no había nadie esperando."""
    inscripcion = obtener_inscripcion_por_id(inscripcion_id)
    conexion = get_connection()
    try:
        conexion.execute(
            "UPDATE inscripciones SET estado = 'cancelado' WHERE id = ?", (inscripcion_id,)
        )
        promovido = None
        if inscripcion["estado"] == "confirmado":
            siguiente = conexion.execute(
                """
                SELECT id, jugador_id FROM inscripciones
                WHERE partido_id = ? AND estado = 'lista_espera'
                ORDER BY fecha_inscripcion LIMIT 1
                """,
                (inscripcion["partido_id"],),
            ).fetchone()
            if siguiente:
                conexion.execute(
                    "UPDATE inscripciones SET estado = 'confirmado' WHERE id = ?",
                    (siguiente["id"],),
                )
                fila = conexion.execute(
                    """
                    SELECT usuarios.nombre, usuarios.telefono, jugadores.apodo
                    FROM jugadores JOIN usuarios ON usuarios.id = jugadores.usuario_id
                    WHERE jugadores.id = ?
                    """,
                    (siguiente["jugador_id"],),
                ).fetchone()
                promovido = dict(fila) if fila else None
        conexion.commit()
        return promovido
    finally:
        conexion.close()


def listar_inscripciones_partido(partido_id):
    """Trae inscritos con su nombre/apodo y el estado de su pago (o
    'sin_pago' si todavía no subió comprobante), para el panel del admin."""
    conexion = get_connection()
    try:
        filas = conexion.execute(
            """
            SELECT
                inscripciones.*,
                usuarios.nombre,
                usuarios.telefono,
                jugadores.apodo,
                jugadores.apellidos,
                jugadores.posicion,
                COALESCE(pagos.estado, 'sin_pago') AS estado_pago,
                pagos.id AS pago_id
            FROM inscripciones
            JOIN jugadores ON jugadores.id = inscripciones.jugador_id
            JOIN usuarios ON usuarios.id = jugadores.usuario_id
            LEFT JOIN pagos ON pagos.inscripcion_id = inscripciones.id
            WHERE inscripciones.partido_id = ? AND inscripciones.estado != 'cancelado'
            ORDER BY
                CASE inscripciones.estado WHEN 'confirmado' THEN 0 ELSE 1 END,
                jugadores.apellidos, usuarios.nombre
            """,
            (partido_id,),
        ).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()


def reemplazar(inscripcion_no_llego_id, jugador_reemplazo_id):
    """Confirma a jugador_reemplazo_id en el mismo partido que
    inscripcion_no_llego_id — sin tocar la inscripción original (se queda
    con su marca de no-asistencia para el reporte y la multa) ni contar
    contra el cupo, porque es un reemplazo puntual del día del partido, no
    una inscripción nueva de cero."""
    original = obtener_inscripcion_por_id(inscripcion_no_llego_id)
    conexion = get_connection()
    try:
        existente = conexion.execute(
            "SELECT id FROM inscripciones WHERE partido_id = ? AND jugador_id = ?",
            (original["partido_id"], jugador_reemplazo_id),
        ).fetchone()
        if existente:
            conexion.execute(
                "UPDATE inscripciones SET estado = 'confirmado', asistio = NULL WHERE id = ?",
                (existente["id"],),
            )
        else:
            conexion.execute(
                "INSERT INTO inscripciones (partido_id, jugador_id, estado) VALUES (?, ?, 'confirmado')",
                (original["partido_id"], jugador_reemplazo_id),
            )
        conexion.commit()
    finally:
        conexion.close()


def marcar_asistencia(inscripcion_id, estado):
    """estado: 'llego' / 'tardanza' / 'no_llego' (o None para "sin marcar").
    Tardanza y no_llego generan multa aparte — ver pages/1_Partidos.py."""
    conexion = get_connection()
    try:
        conexion.execute(
            "UPDATE inscripciones SET asistio = ? WHERE id = ?", (estado, inscripcion_id)
        )
        conexion.commit()
    finally:
        conexion.close()
