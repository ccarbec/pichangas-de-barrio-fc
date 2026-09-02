"""Historial de los recordatorios automáticos por WhatsApp.

El envío en sí NO corre acá — WhatsApp no deja mandar mensajes
automáticos desde un sitio en la nube, así que la revisión (cada hora) y
el envío real corren como una tarea programada en la computadora del
club (scripts/recordatorios_auto.py). Esta página solo lee el resultado:
qué se mandó, a quién y si funcionó."""

import pandas as pd
import streamlit as st

from models import envios_recordatorios
from utils import auth, estilos

auth.requerir_admin()
estilos.aplicar_tema()

st.title("📣 Recordatorios")
st.info(
    "El envío automático corre cada hora en la computadora del club (no en esta app web) — "
    "WhatsApp no permite mandar mensajes automáticos desde un sitio en la nube. Reglas: "
    "recordatorio de partido la mañana del mismo día, aviso de pago entre 6 y 24 horas "
    "antes, y liberación del cupo si no hay pago 6 horas antes del partido."
)

TIPOS_LEGIBLES = {
    "recordatorio": "Recordatorio de partido",
    "pago_pendiente": "Recordatorio de pago",
    "cupo_liberado": "Cupo liberado (no pagó)",
    "promovido": "Promovido de lista de espera",
}

recientes = envios_recordatorios.listar_envios_recientes(limite=100)

if not recientes:
    st.caption("Todavía no se ha mandado ningún recordatorio.")
else:
    col1, col2 = st.columns(2)
    col1.metric("Mensajes recientes", len(recientes))
    fallidos = sum(1 for e in recientes if e["resultado"] != "enviado")
    col2.metric("Fallidos", fallidos)

    st.dataframe(
        pd.DataFrame(
            [
                {
                    "Fecha/hora": e["fecha_hora"],
                    "Jugador": e["jugador_nombre"],
                    "Partido": f"{e['partido_fecha']} {e['partido_hora']}",
                    "Tipo": TIPOS_LEGIBLES.get(e["tipo"], e["tipo"]),
                    "Resultado": e["resultado"].capitalize(),
                    "Error": e["detalle_error"] or "",
                }
                for e in recientes
            ]
        ),
        hide_index=True,
        use_container_width=True,
    )
