import { z } from 'zod';
import { contactTopics } from '@/lib/contact';

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100),
  email: z.string().trim().email('Enter a valid email address').max(254),
  topic: z.enum(contactTopics),
  message: z.string().trim().min(10, 'Write at least 10 characters').max(4000),
  website: z.string().max(200).optional().default('')
});
