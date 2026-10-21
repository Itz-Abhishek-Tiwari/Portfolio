import type { Metadata } from 'next';
import { readContent } from '@/lib/server/content-store';
import VisitorModeProvider from '@/components/site/visitor-mode';
import MusicWidget from '@/components/music/music-widget';
import { hasMusic } from '@/lib/music';
import './globals.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Abhishek Tiwari — Portfolio & Journal',
  description:
    'Portfolio and journal of Abhishek Tiwari, a React Native developer who also writes about Linux and tooling.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    title: 'Abhishek Tiwari — Portfolio & Journal',
    description: 'React Native developer building polished mobile apps, and writing about Linux and tooling.',
    images: ['/assets/abhishek.jpg']
  },
  twitter: { card: 'summary_large_image' }
};
const fonts =
  'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap';
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { content } = await readContent();
  return (
    // The theme also goes on the root so the page behind .site (overscroll, the mode ripple) matches it.
    <html
      lang="en"
      className={'theme-' + content.theme + ' mode-' + content.colorMode}
      data-color-mode={content.colorMode}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={fonts} />
        {/* Without JS the hero entrance never runs, so show what site.css pre-hides for it. */}
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              '<style>.portfolio-content[data-motion] .hero-title .word { transform: none !important; } .portfolio-content[data-motion] :is(.hero-meta, .hero-foot) { opacity: 1 !important; }</style>'
          }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: content.name,
              jobTitle: content.role,
              email: `mailto:${content.email}`,
              sameAs: [content.linkedin, content.github].filter(Boolean)
            }).replace(/</g, '\\u003c')
          }}
        />
        <VisitorModeProvider defaultMode={content.colorMode} theme={content.theme}>
          {children}
          {hasMusic(content.music) && <MusicWidget music={content.music} theme={content.theme} />}
        </VisitorModeProvider>
      </body>
    </html>
  );
}
