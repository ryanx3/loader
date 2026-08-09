import { z } from "zod";

export const minisom21121Schema = z.object({
  auth_key: z.any(),
  phone_number: z.any(),
  email: z.any(),
  first_name: z.any(),
  bd: z.any(),
  lead_id: z.any(),
  form_id: z.any().optional(),
  last_name: z.any().optional(),
  birth_date: z.any().optional(),
  created_date: z.any().optional(),
  posted_date: z.any().optional(),
  marketing: z.any().optional(),
  privacy: z.any().optional(),
  utm_source: z.any().optional(),
  utm_code: z.any().optional(),
  address: z.any().optional(),
  city: z.any().optional(),
  site_id: z.any().optional(),
  additional2: z.any().optional(),
  additional3: z.any().optional(),
  age: z.any().optional(),
  dif_auditiva: z.any().optional(),
  partner_id: z.any().optional(),
  post_code: z.any().optional(),
});

export type Minisom21121DTO = z.infer<typeof minisom21121Schema>;
