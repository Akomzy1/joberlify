import type { GeneratedCvData } from '@/lib/claude/prompts/generate-cv'
import { esc, renderExperience, renderEducation, renderCertifications, BASE_CSS } from './shared'

/**
 * Generic / International CV format.
 * — Universal layout suitable for any country.
 * — Clean, professional, no country-specific conventions.
 * — No personal details beyond name/email/phone/LinkedIn.
 */
export function renderGenericTemplate(cv: GeneratedCvData): string {
  const p = cv.personalDetails
  const contactParts = [
    p.email,
    p.phone,
    p.location,
    p.linkedin ? `LinkedIn: ${p.linkedin}` : null,
    p.github ? `GitHub: ${p.github}` : null,
    p.website,
  ].filter(Boolean)

  const certHtml = renderCertifications(cv.certifications)
  const allSkills = [...cv.skills.technical, ...cv.skills.soft]
  const languages = cv.skills.languages ?? []

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(p.name)}</title>
  <style>
    ${BASE_CSS}
    /* Generic overrides — slightly more spacious */
    body { font-size: 10.5pt; }
    h1.name { font-size: 19pt; border-bottom: 2px solid #1a1a1a; padding-bottom: 6px; margin-bottom: 6px; }
    .contact-row { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 10pt; color: #444; margin-bottom: 14px; }
    h2.section-heading { font-size: 10.5pt; text-transform: uppercase; letter-spacing: 1px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <h1 class="name">${esc(p.name)}</h1>
    <div class="contact-row">
      ${contactParts.map((c) => `<span>${esc(c!)}</span>`).join('\n      ')}
    </div>

    <!-- Professional Summary -->
    <div class="section">
      <h2 class="section-heading">Professional Summary</h2>
      <p class="summary-text">${esc(cv.professionalSummary)}</p>
    </div>

    <!-- Key Achievements -->
    ${cv.keyAchievements.length > 0 ? `<div class="section">
      <h2 class="section-heading">Key Achievements</h2>
      <ul class="achievements-list">
        ${cv.keyAchievements.map((a) => `<li>${esc(a)}</li>`).join('\n        ')}
      </ul>
    </div>` : ''}

    <!-- Work Experience -->
    <div class="section">
      <h2 class="section-heading">Work Experience</h2>
      ${renderExperience(cv.experience)}
    </div>

    <!-- Education -->
    ${cv.education.length > 0 ? `<div class="section">
      <h2 class="section-heading">Education</h2>
      ${renderEducation(cv.education)}
    </div>` : ''}

    <!-- Skills -->
    ${allSkills.length > 0 ? `<div class="section">
      <h2 class="section-heading">Skills</h2>
      <div class="skills-grid">
        ${allSkills.map((s) => `<span class="skill-tag">${esc(s)}</span>`).join('\n        ')}
      </div>
    </div>` : ''}

    <!-- Languages -->
    ${languages.length > 0 ? `<div class="section">
      <h2 class="section-heading">Languages</h2>
      <p class="summary-text">${languages.map(esc).join(' &nbsp;·&nbsp; ')}</p>
    </div>` : ''}

    <!-- Certifications -->
    ${certHtml ? `<div class="section">
      <h2 class="section-heading">Certifications &amp; Training</h2>
      <ul class="plain">
        ${certHtml}
      </ul>
    </div>` : ''}

  </div>
</body>
</html>`
}
