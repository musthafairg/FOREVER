import { z } from "zod";

export const addressSchema = z.object({
  body: z.object({
    addressType: z.string().min(2, "Address type required"),
    name: z.string().min(3, "Name must be at least 3 characters"),
    houseName: z.string().min(2, "House name required"),
    place: z.string().min(2, "Place required"),
    city: z.string().min(2, "City required"),
    district: z.string().min(2, "District required"),
    state: z.string().min(2, "State required"),
    pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
    phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
    altPhone: z
      .string()
      .regex(/^\d{10}$/, "Alternative phone must be 10 digits")
      .optional(),
  }),
});
