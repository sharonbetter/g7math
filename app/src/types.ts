import type { ExplainScene } from './lib/explain'
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
  /** 思路引导（静态变式预生成 / 动态变式随题生成） */
  guidance?: string
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
  /** 思路引导（启发式讲法，逐题生成；缺省时前端回退模板版） */
  guidance?: string
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
  /** 本题使用了「思路点拨」 */
  hintUsed?: boolean
  /** 本题通过「回炉券」用同构变式重做过（value 为重做后的作答） */
  retried?: boolean
  /** 回炉前的原始作答 */
  retriedFrom?: string
}

export type RoundKind = 'exam' | 'remedial' | 'practice'

/** Boss 战的准备与战中增益（能量购买，全部留痕、不影响判分规则） */
export interface RoundBuffs {
  /** 侦察卷：考前已看过卷面结构情报 */
  intel?: boolean
  /** 思路点拨剩余次数 */
  hints: number
  /** 回炉券剩余张数 */
  retries: number
  /** 时间沙漏剩余个（对指定题隐藏计时、不标记超时） */
  hourglasses: number
  /** 已使用思路点拨的题 */
  hintUsed?: string[]
  /** 已使用回炉券的题 */
  retried?: string[]
  /** 已使用时间沙漏的题 */
  hourglassUsed?: string[]
}

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
  /** 战前准备与战中增益（能量购买，留痕） */
  buffs?: RoundBuffs
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

/** 单题讲解课件（报告页点击生成后持久保存，可反复查看） */
export interface QuestionExplain {
  questionId: string
  roundId: string
  createdAt: number
  userAnswer: string
  /** 生成时固化的场景模型（含讲解词与分步内容） */
  scenes: ExplainScene[]
}

export interface AppData {
  rounds: Record<string, Round>
  loops: Record<string, LoopState>
  /** 课件学习进度：pointId -> 完成时间 */
  studied: Record<string, number>
  /** 闪耀点亮：pointId -> 课末微战全对首过的时刻（+5 XP） */
  perfected?: Record<string, number>
  /** 能量余额：通过计算副本（首次通过 +2）、错题回炉（+3）与能量石（+1）获得，用于战前准备 */
  energy?: number
  /** 已结算的能量石矿：gemId -> 采到块数（题目内容由全书题池派生，不另存） */
  gems?: Record<string, number>
  /** 毛栗装备：已拥有与穿戴 */
  outfits?: { owned?: string[]; hat?: string; shoes?: string; clothes?: string }
  /** 计算专项进度：trainingId -> 完成记录 */
  calcDone?: Record<string, CalcRecord>
  /** 计算专项逐题明细：trainingId -> 历史批改快照（最新在后） */
  calcAttempts?: Record<string, CalcAttempt[]>
  /** 单题讲解课件：questionId -> 生成快照 */
  questionExplains?: Record<string, QuestionExplain>
}

// ---------- 课件讲解音频（gen-lesson-audio.ts 生成） ----------
/** 一页课件的音频信息：hs 与 d 按讲解步骤对齐 */
export interface AudioStepMeta {
  /** 每步讲解词的文本哈希（内容变了才重新合成） */
  hs: string[]
  /** 每步音频时长（毫秒），0 表示该步无音频 */
  d: number[]
}

export interface AudioManifest {
  generatedAt: string
  voice: string
  chapters: Record<string, Record<string, { slides: AudioStepMeta[] }>>
}

// ---------- 计算专项（《一本·计算题满分训练》同构题库） ----------
/** 典型错答：批改时反查用户错答，诊断错因 */
export interface CalcCommonWrong {
  answer: string
  reason: string
  skill?: string | null
}

/** 同类型变式题：错题/超时题的专项练习轮使用 */
export interface CalcVariant {
  stem: string
  answer: string
  acceptedAnswers: string[]
  estimatedSeconds: number
  skill?: string | null
  commonWrong?: CalcCommonWrong[]
}

export interface CalcQuestion {
  id: string
  stem: string
  answer: string
  acceptedAnswers: string[]
  estimatedSeconds: number
  /** 考查技能 key（用于薄弱点聚合与定向专练） */
  skill?: string | null
  commonWrong?: CalcCommonWrong[]
  variants?: CalcVariant[]
}

export interface CalcTraining {
  id: string
  no: number
  title: string
  moduleId: string
  /** 关联的教材章节，如 7a-c2 */
  chapterId: string
  difficulty: number
  minutes: number
  sourcePage: number
  questions: CalcQuestion[]
}

export interface CalcModule {
  id: string
  name: string
  range: [number, number]
  chapterId: string
  chapterTitle: string
}

export interface CalcPoolQuestion {
  stem: string
  answer: string
  acceptedAnswers: string[]
  estimatedSeconds: number
  skill?: string | null
  commonWrong?: CalcCommonWrong[]
}

export interface CalcBook {
  modules: CalcModule[]
  trainings: CalcTraining[]
  skillNames?: Record<string, string>
  skillPools?: Record<string, CalcPoolQuestion[]>
}

/** 计算专项完成记录 */
export interface CalcRecord {
  /** 最佳正确数 */
  best: number
  total: number
  doneAt: number
  count: number
  /** 全对且无超时（含专项练习轮）后为真 */
  passed?: boolean
  /** 通过所用的总轮次（1 = 首轮直接通过） */
  passRounds?: number
}

/** 计算专项一轮作答的逐题明细快照 */
export interface CalcAttemptItem {
  /** 题号（训练内） */
  no: number
  stem: string
  userAnswer: string
  answer: string
  correct: boolean
  slow: boolean
  /** 实际用时 ms */
  ms: number
  /** 预计用时 s */
  est: number
  /** 错因（由典型错答反查诊断） */
  errorTag?: string
  /** 薄弱技能 key */
  skill?: string | null
}

export interface CalcAttempt {
  /** 0 = 首轮，1..n = 专项练习轮 */
  round: number
  finishedAt: number
  totalMs: number
  correct: number
  total: number
  items: CalcAttemptItem[]
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
