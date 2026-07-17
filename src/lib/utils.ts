/**
 * Shared Utility Functions
 */

/**
 * Combine class names (simple cn implementation)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date | string): string {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

/**
 * Check if a date is within the last N days
 */
export function isRecentDate(dateStr: string, days: number = 7): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff < days * 24 * 60 * 60 * 1000;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get client IP from request headers
 * Supports Cloudflare (cf-connecting-ip) and other proxies
 */
export function getClientIp(headers: HeadersInit): string {
  const cf = (headers as any)['cf-connecting-ip'];
  const forwarded = (headers as any)['x-forwarded-for'];
  const realIp = (headers as any)['x-real-ip'];

  return cf || forwarded || realIp || '0.0.0.0';
}
