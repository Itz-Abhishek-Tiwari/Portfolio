// Shared by the public contact form and the studio inbox. The zod schema lives server-side
// (lib/server/contact.ts) so the form does not ship a validation library to visitors.
export const contactTopics = ['Project inquiry', 'Work opportunity', 'Collaboration', 'Something else'] as const;

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: 'new' | 'read' | 'archived';
  created_at: string;
};
