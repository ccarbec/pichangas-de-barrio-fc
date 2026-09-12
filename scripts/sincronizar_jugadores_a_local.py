"""Copia los datos reales (Turso) a la base local de pruebas de la app web
(web/prisma/dev.db): usuarios, jugadores, partidos, inscripciones, pagos y
multas — para que localhost se vea igual que producción en vez de mostrar
los datos de prueba del seed.

De un solo sentido: LEE de la base real, nunca escribe en ella — sigue la
misma regla que el resto del proyecto (desarrollo nunca toca Turso). No
toca estadios, club_config ni plantillas_mensajes (esas siguen siendo la
configuración local de prueba).

Correrlo a mano: .venv\\Scripts\\python.exe scripts\\sincronizar_jugadores_a_local.py
"""

import os
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_connection, usando_nube

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEV_DB_PATH = os.path.join(BASE_DIR, "web", "prisma", "dev.db")

TABLAS = {
    "usuarios": ["id", "nombre", "telefono", "password_hash", "salt", "rol", "estado", "fecha_creacion"],
    "jugadores": [
        "id", "usuario_id", "apodo", "apellidos", "posicion", "equipo_hincha", "camiseta",
        "foto_img", "foto_mime", "resena", "estado", "fecha_registro",
    ],
    "partidos": [
        "id", "fecha", "hora", "cancha", "cupo_max", "costo_cancha", "costo_por_jugador",
        "notas", "estado", "fecha_creacion",
    ],
    "inscripciones": ["id", "partido_id", "jugador_id", "estado", "asistio", "fecha_inscripcion"],
    "pagos": [
        "id", "inscripcion_id", "monto", "comprobante_img", "comprobante_mime", "estado",
        "metodo_pago", "fecha_pago", "verificado_por", "fecha_verificacion", "nota",
    ],
    "multas": [
        "id", "jugador_id", "partido_id", "tipo", "monto", "estado", "comprobante_img",
        "comprobante_mime", "metodo_pago", "verificado_por", "fecha_creacion", "fecha_pago", "nota",
    ],
}

# Orden de borrado (hijas antes que padres) e inserción (padres antes que
# hijas) por las foreign keys.
ORDEN_BORRADO = ["pagos", "multas", "inscripciones", "sesiones", "jugadores", "partidos", "usuarios"]
ORDEN_INSERCION = ["usuarios", "jugadores", "partidos", "inscripciones", "pagos", "multas"]


def main():
    if not usando_nube():
        print("No hay credenciales de Turso configuradas (.streamlit/secrets.toml) — no hay nada real que copiar.")
        return
    if not os.path.exists(DEV_DB_PATH):
        print(f"No se encontró la base local en {DEV_DB_PATH}")
        return

    origen = get_connection()
    try:
        datos = {}
        for tabla in TABLAS:
            datos[tabla] = origen.execute(f"SELECT * FROM {tabla} ORDER BY id").fetchall()
            print(f"Leídos {len(datos[tabla])} {tabla} de la base real.")
    finally:
        origen.close()

    destino = sqlite3.connect(DEV_DB_PATH)
    destino.row_factory = sqlite3.Row
    try:
        destino.execute("PRAGMA foreign_keys = OFF")
        for tabla in ORDEN_BORRADO:
            destino.execute(f"DELETE FROM {tabla}")

        for tabla in ORDEN_INSERCION:
            columnas = TABLAS[tabla]
            placeholders = ", ".join("?" * len(columnas))
            for fila in datos[tabla]:
                destino.execute(
                    f"INSERT INTO {tabla} ({', '.join(columnas)}) VALUES ({placeholders})",
                    tuple(fila[c] for c in columnas),
                )

        # Para que un registro nuevo creado luego en localhost no choque con
        # un id real ya usado.
        for tabla in ("usuarios", "jugadores", "partidos", "inscripciones", "pagos", "multas"):
            destino.execute("DELETE FROM sqlite_sequence WHERE name = ?", (tabla,))
            maximo = destino.execute(f"SELECT COALESCE(MAX(id), 0) FROM {tabla}").fetchone()[0]
            if maximo > 0:
                destino.execute("INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)", (tabla, maximo))

        destino.commit()
        print("Copiado todo a la base local.")
        print("Las sesiones anteriores quedaron invalidadas — hay que volver a iniciar sesión en localhost con credenciales reales.")
    finally:
        destino.close()


if __name__ == "__main__":
    main()
