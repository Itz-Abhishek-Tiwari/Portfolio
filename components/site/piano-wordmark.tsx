'use client';
import { useEffect, useRef, useState } from 'react';

// C major pentatonic from C4 upward: any order of letters sounds like a phrase, never a clash.
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
const CHORD = [523.25, 659.25, 783.99]; // C major, for the full stop

type Piano = { ctx: AudioContext; out: GainNode };

/** A soft synthesized piano note: a bright attack that mellows as it decays, like a struck string. */
function strike({ ctx, out }: Piano, freq: number, level = 1) {
  const now = ctx.currentTime;
  const tone = ctx.createGain();
  tone.gain.setValueAtTime(0, now);
  tone.gain.linearRampToValueAtTime(0.32 * level, now + 0.006);
  tone.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(5200, now);
  filter.frequency.exponentialRampToValueAtTime(900, now + 1.2);
  filter.connect(tone).connect(out);
  // Fundamental plus two quieter overtones, each slightly detuned, gives the body of a piano string.
  [
    { type: 'triangle', mult: 1, gain: 1 },
    { type: 'sine', mult: 2, gain: 0.35 },
    { type: 'sine', mult: 3, gain: 0.12 }
  ].forEach(({ type, mult, gain }) => {
    const osc = ctx.createOscillator();
    osc.type = type as OscillatorType;
    osc.frequency.value = freq * mult;
    osc.detune.value = (Math.random() - 0.5) * 6;
    const g = ctx.createGain();
    g.gain.value = gain;
    osc.connect(g).connect(filter);
    osc.start(now);
    osc.stop(now + 2);
  });
}

/** The footer name as a row of piano keys: hover (or tap) a letter to play it. */
export default function PianoWordmark({ word }: { word: string }) {
  const piano = useRef<Piano | null>(null);
  const hint = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  // Browsers only allow sound after a click or key press, so the instrument is built on the first one.
  const unlock = () => {
    if (!piano.current) {
      const ctx = new AudioContext();
      const out = ctx.createGain();
      out.gain.value = 0.5;
      const limiter = ctx.createDynamicsCompressor();
      out.connect(limiter).connect(ctx.destination);
      piano.current = { ctx, out };
    }
    void piano.current.ctx.resume().then(() => setReady(true));
    return piano.current;
  };
  const unlockRef = useRef(unlock);
  useEffect(() => {
    unlockRef.current = unlock;
  });
  useEffect(() => {
    const onFirst = () => unlockRef.current();
    window.addEventListener('pointerdown', onFirst, { once: true });
    window.addEventListener('keydown', onFirst, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirst);
      window.removeEventListener('keydown', onFirst);
      void piano.current?.ctx.close();
      piano.current = null;
    };
  }, []);
  // Still locked: shake the hint so the visitor knows why the key was silent.
  const nudge = () => {
    const el = hint.current;
    if (!el) return;
    delete el.dataset.nudge;
    void el.offsetWidth; // restart the CSS animation
    el.dataset.nudge = '1';
  };
  // One pair of handlers for the whole word: each key carries its note in data-note.
  const play = (target: EventTarget) => {
    const note = (target as HTMLElement).dataset?.note;
    if (note === undefined) return;
    const p = piano.current;
    if (!p || p.ctx.state !== 'running') return nudge();
    if (note === 'chord') CHORD.forEach((f, n) => setTimeout(() => strike(p, f, 0.7), n * 40));
    else strike(p, SCALE[Number(note) % SCALE.length]);
  };
  // Clicking the hint unlocks the sound and answers with a quick rising run, so it's obvious it worked.
  const enable = () => {
    const p = unlock();
    void p.ctx
      .resume()
      .then(() => SCALE.slice(0, 6).forEach((f, n) => setTimeout(() => strike(p, f, 0.6), n * 70)));
  };
  return (
    <div className="footer-piano">
      <p
        className="footer-wordmark"
        aria-hidden="true"
        onPointerOver={e => e.pointerType === 'mouse' && play(e.target)}
        onPointerDown={e => e.pointerType !== 'mouse' && play(e.target)}
      >
        {[...word].map((letter, i) => (
          <span key={i} data-note={i}>
            {letter}
          </span>
        ))}
        <em data-note="chord">.</em>
      </p>
      <button
        ref={hint}
        type="button"
        className={'piano-note' + (ready ? ' is-ready' : '')}
        onClick={enable}
        aria-label={ready ? 'Piano is on: hover or tap the letters of the name' : 'Turn on the piano sound'}
      >
        <em aria-hidden="true">♪</em>
        {ready ? (
          <span>Go on, play the letters.</span>
        ) : (
          <span>
            It&apos;s a piano.
            <br />
            <u>Click once</u>, then play the letters.
          </span>
        )}
      </button>
    </div>
  );
}
