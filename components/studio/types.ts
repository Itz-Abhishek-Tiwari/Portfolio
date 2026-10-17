import type { Content } from '@/lib/content';

/** Validation messages keyed by field path, e.g. "projects.0.title". */
export type Issues = Record<string, string>;
export type UpdateContent = <K extends keyof Content>(key: K, value: Content[K]) => void;
export type UploadFile = (
  file: File | undefined,
  apply: (url: string) => void,
  kind: 'image' | 'resume'
) => void;
/** Uploads several images in sequence and applies every URL that succeeded at once. */
export type UploadFiles = (files: File[], apply: (urls: string[]) => void) => void;

/** What every studio tab panel receives. */
export type PanelProps = { content: Content; update: UpdateContent; issues: Issues };
