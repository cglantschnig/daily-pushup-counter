// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

const cancelGeminiSpeechPlaybackMock = vi.hoisted(() => vi.fn())
const getGeminiCachedClipCountMock = vi.hoisted(() => vi.fn())
const isGeminiAudioPlaybackSupportedMock = vi.hoisted(() => vi.fn())
const playGeminiSpeechClipMock = vi.hoisted(() => vi.fn())
const primeGeminiSpeechClipsMock = vi.hoisted(() => vi.fn())

const easySpeechMock = vi.hoisted(() => ({
  detect: vi.fn(),
  init: vi.fn(),
  voices: vi.fn(),
  defaults: vi.fn(),
  speak: vi.fn(),
  cancel: vi.fn(),
}))

vi.mock("@/lib/gemini-live-audio", () => ({
  cancelGeminiSpeechPlayback: cancelGeminiSpeechPlaybackMock,
  getGeminiCachedClipCount: getGeminiCachedClipCountMock,
  isGeminiAudioPlaybackSupported: isGeminiAudioPlaybackSupportedMock,
  playGeminiSpeechClip: playGeminiSpeechClipMock,
  primeGeminiSpeechClips: primeGeminiSpeechClipsMock,
}))

vi.mock("easy-speech", () => ({
  default: easySpeechMock,
}))

import {
  __resetSpeechForTests,
  cancelSpeech,
  primeSpeech,
} from "@/lib/speech"

describe("speech", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetSpeechForTests()
    getGeminiCachedClipCountMock.mockReturnValue(0)
    isGeminiAudioPlaybackSupportedMock.mockReturnValue(true)
    playGeminiSpeechClipMock.mockResolvedValue(false)
    primeGeminiSpeechClipsMock.mockResolvedValue({
      success: false,
      primedClipCount: 0,
      error: "Gemini unavailable",
    })
    easySpeechMock.detect.mockReturnValue({
      speechSynthesis: true,
      speechSynthesisUtterance: true,
    })
    easySpeechMock.init.mockResolvedValue(undefined)
    easySpeechMock.voices.mockReturnValue([
      {
        name: "Browser English",
        lang: "en-US",
      },
    ])
    easySpeechMock.speak.mockResolvedValue(undefined)

    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      writable: true,
      value: {
        cancel: vi.fn(),
        getVoices: vi.fn(() => []),
      },
    })
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      writable: true,
      value: class SpeechSynthesisUtterance {
        lang = ""
        pitch = 1
        rate = 1
        text: string
        voice: SpeechSynthesisVoice | null = null
        volume = 1
        onend: (() => void) | null = null
        onerror: (() => void) | null = null
        onstart: (() => void) | null = null

        constructor(text: string) {
          this.text = text
        }
      },
    })
  })

  it("falls back to browser speech when Gemini priming fails", async () => {
    primeGeminiSpeechClipsMock.mockResolvedValue({
      success: false,
      primedClipCount: 1,
      error: "Gemini unavailable",
    })

    await expect(primeSpeech(["One", "Two"])).resolves.toMatchObject({
      provider: "browser",
      initialized: true,
      primedClipCount: 1,
      error: "Gemini unavailable",
    })
  })

  it("cancels both Gemini playback and browser speech", async () => {
    await cancelSpeech()

    expect(cancelGeminiSpeechPlaybackMock).toHaveBeenCalledTimes(1)
    expect(easySpeechMock.cancel).toHaveBeenCalledTimes(1)
    expect(window.speechSynthesis.cancel).toHaveBeenCalledTimes(1)
  })
})
