"""Galería de perfiles del club — cualquier jugador puede ver el perfil de
sus compañeros (foto, posición, a qué equipo es hincha, reseña), pero solo
de lectura: no puede editar ni ver el celular de nadie más que el suyo."""

import streamlit as st

from models import jugadores
from utils import auth, estilos

auth.requerir_login()
estilos.aplicar_tema()

st.title("🖼️ Perfiles del club")
st.caption("Conoce a tus compañeros de pichanga.")

lista = jugadores.listar_jugadores(solo_activos=True)

if not lista:
    st.info("Todavía no hay jugadores activos registrados.")
    st.stop()

etiquetas = [
    f"{j['nombre']} {j.get('apellidos') or ''}".strip() + (f" ({j['apodo']})" if j["apodo"] else "")
    for j in lista
]

indice = st.session_state.get("perfiles_club_indice", 0)
indice = max(0, min(indice, len(lista) - 1))
if st.session_state.get("perfiles_club_selectbox") not in etiquetas:
    st.session_state["perfiles_club_selectbox"] = etiquetas[indice]

col_prev, col_sel, col_next = st.columns([1, 3, 1])
# Los dos botones se crean (y se leen) ANTES que el selectbox: Streamlit no
# deja tocar el session_state de un widget con key después de instanciarlo
# en la misma corrida, y el selectbox usa esa key más abajo.
anterior_clic = col_prev.button("⬅️ Anterior", disabled=indice == 0)
siguiente_clic = col_next.button("Siguiente ➡️", disabled=indice == len(lista) - 1)
if anterior_clic:
    st.session_state["perfiles_club_indice"] = indice - 1
    st.session_state["perfiles_club_selectbox"] = etiquetas[indice - 1]
    st.rerun()
if siguiente_clic:
    st.session_state["perfiles_club_indice"] = indice + 1
    st.session_state["perfiles_club_selectbox"] = etiquetas[indice + 1]
    st.rerun()
seleccion = col_sel.selectbox("Jugador", etiquetas, key="perfiles_club_selectbox")
indice = etiquetas.index(seleccion)
st.session_state["perfiles_club_indice"] = indice

jugador_perfil = lista[indice]
st.caption(f"{indice + 1} de {len(lista)}")

col_foto, col_info = st.columns([1, 2])
with col_foto:
    foto_bytes, _ = jugadores.obtener_foto(jugador_perfil["id"])
    if foto_bytes:
        st.image(foto_bytes, width=200)
    else:
        st.caption("Sin foto todavía.")

with col_info:
    st.markdown(
        f"### {estilos.emoji_posicion(jugador_perfil['posicion'])} "
        f"{jugador_perfil['nombre']} {jugador_perfil.get('apellidos') or ''}"
    )
    if jugador_perfil["apodo"]:
        st.caption(f"Apodo: {jugador_perfil['apodo']}")
    st.write(f"**Posición:** {jugador_perfil['posicion'] or '—'}")
    st.write(f"**Hincha de:** {jugador_perfil.get('equipo_hincha') or '—'}")
    st.write(f"**Camiseta:** {jugador_perfil.get('camiseta') or '—'}")
    st.markdown("**Reseña:**")
    if jugador_perfil.get("resena"):
        st.info(jugador_perfil["resena"])
    else:
        st.caption("Todavía no escribió una reseña sobre sí mismo.")
