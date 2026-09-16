/**
 * The icon catalog — which icons we offer in the picker, grouped for browsing.
 *
 * It lives in its own module, free of any `lucide` import, so the generator
 * (`npm run icons:generate`) can read the exact list the UI shows and emit a static
 * map of just those icons. Names are lucide's kebab-case ids.
 */

export interface IconCategory {
  id: string
  label: string
  icons: string[]
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    id: 'ui',
    label: 'واجهة',
    icons: ['search', 'settings', 'bell', 'star', 'heart', 'circle-check', 'circle-x', 'triangle-alert', 'info', 'menu', 'grid-2x2', 'layers', 'eye', 'lock', 'trash-2', 'download', 'upload', 'share-2', 'link', 'clock'],
  },
  {
    id: 'business',
    label: 'أعمال',
    icons: ['briefcase', 'target', 'trending-up', 'trending-down', 'chart-bar', 'chart-pie', 'chart-line', 'wallet', 'credit-card', 'receipt', 'users', 'user', 'building-2', 'handshake', 'lightbulb', 'rocket', 'flag', 'award', 'percent', 'globe'],
  },
  {
    id: 'tech',
    label: 'تقنية',
    icons: ['cpu', 'database', 'server', 'cloud', 'code-xml', 'terminal', 'wifi', 'smartphone', 'monitor', 'battery-charging', 'git-branch', 'bug', 'shield-check', 'fingerprint', 'server-cog', 'cpu'],
  },
  {
    id: 'education',
    label: 'تعليم',
    icons: ['book-open', 'graduation-cap', 'backpack', 'pencil', 'notebook-pen', 'clipboard-list', 'school', 'library', 'pen-line', 'highlighter', 'ruler', 'compass'],
  },
  {
    id: 'marketing',
    label: 'تسويق',
    icons: ['megaphone', 'mail', 'send', 'message-circle', 'at-sign', 'thumbs-up', 'shopping-cart', 'shopping-bag', 'store', 'radio-tower', 'badge-percent', 'sparkles', 'wand-sparkles', 'video', 'camera', 'image'],
  },
  {
    id: 'science',
    label: 'علوم',
    icons: ['flask-conical', 'atom', 'microscope', 'dna', 'brain', 'activity', 'heart-pulse', 'test-tubes', 'orbit', 'telescope', 'moon-star', 'sun'],
  },
  {
    id: 'arrows',
    label: 'أسهم وتدفق',
    icons: ['arrow-right', 'arrow-left', 'arrow-up', 'arrow-down', 'chevron-right', 'chevron-down', 'move-right', 'corner-down-right', 'arrow-right-left', 'git-commit-horizontal', 'play', 'pause', 'plus', 'minus'],
  },
  {
    id: 'nature',
    label: 'بيئة ومدينة',
    icons: ['leaf', 'trees', 'droplet', 'snowflake', 'wind', 'mountain', 'building', 'factory', 'car', 'plane', 'train-front', 'bike', 'house', 'tractor', 'wheat'],
  },
  {
    id: 'finance',
    label: 'مال',
    icons: ['dollar-sign', 'euro', 'banknote', 'coins', 'piggy-bank', 'chart-pie', 'chart-column-increasing', 'chart-no-axes-combined', 'circle-dollar-sign', 'landmark', 'scale', 'calculator'],
  },
  {
    id: 'health',
    label: 'صحة',
    icons: ['heart', 'stethoscope', 'pill', 'syringe', 'apple', 'utensils', 'dumbbell', 'baby', 'smile', 'accessibility'],
  },
]

export const ALL_ICONS = Array.from(new Set(ICON_CATEGORIES.flatMap((c) => c.icons)))
