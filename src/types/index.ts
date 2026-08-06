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

export type HomeWidget =
  | 'greeting'
  | 'thought'
  | 'quote' // legacy alias
  | 'progress'
  | 'morning'
  | 'habits'
  | 'evening'
  | 'tasks'
  | 'goals'
  | 'stats'
  | 'life'
  | 'ai'

export type LifeBalance = Record<LifeSphere, number>

export type UserSettings = {
  name: string
  greetingStyle: 'warm' | 'formal' | 'minimal'
  homeWidgets: HomeWidget[]
  hiddenWidgets: HomeWidget[]
  themeAccent: string
  syncCode?: string
  syncUrl?: string
  lastSyncAt?: string
  notificationsEnabled: boolean
  weekStartsOn: 0 | 1
  thoughtByDate: Record<string, string>
  thoughtCycleShown: string[]
}

export type AppData = {
  version: number
  settings: UserSettings
  morningRitual: RitualItem[]
  eveningRitual: RitualItem[]
  morningProgress: DayRitualProgress[]
  eveningProgress: DayRitualProgress[]
  habits: Habit[]
  tasks: Task[]
  goals: Goal[]
  notes: Note[]
  projects: Project[]
  dayTemplates: DayTemplate[]
  dayLogs: DayLog[]
  thoughts: Thought[]
  lifeBalance: LifeBalance
  updatedAt: string
}

export type PageId =
  | 'home'
  | 'more'
  | 'morning'
  | 'evening'
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
