export interface EatDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export const getEatParts = (now: Date = new Date()): EatDateTimeParts => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
  };
};

export const getMinutesSinceMidnightEat = (now: Date = new Date()): number => {
  const parts = getEatParts(now);
  return parts.hour * 60 + parts.minute;
};

export const getDateMinutesEat = (date: Date): number => {
  const parts = getEatParts(date);
  return parts.hour * 60 + parts.minute;
};

export const getTodayGregorianDate = (now: Date = new Date()): Date => {
  const parts = getEatParts(now);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
};

export const toEthiopianDate = (
  now: Date = new Date()
): { year: number; month: number; day: number } => {
  const parts = getEatParts(now);
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
  };
};

export const toEthiopianDateString = (now: Date = new Date()): string => {
  const parts = getEatParts(now);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
};

export const formatEthiopianDateLabel = (ethiopianDate: string): string => {
  if (!ethiopianDate) return "";
  return ethiopianDate.split("T")[0];
};

export const formatEatTime = (now: Date = new Date()): string => {
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const toMinutes = (hour: number, minute: number): number => hour * 60 + minute;

export const formatTimeLabel = (hour: number, minute: number): string => {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, "0");
  return `${h}:${m} ${ampm}`;
};
