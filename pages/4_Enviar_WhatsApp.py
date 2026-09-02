"""Envío manual de WhatsApp con mensajes personalizados — se manda cuando
tú aprietes el botón, sin depender de horas ni reglas automáticas.

Eliges si es recordatorio del partido o de pago pendiente, marcas a quién
mandarle viendo su estado de pago al costado (el estado en sí se verifica
en la página Pagos — acá solo se muestra para decidir a quién escribirle),
y decides si mandas a uno solo o a todos los marcados de una vez.

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


def _armar(jugador, partido, texto_plantilla):
    return whatsapp_client.armar_mensaje(
        texto_plantilla, {"nombre": jugador["nombre"], "apodo": jugador["apodo"], "telefono": jugador["telefono"]}, partido
    )


def _enviar_y_registrar(destinatarios, partido):
    """destinatarios: lista de dicts con 'telefono'/'texto'/'jugador_nombre'."""
    estado_placeholder = st.empty()
    barra = st.progress(0.0)

    def _mostrar_progreso(indice, total, destinatario, resultado):
        icono = "✅ enviado" if resultado["resultado"] == "enviado" else "❌ falló"
        estado_placeholder.write(f"({indice}/{total}) {destinatario['jugador_nombre']}: {icono}")
        barra.progress(indice / total)

    with st.spinner("Se está abriendo Chrome y mandando — no lo cierres mientras tanto..."):
        try:
            resultados = whatsapp_client.enviar_multiples(destinatarios, callback_progreso=_mostrar_progreso)
        except Exception as error:
            st.error(f"No se pudo completar el envío: {error}")
            return

    for r in resultados:
        envios_recordatorios.registrar_envio(
            r["jugador_nombre"], r["telefono"], partido["fecha"], partido["hora"],
            "manual", r["texto"], r["resultado"], r.get("error"),
        )

    enviados = sum(1 for r in resultados if r["resultado"] == "enviado")
    fallidos = sum(1 for r in resultados if r["resultado"] == "fallo")
    if fallidos:
        st.warning(f"Listo: {enviados} enviado(s), {fallidos} fallaron.")
    else:
        st.success(f"Listo: {enviados} mensaje(s) enviado(s) correctamente.")


lista_partidos = partidos.listar_partidos(estado="programado")
if not lista_partidos:
    st.info("No hay pichangas programadas todavía.")
    st.stop()

opciones_partido = {f"{p['fecha']} {p['hora']} — {p['cancha']}": p for p in lista_partidos}
seleccion_partido = st.selectbox("Pichanga", list(opciones_partido.keys()))
partido = opciones_partido[seleccion_partido]

todos_confirmados = [
    i for i in inscripciones.listar_inscripciones_partido(partido["id"]) if i["estado"] == "confirmado"
]

if not todos_confirmados:
    st.info("Todavía nadie ha confirmado para esta pichanga.")
    st.stop()

pagados = sum(1 for i in todos_confirmados if i["estado_pago"] == "verificado")
col1, col2 = st.columns(2)
col1.metric("Confirmados", len(todos_confirmados))
col2.metric("Con pago verificado", f"{pagados}/{len(todos_confirmados)}")

tipo_mensaje = st.radio(
    "¿Qué quieres mandar?",
    ["📅 Recordatorio de partido", "💸 Pendiente de pago"],
    horizontal=True,
)

if tipo_mensaje == "💸 Pendiente de pago":
    confirmados = [i for i in todos_confirmados if i["estado_pago"] != "verificado"]
    plantillas = {**PLANTILLAS_PAGO, PLANTILLA_LIBRE: ""}
else:
    confirmados = todos_confirmados
    plantillas = {**PLANTILLAS_PARTIDO, PLANTILLA_LIBRE: ""}

if not confirmados:
    st.info("No hay nadie en esta lista (¿ya todos pagaron?).")
    st.stop()

nombre_plantilla = st.selectbox("Estilo de mensaje", list(plantillas.keys()))
texto_plantilla = st.text_area(
    "Mensaje (puedes editarlo)",
    value=plantillas[nombre_plantilla],
    height=100,
    key=f"texto_{partido['id']}_{tipo_mensaje}_{nombre_plantilla}",
)
st.caption("Variables: {nombre}, {fecha}, {hora}, {cancha}, {costo}, {saludo}")

st.markdown("##### ¿A quién le mandas?")
col_todos, col_ninguno = st.columns(2)
if col_todos.button("☑️ Marcar todos"):
    for i in confirmados:
        st.session_state[f"chk_{tipo_mensaje}_{i['id']}"] = True
    st.rerun()
if col_ninguno.button("⬜ Desmarcar todos"):
    for i in confirmados:
        st.session_state[f"chk_{tipo_mensaje}_{i['id']}"] = False
    st.rerun()

seleccionados = []
for i in confirmados:
    clave_check = f"chk_{tipo_mensaje}_{i['id']}"
    col_check, col_nombre, col_pago, col_uno = st.columns([0.6, 2.4, 1.3, 1])

    marcado = col_check.checkbox(
        "Enviar", key=clave_check, value=st.session_state.get(clave_check, True), label_visibility="collapsed"
    )
    col_nombre.write(f"{estilos.emoji_posicion(i.get('posicion'))} **{estilos.nombre_completo(i)}**")
    col_pago.markdown(estilos.badge_pago(i["estado_pago"]), unsafe_allow_html=True)

    if col_uno.button("📨 Uno", key=f"uno_{i['id']}"):
        destinatario = {
            "telefono": i["telefono"],
            "texto": _armar(i, partido, texto_plantilla),
            "jugador_nombre": i["apodo"] or i["nombre"],
        }
        _enviar_y_registrar([destinatario], partido)

    if marcado:
        seleccionados.append(i)

st.divider()

if not seleccionados:
    st.caption("Marca al menos un jugador para poder mandar a todos juntos.")
else:
    with st.expander(f"Vista previa — {len(seleccionados)} jugador(es) marcado(s)"):
        for i in seleccionados:
            st.write(f"**{estilos.nombre_completo(i)}**: {_armar(i, partido, texto_plantilla)}")

    if st.button(f"📨 Enviar a los {len(seleccionados)} marcados", type="primary"):
        destinatarios = [
            {
                "telefono": i["telefono"],
                "texto": _armar(i, partido, texto_plantilla),
                "jugador_nombre": i["apodo"] or i["nombre"],
            }
            for i in seleccionados
        ]
        _enviar_y_registrar(destinatarios, partido)
