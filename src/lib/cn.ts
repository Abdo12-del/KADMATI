import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function clampNum(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** Byte size in a compact human form, Arabic-friendly (no forced latin digits). */
export function formatBytes(bytes: number): string {
  if (!bytes) return '٠ ب'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const v = bytes / 1024 ** i
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}

const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

/** Relative time in Arabic — "قبل ٣ دقائق", "أمس", then an absolute date. */
export function timeAgo(ts: number, locale: 'ar' | 'en' = 'ar'): string {
  const diff = Date.now() - ts
  const min = Math.round(diff / 60000)
  const fmt = (n: number) => (locale === 'ar' ? toArabicDigits(String(n)) : String(n))
  if (min < 1) return locale === 'ar' ? 'الآن' : 'just now'
  if (min < 60) return locale === 'ar' ? `قبل ${fmt(min)} دقيقة` : `${fmt(min)} min ago`
  const hours = Math.round(min / 60)
  if (hours < 24) return locale === 'ar' ? `قبل ${fmt(hours)} ساعة` : `${fmt(hours)} h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return locale === 'ar' ? 'أمس' : 'yesterday'
  if (days < 7) return locale === 'ar' ? `قبل ${fmt(days)} أيام` : `${fmt(days)} d ago`
  const d = new Date(ts)
  return locale === 'ar' ? `${fmt(d.getDate())} ${AR_MONTHS[d.getMonth()]} ${fmt(d.getFullYear())}` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'

export function toArabicDigits(input: string): string {
  return input.replace(/\d/g, (d) => AR_DIGITS[Number(d)])
}

export function maybeArabicDigits(input: string, locale: 'ar' | 'en'): string {
  return locale === 'ar' ? toArabicDigits(input) : input
}

export function fileNameSafe(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80) || 'presentation'
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((w) => Array.from(w)[0] ?? '').join('')
}
