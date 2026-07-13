export function normalizeTimeValue(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    return trimmed;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return trimmed;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatToAmPm(timeStr: string): string {
  const normalized = normalizeTimeValue(timeStr);
  if (!/^\d{2}:\d{2}$/.test(normalized)) return "—";

  const [hourStr, minuteStr] = normalized.split(":");
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${String(h).padStart(2, "0")}:${minuteStr} ${ampm}`;
}
