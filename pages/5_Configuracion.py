"""Configuración del club: estadios/canchas (con su precio y aporte por
jugador de siempre), Yape del presidente, y montos de multa."""

import pandas as pd
import streamlit as st

from models import club_config, estadios
from utils import auth, estilos

auth.requerir_admin()
estilos.aplicar_tema()

st.title("⚙️ Configuración")

tab_estadios, tab_club = st.tabs(["🏟️ Zonas y estadios", "💰 Yape y multas"])

with tab_estadios:
    st.caption(
        "Regístralos una vez con su precio de siempre — al programar una pichanga eliges uno y "
        "esos montos se rellenan solos (igual se pueden ajustar para ese día puntual)."
    )

    with st.expander("➕ Agregar zona / estadio"):
        with st.form("nuevo_estadio", clear_on_submit=True):
            nombre_estadio = st.text_input("Nombre (ej. 'Polideportivo Qapac Ñam')")
            col_c, col_j = st.columns(2)
            costo_cancha_nuevo = col_c.number_input("Precio de cancha (S/)", min_value=0.0, value=120.0, step=5.0)
            costo_jugador_nuevo = col_j.number_input("Aporte por jugador (S/)", min_value=0.0, value=10.0, step=1.0)
            crear_estadio = st.form_submit_button("Guardar")

        if crear_estadio:
            if not nombre_estadio.strip():
                st.error("El nombre es obligatorio.")
            else:
                estadios.crear_estadio(nombre_estadio, costo_cancha_nuevo, costo_jugador_nuevo)
                st.toast(f"'{nombre_estadio}' agregado.", icon="✅")
                st.rerun()

    mostrar_inactivos_estadio = st.checkbox("Mostrar también los inactivos", key="mostrar_inactivos_estadios")
    lista_estadios = estadios.listar_estadios(solo_activos=not mostrar_inactivos_estadio)

    if not lista_estadios:
        st.info("Todavía no has registrado ninguna zona o estadio.")
    else:
        st.dataframe(
            pd.DataFrame(
                [
                    {
                        "Nombre": e["nombre"],
                        "Precio de cancha": f"S/ {e['costo_cancha']:.2f}",
                        "Aporte por jugador": f"S/ {e['costo_por_jugador']:.2f}",
                        "Estado": e["estado"].capitalize(),
                    }
                    for e in lista_estadios
                ]
            ),
            hide_index=True,
            use_container_width=True,
        )

        st.markdown("##### Ver / editar uno por uno")
        nombres_estadio = [e["nombre"] for e in lista_estadios]

        indice_e = st.session_state.get("estadio_indice", 0)
        indice_e = max(0, min(indice_e, len(lista_estadios) - 1))
        if st.session_state.get("estadio_selectbox") not in nombres_estadio:
            st.session_state["estadio_selectbox"] = nombres_estadio[indice_e]

        col_prev_e, col_sel_e, col_next_e = st.columns([1, 3, 1])
        # Los dos botones se crean (y se leen) ANTES que el selectbox:
        # Streamlit no deja tocar el session_state de un widget con key
        # después de instanciarlo en la misma corrida.
        anterior_clic_e = col_prev_e.button("⬅️ Anterior", disabled=indice_e == 0, key="estadio_prev")
        siguiente_clic_e = col_next_e.button("Siguiente ➡️", disabled=indice_e == len(lista_estadios) - 1, key="estadio_next")
        if anterior_clic_e:
            st.session_state["estadio_indice"] = indice_e - 1
            st.session_state["estadio_selectbox"] = nombres_estadio[indice_e - 1]
            st.rerun()
        if siguiente_clic_e:
            st.session_state["estadio_indice"] = indice_e + 1
            st.session_state["estadio_selectbox"] = nombres_estadio[indice_e + 1]
            st.rerun()
        seleccion_estadio = col_sel_e.selectbox("Zona / estadio", nombres_estadio, key="estadio_selectbox")
        indice_e = nombres_estadio.index(seleccion_estadio)
        st.session_state["estadio_indice"] = indice_e
        st.caption(f"{indice_e + 1} de {len(lista_estadios)}")

        estadio = lista_estadios[indice_e]

        col_foto_e, col_form_e = st.columns([1, 2])
        with col_foto_e:
            foto_estadio_bytes, _ = (estadio.get("foto_img"), estadio.get("foto_mime"))
            if foto_estadio_bytes:
                st.image(foto_estadio_bytes, width=200)
            else:
                st.caption("Sin foto todavía.")
            nueva_foto_estadio = st.file_uploader(
                "Subir/cambiar foto", type=["png", "jpg", "jpeg"], key=f"foto_estadio_{estadio['id']}"
            )
            if nueva_foto_estadio is not None and st.button("Guardar foto", key=f"guardar_foto_estadio_{estadio['id']}"):
                estadios.subir_foto(estadio["id"], nueva_foto_estadio.getvalue(), nueva_foto_estadio.type)
                st.toast("Foto actualizada.", icon="📸")
                st.rerun()

        with col_form_e, st.form("editar_estadio"):
            nombre_editado = st.text_input("Nombre", value=estadio["nombre"])
            col_c, col_j = st.columns(2)
            costo_cancha_editado = col_c.number_input(
                "Precio de cancha (S/)", min_value=0.0, value=float(estadio["costo_cancha"]), step=5.0
            )
            costo_jugador_editado = col_j.number_input(
                "Aporte por jugador (S/)", min_value=0.0, value=float(estadio["costo_por_jugador"]), step=1.0
            )
            col_guardar, col_estado = st.columns(2)
            guardar_estadio = col_guardar.form_submit_button("💾 Guardar cambios")
            if estadio["estado"] == "activo":
                cambiar_estado_estadio = col_estado.form_submit_button("🚫 Inactivar")
            else:
                cambiar_estado_estadio = col_estado.form_submit_button("♻️ Reactivar")

        if guardar_estadio:
            if not nombre_editado.strip():
                st.error("El nombre es obligatorio.")
            else:
                estadios.actualizar_estadio(estadio["id"], nombre_editado, costo_cancha_editado, costo_jugador_editado)
                st.toast("Estadio actualizado.", icon="✅")
                st.rerun()

        if cambiar_estado_estadio:
            if estadio["estado"] == "activo":
                estadios.desactivar_estadio(estadio["id"])
                st.toast("Inactivado.", icon="🚫")
            else:
                estadios.reactivar_estadio(estadio["id"])
                st.toast("Reactivado.", icon="♻️")
            st.rerun()

with tab_club:
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
