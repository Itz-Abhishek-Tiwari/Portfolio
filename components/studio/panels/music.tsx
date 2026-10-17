import { musicEmbedUrl } from '@/lib/music';
import { Field } from '../field';
import MusicSearch from '../music-search';
import type { PanelProps } from '../types';

export default function MusicPanel({ content, update, issues }: PanelProps) {
  const music = content.music;
  const set = (patch: Partial<typeof music>) => update('music', { ...music, ...patch });
  const embed = musicEmbedUrl(music.playlistUrl);
  return (
    <div className="editor-panel">
      <h3>Listening corner</h3>
      <p className="studio-info">
        Uses the visible YouTube or Spotify player for a single song or a playlist. Visitors choose when to
        play; no audio is extracted or autoplayed.
      </p>
      <label className="checkbox-field">
        <input type="checkbox" checked={music.enabled} onChange={e => set({ enabled: e.target.checked })} />
        Show the listening corner
      </label>
      <MusicSearch onPick={url => set({ playlistUrl: url })} />
      <div className="editor-grid">
        <Field
          label="Player title"
          path="music.title"
          value={music.title}
          onChange={title => set({ title })}
          issues={issues}
        />
        <Field
          label="Song, album or playlist URL"
          path="music.playlistUrl"
          value={music.playlistUrl}
          onChange={playlistUrl => set({ playlistUrl })}
          issues={issues}
          type="url"
          full
          hint="Paste a YouTube, YouTube Music or Spotify link. Spotify plays 30-second previews unless the visitor is logged in."
        />
      </div>
      {embed && (
        <iframe
          className="music-admin-preview"
          title="Player preview"
          src={embed}
          allow="encrypted-media; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      )}
    </div>
  );
}
