"""
Envío de WhatsApp usando el número personal del club, automatizando
WhatsApp Web con un navegador Chrome controlado por código (Selenium).

Esto SOLO puede correr en una computadora de verdad (necesita abrir Chrome
con la sesión de WhatsApp ya vinculada) — nunca en Streamlit Community
Cloud, donde no hay pantalla ni navegador. Por eso este módulo lo usa
scripts/recordatorios_auto.py (corre como tarea programada en la PC del
club), y no las páginas de la app web.

La PRIMERA vez hay que vincular el WhatsApp corriendo
`python scripts/vincular_whatsapp.py` — abre Chrome pidiendo escanear un
código QR (WhatsApp > Dispositivos vinculados > Vincular un dispositivo).
Después de esa vez, la sesión queda guardada en whatsapp/perfil_chrome/ y
no hace falta volver a escanear.
"""

import os
import shutil
import time
import urllib.parse
from datetime import datetime

from selenium import webdriver
from selenium.common.exceptions import ElementClickInterceptedException, TimeoutException
from selenium.webdriver import ActionChains
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PERFIL_CHROME = os.path.join(BASE_DIR, "whatsapp", "perfil_chrome")

SELECTOR_CAJA_BUSQUEDA = 'input[aria-label="Buscar un chat o iniciar uno nuevo"], input[aria-label="Search input textbox"]'
SELECTOR_CAJA_MENSAJE = 'div[contenteditable="true"][data-tab]'
SELECTOR_RESULTADOS_BUSQUEDA = '#pane-side div[role="listitem"]'
SELECTOR_BOTON_ENVIAR = 'button[aria-label="Enviar"], span[data-icon="send"], span[data-icon="wds-ic-send-filled"]'

TEXTO_DIALOGO_FALLO = "No se envió tu mensaje"
TEXTO_BOTON_REINTENTAR = "Volver a intentarlo"

TEXTOS_BOTON_DESCARTAR_DIALOGO = (
    "Ahora no", "Cerrar", "OK", "Entendido", "No, gracias", "Continuar",
    "Listo", "Empezar", "Siguiente", "Got it", "Not now",
)


class _VariablesSeguras(dict):
    """Si un mensaje usa una variable que no reconocemos, la deja tal cual
    en vez de lanzar un error feo."""

    def __missing__(self, clave):
        return "{" + clave + "}"


def saludo_actual():
    """"Buenos días" / "Buenas tardes" / "Buenas noches" según la hora del
    momento en que se manda el mensaje."""
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


def _abrir_navegador():
    opciones = Options()
    opciones.add_argument(f"--user-data-dir={PERFIL_CHROME}")
    opciones.add_argument("--profile-directory=Default")
    opciones.add_argument("--start-maximized")
    return webdriver.Chrome(options=opciones)


def hay_sesion_vinculada():
    return os.path.isdir(os.path.join(PERFIL_CHROME, "Default", "IndexedDB"))


def desvincular():
    if os.path.isdir(PERFIL_CHROME):
        shutil.rmtree(PERFIL_CHROME)


def verificar_o_vincular(tiempo_espera_segundos=120):
    navegador = _abrir_navegador()
    try:
        navegador.get("https://web.whatsapp.com")
        try:
            WebDriverWait(navegador, tiempo_espera_segundos).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_CAJA_BUSQUEDA))
            )
            return True
        except TimeoutException:
            return False
    finally:
        navegador.quit()


def _texto_visible_en_pagina(navegador, texto_buscado):
    try:
        navegador.find_element(By.XPATH, f'//*[contains(text(), "{texto_buscado}")]')
        return True
    except Exception:
        return False


def _clic_en_boton_con_texto(navegador, texto_boton):
    try:
        boton = navegador.find_element(
            By.XPATH, f'//*[self::button or self::div or self::span][contains(text(), "{texto_boton}")]'
        )
        navegador.execute_script("arguments[0].click();", boton)
        return True
    except Exception:
        return False


def _cerrar_dialogo_si_aparece(navegador, intentos=3):
    for _ in range(intentos):
        time.sleep(1.5)
        if not navegador.find_elements(By.CSS_SELECTOR, 'div[role="dialog"]'):
            return

        cerrado = False
        for texto in TEXTOS_BOTON_DESCARTAR_DIALOGO:
            if _clic_en_boton_con_texto(navegador, texto):
                cerrado = True
                break
        if not cerrado:
            try:
                boton_x = navegador.find_element(
                    By.CSS_SELECTOR, '[aria-label*="Cerrar" i], [aria-label*="Close" i]'
                )
                navegador.execute_script("arguments[0].click();", boton_x)
                cerrado = True
            except Exception:
                pass
        if not cerrado:
            navegador.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)


def _abrir_chat_por_busqueda(navegador, telefono):
    espera = WebDriverWait(navegador, 30)
    caja_busqueda = espera.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_CAJA_BUSQUEDA)))
    try:
        caja_busqueda.click()
    except ElementClickInterceptedException:
        navegador.execute_script("arguments[0].click();", caja_busqueda)

    caja_busqueda.send_keys(Keys.CONTROL + "a")
    caja_busqueda.send_keys(Keys.DELETE)
    caja_busqueda.send_keys(telefono)
    time.sleep(2.5)

    resultados = navegador.find_elements(By.CSS_SELECTOR, SELECTOR_RESULTADOS_BUSQUEDA)
    if not resultados:
        caja_busqueda.send_keys(Keys.ESCAPE)
        return False

    resultados[0].click()
    time.sleep(2)
    return True


def _escribir_y_enviar(navegador, texto):
    espera = WebDriverWait(navegador, 30)
    cajas_mensaje = espera.until(lambda nav: nav.find_elements(By.CSS_SELECTOR, SELECTOR_CAJA_MENSAJE) or False)
    caja_mensaje = cajas_mensaje[-1]
    caja_mensaje.click()

    lineas = texto.split("\n")
    for i, linea in enumerate(lineas):
        caja_mensaje.send_keys(linea)
        if i < len(lineas) - 1:
            ActionChains(navegador).key_down(Keys.SHIFT).send_keys(Keys.ENTER).key_up(Keys.SHIFT).perform()
    time.sleep(1)
    caja_mensaje.send_keys(Keys.ENTER)
    time.sleep(4)


def _enviar_por_enlace_directo(navegador, telefono, texto):
    mensaje_codificado = urllib.parse.quote(texto)
    url = f"https://web.whatsapp.com/send?phone={telefono}&text={mensaje_codificado}"
    navegador.get(url)
    espera = WebDriverWait(navegador, 90)
    try:
        boton_enviar = espera.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_BOTON_ENVIAR)))
    except TimeoutException:
        raise RuntimeError(
            "No apareció el botón de enviar en WhatsApp Web. "
            "¿Escaneaste el código QR la primera vez? ¿El número es válido en WhatsApp?"
        )
    time.sleep(2)
    boton_enviar.click()
    time.sleep(4)


def _enviar_en_sesion(navegador, telefono, texto):
    if _abrir_chat_por_busqueda(navegador, telefono):
        _escribir_y_enviar(navegador, texto)
    else:
        _enviar_por_enlace_directo(navegador, telefono, texto)

    intentos_reintento = 0
    while _texto_visible_en_pagina(navegador, TEXTO_DIALOGO_FALLO) and intentos_reintento < 2:
        _clic_en_boton_con_texto(navegador, TEXTO_BOTON_REINTENTAR)
        time.sleep(4)
        intentos_reintento += 1

    if _texto_visible_en_pagina(navegador, TEXTO_DIALOGO_FALLO):
        raise RuntimeError(
            "WhatsApp Web no logró enviar el mensaje después de reintentar. "
            "Puede ser un problema de conexión momentáneo — vuelve a intentarlo."
        )


def enviar_multiples(destinatarios, callback_progreso=None):
    """Manda varios mensajes en UNA sola sesión de Chrome.

    destinatarios: lista de dicts con 'telefono' y 'texto' (y cualquier
    otro dato propio, ej. 'tipo', que se devuelve tal cual en el resultado).
    callback_progreso: función opcional (índice, total, destinatario, resultado).

    Devuelve la lista de destinatarios con 'resultado' ("enviado"/"fallo")
    y 'error' agregados.
    """
    resultados = []
    navegador = _abrir_navegador()
    try:
        navegador.get("https://web.whatsapp.com")
        _cerrar_dialogo_si_aparece(navegador)

        for indice, destinatario in enumerate(destinatarios, start=1):
            resultado = dict(destinatario)
            try:
                _enviar_en_sesion(navegador, destinatario["telefono"], destinatario["texto"])
                resultado["resultado"] = "enviado"
                resultado["error"] = None
            except Exception as error:
                resultado["resultado"] = "fallo"
                resultado["error"] = str(error)
            resultados.append(resultado)
            if callback_progreso:
                callback_progreso(indice, len(destinatarios), destinatario, resultado)
    finally:
        navegador.quit()
    return resultados
