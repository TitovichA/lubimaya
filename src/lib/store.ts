import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type {
  AppData,
  Habit,
  Task,
  Goal,
  Note,
  Project,
  RitualItem,
  DayTemplate,
  PageId,
  Reminder,
  HomeWidget,
  LifeBalance,
  Thought,
  LifeAreaId,
  AreaRule,
  AreaPlanItem,
  AreaHabit,
  PeriodicHabit,
  BusinessRecurring,
  TeamEvent,
  CycleSettings,
  ChallengeSettings,
} from '../types'
import { createSeedData, todayKey } from './seed'
import { createThoughtsSeed, pickThoughtForDate } from './thoughts'
import { defaultChallenge } from './challenge'
import { loadLocal, saveLocal, getSyncMeta, setSyncMeta, pushCloud, pullCloud, mergeData, createSyncCode, deviceId } from './sync'

type NavState = {
  page: PageId
  selectedId?: string
  selectedDate: string
}

type Store = {
  data: AppData
  nav: NavState
  syncing: boolean
  syncError?: string
  hydrated: boolean
  init: () => void
  persist: () => void
  setPage: (page: PageId, selectedId?: string) => void
  setSelectedDate: (date: string) => void
  updateSettings: (patch: Partial<AppData['settings']>) => void
  // rituals
  toggleRitual: (type: 'morning' | 'evening', id: string, date?: string) => void
  addRitual: (type: 'morning' | 'evening', item: Omit<RitualItem, 'id' | 'order'>) => void
  updateRitual: (type: 'morning' | 'evening', id: string, patch: Partial<RitualItem>) => void
  deleteRitual: (type: 'morning' | 'evening', id: string) => void
  reorderRituals: (type: 'morning' | 'evening', ids: string[]) => void
  // habits
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => void
  updateHabit: (id: string, patch: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  completeHabit: (id: string, amount?: number, date?: string) => void
  toggleHabitDone: (id: string, date?: string) => void
  // tasks
  addTask: (task: Partial<Task> & { title: string }) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  reorderTasks: (ids: string[]) => void
  // goals
  addGoal: (goal: Omit<Goal, 'id' | 'history' | 'currentValue'> & { currentValue?: number }) => void
  updateGoal: (id: string, patch: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  incrementGoal: (id: string, by?: number, note?: string) => void
  // notes
  addNote: (note?: Partial<Note>) => string
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
  // projects
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void
  // templates
  addTemplate: (tpl: Omit<DayTemplate, 'id'>) => void
  updateTemplate: (id: string, patch: Partial<DayTemplate>) => void
  deleteTemplate: (id: string) => void
  applyTemplate: (id: string, date?: string) => void
  // life
  setLifeBalance: (balance: LifeBalance) => void
  setHomeWidgets: (widgets: HomeWidget[]) => void
  // day log
  setDayNote: (date: string, notes: string) => void
  setDayMood: (date: string, mood: number) => void
  // thoughts
  ensureThoughtOfDay: (date?: string) => Thought | null
  addThought: (text: string) => void
  updateThought: (id: string, patch: Partial<Thought>) => void
  deleteThought: (id: string) => void
  reorderThoughts: (ids: string[]) => void
  // areas
  addAreaRule: (areaId: LifeAreaId, title: string) => void
  updateAreaRule: (id: string, patch: Partial<AreaRule>) => void
  deleteAreaRule: (id: string) => void
  reorderAreaRules: (areaId: LifeAreaId, ids: string[]) => void
  addAreaPlan: (item: Omit<AreaPlanItem, 'id'>) => void
  updateAreaPlan: (id: string, patch: Partial<AreaPlanItem>) => void
  deleteAreaPlan: (id: string) => void
  addAreaHabit: (areaId: LifeAreaId, title: string) => void
  toggleAreaHabit: (id: string, date?: string) => void
  updateAreaHabit: (id: string, patch: Partial<AreaHabit>) => void
  deleteAreaHabit: (id: string) => void
  addPeriodicHabit: (item: Omit<PeriodicHabit, 'id' | 'completions'>) => void
  togglePeriodicHabit: (id: string, date?: string) => void
  updatePeriodicHabit: (id: string, patch: Partial<PeriodicHabit>) => void
  deletePeriodicHabit: (id: string) => void
  addBusinessEvent: (item: Omit<BusinessRecurring, 'id' | 'completions'>) => void
  toggleBusinessEvent: (id: string, date?: string) => void
  deleteBusinessEvent: (id: string) => void
  addTeamEvent: (item: Omit<TeamEvent, 'id'>) => void
  updateTeamEvent: (id: string, patch: Partial<TeamEvent>) => void
  deleteTeamEvent: (id: string) => void
  pruneTeamCalendar: () => void
  updateCycle: (patch: Partial<CycleSettings>) => void
  updateChallenge: (patch: Partial<ChallengeSettings>) => void
  // sync
  enableSync: () => Promise<string>
  joinSync: (blobId: string) => Promise<void>
  syncNow: () => Promise<void>
  replaceData: (data: AppData) => void
}

function migrateData(raw: AppData): AppData {
  const seed = createSeedData()
  const widgets = (raw.settings?.homeWidgets || seed.settings.homeWidgets).map((w) =>
    w === 'quote' ? 'thought' : w,
  ) as AppData['settings']['homeWidgets']
  const mergedWidgets = [...new Set([...widgets, 'areas', 'todayDue'])] as HomeWidget[]
  return {
    ...seed,
    ...raw,
    version: Math.max(raw.version || 1, 3),
    settings: {
      ...seed.settings,
      ...raw.settings,
      homeWidgets: mergedWidgets,
      thoughtByDate: raw.settings?.thoughtByDate || {},
      thoughtCycleShown: raw.settings?.thoughtCycleShown || [],
      cycle: { ...seed.settings.cycle, ...raw.settings?.cycle },
      challenge: {
        ...defaultChallenge(todayKey()),
        ...seed.settings.challenge,
        ...raw.settings?.challenge,
      },
    },
    thoughts: raw.thoughts?.length ? raw.thoughts : createThoughtsSeed(),
    areaRules: raw.areaRules?.length ? raw.areaRules : seed.areaRules,
    areaPlans: raw.areaPlans?.length ? raw.areaPlans : seed.areaPlans,
    areaHabits: raw.areaHabits?.length ? raw.areaHabits : seed.areaHabits,
    periodicHabits: [],
    businessEvents: raw.businessEvents?.length ? raw.businessEvents : seed.businessEvents,
    teamEvents: migrateTeamEvents(raw, seed),
  }
}

const FAR_END = '9999-12-31'

function migrateTeamEvents(
  raw: Partial<AppData> & { teamEvents?: TeamEvent[]; periodicHabits?: PeriodicHabit[] },
  seed: AppData,
): TeamEvent[] {
  const base = (raw.teamEvents ?? seed.teamEvents).map((e) => ({
    ...e,
    areaId: e.areaId || ('business' as LifeAreaId),
  }))
  const ids = new Set(base.map((e) => e.id))
  const fromHabits = (raw.periodicHabits || []).flatMap((h) => {
    const id = `from-ph-${h.id}`
    if (ids.has(id)) return []
    const already = base.some(
      (e) => e.areaId === h.areaId && e.personName === h.title && e.recurrence?.type === h.rule.type,
    )
    if (already) return []
    const anchor =
      ('anchorDate' in h.rule && h.rule.anchorDate) || todayKey()
    return [
      {
        id,
        areaId: h.areaId,
        personName: h.title,
        type: 'other' as const,
        startDate: anchor,
        endDate: FAR_END,
        recurrence: h.rule,
      },
    ]
  })
  return [...base, ...fromHabits]
}

/** Удаляет разовые события после даты окончания; повторяющиеся сохраняются */
export function pruneExpiredTeamEvents(data: AppData, date = todayKey()): AppData {
  const list = data.teamEvents || []
  const next = list.filter((e) => e.recurrence || e.endDate >= date)
  if (next.length === list.length) return data
  return { ...data, teamEvents: next, updatedAt: new Date().toISOString() }
}

function bumpLinkedGoals(data: AppData, habitId: string, date: string): AppData {
  const habit = data.habits.find((h) => h.id === habitId)
  if (!habit?.linkedGoalId) return data
  const goal = data.goals.find((g) => g.id === habit.linkedGoalId)
  if (!goal) return data
  const already = goal.history.some((h) => h.date === date && h.note === `habit:${habitId}`)
  if (already) return data
  const currentValue = Math.min(goal.targetValue, goal.currentValue + 1)
  return {
    ...data,
    goals: data.goals.map((g) =>
      g.id === goal.id
        ? {
            ...g,
            currentValue,
            history: [...g.history, { date, value: currentValue, note: `habit:${habitId}` }],
            milestones: g.milestones.map((m) => ({
              ...m,
              done: currentValue >= m.targetValue,
            })),
          }
        : g,
    ),
  }
}

export const useAppStore = create<Store>((set, get) => ({
  data: createSeedData(),
  nav: { page: 'home', selectedDate: todayKey() },
  syncing: false,
  hydrated: false,

  init: () => {
    const local = loadLocal()
    if (local) {
      const migrated = pruneExpiredTeamEvents(migrateData(local))
      set({ data: migrated, hydrated: true })
      saveLocal(migrated)
    } else {
      const seed = createSeedData()
      saveLocal(seed)
      set({ data: seed, hydrated: true })
    }
  },

  persist: () => {
    const saved = saveLocal(get().data)
    set({ data: saved })
  },

  setPage: (page, selectedId) => {
    const pruned = pruneExpiredTeamEvents(get().data)
    if (pruned !== get().data) {
      set({ data: pruned, nav: { ...get().nav, page, selectedId } })
      get().persist()
    } else {
      set({ nav: { ...get().nav, page, selectedId } })
    }
  },
  setSelectedDate: (date) => set({ nav: { ...get().nav, selectedDate: date } }),

  updateSettings: (patch) => {
    set({ data: { ...get().data, settings: { ...get().data.settings, ...patch } } })
    get().persist()
  },

  toggleRitual: (type, id, date = todayKey()) => {
    const key = type === 'morning' ? 'morningProgress' : 'eveningProgress'
    const list = [...get().data[key]]
    const idx = list.findIndex((p) => p.date === date)
    const current = idx >= 0 ? list[idx] : { date, completedIds: [] as string[] }
    const has = current.completedIds.includes(id)
    const completedIds = has
      ? current.completedIds.filter((x) => x !== id)
      : [...current.completedIds, id]
    const nextEntry = { date, completedIds }
    if (idx >= 0) list[idx] = nextEntry
    else list.push(nextEntry)
    set({ data: { ...get().data, [key]: list } })
    get().persist()
  },

  addRitual: (type, item) => {
    const key = type === 'morning' ? 'morningRitual' : 'eveningRitual'
    const items = get().data[key]
    const next: RitualItem = { ...item, id: uuid(), order: items.length }
    set({ data: { ...get().data, [key]: [...items, next] } })
    get().persist()
  },

  updateRitual: (type, id, patch) => {
    const key = type === 'morning' ? 'morningRitual' : 'eveningRitual'
    set({
      data: {
        ...get().data,
        [key]: get().data[key].map((r) => (r.id === id ? { ...r, ...patch } : r)),
      },
    })
    get().persist()
  },

  deleteRitual: (type, id) => {
    const key = type === 'morning' ? 'morningRitual' : 'eveningRitual'
    set({ data: { ...get().data, [key]: get().data[key].filter((r) => r.id !== id) } })
    get().persist()
  },

  reorderRituals: (type, ids) => {
    const key = type === 'morning' ? 'morningRitual' : 'eveningRitual'
    const map = new Map(get().data[key].map((r) => [r.id, r]))
    const reordered = ids.map((id, order) => ({ ...map.get(id)!, order }))
    set({ data: { ...get().data, [key]: reordered } })
    get().persist()
  },

  addHabit: (habit) => {
    const next: Habit = {
      ...habit,
      id: uuid(),
      createdAt: new Date().toISOString(),
      completions: {},
      reminders: habit.reminders ?? [],
    }
    set({ data: { ...get().data, habits: [...get().data.habits, next] } })
    get().persist()
  },

  updateHabit: (id, patch) => {
    set({
      data: {
        ...get().data,
        habits: get().data.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      },
    })
    get().persist()
  },

  deleteHabit: (id) => {
    set({ data: { ...get().data, habits: get().data.habits.filter((h) => h.id !== id) } })
    get().persist()
  },

  completeHabit: (id, amount = 1, date = todayKey()) => {
    let data = get().data
    data = {
      ...data,
      habits: data.habits.map((h) => {
        if (h.id !== id) return h
        const prev = h.completions[date] ?? 0
        const target = h.targetPerDay ?? 1
        // Уже выполнена сегодня — снять отметку (обнулить)
        if (prev >= target && amount > 0) {
          return { ...h, completions: { ...h.completions, [date]: 0 } }
        }
        const nextVal = Math.max(0, prev + amount)
        return { ...h, completions: { ...h.completions, [date]: nextVal } }
      }),
    }
    const habit = data.habits.find((h) => h.id === id)
    const target = habit?.targetPerDay ?? 1
    if (habit && (habit.completions[date] ?? 0) >= target) {
      data = bumpLinkedGoals(data, id, date)
    }
    set({ data })
    get().persist()
  },

  /** Явно отметить выполненной / снять отметку за день */
  toggleHabitDone: (id, date = todayKey()) => {
    const habit = get().data.habits.find((h) => h.id === id)
    if (!habit) return
    const target = habit.targetPerDay ?? 1
    const prev = habit.completions[date] ?? 0
    let data = get().data
    const nextVal = prev >= target ? 0 : target
    data = {
      ...data,
      habits: data.habits.map((h) =>
        h.id === id ? { ...h, completions: { ...h.completions, [date]: nextVal } } : h,
      ),
    }
    if (nextVal >= target) {
      data = bumpLinkedGoals(data, id, date)
    }
    set({ data })
    get().persist()
  },

  addTask: (task) => {
    const next: Task = {
      id: uuid(),
      title: task.title,
      notes: task.notes,
      priority: task.priority ?? 'medium',
      color: task.color ?? '#C4A574',
      deadline: task.deadline,
      category: task.category,
      done: false,
      createdAt: new Date().toISOString(),
      date: task.date ?? todayKey(),
      subtasks: task.subtasks ?? [],
      repeat: task.repeat ?? { type: 'none' },
      order: get().data.tasks.length,
      reminders: task.reminders ?? [],
      projectId: task.projectId,
      areaId: task.areaId,
    }
    set({ data: { ...get().data, tasks: [...get().data.tasks, next] } })
    get().persist()
  },

  updateTask: (id, patch) => {
    set({
      data: {
        ...get().data,
        tasks: get().data.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      },
    })
    get().persist()
  },

  deleteTask: (id) => {
    set({ data: { ...get().data, tasks: get().data.tasks.filter((t) => t.id !== id) } })
    get().persist()
  },

  toggleTask: (id) => {
    set({
      data: {
        ...get().data,
        tasks: get().data.tasks.map((t) =>
          t.id === id
            ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined }
            : t,
        ),
      },
    })
    get().persist()
  },

  reorderTasks: (ids) => {
    const map = new Map(get().data.tasks.map((t) => [t.id, t]))
    const others = get().data.tasks.filter((t) => !ids.includes(t.id))
    const reordered = ids.map((id, order) => ({ ...map.get(id)!, order }))
    set({ data: { ...get().data, tasks: [...reordered, ...others] } })
    get().persist()
  },

  addGoal: (goal) => {
    const next: Goal = {
      ...goal,
      id: uuid(),
      currentValue: goal.currentValue ?? 0,
      history: [],
      milestones: goal.milestones ?? [],
      linkedHabitIds: goal.linkedHabitIds ?? [],
      reminders: goal.reminders ?? [],
    }
    set({ data: { ...get().data, goals: [...get().data.goals, next] } })
    get().persist()
  },

  updateGoal: (id, patch) => {
    set({
      data: {
        ...get().data,
        goals: get().data.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
      },
    })
    get().persist()
  },

  deleteGoal: (id) => {
    set({ data: { ...get().data, goals: get().data.goals.filter((g) => g.id !== id) } })
    get().persist()
  },

  incrementGoal: (id, by = 1, note) => {
    const date = todayKey()
    set({
      data: {
        ...get().data,
        goals: get().data.goals.map((g) => {
          if (g.id !== id) return g
          const currentValue = Math.max(0, Math.min(g.targetValue, g.currentValue + by))
          return {
            ...g,
            currentValue,
            history: [...g.history, { date, value: currentValue, note }],
            milestones: g.milestones.map((m) => ({
              ...m,
              done: currentValue >= m.targetValue,
            })),
          }
        }),
      },
    })
    get().persist()
  },

  addNote: (note) => {
    const id = uuid()
    const now = new Date().toISOString()
    const next: Note = {
      id,
      title: note?.title ?? 'Новая заметка',
      content: note?.content ?? '',
      tags: note?.tags ?? [],
      createdAt: now,
      updatedAt: now,
      attachments: note?.attachments ?? [],
      projectId: note?.projectId,
      pinned: note?.pinned,
    }
    set({ data: { ...get().data, notes: [next, ...get().data.notes] } })
    get().persist()
    return id
  },

  updateNote: (id, patch) => {
    set({
      data: {
        ...get().data,
        notes: get().data.notes.map((n) =>
          n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
        ),
      },
    })
    get().persist()
  },

  deleteNote: (id) => {
    set({ data: { ...get().data, notes: get().data.notes.filter((n) => n.id !== id) } })
    get().persist()
  },

  addProject: (project) => {
    const next: Project = { ...project, id: uuid(), createdAt: new Date().toISOString() }
    set({ data: { ...get().data, projects: [...get().data.projects, next] } })
    get().persist()
  },

  updateProject: (id, patch) => {
    set({
      data: {
        ...get().data,
        projects: get().data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      },
    })
    get().persist()
  },

  deleteProject: (id) => {
    set({ data: { ...get().data, projects: get().data.projects.filter((p) => p.id !== id) } })
    get().persist()
  },

  addTemplate: (tpl) => {
    set({ data: { ...get().data, dayTemplates: [...get().data.dayTemplates, { ...tpl, id: uuid() }] } })
    get().persist()
  },

  updateTemplate: (id, patch) => {
    set({
      data: {
        ...get().data,
        dayTemplates: get().data.dayTemplates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      },
    })
    get().persist()
  },

  deleteTemplate: (id) => {
    set({ data: { ...get().data, dayTemplates: get().data.dayTemplates.filter((t) => t.id !== id) } })
    get().persist()
  },

  applyTemplate: (id, date = todayKey()) => {
    const logs = [...get().data.dayLogs]
    const idx = logs.findIndex((l) => l.date === date)
    const entry = { date, templateId: id, notes: idx >= 0 ? logs[idx].notes : undefined }
    if (idx >= 0) logs[idx] = { ...logs[idx], ...entry }
    else logs.push(entry)
    set({ data: { ...get().data, dayLogs: logs } })
    get().persist()
  },

  setLifeBalance: (balance) => {
    set({ data: { ...get().data, lifeBalance: balance } })
    get().persist()
  },

  setHomeWidgets: (widgets) => {
    get().updateSettings({ homeWidgets: widgets })
  },

  setDayNote: (date, notes) => {
    const logs = [...get().data.dayLogs]
    const idx = logs.findIndex((l) => l.date === date)
    if (idx >= 0) logs[idx] = { ...logs[idx], notes }
    else logs.push({ date, notes })
    set({ data: { ...get().data, dayLogs: logs } })
    get().persist()
  },

  setDayMood: (date, mood) => {
    const logs = [...get().data.dayLogs]
    const idx = logs.findIndex((l) => l.date === date)
    if (idx >= 0) logs[idx] = { ...logs[idx], mood }
    else logs.push({ date, mood })
    set({ data: { ...get().data, dayLogs: logs } })
    get().persist()
  },

  ensureThoughtOfDay: (date = todayKey()) => {
    const data = get().data
    const result = pickThoughtForDate(
      data.thoughts,
      data.settings.thoughtByDate || {},
      data.settings.thoughtCycleShown || [],
      date,
    )
    if (
      result.thought &&
      (data.settings.thoughtByDate?.[date] !== result.thought.id ||
        JSON.stringify(data.settings.thoughtCycleShown) !== JSON.stringify(result.cycleShown))
    ) {
      set({
        data: {
          ...data,
          settings: {
            ...data.settings,
            thoughtByDate: result.thoughtByDate,
            thoughtCycleShown: result.cycleShown,
          },
        },
      })
      get().persist()
    }
    return result.thought
  },

  addThought: (text) => {
    const thoughts = get().data.thoughts
    const next: Thought = {
      id: uuid(),
      text: text.trim(),
      favorite: false,
      order: thoughts.length,
    }
    set({ data: { ...get().data, thoughts: [...thoughts, next] } })
    get().persist()
  },

  updateThought: (id, patch) => {
    set({
      data: {
        ...get().data,
        thoughts: get().data.thoughts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      },
    })
    get().persist()
  },

  deleteThought: (id) => {
    set({ data: { ...get().data, thoughts: get().data.thoughts.filter((t) => t.id !== id) } })
    get().persist()
  },

  reorderThoughts: (ids) => {
    const map = new Map(get().data.thoughts.map((t) => [t.id, t]))
    set({
      data: {
        ...get().data,
        thoughts: ids.map((id, order) => ({ ...map.get(id)!, order })),
      },
    })
    get().persist()
  },

  addAreaRule: (areaId, title) => {
    const rules = get().data.areaRules || []
    const next: AreaRule = {
      id: uuid(),
      areaId,
      title: title.trim(),
      order: rules.filter((r) => r.areaId === areaId).length,
    }
    set({ data: { ...get().data, areaRules: [...rules, next] } })
    get().persist()
  },
  updateAreaRule: (id, patch) => {
    set({
      data: {
        ...get().data,
        areaRules: get().data.areaRules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      },
    })
    get().persist()
  },
  deleteAreaRule: (id) => {
    set({ data: { ...get().data, areaRules: get().data.areaRules.filter((r) => r.id !== id) } })
    get().persist()
  },
  reorderAreaRules: (areaId, ids) => {
    const others = get().data.areaRules.filter((r) => r.areaId !== areaId)
    const map = new Map(get().data.areaRules.map((r) => [r.id, r]))
    const reordered = ids.map((id, order) => ({ ...map.get(id)!, order }))
    set({ data: { ...get().data, areaRules: [...others, ...reordered] } })
    get().persist()
  },
  addAreaPlan: (item) => {
    set({ data: { ...get().data, areaPlans: [...(get().data.areaPlans || []), { ...item, id: uuid() }] } })
    get().persist()
  },
  updateAreaPlan: (id, patch) => {
    set({
      data: {
        ...get().data,
        areaPlans: get().data.areaPlans.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      },
    })
    get().persist()
  },
  deleteAreaPlan: (id) => {
    set({ data: { ...get().data, areaPlans: get().data.areaPlans.filter((p) => p.id !== id) } })
    get().persist()
  },
  addAreaHabit: (areaId, title) => {
    const habits = get().data.areaHabits || []
    const next: AreaHabit = {
      id: uuid(),
      areaId,
      title: title.trim(),
      order: habits.filter((h) => h.areaId === areaId).length,
      completions: {},
    }
    set({ data: { ...get().data, areaHabits: [...habits, next] } })
    get().persist()
  },
  toggleAreaHabit: (id, date = todayKey()) => {
    set({
      data: {
        ...get().data,
        areaHabits: get().data.areaHabits.map((h) =>
          h.id === id
            ? { ...h, completions: { ...h.completions, [date]: !h.completions[date] } }
            : h,
        ),
      },
    })
    get().persist()
  },
  updateAreaHabit: (id, patch) => {
    set({
      data: {
        ...get().data,
        areaHabits: get().data.areaHabits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      },
    })
    get().persist()
  },
  deleteAreaHabit: (id) => {
    set({ data: { ...get().data, areaHabits: get().data.areaHabits.filter((h) => h.id !== id) } })
    get().persist()
  },
  addPeriodicHabit: (item) => {
    set({
      data: {
        ...get().data,
        periodicHabits: [...(get().data.periodicHabits || []), { ...item, id: uuid(), completions: {} }],
      },
    })
    get().persist()
  },
  togglePeriodicHabit: (id, date = todayKey()) => {
    set({
      data: {
        ...get().data,
        periodicHabits: get().data.periodicHabits.map((h) =>
          h.id === id
            ? { ...h, completions: { ...h.completions, [date]: !h.completions[date] } }
            : h,
        ),
      },
    })
    get().persist()
  },
  updatePeriodicHabit: (id, patch) => {
    set({
      data: {
        ...get().data,
        periodicHabits: get().data.periodicHabits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      },
    })
    get().persist()
  },
  deletePeriodicHabit: (id) => {
    set({
      data: { ...get().data, periodicHabits: get().data.periodicHabits.filter((h) => h.id !== id) },
    })
    get().persist()
  },
  addBusinessEvent: (item) => {
    set({
      data: {
        ...get().data,
        businessEvents: [...(get().data.businessEvents || []), { ...item, id: uuid(), completions: {} }],
      },
    })
    get().persist()
  },
  toggleBusinessEvent: (id, date = todayKey()) => {
    set({
      data: {
        ...get().data,
        businessEvents: get().data.businessEvents.map((e) =>
          e.id === id
            ? { ...e, completions: { ...e.completions, [date]: !e.completions[date] } }
            : e,
        ),
      },
    })
    get().persist()
  },
  deleteBusinessEvent: (id) => {
    set({
      data: { ...get().data, businessEvents: get().data.businessEvents.filter((e) => e.id !== id) },
    })
    get().persist()
  },
  addTeamEvent: (item) => {
    set({
      data: { ...get().data, teamEvents: [...(get().data.teamEvents || []), { ...item, id: uuid() }] },
    })
    get().persist()
  },
  updateTeamEvent: (id, patch) => {
    set({
      data: {
        ...get().data,
        teamEvents: get().data.teamEvents.map((e) => {
          if (e.id !== id) return e
          const next = { ...e, ...patch }
          if ('recurrence' in patch && patch.recurrence === undefined) {
            delete next.recurrence
          }
          return next
        }),
      },
    })
    get().persist()
  },
  deleteTeamEvent: (id) => {
    set({ data: { ...get().data, teamEvents: get().data.teamEvents.filter((e) => e.id !== id) } })
    get().persist()
  },
  pruneTeamCalendar: () => {
    const pruned = pruneExpiredTeamEvents(get().data)
    if (pruned !== get().data) {
      set({ data: pruned })
      get().persist()
    }
  },
  updateCycle: (patch) => {
    get().updateSettings({ cycle: { ...get().data.settings.cycle, ...patch } })
  },
  updateChallenge: (patch) => {
    const current = get().data.settings.challenge || defaultChallenge()
    get().updateSettings({ challenge: { ...current, ...patch } })
  },

  enableSync: async () => {
    set({ syncing: true, syncError: undefined })
    try {
      const code = createSyncCode()
      const meta = await pushCloud(get().data, { code, deviceId: deviceId() })
      get().updateSettings({ syncCode: code, syncUrl: meta.blobId, lastSyncAt: meta.lastSyncAt })
      set({ syncing: false })
      return `${code}|${meta.blobId}`
    } catch (e) {
      set({ syncing: false, syncError: e instanceof Error ? e.message : 'Ошибка синхронизации' })
      throw e
    }
  },

  joinSync: async (token) => {
    set({ syncing: true, syncError: undefined })
    try {
      const [codePart, blobPart] = token.includes('|') ? token.split('|') : [undefined, token]
      const blobId = (blobPart || token).trim()
      const remote = await pullCloud(blobId)
      if (!remote) throw new Error('Облачные данные не найдены')
      const merged = mergeData(get().data, remote.data)
      const meta = {
        code: codePart || remote.code || createSyncCode(),
        blobId,
        deviceId: deviceId(),
        lastSyncAt: new Date().toISOString(),
      }
      setSyncMeta(meta)
      set({ data: merged })
      get().persist()
      get().updateSettings({
        syncCode: meta.code,
        syncUrl: blobId,
        lastSyncAt: meta.lastSyncAt,
      })
      await pushCloud(merged, meta)
      set({ syncing: false })
    } catch (e) {
      set({ syncing: false, syncError: e instanceof Error ? e.message : 'Ошибка подключения' })
      throw e
    }
  },

  syncNow: async () => {
    const meta = getSyncMeta() || {
      code: get().data.settings.syncCode || createSyncCode(),
      blobId: get().data.settings.syncUrl,
      deviceId: deviceId(),
    }
    if (!meta.blobId) {
      await get().enableSync()
      return
    }
    set({ syncing: true, syncError: undefined })
    try {
      const remote = await pullCloud(meta.blobId)
      let data = get().data
      if (remote) data = mergeData(data, remote.data)
      set({ data })
      get().persist()
      const next = await pushCloud(data, meta)
      get().updateSettings({ lastSyncAt: next.lastSyncAt, syncCode: next.code, syncUrl: next.blobId })
      set({ syncing: false })
    } catch (e) {
      set({ syncing: false, syncError: e instanceof Error ? e.message : 'Ошибка синхронизации' })
    }
  },

  replaceData: (data) => {
    set({ data })
    get().persist()
  },
}))

export function useReminders(): Reminder[] {
  const data = useAppStore((s) => s.data)
  const list: (Reminder & { source: string })[] = []
  data.habits.forEach((h) =>
    h.reminders.forEach((r) => list.push({ ...r, source: `Привычка: ${h.title}` })),
  )
  data.tasks.forEach((t) =>
    t.reminders.forEach((r) => list.push({ ...r, source: `Задача: ${t.title}` })),
  )
  data.goals.forEach((g) =>
    g.reminders.forEach((r) => list.push({ ...r, source: `Цель: ${g.title}` })),
  )
  return list
}
