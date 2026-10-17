import { z } from 'zod';

const RAWG_MEDIA = 'https://media.rawg.io/media/';

/** A favourite game. Details are copied from RAWG when it is picked in the studio, so the site never calls RAWG. */
export const gameSchema = z.object({
  id: z.string().min(1).max(100),
  rawgId: z.number().int().positive(),
  slug: z
    .string()
    .max(160)
    .regex(/^[a-z0-9-]+$/, 'Use a RAWG game slug'),
  name: z.string().trim().min(1).max(120),
  image: z
    .string()
    .max(600)
    .refine(v => !v || v.startsWith(RAWG_MEDIA), 'Use a RAWG cover image')
    .default(''),
  released: z.string().max(10).default(''),
  genres: z.string().max(160).default(''),
  platforms: z.string().max(200).default(''),
  metacritic: z.number().int().min(0).max(100).nullable().default(null),
  note: z.string().trim().max(160).default(''),
  /** A YouTube clip of the game's theme, played for a few seconds when the cover is clicked. */
  sound: z
    .object({
      videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'Use a YouTube video'),
      start: z.number().int().min(0).max(36000),
      title: z.string().max(200).default('')
    })
    .nullable()
    .default(null),
  /** Set when the owner removed the sound, so the studio stops finding one automatically. */
  soundOff: z.boolean().default(false)
});
export type Game = z.infer<typeof gameSchema>;
/** A RAWG search hit, before it gets an id and a note. */
export type GameResult = Omit<Game, 'id' | 'note' | 'sound' | 'soundOff'>;
export type GameSound = NonNullable<Game['sound']>;
/** How long a theme plays when a cover is clicked, including the fade-out. */
export const GAME_CLIP_SECONDS = 7;

/** RAWG serves resized covers from the same CDN; full-size ones are several megabytes. */
export const gameCover = (image: string, width: 420 | 640 = 640) =>
  image.startsWith(RAWG_MEDIA) ? image.replace(RAWG_MEDIA, RAWG_MEDIA + 'resize/' + width + '/-/') : image;

export const gamePage = (slug: string) => 'https://rawg.io/games/' + slug;
