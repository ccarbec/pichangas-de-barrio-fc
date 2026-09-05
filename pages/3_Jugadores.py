"""CRUD de jugadores/usuarios."""

import pandas as pd
import streamlit as st

from models import jugadores, usuarios
from utils import auth, estilos

auth.requerir_admin()
estilos.aplicar_tema()

st.title("🧑‍🤝‍🧑 Jugadores")

POSICIONES = ["Arquero", "Defensa", "Mediocampo", "Delantero", "Cualquiera"]

tab_lista, tab_nuevo, tab_perfiles = st.tabs(["Lista de jugadores", "➕ Agregar jugador", "🖼️ Perfiles"])

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
        opciones = {f"{estilos.nombre_completo(j)} ({j['telefono']})": j["id"] for j in lista}
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

with tab_perfiles:
    lista_perfil = jugadores.listar_jugadores(solo_activos=False)
    if not lista_perfil:
        st.info("Todavía no hay jugadores registrados.")
    else:
        etiquetas_perfil = [
            f"{j['nombre']} {j.get('apellidos') or ''}".strip() + (f" ({j['apodo']})" if j["apodo"] else "")
            for j in lista_perfil
        ]

        indice = st.session_state.get("perfil_indice", 0)
        indice = max(0, min(indice, len(lista_perfil) - 1))
        if st.session_state.get("perfil_selectbox") not in etiquetas_perfil:
            st.session_state["perfil_selectbox"] = etiquetas_perfil[indice]

        col_prev, col_sel, col_next = st.columns([1, 3, 1])
        # Los dos botones se crean (y se leen) ANTES que el selectbox:
        # Streamlit no deja tocar el session_state de un widget con key
        # después de instanciarlo en la misma corrida.
        anterior_clic = col_prev.button("⬅️ Anterior", disabled=indice == 0)
        siguiente_clic = col_next.button("Siguiente ➡️", disabled=indice == len(lista_perfil) - 1)
        if anterior_clic:
            st.session_state["perfil_indice"] = indice - 1
            st.session_state["perfil_selectbox"] = etiquetas_perfil[indice - 1]
            st.rerun()
        if siguiente_clic:
            st.session_state["perfil_indice"] = indice + 1
            st.session_state["perfil_selectbox"] = etiquetas_perfil[indice + 1]
            st.rerun()
        seleccion_perfil = col_sel.selectbox("Jugador", etiquetas_perfil, key="perfil_selectbox")
        indice = etiquetas_perfil.index(seleccion_perfil)
        st.session_state["perfil_indice"] = indice

        jugador_perfil = lista_perfil[indice]
        st.caption(f"{indice + 1} de {len(lista_perfil)}")

        col_foto, col_info = st.columns([1, 2])
        with col_foto:
            foto_bytes, _ = jugadores.obtener_foto(jugador_perfil["id"])
            if foto_bytes:
                st.image(foto_bytes, width=200)
            else:
                st.caption("Sin foto todavía.")
            nueva_foto_admin = st.file_uploader(
                "Subir/cambiar foto", type=["png", "jpg", "jpeg"], key=f"foto_admin_{jugador_perfil['id']}"
            )
            if nueva_foto_admin is not None and st.button("Guardar foto", key=f"guardar_foto_{jugador_perfil['id']}"):
                jugadores.subir_foto(jugador_perfil["id"], nueva_foto_admin.getvalue(), nueva_foto_admin.type)
                st.toast("Foto actualizada.", icon="📸")
                st.rerun()

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
            st.write(f"**Celular:** {jugador_perfil['telefono']}")
            st.markdown("**Reseña:**")
            if jugador_perfil.get("resena"):
                st.info(jugador_perfil["resena"])
            else:
                st.caption("Todavía no escribió una reseña sobre sí mismo.")
