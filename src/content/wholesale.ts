import { z } from 'zod'

export const interests = [
  'Flower',
  'Vapes',
  'Edibles',
  'Joints & Pre-Rolls',
  'Concentrates',
  'HOUSE OF HELIX Peptide Strips',
  'Other',
] as const
/** The only required signup details; the team collects business information later. */
export const contactSchema = z.object({
  email: z.string().trim().pipe(z.email('Enter a valid email address.').max(254)),
  name: z
    .string()
    .trim()
    .min(1, 'Enter your name.')
    .max(100, 'Use 100 characters or fewer.'),
  phone: z
    .string()
    .trim()
    .max(40, 'Use 40 characters or fewer.')
    .regex(/^[+\d() .-]+$/, 'Enter a valid phone number.')
    .refine(
      (value) =>
        value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 15,
      'Enter a phone number with 10–15 digits.',
    ),
})
export type ContactDetails = z.infer<typeof contactSchema>
export const wholesaleSchema = contactSchema.extend({
  interest: z.enum(interests).optional(),
})

export const categories = [
  {
    title: 'Flower',
    detail: 'Explore bulk flower options with our team.',
    interest: 'Flower',
  },
  {
    title: 'Pre-rolls',
    detail: 'Find pre-roll options for your business.',
    interest: 'Joints & Pre-Rolls',
  },
  {
    title: 'Edibles',
    detail: 'Ask our team about the current edible lineup.',
    interest: 'Edibles',
  },
  {
    title: 'Vapes',
    detail: 'Discuss current wholesale vape options.',
    interest: 'Vapes',
  },
  {
    title: 'Concentrates',
    detail: 'Connect with our team about concentrates.',
    interest: 'Concentrates',
  },
] as const

export const steps = [
  {
    title: 'Sign up',
    detail: 'Start with your email, name and phone number.',
  },
  {
    title: 'Confirm your email',
    detail: 'Check your inbox and follow the verification link.',
  },
  {
    title: 'Meet your salesperson',
    detail: 'Our team follows up with the current menu and helps with your inquiry.',
  },
] as const

export const signupCopy = {
  introduction:
    'Leave your email, name and phone number. Confirm your email, then our team can follow up with the current wholesale materials and discuss what you need.',
  helix:
    'Smoke Show supplies HOUSE OF HELIX peptide strips in bulk. Request the menu and speak with our sales team about wholesale options.',
} as const
