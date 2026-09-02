"""
Vincula el WhatsApp del club a esta PC — se corre UNA sola vez, antes de
que la tarea programada de recordatorios pueda mandar mensajes.

Abre una ventana de Chrome pidiendo escanear un código QR (desde el
celular: WhatsApp > Dispositivos vinculados > Vincular un dispositivo).
Después de esto, la sesión queda guardada en whatsapp/perfil_chrome/ y no
hace falta volver a escanear.

Correrlo: .venv\\Scripts\\python.exe scripts\\vincular_whatsapp.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from whatsapp import client as whatsapp_client


def main():
    if whatsapp_client.hay_sesion_vinculada():
        print("Ya hay un WhatsApp vinculado en esta PC. Si quieres cambiar de número, "
              "borra la carpeta whatsapp/perfil_chrome/ y vuelve a correr este script.")
        return

    print("Se va a abrir Chrome. Escanea el código QR desde WhatsApp > Dispositivos "
          "vinculados > Vincular un dispositivo. Esperando hasta 2 minutos...")
    vinculado = whatsapp_client.verificar_o_vincular()
    if vinculado:
        print("¡Listo! WhatsApp vinculado. Ya puedes correr scripts/recordatorios_auto.py")
    else:
        print("Se acabó el tiempo de espera sin detectar la vinculación. Intenta de nuevo.")


if __name__ == "__main__":
    main()
