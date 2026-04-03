export function getDaysLeft(expiryDate: string | Date): number {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const expiryMidnight = Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const todayMidnight = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((expiryMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
}

export type PulseStatus = "safe" | "warning" | "urgent" | "expired";

export function getPulseStatus(daysLeft: number): PulseStatus {
  if (daysLeft < 0) return "expired";
  if (daysLeft < 7) return "urgent";
  if (daysLeft <= 30) return "warning";
  return "safe";
}

export function sanitizeText(input: string): string {
  return input.replace(/<[^>]*>?/gm, "").trim().slice(0, 255);
}
