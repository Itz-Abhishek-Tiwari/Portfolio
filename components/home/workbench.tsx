import Link from 'next/link';
import { ArrowUpRight, Music2 } from 'lucide-react';
import type { Content } from '@/lib/content';
import { projectPath } from '@/lib/projects';
import OpenMusicButton from '@/components/music/open-music-button';

const rig = [
  { role: 'OS', name: 'Arch Linux' },
  { role: 'Compositor', name: 'Hyprland' },
  { role: 'Editor', name: 'Neovim' },
  { role: 'Terminal', name: 'Alacritty' },
  { role: 'Bar', name: 'Waybar' },
  { role: 'Dotfiles', name: 'GNU Stow' }
];

export default function Workbench({
  nami,
  draftMode,
  musicAvailable
}: {
  nami?: Content['projects'][number];
  draftMode: boolean;
  musicAvailable: boolean;
}) {
  return (
    <section id="play" className="section-wrap" aria-labelledby="play-heading">
      <div className="section-heading">
        <div className="section-heading-lead">
          <span className="section-kicker">Beyond work</span>
          <h2 id="play-heading">
            My <em>workbench</em>
          </h2>
        </div>
      </div>
      <div className="workbench">
        <figure className="workbench-window">
          <div className="workbench-bar" aria-hidden="true">
            <span className="workbench-dots">
              <i />
              <i />
              <i />
            </span>
            <span>~/.dotfiles — hyprland</span>
          </div>
          <div className="workbench-screen">
            <img
              src="/assets/nami-desktop.png"
              alt="Customized Arch Linux desktop setup with NamiConfig"
              loading="lazy"
              decoding="async"
            />
          </div>
        </figure>
        <div className="workbench-copy">
          <h3>
            I built my desktop <em>from scratch.</em>
          </h3>
          <p>
            Modular dotfiles where every tool shares one theme, and the notification centre is rebuilt in
            Meson and Ninja.
          </p>
          <dl className="workbench-rig">
            {rig.map(item => (
              <div key={item.role}>
                <dt>{item.role}</dt>
                <dd>{item.name}</dd>
              </div>
            ))}
          </dl>
          <div className="workbench-actions">
            {nami && (
              <Link href={projectPath(nami) + (draftMode ? '?preview=1' : '')} className="text-link">
                NamiConfig case study <ArrowUpRight size={14} />
              </Link>
            )}
            {musicAvailable && (
              <OpenMusicButton className="text-button">
                Open listening corner <Music2 size={15} />
              </OpenMusicButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
