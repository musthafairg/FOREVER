import { z } from "zod";

export const couponSchema = z.object({
  body: z
    .object({
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

      maxPurchase: z.coerce
        .number()
        .min(0, "Maximum purchase cannot be negative")
        .optional(),


      maxDiscount: z.coerce
        .number()
        .min(0, "Maximum discount cannot be negative")
        .optional(),

      expiryDate: z
        .string()
        .refine(
          (date) => new Date(date) > new Date(),
          "Expiry date must be in the future"
        ),

      usageLimit: z.coerce
        .number()
        .min(1, "Usage limit must be at least 1")
        .optional(),
    })
    .superRefine((data, ctx) => {
      const { discountType, discountValue, minPurchase , maxPurchase } = data;

      if (minPurchase !== undefined) {
    
        if (discountType === "FLAT" && minPurchase <= discountValue) {
          ctx.addIssue({
            path: ["minPurchase"],
            message: "Minimum purchase must be greater than discount amount",
          });
        }

        if (discountType === "PERCENT" && minPurchase <= 0) {
          ctx.addIssue({
            path: ["minPurchase"],
            message: "Minimum purchase must be greater than 0",
          });
        }

        if(discountType==="PERCENT")  {
          const maxPossibleDiscount = (minPurchase * discountValue) / 100;
          if (maxPossibleDiscount > minPurchase) {
            ctx.addIssue({
              path: ["discountValue"],
              message: "Discount percentage is too high for the minimum purchase",
            });
          }
        }

        if(maxPurchase !== undefined && minPurchase > maxPurchase) {
          ctx.addIssue({
            path: ["maxPurchase"],
            message: "Maximum purchase must be greater than or equal to minimum purchase",
          });
        }

        if(maxPurchase !== undefined && discountType === "PERCENT") {
          const maxPossibleDiscount = (maxPurchase * discountValue) / 100;
          if (maxPossibleDiscount > maxPurchase) {
            ctx.addIssue({
              path: ["discountValue"],
              message: "Discount percentage is too high for the maximum purchase",
            });
          }
        }
        

      }
    }),
});
