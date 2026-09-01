"""
Crea el primer usuario del panel (el presidente del club). Solo se necesita
correr esto una vez, antes de abrir el panel por primera vez.

Cómo correrlo (desde la carpeta pichangas_fc):
    python scripts/crear_usuario_admin.py
"""

import getpass
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import init_db
from models import usuarios


def main():
    init_db()

    print("Vamos a crear tu usuario de presidente del club.\n")
    nombre = input("Tu nombre: ").strip()
    telefono = input("Tu celular (con el que vas a iniciar sesión): ").strip()
    password = getpass.getpass("Contraseña: ")
    confirmacion = getpass.getpass("Repite la contraseña: ")

    if password != confirmacion:
        print("\nLas contraseñas no coinciden. Vuelve a intentarlo.")
        return

    if usuarios.obtener_usuario_por_telefono(telefono):
        print(f"\nYa existe un usuario con el celular '{telefono}'.")
        return

    usuarios.crear_usuario(nombre, telefono, password, rol="admin")
    print(f"\nListo. Usuario '{nombre}' creado como presidente/admin.")
    print("Ya puedes abrir el panel con: streamlit run app.py")


if __name__ == "__main__":
    main()
