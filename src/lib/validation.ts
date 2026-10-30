import { z } from "zod";
import { MAX_DOCUMENT_HTML } from "./content";

export const TITLE_MAX = 120;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Enter your email address.")
    .max(254)
    .email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(200),
});

export const createDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the document a title.")
    .max(TITLE_MAX, `Keep titles under ${TITLE_MAX} characters.`)
    .optional(),
});

export const updateDocumentSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "A document needs a title.")
      .max(TITLE_MAX, `Keep titles under ${TITLE_MAX} characters.`)
      .optional(),
    content: z
      .string()
      .max(MAX_DOCUMENT_HTML, "This document is too large to save.")
      .optional(),
  })
  .refine((value) => value.title !== undefined || value.content !== undefined, {
    message: "Nothing to update.",
  });

export const shareSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Enter the person's email address.")
    .max(254)
    .email("Enter a valid email address."),
  role: z.enum(["editor", "viewer"], {
    message: "Choose either viewer or editor access.",
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
