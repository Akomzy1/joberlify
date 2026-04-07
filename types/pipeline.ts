export type PipelineStatus =
  | 'evaluated'
  | 'applying'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'hired'

export interface PipelineItem {
  id: string
  userId: string
  evaluationId: string | null
  jobTitle: string
  company: string
  jobUrl: string | null
  status: PipelineStatus
  appliedAt: string | null
  notes: string | null
  salaryOffered: number | null
  salaryCurrency: string | null
  nextActionAt: string | null
  nextActionNote: string | null
  sponsorWatchOptIn: boolean
  createdAt: string
  updatedAt: string
}
