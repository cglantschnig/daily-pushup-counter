import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  challenges: defineTable({
    challengeType: v.literal("pushup"),
    completedAt: v.number(),
    repsCount: v.number(),
    userId: v.string(),
  }).index("by_userId_completedAt", ["userId", "completedAt"]),
})
