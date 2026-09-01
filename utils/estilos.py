"""Estilo visual del panel — temática de fútbol (verde cancha) en vez del
azul corporativo genérico, porque acá el "cliente" es el club, no un
negocio de facturación. aplicar_tema() se llama una vez al inicio de cada
página, justo después de auth.requerir_login()."""

import datetime

import streamlit as st

PASTO = "#1F6B3A"
PASTO_OSCURO = "#154D2A"
PASTO_CLARO = "#E7F4EA"
VERDE = PASTO
VERDE_FONDO = PASTO_CLARO
AMBAR = "#8a6d1a"
AMBAR_FONDO = "#fdf3d9"
ROJO = "#9c3d54"
ROJO_FONDO = "#fdeef1"
GRIS = "#5c6773"
GRIS_FONDO = "#f1f3f5"

COLORES_PAGO = {
    "verificado": (VERDE, VERDE_FONDO, "Pagado"),
    "pendiente": (AMBAR, AMBAR_FONDO, "Pendiente de verificar"),
    "rechazado": (ROJO, ROJO_FONDO, "Rechazado"),
    "sin_pago": (GRIS, GRIS_FONDO, "Sin comprobante"),
}

COLORES_INSCRIPCION = {
    "confirmado": (VERDE, VERDE_FONDO, "Confirmado"),
    "lista_espera": (AMBAR, AMBAR_FONDO, "Lista de espera"),
    "cancelado": (GRIS, GRIS_FONDO, "Cancelado"),
}

EMOJI_POSICION = {
    "Arquero": "🧤",
    "Defensa": "🛡️",
    "Mediocampo": "🎯",
    "Delantero": "⚽",
    "Cualquiera": "🔄",
}

_CSS = f"""
<style>
section[data-testid="stSidebar"] {{
    background: linear-gradient(180deg, #ffffff 0%, {PASTO_CLARO} 140%);
    border-right: 1px solid #dcece1;
}}
div[data-testid="stSidebarNavLinkContainer"] a[data-testid="stSidebarNavLink"] {{
    border-radius: 8px;
}}
div[data-testid="stSidebarNavLinkContainer"] a[data-testid="stSidebarNavLink"][aria-current="page"] {{
    background-color: {PASTO_CLARO};
}}
.stButton > button, .stFormSubmitButton > button, .stDownloadButton > button {{
    border-radius: 8px;
    font-weight: 600;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
}}
.stButton > button:hover, .stFormSubmitButton > button:hover, .stDownloadButton > button:hover {{
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(31, 107, 58, 0.18);
}}
button[kind="primary"] {{
    background-color: {PASTO} !important;
    border-color: {PASTO} !important;
}}
div[data-testid="stMetric"] {{
    background: #ffffff;
    border: 1px solid #dcece1;
    border-top: 3px solid {PASTO};
    border-radius: 12px;
    padding: 0.9rem 1rem 0.7rem 1rem;
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
}}
.stTabs [aria-selected="true"] {{
    color: {PASTO} !important;
    font-weight: 700;
}}
.stTabs [data-baseweb="tab-highlight"] {{
    background-color: {PASTO} !important;
}}
.stProgress > div > div > div > div {{
    background-color: {PASTO} !important;
}}
h1, h2, h3 {{
    letter-spacing: -0.01em;
}}
h1::after {{
    content: "";
    display: block;
    width: 56px;
    height: 4px;
    margin-top: 6px;
    background: {PASTO};
    border-radius: 2px;
}}
</style>
"""


def aplicar_tema():
    st.markdown(_CSS, unsafe_allow_html=True)


def _badge(color, fondo, texto):
    return (
        f'<span style="background:{fondo};color:{color};padding:2px 10px;'
        f'border-radius:999px;font-size:0.85em;font-weight:600;white-space:nowrap;">'
        f"{texto}</span>"
    )


def badge_pago(estado):
    color, fondo, texto = COLORES_PAGO.get(estado, COLORES_PAGO["sin_pago"])
    return _badge(color, fondo, texto)


def badge_inscripcion(estado):
    color, fondo, texto = COLORES_INSCRIPCION.get(estado, (GRIS, GRIS_FONDO, estado))
    return _badge(color, fondo, texto)


def emoji_posicion(posicion):
    return EMOJI_POSICION.get(posicion, "⚽")


def badge_cuenta_regresiva(fecha_iso):
    """"¡Hoy!" / "¡Mañana!" / "En N días" a partir de una fecha 'YYYY-MM-DD'."""
    dias = (datetime.date.fromisoformat(fecha_iso) - datetime.date.today()).days
    if dias < 0:
        return _badge(GRIS, GRIS_FONDO, "Ya pasó")
    if dias == 0:
        return _badge(ROJO, ROJO_FONDO, "¡Hoy!")
    if dias == 1:
        return _badge(AMBAR, AMBAR_FONDO, "¡Mañana!")
    return _badge(PASTO, PASTO_CLARO, f"En {dias} días")
