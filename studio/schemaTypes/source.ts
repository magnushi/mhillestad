import { defineField, defineType } from 'sanity';

export const source = defineType({
  name: 'source',
  type: 'document',
  title: 'Source',
  description: 'A work cited by the Industrial Revolutions knowledge base.',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({ name: 'author', type: 'string', title: 'Author or publisher' }),
    defineField({
      name: 'strand',
      type: 'string',
      title: 'Strand',
      description: 'Which of the two research strands this source belongs to.',
      options: {
        list: [
          { title: 'Industrial revolutions', value: 'industrial' },
          { title: 'AI revolution', value: 'ai' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'kind',
      type: 'string',
      title: 'Kind',
      options: {
        list: [
          { title: 'Book', value: 'book' },
          { title: 'Article or paper', value: 'article' },
          { title: 'Podcast', value: 'podcast' },
          { title: 'Reference work', value: 'reference' },
          { title: 'Archive', value: 'archive' },
        ],
      },
    }),
    defineField({ name: 'year', type: 'number', title: 'Year of publication' }),
    defineField({ name: 'url', type: 'url', title: 'URL' }),
    defineField({
      name: 'note',
      type: 'text',
      title: 'Note',
      description: 'Why this source is in the knowledge base, and what it contributes.',
      rows: 3,
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'author' },
  },
});
