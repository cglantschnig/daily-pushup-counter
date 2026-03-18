import { Link, createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { ChevronLeft, LoaderCircle, Trash2 } from "lucide-react"
import { type KeyboardEvent, useRef, useState } from "react"
import { api } from "../../convex/_generated/api"
import { AppScreen } from "@/components/app-screen"
import { Button } from "@/components/ui/button"
import type { ChallengeRecord } from "@/lib/challenges"
import {
  type DailyRepTotal,
  getRollingWeekDailyRepTotals,
  getRollingWeekRange,
} from "@/lib/history"
import { cn } from "@/lib/utils"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

const weekRangeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
})

const chartDetailDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
})
const deleteActionWidth = 92

export const Route = createFileRoute("/history")({
  component: HistoryScreen,
})

function HistoryScreen() {
  const [today] = useState(() => new Date())
  const deleteChallenge = useMutation(api.challenges.deleteOne)
  const [deletingChallengeId, setDeletingChallengeId] = useState<
    ChallengeRecord["id"] | null
  >(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const weekRange = getRollingWeekRange(today)
  const recentChallenges = useQuery(api.challenges.listRecent, { limit: 20 })
  const weekChallenges = useQuery(api.challenges.listForRange, weekRange)
  const isRecentChallengesLoading = recentChallenges === undefined
  const isWeekChallengesLoading = weekChallenges === undefined
  const recentChallengeEntries = recentChallenges ?? []
  const weekChallengeEntries = weekChallenges ?? []
  const dailyTotals = getRollingWeekDailyRepTotals(weekChallengeEntries, today)
  const weekTotal = dailyTotals.reduce((sum, entry) => sum + entry.totalReps, 0)
  const activeDays = dailyTotals.filter((entry) => entry.totalReps > 0).length
  const weekRangeLabel = `${weekRangeFormatter.format(dailyTotals[0]?.date ?? today)} - ${weekRangeFormatter.format(today)}`

  async function handleDeleteChallenge(challenge: ChallengeRecord) {
    setDeletingChallengeId(challenge.id)
    setDeleteError(null)

    try {
      const deleted = await deleteChallenge({ id: challenge.id })

      if (!deleted) {
        setDeleteError(
          "That workout was already removed. Refresh and try again."
        )
      }
    } catch {
      setDeleteError(
        "Could not delete this workout. Check your connection and try again."
      )
    } finally {
      setDeletingChallengeId(null)
    }
  }

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
                  {weekRangeLabel}
                </p>
                <h2 className="mt-1 text-2xl leading-none font-semibold tracking-[-0.05em] text-foreground">
                  Weekly reps
                </h2>
              </div>

              <div className="rounded-[1.25rem] border border-primary/12 bg-primary/8 px-4 py-3 text-right">
                <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-primary uppercase">
                  Week Total
                </p>
                <p className="mt-1 text-2xl leading-none font-semibold tracking-[-0.05em] text-foreground">
                  {isWeekChallengesLoading ? "..." : weekTotal}
                </p>
              </div>
            </div>

            {isWeekChallengesLoading ? (
              <WeekSummarySkeleton />
            ) : (
              <>
                <WeeklyRepsChart dailyTotals={dailyTotals} />

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

          {deleteError ? (
            <div className="mb-4 rounded-[1.25rem] border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm leading-6 text-destructive">
              {deleteError}
            </div>
          ) : null}

          {isRecentChallengesLoading ? (
            <RecentWorkoutsSkeleton />
          ) : recentChallengeEntries.length > 0 ? (
            <div className="space-y-4">
              {recentChallengeEntries.map((challenge, index) => (
                <RecentWorkoutRow
                  key={challenge.id}
                  challenge={challenge}
                  isDeleting={deletingChallengeId === challenge.id}
                  isDeleteDisabled={deletingChallengeId !== null}
                  showDivider={index < recentChallengeEntries.length - 1}
                  onDelete={handleDeleteChallenge}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-primary/20 bg-background/72 px-5 py-8 text-center text-sm leading-6 text-muted-foreground dark:bg-background/32">
              No challenges saved yet. Complete a pushup challenge to see it
              here.
            </div>
          )}
        </section>
      </div>
    </AppScreen>
  )
}

type RecentWorkoutRowProps = {
  challenge: ChallengeRecord
  isDeleting: boolean
  isDeleteDisabled: boolean
  showDivider: boolean
  onDelete: (challenge: ChallengeRecord) => Promise<void>
}

function RecentWorkoutRow({
  challenge,
  isDeleting,
  isDeleteDisabled,
  showDivider,
  onDelete,
}: RecentWorkoutRowProps) {
  const swipeContainerRef = useRef<HTMLDivElement | null>(null)
  const challengeDateLabel = dateFormatter.format(new Date(challenge.timestamp))

  function revealDeleteAction() {
    swipeContainerRef.current?.scrollTo({
      left: deleteActionWidth,
      behavior: "smooth",
    })
  }

  function hideDeleteAction() {
    swipeContainerRef.current?.scrollTo({
      left: 0,
      behavior: "smooth",
    })
  }

  return (
    <article>
      <div className="overflow-hidden rounded-[1.35rem]">
        <div
          ref={swipeContainerRef}
          className="swipe-reveal snap-x snap-mandatory overflow-x-auto scroll-smooth"
          style={{ overscrollBehaviorX: "contain" }}
        >
          <div
            className="flex items-stretch"
            style={{ width: `calc(100% + ${deleteActionWidth}px)` }}
          >
            <div
              className="w-full min-w-0 shrink-0 snap-start rounded-[1.35rem] bg-background/54 px-1 py-1"
              onClick={hideDeleteAction}
            >
              <div className="rounded-[1.1rem] px-3 py-3">
                <div>
                  <p className="text-2xl leading-none font-semibold tracking-[-0.05em] text-foreground">
                    {challenge.reps_count} reps
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {challengeDateLabel}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="shrink-0 snap-end pl-2"
              style={{ width: deleteActionWidth }}
            >
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="h-full w-full rounded-[1.25rem]"
                disabled={isDeleteDisabled}
                aria-label={`Delete ${challenge.reps_count} rep workout from ${challengeDateLabel}`}
                onFocus={revealDeleteAction}
                onClick={() => void onDelete(challenge)}
              >
                {isDeleting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Trash2 />
                )}
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showDivider ? <div className="mt-4 h-px bg-primary/10" /> : null}
    </article>
  )
}

function WeekSummarySkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-live="polite"
      aria-label="Loading weekly workout history"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin text-primary" />
        <span>Loading weekly history</span>
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

type WeeklyRepsChartProps = {
  dailyTotals: Array<DailyRepTotal>
}

function WeeklyRepsChart({ dailyTotals }: WeeklyRepsChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const chartWidth = 320
  const chartHeight = 212
  const paddingX = 12
  const paddingTop = 52
  const paddingBottom = 18
  const plotWidth = chartWidth - paddingX * 2
  const plotHeight = chartHeight - paddingTop - paddingBottom
  const maxReps = Math.max(...dailyTotals.map((entry) => entry.totalReps), 1)
  const averageDailyReps =
    dailyTotals.reduce((sum, entry) => sum + entry.totalReps, 0) /
    dailyTotals.length
  const averageLabel = averageDailyReps.toFixed(1)
  const baselineY = paddingTop + plotHeight
  const averageY = baselineY - (averageDailyReps / maxReps) * plotHeight
  const gap = 4
  const rawBarWidth =
    (plotWidth - gap * (dailyTotals.length - 1)) / dailyTotals.length
  const barWidth = Math.max(Math.min(rawBarWidth, 18), 3)
  const totalBarsWidth =
    dailyTotals.length * barWidth + (dailyTotals.length - 1) * gap
  const startX = paddingX + (plotWidth - totalBarsWidth) / 2
  const selectedBar = selectedIndex === null ? null : dailyTotals[selectedIndex]
  const bars = dailyTotals.map((entry, index) => {
    const height = (entry.totalReps / maxReps) * plotHeight
    const x = startX + index * (barWidth + gap)
    const y = baselineY - height

    return {
      ...entry,
      height,
      index,
      x,
      y,
    }
  })
  const guideValues = Array.from(
    new Set([maxReps, Math.round(maxReps / 2), 0])
  ).sort((left, right) => right - left)
  const weekHasWork = dailyTotals.some((entry) => entry.totalReps > 0)
  const selectedChartBar = selectedIndex === null ? null : bars[selectedIndex]
  const detailWidth = 126
  const detailHeight = 32
  const detailAnchorX = selectedChartBar
    ? Math.min(
        Math.max(selectedChartBar.x + barWidth / 2, paddingX + detailWidth / 2),
        chartWidth - paddingX - detailWidth / 2
      )
    : null
  const detailLineTopY = 38
  const detailBoxY = 8
  const detailDateLabel = selectedBar
    ? chartDetailDateFormatter.format(selectedBar.date)
    : null
  const detailSummaryLabel = selectedBar
    ? `${selectedBar.workoutCount} workout${selectedBar.workoutCount === 1 ? "" : "s"} • ${selectedBar.totalReps} reps`
    : null
  const handleBarKeyDown = (
    event: KeyboardEvent<SVGRectElement>,
    index: number
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    setSelectedIndex(index)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[1.5rem] border border-border/60 bg-background/72 p-3">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="block h-48 w-full"
          role="group"
          aria-label="Interactive bar chart of daily reps totals for the last seven days"
        >
          <defs>
            <linearGradient
              id="history-week-bar-fill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--color-chart-1)"
                stopOpacity="0.9"
              />
              <stop
                offset="100%"
                stopColor="var(--color-chart-1)"
                stopOpacity="0.35"
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

          <line
            x1={paddingX}
            y1={averageY}
            x2={chartWidth - paddingX}
            y2={averageY}
            stroke="var(--color-chart-2)"
            strokeDasharray="6 4"
            strokeWidth="1.5"
            opacity="0.95"
          />

          {detailAnchorX !== null &&
          selectedChartBar &&
          detailDateLabel &&
          detailSummaryLabel ? (
            <g aria-hidden="true">
              <path
                d={`M ${detailAnchorX} ${detailLineTopY} L ${selectedChartBar.x + barWidth / 2} ${Math.max(selectedChartBar.y - 6, paddingTop + 4)}`}
                stroke="var(--color-chart-1)"
                strokeOpacity="0.5"
                strokeWidth="1.5"
                strokeDasharray="3 4"
              />
              <rect
                x={detailAnchorX - detailWidth / 2}
                y={detailBoxY}
                width={detailWidth}
                height={detailHeight}
                rx={12}
                fill="var(--color-background)"
                fillOpacity="0.95"
                stroke="var(--color-chart-1)"
                strokeOpacity="0.25"
              />
              <text
                x={detailAnchorX}
                y={detailBoxY + 12}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="var(--color-muted-foreground)"
              >
                {detailDateLabel}
              </text>
              <text
                x={detailAnchorX}
                y={detailBoxY + 24}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="var(--color-foreground)"
              >
                {detailSummaryLabel}
              </text>
            </g>
          ) : null}

          {bars.map((bar) => {
            const isSelected = bar.index === selectedIndex

            return (
              <g key={bar.date.toISOString()}>
                <rect
                  x={Math.max(bar.x - 4, paddingX)}
                  y={paddingTop}
                  width={barWidth + 8}
                  height={plotHeight}
                  rx={Math.min((barWidth + 8) / 2, 8)}
                  fill="transparent"
                  className="cursor-pointer"
                  tabIndex={0}
                  focusable="true"
                  role="button"
                  aria-label={`${chartDetailDateFormatter.format(bar.date)}, ${bar.workoutCount} workout${bar.workoutCount === 1 ? "" : "s"}, ${bar.totalReps} reps`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedIndex(bar.index)}
                  onKeyDown={(event) => handleBarKeyDown(event, bar.index)}
                />
                <rect
                  x={bar.x}
                  y={bar.totalReps > 0 ? bar.y : baselineY - 1.5}
                  width={barWidth}
                  height={bar.totalReps > 0 ? bar.height : 1.5}
                  rx={Math.min(barWidth / 2, 6)}
                  fill="url(#history-week-bar-fill)"
                  stroke="var(--color-chart-1)"
                  strokeOpacity={
                    isSelected ? 0.8 : bar.totalReps > 0 ? 0.2 : 0.12
                  }
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={selectedIndex === null || isSelected ? 1 : 0.7}
                />
              </g>
            )
          })}

          <g transform={`translate(${chartWidth - paddingX - 4}, ${averageY})`}>
            <rect
              x={-52}
              y={-11}
              width={52}
              height={18}
              rx={9}
              fill="var(--color-background)"
              fillOpacity="0.92"
              stroke="var(--color-chart-2)"
              strokeOpacity="0.35"
            />
            <text
              x={-8}
              y={2}
              textAnchor="end"
              fontSize="10"
              fontWeight="600"
              fill="var(--color-chart-2)"
            >
              {`Avg ${averageLabel}`}
            </text>
          </g>
        </svg>

        <div
          className="mt-3 min-h-6 text-center text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase"
          aria-live="polite"
        >
          {selectedBar
            ? `${detailDateLabel}: ${detailSummaryLabel}`
            : "Tap a bar to inspect that day"}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {dailyTotals.map((entry, index) => (
          <div
            key={entry.date.toISOString()}
            className={cn(
              "rounded-xl px-1 py-2 text-[0.65rem] font-medium text-muted-foreground",
              entry.isToday && "bg-primary/10 text-primary",
              selectedIndex === index && "bg-primary/16 text-primary"
            )}
          >
            <span className="block tracking-[0.12em] uppercase">
              {weekdayFormatter.format(entry.date)}
            </span>
            <span className="mt-1 block text-[0.75rem] tracking-normal text-foreground">
              {entry.date.getDate()}
            </span>
          </div>
        ))}
      </div>

      {!weekHasWork ? (
        <p className="text-sm leading-6 text-muted-foreground">
          No reps logged in the last 7 days yet. Finish a challenge to start the
          graph.
        </p>
      ) : null}
    </div>
  )
}
