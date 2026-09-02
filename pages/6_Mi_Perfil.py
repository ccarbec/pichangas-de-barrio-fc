"""Cada jugador edita su propio perfil: foto, posición, a qué equipo es
hincha, qué camiseta usa, y una reseña libre sobre sí mismo."""

import streamlit as st

from models import jugadores
from utils import auth, estilos

auth.requerir_login()
estilos.aplicar_tema()

usuario = auth.usuario_actual()
jugador = jugadores.obtener_jugador_por_usuario(usuario["id"])

st.title("👤 Mi Perfil")

POSICIONES = ["Arquero", "Defensa", "Mediocampo", "Delantero", "Cualquiera"]

if not jugador:
    st.info("Todavía no tienes un perfil de jugador — actívalo para poder confirmar asistencia, "
             "pagar y aparecer en las pichangas igual que los demás, sin dejar de ser presidente.")
    with st.form("activar_perfil_jugador"):
        apodo_nuevo = st.text_input("Apodo")
        posicion_nueva = st.selectbox("Posición", POSICIONES)
        activar = st.form_submit_button("🎽 Activar mi perfil de jugador", type="primary")
    if activar:
        jugadores.crear_perfil_jugador(usuario["id"], apodo_nuevo, posicion_nueva)
        st.toast("¡Listo! Ya tienes tu perfil de jugador.", icon="🎽")
        st.rerun()
    st.stop()

col_foto, col_datos = st.columns([1, 2])

with col_foto:
    foto_bytes, foto_mime = jugadores.obtener_foto(jugador["id"])
    if foto_bytes:
        st.image(foto_bytes, width=200)
    else:
        st.caption("Todavía no subes una foto.")
    nueva_foto = st.file_uploader("Cambiar foto", type=["png", "jpg", "jpeg"], key="nueva_foto_perfil")
    if nueva_foto is not None and st.button("Guardar foto"):
        jugadores.subir_foto(jugador["id"], nueva_foto.getvalue(), nueva_foto.type)
        st.toast("Foto actualizada.", icon="📸")
        st.rerun()

with col_datos:
    with st.form("mi_perfil"):
        apodo = st.text_input("Apodo", value=jugador["apodo"] or "")
        posicion = st.selectbox(
            "Posición", POSICIONES,
            index=POSICIONES.index(jugador["posicion"]) if jugador["posicion"] in POSICIONES else 4,
        )
        equipo_hincha = st.text_input("Hincha de qué equipo", value=jugador["equipo_hincha"] or "")
        camiseta = st.text_input("Camiseta que usas", value=jugador["camiseta"] or "")
        resena = st.text_area(
            "Reseña — cuéntanos algo sobre ti", value=jugador.get("resena") or "", height=100,
            placeholder="Ej: Juego hace 10 años, me gusta la pizza post-partido y nunca fallo un penal 😄",
        )
        guardar = st.form_submit_button("💾 Guardar cambios", type="primary")

    if guardar:
        jugadores.actualizar_jugador(jugador["id"], apodo, posicion, jugador["apellidos"] or "", equipo_hincha, camiseta)
        jugadores.actualizar_resena(jugador["id"], resena)
        st.toast("Perfil actualizado.", icon="✅")
        st.rerun()
