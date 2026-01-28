import { z } from "zod";

export const salesReportSchema = z.object({
  query: z
    .object({
      filter: z
        .enum(["today", "week", "month", "year", "custom"])
        .default("today"),

      from: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: "Invalid start date",
        }),

      to: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: "Invalid end date",
        }),
    })
    .superRefine((data, ctx) => {
      if (data.filter === "custom") {
        if (!data.from || !data.to) {
          ctx.addIssue({
            path: ["from"],
            message: "From and To dates are required for custom filter",
          });
        } else if (new Date(data.from) > new Date(data.to)) {
          ctx.addIssue({
            path: ["to"],
            message: "End date must be after start date",
          });
        }
      }
    }),
});
