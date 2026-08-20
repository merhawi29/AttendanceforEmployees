export function parseTimeToHoursMinutes(value: string): { hour: number; minute: number } | null {
  if (!value) return null;
  const trimmed = value.trim();

  // Match 12-hour AM/PM format (e.g., "05:30 PM", "5:30PM", "12:30 AM")
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return { hour, minute };
  }

  // Match 24-hour format (e.g., "17:30", "06:30", "06:30:00")
  const hhmmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hhmmMatch) {
    const hour = parseInt(hhmmMatch[1], 10);
    const minute = parseInt(hhmmMatch[2], 10);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

    return { hour, minute };
  }

  return null;
}

export function normalizeTimeValue(value: string): string {
  const parsed = parseTimeToHoursMinutes(value);
  if (!parsed) {
    return value ? value.trim() : "";
  }
  return `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`;
}

export function isValidTimeValue(value: string): boolean {
  return parseTimeToHoursMinutes(value) !== null;
}
