import { ArrowUpRight, Download, Eye } from 'lucide-react';
import type { Content } from '@/lib/content';

export default function OverviewPanel({
  content,
  dirty,
  hasUnpublished,
  onEditProfile,
  onPreview,
  onBackup
}: {
  content: Content;
  dirty: boolean;
  hasUnpublished: boolean;
  onEditProfile: () => void;
  onPreview: () => void;
  onBackup: () => void;
}) {
  const stats = [
    ['Featured work', content.projects.filter(p => p.featured).length],
    ['Project archive', content.projects.length],
    ['Experience entries', content.experience.length]
  ] as const;
  return (
    <>
      <div className="studio-stats">
        {stats.map(([label, value]) => (
          <div className="studio-stat" key={label}>
            <span>{label}</span>
            <b>{String(value).padStart(2, '0')}</b>
          </div>
        ))}
      </div>
      <div className="editor-panel overview-panel">
        <span className="section-kicker">YOUR NEXT CHAPTER</span>
        <h2>
          Keep it personal.
          <br />
          Keep it current.
        </h2>
        <p>
          Profile and experience tell your story. Projects show the work. Skills organize your toolkit. Icons
          manages themed marks and ChatGPT prompts. Appearance sets the atmosphere. Preview displays your
          current edits immediately; Save draft keeps them private, and Publish puts them on the portfolio.
        </p>
        <div className="overview-actions">
          <button className="solid-button" onClick={onEditProfile}>
            Edit profile <ArrowUpRight size={17} />
          </button>
          <button className="outline-button" onClick={onPreview}>
            Preview current edits <Eye size={16} />
          </button>
        </div>
      </div>
      <div className="editor-panel">
        <h3>Draft & publishing</h3>
        <p className="studio-info">
          {dirty
            ? 'You have edits that have not been saved yet.'
            : hasUnpublished
              ? 'Your draft is saved and ready to publish.'
              : 'Your saved content matches the published portfolio.'}
        </p>
        <button className="text-button" onClick={onBackup}>
          Download a content backup <Download size={14} />
        </button>
      </div>
    </>
  );
}
