// ---------- 课程大纲 ----------
export interface Point {
  id: string
  no: string
  name: string
  summary: string
  keyPoints: string[]
  difficulty: number
  estimatedMinutes: number
  bookRefs?: string[]
}

export interface Section {
  id: string
  no: string
  title: string
  points: Point[]
}

export interface Chapter {
  id: string
  no: string
  title: string
  sections: Section[]
}

export interface Volume {
  id: string
  name: string
  chapters: Chapter[]
}

export interface Curriculum {
  meta: Record<string, unknown>
  volumes: Volume[]
}

// ---------- 课件 ----------
export type SlideKind = 'concept' | 'example' | 'method' | 'pitfall' | 'book'

export interface Slide {
  kind: SlideKind
  title: string
  body?: string
  problem?: string
  solution?: string
  notes?: string
  bookRef?: string
}

export interface CheckQuestion {
  question: string
  answer: string
}

export interface Lesson {
  pointId: string
  title: string
  durationMinutes: number
  objectives: string[]
  slides: Slide[]
  summary: string
  checkQuestions: CheckQuestion[]
}

export interface LessonFile {
  chapterId: string
  chapterTitle: string
  lessons: Lesson[]
}

// ---------- 题库 ----------
export type QType = 'choice' | 'fill' | 'calc' | 'applied'

export interface CommonWrong {
  answer: string
  reason: string
}

export interface Variant {
  stem: string
  options?: string[]
  answer: string
  solution: string
  estimatedSeconds: number
}

export interface QuestionSource {
  kind: 'book' | 'original'
  ref?: string
  pdfPage?: number
}

export interface Question {
  id: string
  type: QType
  difficulty: number
  estimatedSeconds: number
  pointIds: string[]
  stem: string
  options?: string[]
  answer: string
  acceptedAnswers?: string[]
  solution: string
  rubric?: string[]
  errorTags?: string[]
  commonWrong?: CommonWrong[]
  source?: QuestionSource
  variants?: Variant[]
}

export interface ExamSection {
  id: string
  title: string
  type: QType
  questionIds: string[]
}

export interface Exam {
  id: string
  chapterId: string
  chapterTitle: string
  title: string
  totalEstimatedSeconds: number
  sections: ExamSection[]
  questions: Question[]
}

// ---------- 作答与考评记录 ----------
export interface AnswerRecord {
  questionId: string
  type: QType
  /** 本题开始时刻：第一题为考评开始时间，其后为上一题提交时刻 */
  startedAt: number
  /** 提交（上传成功）时刻 */
  submittedAt: number
  /** 主耗时：submittedAt - startedAt（毫秒），与需求口径一致 */
  durationMs: number
  /** 选择题：首次选中选项的时刻与用时（更细的耗时点） */
  firstPickAt?: number
  firstPickMs?: number
  /** 学生答案：choice 为字母，fill 为文本，calc/applied 为最终答案 */
  value: string
  /** 解题过程文本（计算题/应用题） */
  work?: string
  /** 手写过程图片（dataURL） */
  images?: string[]
  /**
   * 上传了手写照片时的核对状态。
   * pending：照片已作为作答提交，自动批改未采纳文字框，等待对照解析确认。
   * accepted / rejected：学生对照解析确认手写答案对或错。
   */
  photoReview?: 'pending' | 'accepted' | 'rejected'
  /** 回看累计额外耗时 */
  revisitMs: number
  revisitCount: number
  /** 批改结果 */
  correct: boolean
  score: number
  selfRubric?: boolean[]
  errorTags: string[]
  errorReason: string
  /** 该题在轮到它时的序号 */
  index: number
}

export type RoundKind = 'exam' | 'remedial' | 'practice'

export interface Round {
  id: string
  kind: RoundKind
  round: number
  parentRoundId?: string
  chapterId: string
  chapterTitle: string
  title: string
  examId: string
  startedAt: number
  finishedAt?: number
  totalMs: number
  answers: AnswerRecord[]
  wrongQuestionIds: string[]
  slowQuestionIds: string[]
  weakPointIds: string[]
  /** 本轮的题目快照（专项练习卷是动态生成的，需要保存） */
  exam: Exam
}

export interface LoopState {
  chapterId: string
  chapterTitle: string
  round: number
  status: 'exam' | 'remedial' | 'mastered'
  roundIds: string[]
  weakPointIds: string[]
  updatedAt: number
}

export interface AppData {
  rounds: Record<string, Round>
  loops: Record<string, LoopState>
  /** 课件学习进度：pointId -> 完成时间 */
  studied: Record<string, number>
}

// ---------- 书籍索引 ----------
export interface BookUnit {
  id: string
  category: string
  no: string
  title: string
  kind: string
  printedStart: number
  printedEnd: number
  pdfStart: number
  pdfEnd: number
  chars: number
  textFile: string
}

export interface BookIndex {
  book: string
  author: string
  pdfPages: number
  printedToPdfOffset: number
  units: BookUnit[]
}

// ---------- 批改结果 ----------
export interface GradeResult {
  correct: boolean
  score: number
  errorTags: string[]
  errorReason: string
  /** 已交手写照片，文字框不能单独作为批改依据 */
  photoPending?: boolean
}
