"""Normalización de números de celular peruanos, compartida por login,
registro y el CRUD de jugadores."""


def normalizar_telefono(telefono):
    """"+51 999 999 999" / "999999999" -> "51999999999".

    Si ya trae código de país (11 dígitos), se respeta tal cual. Si son
    9 dígitos (celular peruano típico), se le antepone 51.
    """
    digitos = "".join(c for c in telefono if c.isdigit())
    if len(digitos) == 9:
        return f"51{digitos}"
    return digitos
