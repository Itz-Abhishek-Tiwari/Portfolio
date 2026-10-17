import Link from 'next/link';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import type { Content } from '@/lib/content';
import ContactForm from './contact-form';

export default function Contact({ content: c }: { content: Content }) {
  return (
    <section id="contact" className="contact-section section-wrap" aria-labelledby="contact-heading">
      <span className="section-kicker">Contact</span>
      <h2 id="contact-heading" className="contact-title">
        <span className="line">
          <span>
            Let&apos;s <em>talk.</em>
          </span>
        </span>
      </h2>
      <div className="contact-layout">
        <div className="contact-introduction">
          <p>{c.availability}</p>
          <a href={'mailto:' + c.email} className="email-link">
            <span>{c.email}</span>
            <ArrowUpRight size={28} />
          </a>
          <div className="contact-socials">
            <a href={c.github} target="_blank" rel="noreferrer" className="text-link">
              GitHub <ExternalLink size={13} />
            </a>
            <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-link">
              LinkedIn <ExternalLink size={13} />
            </a>
            <Link href="/blog" className="text-link">
              Journal <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
