import { defineField, defineType } from 'sanity';

// A podcast worth listening to, printed by the `podcasts` command. Like books
// and blog entries, these are not dragged into order — the listing sorts them
// by title, so adding one is a single act with no arranging afterwards.
export const podcast = defineType({
  name: 'podcast',
  type: 'document',
  title: 'Podcast',
  description: 'A podcast on the list. Sorted by title, so there is nothing to drag.',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'host',
      type: 'string',
      title: 'Host',
      description: 'Who presents it. Shown after the title.',
    }),
    defineField({
      name: 'url',
      type: 'url',
      title: 'URL',
      description: 'Optional. When set, the title links here.',
    }),
    defineField({
      name: 'note',
      type: 'string',
      title: 'Note',
      description: 'Optional one-liner on why it is worth listening to.',
    }),
  ],
  orderings: [
    {
      name: 'titleAsc',
      title: 'By title',
      by: [{ field: 'title', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'title', host: 'host', note: 'note' },
    prepare: ({ title, host, note }) => ({
      title,
      subtitle: [host, note].filter(Boolean).join(' · '),
    }),
  },
});
