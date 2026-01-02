import { z } from "zod";

export const updateStockSchema = z.object({
  body: z.object({
    quantity: z
      .number({ invalid_type_error: "Quantity must be a number" })
      .int("Quantity must be an integer")
      .min(0, "Quantity cannot be negative")
  }),
  params: z.object({
    id: z.string().min(1, "Product ID required")
  })
});
