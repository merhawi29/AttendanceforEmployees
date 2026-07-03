import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getStatusColor(status: string | null | undefined): string {
  switch (status) {
    case "PRESENT":
      return "bg-green-100 text-green-800";
    case "LATE":
      return "bg-yellow-100 text-yellow-800";
    case "ABSENT":
      return "bg-red-100 text-red-800";
    case "HALF_DAY":
      return "bg-orange-100 text-orange-800";
    case "LUNCH_MISSING":
      return "bg-purple-100 text-purple-800";
    case "PENDING":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function formatStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return status.replace(/_/g, " ");
}
