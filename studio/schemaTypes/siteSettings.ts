import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  type: 'document',
  title: 'Site settings',
  description: 'Chrome shared by every page.',
  fields: [
    defineField({
      name: 'siteTitle',
      type: 'string',
      title: 'Browser title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'metaDescription',
      type: 'text',
      title: 'Fallback meta description',
      rows: 2,
    }),
    defineField({
      name: 'prompt',
      type: 'string',
      title: 'Shell prompt',
      description: 'Shown before each command, e.g. "magnus@mhillestad.com:~$".',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: 'siteTitle' },
  },
});
