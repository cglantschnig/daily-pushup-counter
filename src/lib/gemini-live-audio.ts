import {
  GoogleGenAI,
  Modality,
  createUserContent,
  type LiveServerMessage,
} from "@google/genai"
import { getGeminiLiveToken } from "@/lib/gemini-live-token"

const GEMINI_AUDIO_MIME_PREFIX = "audio/pcm"
const GEMINI_AUDIO_SAMPLE_RATE = 24000

type PrimeGeminiSpeechResult = {
  success: boolean
  primedClipCount: number
  error: string | null
}

type SpeakOptions = {
  start?: () => void
  end?: () => void
}

type PendingTurn = {
  chunks: Array<Uint8Array>
  resolve: (value: Uint8Array) => void
  reject: (error: Error) => void
}

type AudioContextConstructor = typeof AudioContext

const clipCache = new Map<string, AudioBuffer>()

let audioContext: AudioContext | null = null
let activeSourceNode: AudioBufferSourceNode | null = null

function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return null
  }

  return (
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext ??
    null
  )
}

function getAudioContext() {
  if (audioContext) {
    return audioContext
  }

  const AudioContextCtor = getAudioContextConstructor()

  if (!AudioContextCtor) {
    return null
  }

  audioContext = new AudioContextCtor()

  return audioContext
}

function normalizeSpeechText(text: string) {
  return text.trim()
}

function getSpeechKey(text: string) {
  return normalizeSpeechText(text).toLowerCase()
}

function getGeminiErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Gemini Live audio failed."
}

function base64ToBytes(encoded: string) {
  const binary = window.atob(encoded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function concatChunks(chunks: Array<Uint8Array>) {
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const combined = new Uint8Array(totalSize)
  let offset = 0

  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.byteLength
  }

  return combined
}

function pcmToAudioBuffer(context: AudioContext, bytes: Uint8Array) {
  const sampleCount = Math.floor(bytes.byteLength / 2)
  const audioBuffer = context.createBuffer(1, sampleCount, GEMINI_AUDIO_SAMPLE_RATE)
  const channelData = audioBuffer.getChannelData(0)
  const pcmData = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  for (let index = 0; index < sampleCount; index += 1) {
    channelData[index] = pcmData.getInt16(index * 2, true) / 32768
  }

  return audioBuffer
}

function createPendingTurn() {
  let pendingTurn: PendingTurn | null = null

  function finishTurn(
    resolver: (pending: PendingTurn) => void,
    fallbackError: string
  ) {
    const currentTurn = pendingTurn

    if (!currentTurn) {
      return
    }

    pendingTurn = null

    try {
      resolver(currentTurn)
    } catch (error) {
      currentTurn.reject(
        error instanceof Error ? error : new Error(fallbackError)
      )
    }
  }

  return {
    get current() {
      return pendingTurn
    },
    start() {
      if (pendingTurn) {
        throw new Error("A Gemini Live audio turn is already in progress.")
      }

      return new Promise<Uint8Array>((resolve, reject) => {
        pendingTurn = {
          chunks: [],
          resolve,
          reject,
        }
      })
    },
    reject(error: Error) {
      finishTurn((turn) => {
        turn.reject(error)
      }, "Gemini Live audio failed.")
    },
    handleMessage(message: LiveServerMessage) {
      const currentTurn = pendingTurn

      if (!currentTurn) {
        return
      }

      const parts = message.serverContent?.modelTurn?.parts ?? []

      for (const part of parts) {
        const inlineData = part.inlineData

        if (
          inlineData?.mimeType?.startsWith(GEMINI_AUDIO_MIME_PREFIX) &&
          inlineData.data
        ) {
          currentTurn.chunks.push(base64ToBytes(inlineData.data))
        }
      }

      if (message.serverContent?.interrupted) {
        this.reject(new Error("Gemini Live audio was interrupted."))
        return
      }

      if (message.serverContent?.turnComplete) {
        finishTurn((turn) => {
          if (turn.chunks.length === 0) {
            throw new Error("Gemini Live returned no audio for this phrase.")
          }

          turn.resolve(concatChunks(turn.chunks))
        }, "Gemini Live returned no audio.")
      }
    },
  }
}

async function connectSession() {
  const { token, model } = await getGeminiLiveToken()

  if (!token) {
    throw new Error("Gemini Live did not return an ephemeral token.")
  }

  const pendingTurn = createPendingTurn()
  const ai = new GoogleGenAI({
    apiKey: token,
    apiVersion: "v1alpha",
  })

  let closeReject: ((error: Error) => void) | null = null
  const session = await ai.live.connect({
    model,
    config: {
      responseModalities: [Modality.AUDIO],
    },
    callbacks: {
      onmessage: (message) => {
        pendingTurn.handleMessage(message)
      },
      onerror: (error) => {
        pendingTurn.reject(new Error(error.message || "Gemini Live connection failed."))
      },
      onclose: (event) => {
        const error =
          event.code === 1000
            ? new Error("Gemini Live session closed.")
            : new Error(event.reason || "Gemini Live session closed unexpectedly.")

        pendingTurn.reject(error)
        closeReject?.(error)
      },
    },
  })

  async function requestAudio(phrase: string) {
    const responsePromise = pendingTurn.start()
    const normalizedPhrase = normalizeSpeechText(phrase)

    session.sendClientContent({
      turns: createUserContent(normalizedPhrase),
      turnComplete: true,
    })

    return responsePromise
  }

  async function close() {
    await new Promise<void>((resolve) => {
      let settled = false

      closeReject = () => {
        if (settled) {
          return
        }

        settled = true
        resolve()
      }

      session.close()
      window.setTimeout(() => {
        if (settled) {
          return
        }

        settled = true
        resolve()
      }, 50)
    })
  }

  return {
    requestAudio,
    close,
  }
}

export function isGeminiAudioPlaybackSupported() {
  return getAudioContextConstructor() !== null
}

export function getGeminiCachedClipCount() {
  return clipCache.size
}

export async function primeGeminiSpeechClips(
  texts: Array<string>
): Promise<PrimeGeminiSpeechResult> {
  if (typeof window === "undefined") {
    return {
      success: false,
      primedClipCount: getGeminiCachedClipCount(),
      error: "Gemini Live audio is only available in the browser.",
    }
  }

  const context = getAudioContext()

  if (!context) {
    return {
      success: false,
      primedClipCount: getGeminiCachedClipCount(),
      error: "Web Audio is not available in this browser.",
    }
  }

  const uncachedTexts = Array.from(
    new Set(
      texts
        .map(normalizeSpeechText)
        .filter(Boolean)
        .filter((text) => !clipCache.has(getSpeechKey(text)))
    )
  )

  if (uncachedTexts.length === 0) {
    return {
      success: true,
      primedClipCount: getGeminiCachedClipCount(),
      error: null,
    }
  }

  let session:
    | {
        requestAudio: (phrase: string) => Promise<Uint8Array>
        close: () => Promise<void>
      }
    | null = null

  try {
    session = await connectSession()

    for (const text of uncachedTexts) {
      const pcmBytes = await session.requestAudio(text)
      clipCache.set(getSpeechKey(text), pcmToAudioBuffer(context, pcmBytes))
    }

    return {
      success: true,
      primedClipCount: getGeminiCachedClipCount(),
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      primedClipCount: getGeminiCachedClipCount(),
      error: getGeminiErrorMessage(error),
    }
  } finally {
    await session?.close().catch(() => undefined)
  }
}

export async function playGeminiSpeechClip(
  text: string,
  options: SpeakOptions = {}
) {
  const context = getAudioContext()

  if (!context) {
    return false
  }

  const clip = clipCache.get(getSpeechKey(text))

  if (!clip) {
    return false
  }

  if (context.state === "suspended") {
    await context.resume()
  }

  cancelGeminiSpeechPlayback()

  return new Promise<boolean>((resolve) => {
    const sourceNode = context.createBufferSource()

    activeSourceNode = sourceNode
    sourceNode.buffer = clip
    sourceNode.connect(context.destination)
    sourceNode.onended = () => {
      if (activeSourceNode === sourceNode) {
        activeSourceNode = null
      }

      options.end?.()
      resolve(true)
    }

    options.start?.()
    sourceNode.start(0)
  })
}

export function cancelGeminiSpeechPlayback() {
  if (!activeSourceNode) {
    return
  }

  activeSourceNode.stop()
  activeSourceNode.disconnect()
  activeSourceNode = null
}

export function __resetGeminiLiveAudioForTests() {
  clipCache.clear()
  cancelGeminiSpeechPlayback()
  audioContext = null
}
