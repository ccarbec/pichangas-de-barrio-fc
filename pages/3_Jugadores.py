"""CRUD de jugadores/usuarios y configuración del club (Yape)."""

import pandas as pd
import streamlit as st

from models import club_config, jugadores, usuarios
from utils import auth, estilos

auth.requerir_admin()
estilos.aplicar_tema()

st.title("🧑‍🤝‍🧑 Jugadores")

POSICIONES = ["Arquero", "Defensa", "Mediocampo", "Delantero", "Cualquiera"]

tab_lista, tab_nuevo, tab_config = st.tabs(
    ["Lista de jugadores", "➕ Agregar jugador", "⚙️ Configuración (Yape)"]
)

with tab_nuevo:
    st.caption("Normalmente cada jugador se crea su propia cuenta desde la pantalla de inicio. "
               "Usa esto solo si tú quieres darlo de alta manualmente.")
    with st.form("nuevo_jugador", clear_on_submit=True):
        col_n, col_a = st.columns(2)
        nombres = col_n.text_input("Nombres")
        apellidos = col_a.text_input("Apellidos")
        apodo = st.text_input("Apodo")
        telefono = st.text_input("Celular")
        posicion = st.selectbox("Posición", POSICIONES)
        col_h, col_c = st.columns(2)
        equipo_hincha = col_h.text_input("Hincha de qué equipo")
        camiseta = col_c.text_input("Camiseta que usa")
        password = st.text_input("Contraseña inicial", type="password")
        crear = st.form_submit_button("Guardar jugador")

    if crear:
        if not nombres.strip() or not telefono.strip() or not password:
            st.error("Nombres, celular y contraseña son obligatorios.")
        elif usuarios.obtener_usuario_por_telefono(telefono):
            st.error("Ya existe una cuenta con ese celular.")
        else:
            jugadores.registrar_jugador(
                nombres, telefono, password, apodo, posicion, apellidos, equipo_hincha, camiseta
            )
            st.toast(f"Jugador '{nombres}' agregado.", icon="✅")
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
                        "Nombres": j["nombre"],
                        "Apellidos": j.get("apellidos") or "",
                        "Apodo": j["apodo"] or "",
                        "Celular": j["telefono"],
                        "Posición": f"{estilos.emoji_posicion(j['posicion'])} {j['posicion'] or ''}".strip(),
                        "Hincha de": j.get("equipo_hincha") or "",
                        "Camiseta": j.get("camiseta") or "",
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
            col_n, col_a = st.columns(2)
            nombres_editado = col_n.text_input("Nombres", value=usuario_jugador["nombre"])
            apellidos_editado = col_a.text_input("Apellidos", value=jugador.get("apellidos") or "")
            apodo_editado = st.text_input("Apodo", value=jugador["apodo"] or "")
            posicion_editada = st.selectbox(
                "Posición", POSICIONES,
                index=POSICIONES.index(jugador["posicion"]) if jugador["posicion"] in POSICIONES else 4,
            )
            col_h, col_c = st.columns(2)
            equipo_hincha_editado = col_h.text_input("Hincha de qué equipo", value=jugador.get("equipo_hincha") or "")
            camiseta_editada = col_c.text_input("Camiseta que usa", value=jugador.get("camiseta") or "")
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
            jugadores.actualizar_jugador(
                jugador["id"], apodo_editado, posicion_editada, apellidos_editado, equipo_hincha_editado, camiseta_editada
            )
            if nombres_editado.strip() and nombres_editado != usuario_jugador["nombre"]:
                usuarios.actualizar_nombre(usuario_jugador["id"], nombres_editado)
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

        with st.expander("🗑️ Zona de eliminación permanente"):
            if jugadores.tiene_inscripciones(jugador["id"]):
                st.caption(
                    "Este jugador ya tiene partidos registrados (historial de asistencia/pagos), así que no "
                    "se puede eliminar del todo — usa 'Inactivar' arriba para que deje de aparecer sin perder "
                    "ese historial."
                )
            else:
                st.warning("Esto borra al jugador y su cuenta para siempre. No se puede deshacer.")
                confirmar = st.checkbox(
                    f"Confirmo que quiero eliminar a {jugador['apodo'] or usuario_jugador['nombre']} permanentemente",
                    key=f"confirmar_eliminar_{jugador['id']}",
                )
                if st.button("🗑️ Eliminar definitivamente", disabled=not confirmar):
                    jugadores.eliminar_jugador(jugador["id"])
                    st.toast("Jugador eliminado.", icon="🗑️")
                    st.rerun()

with tab_config:
    st.caption("El Yape se muestra a los jugadores en la pantalla de pago. Los montos de multa se "
               "usan cada vez que marcas tardanza o no-asistencia en Partidos.")
    config = club_config.obtener_config()
    with st.form("config_club"):
        nombre_yape = st.text_input("Nombre en Yape", value=config["nombre_yape"] or "")
        telefono_yape = st.text_input("Celular Yape", value=config["telefono_yape"] or "")
        col_t, col_n = st.columns(2)
        monto_tardanza = col_t.number_input(
            "Multa por tardanza (S/)", min_value=0.0, value=float(config["monto_multa_tardanza"]), step=1.0
        )
        monto_no_asistio = col_n.number_input(
            "Multa por no asistir (S/)", min_value=0.0, value=float(config["monto_multa_no_asistio"]), step=1.0
        )
        guardar_config = st.form_submit_button("Guardar")
    if guardar_config:
        club_config.guardar_config(nombre_yape, telefono_yape, monto_tardanza, monto_no_asistio)
        st.toast("Configuración guardada.", icon="✅")
        st.rerun()
