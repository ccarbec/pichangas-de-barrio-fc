"""Utilidad de una sola vez: muestra, sin mandar nada, cómo se vería el
mensaje de recordatorio para el partido de mañana, con cada variante
configurada actualmente en Configuración > Mensajes WhatsApp."""

import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import inscripciones, partidos, plantillas_mensajes
from whatsapp import client as whatsapp_client

manana = (datetime.now() + timedelta(days=1)).date().isoformat()
partido = next((p for p in partidos.listar_partidos(estado="programado") if p["fecha"] == manana), None)

if not partido:
    print(f"No hay ningún partido programado para mañana ({manana}).")
else:
    inscritos = inscripciones.listar_inscripciones_partido(partido["id"])
    confirmados = [i for i in inscritos if i["estado"] == "confirmado"]
    jugador_ejemplo = confirmados[0]

    variantes = plantillas_mensajes.listar_variantes("recordatorio")
    print(f"Partido: {partido['fecha']} {partido['hora']} en {partido['cancha']}")
    print(f"Se mandaría a los {len(confirmados)} jugadores confirmados. Ejemplo con: {jugador_ejemplo.get('apodo') or jugador_ejemplo['nombre']}\n")
    for idx, texto_plantilla in enumerate(variantes, start=1):
        mensaje = whatsapp_client.armar_mensaje(texto_plantilla, jugador_ejemplo, partido)
        print(f"--- Variante {idx} ---")
        print(mensaje)
        print()
