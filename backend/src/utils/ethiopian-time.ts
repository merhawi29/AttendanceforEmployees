export interface EatDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export const getEatParts = (now: Date = new Date()): EatDateTimeParts => {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
  };
};

export const getMinutesSinceMidnightEat = (now: Date = new Date()): number => {
  return now.getHours() * 60 + now.getMinutes();
};

export const getTodayGregorianDate = (now: Date = new Date()): Date => {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

export const toEthiopianDate = (
  now: Date = new Date()
): { year: number; month: number; day: number } => {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
};

export const toEthiopianDateString = (now: Date = new Date()): string => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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
