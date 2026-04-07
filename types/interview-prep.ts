export interface StarStory {
  competency: string
  situation: string
  task: string
  action: string
  result: string
  quantifiedImpact: string | null
}

export interface LikelyQuestion {
  question: string
  rationale: string
  suggestedAnswer: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface InterviewPrep {
  id: string
  userId: string
  evaluationId: string
  pipelineItemId: string | null
  starStories: StarStory[]
  likelyQuestions: LikelyQuestion[]
  companyResearchNotes: string | null
  createdAt: string
  updatedAt: string
}
