import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

type ChallengeDoc = {
  _id: string
  challengeType: "pushup"
  completedAt: number
  repsCount: number
}

function toChallengeRecord(challenge: ChallengeDoc) {
  return {
    id: challenge._id,
    challenge_type: challenge.challengeType,
    timestamp: new Date(challenge.completedAt).toISOString(),
    reps_count: challenge.repsCount,
  }
}

export const create = mutation({
  args: {
    challengeType: v.literal("pushup"),
    completedAt: v.number(),
    repsCount: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("challenges", args)

    return toChallengeRecord({
      _id: id,
      ...args,
    })
  },
})

export const listRecent = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(0, Math.floor(args.limit))

    if (limit === 0) {
      return []
    }

    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_completedAt")
      .order("desc")
      .take(limit)

    return challenges.map(toChallengeRecord)
  },
})

export const listForMonth = query({
  args: {
    startMs: v.number(),
    endMs: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.startMs >= args.endMs) {
      return []
    }

    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_completedAt", (q) =>
        q.gte("completedAt", args.startMs).lt("completedAt", args.endMs)
      )
      .order("desc")
      .collect()

    return challenges.map(toChallengeRecord)
  },
})
