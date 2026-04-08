// CV parsing prompt for Claude Haiku.
// Designed to be fast (<15s) and return valid JSON on the first attempt.

export const CV_PARSE_SYSTEM_PROMPT = `You are a CV/resume parsing engine. Your only job is to extract structured information from raw CV text and return it as valid JSON. You never add commentary, prose, or markdown — only JSON.

CRITICAL RULES:
1. Output ONLY valid JSON. No text before or after the JSON object.
2. If a field cannot be determined, use null for strings/numbers and [] for arrays.
3. Never invent or hallucinate information not present in the CV.
4. Preserve original job titles and company names exactly as written.
5. If the CV is in a non-English language, still extract fields and set a warning in parseWarnings.
6. For employment gaps >6 months, note them in parseWarnings.
7. For freelance/consulting work with multiple clients, create one entry per major client if listed, or one "Freelance [Role]" entry if clients are not individually named.
8. For multiple roles at the same company, create a separate entry for each role.`

export function buildCvParsePrompt(rawText: string): string {
  return `Parse the following CV text and return a JSON object matching this exact schema. Do not include any text outside the JSON.

SCHEMA:
{
  "contactDetails": {
    "name": string | null,
    "email": string | null,
    "phone": string | null,
    "location": string | null
  },
  "careerSummary": string,  // Write a 2-4 sentence professional narrative in third person summarising this candidate's career, seniority level, and key strengths. Base it only on what is in the CV.
  "jobHistory": [
    {
      "title": string,
      "company": string,
      "startDate": string | null,   // Preferred: "YYYY-MM" or "YYYY". Accept free text if that's all available.
      "endDate": string | null,     // null if this is a current role
      "isCurrent": boolean,
      "duties": string[],           // Bullet points describing responsibilities. Max 8 per role.
      "achievements": string[],     // Quantified results and accomplishments. Max 6 per role.
      "employmentType": "permanent" | "contract" | "freelance" | "internship" | "other" | null
    }
  ],
  "skills": string[],               // Technical and soft skills. Deduplicated. Max 30.
  "qualifications": [
    {
      "degree": string,             // e.g. "BSc Computer Science", "MBA", "A-Levels"
      "institution": string,
      "year": number | null,        // Graduation year as integer
      "field": string | null        // Subject/field if separate from degree name
    }
  ],
  "certifications": [
    {
      "name": string,               // e.g. "AWS Solutions Architect", "PMP"
      "issuer": string | null,
      "year": number | null
    }
  ],
  "languages": string[],            // e.g. ["English (Native)", "French (Conversational)"]
  "totalExperienceYears": number | null,  // Calculated from first job start to today. Round to nearest 0.5.
  "currentTitle": string | null,    // Most recent job title
  "currentCompany": string | null,  // Most recent company (null if currently unemployed)
  "educationLevel": "rqf3" | "rqf4" | "rqf5" | "rqf6" | "rqf7" | "rqf8" | null,
  // RQF mapping guide:
  // rqf3 = A-Levels, BTEC National, NVQ3
  // rqf4 = Higher National Certificate, Certificate of Higher Education
  // rqf5 = Higher National Diploma, Foundation Degree
  // rqf6 = Bachelor's degree, Graduate Certificate
  // rqf7 = Master's degree, Postgraduate Diploma, MBA
  // rqf8 = Doctorate (PhD, DPhil, etc.)
  // Use the HIGHEST qualification found.
  "parseWarnings": string[]         // Flag: employment gaps >6mo, non-English content, illegible sections, dates missing for recent roles
}

CV TEXT TO PARSE:
---
${rawText.slice(0, 12000)}
---

Return only the JSON object. No markdown, no explanation.`
}
