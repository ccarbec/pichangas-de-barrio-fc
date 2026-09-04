"""Conversión de listas de dicts a bytes de un .xlsx, para los botones de
descarga del Dashboard — todo en memoria, sin tocar el disco."""

import io

import pandas as pd


def a_excel_bytes(filas, nombre_hoja="Datos"):
    buffer = io.BytesIO()
    df = pd.DataFrame(filas)
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name=nombre_hoja)
    return buffer.getvalue()
