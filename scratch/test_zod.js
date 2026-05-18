import { z } from zod; const schema = z.object({ faceitLevel: z.string() }); console.log(schema.safeParse({ faceitLevel: 10 }).success);
