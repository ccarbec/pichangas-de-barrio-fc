"""Envío manual del mensaje de aliento/motivación después de una pichanga
jugada. Carlos decide cuándo correr esto (por ejemplo, apenas cierra un
partido como "jugado" en la app) — no es automático como los recordatorios
de scripts/recordatorios_auto.py.

Busca el partido "jugado" más reciente que todavía tenga algún asistente
sin este aviso registrado, y le manda a quienes realmente jugaron
(llegaron o llegaron tarde — no a quien faltó). Se puede correr varias
veces sin miedo a repetir: cada envío se registra en envios_recordatorios.

Correrlo a mano: .venv\\Scripts\\python.exe scripts\\enviar_mensaje_cierre.py
(o el acceso directo "Enviar Mensaje de Cierre" del escritorio)
"""

import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import init_db
from models import envios_recordatorios, inscripciones, partidos, plantillas_mensajes
from whatsapp import client as whatsapp_client


def encontrar_partido_pendiente():
    """El partido 'jugado' más reciente que tenga al menos un asistente sin
    el aviso de cierre registrado todavía."""
    jugados = sorted(
        partidos.listar_partidos(estado="jugado"),
        key=lambda p: (p["fecha"], p["hora"]),
        reverse=True,
    )
    for partido in jugados:
        inscritos = inscripciones.listar_inscripciones_partido(partido["id"])
        asistieron = [i for i in inscritos if i["asistio"] in ("llego", "tardanza")]
        pendientes = [
            j for j in asistieron
            if not envios_recordatorios.ya_enviado(j["telefono"], partido["fecha"], partido["hora"], "cierre_partido")
        ]
        if pendientes:
            return partido, pendientes
    return None, []


def main():
    init_db()
    plantillas_mensajes.asegurar_valores_por_defecto()
    if not whatsapp_client.hay_sesion_vinculada():
        print("WhatsApp no está vinculado en esta PC — corre scripts/vincular_whatsapp.py primero.")
        return

    partido, jugadores = encontrar_partido_pendiente()
    if not partido:
        print("No hay ningún partido jugado con mensaje de cierre pendiente de mandar.")
        return

    variantes = plantillas_mensajes.listar_variantes("cierre_partido")
    if not variantes:
        print("No hay ninguna variante configurada para 'cierre_partido' en Configuración > Mensajes WhatsApp.")
        return

    print(
        f"Partido {partido['fecha']} {partido['hora']} en {partido['cancha']} — "
        f"mandando a {len(jugadores)} jugador(es) que asistieron..."
    )
    destinatarios = []
    for jugador in jugadores:
        texto_plantilla = random.choice(variantes)
        destinatarios.append(
            {
                "telefono": jugador["telefono"],
                "texto": whatsapp_client.armar_mensaje(texto_plantilla, jugador, partido),
                "jugador_nombre": jugador.get("apodo") or jugador["nombre"],
                "partido_fecha": partido["fecha"],
                "partido_hora": partido["hora"],
                "tipo": "cierre_partido",
            }
        )

    resultados = whatsapp_client.enviar_multiples(destinatarios)
    for r in resultados:
        envios_recordatorios.registrar_envio(
            r["jugador_nombre"], r["telefono"], r["partido_fecha"], r["partido_hora"],
            r["tipo"], r["texto"], r["resultado"], r.get("error"),
        )
        print(f"  {r['jugador_nombre']}: {r['resultado']}" + (f" ({r['error']})" if r.get("error") else ""))


if __name__ == "__main__":
    main()
