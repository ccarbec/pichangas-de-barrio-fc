"""Verificación de comprobantes de Yape y cuadre de caja por partido."""

import streamlit as st

from models import pagos, partidos
from utils import auth, estilos

auth.requerir_admin()
estilos.aplicar_tema()

usuario = auth.usuario_actual()

st.title("💸 Pagos")

tab_pendientes, tab_caja = st.tabs(["Pendientes de verificar", "Cuadre por partido"])

with tab_pendientes:
    lista = pagos.listar_pagos_pendientes()
    if not lista:
        st.success("No hay comprobantes pendientes de verificar.")
    for pago in lista:
        st.divider()
        nombre_mostrar = pago["apodo"] or pago["nombre"]
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
