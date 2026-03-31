import { GoogleGenAI, Modality } from "@google/genai"
import { auth } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"

const DEFAULT_GEMINI_LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"
const DEFAULT_GEMINI_LIVE_VOICE_NAME = "Kore"
const TOKEN_EXPIRY_MS = 30 * 60 * 1000
const NEW_SESSION_EXPIRY_MS = 60 * 1000

function getGeminiLiveModel() {
  const configuredModel = process.env.GEMINI_LIVE_MODEL?.trim()

  return configuredModel || DEFAULT_GEMINI_LIVE_MODEL
}

function getGeminiLiveVoiceName() {
  const configuredVoice = process.env.GEMINI_LIVE_VOICE_NAME?.trim()

  return configuredVoice || DEFAULT_GEMINI_LIVE_VOICE_NAME
}

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.")
  }

  return apiKey
}

export const getGeminiLiveToken = createServerFn({ method: "GET" }).handler(
  async () => {
    const { userId } = await auth()

    if (!userId) {
      throw new Error("Authentication is required to initialize Gemini Live audio.")
    }

    const model = getGeminiLiveModel()
    const voiceName = getGeminiLiveVoiceName()
    const ai = new GoogleGenAI({
      apiKey: getGeminiApiKey(),
      apiVersion: "v1alpha",
    })

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString(),
        newSessionExpireTime: new Date(
          Date.now() + NEW_SESSION_EXPIRY_MS
        ).toISOString(),
        liveConnectConstraints: {
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName,
                },
              },
            },
            systemInstruction:
              "Speak exactly the provided user text and nothing else.",
          },
        },
        lockAdditionalFields: [],
      },
    })

    return {
      token: token.name ?? "",
      model,
      voiceName,
    }
  }
)
