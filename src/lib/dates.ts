import { format } from "date-fns";

// Formats a Date for an <input type="datetime-local"> value, in local time.
export function toDatetimeLocal(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

// Formats a stored UTC ISO timestamp for display in the viewer's local time.
export function formatReadingDate(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy 'at' h:mm a");
}

export function formatDateOnly(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy");
}

export function formatTimeOnly(iso: string): string {
  return format(new Date(iso), "h:mm a");
}
