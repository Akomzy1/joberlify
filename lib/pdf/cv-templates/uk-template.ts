import type { GeneratedCvData } from '@/lib/claude/prompts/generate-cv'
import { esc, renderExperience, renderEducation, renderCertifications, BASE_CSS } from './shared'

/**
 * UK Standard CV format.
 * — No photo, no DOB, no marital status.
 * — Chronological order.
 * — Up to 2 pages.
 * — Clear section headings ATS can parse.
 */
export function renderUkTemplate(cv: GeneratedCvData): string {
  const p = cv.personalDetails
  const contactParts = [
    p.phone,
    p.email,
    p.location,
    p.linkedin ? `LinkedIn: ${p.linkedin}` : null,
    p.github ? `GitHub: ${p.github}` : null,
    p.website,
  ].filter(Boolean)

  const certHtml = renderCertifications(cv.certifications)
  const achievementsHtml =
    cv.keyAchievements.length > 0
      ? `<div class="section">
    <h2 class="section-heading">Key Achievements</h2>
    <hr class="thin" />
    <ul class="achievements-list">
      ${cv.keyAchievements.map((a) => `<li>${esc(a)}</li>`).join('\n      ')}
    </ul>
  </div>`
      : ''

  const allSkills = [
    ...cv.skills.technical,
    ...cv.skills.soft,
    ...(cv.skills.languages ?? []),
  ]

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(p.name)} — CV</title>
  <style>
    ${BASE_CSS}
  </style>
</head>
<body>
  <div class="page">

    <!-- Personal Details -->
    <h1 class="name">${esc(p.name)}</h1>
    ${contactParts.map((c) => `<p class="contact-line">${esc(c!)}</p>`).join('\n    ')}
    <hr class="divider" />

    <!-- Professional Summary -->
    <div class="section">
      <h2 class="section-heading">Professional Summary</h2>
      <hr class="thin" />
      <p class="summary-text">${esc(cv.professionalSummary)}</p>
    </div>

    <!-- Key Achievements -->
    ${achievementsHtml}

    <!-- Work Experience -->
    <div class="section">
      <h2 class="section-heading">Work Experience</h2>
      <hr class="thin" />
      ${renderExperience(cv.experience)}
    </div>

    <!-- Education -->
    ${cv.education.length > 0 ? `<div class="section">
      <h2 class="section-heading">Education</h2>
      <hr class="thin" />
      ${renderEducation(cv.education)}
    </div>` : ''}

    <!-- Skills -->
    ${allSkills.length > 0 ? `<div class="section">
      <h2 class="section-heading">Skills</h2>
      <hr class="thin" />
      <div class="skills-grid">
        ${allSkills.map((s) => `<span class="skill-tag">${esc(s)}</span>`).join('\n        ')}
      </div>
    </div>` : ''}

    <!-- Certifications -->
    ${certHtml ? `<div class="section">
      <h2 class="section-heading">Certifications</h2>
      <hr class="thin" />
      <ul class="plain">
        ${certHtml}
      </ul>
    </div>` : ''}

  </div>
</body>
</html>`
}
