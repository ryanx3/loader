import { z } from "zod";

export const minisomResultsByTypeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type MinisomResultsByTypeDTO = z.infer<
  typeof minisomResultsByTypeSchema
>;
