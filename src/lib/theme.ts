export const THEME_SETTINGS_EVENT = "pushup-theme-changed"
export const THEME_PREFERENCE_KEY = "daily-pushup-counter:theme-preference"
export const LIGHT_THEME_COLOR = "#dceeff"
export const DARK_THEME_COLOR = "#101828"
export const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)"

export type ThemePreference = "system" | "light" | "dark"
export type ResolvedTheme = "light" | "dark"
type MediaQueryListWithLegacyListeners = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
}

function canUseBrowserApis() {
  return typeof window !== "undefined"
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark"
}

function dispatchThemeSettingsEvent() {
  if (!canUseBrowserApis()) {
    return
  }

  window.dispatchEvent(new Event(THEME_SETTINGS_EVENT))
}

function updateThemeColorMeta(resolvedTheme: ResolvedTheme) {
  if (typeof document === "undefined") {
    return
  }

  const themeColorMeta = document.querySelector('meta[name="theme-color"]')

  if (themeColorMeta instanceof HTMLMetaElement) {
    themeColorMeta.content =
      resolvedTheme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR
  }
}

export function getStoredThemePreference(): ThemePreference {
  if (!canUseBrowserApis()) {
    return "system"
  }

  const storedValue = window.localStorage.getItem(THEME_PREFERENCE_KEY)

  return isThemePreference(storedValue) ? storedValue : "system"
}

export function getSystemTheme(): ResolvedTheme {
  if (!canUseBrowserApis() || !("matchMedia" in window)) {
    return "light"
  }

  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? "dark" : "light"
}

export function resolveThemePreference(
  preference: ThemePreference
): ResolvedTheme {
  return preference === "system" ? getSystemTheme() : preference
}

export function applyThemePreference(
  preference = getStoredThemePreference()
): ResolvedTheme {
  const resolvedTheme = resolveThemePreference(preference)

  if (typeof document === "undefined") {
    return resolvedTheme
  }

  const root = document.documentElement

  root.classList.toggle("dark", resolvedTheme === "dark")
  root.dataset.themePreference = preference
  root.style.colorScheme = resolvedTheme
  updateThemeColorMeta(resolvedTheme)

  return resolvedTheme
}

export function setThemePreference(preference: ThemePreference) {
  if (!canUseBrowserApis()) {
    return "light" as ResolvedTheme
  }

  window.localStorage.setItem(THEME_PREFERENCE_KEY, preference)
  const resolvedTheme = applyThemePreference(preference)
  dispatchThemeSettingsEvent()
  return resolvedTheme
}

export function isThemeStorageKey(key: string | null) {
  return key === THEME_PREFERENCE_KEY
}

export function subscribeToSystemThemeChange(listener: () => void) {
  if (!canUseBrowserApis() || !("matchMedia" in window)) {
    return () => {}
  }

  const mediaQuery = window.matchMedia(
    SYSTEM_THEME_QUERY
  ) as MediaQueryListWithLegacyListeners
  const handleChange = () => {
    listener()
  }

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleChange)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }

  if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(handleChange)
  }

  return () => {
    if (typeof mediaQuery.removeListener === "function") {
      mediaQuery.removeListener(handleChange)
    }
  }
}

export function getThemeInitializationScript() {
  return `
    (() => {
      const key = "${THEME_PREFERENCE_KEY}";
      const darkClass = "dark";
      const darkQuery = "${SYSTEM_THEME_QUERY}";
      const lightColor = "${LIGHT_THEME_COLOR}";
      const darkColor = "${DARK_THEME_COLOR}";
      const storedValue = window.localStorage.getItem(key);
      const preference =
        storedValue === "light" || storedValue === "dark" || storedValue === "system"
          ? storedValue
          : "system";
      const resolvedTheme =
        preference === "system" && window.matchMedia(darkQuery).matches
          ? "dark"
          : preference === "system"
            ? "light"
            : preference;
      const root = document.documentElement;
      root.classList.toggle(darkClass, resolvedTheme === "dark");
      root.dataset.themePreference = preference;
      root.style.colorScheme = resolvedTheme;
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute(
          "content",
          resolvedTheme === "dark" ? darkColor : lightColor
        );
      }
    })();
  `
}
