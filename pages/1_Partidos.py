"""Programar pichangas (admin) y confirmar asistencia + pagar (jugador)."""

import datetime

import streamlit as st

from models import club_config, inscripciones, jugadores, pagos, partidos
from utils import auth, estilos

auth.requerir_login()
estilos.aplicar_tema()

usuario = auth.usuario_actual()

st.title("📅 Partidos")

# ---------------------------------------------------------------- admin: crear
if auth.es_admin():
    with st.expander("➕ Programar nueva pichanga"):
        with st.form("nuevo_partido", clear_on_submit=True):
            col1, col2 = st.columns(2)
            fecha = col1.date_input("Fecha", value=datetime.date.today())
            hora = col2.time_input("Hora", value=datetime.time(19, 0))
            cancha = st.text_input("Cancha / lugar")
            col3, col4, col5 = st.columns(3)
            cupo_max = col3.number_input("Cupo máximo", min_value=2, max_value=40, value=14, step=1)
            costo_cancha = col4.number_input("Costo de la cancha (S/)", min_value=0.0, value=120.0, step=5.0)
            costo_por_jugador = col5.number_input("Costo por jugador (S/)", min_value=0.0, value=10.0, step=1.0)
            notas = st.text_area("Notas (opcional)", height=68)
            crear = st.form_submit_button("Programar pichanga")

        if crear:
            if not cancha.strip():
                st.error("La cancha es obligatoria.")
            else:
                partidos.crear_partido(
                    fecha.isoformat(), hora.strftime("%H:%M"), cancha, int(cupo_max),
                    costo_cancha, costo_por_jugador, notas,
                )
                st.toast("Pichanga programada.", icon="✅")
                st.rerun()

tab_programados, tab_historial = st.tabs(["Programados", "Jugados / cancelados"])

# ---------------------------------------------------------------- vista jugador
def _vista_jugador(partido, jugador):
    inscripcion = inscripciones.obtener_inscripcion(partido["id"], jugador["id"])
    confirmados = inscripciones.contar_confirmados(partido["id"])
    inscrito_activo = inscripcion and inscripcion["estado"] != "cancelado"

    col_info, col_accion = st.columns([3, 2])
    with col_info:
        st.markdown(
            f"**{partido['fecha']} · {partido['hora']}** — {partido['cancha']} &nbsp; "
            + estilos.badge_cuenta_regresiva(partido["fecha"]),
            unsafe_allow_html=True,
        )
        st.progress(
            min(confirmados / partido["cupo_max"], 1.0),
            text=f"Cupo: {confirmados}/{partido['cupo_max']} · S/ {partido['costo_por_jugador']:.2f} por jugador",
        )
        if partido["notas"]:
            st.caption(partido["notas"])
        if inscrito_activo:
            st.markdown(estilos.badge_inscripcion(inscripcion["estado"]), unsafe_allow_html=True)

    with col_accion:
        if not inscrito_activo:
            if st.button("Confirmar asistencia", key=f"confirmar_{partido['id']}", type="primary"):
                estado = inscripciones.inscribir_jugador(partido["id"], jugador["id"], partido["cupo_max"])
                if estado == "confirmado":
                    st.toast("¡Asistencia confirmada!", icon="✅")
                else:
                    st.toast("Cupo lleno: quedaste en lista de espera.", icon="⏳")
                st.rerun()
        else:
            if st.button("Cancelar mi asistencia", key=f"cancelar_{partido['id']}"):
                inscripciones.cancelar_inscripcion(inscripcion["id"])
                st.toast("Asistencia cancelada.", icon="🚫")
                st.rerun()

    if inscrito_activo and inscripcion["estado"] == "confirmado":
        pago = pagos.obtener_pago_por_inscripcion(inscripcion["id"])
        st.markdown(estilos.badge_pago(pago["estado"] if pago else "sin_pago"), unsafe_allow_html=True)

        if pago and pago["estado"] == "rechazado":
            st.warning(f"Tu comprobante fue rechazado{': ' + pago['nota'] if pago['nota'] else ''}. Sube uno nuevo.")
        if pago and pago["estado"] == "verificado":
            st.success("Pago verificado. ¡Nos vemos en la cancha!")
        else:
            config = club_config.obtener_config()
            if config["telefono_yape"]:
                st.caption(f"Yape a **{config['nombre_yape']}** — {config['telefono_yape']}")
            comprobante = st.file_uploader(
                "Sube tu comprobante de Yape", type=["png", "jpg", "jpeg"], key=f"comprobante_{partido['id']}"
            )
            if comprobante is not None:
                if st.button("Enviar comprobante", key=f"enviar_pago_{partido['id']}"):
                    pagos.registrar_pago(
                        inscripcion["id"], partido["costo_por_jugador"], comprobante.getvalue(), comprobante.type
                    )
                    st.toast("Comprobante enviado, a la espera de verificación.", icon="📤")
                    st.rerun()


# ---------------------------------------------------------------- vista admin
def _vista_admin(partido):
    confirmados = inscripciones.contar_confirmados(partido["id"])
    col_info, col_a, col_b = st.columns([3, 1, 1])
    with col_info:
        st.markdown(
            f"**{partido['fecha']} · {partido['hora']}** — {partido['cancha']} &nbsp; "
            + estilos.badge_cuenta_regresiva(partido["fecha"]),
            unsafe_allow_html=True,
        )
        st.progress(
            min(confirmados / partido["cupo_max"], 1.0),
            text=f"Cupo: {confirmados}/{partido['cupo_max']} · Cancha S/ {partido['costo_cancha']:.2f} · "
            f"S/ {partido['costo_por_jugador']:.2f} por jugador",
        )
    if partido["estado"] == "programado":
        if col_a.button("✅ Jugado", key=f"jugado_{partido['id']}"):
            partidos.cambiar_estado(partido["id"], "jugado")
            st.rerun()
        if col_b.button("🚫 Cancelar", key=f"cancelarpartido_{partido['id']}"):
            partidos.cambiar_estado(partido["id"], "cancelado")
            st.rerun()

    with st.expander("Ver inscritos"):
        inscritos = inscripciones.listar_inscripciones_partido(partido["id"])

        ids_ya_inscritos = {i["jugador_id"] for i in inscritos}
        disponibles = [j for j in jugadores.listar_jugadores() if j["id"] not in ids_ya_inscritos]
        if disponibles:
            col_sel, col_btn = st.columns([3, 1])
            opciones = {f"{j['apodo'] or j['nombre']} ({j['telefono']})": j["id"] for j in disponibles}
            elegido = col_sel.selectbox(
                "➕ Agregar jugador registrado", list(opciones.keys()), key=f"agregar_{partido['id']}"
            )
            if col_btn.button("Agregar", key=f"btn_agregar_{partido['id']}"):
                estado = inscripciones.inscribir_jugador(partido["id"], opciones[elegido], partido["cupo_max"])
                if estado == "confirmado":
                    st.toast(f"{elegido.split(' (')[0]} agregado y confirmado.", icon="✅")
                else:
                    st.toast(f"Cupo lleno: {elegido.split(' (')[0]} quedó en lista de espera.", icon="⏳")
                st.rerun()
        else:
            st.caption("Ya están todos los jugadores registrados en esta lista.")

        if not inscritos:
            st.caption("Todavía nadie se ha inscrito.")
        for i in inscritos:
            nombre_mostrar = i["apodo"] or i["nombre"]
            cols = st.columns([2, 1, 1, 1])
            cols[0].write(f"{estilos.emoji_posicion(i.get('posicion'))} **{nombre_mostrar}** ({i['telefono']})")
            cols[1].markdown(estilos.badge_inscripcion(i["estado"]), unsafe_allow_html=True)
            cols[2].markdown(estilos.badge_pago(i["estado_pago"]), unsafe_allow_html=True)
            if partido["estado"] == "jugado":
                asistio_actual = i["asistio"]
                etiqueta = "✅ Llegó" if asistio_actual else ("❌ No llegó" if asistio_actual == 0 else "Marcar")
                if cols[3].button(etiqueta, key=f"asistio_{i['id']}"):
                    inscripciones.marcar_asistencia(i["id"], not asistio_actual)
                    st.rerun()

        recaudo = pagos.cuadre_partido(partido["id"])
        st.divider()
        c1, c2, c3 = st.columns(3)
        c1.metric("Recaudado (verificado)", f"S/ {recaudo['recaudado']:.2f}")
        c2.metric("Costo cancha", f"S/ {partido['costo_cancha']:.2f}")
        c3.metric("Saldo", f"S/ {recaudo['recaudado'] - partido['costo_cancha']:.2f}")

    if partido["estado"] == "cancelado":
        with st.expander("Repetir esta pichanga"):
            col_f, col_h, col_btn = st.columns([2, 1, 1])
            nueva_fecha = col_f.date_input("Nueva fecha", value=datetime.date.today(), key=f"dupfecha_{partido['id']}")
            nueva_hora = col_h.time_input("Nueva hora", value=datetime.time(19, 0), key=f"duphora_{partido['id']}")
            if col_btn.button("Duplicar", key=f"duplicar_{partido['id']}"):
                partidos.duplicar_partido(partido["id"], nueva_fecha.isoformat(), nueva_hora.strftime("%H:%M"))
                st.toast("Pichanga duplicada.", icon="🔁")
                st.rerun()


# ---------------------------------------------------------------- render
jugador_actual = None if auth.es_admin() else jugadores.obtener_jugador_por_usuario(usuario["id"])

with tab_programados:
    lista = partidos.listar_partidos(estado="programado")
    if not lista:
        st.info("No hay pichangas programadas todavía.")
    for partido in lista:
        st.divider()
        if auth.es_admin():
            _vista_admin(partido)
        else:
            _vista_jugador(partido, jugador_actual)

with tab_historial:
    lista = [p for p in partidos.listar_partidos() if p["estado"] in ("jugado", "cancelado")]
    if not lista:
        st.caption("Todavía no hay partidos jugados o cancelados.")
    for partido in reversed(lista):
        st.divider()
        estado_txt = "✅ Jugado" if partido["estado"] == "jugado" else "🚫 Cancelado"
        st.caption(estado_txt)
        if auth.es_admin():
            _vista_admin(partido)
        else:
            st.markdown(f"**{partido['fecha']} · {partido['hora']}** — {partido['cancha']}")
