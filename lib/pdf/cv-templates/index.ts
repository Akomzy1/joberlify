import type { GeneratedCvData, CvTargetFormat } from '@/lib/claude/prompts/generate-cv'
import { renderUkTemplate } from './uk-template'
import { renderUsTemplate } from './us-template'
import { renderGenericTemplate } from './generic-template'

export { renderUkTemplate } from './uk-template'
export { renderUsTemplate } from './us-template'
export { renderGenericTemplate } from './generic-template'

/**
 * Render a CV as an HTML string for a given format.
 */
export function renderCvHtml(cv: GeneratedCvData, format?: CvTargetFormat): string {
  const fmt = format ?? cv.format
  switch (fmt) {
    case 'uk':      return renderUkTemplate(cv)
    case 'us':      return renderUsTemplate(cv)
    case 'generic': return renderGenericTemplate(cv)
    default:        return renderGenericTemplate(cv)
  }
}
