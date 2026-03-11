// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  DARK_THEME_COLOR,
  LIGHT_THEME_COLOR,
  THEME_PREFERENCE_KEY,
  applyThemePreference,
  getStoredThemePreference,
  setThemePreference,
} from "@/lib/theme"

function installMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
}

describe("theme settings", () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.className = ""
    document.documentElement.removeAttribute("data-theme-preference")
    document.documentElement.style.colorScheme = ""
    document.head.innerHTML = '<meta name="theme-color" content="#1157a6">'
    installMatchMedia(false)
  })

  it("defaults to the system preference when no value is stored", () => {
    expect(getStoredThemePreference()).toBe("system")
  })

  it("ignores malformed stored values", () => {
    window.localStorage.setItem(THEME_PREFERENCE_KEY, "sepia")

    expect(getStoredThemePreference()).toBe("system")
  })

  it("stores and applies a dark theme preference", () => {
    setThemePreference("dark")

    expect(window.localStorage.getItem(THEME_PREFERENCE_KEY)).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.dataset.themePreference).toBe("dark")
    expect(document.documentElement.style.colorScheme).toBe("dark")
    expect(
      document.querySelector('meta[name="theme-color"]')?.getAttribute("content")
    ).toBe(DARK_THEME_COLOR)
  })

  it("uses the system preference when the setting is system", () => {
    installMatchMedia(true)

    const resolvedTheme = applyThemePreference("system")

    expect(resolvedTheme).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(
      document.querySelector('meta[name="theme-color"]')?.getAttribute("content")
    ).toBe(DARK_THEME_COLOR)
  })

  it("applies light colors when the system preference is light", () => {
    const resolvedTheme = applyThemePreference("system")

    expect(resolvedTheme).toBe("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(
      document.querySelector('meta[name="theme-color"]')?.getAttribute("content")
    ).toBe(LIGHT_THEME_COLOR)
  })
})
