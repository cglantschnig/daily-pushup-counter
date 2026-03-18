import { AppScreen } from "@/components/app-screen"

type AuthLoadingScreenProps = {
  title?: string
}

export function AuthLoadingScreen({
  title = "Loading account",
}: AuthLoadingScreenProps) {
  return (
    <AppScreen showBranding={false} title={title}>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Checking your session...
        </p>
      </div>
    </AppScreen>
  )
}
