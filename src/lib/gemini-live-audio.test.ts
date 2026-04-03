// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  __resetGeminiLiveAudioForTests,
  cancelGeminiSpeechPlayback,
  getGeminiCachedClipCount,
  playGeminiSpeechClip,
  primeGeminiSpeechClips,
} from "@/lib/gemini-live-audio"

const connectMock = vi.hoisted(() => vi.fn())
const getGeminiLiveTokenMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/gemini-live-token", () => ({
  getGeminiLiveToken: getGeminiLiveTokenMock,
}))

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    live: {
      connect: connectMock,
    },
  })),
  Modality: {
    AUDIO: "AUDIO",
  },
  createUserContent: (text: string) => ({
    role: "user",
    parts: [{ text }],
  }),
}))

class FakeAudioBuffer {
  readonly duration: number
  private readonly channelData: Float32Array

  constructor(length: number) {
    this.channelData = new Float32Array(length)
    this.duration = length / 24000
  }

  get length() {
    return this.channelData.length
  }

  getChannelData() {
    return this.channelData
  }
}

class FakeAudioBufferSourceNode {
  buffer: AudioBuffer | null = null
  onended: (() => void) | null = null
  connect = vi.fn()
  disconnect = vi.fn()
  start = vi.fn(() => {
    this.onended?.()
  })
  stop = vi.fn(() => {
    this.onended?.()
  })
}

class FakeAudioContext {
  static instances = 0
  static resumes = 0

  currentTime = 0
  state: AudioContextState = "running"
  destination = {}
  resume = vi.fn().mockImplementation(() => {
    FakeAudioContext.resumes += 1
    return Promise.resolve()
  })

  constructor() {
    FakeAudioContext.instances += 1
  }

  createBuffer(_channels: number, length: number) {
    return new FakeAudioBuffer(length) as unknown as AudioBuffer
  }
  createBufferSource() {
    return new FakeAudioBufferSourceNode() as unknown as AudioBufferSourceNode
  }
}

function encodePcm(samples: Array<number>) {
  const pcmSamples = new Int16Array(samples)
  const bytes = new Uint8Array(pcmSamples.buffer)
  let binary = ""

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return window.btoa(binary)
}

function installLiveSessionMock(
  actions: Record<string, { error?: string; samples?: Array<number> } | undefined>
) {
  const requestedPhrases: Array<string> = []

  connectMock.mockImplementation(({ callbacks }) => {
    return {
      sendClientContent: ({
        turns,
      }: {
        turns?: { parts?: Array<{ text?: string }> }
      }) => {
        const phrase = turns?.parts?.[0]?.text ?? ""
        requestedPhrases.push(phrase)
        const action = actions[phrase]

        if (action?.error) {
          callbacks.onclose?.({ code: 1011, reason: action.error } as CloseEvent)
          return
        }

        callbacks.onmessage({
          serverContent: {
            modelTurn: {
              parts: [
                {
                  inlineData: {
                    mimeType: "audio/pcm;rate=24000",
                    data: encodePcm(action?.samples ?? [0, 32767]),
                  },
                },
              ],
            },
          },
        })
        callbacks.onmessage({
          serverContent: {
            turnComplete: true,
          },
        })
      },
      close: vi.fn(() => {
        callbacks.onclose?.({ code: 1000, reason: "" } as CloseEvent)
      }),
    }
  })

  return requestedPhrases
}

describe("gemini live audio", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetGeminiLiveAudioForTests()
    FakeAudioContext.instances = 0
    FakeAudioContext.resumes = 0
    getGeminiLiveTokenMock.mockResolvedValue({
      token: "ephemeral-token",
      model: "gemini-model",
      voiceName: "Kore",
    })
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      writable: true,
      value: FakeAudioContext,
    })
  })

  it("primes and caches generated clips across repeated primes", async () => {
    const requestedPhrases = installLiveSessionMock({})

    await expect(primeGeminiSpeechClips(["One", "Two"])).resolves.toMatchObject({
      success: true,
      primedClipCount: 2,
    })
    await expect(primeGeminiSpeechClips(["Two", "Three"])).resolves.toMatchObject({
      success: true,
      primedClipCount: 3,
    })

    expect(requestedPhrases).toEqual(["One", "Two", "Three"])
    expect(connectMock).toHaveBeenCalledTimes(2)
    expect(getGeminiCachedClipCount()).toBe(3)
    expect(FakeAudioContext.instances).toBe(0)
    expect(FakeAudioContext.resumes).toBe(0)
  })

  it("plays a primed clip without requesting Gemini again", async () => {
    const requestedPhrases = installLiveSessionMock({
      Go: { samples: [0, 8192, 16384, 0] },
    })
    const start = vi.fn()
    const end = vi.fn()

    await expect(primeGeminiSpeechClips(["Go"])).resolves.toMatchObject({
      success: true,
      primedClipCount: 1,
    })
    await expect(playGeminiSpeechClip("Go", { start, end })).resolves.toBe(true)

    expect(requestedPhrases).toEqual(["Go"])
    expect(start).toHaveBeenCalledTimes(1)
    expect(end).toHaveBeenCalledTimes(1)
  })

  it("returns false when attempting to play an unprimed clip", async () => {
    installLiveSessionMock({
      One: { samples: [0, 32767] },
    })

    await expect(playGeminiSpeechClip("One")).resolves.toBe(false)
    expect(connectMock).not.toHaveBeenCalled()
  })

  it("returns false when the live session closes before audio is produced", async () => {
    installLiveSessionMock({
      One: { error: "session failed" },
    })

    await expect(playGeminiSpeechClip("One")).resolves.toBe(false)
  })

  it("keeps primed clips available after playback is canceled", async () => {
    const requestedPhrases = installLiveSessionMock({
      One: { samples: [0, 32767] },
    })

    await primeGeminiSpeechClips(["One"])
    cancelGeminiSpeechPlayback()

    await expect(primeGeminiSpeechClips(["One"])).resolves.toMatchObject({
      success: true,
      primedClipCount: 1,
    })
    expect(requestedPhrases).toEqual(["One"])
    expect(connectMock).toHaveBeenCalledTimes(1)
  })
})
