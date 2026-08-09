import { z } from "zod";

export const minisomLoadedContactsSchema = z.object({});

export type MinisomLoadedContactsDTO = z.infer<
  typeof minisomLoadedContactsSchema
>;

export const minisomDashboardSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use yyyy-MM-dd")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use yyyy-MM-dd")
    .optional(),
  bd: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional()
    .default([]),
  tipoBD: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional()
    .default([]),
});

export type MinisomDashboardDTO = z.infer<typeof minisomDashboardSchema>;
