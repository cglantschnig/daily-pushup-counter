import { GoogleGenAI, Modality, createUserContent } from "@google/genai"
import type { LiveServerMessage } from "@google/genai"
import { getGeminiLiveToken } from "@/lib/gemini-live-token"

const GEMINI_AUDIO_MIME_PREFIX = "audio/pcm"
const GEMINI_AUDIO_SAMPLE_RATE = 24000
const AUDIO_START_LEAD_TIME_SECONDS = 0.02

type PrimeGeminiSpeechResult = {
  success: boolean
  primedClipCount: number
  error: string | null
}

type SpeakOptions = {
  start?: () => void
  end?: () => void
}

type AudioTurnConsumer = {
  enqueueChunk: (bytes: Uint8Array) => void
  hasReceivedAudio: () => boolean
  completeTurn: () => Promise<boolean>
  fail: () => void
}

type PendingTurn = {
  consumer: AudioTurnConsumer
  receivedAudio: boolean
  resolve: (value: boolean) => void
  reject: (error: Error) => void
}

type LiveSession = {
  requestAudioResponse: (
    phrase: string,
    consumer: AudioTurnConsumer
  ) => Promise<boolean>
  close: () => Promise<void>
}

type AudioContextConstructor = typeof AudioContext

const preparedSpeechClips = new Map<string, Uint8Array>()

let audioContext: AudioContext | null = null
let activePlayback: StreamingPlayback | null = null
let liveSessionPromise: Promise<LiveSession> | null = null

class StreamingPlayback {
  private readonly sourceNodes = new Set<AudioBufferSourceNode>()
  private nextStartTime: number
  private pendingSourceCount = 0
  private receivedAudio = false
  private startNotified = false
  private settled = false
  private turnComplete = false
  private readonly completionPromise: Promise<boolean>
  private resolveCompletion: (value: boolean) => void = () => undefined

  constructor(
    private readonly context: AudioContext,
    private readonly options: SpeakOptions
  ) {
    this.nextStartTime = context.currentTime
    this.completionPromise = new Promise((resolve) => {
      this.resolveCompletion = resolve
    })
  }

  get done() {
    return this.completionPromise
  }

  hasReceivedAudio() {
    return this.receivedAudio
  }

  enqueueChunk(bytes: Uint8Array) {
    if (this.settled || bytes.byteLength < 2) {
      return
    }

    const audioBuffer = pcmToAudioBuffer(this.context, bytes)

    if (audioBuffer.length === 0) {
      return
    }

    const sourceNode = this.context.createBufferSource()
    const scheduledStartTime = Math.max(
      this.context.currentTime + AUDIO_START_LEAD_TIME_SECONDS,
      this.nextStartTime
    )

    this.receivedAudio = true
    this.pendingSourceCount += 1
    this.nextStartTime = scheduledStartTime + audioBuffer.duration
    this.sourceNodes.add(sourceNode)

    sourceNode.buffer = audioBuffer
    sourceNode.connect(this.context.destination)
    sourceNode.onended = () => {
      sourceNode.disconnect()
      this.sourceNodes.delete(sourceNode)
      this.pendingSourceCount -= 1

      if (this.turnComplete && this.pendingSourceCount === 0) {
        this.finish(true)
      }
    }

    if (!this.startNotified) {
      this.startNotified = true
      this.options.start?.()
    }

    sourceNode.start(scheduledStartTime)
  }

  async completeTurn() {
    if (this.settled) {
      return this.completionPromise
    }

    this.turnComplete = true

    if (!this.receivedAudio) {
      this.finish(false)
      return this.completionPromise
    }

    if (this.pendingSourceCount === 0) {
      this.finish(true)
    }

    return this.completionPromise
  }

  cancel() {
    this.stopSources()
    this.finish(false)
  }

  fail() {
    this.stopSources()
    this.finish(false)
  }

  private stopSources() {
    for (const sourceNode of Array.from(this.sourceNodes)) {
      sourceNode.onended = null

      try {
        sourceNode.stop()
      } catch {
        // Ignore double-stop errors from partially finished source nodes.
      }

      sourceNode.disconnect()
      this.sourceNodes.delete(sourceNode)
    }

    this.pendingSourceCount = 0
  }

  private finish(success: boolean) {
    if (this.settled) {
      return
    }

    this.settled = true

    if (success) {
      this.options.end?.()
    }

    this.resolveCompletion(success)
  }
}

class BufferedAudioClip implements AudioTurnConsumer {
  private readonly chunks: Array<Uint8Array> = []
  private receivedAudio = false

  enqueueChunk(bytes: Uint8Array) {
    if (bytes.byteLength < 2) {
      return
    }

    this.receivedAudio = true
    this.chunks.push(new Uint8Array(bytes))
  }

  hasReceivedAudio() {
    return this.receivedAudio
  }

  completeTurn() {
    return Promise.resolve(this.receivedAudio)
  }

  fail() {
    this.chunks.length = 0
    this.receivedAudio = false
  }

  toUint8Array() {
    return concatBytes(this.chunks)
  }
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return null
  }

  const browserWindow = window
  const webkitAudioContext = (
    browserWindow as Window & {
      webkitAudioContext?: AudioContextConstructor
    }
  ).webkitAudioContext

  if (typeof browserWindow.AudioContext === "function") {
    return browserWindow.AudioContext
  }

  return webkitAudioContext ?? null
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

function concatBytes(chunks: Array<Uint8Array>) {
  const totalLength = chunks.reduce(
    (byteLength, chunk) => byteLength + chunk.byteLength,
    0
  )
  const combinedBytes = new Uint8Array(totalLength)
  let byteOffset = 0

  for (const chunk of chunks) {
    combinedBytes.set(chunk, byteOffset)
    byteOffset += chunk.byteLength
  }

  return combinedBytes
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
    handler: (turn: PendingTurn) => void,
    fallbackError: string
  ) {
    const currentTurn = pendingTurn

    if (!currentTurn) {
      return
    }

    pendingTurn = null

    try {
      handler(currentTurn)
    } catch (error) {
      currentTurn.reject(
        error instanceof Error ? error : new Error(fallbackError)
      )
    }
  }

  return {
    hasActiveTurn() {
      return pendingTurn !== null
    },
    start(consumer: AudioTurnConsumer) {
      if (pendingTurn) {
        throw new Error("A Gemini Live audio turn is already in progress.")
      }

      return new Promise<boolean>((resolve, reject) => {
        pendingTurn = {
          consumer,
          receivedAudio: false,
          resolve,
          reject,
        }
      })
    },
    reject(error: Error) {
      finishTurn((turn) => {
        turn.consumer.fail()
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
          currentTurn.receivedAudio = true
          currentTurn.consumer.enqueueChunk(base64ToBytes(inlineData.data))
        }
      }

      if (message.serverContent?.interrupted) {
        this.reject(new Error("Gemini Live audio was interrupted."))
        return
      }

      if (message.serverContent?.turnComplete) {
        finishTurn((turn) => {
          if (!turn.receivedAudio && !turn.consumer.hasReceivedAudio()) {
            throw new Error("Gemini Live returned no audio for this phrase.")
          }

          void turn.consumer.completeTurn().then(turn.resolve)
        }, "Gemini Live returned no audio.")
      }
    },
  }
}

async function connectSession(onClose: () => void): Promise<LiveSession> {
  const { token, model } = await getGeminiLiveToken()

  if (!token) {
    throw new Error("Gemini Live did not return an ephemeral token.")
  }

  const pendingTurn = createPendingTurn()
  const ai = new GoogleGenAI({
    apiKey: token,
    apiVersion: "v1alpha",
  })

  let closeResolve: (() => void) | null = null
  let closed = false
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
        onClose()
        pendingTurn.reject(
          new Error(error.message || "Gemini Live connection failed.")
        )
      },
      onclose: (event) => {
        closed = true
        onClose()

        const error =
          event.code === 1000
            ? new Error("Gemini Live session closed.")
            : new Error(event.reason || "Gemini Live session closed unexpectedly.")

        if (pendingTurn.hasActiveTurn()) {
          pendingTurn.reject(error)
        }

        closeResolve?.()
      },
    },
  })

  return {
    async requestAudioResponse(phrase: string, consumer: AudioTurnConsumer) {
      const responsePromise = pendingTurn.start(consumer)
      const normalizedPhrase = normalizeSpeechText(phrase)

      session.sendClientContent({
        turns: createUserContent(normalizedPhrase),
        turnComplete: true,
      })

      return responsePromise
    },
    async close() {
      if (closed) {
        return
      }

      await new Promise<void>((resolve) => {
        let settled = false

        closeResolve = () => {
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
    },
  }
}

async function getLiveSession() {
  if (!liveSessionPromise) {
    let nextSessionPromise: Promise<LiveSession> | null = null

    nextSessionPromise = connectSession(() => {
      if (liveSessionPromise === nextSessionPromise) {
        liveSessionPromise = null
      }
    }).catch((error) => {
      if (liveSessionPromise === nextSessionPromise) {
        liveSessionPromise = null
      }

      throw error
    })

    liveSessionPromise = nextSessionPromise
  }

  return liveSessionPromise
}

async function closeLiveSession() {
  const sessionPromise = liveSessionPromise

  liveSessionPromise = null

  if (!sessionPromise) {
    return
  }

  try {
    const session = await sessionPromise
    await session.close()
  } catch {
    // The session is already closed or failed to connect.
  }
}

async function ensurePlaybackContext() {
  const context = getAudioContext()

  if (!context) {
    return null
  }

  if (context.state === "suspended") {
    await context.resume()
  }

  return context
}

export function isGeminiAudioPlaybackSupported() {
  return getAudioContextConstructor() !== null
}

export function getGeminiCachedClipCount() {
  return preparedSpeechClips.size
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

  if (!isGeminiAudioPlaybackSupported()) {
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
        .filter((text) => Boolean(text) && !preparedSpeechClips.has(getSpeechKey(text)))
    )
  )

  if (uncachedTexts.length === 0) {
    return {
      success: getGeminiCachedClipCount() > 0,
      primedClipCount: getGeminiCachedClipCount(),
      error: null,
    }
  }

  try {
    const session = await getLiveSession()

    for (const text of uncachedTexts) {
      const clip = new BufferedAudioClip()
      const wasGenerated = await session.requestAudioResponse(text, clip)

      if (!wasGenerated) {
        throw new Error("Gemini Live returned no audio for this phrase.")
      }

      const audioBytes = clip.toUint8Array()

      if (audioBytes.byteLength === 0) {
        throw new Error("Gemini Live returned an empty audio clip.")
      }

      preparedSpeechClips.set(getSpeechKey(text), audioBytes)
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
    await closeLiveSession()
  }
}

export async function playGeminiSpeechClip(
  text: string,
  options: SpeakOptions = {}
) {
  const normalizedText = normalizeSpeechText(text)

  if (!normalizedText) {
    return false
  }

  const cachedClip = preparedSpeechClips.get(getSpeechKey(normalizedText))

  if (!cachedClip) {
    return false
  }

  const context = await ensurePlaybackContext()

  if (!context) {
    return false
  }

  if (activePlayback) {
    activePlayback.cancel()
    activePlayback = null
    await closeLiveSession()
  }

  const playback = new StreamingPlayback(context, options)
  activePlayback = playback

  try {
    playback.enqueueChunk(cachedClip)
    return await playback.completeTurn()
  } finally {
    if (activePlayback === playback) {
      activePlayback = null
    }
  }
}

export function cancelGeminiSpeechPlayback() {
  if (activePlayback) {
    activePlayback.cancel()
    activePlayback = null
  }

  void closeLiveSession()
}

export function __resetGeminiLiveAudioForTests() {
  preparedSpeechClips.clear()
  cancelGeminiSpeechPlayback()
  audioContext = null
  liveSessionPromise = null
}
