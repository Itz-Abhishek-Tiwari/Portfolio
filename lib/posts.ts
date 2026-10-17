import { z } from 'zod';
export const postSchema = z.object({
  title: z.string().trim().min(1).max(140),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens'),
  excerpt: z.string().trim().max(500),
  body: z.string().min(1).max(100000),
  cover: z
    .string()
    .max(600)
    .refine(v => !v || v.startsWith('/assets/') || v.startsWith('/api/media/'), 'Use an uploaded image'),
  tags: z.array(z.string().trim().min(1).max(40)).max(10)
});
export type Post = z.infer<typeof postSchema>;
export type PostRow = {
  id: string;
  slug: string;
  draft: Post;
  published: Post | null;
  revision: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  archived: boolean;
};
