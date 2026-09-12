"""Variantes de texto para los mensajes de WhatsApp, configurables desde la
app web (Configuración > Mensajes WhatsApp). scripts/recordatorios_auto.py
usa listar_variantes() para elegir un texto al azar por tipo de mensaje."""

from database.connection import get_connection

# Mismos textos que traía scripts/recordatorios_auto.py antes de que fueran
# configurables — se usan solo la primera vez, para poblar un tipo que
# todavía no tiene ninguna variante guardada (nunca pisan lo que Carlos ya
# haya editado desde la app web).
VARIANTES_POR_DEFECTO = {
    "recordatorio": [
        "🔥 ¡Hoy se juega, {nombre}! Nos vemos a las {hora} en {cancha}. Trae las ganas — "
        "la pelota no espera a los que llegan tarde ⏱️⚽",
        "{saludo} {nombre}! Recuerda que hoy tenemos pichanga a las {hora} en {cancha}. "
        "Aporte: S/ {costo}. ¡Nos vemos ahí, crack! ⚽😄",
        "⚽ Once amigos, una pelota, una cancha. Hoy a las {hora} en {cancha} nos vemos "
        "para la pichanga de siempre. ¡No faltes, {nombre}! 🔥",
    ],
    "pago_pendiente": [
        "{saludo} {nombre} 👋 Antes de que te pite el árbitro… todavía falta tu Yape "
        "(S/ {costo}) para la pichanga del {fecha} a las {hora}. Si no llega, tu cupo se "
        "libera automáticamente 6 horas antes del partido. ¡No dejes que se enfríe! 💸⚽",
        "{saludo} {nombre}, un recordatorio nomás: falta tu comprobante de pago "
        "(S/ {costo}) para la pichanga del {fecha} a las {hora}. Yapea y sube tu captura "
        "para asegurar tu cupo 🙏⚽",
    ],
    "cupo_liberado": [
        "🟥 {nombre}, tarjeta roja para tu cupo esta vez — se liberó porque no llegó el "
        "pago a tiempo para la pichanga del {fecha} a las {hora} en {cancha}. Sin rencores, "
        "revisa la app por si todavía hay sitio 👀⚽",
        "⏱️ Se acabó el tiempo, {nombre} — tu cupo para la pichanga del {fecha} a las "
        "{hora} quedó libre por falta de pago. Revisa la app, capaz todavía alcanzas 👟",
    ],
    "promovido": [
        "🟢 ¡Entras a jugar, {nombre}! Se liberó un cupo y quedaste CONFIRMADO para la "
        "pichanga del {fecha} a las {hora} en {cancha}. Aporte: S/ {costo} — yapea pronto "
        "para no perder tu titularidad 🔥⚽",
        "🎉 Buenas noticias, {nombre}: se liberó un cupo y ahora estás CONFIRMADO para el "
        "{fecha} a las {hora} en {cancha}. Aporte: S/ {costo} — ¡nos vemos en la cancha! ⚽",
    ],
    "cierre_partido": [
        "🔥 ¡Qué pichanga la de hoy, {nombre}! Gracias por venir y darlo todo en la cancha. "
        "¡Nos vemos en la próxima! ⚽💪",
        "👏 Excelente nivel el de hoy, {nombre}. Se sintió el equipo. ¡A seguir así para la "
        "próxima pichanga! ⚽🔥",
        "⚽ Gracias por jugar hoy, {nombre} — esas jugadas se disfrutan. ¡Nos vemos pronto "
        "para la revancha! 💪😄",
    ],
    "multa_pendiente": [
        "{saludo} {nombre} 👋 Tienes una multa pendiente de S/ {monto}. Cuando puedas, "
        "súbela en la app para ponerte al día 🙏⚽",
        "{saludo} {nombre}, un recordatorio nomás: te queda una multa de S/ {monto} sin "
        "pagar. Yapea y sube tu comprobante cuando puedas 💸",
    ],
}


def listar_variantes(tipo):
    conexion = get_connection()
    try:
        filas = conexion.execute(
            "SELECT texto FROM plantillas_mensajes WHERE tipo = ? ORDER BY id", (tipo,)
        ).fetchall()
        return [f["texto"] for f in filas]
    finally:
        conexion.close()


def asegurar_valores_por_defecto():
    """Si algún tipo de mensaje todavía no tiene ninguna variante guardada
    (ej. la primera vez que corre esto tras agregar la tabla), lo llena con
    los textos que traía el script antes de ser configurable. No toca tipos
    que ya tengan aunque sea una variante — nunca pisa lo que Carlos edite
    desde Configuración > Mensajes WhatsApp."""
    conexion = get_connection()
    try:
        for tipo, variantes in VARIANTES_POR_DEFECTO.items():
            fila = conexion.execute(
                "SELECT 1 FROM plantillas_mensajes WHERE tipo = ? LIMIT 1", (tipo,)
            ).fetchone()
            if fila is not None:
                continue
            for texto in variantes:
                conexion.execute(
                    "INSERT INTO plantillas_mensajes (tipo, texto) VALUES (?, ?)", (tipo, texto)
                )
        conexion.commit()
    finally:
        conexion.close()
