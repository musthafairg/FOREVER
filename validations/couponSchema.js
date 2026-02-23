import { z } from "zod";

export const couponSchema = z.object({
  body: z
    .object({
      code: z
        .string()
        .min(3, "Coupon code must be at least 3 characters")
        .max(20, "Coupon code is too long")
        .regex(/^[A-Z0-9]+$/, "Only uppercase letters and numbers allowed"),

      discountType: z.enum(["PERCENT", "FLAT"]),

      discountValue: z.coerce
        .number()
        .positive("Discount must be greater than 0"),

      minPurchase: z.coerce
        .number()
        .min(0, "Minimum purchase cannot be negative")
        .optional(),

      maxPurchase: z.coerce
        .number()
        .min(0, "Maximum purchase cannot be negative")
        .optional(),

      maxDiscount: z.coerce
        .number()
        .min(0, "Maximum discount cannot be negative")
        .optional(),

      expiryDate: z.string().refine(
        (date) => new Date(date) > new Date(),
        "Expiry date must be in the future"
      ),

      usageLimit: z.coerce
        .number()
        .min(1, "Usage limit must be at least 1")
        .optional(),
    })
    .superRefine((data, ctx) => {
      const {
        discountType,
        discountValue,
        minPurchase,
        maxPurchase,
        maxDiscount,
      } = data;

      // FLAT validation
      if (discountType === "FLAT") {
        if (minPurchase && discountValue >= minPurchase) {
          ctx.addIssue({
            path: ["discountValue"],
            message: "Flat discount must be less than minimum purchase",
          });
        }
      }

      // PERCENT validation
      if (discountType === "PERCENT") {
        if (discountValue > 90) {
          ctx.addIssue({
            path: ["discountValue"],
            message: "Percentage discount cannot exceed 90%",
          });
        }

        if (!maxDiscount) {
          ctx.addIssue({
            path: ["maxDiscount"],
            message: "Maximum discount cap is required for percentage coupons",
          });
        }
      }

      if (maxPurchase && minPurchase && maxPurchase < minPurchase) {
        ctx.addIssue({
          path: ["maxPurchase"],
          message:
            "Maximum purchase must be greater than or equal to minimum purchase",
        });
      }
    }),
});