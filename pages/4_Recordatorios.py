"""Recordatorios automáticos por WhatsApp: historial, y un botón para
forzar la revisión ahora mismo.

El envío real SOLO puede correr en la computadora del club — WhatsApp no
permite mandar mensajes automáticos desde un sitio en la nube. Por eso el
botón "Enviar ahora" solo aparece activo cuando esta página se abre
corriendo localmente, en la PC donde ya está vinculado el WhatsApp (ver
scripts/vincular_whatsapp.py). Si la abres desde el link público
(Streamlit Cloud), solo vas a poder ver el historial — la tarea
programada (scripts/recordatorios_auto.py, cada hora) sigue mandando los
recordatorios igual sin que hagas nada."""

import pandas as pd
import streamlit as st

from models import envios_recordatorios
from utils import auth, estilos
from whatsapp import client as whatsapp_client

auth.requerir_admin()
estilos.aplicar_tema()

st.title("📣 Recordatorios")
st.caption(
    "Reglas: recordatorio de partido la mañana del mismo día, aviso de pago entre 6 y 24 "
    "horas antes, y liberación del cupo si no hay pago 6 horas antes del partido. Corre "
    "solo cada hora — este botón sirve para forzar la revisión antes de esa hora."
)

if whatsapp_client.hay_sesion_vinculada():
    if st.button("🚀 Revisar y enviar ahora", type="primary"):
        from scripts.recordatorios_auto import construir_pendientes, enviar_pendientes

        with st.spinner("Revisando partidos y mandando lo que corresponda — no cierres esta pestaña..."):
            pendientes = construir_pendientes()
            if not pendientes:
                st.info("No había nada que enviar en este momento.")
            else:
                enviar_pendientes(pendientes)
                st.success(f"Listo: se procesaron {len(pendientes)} mensaje(s). Revisa el resultado abajo.")
        st.rerun()
else:
    st.info(
        "El botón de enviar solo aparece cuando abres esta página corriendo en la PC del "
        "club con WhatsApp ya vinculado (`scripts/vincular_whatsapp.py`). Desde el link "
        "público solo puedes ver el historial — la tarea programada cada hora sigue "
        "funcionando igual, sin que nadie tenga que abrir nada."
    )

st.divider()

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
