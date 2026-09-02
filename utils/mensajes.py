"""Armado de mensajes y enlaces de WhatsApp para el módulo de recordatorios
manuales (pages/4_Recordatorios.py).

Acá NO se automatiza el envío — se genera un enlace wa.me con el mensaje ya
escrito, así el presidente lo manda él mismo con un clic desde su propio
WhatsApp (celular o compu), sin depender de tener una PC prendida con
Chrome vinculado. El envío 100% automático (cada hora, sin que nadie
apriete nada) vive aparte, en automatizaciones_carlos."""

import urllib.parse
from datetime import datetime


class _VariablesSeguras(dict):
    """Si el mensaje usa una variable que no reconocemos, la deja tal cual
    en vez de lanzar un error."""

    def __missing__(self, clave):
        return "{" + clave + "}"


def saludo_actual():
    hora = datetime.now().hour
    if hora < 12:
        return "Buenos días"
    if hora < 19:
        return "Buenas tardes"
    return "Buenas noches"


def armar_mensaje(texto_plantilla, jugador, partido):
    """jugador: dict con 'nombre'/'apodo'/'telefono'. partido: dict con
    'fecha'/'hora'/'cancha'/'costo_por_jugador'."""
    variables = _VariablesSeguras(
        nombre=jugador.get("apodo") or jugador["nombre"],
        fecha=partido["fecha"],
        hora=partido["hora"],
        cancha=partido["cancha"],
        costo=f"{partido['costo_por_jugador']:.2f}",
        saludo=saludo_actual(),
    )
    return texto_plantilla.format_map(variables)


def enlace_whatsapp(telefono, mensaje):
    return f"https://wa.me/{telefono}?text={urllib.parse.quote(mensaje)}"
