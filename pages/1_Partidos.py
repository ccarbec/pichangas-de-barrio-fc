"""Programar pichangas (admin) y confirmar asistencia + pagar (jugador)."""

import datetime

import pandas as pd
import streamlit as st

from models import club_config, estadios, inscripciones, jugadores, multas, pagos, partidos
from utils import auth, estilos

auth.requerir_login()
estilos.aplicar_tema()

usuario = auth.usuario_actual()

st.title("📅 Partidos")

ETIQUETAS_ASISTENCIA = ["Sin marcar", "✅ Llegó", "⏰ Tardanza (multa)", "❌ No llegó (multa)"]
MAPA_ASISTENCIA = {
    "Sin marcar": None, "✅ Llegó": "llego", "⏰ Tardanza (multa)": "tardanza", "❌ No llegó (multa)": "no_llego",
}
MAPA_ASISTENCIA_INVERSO = {v: k for k, v in MAPA_ASISTENCIA.items()}


def _nombre_completo(p):
    """'Nombre Apellido' y, si tiene apodo, '(Apodo)' al final."""
    base = f"{p.get('nombre') or ''} {p.get('apellidos') or ''}".strip()
    if p.get("apodo"):
        base += f" ({p['apodo']})"
    return base or p.get("apodo", "")

# ---------------------------------------------------------------- admin: crear
if auth.es_admin():
    with st.expander("➕ Programar nueva pichanga"):
        OTRO_ESTADIO = "✍️ Otro (escribir manualmente)"
        opciones_estadio = {e["nombre"]: e for e in estadios.listar_estadios()}
        nombre_seleccion = st.selectbox(
            "Zona / estadio", list(opciones_estadio.keys()) + [OTRO_ESTADIO], key="estadio_nuevo_partido"
        )
        estadio_elegido = opciones_estadio.get(nombre_seleccion)
        if not opciones_estadio:
            st.caption("Todavía no tienes zonas/estadios guardados — puedes crearlos en Configuración.")

        with st.form("nuevo_partido", clear_on_submit=True):
            col1, col2 = st.columns(2)
            fecha = col1.date_input("Fecha", value=datetime.date.today())
            hora = col2.time_input("Hora", value=datetime.time(19, 0))
            if estadio_elegido:
                cancha = estadio_elegido["nombre"]
                st.caption(f"Cancha: **{cancha}**")
            else:
                cancha = st.text_input("Cancha / lugar")
            col3, col4, col5 = st.columns(3)
            cupo_max = col3.number_input("Cupo máximo", min_value=2, max_value=40, value=14, step=1)
            costo_cancha = col4.number_input(
                "Costo de la cancha (S/)", min_value=0.0,
                value=float(estadio_elegido["costo_cancha"]) if estadio_elegido else 120.0, step=5.0,
                key=f"costo_cancha_{nombre_seleccion}",
            )
            costo_por_jugador = col5.number_input(
                "Costo por jugador (S/)", min_value=0.0,
                value=float(estadio_elegido["costo_por_jugador"]) if estadio_elegido else 10.0, step=1.0,
                key=f"costo_jugador_{nombre_seleccion}",
            )
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

# ---------------------------------------------------------------- jugador: mis multas
jugador_sesion = jugadores.obtener_jugador_por_usuario(usuario["id"])
if jugador_sesion:
    mis_multas = multas.listar_multas_jugador(jugador_sesion["id"])
    if mis_multas:
        etiquetas_tipo = {"tardanza": "Tardanza", "no_asistio": "No asistencia"}
        with st.expander(f"⚠️ Tienes {len(mis_multas)} multa(s) pendiente(s)", expanded=True):
            for m in mis_multas:
                st.markdown(
                    f"**{etiquetas_tipo.get(m['tipo'], m['tipo'])}** — S/ {m['monto']:.2f} &nbsp; "
                    + estilos.badge_pago("pendiente" if m["estado"] == "pendiente_verificacion" else "sin_pago"),
                    unsafe_allow_html=True,
                )
                if m["tipo"] == "no_asistio":
                    st.caption("No podrás confirmar en otra pichanga hasta pagar esta multa.")
                if m["estado"] == "pendiente_verificacion":
                    st.caption("Comprobante enviado, esperando verificación.")
                else:
                    comprobante_multa = st.file_uploader(
                        "Sube tu comprobante de Yape para esta multa",
                        type=["png", "jpg", "jpeg"], key=f"comprobante_multa_{m['id']}",
                    )
                    if comprobante_multa is not None and st.button("Enviar comprobante", key=f"enviar_multa_{m['id']}"):
                        multas.subir_comprobante(m["id"], comprobante_multa.getvalue(), comprobante_multa.type)
                        st.toast("Comprobante de multa enviado.", icon="📤")
                        st.rerun()
                st.divider()

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
            bloqueado = multas.tiene_multa_no_asistio_pendiente(jugador["id"])
            if bloqueado:
                st.caption("Tienes una multa por no asistencia sin pagar — págala arriba para poder confirmar.")
            if st.button(
                "Confirmar asistencia", key=f"confirmar_{partido['id']}", type="primary", disabled=bloqueado
            ):
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
    inscritos = inscripciones.listar_inscripciones_partido(partido["id"])
    confirmados_lista = [i for i in inscritos if i["estado"] == "confirmado"]
    confirmados = len(confirmados_lista)

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
        # Un "no llegó" no bloquea el cierre — ya se le generó su multa por
        # no asistir, así que su pago de inscripción deja de ser requisito.
        faltan_pago = sum(
            1 for i in confirmados_lista if i["estado_pago"] != "verificado" and i["asistio"] != "no_llego"
        )
        autorizar_cierre = True
        if faltan_pago:
            st.warning(f"⚠️ Faltan {faltan_pago} jugador(es) por pagar.")
            autorizar_cierre = st.checkbox(
                "Autorizo cerrar el partido de todas formas", key=f"autorizar_cierre_{partido['id']}"
            )
        if col_a.button(
            "✅ Cerrar (jugado)", key=f"jugado_{partido['id']}", disabled=bool(faltan_pago) and not autorizar_cierre
        ):
            partidos.cambiar_estado(partido["id"], "jugado")
            st.rerun()
        if col_b.button("🚫 Cancelar", key=f"cancelarpartido_{partido['id']}"):
            partidos.cambiar_estado(partido["id"], "cancelado")
            st.rerun()

    with st.expander("Ver inscritos"):
        ids_ya_inscritos = {i["jugador_id"] for i in inscritos}
        disponibles = [j for j in jugadores.listar_jugadores() if j["id"] not in ids_ya_inscritos]
        if disponibles:
            col_sel, col_btn = st.columns([3, 1])
            opciones = {f"{_nombre_completo(j)} — {j['telefono']}": j for j in disponibles}
            elegido = col_sel.selectbox(
                "➕ Agregar jugador registrado", list(opciones.keys()), key=f"agregar_{partido['id']}"
            )
            jugador_elegido = opciones[elegido]
            if col_btn.button("Agregar", key=f"btn_agregar_{partido['id']}"):
                if multas.tiene_multa_no_asistio_pendiente(jugador_elegido["id"]):
                    st.error(f"{_nombre_completo(jugador_elegido)} tiene una multa por no asistencia sin pagar — no puede jugar hasta pagarla.")
                else:
                    estado = inscripciones.inscribir_jugador(partido["id"], jugador_elegido["id"], partido["cupo_max"])
                    if estado == "confirmado":
                        st.toast(f"{_nombre_completo(jugador_elegido)} agregado y confirmado.", icon="✅")
                    else:
                        st.toast(f"Cupo lleno: {_nombre_completo(jugador_elegido)} quedó en lista de espera.", icon="⏳")
                    st.rerun()
        else:
            st.caption("Ya están todos los jugadores registrados en esta lista.")

        if not inscritos:
            st.caption("Todavía nadie se ha inscrito.")

        ids_en_partido = {x["jugador_id"] for x in inscritos}

        for i in inscritos:
            nombre_mostrar = _nombre_completo(i)
            with st.container(border=True):
                col_n, col_i, col_p, col_x = st.columns([2.3, 1, 1.1, 0.8])
                col_n.write(f"{estilos.emoji_posicion(i.get('posicion'))} **{nombre_mostrar}** ({i['telefono']})")
                col_i.markdown(estilos.badge_inscripcion(i["estado"]), unsafe_allow_html=True)
                col_p.markdown(estilos.badge_pago(i["estado_pago"]), unsafe_allow_html=True)
                if col_x.button("🗑️ Quitar", key=f"quitar_{i['id']}"):
                    inscripciones.cancelar_inscripcion(i["id"])
                    st.toast(f"{nombre_mostrar} fue quitado de esta pichanga.", icon="🗑️")
                    st.rerun()

                if i["estado"] != "confirmado" or partido["estado"] == "cancelado":
                    continue

                col_efectivo, col_asis = st.columns([1, 2])
                if i["estado_pago"] != "verificado":
                    if col_efectivo.button("💵 Pagó en efectivo", key=f"efectivo_{i['id']}"):
                        pagos.marcar_pago_manual(i["id"], partido["costo_por_jugador"], usuario["id"])
                        st.toast(f"Pago en efectivo registrado para {nombre_mostrar}.", icon="💵")
                        st.rerun()

                seleccion_actual = MAPA_ASISTENCIA_INVERSO.get(i["asistio"], "Sin marcar")
                nueva = col_asis.selectbox(
                    "Asistencia", ETIQUETAS_ASISTENCIA, index=ETIQUETAS_ASISTENCIA.index(seleccion_actual),
                    key=f"asis_{i['id']}", label_visibility="collapsed",
                )
                nuevo_estado = MAPA_ASISTENCIA[nueva]
                if nuevo_estado != i["asistio"]:
                    inscripciones.marcar_asistencia(i["id"], nuevo_estado)
                    config = club_config.obtener_config()
                    multas.eliminar_multa_de_inscripcion(i["jugador_id"], partido["id"], "tardanza")
                    multas.eliminar_multa_de_inscripcion(i["jugador_id"], partido["id"], "no_asistio")
                    if nuevo_estado == "tardanza":
                        multas.crear_multa(i["jugador_id"], partido["id"], "tardanza", config["monto_multa_tardanza"])
                    elif nuevo_estado == "no_llego":
                        multas.crear_multa(i["jugador_id"], partido["id"], "no_asistio", config["monto_multa_no_asistio"])
                    st.rerun()

                if i["asistio"] == "no_llego":
                    clave_mostrar = f"mostrar_reemplazo_{i['id']}"
                    if not st.session_state.get(clave_mostrar):
                        if st.button("🔁 Buscar reemplazo", key=f"btn_reemplazo_{i['id']}"):
                            st.session_state[clave_mostrar] = True
                            st.rerun()
                    else:
                        candidatos = [j for j in jugadores.listar_jugadores() if j["id"] not in ids_en_partido]
                        if not candidatos:
                            st.caption("No hay más jugadores registrados disponibles para reemplazar.")
                        else:
                            col_sel_r, col_btn_r = st.columns([3, 1])
                            opciones_r = {f"{_nombre_completo(j)} — {j['telefono']}": j["id"] for j in candidatos}
                            elegido_r = col_sel_r.selectbox(
                                f"Reemplazo para {nombre_mostrar}", list(opciones_r.keys()), key=f"sel_reemplazo_{i['id']}"
                            )
                            if col_btn_r.button("Confirmar", key=f"confirmar_reemplazo_{i['id']}"):
                                inscripciones.reemplazar(i["id"], opciones_r[elegido_r])
                                st.toast(f"{elegido_r.split(' — ')[0]} entra en lugar de {nombre_mostrar}.", icon="🔁")
                                st.session_state[clave_mostrar] = False
                                st.rerun()

        recaudo = pagos.cuadre_partido(partido["id"])
        st.divider()
        c1, c2, c3 = st.columns(3)
        c1.metric("Recaudado (verificado)", f"S/ {recaudo['recaudado']:.2f}")
        c2.metric("Costo cancha", f"S/ {partido['costo_cancha']:.2f}")
        c3.metric("Saldo", f"S/ {recaudo['recaudado'] - partido['costo_cancha']:.2f}")

    if partido["estado"] == "jugado":
        with st.expander("📊 Reporte del partido"):
            marcados = sum(1 for i in confirmados_lista if i["asistio"])
            col_r1, col_r2 = st.columns(2)
            col_r1.metric("Asistencia marcada", f"{marcados}/{len(confirmados_lista)}")
            multas_partido = multas.listar_multas_partido(partido["id"])
            col_r2.metric("Multas generadas", len(multas_partido))

            st.dataframe(
                pd.DataFrame(
                    [
                        {
                            "Jugador": _nombre_completo(i),
                            "Pago": i["estado_pago"].replace("_", " ").capitalize(),
                            "Asistencia": {
                                "llego": "✅ Llegó", "tardanza": "⏰ Tardanza", "no_llego": "❌ No llegó",
                            }.get(i["asistio"], "Sin marcar"),
                        }
                        for i in confirmados_lista
                    ]
                ),
                hide_index=True,
                use_container_width=True,
            )

            if multas_partido:
                st.markdown("##### Multas de este partido")
                st.dataframe(
                    pd.DataFrame(
                        [
                            {
                                "Jugador": _nombre_completo(m),
                                "Tipo": "Tardanza" if m["tipo"] == "tardanza" else "No asistencia",
                                "Monto": f"S/ {m['monto']:.2f}",
                                "Estado": "Pagado" if m["estado"] == "pagado" else "Debe",
                            }
                            for m in multas_partido
                        ]
                    ),
                    hide_index=True,
                    use_container_width=True,
                )

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
jugador_actual = jugadores.obtener_jugador_por_usuario(usuario["id"])

with tab_programados:
    lista = partidos.listar_partidos(estado="programado")
    if not lista:
        st.info("No hay pichangas programadas todavía.")
    for partido in lista:
        st.divider()
        if auth.es_admin():
            _vista_admin(partido)
            if jugador_actual:
                with st.expander("⚽ Mi asistencia a este partido"):
                    _vista_jugador(partido, jugador_actual)
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
