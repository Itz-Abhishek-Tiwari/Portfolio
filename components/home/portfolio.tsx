import type { Content } from '@/lib/content';
import { siteInfo } from '@/lib/site';
import SiteShell from '@/components/site/site-shell';
import PortfolioMotion from './portfolio-motion';
import Hero from './hero';
import Stats from './stats';
import Ticker from './ticker';
import Projects from './projects';
import Services from './services';
import About from './about';
import Skills from './skills';
import AiTools from './ai-tools';
import Experience from './experience';
import Journal, { type JournalPost } from './journal';
import Workbench from './workbench';
import Games from './games';
import Github from './github';
import Contact from './contact';

/** The home page. A server component; only the motion wrapper and interactive widgets hydrate. */
export default function Portfolio({
  content: c,
  previewMode = false,
  draftMode = false,
  posts = []
}: {
  content: Content;
  /** Embedded in the studio's live preview: no entrance animations. */
  previewMode?: boolean;
  /** Showing unpublished content to the admin. */
  draftMode?: boolean;
  posts?: JournalPost[];
}) {
  const site = siteInfo(c);
  const projects = c.projects.filter(p => p.featured);
  return (
    <SiteShell site={site} draft={draftMode}>
      <PortfolioMotion enabled={c.motion && !previewMode}>
        <Hero content={c} />
        <Stats content={c} postCount={posts.length} />
        <Ticker content={c} />
        <Projects projects={projects} draftMode={draftMode} />
        <Services />
        <About content={c} />
        <Skills content={c} />
        <AiTools content={c} />
        <Experience content={c} />
        <Journal posts={posts} />
        <Workbench
          nami={projects.find(p => /nami/i.test(p.title))}
          draftMode={draftMode}
          musicAvailable={site.music && !draftMode}
        />
        <Games content={c} />
        <Github content={c} preview={draftMode} />
        <Contact content={c} />
      </PortfolioMotion>
    </SiteShell>
  );
}
