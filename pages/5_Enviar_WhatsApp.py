"""Envío manual de WhatsApp con mensajes personalizados — se manda cuando
tú aprietes el botón, sin depender de horas ni reglas automáticas (eso
vive en Recordatorios).

Corre SOLO localmente: necesita WhatsApp vinculado en esta PC
(scripts/vincular_whatsapp.py). Desde el link público de la app no se
puede enviar — restricción de WhatsApp, no de la app."""

import streamlit as st

from models import envios_recordatorios, inscripciones, partidos
from utils import auth, estilos
from whatsapp import client as whatsapp_client

auth.requerir_admin()
estilos.aplicar_tema()

st.title("📨 Enviar WhatsApp")

if not whatsapp_client.hay_sesion_vinculada():
    st.info(
        "Esta página solo funciona corriendo localmente, en la PC del club, con WhatsApp "
        "ya vinculado (`scripts/vincular_whatsapp.py`). Desde el link público no se puede "
        "enviar — es una restricción de WhatsApp, no de la app."
    )
    st.stop()

PLANTILLAS_PARTIDO = {
    "🔥 Con hinchada": (
        "🔥 ¡Hoy se juega, {nombre}! Nos vemos a las {hora} en {cancha}. Trae las ganas — "
        "la pelota no espera a los que llegan tarde ⏱️⚽"
    ),
    "😄 Entre amigos": (
        "{saludo} {nombre}! Recuerda que tenemos pichanga el {fecha} a las {hora} en "
        "{cancha}. Aporte: S/ {costo}. ¡Nos vemos ahí, crack! ⚽😄"
    ),
    "🏆 Espíritu de equipo": (
        "⚽ Once amigos, una pelota, una cancha. El {fecha} a las {hora} en {cancha} nos "
        "vemos para la pichanga de siempre. ¡No faltes, {nombre}! 🔥"
    ),
    "📋 Directo y simple": (
        "{saludo} {nombre}! Te recordamos la pichanga del {fecha} a las {hora} en "
        "{cancha}. Aporte: S/ {costo}. ¡Nos vemos en la cancha! ⚽"
    ),
}
PLANTILLAS_PAGO = {
    "😅 Con humor": (
        "{saludo} {nombre} 👋 Antes de que te pite el árbitro… todavía falta tu Yape "
        "(S/ {costo}) para la pichanga del {fecha}. ¡No dejes que se enfríe el cupo! 💸⚽"
    ),
    "🙏 Directo y amable": (
        "{saludo} {nombre}, un recordatorio nomás: falta tu comprobante de pago "
        "(S/ {costo}) para la pichanga del {fecha} a las {hora}. Yapea y sube tu captura "
        "para asegurar tu cupo 🙏⚽"
    ),
}
PLANTILLA_LIBRE = "✍️ Mensaje libre (en blanco)"

lista_partidos = partidos.listar_partidos(estado="programado")
if not lista_partidos:
    st.info("No hay pichangas programadas todavía.")
    st.stop()

opciones_partido = {f"{p['fecha']} {p['hora']} — {p['cancha']}": p for p in lista_partidos}
seleccion_partido = st.selectbox("Pichanga", list(opciones_partido.keys()))
partido = opciones_partido[seleccion_partido]

confirmados = [
    i for i in inscripciones.listar_inscripciones_partido(partido["id"]) if i["estado"] == "confirmado"
]

publico = st.radio(
    "¿A quién?",
    ["Todos los confirmados", "Solo pendientes de pago", "Elegir jugadores puntuales"],
    horizontal=True,
)

if publico == "Solo pendientes de pago":
    candidatos = [i for i in confirmados if i["estado_pago"] != "verificado"]
    plantillas = {**PLANTILLAS_PAGO, **PLANTILLAS_PARTIDO, PLANTILLA_LIBRE: ""}
else:
    candidatos = confirmados
    plantillas = {**PLANTILLAS_PARTIDO, **PLANTILLAS_PAGO, PLANTILLA_LIBRE: ""}

if not candidatos:
    st.info("No hay nadie en esta lista para esta pichanga.")
    st.stop()

if publico == "Elegir jugadores puntuales":
    opciones_jugador = {f"{i['apodo'] or i['nombre']} ({i['telefono']})": i for i in candidatos}
    seleccionados = st.multiselect("Jugadores", list(opciones_jugador.keys()))
    destinatarios_base = [opciones_jugador[etiqueta] for etiqueta in seleccionados]
else:
    destinatarios_base = candidatos
    st.caption(f"Se manda a los {len(candidatos)} jugador(es) de esta lista.")

nombre_plantilla = st.selectbox("Estilo de mensaje", list(plantillas.keys()))
texto_plantilla = st.text_area(
    "Mensaje (puedes editarlo)",
    value=plantillas[nombre_plantilla],
    height=100,
    key=f"texto_{publico}_{nombre_plantilla}",
)
st.caption("Variables: {nombre}, {fecha}, {hora}, {cancha}, {costo}, {saludo}")

if not destinatarios_base:
    st.caption("Elige al menos un jugador para ver la vista previa y poder enviar.")
    st.stop()

st.markdown(f"##### Vista previa — {len(destinatarios_base)} jugador(es)")
for i in destinatarios_base:
    jugador = {"nombre": i["nombre"], "apodo": i["apodo"], "telefono": i["telefono"]}
    texto_final = whatsapp_client.armar_mensaje(texto_plantilla, jugador, partido)
    with st.expander(f"{estilos.emoji_posicion(i.get('posicion'))} {i['apodo'] or i['nombre']}"):
        st.write(texto_final)

if st.button(f"📨 Enviar a {len(destinatarios_base)} jugador(es)", type="primary"):
    destinatarios = [
        {
            "telefono": i["telefono"],
            "texto": whatsapp_client.armar_mensaje(
                texto_plantilla, {"nombre": i["nombre"], "apodo": i["apodo"], "telefono": i["telefono"]}, partido
            ),
            "jugador_nombre": i["apodo"] or i["nombre"],
        }
        for i in destinatarios_base
    ]

    estado_placeholder = st.empty()
    barra = st.progress(0.0)

    def _mostrar_progreso(indice, total, destinatario, resultado):
        icono = "✅ enviado" if resultado["resultado"] == "enviado" else "❌ falló"
        estado_placeholder.write(f"({indice}/{total}) {destinatario['jugador_nombre']}: {icono}")
        barra.progress(indice / total)

    with st.spinner("Se está abriendo Chrome y mandando los mensajes — no lo cierres mientras tanto..."):
        try:
            resultados = whatsapp_client.enviar_multiples(destinatarios, callback_progreso=_mostrar_progreso)
        except Exception as error:
            st.error(f"No se pudo completar el envío: {error}")
            resultados = []

    for r in resultados:
        envios_recordatorios.registrar_envio(
            r["jugador_nombre"], r["telefono"], partido["fecha"], partido["hora"],
            "manual", r["texto"], r["resultado"], r.get("error"),
        )

    if resultados:
        enviados = sum(1 for r in resultados if r["resultado"] == "enviado")
        fallidos = sum(1 for r in resultados if r["resultado"] == "fallo")
        if fallidos:
            st.warning(f"Listo: {enviados} enviado(s), {fallidos} fallaron.")
        else:
            st.success(f"Listo: {enviados} mensaje(s) enviado(s) correctamente.")
