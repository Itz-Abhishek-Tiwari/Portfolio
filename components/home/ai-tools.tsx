import { ArrowUpRight, Sparkles } from 'lucide-react';
import type { Content } from '@/lib/content';
import SiteIcon from '@/components/ui/site-icon';

export default function AiTools({ content: c }: { content: Content }) {
  const tools = c.aiTools;
  if (!tools.length) return null;
  return (
    <section className="section-wrap" id="ai" aria-labelledby="ai-heading">
      <div className="section-heading">
        <div className="section-heading-lead">
          <span className="section-kicker">AI tools</span>
          <h2 id="ai-heading">
            My AI <em>toolkit</em>
          </h2>
        </div>
        <div className="section-heading-aside">
          <p>The assistants I pair with, and what I use each one for.</p>
        </div>
      </div>
      <ol className="ai-list">
        {tools.map((tool, index) => {
          const body = (
            <>
              <span className="ai-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="ai-mark">
                <SiteIcon
                  name={tool.name}
                  assets={c.iconAssets}
                  style={c.iconStyle}
                  fallback={Sparkles}
                  size={26}
                />
              </span>
              <span className="ai-name">
                <span>{tool.name}</span>
              </span>
              {tool.use && <span className="ai-use">{tool.use}</span>}
              <span className="ai-go" aria-hidden="true">
                {tool.url && <ArrowUpRight size={22} />}
              </span>
            </>
          );
          return (
            <li key={tool.id} className="ai-row">
              {tool.url ? (
                <a className="ai-card" href={tool.url} target="_blank" rel="noopener noreferrer">
                  {body}
                </a>
              ) : (
                <div className="ai-card">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
