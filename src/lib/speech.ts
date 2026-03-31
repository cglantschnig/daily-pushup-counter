import {
  cancelGeminiSpeechPlayback,
  getGeminiCachedClipCount,
  isGeminiAudioPlaybackSupported,
  playGeminiSpeechClip,
  primeGeminiSpeechClips,
} from "@/lib/gemini-live-audio"

async function importEasySpeech() {
  const module = await import("easy-speech")
  return module.default
}

type EasySpeechClass = Awaited<ReturnType<typeof importEasySpeech>>

export type SpeechDiagnostics = {
  supported: boolean
  initialized: boolean
  voiceCount: number
  defaultVoiceName: string | null
  error: string | null
  provider: "gemini-live" | "browser" | "unavailable"
  isPrimed: boolean
  primedClipCount: number
}

type SpeakOptions = {
  start?: () => void
  end?: () => void
  error?: (message: string) => void
}

const SPEECH_START_TIMEOUT_MS = 1500

let easySpeechModulePromise: Promise<EasySpeechClass> | null = null
let speechInitPromise: Promise<SpeechDiagnostics> | null = null

export function __resetSpeechForTests() {
  easySpeechModulePromise = null
  speechInitPromise = null
}

async function getEasySpeech() {
  if (!easySpeechModulePromise) {
    easySpeechModulePromise = importEasySpeech()
  }

  return easySpeechModulePromise
}

function getUnsupportedDiagnostics(error: string | null = null): SpeechDiagnostics {
  return {
    supported: false,
    initialized: false,
    voiceCount: 0,
    defaultVoiceName: null,
    error,
    provider: "unavailable",
    isPrimed: false,
    primedClipCount: getGeminiCachedClipCount(),
  }
}

async function initializeBrowserSpeech(): Promise<SpeechDiagnostics> {
  if (typeof window === "undefined") {
    return getUnsupportedDiagnostics()
  }

  if (!speechInitPromise) {
    speechInitPromise = (async () => {
      const EasySpeech = await getEasySpeech()
      const detection = EasySpeech.detect()
      const supported = Boolean(
        detection.speechSynthesis && detection.speechSynthesisUtterance
      )

      if (!supported) {
        return getUnsupportedDiagnostics()
      }

      try {
        await EasySpeech.init({
          maxTimeout: 5000,
          interval: 250,
          quiet: true,
        })

        const voices = EasySpeech.voices()
        const englishVoice = voices.find((voice) => voice.lang.startsWith("en"))
        const preferredVoice = englishVoice || (voices.length > 0 ? voices[0] : null)

        if (preferredVoice) {
          EasySpeech.defaults({
            voice: preferredVoice,
            rate: 1,
            pitch: 1,
            volume: 1,
          })
        }

        return {
          supported: true,
          initialized: true,
          voiceCount: voices.length,
          defaultVoiceName: preferredVoice ? preferredVoice.name : null,
          error: null,
          provider: "browser",
          isPrimed: getGeminiCachedClipCount() > 0,
          primedClipCount: getGeminiCachedClipCount(),
        }
      } catch (error) {
        return {
          supported: true,
          initialized: false,
          voiceCount: 0,
          defaultVoiceName: null,
          error: error instanceof Error ? error.message : "Speech initialization failed.",
          provider: "unavailable",
          isPrimed: getGeminiCachedClipCount() > 0,
          primedClipCount: getGeminiCachedClipCount(),
        }
      }
    })()
  }

  return speechInitPromise
}

export async function initializeSpeech(): Promise<SpeechDiagnostics> {
  const browserDiagnostics = await initializeBrowserSpeech()

  if (browserDiagnostics.supported && browserDiagnostics.initialized) {
    return browserDiagnostics
  }

  if (isGeminiAudioPlaybackSupported()) {
    return {
      supported: true,
      initialized: true,
      voiceCount: browserDiagnostics.voiceCount,
      defaultVoiceName: browserDiagnostics.defaultVoiceName,
      error: browserDiagnostics.error,
      provider: getGeminiCachedClipCount() > 0 ? "gemini-live" : "browser",
      isPrimed: getGeminiCachedClipCount() > 0,
      primedClipCount: getGeminiCachedClipCount(),
    }
  }

  return browserDiagnostics
}

export async function primeSpeech(
  texts: Array<string>
): Promise<SpeechDiagnostics> {
  const browserDiagnostics = await initializeBrowserSpeech()
  const geminiResult = await primeGeminiSpeechClips(texts)

  if (geminiResult.success) {
    return {
      supported: true,
      initialized: true,
      voiceCount: browserDiagnostics.voiceCount,
      defaultVoiceName: browserDiagnostics.defaultVoiceName,
      error: null,
      provider: "gemini-live",
      isPrimed: true,
      primedClipCount: geminiResult.primedClipCount,
    }
  }

  if (browserDiagnostics.supported && browserDiagnostics.initialized) {
    return {
      ...browserDiagnostics,
      provider: "browser",
      error: geminiResult.error ?? browserDiagnostics.error,
      isPrimed: geminiResult.primedClipCount > 0,
      primedClipCount: geminiResult.primedClipCount,
    }
  }

  return {
    ...getUnsupportedDiagnostics(geminiResult.error ?? browserDiagnostics.error),
    isPrimed: geminiResult.primedClipCount > 0,
    primedClipCount: geminiResult.primedClipCount,
  }
}

export async function speakText(
  text: string,
  options: SpeakOptions = {}
): Promise<boolean> {
  const geminiResult = await playGeminiSpeechClip(text, options)

  if (geminiResult) {
    return true
  }

  const diagnostics = await initializeBrowserSpeech()

  if (!diagnostics.supported || !diagnostics.initialized) {
    options.error?.(diagnostics.error ?? "Speech is not available.")
    return false
  }

  const EasySpeech = await getEasySpeech()

  return new Promise((resolve) => {
    let settled = false
    let started = false
    let fallbackTriggered = false

    const finish = (value: boolean) => {
      if (settled) {
        return
      }

      settled = true
      window.clearTimeout(startTimeoutId)
      resolve(value)
    }

    const runNativeFallback = async () => {
      if (fallbackTriggered || settled) {
        return
      }

      fallbackTriggered = true
      await cancelSpeech()
      const nativeResult = await speakWithNativeSynthesis(text, options)
      finish(nativeResult)
    }

    const startTimeoutId = window.setTimeout(() => {
      if (!started) {
        void runNativeFallback()
      }
    }, SPEECH_START_TIMEOUT_MS)

    void EasySpeech.speak({
      text,
      force: true,
      infiniteResume: true,
      start: () => {
        started = true
        window.clearTimeout(startTimeoutId)
        options.start?.()
      },
      end: () => {
        options.end?.()
        finish(true)
      },
      error: (event) => {
        if (fallbackTriggered) {
          return
        }

        if (!started) {
          void runNativeFallback()
          return
        }

        options.error?.(event.error)
        finish(false)
      },
    }).catch((error) => {
      if (fallbackTriggered) {
        return
      }

      if (!started) {
        void runNativeFallback()
        return
      }

      options.error?.(
        error instanceof Error ? error.message : "Speech playback failed."
      )
      finish(false)
    })
  })
}

export async function cancelSpeech() {
  cancelGeminiSpeechPlayback()

  if (typeof window === "undefined") {
    return
  }

  const EasySpeech = await getEasySpeech()
  EasySpeech.cancel()

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel()
  }
}

async function speakWithNativeSynthesis(
  text: string,
  options: SpeakOptions
): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof window.SpeechSynthesisUtterance === "undefined"
  ) {
    options.error?.("Speech is not available.")
    return false
  }

  return new Promise((resolve) => {
    const synth = window.speechSynthesis
    const voices = synth.getVoices()
    const preferredVoice =
      voices.find((voice) => voice.lang.startsWith("en")) ?? voices.at(0)
    const utterance = new window.SpeechSynthesisUtterance(text)

    utterance.lang = preferredVoice?.lang ?? "en-US"
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1

    if (preferredVoice !== undefined) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      options.start?.()
    }
    utterance.onend = () => {
      options.end?.()
      resolve(true)
    }
    utterance.onerror = (event) => {
      options.error?.(event.error)
      resolve(false)
    }

    synth.cancel()
    synth.resume()
    synth.speak(utterance)
  })
}
