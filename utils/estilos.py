"""Estilo visual compartido del panel (mismo criterio que tus otras apps:
azul de marca #1F4E78). aplicar_tema() se llama una vez al inicio de cada
página, justo después de auth.requerir_login()."""

import streamlit as st

AZUL = "#1F4E78"
AZUL_CLARO = "#EAF1F8"
VERDE = "#146c43"
VERDE_FONDO = "#eafaf1"
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

_CSS = f"""
<style>
section[data-testid="stSidebar"] {{
    background: linear-gradient(180deg, #ffffff 0%, #f6f9fc 100%);
    border-right: 1px solid #e3e9f0;
}}
div[data-testid="stSidebarNavLinkContainer"] a[data-testid="stSidebarNavLink"] {{
    border-radius: 8px;
}}
div[data-testid="stSidebarNavLinkContainer"] a[data-testid="stSidebarNavLink"][aria-current="page"] {{
    background-color: {AZUL_CLARO};
}}
.stButton > button, .stFormSubmitButton > button, .stDownloadButton > button {{
    border-radius: 8px;
    font-weight: 600;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
}}
.stButton > button:hover, .stFormSubmitButton > button:hover, .stDownloadButton > button:hover {{
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(31, 78, 120, 0.16);
}}
button[kind="primary"] {{
    background-color: {AZUL} !important;
    border-color: {AZUL} !important;
}}
div[data-testid="stMetric"] {{
    background: #ffffff;
    border: 1px solid #e3e9f0;
    border-radius: 12px;
    padding: 0.9rem 1rem 0.7rem 1rem;
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
}}
.stTabs [aria-selected="true"] {{
    color: {AZUL} !important;
    font-weight: 700;
}}
.stTabs [data-baseweb="tab-highlight"] {{
    background-color: {AZUL} !important;
}}
h1, h2, h3 {{
    letter-spacing: -0.01em;
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
