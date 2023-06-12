export function dateToFormat(
  date: string,
): string {
  const formatter = new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return formatter.format(new Date(date));
}