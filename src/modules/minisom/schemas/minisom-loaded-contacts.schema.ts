import { z } from "zod";

export const minisomLoadedContactsSchema = z.object({});

export type MinisomLoadedContactsDTO = z.infer<
  typeof minisomLoadedContactsSchema
>;
