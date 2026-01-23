import { z } from "zod";


export const productOfferSchema = z.object({
  body: z.object({
    productId: z.string().min(1, "Product is required"),
    discount: z.coerce
      .number({ invalid_type_error: "Discount must be a number" })
      .int("Discount must be an integer")
      .min(1, "Minimum discount is 1%")
      .max(90, "Maximum discount is 90%"),
  }),
});



export const categoryOfferSchema = z.object({
  body: z.object({
    categoryId: z.string().min(1, "Category is required"),
    discount: z.coerce
      .number({ invalid_type_error: "Discount must be a number" })
      .int("Discount must be an integer")
      .min(1, "Minimum discount is 1%")
      .max(90, "Maximum discount is 90%"),
  }),
});
