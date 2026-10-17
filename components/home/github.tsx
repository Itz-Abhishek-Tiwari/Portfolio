import { ArrowUpRight } from 'lucide-react';
import type { Content } from '@/lib/content';
import SiteIcon from '@/components/ui/site-icon';
import RepositoryList from './repository-list';

/** Open-source section: GitHub repositories (loaded on the client) and a LinkedIn call to action. */
export default function Github({ content: c, preview }: { content: Content; preview: boolean }) {
  const icon = { assets: c.iconAssets, style: c.iconStyle, kind: 'interface' as const };
  return (
    <section id="network">
      <div className="section-wrap">
        <div className="network-heading">
          <div className="section-heading-lead">
            <span className="section-kicker">Open source</span>
            <h2>Code &amp; repositories</h2>
          </div>
          <div className="section-heading-aside">
            <p>Public code, experiments, and ways to connect.</p>
          </div>
        </div>
        <div className="code-directory">
          <aside className="code-directory-intro">
            <span className="directory-brand">
              <SiteIcon name="GitHub" {...icon} size={25} />
              <span className="directory-kicker">GITHUB / PUBLIC CODE</span>
            </span>
            <a className="directory-handle" href={c.github} target="_blank" rel="noreferrer">
              @{c.github.split('/').filter(Boolean).pop()}
            </a>
            <a className="directory-profile-link" href={c.github} target="_blank" rel="noreferrer">
              Explore GitHub <ArrowUpRight size={17} />
            </a>
          </aside>
          <RepositoryList github={c.github} preview={preview} />
        </div>
        <div className="linkedin-connection">
          <span className="linkedin-monogram">
            <SiteIcon name="LinkedIn" {...icon} size={30} />
          </span>
          <div className="linkedin-identity">
            <span className="directory-kicker">LINKEDIN / THE NEXT CONVERSATION</span>
            <h3>{c.name}</h3>
          </div>
          <a
            href={c.linkedin}
            target="_blank"
            rel="noreferrer"
            className="linkedin-connect"
            aria-label="View my LinkedIn"
          >
            Let’s connect <ArrowUpRight size={22} />
          </a>
        </div>
      </div>
    </section>
  );
}
