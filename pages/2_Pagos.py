"""Verificación de comprobantes de Yape, multas, y cuadre de caja por partido."""

import streamlit as st

from models import multas, pagos, partidos
from utils import auth, estilos

auth.requerir_admin()
estilos.aplicar_tema()

usuario = auth.usuario_actual()

st.title("💸 Pagos")

tab_pendientes, tab_multas, tab_caja = st.tabs(["Pendientes de verificar", "⚠️ Multas", "Cuadre por partido"])

with tab_pendientes:
    lista = pagos.listar_pagos_pendientes()
    if not lista:
        st.success("No hay comprobantes pendientes de verificar.")
    for pago in lista:
        st.divider()
        nombre_mostrar = estilos.nombre_completo(pago)
        col_img, col_info = st.columns([1, 2])
        with col_img:
            if pago["comprobante_img"]:
                st.image(pago["comprobante_img"], width=220)
        with col_info:
            st.markdown(f"**{nombre_mostrar}**")
            st.caption(
                f"Pichanga {pago['partido_fecha']} {pago['partido_hora']} — {pago['partido_cancha']}"
            )
            st.write(f"Monto: **S/ {pago['monto']:.2f}**")
            col_ok, col_no = st.columns(2)
            if col_ok.button("✅ Aprobar", key=f"aprobar_{pago['id']}", type="primary"):
                pagos.verificar_pago(pago["id"], usuario["id"])
                st.toast("Pago verificado.", icon="✅")
                st.rerun()
            with col_no.popover("❌ Rechazar"):
                nota = st.text_input("Motivo (opcional)", key=f"nota_{pago['id']}")
                if st.button("Confirmar rechazo", key=f"rechazar_{pago['id']}"):
                    pagos.rechazar_pago(pago["id"], usuario["id"], nota)
                    st.toast("Pago rechazado.", icon="🚫")
                    st.rerun()

with tab_multas:
    st.caption("Se generan solas cuando marcas tardanza o no-asistencia en Partidos → Ver inscritos.")
    pendientes_verificacion = multas.listar_pendientes_verificacion()
    if pendientes_verificacion:
        st.markdown("##### Comprobantes por revisar")
        for m in pendientes_verificacion:
            st.divider()
            nombre_mostrar = estilos.nombre_completo(m)
            col_img, col_info = st.columns([1, 2])
            with col_img:
                if m["comprobante_img"]:
                    st.image(m["comprobante_img"], width=220)
            with col_info:
                st.markdown(f"**{nombre_mostrar}** — {'Tardanza' if m['tipo'] == 'tardanza' else 'No asistencia'}")
                if m["partido_fecha"]:
                    st.caption(f"Pichanga {m['partido_fecha']} {m['partido_hora']}")
                st.write(f"Monto: **S/ {m['monto']:.2f}**")
                col_ok, col_no = st.columns(2)
                if col_ok.button("✅ Aprobar", key=f"aprobar_multa_{m['id']}", type="primary"):
                    multas.verificar_pago(m["id"], usuario["id"])
                    st.toast("Multa marcada como pagada.", icon="✅")
                    st.rerun()
                with col_no.popover("❌ Rechazar"):
                    nota = st.text_input("Motivo (opcional)", key=f"nota_multa_{m['id']}")
                    if st.button("Confirmar rechazo", key=f"rechazar_multa_{m['id']}"):
                        multas.rechazar_pago(m["id"], usuario["id"], nota)
                        st.toast("Comprobante rechazado.", icon="🚫")
                        st.rerun()

    st.markdown("##### Todas las multas pendientes")
    todas_pendientes = multas.listar_todas_pendientes()

    if not todas_pendientes:
        st.success("No hay multas pendientes de pago.")
    for m in todas_pendientes:
        col_nombre, col_tipo, col_monto, col_check = st.columns([2, 1.3, 1, 1.3])
        col_nombre.write(f"**{estilos.nombre_completo(m)}**")
        col_tipo.write("Tardanza" if m["tipo"] == "tardanza" else "No asistencia")
        col_monto.write(f"S/ {m['monto']:.2f}")
        if col_check.checkbox("Pagó en efectivo", key=f"efectivo_multa_{m['id']}"):
            multas.marcar_pagado_manual(m["id"], usuario["id"])
            st.toast("Multa marcada como pagada (efectivo).", icon="💵")
            st.rerun()

with tab_caja:
    lista_partidos = partidos.listar_partidos()
    if not lista_partidos:
        st.caption("Todavía no hay partidos.")
    else:
        opciones = {f"{p['fecha']} {p['hora']} — {p['cancha']}": p["id"] for p in lista_partidos}
        seleccion = st.selectbox("Partido", list(opciones.keys()))
        partido = partidos.obtener_partido(opciones[seleccion])
        recaudo = pagos.cuadre_partido(partido["id"])

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Recaudado (verificado)", f"S/ {recaudo['recaudado']:.2f}")
        col2.metric("Pendiente de verificar", f"S/ {recaudo['pendiente']:.2f}")
        col3.metric("Costo cancha", f"S/ {partido['costo_cancha']:.2f}")
        col4.metric("Saldo", f"S/ {recaudo['recaudado'] - partido['costo_cancha']:.2f}")
