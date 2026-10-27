import { z } from 'zod'

export const boundsSchema = z.object({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative()
})

export const navigateSchema = z.object({
  url: z.string().min(1).max(4096)
})

export const enabledSchema = z.object({
  enabled: z.boolean()
})

export const idSchema = z.object({
  id: z.string().min(1)
})

export const saveApiSchema = z.object({
  name: z.string().trim().min(1).max(120),
  identity: z.string().min(1),
  activateRule: z.boolean(),
  replaceExistingId: z.string().min(1).optional(),
  saveAsNew: z.boolean().optional()
})

export const matchCriteriaSchema = z.object({
  origin: z.string().min(1),
  path: z.string().min(1),
  method: z.string().min(1),
  query: z.record(z.string(), z.string()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  jsonBody: z.record(z.string(), z.unknown()).optional()
})

export const requestOverrideSchema = z.object({
  method: z.string().optional(),
  url: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  postData: z.string().optional()
})

export const responseOverrideSchema = z.object({
  status: z.number().int().min(100).max(599),
  statusText: z.string().optional(),
  headers: z.record(z.string(), z.string()),
  body: z.string()
})

export const updateRuleSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean().optional(),
  priority: z.number().int().optional(),
  interceptionMode: z.enum(['mock-response', 'modify-and-forward']).optional(),
  matchCriteria: matchCriteriaSchema.optional(),
  requestOverride: requestOverrideSchema.optional(),
  responseOverride: responseOverrideSchema.optional()
})

export const setPrioritySchema = z.object({
  id: z.string().min(1),
  priority: z.number().int()
})

export const testMatchSchema = z.object({
  ruleId: z.string().min(1),
  identity: z.string().min(1)
})
