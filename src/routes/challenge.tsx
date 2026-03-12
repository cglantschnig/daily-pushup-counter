import { createFileRoute } from "@tanstack/react-router"
import { ChallengeScreen } from "@/components/challenge-screen"

export const Route = createFileRoute("/challenge")({
  component: ChallengeScreen,
})
