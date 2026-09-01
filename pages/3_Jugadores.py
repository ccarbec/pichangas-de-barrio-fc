"""CRUD de jugadores/usuarios y configuración del club (Yape)."""

import pandas as pd
import streamlit as st

from models import club_config, jugadores, usuarios
from utils import auth, estilos

auth.requerir_admin()
estilos.aplicar_tema()

st.title("🧑‍🤝‍🧑 Jugadores")

tab_lista, tab_nuevo, tab_config = st.tabs(
    ["Lista de jugadores", "➕ Agregar jugador", "⚙️ Configuración (Yape)"]
)

with tab_nuevo:
    st.caption("Normalmente cada jugador se crea su propia cuenta desde la pantalla de inicio. "
               "Usa esto solo si tú quieres darlo de alta manualmente.")
    with st.form("nuevo_jugador", clear_on_submit=True):
        nombre = st.text_input("Nombre completo")
        apodo = st.text_input("Apodo")
        telefono = st.text_input("Celular")
        posicion = st.selectbox("Posición", ["Arquero", "Defensa", "Mediocampo", "Delantero", "Cualquiera"])
        password = st.text_input("Contraseña inicial", type="password")
        crear = st.form_submit_button("Guardar jugador")

    if crear:
        if not nombre.strip() or not telefono.strip() or not password:
            st.error("Nombre, celular y contraseña son obligatorios.")
        elif usuarios.obtener_usuario_por_telefono(telefono):
            st.error("Ya existe una cuenta con ese celular.")
        else:
            jugadores.registrar_jugador(nombre, telefono, password, apodo, posicion)
            st.toast(f"Jugador '{nombre}' agregado.", icon="✅")
            st.rerun()

with tab_lista:
    mostrar_inactivos = st.checkbox("Mostrar también los inactivos")
    lista = jugadores.listar_jugadores(solo_activos=not mostrar_inactivos)

    if not lista:
        st.info("Todavía no hay jugadores registrados.")
    else:
        st.dataframe(
            pd.DataFrame(
                [
                    {
                        "Nombre": j["nombre"],
                        "Apodo": j["apodo"] or "",
                        "Celular": j["telefono"],
                        "Posición": j["posicion"] or "",
                        "Estado": j["estado"].capitalize(),
                    }
                    for j in lista
                ]
            ),
            hide_index=True,
            use_container_width=True,
        )

        st.markdown("##### Editar jugador")
        opciones = {f"{j['apodo'] or j['nombre']} ({j['telefono']})": j["id"] for j in lista}
        seleccion = st.selectbox("Jugador", list(opciones.keys()))
        jugador = jugadores.obtener_jugador(opciones[seleccion])
        usuario_jugador = usuarios.obtener_usuario(jugador["usuario_id"])

        with st.form("editar_jugador"):
            apodo_editado = st.text_input("Apodo", value=jugador["apodo"] or "")
            posicion_editada = st.selectbox(
                "Posición",
                ["Arquero", "Defensa", "Mediocampo", "Delantero", "Cualquiera"],
                index=["Arquero", "Defensa", "Mediocampo", "Delantero", "Cualquiera"].index(jugador["posicion"])
                if jugador["posicion"] in ["Arquero", "Defensa", "Mediocampo", "Delantero", "Cualquiera"]
                else 4,
            )
            rol_editado = st.selectbox(
                "Rol", ["jugador", "admin"], index=["jugador", "admin"].index(usuario_jugador["rol"])
            )
            nueva_password = st.text_input("Nueva contraseña (déjalo vacío para no cambiarla)", type="password")

            col_guardar, col_estado = st.columns(2)
            guardar = col_guardar.form_submit_button("💾 Guardar cambios")
            if jugador["estado"] == "activo":
                cambiar_estado = col_estado.form_submit_button("🚫 Inactivar")
            else:
                cambiar_estado = col_estado.form_submit_button("♻️ Reactivar")

        if guardar:
            jugadores.actualizar_jugador(jugador["id"], apodo_editado, posicion_editada)
            if rol_editado != usuario_jugador["rol"]:
                usuarios.cambiar_rol(usuario_jugador["id"], rol_editado)
            if nueva_password:
                usuarios.resetear_password(usuario_jugador["id"], nueva_password)
            st.toast("Jugador actualizado.", icon="✅")
            st.rerun()

        if cambiar_estado:
            if jugador["estado"] == "activo":
                jugadores.desactivar_jugador(jugador["id"])
                st.toast("Jugador inactivado.", icon="🚫")
            else:
                jugadores.reactivar_jugador(jugador["id"])
                st.toast("Jugador reactivado.", icon="♻️")
            st.rerun()

with tab_config:
    st.caption("Estos datos se muestran a los jugadores en la pantalla de pago.")
    config = club_config.obtener_config()
    with st.form("config_club"):
        nombre_yape = st.text_input("Nombre en Yape", value=config["nombre_yape"] or "")
        telefono_yape = st.text_input("Celular Yape", value=config["telefono_yape"] or "")
        guardar_config = st.form_submit_button("Guardar")
    if guardar_config:
        club_config.guardar_config(nombre_yape, telefono_yape)
        st.toast("Configuración guardada.", icon="✅")
        st.rerun()
