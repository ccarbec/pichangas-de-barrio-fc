"""Envío manual, de una sola vez, del recordatorio del partido de mañana a
las 6am — el envío automático (ventana 8-10am el mismo día) llegaría
después de que el partido ya empezó, así que Carlos pidió mandarlo esta
noche en su lugar. Usa las mismas 3 variantes configuradas en
Configuración > Mensajes WhatsApp, pero con "hoy" cambiado a "mañana" solo
para este envío puntual — sin tocar las plantillas guardadas."""

import os
import random
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import envios_recordatorios, inscripciones, partidos, plantillas_mensajes
from whatsapp import client as whatsapp_client

manana = (datetime.now() + timedelta(days=1)).date().isoformat()
partido = next((p for p in partidos.listar_partidos(estado="programado") if p["fecha"] == manana), None)
if not partido:
    print(f"No hay ningún partido programado para mañana ({manana}).")
    sys.exit(1)

variantes = [
    v.replace("Hoy", "Mañana").replace("hoy", "mañana")
    for v in plantillas_mensajes.listar_variantes("recordatorio")
]
if not variantes:
    print("No hay ninguna variante configurada para 'recordatorio'.")
    sys.exit(1)

inscritos = inscripciones.listar_inscripciones_partido(partido["id"])
confirmados = [i for i in inscritos if i["estado"] == "confirmado"]

destinatarios = []
for jugador in confirmados:
    if envios_recordatorios.ya_enviado(jugador["telefono"], partido["fecha"], partido["hora"], "recordatorio"):
        print(f"  (ya tenía un recordatorio registrado, se salta) {jugador.get('apodo') or jugador['nombre']}")
        continue
    texto_plantilla = random.choice(variantes)
    destinatarios.append(
        {
            "telefono": jugador["telefono"],
            "texto": whatsapp_client.armar_mensaje(texto_plantilla, jugador, partido),
            "jugador_nombre": jugador.get("apodo") or jugador["nombre"],
            "partido_fecha": partido["fecha"],
            "partido_hora": partido["hora"],
            "tipo": "recordatorio",
        }
    )

print(f"Mandando a {len(destinatarios)} jugador(es) confirmado(s)...")
resultados = whatsapp_client.enviar_multiples(destinatarios)
for r in resultados:
    envios_recordatorios.registrar_envio(
        r["jugador_nombre"], r["telefono"], r["partido_fecha"], r["partido_hora"],
        r["tipo"], r["texto"], r["resultado"], r.get("error"),
    )
    print(f"  {r['jugador_nombre']}: {r['resultado']}" + (f" ({r['error']})" if r.get("error") else ""))
