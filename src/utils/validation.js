import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50, 'Display name must be under 50 characters').trim(),
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  gender: z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: 'Please select a gender' }) }),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits').optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  username: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional().or(z.literal('')),
});

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long').refine(s => !s.includes('\0'), 'Invalid characters in message'),
  subject: z.string().max(200).optional(),
});

export const searchSchema = z.object({
  query: z.string().max(200).regex(/^[a-zA-Z0-9\s\-_.,]+$/, 'Invalid search characters').optional(),
});

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return { valid: true, data: result.data, errors: {} };
  const errors = {};
  result.error.errors.forEach(err => {
    const field = err.path.join('.');
    if (!errors[field]) errors[field] = err.message;
  });
  return { valid: false, data: null, errors };
}

export default { profileSchema, messageSchema, searchSchema, validate };
