export function dateToFormat(
  date: string,
): string {
  const formatter = new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return formatter.format(new Date(date));
}