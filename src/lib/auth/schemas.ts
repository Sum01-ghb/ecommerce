import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

const nameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required")
  .max(100, "Name is too long");

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export const cartItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  price: z.number().int().positive(),
  imageUrl: z.string().min(1),
  quantity: z.number().int().min(1),
});

export const cartSchema = z.array(cartItemSchema);

export type CartItemInput = z.infer<typeof cartItemSchema>;

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };