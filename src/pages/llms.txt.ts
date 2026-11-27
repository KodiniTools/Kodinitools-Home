import type { APIRoute } from 'astro';
import { articleUrl, getArticles } from '../content/blog';
import { getContent, getHiddenCards } from '../content/content';
import { buildLlmsTxt, toolUrlFor, type LlmsLink, type LlmsSection } from '../content/llmsTxt';
import { ABOUT_PATH } from '../i18n/about';
import { DONATE_PATH } from '../i18n/donate';
import { FAQ_PATH } from '../i18n/faq';
import { IMPRINT_PATH } from '../i18n/imprint';
import { HOME_PATH, SITE, type Lang } from '../i18n/lang';
import { BLOG_INDEX_PATH } from '../i18n/blog-index';

// /llms.txt: Übersicht für KI-Assistenten, beim Build aus Tool-Karten und Blog erzeugt
// (siehe src/content/llmsTxt.ts).

type ToolEntry = { title: string; description: string; link: string };
const SECTIONS = ['tools', 'imageTools', 'diverseTools'] as const;

function toolLinks(lang: Lang): LlmsLink[] {
  const page = (lang === 'de' ? getContent('de') : getContent('en')) as unknown as Record<
    string,
    Record<string, unknown>
  >;
  const hidden = getHiddenCards();
  return SECTIONS.flatMap((section) =>
    Object.entries(page[section] ?? {})
      .filter(
        (e): e is [string, ToolEntry] =>
          typeof e[1] === 'object' && e[1] !== null && 'title' in e[1] && 'link' in e[1],
      )
      .filter(([key]) => !hidden.has(`${section}.${key}`))
      .map(([, t]) => ({
        title: t.title,
        url: toolUrlFor(t.link, lang),
        description: t.description,
      })),
  );
}

async function blogLinks(lang: Lang): Promise<LlmsLink[]> {
  return (await getArticles(lang)).map((entry) => ({
    title: entry.data.card.title,
    url: articleUrl(entry),
    description: entry.data.card.description,
  }));
}

const PAGES: Record<Lang, { heading: string; links: LlmsLink[] }> = {
  de: {
    heading: 'Seiten (Deutsch)',
    links: [
      { title: 'Startseite', url: `${SITE}${HOME_PATH.de}` },
      { title: 'Blog', url: `${SITE}${BLOG_INDEX_PATH.de}` },
      { title: 'FAQ', url: `${SITE}${FAQ_PATH.de}` },
      { title: 'Über mich', url: `${SITE}${ABOUT_PATH.de}` },
      { title: 'Spenden', url: `${SITE}${DONATE_PATH.de}` },
      { title: 'Impressum', url: `${SITE}${IMPRINT_PATH.de}` },
    ],
  },
  en: {
    heading: 'Pages (English)',
    links: [
      { title: 'Home', url: `${SITE}${HOME_PATH.en}` },
      { title: 'Blog', url: `${SITE}${BLOG_INDEX_PATH.en}` },
      { title: 'FAQ', url: `${SITE}${FAQ_PATH.en}` },
      { title: 'About', url: `${SITE}${ABOUT_PATH.en}` },
      { title: 'Donate', url: `${SITE}${DONATE_PATH.en}` },
      { title: 'Legal notice', url: `${SITE}${IMPRINT_PATH.en}` },
    ],
  },
};

export const GET: APIRoute = async () => {
  const sections: LlmsSection[] = [
    PAGES.de,
    { heading: 'Tools (Deutsch)', links: toolLinks('de') },
    { heading: 'Blog (Deutsch)', links: await blogLinks('de') },
    PAGES.en,
    { heading: 'Tools (English)', links: toolLinks('en') },
    { heading: 'Blog (English)', links: await blogLinks('en') },
  ];
  const body = buildLlmsTxt({
    title: 'KodiniTools',
    summary:
      'Kostenlose Online-Tools für Audio, Bild, Video und Text – ohne Registrierung, ohne Werbung, Server in Deutschland. Free online tools for audio, images, video and text – no sign-up, no ads.',
    notes: [
      'Die meisten Tools arbeiten direkt im Browser; einzelne Funktionen nutzen unseren Server in Deutschland. Deutsch ist die Standardsprache, englische Tool-Seiten erreichen Sie mit ?lang=en.',
      'Most tools run directly in the browser; some features use our server in Germany. German is the default language; English tool pages are available with ?lang=en.',
    ],
    sections,
  });
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
