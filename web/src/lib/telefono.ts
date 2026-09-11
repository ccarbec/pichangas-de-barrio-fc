// Igual que utils/telefono.py: "+51 999 999 999" / "999999999" -> "51999999999"
export function normalizarTelefono(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length === 9) return `51${digitos}`;
  return digitos;
}
