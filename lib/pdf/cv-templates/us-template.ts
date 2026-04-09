import type { GeneratedCvData } from '@/lib/claude/prompts/generate-cv'
import { esc, renderExperience, renderEducation, renderCertifications, BASE_CSS } from './shared'

/**
 * US Resume format.
 * — Achievements-first bullet structure.
 * — Accomplishments-heavy summary.
 * — 1 page for < 10 years, 2 pages max.
 * — No personal details beyond name/contact.
 */
export function renderUsTemplate(cv: GeneratedCvData): string {
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

  const technicalSkills = cv.skills.technical.join(' | ')
  const softSkills = cv.skills.soft.join(' | ')
  const languages = (cv.skills.languages ?? []).join(' | ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(p.name)} — Resume</title>
  <style>
    ${BASE_CSS}
    /* US-specific overrides */
    h1.name { font-size: 18pt; text-align: center; }
    .contact-center { text-align: center; font-size: 10pt; color: #444; margin-bottom: 2px; }
    hr.bold-divider { border: none; border-top: 2px solid #1a1a1a; margin: 10px 0 8px; }
    .skills-category { margin-bottom: 4px; font-size: 10.5pt; }
    .skills-label { font-weight: 700; }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header — centered for US style -->
    <h1 class="name">${esc(p.name)}</h1>
    ${contactParts.map((c) => `<p class="contact-center">${esc(c!)}</p>`).join('\n    ')}
    <hr class="bold-divider" />

    <!-- Professional Summary -->
    <div class="section">
      <h2 class="section-heading">Professional Summary</h2>
      <p class="summary-text">${esc(cv.professionalSummary)}</p>
    </div>

    <!-- Key Achievements — leads in US resumes -->
    ${cv.keyAchievements.length > 0 ? `<div class="section">
      <h2 class="section-heading">Key Achievements</h2>
      <ul class="achievements-list">
        ${cv.keyAchievements.map((a) => `<li>${esc(a)}</li>`).join('\n        ')}
      </ul>
    </div>` : ''}

    <!-- Work Experience -->
    <div class="section">
      <h2 class="section-heading">Professional Experience</h2>
      ${renderExperience(cv.experience)}
    </div>

    <!-- Skills — compact for US -->
    ${(cv.skills.technical.length + cv.skills.soft.length) > 0 ? `<div class="section">
      <h2 class="section-heading">Technical Skills</h2>
      ${technicalSkills ? `<p class="skills-category"><span class="skills-label">Technical:</span> ${esc(technicalSkills)}</p>` : ''}
      ${softSkills ? `<p class="skills-category"><span class="skills-label">Core Competencies:</span> ${esc(softSkills)}</p>` : ''}
      ${languages ? `<p class="skills-category"><span class="skills-label">Languages:</span> ${esc(languages)}</p>` : ''}
    </div>` : ''}

    <!-- Education -->
    ${cv.education.length > 0 ? `<div class="section">
      <h2 class="section-heading">Education</h2>
      ${renderEducation(cv.education)}
    </div>` : ''}

    <!-- Certifications -->
    ${certHtml ? `<div class="section">
      <h2 class="section-heading">Certifications</h2>
      <ul class="plain">
        ${certHtml}
      </ul>
    </div>` : ''}

  </div>
</body>
</html>`
}
