import { useAuth } from "@clerk/tanstack-react-start"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { useState } from "react"

type ConvexClientProviderProps = {
  children: React.ReactNode
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  const [client] = useState(() => {
    const url = import.meta.env.VITE_CONVEX_URL

    if (!url) {
      throw new Error("Missing VITE_CONVEX_URL environment variable.")
    }

    return new ConvexReactClient(url)
  })

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}
