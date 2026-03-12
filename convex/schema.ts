import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  challenges: defineTable({
    challengeType: v.literal("pushup"),
    completedAt: v.number(),
    repsCount: v.number(),
  }).index("by_completedAt", ["completedAt"]),
})
