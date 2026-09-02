"""
Revisión automática de Pichangas de Barrio FC — pensado para correr como
tarea programada de Windows cada hora en la PC del club (ver
scripts/instalar_tarea.ps1), sin que nadie tenga que apretar nada.

Esto es un script LOCAL, separado de la app web (Streamlit Cloud): la app
web no puede controlar WhatsApp (no tiene navegador ni pantalla), así que
el envío real siempre corre acá, en una computadora de verdad, usando la
MISMA base de datos (Turso) que la app — por eso usa los mismos models/
que las páginas de Streamlit.

Reglas:
  1. Recordatorio de partido: una vez, la mañana del mismo día (8-10am),
     a todos los confirmados.
  2. Recordatorio de pago: una vez, cuando falten entre 6 y 24 horas para
     el partido, a quien todavía no tenga el pago verificado.
  3. Límite de pago: si a alguien le quedan 6 horas o menos para el
     partido y sigue sin pago verificado, se le libera el cupo (se
     cancela su inscripción) y, si había alguien en lista de espera, se
     le sube a confirmado y se le avisa.

Cada acción se registra en envios_recordatorios para no repetirla — por
eso este script se puede correr cada hora sin miedo a mandar el mismo
mensaje dos veces. Si no hay nada que enviar, no abre Chrome.

Correrlo a mano: .venv\\Scripts\\python.exe scripts\\recordatorios_auto.py
"""

import os
import random
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import init_db
from models import envios_recordatorios, inscripciones, partidos
from whatsapp import client as whatsapp_client

VENTANA_RECORDATORIO_PARTIDO = (8, 10)  # hora local, [inicio, fin)
HORAS_RECORDATORIO_PAGO = 24
HORAS_LIMITE_PAGO = 6

# Varias variantes por tipo de mensaje — se elige una al azar cada vez, para
# que no le llegue el mismo texto siempre a todo el mundo.
TEXTOS_RECORDATORIO_PARTIDO = [
    "🔥 ¡Hoy se juega, {nombre}! Nos vemos a las {hora} en {cancha}. Trae las ganas — "
    "la pelota no espera a los que llegan tarde ⏱️⚽",
    "{saludo} {nombre}! Recuerda que hoy tenemos pichanga a las {hora} en {cancha}. "
    "Aporte: S/ {costo}. ¡Nos vemos ahí, crack! ⚽😄",
    "⚽ Once amigos, una pelota, una cancha. Hoy a las {hora} en {cancha} nos vemos "
    "para la pichanga de siempre. ¡No faltes, {nombre}! 🔥",
]
TEXTOS_RECORDATORIO_PAGO = [
    "{saludo} {nombre} 👋 Antes de que te pite el árbitro… todavía falta tu Yape "
    "(S/ {costo}) para la pichanga del {fecha} a las {hora}. Si no llega, tu cupo se "
    "libera automáticamente 6 horas antes del partido. ¡No dejes que se enfríe! 💸⚽",
    "{saludo} {nombre}, un recordatorio nomás: falta tu comprobante de pago "
    "(S/ {costo}) para la pichanga del {fecha} a las {hora}. Yapea y sube tu captura "
    "para asegurar tu cupo 🙏⚽",
]
TEXTOS_CUPO_LIBERADO = [
    "🟥 {nombre}, tarjeta roja para tu cupo esta vez — se liberó porque no llegó el "
    "pago a tiempo para la pichanga del {fecha} a las {hora} en {cancha}. Sin rencores, "
    "revisa la app por si todavía hay sitio 👀⚽",
    "⏱️ Se acabó el tiempo, {nombre} — tu cupo para la pichanga del {fecha} a las "
    "{hora} quedó libre por falta de pago. Revisa la app, capaz todavía alcanzas 👟",
]
TEXTOS_PROMOVIDO = [
    "🟢 ¡Entras a jugar, {nombre}! Se liberó un cupo y quedaste CONFIRMADO para la "
    "pichanga del {fecha} a las {hora} en {cancha}. Aporte: S/ {costo} — yapea pronto "
    "para no perder tu titularidad 🔥⚽",
    "🎉 Buenas noticias, {nombre}: se liberó un cupo y ahora estás CONFIRMADO para el "
    "{fecha} a las {hora} en {cancha}. Aporte: S/ {costo} — ¡nos vemos en la cancha! ⚽",
]


def _horas_hasta(partido):
    fecha_hora = datetime.strptime(f"{partido['fecha']} {partido['hora']}", "%Y-%m-%d %H:%M")
    return (fecha_hora - datetime.now()).total_seconds() / 3600


def _agregar_pendiente(pendientes, jugador, partido, tipo, variantes_texto):
    texto_plantilla = random.choice(variantes_texto)
    pendientes.append(
        {
            "telefono": jugador["telefono"],
            "texto": whatsapp_client.armar_mensaje(texto_plantilla, jugador, partido),
            "jugador_nombre": jugador.get("apodo") or jugador["nombre"],
            "partido_fecha": partido["fecha"],
            "partido_hora": partido["hora"],
            "tipo": tipo,
        }
    )


def construir_pendientes():
    """Decide qué se debe mandar ahora mismo, sin tocar WhatsApp todavía.
    Las liberaciones de cupo (que sí cambian datos) se ejecutan de una vez
    acá, porque son una regla de negocio con hora límite — no dependen de
    que el WhatsApp se pueda mandar o no."""
    ahora = datetime.now()
    pendientes = []

    for partido in partidos.listar_partidos(estado="programado"):
        horas_restantes = _horas_hasta(partido)
        if horas_restantes < -1:  # ya pasó hace rato, ignorar
            continue

        inscritos = inscripciones.listar_inscripciones_partido(partido["id"])
        confirmados = [i for i in inscritos if i["estado"] == "confirmado"]
        pendientes_pago = [i for i in confirmados if i["estado_pago"] != "verificado"]

        if (
            partido["fecha"] == ahora.date().isoformat()
            and VENTANA_RECORDATORIO_PARTIDO[0] <= ahora.hour < VENTANA_RECORDATORIO_PARTIDO[1]
        ):
            for jugador in confirmados:
                if envios_recordatorios.ya_enviado(jugador["telefono"], partido["fecha"], partido["hora"], "recordatorio"):
                    continue
                _agregar_pendiente(pendientes, jugador, partido, "recordatorio", TEXTOS_RECORDATORIO_PARTIDO)

        if HORAS_LIMITE_PAGO < horas_restantes <= HORAS_RECORDATORIO_PAGO:
            for jugador in pendientes_pago:
                if envios_recordatorios.ya_enviado(jugador["telefono"], partido["fecha"], partido["hora"], "pago_pendiente"):
                    continue
                _agregar_pendiente(pendientes, jugador, partido, "pago_pendiente", TEXTOS_RECORDATORIO_PAGO)

        if 0 <= horas_restantes <= HORAS_LIMITE_PAGO:
            for jugador in pendientes_pago:
                if envios_recordatorios.ya_enviado(jugador["telefono"], partido["fecha"], partido["hora"], "cupo_liberado"):
                    continue
                promovido = inscripciones.cancelar_inscripcion(jugador["id"])
                _agregar_pendiente(pendientes, jugador, partido, "cupo_liberado", TEXTOS_CUPO_LIBERADO)
                if promovido:
                    _agregar_pendiente(pendientes, promovido, partido, "promovido", TEXTOS_PROMOVIDO)

    return pendientes


def enviar_pendientes(pendientes):
    if not pendientes:
        print("Nada que enviar por ahora.")
        return

    print(f"Enviando {len(pendientes)} mensaje(s)...")
    resultados = whatsapp_client.enviar_multiples(pendientes)
    for r in resultados:
        envios_recordatorios.registrar_envio(
            r["jugador_nombre"], r["telefono"], r["partido_fecha"], r["partido_hora"],
            r["tipo"], r["texto"], r["resultado"], r.get("error"),
        )
        print(f"  {r['jugador_nombre']} ({r['tipo']}): {r['resultado']}")


def main():
    init_db()
    if not whatsapp_client.hay_sesion_vinculada():
        print("WhatsApp no está vinculado en esta PC — corre scripts/vincular_whatsapp.py primero.")
        return

    pendientes = construir_pendientes()
    enviar_pendientes(pendientes)


if __name__ == "__main__":
    main()
