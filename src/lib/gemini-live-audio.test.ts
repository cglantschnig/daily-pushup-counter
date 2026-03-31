// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

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

import {
  __resetGeminiLiveAudioForTests,
  getGeminiCachedClipCount,
  primeGeminiSpeechClips,
} from "@/lib/gemini-live-audio"

class FakeAudioBuffer {
  private readonly channelData: Float32Array

  constructor(length: number) {
    this.channelData = new Float32Array(length)
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
  state: AudioContextState = "running"
  destination = {}
  resume = vi.fn().mockResolvedValue(undefined)
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

function installLiveSessionMock(actions: Record<string, { error?: string }>) {
  const requestedPhrases: Array<string> = []

  connectMock.mockImplementation(async ({ callbacks }) => {
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
                    data: encodePcm([0, 32767]),
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

  it("only requests uncached phrases on repeated primes", async () => {
    const requestedPhrases = installLiveSessionMock({
      One: {},
      Two: {},
      Three: {},
    })

    await expect(primeGeminiSpeechClips(["One", "Two"])).resolves.toMatchObject({
      success: true,
      primedClipCount: 2,
    })
    await expect(primeGeminiSpeechClips(["Two", "Three"])).resolves.toMatchObject({
      success: true,
      primedClipCount: 3,
    })

    expect(requestedPhrases).toEqual(["One", "Two", "Three"])
    expect(getGeminiCachedClipCount()).toBe(3)
  })

  it("keeps successful clips cached when a later phrase fails", async () => {
    installLiveSessionMock({
      One: {},
      Two: { error: "session failed" },
    })

    await expect(primeGeminiSpeechClips(["One", "Two"])).resolves.toMatchObject({
      success: false,
      primedClipCount: 1,
      error: "session failed",
    })

    expect(getGeminiCachedClipCount()).toBe(1)
  })
})
