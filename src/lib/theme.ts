import type { ThemeMode, UserSettings } from '../types'

/** "HH:MM" → минуты от полуночи */
export function timeToMinutes(hhmm: string): number {
  const [h, m] = (hhmm || '00:00').split(':').map((x) => Number(x) || 0)
  return Math.min(23, Math.max(0, h)) * 60 + Math.min(59, Math.max(0, m))
}

/**
 * Светлая тема с lightFrom до darkFrom, иначе тёмная.
 * Пример: light 07:00, dark 21:00 → день светлый, ночь тёмная.
 */
export function themeForClock(
  now: Date,
  lightFrom: string,
  darkFrom: string,
): ThemeMode {
  const mins = now.getHours() * 60 + now.getMinutes()
  const light = timeToMinutes(lightFrom || '07:00')
  const dark = timeToMinutes(darkFrom || '21:00')

  if (light === dark) return 'light'

  if (light < dark) {
    // обычный день: light..dark → светлая
    return mins >= light && mins < dark ? 'light' : 'dark'
  }
  // переход через полночь для светлой (редко): light..24 и 0..dark
  return mins >= light || mins < dark ? 'light' : 'dark'
}

export function resolveEffectiveTheme(
  settings: Pick<
    UserSettings,
    'themeMode' | 'themeScheduleEnabled' | 'themeLightFrom' | 'themeDarkFrom'
  >,
  now = new Date(),
): ThemeMode {
  if (settings.themeScheduleEnabled) {
    return themeForClock(now, settings.themeLightFrom || '07:00', settings.themeDarkFrom || '21:00')
  }
  return settings.themeMode === 'dark' ? 'dark' : 'light'
}

export function themeScheduleLabel(
  settings: Pick<UserSettings, 'themeLightFrom' | 'themeDarkFrom'>,
  now = new Date(),
): string {
  const mode = themeForClock(now, settings.themeLightFrom || '07:00', settings.themeDarkFrom || '21:00')
  const until =
    mode === 'light'
      ? settings.themeDarkFrom || '21:00'
      : settings.themeLightFrom || '07:00'
  return mode === 'light'
    ? `Сейчас светлая тема (до ${until})`
    : `Сейчас тёмная тема (до ${until})`
}
