import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { ChevronLeft, LoaderCircle } from "lucide-react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import { AppScreen } from "@/components/app-screen"
import {
  getCurrentMonthDailyRepTotals,
  getCurrentMonthRange,
} from "@/lib/history"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
})

export const Route = createFileRoute("/history")({
  component: HistoryScreen,
})

function HistoryScreen() {
  const [today] = useState(() => new Date())
  const monthRange = getCurrentMonthRange(today)
  const recentChallenges = useQuery(api.challenges.listRecent, { limit: 20 })
  const monthChallenges = useQuery(api.challenges.listForMonth, monthRange)
  const isRecentChallengesLoading = recentChallenges === undefined
  const isMonthChallengesLoading = monthChallenges === undefined
  const recentChallengeEntries = recentChallenges ?? []
  const monthChallengeEntries = monthChallenges ?? []
  const dailyTotals = getCurrentMonthDailyRepTotals(monthChallengeEntries, today)
  const monthTotal = dailyTotals.reduce(
    (sum, entry) => sum + entry.totalReps,
    0
  )
  const activeDays = dailyTotals.filter((entry) => entry.totalReps > 0).length

  return (
    <AppScreen
      headerStart={
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-75"
        >
          <ChevronLeft className="size-4" />
          <span>Home</span>
        </Link>
      }
      showBranding={false}
      title="History"
      subtitle="Anonymous pushup history shared across this Convex deployment."
    >
      <div className="flex h-full flex-col gap-4">
        <section className="rounded-[1.75rem] border border-border/70 bg-card/72 p-5 shadow-sm shadow-primary/5 dark:shadow-black/20">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {monthFormatter.format(today)}
                </p>
                <h2 className="mt-1 text-2xl leading-none font-semibold tracking-[-0.05em] text-foreground">
                  Daily reps
                </h2>
              </div>

              <div className="rounded-[1.25rem] border border-primary/12 bg-primary/8 px-4 py-3 text-right">
                <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-primary uppercase">
                  Month Total
                </p>
                <p className="mt-1 text-2xl leading-none font-semibold tracking-[-0.05em] text-foreground">
                  {isMonthChallengesLoading ? "..." : monthTotal}
                </p>
              </div>
            </div>

            {isMonthChallengesLoading ? (
              <MonthSummarySkeleton />
            ) : (
              <>
                <MonthlyRepsChart dailyTotals={dailyTotals} />

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[1.25rem] border border-border/60 bg-background/72 px-4 py-3">
                    <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                      Active Days
                    </p>
                    <p className="mt-1 text-xl leading-none font-semibold tracking-[-0.04em] text-foreground">
                      {activeDays}
                    </p>
                  </div>

                  <div className="rounded-[1.25rem] border border-border/60 bg-background/72 px-4 py-3">
                    <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                      Best Day
                    </p>
                    <p className="mt-1 text-xl leading-none font-semibold tracking-[-0.04em] text-foreground">
                      {Math.max(
                        ...dailyTotals.map((entry) => entry.totalReps),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="flex-1 rounded-[1.75rem] border border-border/70 bg-card/72 p-5 shadow-sm shadow-primary/5 dark:shadow-black/20">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl leading-none font-semibold tracking-[-0.05em] text-foreground">
                Recent workouts
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Latest 20 completed sets.
              </p>
            </div>
          </div>

          {isRecentChallengesLoading ? (
            <RecentWorkoutsSkeleton />
          ) : recentChallengeEntries.length > 0 ? (
            <div className="space-y-4">
              {recentChallengeEntries.map((challenge, index) => (
                <article key={challenge.id}>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-2xl leading-none font-semibold tracking-[-0.05em] text-foreground">
                      {challenge.reps_count} reps
                    </p>
                    <p className="max-w-[11rem] text-right text-sm leading-6 text-muted-foreground">
                      {dateFormatter.format(new Date(challenge.timestamp))}
                    </p>
                  </div>

                  {index < recentChallengeEntries.length - 1 ? (
                    <div className="mt-4 h-px bg-primary/10" />
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-primary/20 bg-background/72 px-5 py-8 text-center text-sm leading-6 text-muted-foreground dark:bg-background/32">
              No challenges saved yet. Complete a pushup challenge to see it here.
            </div>
          )}
        </section>
      </div>
    </AppScreen>
  )
}

function MonthSummarySkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-live="polite"
      aria-label="Loading monthly workout history"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin text-primary" />
        <span>Loading monthly history</span>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-background/72 p-3">
        <div className="h-48 w-full animate-pulse rounded-[1.2rem] bg-linear-to-br from-primary/14 via-primary/6 to-transparent" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="rounded-[1.25rem] border border-border/60 bg-background/72 px-4 py-3"
          >
            <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
            <div className="mt-3 h-6 w-12 animate-pulse rounded-full bg-primary/14" />
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentWorkoutsSkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-live="polite"
      aria-label="Loading recent workouts"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin text-primary" />
        <span>Loading recent workouts</span>
      </div>

      {Array.from({ length: 4 }, (_, index) => (
        <div key={index}>
          <div className="flex items-start justify-between gap-4">
            <div className="h-8 w-28 animate-pulse rounded-full bg-primary/14" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
          </div>

          {index < 3 ? <div className="mt-4 h-px bg-primary/10" /> : null}
        </div>
      ))}
    </div>
  )
}

type MonthlyRepsChartProps = {
  dailyTotals: Array<{
    day: number
    totalReps: number
  }>
}

function MonthlyRepsChart({ dailyTotals }: MonthlyRepsChartProps) {
  const chartWidth = 320
  const chartHeight = 180
  const paddingX = 12
  const paddingTop = 12
  const paddingBottom = 18
  const plotWidth = chartWidth - paddingX * 2
  const plotHeight = chartHeight - paddingTop - paddingBottom
  const maxReps = Math.max(...dailyTotals.map((entry) => entry.totalReps), 1)
  const baselineY = paddingTop + plotHeight
  const points = dailyTotals.map((entry, index) => {
    const x =
      dailyTotals.length === 1
        ? chartWidth / 2
        : paddingX + (index / (dailyTotals.length - 1)) * plotWidth
    const y = baselineY - (entry.totalReps / maxReps) * plotHeight

    return {
      ...entry,
      x,
      y,
    }
  })
  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ")
  const areaPath = `${linePath} L ${points.at(-1)?.x.toFixed(2) ?? chartWidth} ${baselineY.toFixed(2)} L ${points[0]?.x.toFixed(2) ?? 0} ${baselineY.toFixed(2)} Z`
  const guideValues = Array.from(
    new Set([maxReps, Math.round(maxReps / 2), 0])
  ).sort((left, right) => right - left)
  const middleDay =
    dailyTotals[Math.floor((dailyTotals.length - 1) / 2)]?.day ?? 1
  const monthHasWork = dailyTotals.some((entry) => entry.totalReps > 0)

  return (
    <div className="space-y-3">
      <div className="rounded-[1.5rem] border border-border/60 bg-background/72 p-3">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="block h-48 w-full"
          role="img"
          aria-label="Line graph of daily reps totals for the current month"
        >
          <defs>
            <linearGradient id="history-month-fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-chart-1)"
                stopOpacity="0.28"
              />
              <stop
                offset="100%"
                stopColor="var(--color-chart-1)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {guideValues.map((value) => {
            const y = baselineY - (value / maxReps) * plotHeight

            return (
              <line
                key={value}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="var(--color-border)"
                strokeDasharray="4 6"
                opacity="0.7"
              />
            )
          })}

          <path d={areaPath} fill="url(#history-month-fill)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-chart-1)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point) => (
            <circle
              key={point.day}
              cx={point.x}
              cy={point.y}
              r={point.totalReps > 0 ? 3.5 : 2.5}
              fill="var(--color-card)"
              stroke="var(--color-chart-1)"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
        <span>Day 1</span>
        <span>Day {middleDay}</span>
        <span>Day {dailyTotals.length}</span>
      </div>

      {!monthHasWork ? (
        <p className="text-sm leading-6 text-muted-foreground">
          No reps logged this month yet. Finish a challenge to start the graph.
        </p>
      ) : null}
    </div>
  )
}
