import { z } from "zod";

export const couponSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(3, "Coupon code must be at least 3 characters")
      .max(20, "Coupon code is too long")
      .regex(/^[A-Z0-9]+$/, "Only uppercase letters and numbers allowed"),

    discountType: z.enum(["PERCENT", "FLAT"], {
      errorMap: () => ({ message: "Invalid discount type" }),
    }),

    discountValue: z.coerce
      .number()
      .positive("Discount must be greater than 0"),

    minPurchase: z.coerce
      .number()
      .min(0, "Minimum purchase cannot be negative")
      .optional(),

    maxDiscount: z.coerce
      .number()
      .min(0, "Maximum discount cannot be negative")
      .optional(),

    expiryDate: z
      .string()
      .refine(
        (date) => new Date(date) > new Date(),
        "Expiry date must be in the future",
      ),

    usageLimit: z.coerce
      .number()
      .min(1, "Usage limit must be at least 1")
      .optional(),
  }),
});
