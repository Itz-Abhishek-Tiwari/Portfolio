import { ArrowUpRight, Gamepad2 } from 'lucide-react';
import type { Content } from '@/lib/content';
import { gameCover, gamePage } from '@/lib/games';
import GameSounds from './game-sounds';
import ShowMore from './show-more';

// The feature plus one row of three; the rest wait behind "Show more".
const VISIBLE = 4;

/** Game center: favourite games picked from RAWG in the studio. Hidden until one is added. */
export default function Games({ content: c }: { content: Content }) {
  const games = c.games;
  if (!games.length) return null;
  return (
    <section className="section-wrap" id="games" aria-labelledby="games-heading">
      <div className="section-heading">
        <div className="section-heading-lead">
          <span className="section-kicker">Game center</span>
          <h2 id="games-heading">
            Worlds I get <em>lost</em> in
          </h2>
        </div>
        <div className="section-heading-aside">
          <p>
            Off the clock, these are the games I keep coming back to.
            {games.some(g => g.sound) && ' Hover or tap a cover to hear its theme.'}
          </p>
        </div>
      </div>
      {/* The first game is the feature; the rest sit in a grid of covers. */}
      <ol className="game-grid" id="game-grid" data-collapsible>
        {games.map((game, index) => {
          const lead = index === 0;
          const meta = [game.released.slice(0, 4), game.genres].filter(Boolean).join(' · ');
          const art = game.image ? (
            <img src={gameCover(game.image, lead ? 640 : 420)} alt="" loading="lazy" decoding="async" />
          ) : (
            <Gamepad2 size={32} aria-hidden="true" />
          );
          return (
            <li
              className={'game-card' + (lead ? ' is-lead' : '') + (index >= VISIBLE ? ' is-extra' : '')}
              key={game.id}
            >
              <div className="game-link">
                {/* With a theme, the cover plays it; otherwise it links to RAWG like the title. */}
                {game.sound ? (
                  <button
                    type="button"
                    className="game-cover is-audible"
                    data-sound-key={game.id}
                    data-sound-video={game.sound.videoId}
                    data-sound-start={game.sound.start}
                    data-state="idle"
                    aria-pressed="false"
                    aria-label={'Play the ' + game.name + ' theme'}
                  >
                    {art}
                    <span className="game-sound" aria-hidden="true">
                      <span className="game-sound-bars">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                      <span className="game-sound-text">Play theme</span>
                    </span>
                  </button>
                ) : (
                  <a
                    className="game-cover"
                    href={gamePage(game.slug)}
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {art}
                  </a>
                )}
                <div className="game-body">
                  <span className="game-top">
                    <span className="game-index">{String(index + 1).padStart(2, '0')}</span>
                    {game.platforms && <span className="game-platforms">{game.platforms}</span>}
                  </span>
                  <h3 className="game-title">
                    <a href={gamePage(game.slug)} target="_blank" rel="noreferrer">
                      {game.name}
                      <ArrowUpRight size={lead ? 22 : 16} aria-hidden="true" />
                    </a>
                  </h3>
                  {meta && <span className="game-meta">{meta}</span>}
                  {game.note && <span className="game-note">{game.note}</span>}
                  {game.metacritic !== null && (
                    <span className="game-score">
                      <b>{game.metacritic}</b> Metacritic
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {games.length > VISIBLE && <ShowMore target="game-grid" hidden={games.length - VISIBLE} noun="games" />}
      <p className="game-credit">
        Game data and art from{' '}
        <a href="https://rawg.io" target="_blank" rel="noreferrer">
          RAWG
        </a>
        {games.some(g => g.sound) && ' · themes via YouTube'}
      </p>
      {games.some(g => g.sound) && <GameSounds />}
    </section>
  );
}
