export type SiteVariant = 'industrial-revolutions' | 'ai-trends';

function env(name: string): string | undefined {
  return (import.meta.env[name] as string | undefined) ?? process.env[name] ?? undefined;
}

export const SITE_VARIANT: SiteVariant =
  env('SITE_VARIANT') === 'ai-trends' ? 'ai-trends' : 'industrial-revolutions';

export const SITE =
  SITE_VARIANT === 'ai-trends'
    ? {
        title: 'AI Trends & Development',
        description:
          'A knowledge-grounded conversation about how artificial intelligence is developing.',
        tagline: 'Signals, shifts, and evidence from the people building AI',
        placeholder: 'Ask about AI trends, models, infrastructure, or where the field is heading…',
        sourceSummary:
          'Built from 11 curated podcast, research, and industry sources, condensed into a Sanity Knowledge Base.',
        sourceTitle: 'AI Trends & Development',
      }
    : {
        title: 'Canal Mania and the Philosophers Stone',
        description:
          'A knowledge base of AI in the perspective of the industrial revolutions — in conversation with the Guide.',
        tagline: 'A knowledge base of AI in the perspective of the industrial revolutions',
        placeholder: 'Ask about AI and the industrial revolutions…',
        sourceSummary:
          'Built on 16 curated sources on the industrial revolutions and the AI revolution.',
        sourceTitle: 'Canal Mania and the Philosophers Stone',
      };
