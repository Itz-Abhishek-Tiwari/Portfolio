import { z } from 'zod';
import { contactTopics, type ContactMessage } from '@/lib/contact';
import { DatabaseError, readDoc, updateDoc } from './db';

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100),
  email: z.string().trim().email('Enter a valid email address').max(254),
  topic: z.enum(contactTopics),
  message: z.string().trim().min(10, 'Write at least 10 characters').max(4000),
  website: z.string().max(200).optional().default('')
});

// Messages and the per-visitor rate limits share one document, so the limit check and the insert
// land in the same conditional write, like the single SQL function they replace.
const PATH = 'data/inbox.json';
const HOUR = 60 * 60 * 1000;
type Limit = { started: number; attempts: number };
type Inbox = { messages: ContactMessage[]; limits: Record<string, Limit> };
const empty: Inbox = { messages: [], limits: {} };

export async function submitContact(
  fields: Pick<ContactMessage, 'name' | 'email' | 'topic' | 'message'>,
  bucket: string
) {
  return updateDoc(PATH, empty, inbox => {
    const now = Date.now(),
      limits = Object.fromEntries(Object.entries(inbox.limits).filter(([, l]) => now - l.started < HOUR)),
      limit = limits[bucket] ?? { started: now, attempts: 0 };
    limits[bucket] = { ...limit, attempts: limit.attempts + 1 };
    if (limits[bucket].attempts > 5) throw new DatabaseError('Too many messages. Please try again later.', 429);
    const message: ContactMessage = {
      id: crypto.randomUUID(),
      ...fields,
      status: 'new',
      created_at: new Date(now).toISOString()
    };
    return { data: { messages: [message, ...inbox.messages], limits }, result: { id: message.id } };
  });
}

/** Newest first, 50 at a time; `before` continues after the last message of the previous page. */
export async function listMessages(before?: { before: string; id: string }) {
  const messages = (await readDoc<Inbox>(PATH))?.data.messages ?? [];
  let start = 0;
  if (before) {
    const index = messages.findIndex(m => m.id === before.id);
    start = index >= 0 ? index + 1 : messages.filter(m => m.created_at >= before.before).length;
  }
  return messages.slice(start, start + 50);
}

export async function setMessageStatus(id: string, status: ContactMessage['status']) {
  return updateDoc(PATH, empty, inbox => {
    const index = inbox.messages.findIndex(m => m.id === id);
    if (index < 0) return { data: inbox, result: null };
    const message = { ...inbox.messages[index], status };
    return { data: { ...inbox, messages: inbox.messages.with(index, message) }, result: message };
  });
}
