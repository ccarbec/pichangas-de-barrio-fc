"""Recordatorios manuales por WhatsApp — genera un enlace directo (wa.me)
por jugador con el mensaje ya escrito; el presidente le da clic y lo manda
desde su propio WhatsApp, sin depender de nada más.

El recordatorio 100% automático (cada hora, sin que nadie apriete nada:
recordatorio de partido, aviso de pago y liberación de cupo) corre aparte,
desde automatizaciones_carlos en la PC del club — ver ese panel para el
historial de esos envíos."""

import streamlit as st

from models import inscripciones, partidos
from utils import auth, estilos, mensajes

auth.requerir_admin()
estilos.aplicar_tema()

st.title("📣 Recordatorios")
st.caption(
    "Elige la pichanga y el mensaje — se genera un enlace por jugador que abre WhatsApp "
    "con el texto ya listo. Tú le das enviar, desde donde estés."
)

PLANTILLAS_PARTIDO = {
    "🔥 Con hinchada": (
        "🔥 ¡Hoy se juega, {nombre}! Nos vemos a las {hora} en {cancha}. Trae las ganas — "
        "la pelota no espera a los que llegan tarde ⏱️⚽"
    ),
    "😄 Entre amigos": (
        "{saludo} {nombre}! Recuerda que hoy tenemos pichanga a las {hora} en {cancha}. "
        "Aporte: S/ {costo}. ¡Nos vemos ahí, crack! ⚽😄"
    ),
    "🏆 Espíritu de equipo": (
        "⚽ Once amigos, una pelota, una cancha. Hoy a las {hora} en {cancha} nos vemos para "
        "la pichanga de siempre. ¡No faltes, {nombre}! 🔥"
    ),
    "📋 Directo y simple": (
        "{saludo} {nombre}! Te recordamos la pichanga de este {fecha} a las {hora} en "
        "{cancha}. Aporte: S/ {costo}. ¡Nos vemos en la cancha! ⚽"
    ),
}

PLANTILLAS_PAGO = {
    "😅 Con humor": (
        "{saludo} {nombre} 👋 Antes de que te pite el árbitro… todavía falta tu Yape "
        "(S/ {costo}) para la pichanga del {fecha}. ¡No dejes que se enfríe el cupo! 💸⚽"
    ),
    "🙏 Directo y amable": (
        "{saludo} {nombre}, un recordatorio nomás: falta tu comprobante de pago (S/ {costo}) "
        "para la pichanga del {fecha} a las {hora}. Yapea y sube tu captura para asegurar tu "
        "cupo 🙏⚽"
    ),
}

lista_partidos = partidos.listar_partidos(estado="programado")
if not lista_partidos:
    st.info("No hay pichangas programadas todavía.")
    st.stop()

opciones_partido = {f"{p['fecha']} {p['hora']} — {p['cancha']}": p for p in lista_partidos}
seleccion_partido = st.selectbox("Pichanga", list(opciones_partido.keys()))
partido = opciones_partido[seleccion_partido]

tipo = st.radio(
    "¿Qué quieres mandar?",
    ["Recordatorio del partido", "Recordatorio de pago pendiente"],
    horizontal=True,
)

confirmados = [i for i in inscripciones.listar_inscripciones_partido(partido["id"]) if i["estado"] == "confirmado"]

if tipo == "Recordatorio del partido":
    destinatarios = confirmados
    plantillas = PLANTILLAS_PARTIDO
else:
    destinatarios = [i for i in confirmados if i["estado_pago"] != "verificado"]
    plantillas = PLANTILLAS_PAGO

if not destinatarios:
    st.info("No hay nadie en esta lista para esta pichanga.")
    st.stop()

nombre_plantilla = st.selectbox("Estilo de mensaje", list(plantillas.keys()))
texto_plantilla = st.text_area(
    "Mensaje (puedes editarlo)",
    value=plantillas[nombre_plantilla],
    height=100,
    key=f"texto_{tipo}_{nombre_plantilla}",
)
st.caption("Variables: {nombre}, {fecha}, {hora}, {cancha}, {costo}, {saludo}")

st.markdown(f"##### {len(destinatarios)} jugador(es)")
for i in destinatarios:
    nombre_mostrar = i["apodo"] or i["nombre"]
    jugador = {"nombre": i["nombre"], "apodo": i["apodo"], "telefono": i["telefono"]}
    texto_final = mensajes.armar_mensaje(texto_plantilla, jugador, partido)

    col_nombre, col_pago, col_boton = st.columns([2, 1, 1])
    col_nombre.write(f"{estilos.emoji_posicion(i.get('posicion'))} **{nombre_mostrar}**")
    col_pago.markdown(estilos.badge_pago(i["estado_pago"]), unsafe_allow_html=True)
    col_boton.link_button("📲 Enviar", mensajes.enlace_whatsapp(i["telefono"], texto_final))
    with st.expander("Ver mensaje"):
        st.write(texto_final)
