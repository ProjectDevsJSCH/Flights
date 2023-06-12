export function numberToCurrency(
  number: number,
): string {
  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  return formatter.format(number);
}