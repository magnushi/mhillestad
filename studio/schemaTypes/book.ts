import { defineField, defineType } from 'sanity';

// A book on the reading list, printed by the `books` command. Like entries,
// these are not dragged into order — the listing sorts them by author.
export const book = defineType({
  name: 'book',
  type: 'document',
  title: 'Book',
  description: 'A book on the reading list. Listed by author, so there is nothing to drag.',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      type: 'string',
      title: 'Author',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      type: 'number',
      title: 'Year',
      description: 'Year of publication. Optional, and shown after the author.',
      validation: (Rule) => Rule.integer().min(0).max(2200),
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
      description: 'Optional one-liner on why it is worth reading.',
    }),
  ],
  orderings: [
    {
      name: 'authorAsc',
      title: 'By author',
      by: [
        { field: 'author', direction: 'asc' },
        { field: 'title', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'title', author: 'author', year: 'year' },
    prepare: ({ title, author, year }) => ({
      title,
      subtitle: [author, year].filter(Boolean).join(' · '),
    }),
  },
});
