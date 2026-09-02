"""
Página principal: login, auto-registro de jugadores, y el panel de acceso
a los módulos según el rol.

Corre con: streamlit run app.py
"""

import datetime

import streamlit as st

from database.connection import init_db
from models import inscripciones, jugadores, pagos, partidos, usuarios
from utils import auth, estilos

st.set_page_config(page_title="Pichangas de Barrio FC", page_icon="⚽", layout="wide")

init_db()
estilos.aplicar_tema()

if not auth.usuario_actual():
    st.title("⚽ Pichangas de Barrio FC")
    st.caption("Confirma tu asistencia, paga por Yape y no te pierdas ninguna pichanga.")

    tab_login, tab_registro = st.tabs(["Iniciar sesión", "Crear cuenta de jugador"])

    with tab_login:
        with st.form("login"):
            telefono_input = st.text_input("Celular")
            password_input = st.text_input("Contraseña", type="password")
            enviado = st.form_submit_button("Ingresar")

        if enviado:
            datos = usuarios.verificar_credenciales(telefono_input, password_input)
            if datos:
                auth.iniciar_sesion(datos)
                st.toast(f"Bienvenido(a), {datos['nombre']}.", icon="👋")
                st.rerun()
            else:
                st.error("Celular o contraseña incorrectos.")

        if not usuarios.existe_algun_usuario():
            st.info(
                "Todavía no hay ningún usuario creado. El presidente del club debe correr en "
                "la terminal: `python scripts/crear_usuario_admin.py`"
            )

    with tab_registro:
        st.caption("Regístrate una sola vez para poder confirmar tu asistencia a las pichangas.")
        with st.form("registro", clear_on_submit=True):
            nombre = st.text_input("Nombre completo")
            apodo = st.text_input("Apodo (como quieres que te reconozcan en la lista)")
            telefono = st.text_input("Celular (con el que vas a ingresar)")
            posicion = st.selectbox(
                "Posición", ["Arquero", "Defensa", "Mediocampo", "Delantero", "Cualquiera"]
            )
            password = st.text_input("Contraseña", type="password")
            password_confirmar = st.text_input("Repite la contraseña", type="password")
            crear = st.form_submit_button("Crear mi cuenta")

        if crear:
            if not nombre.strip() or not telefono.strip() or not password:
                st.error("Nombre, celular y contraseña son obligatorios.")
            elif password != password_confirmar:
                st.error("Las contraseñas no coinciden.")
            elif usuarios.obtener_usuario_por_telefono(telefono):
                st.error("Ya existe una cuenta con ese celular. Ve a la pestaña 'Iniciar sesión'.")
            else:
                jugadores.registrar_jugador(nombre, telefono, password, apodo, posicion)
                st.success("¡Cuenta creada! Ya puedes iniciar sesión en la otra pestaña.")

    st.stop()

usuario = auth.usuario_actual()

with st.sidebar:
    st.write(f"**{usuario['nombre']}**")
    st.caption("Presidente / Admin" if auth.es_admin() else "Jugador")
    if st.button("Cerrar sesión"):
        auth.cerrar_sesion()
        st.toast("Sesión cerrada.", icon="👋")
        st.rerun()

st.title("⚽ Pichangas de Barrio FC")

if auth.es_admin():
    st.caption("Programa partidos, verifica pagos y controla a los jugadores del club.")

    col1, col2, col3, col4, col5 = st.columns(5)
    col1.page_link("pages/1_Partidos.py", label="Partidos", icon="📅")
    col2.page_link("pages/2_Pagos.py", label="Pagos", icon="💸")
    col3.page_link("pages/3_Jugadores.py", label="Jugadores", icon="🧑‍🤝‍🧑")
    col4.page_link("pages/4_Enviar_WhatsApp.py", label="Enviar WhatsApp", icon="📨")
    col5.page_link("pages/5_Configuracion.py", label="Configuración", icon="⚙️")

    st.divider()

    proximos = partidos.listar_partidos(estado="programado")
    pendientes = pagos.listar_pagos_pendientes()
    activos = jugadores.listar_jugadores()

    col_a, col_b, col_c = st.columns(3)
    col_a.metric("Partidos programados", len(proximos))
    col_b.metric("Pagos por verificar", len(pendientes))
    col_c.metric("Jugadores activos", len(activos))

else:
    st.caption("Confirma tu asistencia a la próxima pichanga y sube tu comprobante de pago.")

    col1, col2 = st.columns(2)
    col1.page_link("pages/1_Partidos.py", label="Ver partidos →", icon="📅")
    col2.page_link("pages/6_Mi_Perfil.py", label="Mi perfil →", icon="👤")

    jugador = jugadores.obtener_jugador_por_usuario(usuario["id"])
    st.divider()

    hoy = datetime.date.today().isoformat()
    proximos = [p for p in partidos.listar_partidos(estado="programado") if p["fecha"] >= hoy]

    if not proximos:
        st.info("Todavía no hay pichangas programadas. Vuelve a revisar más tarde.")
    else:
        st.subheader("Próximas pichangas")
        for partido in proximos[:3]:
            inscripcion = inscripciones.obtener_inscripcion(partido["id"], jugador["id"])
            estado_txt = "No confirmado"
            if inscripcion and inscripcion["estado"] != "cancelado":
                estado_txt = estilos.badge_inscripcion(inscripcion["estado"])
            st.markdown(
                f"**{partido['fecha']} {partido['hora']}** — {partido['cancha']} · "
                f"S/ {partido['costo_por_jugador']:.2f} · {estado_txt} &nbsp; "
                + estilos.badge_cuenta_regresiva(partido["fecha"]),
                unsafe_allow_html=True,
            )
        st.page_link("pages/1_Partidos.py", label="Ir a Partidos para confirmar →", icon="📅")
