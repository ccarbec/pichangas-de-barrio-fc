"""Utilidad de una sola vez: muestra el partido programado para mañana (si
existe) y quién está confirmado, para revisar antes de mandar un
recordatorio de prueba manual."""

import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import inscripciones, partidos

manana = (datetime.now() + timedelta(days=1)).date().isoformat()
encontrados = [p for p in partidos.listar_partidos(estado="programado") if p["fecha"] == manana]

if not encontrados:
    print(f"No hay ningún partido programado para mañana ({manana}).")
else:
    for p in encontrados:
        print(f"Partido {p['id']}: {p['fecha']} {p['hora']} en {p['cancha']} — cupo {p['cupoMax'] if 'cupoMax' in p else p.get('cupo_max')}")
        inscritos = inscripciones.listar_inscripciones_partido(p["id"])
        confirmados = [i for i in inscritos if i["estado"] == "confirmado"]
        for i in confirmados:
            print(f"  - {i.get('apodo') or i['nombre']} ({i['telefono']}) estado_pago={i['estado_pago']}")
