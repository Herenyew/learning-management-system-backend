// src/modules/training-effectiveness/training-effectiveness.dto.ts
import { z } from 'zod';

// ──────────────────────────────────────────────────────────────
// 1. Create Effectiveness Weight Config
// ──────────────────────────────────────────────────────────────

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createEffectivenessWeightConfigSchema = z.object({
  reactionWeight: z.number().min(0).max(100, { message: "Reaction weight must be between 0 and 100." }),
  learningWeight: z.number().min(0).max(100, { message: "Learning weight must be between 0 and 100." }),
  behaviorWeight: z.number().min(0).max(100, { message: "Behavior weight must be between 0 and 100." }),
  resultsWeight: z.number().min(0).max(100, { message: "Results weight must be between 0 and 100." }),
  isActive: z.boolean().default(true).optional(),
  effectiveFrom: z.string().datetime({ message: "Effective from must be a valid ISO datetime." }).optional(),
});

// DTO schemas only — types moved to training-effectiveness.types.ts

// ──────────────────────────────────────────────────────────────
// 2. Update Effectiveness Weight Config
// ──────────────────────────────────────────────────────────────

export const updateEffectivenessWeightConfigSchema = createEffectivenessWeightConfigSchema
  .partial()
  .refine(
    (data) => {
      // Ensure at least one field is provided for update
      return Object.keys(data).length > 0;
    },
    { message: "At least one field is required for update." }
  );


// ──────────────────────────────────────────────────────────────
// 3. Filter & Pagination
// ──────────────────────────────────────────────────────────────

export const effectivenessWeightConfigFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  isActive: z.coerce.boolean().optional(),
});

// DTO schemas only — types moved to training-effectiveness.types.ts