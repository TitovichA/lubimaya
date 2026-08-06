export type Priority = 'low' | 'medium' | 'high'

export type HabitCategory =
  | 'Здоровье'
  | 'Красота'
  | 'Работа'
  | 'Дом'
  | 'Саморазвитие'
  | 'Финансы'
  | 'Отношения'
  | 'Другое'

export type LifeSphere =
  | 'здоровье'
  | 'отношения'
  | 'финансы'
  | 'развитие'
  | 'дом'
  | 'бизнес'
  | 'отдых'

export type LifeAreaId = 'home' | 'body' | 'business' | 'growth' | 'family'

export type RepeatRule =
  | { type: 'none' }
  | { type: 'daily' }
  | { type: 'weekly'; days: number[] }
  | { type: 'monthly'; day: number }
  | { type: 'everyNDays'; n: number }

export type Reminder = {
  id: string
  time: string
  enabled: boolean
  label?: string
}

export type RitualItem = {
  id: string
  title: string
  description?: string
  time?: string
  order: number
}

/** Воскресный ритуал — можно временно отключить (enabled: false) */
export type SundayRitual = {
  id: string
  title: string
  description?: string
  order: number
  enabled: boolean
}

export type DayRitualProgress = {
  date: string
  completedIds: string[]
}

export type Habit = {
  id: string
  title: string
  description?: string
  icon: string
  color: string
  category: HabitCategory
  targetPerDay?: number
  unit?: string
  createdAt: string
  completions: Record<string, number>
  linkedGoalId?: string
  reminders: Reminder[]
  projectId?: string
}

export type SubTask = {
  id: string
  title: string
  done: boolean
}

export type Task = {
  id: string
  title: string
  notes?: string
  priority: Priority
  color: string
  deadline?: string
  category?: string
  done: boolean
  doneAt?: string
  createdAt: string
  date: string
  subtasks: SubTask[]
  repeat: RepeatRule
  order: number
  reminders: Reminder[]
  projectId?: string
  areaId?: LifeAreaId
}

export type GoalMilestone = {
  id: string
  title: string
  targetValue: number
  done: boolean
}

export type GoalHistoryEntry = {
  date: string
  value: number
  note?: string
}

export type Goal = {
  id: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  targetValue: number
  currentValue: number
  unit: string
  color: string
  milestones: GoalMilestone[]
  history: GoalHistoryEntry[]
  linkedHabitIds: string[]
  reminders: Reminder[]
  projectId?: string
  sphere?: LifeSphere
  /** Цель сферы жизни — одна плашка на странице области */
  areaId?: LifeAreaId
}

export type NoteAttachment = {
  id: string
  name: string
  type: string
  dataUrl: string
  size: number
}

export type Note = {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
  attachments: NoteAttachment[]
  projectId?: string
  pinned?: boolean
}

export type Project = {
  id: string
  title: string
  description?: string
  color: string
  icon: string
  sphere?: LifeSphere
  createdAt: string
}

export type DayTemplate = {
  id: string
  name: string
  morningRitualIds: string[]
  eveningRitualIds: string[]
  habitIds: string[]
  color: string
}

export type DayLog = {
  date: string
  notes?: string
  mood?: number
  templateId?: string
}

export type Thought = {
  id: string
  text: string
  favorite: boolean
  order: number
}

export type AreaRule = {
  id: string
  areaId: LifeAreaId
  title: string
  order: number
}

export type AreaPlanItem = {
  id: string
  areaId: LifeAreaId
  title: string
  description?: string
  targetValue: number
  currentValue: number
  unit: string
  order: number
}

export type AreaHabit = {
  id: string
  areaId: LifeAreaId
  title: string
  description?: string
  order: number
  completions: Record<string, boolean>
  softOnCycle?: boolean
}

export type PeriodicRule =
  | { type: 'daily' }
  | { type: 'weekly'; weekday: number }
  | { type: 'biweekly'; weekday: number; anchorDate?: string }
  | { type: 'everyNDays'; n: number; anchorDate?: string }
  | { type: 'monthly'; day: number }
  | { type: 'monthlyLastDay' }
  | { type: 'nthWeekday'; n: number; weekday: number }
  | { type: 'everyNMonths'; n: number; day: number; anchorMonth?: number }
  | { type: 'yearly'; month: number; day: number }
  | { type: 'timesPerMonth'; count: number }

export type PeriodicHabit = {
  id: string
  areaId: LifeAreaId
  title: string
  description?: string
  rule: PeriodicRule
  completions: Record<string, boolean>
  softOnCycle?: boolean
}

export type CycleSettings = {
  enabled: boolean
  lastStartDate?: string
  cycleLength: number
  periodLength: number
}

export type TeamEvent = {
  id: string
  areaId: LifeAreaId
  personName: string
  type: 'vacation' | 'trip' | 'shift' | 'cover' | 'other'
  /** Для разового: начало периода. Для повтора: якорная дата (с которой действует правило) */
  startDate: string
  /** Для разового: конец периода. Для повтора обычно далёкая дата */
  endDate: string
  /** Если задано — событие повторяется по правилу (вместо одного интервала) */
  recurrence?: PeriodicRule
  note?: string
  coverHint?: string
}

export type BusinessRecurring = {
  id: string
  title: string
  rule: PeriodicRule
  completions: Record<string, boolean>
}

export type HomeWidget =
  | 'greeting'
  | 'thought'
  | 'quote'
  | 'progress'
  | 'morning'
  | 'habits'
  | 'evening'
  | 'tasks'
  | 'goals'
  | 'stats'
  | 'life'
  | 'ai'
  | 'areas'
  | 'todayDue'
  | 'sunday'

export type LifeBalance = Record<LifeSphere, number>

export type ChallengeSettings = {
  title: string
  startDate: string
  durationDays: number
}

export type ThemeMode = 'light' | 'dark'

export type UserSettings = {
  name: string
  greetingStyle: 'warm' | 'formal' | 'minimal'
  homeWidgets: HomeWidget[]
  hiddenWidgets: HomeWidget[]
  themeAccent: string
  themeMode: ThemeMode
  /** Автопереключение светлой/тёмной темы по времени суток */
  themeScheduleEnabled: boolean
  /** С какого времени включать светлую тему (HH:MM) */
  themeLightFrom: string
  /** С какого времени включать тёмную тему (HH:MM) */
  themeDarkFrom: string
  syncCode?: string
  syncUrl?: string
  lastSyncAt?: string
  notificationsEnabled: boolean
  weekStartsOn: 0 | 1
  thoughtByDate: Record<string, string>
  thoughtCycleShown: string[]
  sundayThoughtByDate: Record<string, string>
  sundayThoughtCycleShown: string[]
  cycle: CycleSettings
  challenge: ChallengeSettings
}

export type AppData = {
  version: number
  settings: UserSettings
  morningRitual: RitualItem[]
  eveningRitual: RitualItem[]
  morningProgress: DayRitualProgress[]
  eveningProgress: DayRitualProgress[]
  sundayRitual: SundayRitual[]
  sundayProgress: DayRitualProgress[]
  habits: Habit[]
  tasks: Task[]
  goals: Goal[]
  notes: Note[]
  projects: Project[]
  dayTemplates: DayTemplate[]
  dayLogs: DayLog[]
  thoughts: Thought[]
  sundayThoughts: Thought[]
  areaRules: AreaRule[]
  areaPlans: AreaPlanItem[]
  areaHabits: AreaHabit[]
  periodicHabits: PeriodicHabit[]
  businessEvents: BusinessRecurring[]
  teamEvents: TeamEvent[]
  lifeBalance: LifeBalance
  updatedAt: string
}

export type PageId =
  | 'home'
  | 'more'
  | 'morning'
  | 'evening'
  | 'sunday'
  | 'habits'
  | 'habit-detail'
  | 'tasks'
  | 'goals'
  | 'goal-detail'
  | 'stats'
  | 'calendar'
  | 'day'
  | 'notes'
  | 'note-detail'
  | 'projects'
  | 'project-detail'
  | 'life'
  | 'ai'
  | 'templates'
  | 'reviews'
  | 'search'
  | 'settings'
  | 'reminders'
  | 'thoughts'
  | 'area-home'
  | 'area-body'
  | 'area-business'
  | 'area-growth'
  | 'area-family'
