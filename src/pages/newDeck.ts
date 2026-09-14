/** Shared "make me a new deck" helper for the marketing pages (the dialog has its own richer flow). */
import { createPresentation } from '../document/factory'
import type { Presentation } from '../document/types'

export function newBlankPresentation(title = 'عرض بدون عنوان'): Presentation {
  return createPresentation({ title })
}
