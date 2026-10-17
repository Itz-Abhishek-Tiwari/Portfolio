'use client';
import { useSyncExternalStore } from 'react';
import { idleMusicSnapshot, musicSnapshot, onMusicState, toggleMusic } from '@/lib/events';

/** Now-playing control in the header: a small record that spins with the music and opens the player. */
export default function HeaderMusicButton() {
  const music = useSyncExternalStore(onMusicState, musicSnapshot, idleMusicSnapshot);
  const label = music.playing && music.title ? music.title : 'Soundtrack';
  return (
    <button
      type="button"
      data-music-toggle
      className={'header-music' + (music.playing ? ' is-playing' : '') + (music.shown ? ' is-open' : '')}
      aria-expanded={music.shown}
      aria-label={
        (music.shown ? 'Hide' : 'Open') + ' music player' + (music.playing ? ', playing ' + label : '')
      }
      onClick={toggleMusic}
    >
      <span className="header-music-disc" aria-hidden="true" />
      <span className="header-music-bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="header-music-label" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}
