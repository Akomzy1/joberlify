import type { GeneratedCvData, CvExperienceItem, CvEducationItem, CvCertificationItem } from '@/lib/claude/prompts/generate-cv'

// ─── Shared HTML escape util ──────────────────────────────────────────────────

export function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ─── Shared section renderers ─────────────────────────────────────────────────

export function renderExperience(items: CvExperienceItem[]): string {
  return items
    .map(
      (job) => `
    <div class="entry">
      <div class="entry-header">
        <div>
          <span class="entry-title">${esc(job.title)}</span>
          <span class="entry-company"> — ${esc(job.company)}${job.location ? `, ${esc(job.location)}` : ''}</span>
          ${job.employmentType ? `<span class="entry-type"> (${esc(job.employmentType)})</span>` : ''}
        </div>
        <span class="entry-dates">${esc(job.startDate)} – ${job.endDate ? esc(job.endDate) : 'Present'}</span>
      </div>
      <ul class="bullets">
        ${job.bulletPoints.map((b) => `<li>${esc(b)}</li>`).join('\n        ')}
      </ul>
    </div>`,
    )
    .join('\n')
}

export function renderEducation(items: CvEducationItem[]): string {
  return items
    .map(
      (ed) => `
    <div class="entry">
      <div class="entry-header">
        <div>
          <span class="entry-title">${esc(ed.degree)}${ed.field ? ` in ${esc(ed.field)}` : ''}</span>
          <span class="entry-company"> — ${esc(ed.institution)}${ed.location ? `, ${esc(ed.location)}` : ''}</span>
          ${ed.grade ? `<span class="entry-type"> (${esc(ed.grade)})</span>` : ''}
        </div>
        ${ed.year ? `<span class="entry-dates">${esc(ed.year)}</span>` : ''}
      </div>
    </div>`,
    )
    .join('\n')
}

export function renderCertifications(items: CvCertificationItem[]): string {
  if (!items.length) return ''
  return items
    .map(
      (c) =>
        `<li>${esc(c.name)}${c.issuer ? ` — ${esc(c.issuer)}` : ''}${c.year ? ` (${c.year})` : ''}</li>`,
    )
    .join('\n    ')
}

// ─── Shared ATS-safe base CSS ─────────────────────────────────────────────────

export const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #1a1a1a;
    background: #fff;
  }
  .page { max-width: 750px; margin: 0 auto; padding: 32px 40px; }
  h1.name { font-size: 20pt; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 4px; }
  .contact-line { font-size: 10pt; color: #444; margin-bottom: 2px; }
  .contact-line a { color: #444; text-decoration: none; }
  hr.divider { border: none; border-top: 1.5px solid #1a1a1a; margin: 12px 0 10px; }
  hr.thin { border: none; border-top: 0.5px solid #ccc; margin: 8px 0 10px; }
  h2.section-heading {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
    color: #1a1a1a;
  }
  .section { margin-bottom: 14px; }
  .entry { margin-bottom: 10px; }
  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    margin-bottom: 3px;
  }
  .entry-title { font-weight: 700; font-size: 10.5pt; }
  .entry-company { font-size: 10.5pt; }
  .entry-type { font-size: 9.5pt; color: #555; }
  .entry-dates { font-size: 10pt; color: #444; white-space: nowrap; margin-left: 8px; }
  ul.bullets { list-style: disc; padding-left: 18px; }
  ul.bullets li { font-size: 10.5pt; margin-bottom: 2px; }
  ul.plain { list-style: none; padding-left: 0; }
  ul.plain li { font-size: 10.5pt; margin-bottom: 1px; }
  .skills-grid { display: flex; flex-wrap: wrap; gap: 4px 12px; }
  .skill-tag { font-size: 10pt; }
  .summary-text { font-size: 10.5pt; line-height: 1.55; }
  .achievements-list { margin: 0; padding-left: 18px; }
  .achievements-list li { font-size: 10.5pt; margin-bottom: 3px; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page { padding: 0; max-width: none; }
  }
`
