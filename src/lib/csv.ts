export function escapeCsvText(value: string | null): string {
  return value && /^[\s]*[=+\-@]/.test(value) ? "'" + value : value ?? "";
}

export function escapeCsvCell(value: string | number | null): string {
  if (value == null) return "";
  const text = String(value);
  if (/[";\n,]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}
