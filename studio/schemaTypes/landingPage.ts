import { defineField, defineType } from 'sanity';
import { terminalBody } from './terminalBody';

export const landingPage = defineType({
  name: 'landingPage',
  type: 'document',
  title: 'Landing page',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      description: 'The path this page is served at, e.g. "talks" for /talks.',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'metaDescription',
      type: 'text',
      title: 'Meta description',
      rows: 2,
    }),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Body',
      of: terminalBody,
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'slug.current' },
  },
});
