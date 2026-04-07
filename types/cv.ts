export type CvFormat = 'chronological' | 'skills_based' | 'hybrid'

export interface GeneratedCv {
  id: string
  userId: string
  evaluationId: string
  format: CvFormat
  htmlContent: string
  pdfUrl: string | null
  pdfGeneratedAt: string | null
  atsScore: number | null // 0–100
  createdAt: string
}
