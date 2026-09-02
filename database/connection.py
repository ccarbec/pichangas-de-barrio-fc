"""
Conexión a la base de datos y creación de tablas.

Por defecto usa un archivo SQLite local (data/pichangas.db). Si se
configuran las credenciales de Turso (TURSO_DATABASE_URL y TURSO_AUTH_TOKEN,
en .streamlit/secrets.toml o como variables de entorno), la app conecta en
su lugar a esa base de datos en la nube — necesario en Streamlit Cloud,
donde el disco local es efímero y los jugadores/pagos se perderían en cada
redeploy. Mismo patrón que almacen_app/database/connection.py.

Los módulos en models/ solo llaman a get_connection() y escriben SQL; no
necesitan saber cuál de los dos casos está activo.
"""

import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "pichangas.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'jugador',
    estado TEXT NOT NULL DEFAULT 'activo',
    fecha_creacion TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS sesiones (
    token TEXT PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Perfil de jugador: solo existe para usuarios que juegan (rol jugador,
-- o un admin que también quiera aparecer en las pichangas).
CREATE TABLE IF NOT EXISTS jugadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id),
    apodo TEXT,
    apellidos TEXT DEFAULT '',
    posicion TEXT,
    equipo_hincha TEXT DEFAULT '',
    camiseta TEXT DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'activo',
    fecha_registro TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS partidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    cancha TEXT NOT NULL,
    cupo_max INTEGER NOT NULL,
    costo_cancha REAL NOT NULL DEFAULT 0,
    costo_por_jugador REAL NOT NULL DEFAULT 0,
    notas TEXT,
    estado TEXT NOT NULL DEFAULT 'programado',
    fecha_creacion TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS inscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partido_id INTEGER NOT NULL REFERENCES partidos(id),
    jugador_id INTEGER NOT NULL REFERENCES jugadores(id),
    estado TEXT NOT NULL DEFAULT 'confirmado',
    asistio INTEGER,
    fecha_inscripcion TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(partido_id, jugador_id)
);

-- La imagen del comprobante se guarda como BLOB (no en el disco) para que
-- sobreviva sin problema el día que esto se despliegue en un hosting con
-- almacenamiento temporal, como Streamlit Community Cloud.
CREATE TABLE IF NOT EXISTS pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inscripcion_id INTEGER NOT NULL UNIQUE REFERENCES inscripciones(id),
    monto REAL NOT NULL,
    comprobante_img BLOB,
    comprobante_mime TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    fecha_pago TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    verificado_por INTEGER REFERENCES usuarios(id),
    fecha_verificacion TEXT,
    nota TEXT
);

CREATE TABLE IF NOT EXISTS club_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    nombre_yape TEXT,
    telefono_yape TEXT
);

-- Historial de recordatorios de WhatsApp mandados por scripts/recordatorios_auto.py
-- (corre como tarea programada en la PC del club, no en Streamlit Cloud).
-- También sirve para no repetir el mismo tipo de envío al mismo jugador y
-- partido cuando el script corre de nuevo la próxima hora.
CREATE TABLE IF NOT EXISTS envios_recordatorios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jugador_nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    partido_fecha TEXT NOT NULL,
    partido_hora TEXT NOT NULL,
    tipo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    resultado TEXT NOT NULL,
    detalle_error TEXT,
    fecha_hora TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
"""

# ALTER TABLE para bases que ya existían antes de sumar estas columnas a
# jugadores — CREATE TABLE IF NOT EXISTS no las agrega solo. Cada una se
# intenta por separado y se ignora el error si la columna ya está.
MIGRACIONES = [
    "ALTER TABLE jugadores ADD COLUMN apellidos TEXT DEFAULT ''",
    "ALTER TABLE jugadores ADD COLUMN equipo_hincha TEXT DEFAULT ''",
    "ALTER TABLE jugadores ADD COLUMN camiseta TEXT DEFAULT ''",
]


def _credenciales_turso():
    """Busca TURSO_DATABASE_URL / TURSO_AUTH_TOKEN en secrets.toml o en variables de entorno."""
    url = None
    token = None
    try:
        import streamlit as st
        url = st.secrets.get("TURSO_DATABASE_URL")
        token = st.secrets.get("TURSO_AUTH_TOKEN")
    except Exception:
        pass
    url = url or os.environ.get("TURSO_DATABASE_URL")
    token = token or os.environ.get("TURSO_AUTH_TOKEN")
    if url and token:
        return url, token
    return None, None


def usando_nube():
    url, token = _credenciales_turso()
    return bool(url and token)


class _CursorDict:
    """Envuelve un cursor de libsql para que fetchone()/fetchall() devuelvan
    dicts accesibles como fila['columna'], igual que sqlite3.Row."""

    def __init__(self, cursor):
        self._cursor = cursor

    def _columnas(self):
        return [d[0] for d in self._cursor.description] if self._cursor.description else []

    def fetchone(self):
        fila = self._cursor.fetchone()
        if fila is None:
            return None
        return dict(zip(self._columnas(), fila))

    def fetchall(self):
        columnas = self._columnas()
        return [dict(zip(columnas, fila)) for fila in self._cursor.fetchall()]

    @property
    def lastrowid(self):
        return self._cursor.lastrowid

    @property
    def rowcount(self):
        return self._cursor.rowcount


class _ConexionNube:
    """Envuelve una conexión libsql (Turso). Todo lo demás (cursor(), commit(),
    rollback(), close(), executescript()) se delega tal cual a la conexión real."""

    def __init__(self, conn):
        self._conn = conn

    def execute(self, sql, params=()):
        # El binding de libsql en Linux (Streamlit Cloud) exige que los
        # parámetros lleguen como list, no como tuple — a diferencia del
        # build de Windows, que acepta ambos. Se normaliza acá para no
        # tocar cada conexion.execute(sql, (valor,)) de models/.
        return _CursorDict(self._conn.execute(sql, list(params)))

    def __getattr__(self, nombre):
        return getattr(self._conn, nombre)


def get_connection():
    """Abre una conexión nueva: a Turso si hay credenciales configuradas, si no, a SQLite local.

    row_factory = sqlite3.Row (o el dict equivalente en la nube) permite leer
    columnas por nombre, ej: fila["nombre"] en vez de fila[0].
    """
    url, token = _credenciales_turso()
    if url and token:
        import libsql
        return _ConexionNube(libsql.connect(database=url, auth_token=token))

    os.makedirs(DATA_DIR, exist_ok=True)
    conexion = sqlite3.connect(DB_PATH)
    conexion.row_factory = sqlite3.Row
    conexion.execute("PRAGMA foreign_keys = ON")
    conexion.execute("PRAGMA journal_mode = WAL")
    conexion.execute("PRAGMA busy_timeout = 5000")
    return conexion


def init_db():
    """Crea las tablas si todavía no existen, y agrega columnas nuevas a
    tablas viejas si hace falta. Seguro de llamar muchas veces."""
    conexion = get_connection()
    try:
        conexion.executescript(SCHEMA)
        for migracion in MIGRACIONES:
            try:
                conexion.execute(migracion)
            except Exception:
                pass
        conexion.commit()
    finally:
        conexion.close()
